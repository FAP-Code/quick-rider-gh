# 08 — Backend Architecture

This document defines the backend system architecture for FaithGPT™: how the API server is structured, how it persists and processes data, and the cross-cutting concerns that apply across every module. It is the implementation companion to §05 (Database Schema) and the foundation for §09 (API Architecture). The buildable scaffold described here lives at `/faithgpt-platform/backend`.

---

## 1. Architecture Style — Modular Monolith

FaithGPT's backend is a **modular monolith** built with **NestJS + TypeScript**, deployed as a single Node.js service (with horizontally-scaled replicas behind a load balancer) for MVP and Phase 2.

This is a deliberate choice over microservices at launch:

- **Single deployable unit** simplifies CI/CD, observability, and transaction management while the team and feature set are still evolving rapidly (per §01 PRD roadmap, MVP → v1.2 within 12 months).
- **Strict module boundaries** (one NestJS module per bounded context, see §2) mean the codebase is already partitioned along the seams that would become service boundaries — extraction is a deployment change, not a redesign.
- **Shared Prisma schema and database** keeps cross-module queries (e.g., a devotion's themes, a user's subscription tier for gating) cheap and transactionally consistent, which would be painful to coordinate across service boundaries this early.

### 1.1 Designed-for extraction: AI Gateway and Visual Studio

Two areas are explicitly identified as the **most resource-intensive and independently-scalable** parts of the system, and the module boundaries are drawn so they can be lifted out into standalone services without touching unrelated code:

- **AI Gateway** (`AIGatewayModule`) — every LLM call (devotions, Bible Study Assistant, prayers, sermons, scripture analysis) flows through this module. Token-bound LLM calls have highly variable latency (seconds) and cost, and their load scales with DAU and AI feature adoption independently of, say, Bible-reading traffic.
- **Visual Studio** (`VisualStudioModule` + the image-generation side of `AIGatewayModule`) — image generation is CPU/GPU-bound on the provider side, has the longest latency (P95 < 20s per §01 §7), and is the most likely candidate for a dedicated worker fleet with its own autoscaling profile and GPU-aware infrastructure.

Both modules are already designed as **internal services with their own queues** (via BullMQ, §4): the rest of the monolith calls them through an injected service interface and never reaches into a provider SDK directly. When load justifies it, each can be extracted into its own NestJS application that:

1. Keeps the same module code and DTOs (moved to a shared internal package).
2. Replaces the in-process service call with an HTTP/gRPC or BullMQ-queue-based call from the monolith.
3. Continues to write to the same `ai_usage_logs` / `image_generations` tables (or, post-extraction, via an event published back to the monolith).

No other module is expected to need extraction before Phase 3 — Bible content, user data, community, and journal workloads are read-heavy, cacheable, and scale linearly with simple horizontal replication.

---

## 2. Module Map

Each NestJS module corresponds to a bounded context and mirrors the table groups defined in §05 §3. All modules live under `backend/src/modules/<name>` per the naming convention in §00 §13.

