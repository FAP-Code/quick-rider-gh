# 09 — API Architecture

This document defines the conventions for FaithGPT's REST API: versioning and routing, response/error shapes, pagination, authentication, streaming, rate limiting, and webhooks. It is the contract companion to §08 (Backend Architecture) and the narrative counterpart to the machine-readable spec at [`/faithgpt-platform/api/openapi.yaml`](../api/openapi.yaml), which is the **canonical reference snapshot** of every endpoint, schema, and enum described here.

---

## 1. Versioning & Routing

All endpoints are served under a single version prefix:

```
https://api.faithgpt.app/api/v1/...
```

Conventions (per §00 §13):

- **Prefix**: `/api/v1` for all resources. A future `/api/v2` may be introduced for breaking changes; `/v1` is supported for at least 12 months after `/v2` ships.
- **Resource paths**: kebab-case, plural nouns for collections (`/api/v1/reading-plans`, `/api/v1/journal-entries`, `/api/v1/ai-conversations`).
- **Nesting**: sub-resources are nested at most two levels deep (`/api/v1/ai-conversations/{id}/messages`, `/api/v1/reading-plans/{id}/enroll`).
- **Actions that aren't pure CRUD** (generation, enrollment, etc.) are modeled as `POST` to a noun or noun-phrase sub-path rather than verbs in the resource name — e.g. `POST /api/v1/devotions/generate`, `POST /api/v1/reading-plans/{id}/enroll`, not `/api/v1/generate-devotion`.
- **IDs** in path params are opaque `cuid()` strings (per `schema.prisma`), referenced as `{id}`, `{userId}`, `{conversationId}`, etc.

---

## 2. Response Envelope

Every successful response (`2xx`) is wrapped in a standard envelope by the global `ResponseInterceptor` (§08 §5.3):

```json
{
  "data": { },
  "meta": { }
}
```

- **`data`** — the resource(s) requested: an object for single-resource responses, an array for collections.
- **`meta`** — optional metadata: pagination info (§3), request timing, or feature-specific context (e.g., `meta.cacheHit` for `/scripture-analysis`). Omitted keys default to absent, not `null`.

Example — single resource:

```json
{
  "data": {
    "id": "clx1devotion0001",
    "title": "Finding Purpose in Suffering",
    "type": "PERSONAL",
    "depth": "STANDARD"
  },
  "meta": {}
}
```

Example — collection with pagination:

```json
{
  "data": [
    { "id": "clx1devotion0001", "title": "Finding Purpose in Suffering" },
    { "id": "clx1devotion0002", "title": "Walking by Faith, Not by Sight" }
  ],
  "meta": {
    "pagination": {
      "nextCursor": "clx1devotion0002",
      "hasMore": true
    }
  }
}
```

---

## 3. Error Envelope

All error responses (`4xx`/`5xx`) use a standard shape produced by the global `HttpExceptionFilter` (§08 §5.2):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email must be a valid email address",
    "details": {
      "field": "email"
    }
  }
}
```

- **`code`** — a stable, machine-readable string from the table below. Clients should branch on `code`, never on `message`.
- **`message`** — human-readable, safe to display or log; not guaranteed to be stable across releases.
- **`details`** — optional structured context (field-level validation errors, conflicting resource IDs, provider error codes). May be `null`/absent.

### 3.1 Standard Error Codes

| HTTP status | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body/query/params failed DTO validation |
| 400 | `BAD_REQUEST` | Malformed request not covered by a more specific code |
| 401 | `UNAUTHENTICATED` | Missing, invalid, or expired access token |
| 401 | `INVALID_CREDENTIALS` | Login email/password/OTP did not match |
| 403 | `FORBIDDEN` | Authenticated but not authorized for this resource/action |
| 403 | `TENANT_MISMATCH` | Resource belongs to a different `organizationId` (§08 §6) |
| 404 | `NOT_FOUND` | Resource does not exist or is not visible to the caller |
| 409 | `RESOURCE_CONFLICT` | Unique constraint violation (e.g., email already registered) |
| 409 | `ALREADY_ENROLLED` | User already enrolled in this reading plan |
| 422 | `UNPROCESSABLE_CONTENT` | Semantically invalid input (e.g., invalid passage reference) |
| 429 | `RATE_LIMITED` | Request exceeded a rate limit or tier quota (§5) |
| 451 | `CONTENT_BLOCKED` | Request blocked by content-safety/moderation policy |
| 500 | `INTERNAL_ERROR` | Unhandled server error |
| 502 | `AI_PROVIDER_ERROR` | Upstream LLM/image-generation provider returned an error |
| 503 | `SERVICE_UNAVAILABLE` | Dependency (DB, Redis, AI Gateway) temporarily unavailable |

The Prisma error mapping in §08 §5.2 (`P2002` → `409 RESOURCE_CONFLICT`, `P2025` → `404 NOT_FOUND`, etc.) always resolves to one of the codes above — this table is the canonical taxonomy referenced from both documents.

---

## 4. Pagination

Two pagination styles are used depending on resource shape:

### 4.1 Cursor-based (feeds, logs, chronological libraries)

Used for endpoints backed by `(userId, createdAt)`-indexed or feed-like tables (§05 §5): `devotions`, `prayers`, `sermons`, `image_generations`, `journal_entries`, `notifications`, `ai_usage_logs`, `community_posts`, `ai_conversations`.

**Request:**

```
GET /api/v1/devotions?limit=20&cursor=clx1devotion0010
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | integer | 20 | Max 100 |
| `cursor` | string | — | Opaque ID of the last item from the previous page; omit for the first page |

