# FaithGPT™

**Tagline:** "Transforming Scripture into Daily Living"
**Founder:** Frank Adu Poku

FaithGPT is an AI-powered Christian Bible study, devotion, prayer, and
sermon-preparation platform. This directory is the complete product
design and engineering scaffold for the platform: product/architecture
documentation, a database schema, an OpenAPI contract, a Flutter mobile
app skeleton, and a NestJS backend API skeleton — all cross-referenced so
that the mobile app, backend, and database agree on the same shapes,
enums, and conventions.

## Repository layout

| Path | Description |
| --- | --- |
| [`docs/`](docs) | 21 design documents (00–20) — product requirements, architecture, schema, UI/UX, and feature designs. The canonical source of truth for everything else in this directory. |
| [`schema/schema.prisma`](schema/schema.prisma) | PostgreSQL schema (Prisma), described in [`docs/05-database-schema.md`](docs/05-database-schema.md). Also copied to [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) where the Prisma CLI expects it. |
| [`api/openapi.yaml`](api/openapi.yaml) | OpenAPI 3 contract for the REST API, described in [`docs/09-api-architecture.md`](docs/09-api-architecture.md). |
| [`mobile/`](mobile) | Flutter app skeleton (`faithgpt`) — Riverpod, go_router, Drift, Dio. See [`docs/14-flutter-project-structure.md`](docs/14-flutter-project-structure.md). |
| [`backend/`](backend) | NestJS API skeleton (`faithgpt-api`) — modular monolith over Prisma/PostgreSQL. See [`docs/08-backend-architecture.md`](docs/08-backend-architecture.md). |

## Documentation index

| # | Document | Summary |
| --- | --- | --- |
| 00 | [Shared Reference & Glossary](docs/00-shared-reference.md) | Canonical naming, taxonomy, enums, subscription tiers, and conventions used by every other document. |
| 01 | [Product Requirements (PRD)](docs/01-product-requirements.md) | Product vision, personas, feature list, AI safety & biblical-integrity rules. |
| 02 | [Information Architecture](docs/02-information-architecture.md) | Navigation structure of the mobile app and Admin Portal, and the content taxonomy. |
| 03 | [User Journeys](docs/03-user-journeys.md) | End-to-end flows per persona: trigger → steps → screens → data created. |
| 04 | [Feature Breakdown](docs/04-feature-breakdown.md) | Feature matrix by module, subscription tier, and platform. |
| 05 | [Database Schema](docs/05-database-schema.md) | Explains `schema/schema.prisma` — entities, relations, and design decisions. |
| 06 | [AI Architecture](docs/06-ai-architecture.md) | AI Gateway / Image Gateway abstractions, model routing, RAG layer, caching, safety enforcement. |
| 07 | [Mobile Architecture](docs/07-mobile-architecture.md) | Flutter app architecture — state management, navigation, offline storage. |
| 08 | [Backend Architecture](docs/08-backend-architecture.md) | API server structure, persistence, and cross-cutting concerns; companion to `backend/`. |
| 09 | [API Architecture](docs/09-api-architecture.md) | REST conventions — versioning, envelopes, pagination, auth, streaming, rate limiting; companion to `api/openapi.yaml`. |
| 10 | [Authentication System](docs/10-authentication-system.md) | Auth methods, JWT access/refresh tokens, RBAC role matrix. |
| 11 | [Subscription System](docs/11-subscription-system.md) | Tier pricing, entitlements, and billing integrations. |
| 12 | [Security Framework](docs/12-security-framework.md) | Data protection, rate limiting, abuse detection, and compliance. |
| 13 | [Cloud Infrastructure](docs/13-cloud-infrastructure.md) | AWS (or GCP) deployment topology for the backend, database, cache, and storage. |
| 14 | [Flutter Project Structure](docs/14-flutter-project-structure.md) | Canonical project tree for `mobile/`, implemented by the scaffold. |
| 15 | [UI/UX Specifications](docs/15-ui-ux-specifications.md) | Design system — colors, typography, spacing, components, motion, accessibility. |
| 16 | [Screen Designs](docs/16-screen-designs.md) | Figma-fidelity specs for each mobile screen: purpose, layout, components, states. |
| 17 | [Admin Portal Design](docs/17-admin-portal-design.md) | Design for the Next.js Admin Portal (`admin.faithgpt.app`). |
| 18 | [AI Devotion Engine Design](docs/18-ai-devotion-engine.md) | The AI Verse-to-Devotion Engine™ — 13 devotion types, 6 depth levels, generation pipeline. |
| 19 | [AI Scripture Image Generator Design](docs/19-ai-image-generator.md) | AI Scripture Image Generator™, Bible Story Visualizer™, Memory Verse Visualizer™, Devotion Image Generator™. |
| 20 | [Growth & Monetization Strategy](docs/20-growth-monetization.md) | Acquisition, retention, and monetization strategy. |

## Mobile app (`mobile/`)

Flutter app `faithgpt` (Dart SDK `>=3.3.0 <4.0.0`), structured per
[`docs/14-flutter-project-structure.md`](docs/14-flutter-project-structure.md):

- **State management:** Riverpod (`@riverpod` code generation)
- **Navigation:** go_router with a 5-tab `StatefulShellRoute` (Home, Bible,
  Studio, Community, Journal)
- **Offline storage:** Drift (SQLite)
- **Networking:** Dio (REST) + SSE streaming for AI generation
- **Models:** Freezed (immutable data classes + JSON serialization)

Design tokens live in [`mobile/lib/core/theme/app_colors.dart`](mobile/lib/core/theme/app_colors.dart),
matching [`docs/00-shared-reference.md`](docs/00-shared-reference.md) §2 and
[`docs/15-ui-ux-specifications.md`](docs/15-ui-ux-specifications.md).

### Getting started

```bash
cd mobile
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs  # generates *.g.dart / *.freezed.dart
flutter run
```

> This scaffold does not include the platform runner directories
> (`android/`, `ios/`, etc.) or asset binaries — run `flutter create .` to
> generate platform scaffolding before `flutter run` on a device/emulator.

## Backend (`backend/`)

NestJS API `faithgpt-api` — a modular monolith over PostgreSQL (Prisma) and
Redis, structured per [`docs/08-backend-architecture.md`](docs/08-backend-architecture.md):

- **Modules:** Auth, Users, Bible, Devotions, AI Study, Prayers, Sermons,
  Visual Studio, Journal, Reading Plans, Community, Growth, Subscriptions,
  Notifications, Organizations, Admin, AI Gateway, Prisma, Health
- **Auth:** JWT access (15 min) + refresh (30 days, rotated) tokens, RBAC
  via `@Roles()`, subscription-tier gating via `@TierRequired()`
- **Conventions:** global `api/v1` prefix (excluding `/health`),
  `{ data, meta }` / `{ error: { code, message, details } }` response
  envelopes, `helmet` + CORS, `nestjs-pino` structured logging, Swagger UI
  at `/api/docs`

### Getting started

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, AI provider keys, etc.
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`, Swagger docs
at `http://localhost:3000/api/docs`, and the liveness probe at
`http://localhost:3000/health`.

## Status

This is a complete design + scaffold deliverable: all 20 design documents,
the Prisma schema, the OpenAPI contract, and buildable (but not yet
feature-complete) mobile and backend skeletons with the core navigation,
auth flow, and module structure wired up. Business-logic implementations
inside individual services are largely stubs to be filled in against the
specs in `docs/`.