| Module | Bounded context (§05 table group) | Responsibilities |
|---|---|---|
| `AuthModule` | Identity & Org (`auth_accounts`, `refresh_tokens`) | Registration, login, OAuth (Google/Apple/Facebook), phone OTP, JWT issuance/refresh, password reset, email/phone verification |
| `UsersModule` | Identity & Org (`users`) | Profile CRUD, preferences (denomination lens, default Bible version, locale/timezone), account deletion, data export |
| `OrganizationsModule` | Identity & Org (`organizations`, `organization_members`) | Ministry org CRUD, seat management, member roles |
| `SubscriptionsModule` | Billing (`subscriptions`, `invoices`) | Tier state, billing provider webhooks (Stripe/Apple/Google), invoice history, feature-gating lookups |
| `BibleModule` | Bible Content (`bible_versions`, `bible_books`, `bible_verses`, `verse_texts`) | Version/book/chapter retrieval, full-text search, verse lookups |
| `ReadingPlansModule` | Reading Plans (`reading_plans`, `reading_plan_days`, `reading_plan_passages`, `user_reading_plans`) | Plan library, enrollment, progress tracking |
| (User Bible Interaction) | `highlights`, `notes`, `bookmarks`, `verse_history` | Folded into `BibleModule` as sub-resources (highlights/notes/bookmarks/history controllers) since they're thin CRUD over `BibleVerse` |
| `DevotionsModule` | Devotion Engine (`devotions`, `devotion_themes`, `devotion_templates`) — **AI Verse-to-Devotion Engine™** | Scripture Analysis integration, devotion generation (streamed), "My Devotions" library, devotion templates (admin-managed) |
| `AIStudyModule` | Bible Study Assistant (`ai_conversations`, `ai_messages`) — **AI Bible Study Assistant™** | Conversational Q&A, question categories, citation formatting |
| `PrayersModule` | Prayer Generator (`prayers`) — **AI Prayer Generator** | Prayer generation by type/source, "My Prayers" library |
| `SermonsModule` | Sermon Studio (`sermons`) — **AI Sermon Assistant** | Sermon/lesson generation, outline structure, export |
| `VisualStudioModule` | Visual Studio (`image_generations`, `bible_story_visualizations`, `storyboard_frames`, `memory_verse_cards`) — **AI Scripture Image Generator™ / AI Bible Story Visualizer™ / Memory Verse Visualizer™ / Christian Content Creator™** | Image generation job orchestration, story visualizations, memory verse cards, "My Images" |
| `JournalModule` | Journal (`journal_entries`, `prayer_requests`) | Unified journal CRUD, answered-prayer tracking |
| `GrowthModule` | Growth (`user_streaks`, `spiritual_stats`, `achievements`, `user_achievements`) — **Spiritual Growth Dashboard™** | Streak updates, stat aggregation, achievement evaluation |
| `CommunityModule` | Community (`groups`, `group_memberships`, `community_posts`, `post_comments`, `post_likes`, `follows`) | Feed, groups, prayer wall, follows, moderation hooks |
| `NotificationsModule` | Notifications (`notifications`) | In-app notification CRUD, push dispatch integration |
| `AdminModule` | Cross-cutting (AI Ops & Moderation: `ai_usage_logs`, `content_moderation_flags`, plus read access into other modules) | Admin Portal API surface — user/org management, AI usage analytics, moderation queues |
| `AIGatewayModule` | Cross-cutting — provider abstraction | Shared by `DevotionsModule`, `AIStudyModule`, `PrayersModule`, `SermonsModule`, `VisualStudioModule` |
| `BibleModule` (Cross-Reference Engine) | `cross_references`, `themes`, `scripture_theme_tags`, `scripture_element_tags`, `scripture_analysis_cache` | Scripture Analysis Engine, Theme Discovery, cross-reference lookups — exposed via `BibleModule` and consumed by `DevotionsModule` |

### 2.1 The `AIGatewayModule`

`AIGatewayModule` is **a provider-agnostic abstraction over the LLM and image-generation providers** used by every AI-driven feature. It is described generically here because the detailed AI architecture (model selection, prompt templates, streaming protocol, cost accounting) is covered by the parallel §06 AI Architecture workstream — this document only fixes its position in the module graph and its consumption contract.

At a high level, `AIGatewayModule` exposes:

- `generateText(request)` — used by `DevotionsModule`, `AIStudyModule`, `PrayersModule`, `SermonsModule`, and the Scripture Analysis Engine (in `BibleModule`) for all LLM completions, with both streamed and non-streamed modes.
- `generateImage(request)` — used by `VisualStudioModule` for all diffusion-model image generation.

Internally it selects among configured providers (e.g., an Anthropic provider for text, a hosted diffusion provider for images — see `backend/src/modules/ai-gateway/providers/`), applies retry/fallback policy, and writes a corresponding `AIUsageLog` row (tokens, cost in `costUsdMicros`, latency, status) for every call, regardless of caller. Consuming modules never import a provider SDK directly — they depend only on `AIGatewayService`'s interface, which is what makes the Phase-3 extraction in §1.1 a non-breaking change for callers.

---

## 3. Persistence

### 3.1 PostgreSQL via Prisma

The system of record is **PostgreSQL 16**, accessed exclusively through **Prisma ORM**. The canonical schema design lives at `/faithgpt-platform/schema/schema.prisma` (documented in §05) — this is the **design source of truth**. The buildable copy at `backend/prisma/schema.prisma` is kept identical to it so that `prisma generate` and `prisma migrate` work from the `backend/` project root; any schema change is made in `/faithgpt-platform/schema/schema.prisma` first, then synced to `backend/prisma/schema.prisma`.