**Response `meta`:**

```json
{
  "pagination": {
    "nextCursor": "clx1devotion0030",
    "hasMore": true
  }
}
```

`nextCursor` is `null` when `hasMore` is `false`.

### 4.2 Offset-based (small, bounded lists)

Used for small reference lists that are rarely deep-paginated: `bible/versions`, `reading-plans`, `growth/achievements`, admin list views.

**Request:**

```
GET /api/v1/reading-plans?page=2&pageSize=20
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | 1 | 1-indexed |
| `pageSize` | integer | 20 | Max 100 |

**Response `meta`:**

```json
{
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

---

## 5. Authentication

### 5.1 Access & Refresh Tokens

FaithGPT uses **Bearer JWT access tokens** for all authenticated requests:

```
Authorization: Bearer <accessToken>
```

- **Access tokens** are short-lived (15 minutes), signed with `JWT_SECRET`, and contain `sub` (user ID), `role` (`UserRole`), and `tier` (`SubscriptionTier`) claims so common authorization checks (role/tier gating) don't require a DB round trip.
- **Refresh tokens** are long-lived (30 days), opaque, stored hashed in `refresh_tokens` (per `schema.prisma`), and signed separately with `JWT_REFRESH_SECRET`. A refresh token is bound to a `deviceInfo` string and can be individually revoked (e.g., "log out of this device").
- `POST /api/v1/auth/refresh` exchanges a valid refresh token for a new access/refresh token pair (rotation — the old refresh token is revoked).
- `POST /api/v1/auth/logout` revokes the supplied refresh token (`revokedAt` set).

### 5.2 OAuth & Phone OTP

`AuthAccount.provider` (`PASSWORD`, `GOOGLE`, `APPLE`, `FACEBOOK`, `PHONE_OTP`) supports multiple identities per user. `POST /api/v1/auth/oauth/{provider}/callback` exchanges a provider-issued token/code for a FaithGPT session (creating the `User`/`AuthAccount` rows on first login). Phone OTP uses `verify-phone` with a short-lived code.

### 5.3 Mobile vs. Admin Clients

- **Mobile app (Flutter)**: uses the standard register/login/refresh flow above; tokens are stored in secure platform storage (Keychain/Keystore). Guest mode (`GUEST` role, §00 §3) accesses read-only Bible endpoints without a token.
- **Admin Portal (Next.js, `admin.faithgpt.app`)**: authenticates through the same `/api/v1/auth/login` endpoint, but only users whose `role` is one of `MODERATOR`, `CONTENT_EDITOR`, `SUPPORT`, `ADMIN`, `SUPER_ADMIN` (§00 §3) can obtain access tokens that pass the `RolesGuard` on `/api/v1/admin/*` routes (§08's `AdminModule`). Access tokens for admin roles carry the same JWT shape; authorization is enforced per-route via `@Roles(...)`.

### 5.4 Public/Unauthenticated Endpoints

`bearerAuth` is required globally **except**: `POST /api/v1/auth/register`, `/login`, `/refresh`, `/oauth/{provider}/callback`, `/verify-email`, `/verify-phone`, `/password-reset/*`, and the inbound billing webhooks under `/api/v1/subscriptions/webhooks/{provider}` (which instead verify a provider-specific signature header, §7). Selected `GET /api/v1/bible/*` endpoints also allow unauthenticated `GUEST` access per §00 §3, with tier-gated fields/quotas applied when a token is present.

---

## 6. Streaming (Server-Sent Events)

AI generation endpoints that produce long-form structured output stream their response as **`text/event-stream`** (Server-Sent Events) rather than waiting for the full generation to complete — this is the mechanism behind the "first section visible < 2s" UX goal in §01 §7 and is detailed fully in the §18 streaming design (a parallel workstream); this section fixes the contract at the API layer.

Affected endpoints: `POST /api/v1/devotions/generate`, `POST /api/v1/ai-conversations/{id}/messages` (assistant replies), `POST /api/v1/prayers/generate`, `POST /api/v1/sermons/generate`.

### 6.1 Protocol

- Clients that want a stream send `Accept: text/event-stream`. Clients that send `Accept: application/json` (or omit the header) receive the same generation as a single buffered JSON response wrapped in the standard `{ data, meta }` envelope once complete — the underlying `AIGatewayModule` call is identical; only the transport differs (§08 §2.1).
- The streamed response uses **named SSE events**, one per logical unit of output. For `devotions/generate`, each of the 15 canonical sections (§00 §8: `title`, `keyScripture`, `historicalContext`, ... `closingEncouragement`) is emitted as its own event as soon as it's generated:

```
event: section
data: {"section":"title","content":"Finding Purpose in Suffering"}

event: section
data: {"section":"keyScripture","content":"Romans 8:28 (ESV)..."}

...

event: done
data: {"devotionId":"clx1devotion0001"}
```

- A final `event: done` carries the persisted resource ID so the client can navigate to `GET /api/v1/devotions/{id}` for the complete record, or rely entirely on the streamed sections already received.
- Errors mid-stream are emitted as `event: error` with a payload matching the standard error envelope (§3), followed by stream closure; partial output already sent to the client is preserved client-side but the generation is not persisted as a `Devotion` row.

### 6.2 Why OpenAPI Doesn't Model This Directly

OpenAPI 3.0.3 has no first-class SSE media type. The spec at `/faithgpt-platform/api/openapi.yaml` documents these endpoints with `200` responses described via `description` text (referencing this section) and a representative non-streamed JSON schema for `Accept: application/json` clients — the SSE event shapes above are the source of truth for streaming clients.

---

## 7. Rate Limiting

### 7.1 Headers

Every response includes standard rate-limit headers, populated by the Redis-backed `@nestjs/throttler` (§08 §5.5):

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Max requests allowed in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp (seconds) when the window resets |

When a request is rejected for exceeding a limit, the response is `429` with `code: "RATE_LIMITED"` (§3) and a `Retry-After` header.

### 7.2 Tier-Based Quotas

Global per-IP/per-user limits protect infrastructure; **AI-generation endpoints** additionally enforce per-tier daily/monthly quotas from §04 Feature Breakdown, evaluated against `ai_usage_logs` (per §05 §5 indexing) and cached in Redis (§08 §3.2):

| Endpoint group | `FREE` | `PLUS` | `PREMIUM` |
|---|---|---|---|
| `POST /api/v1/ai-conversations/{id}/messages` | 5/day | 50/day | unlimited |
| `POST /api/v1/devotions/generate` (depth=`DEEP`) | 3/month | unlimited | unlimited |
| `POST /api/v1/devotions/generate` (depth=`ADVANCED`) | not available | 5/month | unlimited |
| `POST /api/v1/devotions/generate` (depth=`TEACHING`/`SERMON`) | not available | not available | unlimited |
| `POST /api/v1/prayers/generate` | 5/day | unlimited | unlimited |
| `POST /api/v1/images/generate` | 5/month | 50/month | unlimited |
| `POST /api/v1/sermons/generate` | not available | not available | unlimited |

These quotas are enforced by a per-route `ThrottlerGuard` override that reads `request.user.tier` (from the JWT, §5.1) and the relevant DTO field (e.g., `depth`, `style`) before invoking `AIGatewayModule`. Exceeding a tier quota returns `429 RATE_LIMITED` with `details.quota` describing the limit and reset time, distinct from the generic per-IP throttle.

---

## 8. Webhooks (Inbound)

`SubscriptionsModule` exposes provider-specific inbound webhook endpoints under a shared resource path, used to keep `Subscription.status`/`tier`/`currentPeriodEnd` in sync with billing providers (`BillingProvider` enum: `STRIPE`, `APPLE_IAP`, `GOOGLE_PLAY`, `PAYSTACK`, `MANUAL`):

```
POST /api/v1/subscriptions/webhooks/{provider}
```

| `{provider}` | Source | Notes |
|---|---|---|
| `stripe` | Stripe webhook events (`customer.subscription.*`, `invoice.*`) | Verified via `Stripe-Signature` header against a webhook signing secret |
| `apple` | Apple App Store Server Notifications V2 | Verified via signed JWS payload (Apple root certificate chain) |
| `google` | Google Play Real-Time Developer Notifications (RTDN) via Pub/Sub push | Verified via Pub/Sub OIDC token |

These endpoints are **unauthenticated with respect to `bearerAuth`** (no end-user session is available) but require a valid provider signature, verified inside `SubscriptionsModule` before any `Subscription` row is mutated. Detailed payload mapping and `Invoice` reconciliation logic are owned by the parallel §11 Subscription System workstream; this document only fixes the endpoint shape and security model so the OpenAPI spec (Part B) can describe it generically.

---

## 9. Endpoint Group Overview

The table below lists every top-level resource group, its owning module (§08 §2), and a brief description. Full request/response schemas are in [`/faithgpt-platform/api/openapi.yaml`](../api/openapi.yaml).

| Resource prefix | Module | Description |
|---|---|---|
| `/api/v1/auth` | `AuthModule` | Register, login, refresh, logout, OAuth callbacks, email/phone verification, password reset |
| `/api/v1/users/me` | `UsersModule` | Authenticated user's profile: get/update, delete account, export data |
| `/api/v1/organizations` | `OrganizationsModule` | Ministry org CRUD, seat management, member roles (multi-tenant, §08 §6) |
| `/api/v1/subscriptions` | `SubscriptionsModule` | Current subscription state, plan changes, invoice history, billing webhooks |
| `/api/v1/bible` | `BibleModule` | Bible versions, books, chapters, verses, full-text search |
| `/api/v1/highlights`, `/api/v1/notes`, `/api/v1/bookmarks` | `BibleModule` (sub-resources) | Per-verse user interactions (CRUD) |
| `/api/v1/reading-plans` | `ReadingPlansModule` | Plan library, enrollment, progress tracking |
| `/api/v1/scripture-analysis` | `BibleModule` (Scripture Analysis Engine) | Theme + biblical element detection for a passage, with cache (`ScriptureAnalysisCache`) |
| `/api/v1/devotions` | `DevotionsModule` | AI Verse-to-Devotion Engine™ — generate (streamed) + "My Devotions" library |
| `/api/v1/ai-conversations` | `AIStudyModule` | AI Bible Study Assistant™ — conversations and messages |
| `/api/v1/prayers` | `PrayersModule` | AI Prayer Generator — generate + "My Prayers" library |
| `/api/v1/sermons` | `SermonsModule` | AI Sermon Assistant — generate + "My Sermons" library |
| `/api/v1/images` | `VisualStudioModule` | AI Scripture Image Generator™ and related Visual Studio tools — generate (async job) + "My Images" |
| `/api/v1/journal-entries` | `JournalModule` | Unified spiritual journal CRUD |
| `/api/v1/growth` | `GrowthModule` | Spiritual Growth Dashboard™ — streaks, stats, achievements |
| `/api/v1/community` | `CommunityModule` | Feed/posts, comments, likes, follows |
| `/api/v1/groups` | `CommunityModule` | Bible study groups, memberships, group prayer wall |
| `/api/v1/prayer-requests` | `JournalModule` / `CommunityModule` | Prayer requests (private/group/public visibility) and answered-prayer tracking |
| `/api/v1/notifications` | `NotificationsModule` | In-app notification list, mark-as-read, preferences |
| `/api/v1/admin` | `AdminModule` | Admin Portal API surface — user/org management, AI usage analytics, moderation queues (role-gated) |

---

## 10. API Documentation Tooling

- **OpenAPI generation**: every controller and DTO is decorated with `@nestjs/swagger` decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`, etc.). The Nest app's `SwaggerModule` builds a live OpenAPI document from these decorators at boot.
- **Interactive docs**: served at `GET /api/docs` (Swagger UI), available in all non-production environments and behind admin auth in production.
- **Canonical reference snapshot**: [`/faithgpt-platform/api/openapi.yaml`](../api/openapi.yaml) is a hand-maintained OpenAPI 3.0.3 document that mirrors the live `@nestjs/swagger` output and serves as the stable, reviewable contract for client teams (mobile, admin) and this document. When controllers change, both the decorators and `api/openapi.yaml` are updated together; CI may later add a drift check between the generated spec and this snapshot.
- **Schema naming**: `components/schemas` in `api/openapi.yaml` mirror Prisma model names (`Devotion`, `Prayer`, `Sermon`, `ImageGeneration`, etc.) and reuse enum names verbatim from `schema.prisma` (`DevotionType`, `DevotionDepth`, `ImageStyle`, `ImageSourceType`, `PrayerType`, `AIQuestionCategory`, `SubscriptionTier`, etc.) per §00 §13.