`PrismaService` (in `backend/src/prisma/`) wraps `PrismaClient` as an injectable, app-scoped provider via `PrismaModule`, with lifecycle hooks (`onModuleInit` connects, `onModuleDestroy` disconnects) so every module accesses the database through a single shared client and connection pool.

### 3.2 Redis

Redis serves two distinct roles:

1. **Caching** — a fast mirror in front of `ScriptureAnalysisCache` (so repeated requests for a popular `passageKey` avoid both a Postgres round trip and, more importantly, a redundant AI Gateway call), plus session/rate-limit counters used by `@nestjs/throttler` and the per-tier AI usage quotas described in §04 (e.g., "5 Bible Study questions/day" for `FREE`).
2. **BullMQ backing store** — Redis is the durable queue storage for all background jobs (§4).

### 3.3 Object Storage

Generated images (`ImageGeneration.resultUrl`/`thumbnailUrl`), exported PDFs (devotion/sermon/journal exports), and other binary artifacts are stored in **S3-compatible object storage**, served to clients through a **CDN**. The backend never streams binary content itself — it generates pre-signed upload/download URLs and stores the resulting CDN URL on the relevant row (`ImageGeneration.resultUrl`, etc.).

---

## 4. Background Jobs (BullMQ + Redis)

All asynchronous and scheduled work runs through **BullMQ** queues backed by Redis, wired via `@nestjs/bullmq`. Each queue maps to a clear job type:

| Queue | Producer | Job | Notes |
|---|---|---|---|
| `image-generation` | `VisualStudioModule` | Run a diffusion model call for an `ImageGeneration` row, update `status`/`resultUrl`/`moderationStatus` | Long-running (up to ~20s P95); client polls or receives a push/notification on completion |
| `ai-generation` | `DevotionsModule`, `AIStudyModule`, `PrayersModule`, `SermonsModule` | Non-streaming AI generation for clients that can't hold an SSE connection (e.g., background "regenerate" requests, batch content prep) | Streamed generation (§09) bypasses this queue and calls `AIGatewayModule` directly from the request handler |
| `streak-expiry` | Scheduled (cron) | Nightly job that walks `user_streaks` and resets `currentStreak` to 0 where `lastActivityDate` is more than 1 day stale | Feeds `SpiritualStat`/`UserStreak` per §05 §4.5 |
| `bible-translation-sync` | Scheduled (cron) | Periodically syncs licensed translations (ESV/NIV/NLT) from upstream Bible content providers into `bible_versions`/`verse_texts` | Per §01 §9 licensing constraints |
| `notification-campaigns` | `AdminModule` / Scheduled | Sends scheduled push/in-app notification campaigns (`NotificationsModule`), fan-out per-user `Notification` row creation + push dispatch | Used by Admin Portal "Notification Center" (§02 §2) |
| `ai-usage-log-archival` | Scheduled (monthly) | Archives `ai_usage_logs` rows older than 24 months to cold storage (S3 Glacier) per §05 §6 retention policy, after writing aggregated monthly summaries | Keeps the hot table bounded for AI Analytics queries |

Each queue has a dedicated NestJS processor class (`@Processor()`); job producers call `queue.add(...)` from the relevant module's service. Failed jobs use BullMQ's built-in retry/backoff; permanently failed image generations transition `ImageGeneration.status` to `FAILED` so the client can show a retry CTA.

---

## 5. Cross-Cutting Concerns

### 5.1 Validation

All inbound DTOs are `class-validator`-decorated classes, enforced by a **global `ValidationPipe`** registered in `main.ts` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`). This guarantees that every controller receives strongly-typed, validated input before it reaches a service — no manual validation in services.

### 5.2 Error Handling

A **global exception filter** (`HttpExceptionFilter`, in `backend/src/common/filters/`) catches all thrown exceptions (`HttpException`, Prisma errors, and unhandled errors) and normalizes them into the **standard error envelope** defined in §09:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { } } }
```

The filter maps Prisma error codes (e.g., `P2002` unique constraint → `409 RESOURCE_CONFLICT`, `P2025` not found → `404 NOT_FOUND`) to the same envelope so API consumers never see raw ORM errors. The error code taxonomy is owned jointly by this document and §09 — §09 is the canonical table of codes.

### 5.3 Response Envelope

A **global interceptor** (`ResponseInterceptor`, in `backend/src/common/interceptors/`) wraps every successful response body in `{ data, meta }` per §09, so controllers can return plain DTOs/entities and the envelope is applied uniformly. Pagination metadata (cursor/offset, `hasMore`, `total`) is attached to `meta` by services that return paginated results.

### 5.4 Logging & Tracing

- **Structured logging** via `pino` (through `nestjs-pino`), emitting JSON logs with a `requestId` on every line.
- **Request correlation IDs**: an `X-Request-Id` header is read or generated per request (middleware, early in the chain) and attached to the logger context, the response headers, and propagated to any outbound AI Gateway / provider calls so a single user action can be traced end-to-end.
- **OpenTelemetry tracing**: the API process is instrumented with the OpenTelemetry Node SDK, auto-instrumenting HTTP, Prisma, and Redis/BullMQ calls, exporting traces to the observability backend. AI Gateway spans include provider name, model, and `AIUsageLog.id` as span attributes so slow AI calls are visible alongside their cost.

### 5.5 Rate Limiting

`@nestjs/throttler` provides a global, Redis-backed rate limiter applied to all routes, with **per-route overrides** for AI-generation endpoints (`devotions/generate`, `ai-conversations/*/messages`, `prayers/generate`, `sermons/generate`, `images/generate`) that enforce the tier-based daily/monthly quotas from §04 (e.g., Free tier: 5 Bible Study questions/day, 5 prayers/day, 5 images/month). Throttler limits are surfaced to clients via the `X-RateLimit-*` headers described in §09.

### 5.6 Security Headers & CORS

Standard hardening middleware (`helmet`) is applied globally; CORS is restricted to the known mobile app origins, `admin.faithgpt.app`, and `faithgpt.app`.

---

## 6. Multi-Tenancy for Ministry Organizations

`MINISTRY` tier subscriptions belong to an `Organization` (not a `User`) per §05 §4 (`Subscription.organizationId`), with members linked via `OrganizationMember`. Several resources (group reading plans, org-level analytics, branded content in `VisualStudioModule`'s Content Creator) are scoped to an organization, and must never leak across orgs.

Multi-tenancy is enforced with a **guard + Prisma middleware pattern**:

1. **`OrganizationContextGuard`** (applied to org-scoped routes, e.g., under `/api/v1/organizations/:organizationId/...`) resolves the authenticated user's `OrganizationMember` row for the `:organizationId` path param, verifies membership and role (`ADMIN`/`STAFF`), and attaches `request.organizationId` to the request context. Requests for an org the user doesn't belong to receive `403 FORBIDDEN` before any service code runs.
2. **Prisma middleware** (`$use` / Prisma Client extension) on models with an `organizationId`-derivable scope (e.g., org-owned `Group`, org-managed `ReadingPlan` rollouts, `OrganizationMember`) injects a `where: { organizationId }` filter sourced from the request context (via `nestjs-cls` / `AsyncLocalStorage`-backed request-scoped context) on every read, and validates `organizationId` is set on every write. This is a defense-in-depth layer: even if a controller forgets to filter explicitly, cross-tenant reads/writes are blocked at the data-access layer.

For individual users (the overwhelming majority of traffic), `organizationId` is simply absent/null and these checks are bypassed entirely — multi-tenancy adds no overhead to the core consumer experience.

---

## 7. Deployment Topology (Summary)

- **API service** (this NestJS app): stateless, horizontally scaled behind a load balancer; connects to Postgres (primary + read replica for analytics-heavy Admin queries as load grows) and Redis.
- **Worker processes**: the same codebase run in "worker mode" (BullMQ processors only, no HTTP listener) for `image-generation` and `ai-generation` queues — scaled independently of the API tier, anticipating the Phase-3 extraction discussed in §1.1.
- **Scheduler**: a single replica runs cron-triggered queue producers (`streak-expiry`, `bible-translation-sync`, `notification-campaigns`, `ai-usage-log-archival`) to avoid duplicate scheduling.
- **Admin Portal** (Next.js, per §01 §9) calls the same API under `/api/v1/admin/*`, gated by `ADMIN`/`SUPER_ADMIN`/`SUPPORT`/`MODERATOR`/`CONTENT_EDITOR` roles (§00 §3).
