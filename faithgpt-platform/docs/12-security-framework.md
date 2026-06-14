# 12 — Security Framework

---

## 1. Data Protection

| Layer | Control |
|---|---|
| At rest | RDS PostgreSQL encryption (AES-256, AWS KMS-managed key); S3 server-side encryption (SSE-S3/SSE-KMS) for generated images/exports |
| In transit | TLS 1.3 everywhere (ALB → ECS, ECS → RDS/Redis via VPC, client → ALB) |
| Secrets | `passwordHash` (bcrypt/argon2, never logged); `refresh_tokens.tokenHash` (SHA-256 of token, not the raw token) |
| Backups | Encrypted RDS automated backups + PITR (§13) |

---

## 2. PII Classification

| Data | Classification | Handling |
|---|---|---|
| `email`, `phone`, `name`, `avatarUrl` | PII | Encrypted at rest (DB-level), excluded from analytics exports, included in "Download My Data" |
| `passwordHash` | Secret | Never returned by any API, never logged |
| Journal entries, prayers, devotions, conversations | Sensitive personal content (not PII per se, but spiritually/personally sensitive) | User-owned, deletable, never used for AI training without explicit opt-in |
| `denominationLens` | Sensitive preference | Treated like PII — affects content personalization, excluded from cross-user analytics aggregation below org level |
| `AIUsageLog`, `ai_messages` content | Mixed — content may reflect sensitive personal context | Retained per §05 §6 retention; access restricted to `ADMIN`/`SUPER_ADMIN` and aggregate-only for `MODERATOR` |

---

## 3. AI Content Moderation (Safety, distinct from Theological Accuracy)

This section covers **safety** moderation (hate speech, self-harm, harassment, sexual content, illegal activity) — separate from the **theological integrity** controls covered in §06/§18 (citation validation, Scripture/AI separation).

| Surface | Pre-generation filter | Post-generation filter |
|---|---|---|
| Devotions / Prayers / Sermons / AI Study | User input screened for abuse/self-harm signals (e.g., a "prayer request" describing self-harm triggers a crisis-resources response instead of normal generation) | Output screened before display; failures → regenerate once, then generic fallback content + `AIUsageLog.status=FAILED` |
| Community posts/comments | N/A (user-authored) | Auto-moderation classifier on write; `moderationStatus=FLAGGED` → `ContentModerationFlag`; auto-`REJECTED` for high-confidence severe violations |
| Image generation | Prompt pre-filter blocks disallowed requests (§19 §1) before reaching the diffusion model | Output NSFW/violence classifier sets `ImageGeneration.moderationStatus` (§19 §6) |

---

## 4. Rate Limiting & Abuse Prevention

- `@nestjs/throttler` global limits (per IP, per authenticated user) layered under the §11 entitlement-based quotas — throttler limits prevent *burst* abuse (e.g., 100 req/min/IP on auth endpoints); entitlement quotas prevent *cost* abuse (daily/monthly AI usage).
- CAPTCHA (hCaptcha) on: signup, password-reset request, and after 3 failed login attempts from one IP.
- Anomaly detection: a scheduled job flags users whose `AIUsageLog` rate exceeds a z-score threshold vs. their historical baseline → Admin AI Usage Monitoring alert (§17), with auto-throttle to FREE-tier limits pending review if cost-impact is severe.
- WAF (AWS WAF on the ALB, §13) provides baseline bot/DDoS mitigation ahead of application-level controls.

---

## 5. GDPR / CCPA Compliance

| Requirement | Implementation |
|---|---|
| Lawful basis | Consent (account creation ToS acceptance) + legitimate interest (core service delivery) |
| Right to access | Account → Privacy & Data → "Download My Data" → async job exports all user-owned rows (User, Devotions, Prayers, Sermons, Images metadata, Journal, Highlights/Notes/Bookmarks, Community posts) as a JSON bundle, emailed as a signed S3 download link (24h expiry) |
| Right to erasure | Account → "Delete Account" → 14-day soft-delete (account disabled, recoverable) → hard delete cascades per Prisma `onDelete: Cascade` relations (§05); generated images in S3 deleted via a cleanup job |
| Consent management | Notification preferences distinguish transactional (always on) vs. marketing (opt-in/out per `NotificationType`) |
| Data residency | US region at launch; EU region added when EU user volume warrants (architecture supports per-region RDS via §13's multi-environment Terraform modules) |
| Children's privacy (COPPA) | Children's devotion *content* (`DevotionType=CHILDREN`) is generated for parents/guardians, not directly collected from children — no accounts created for under-13s; this is a product policy enforced at signup age-gate |

---

## 6. Secrets Management

- All secrets (DB credentials, JWT signing keys, Anthropic/image API keys, Stripe/Paystack keys, Firebase service account) live in **AWS Secrets Manager**, injected into ECS tasks as environment variables at deploy time — never committed to the repo (`.env.example` documents required keys with placeholder values only, per §08 backend scaffold).
- Rotation: DB credentials and JWT signing keys rotated quarterly (automated via Secrets Manager rotation Lambdas); API keys rotated on provider-recommended schedule or on suspected compromise.

---

## 7. Dependency Security

- Dependabot (GitHub) enabled on `backend/`, `mobile/` (pub packages), and admin portal — auto-PRs for patch/minor updates, manual review for major.
- `npm audit` / `pnpm audit` and `flutter pub outdated --mode=null-safety` checks in CI; build fails on high/critical vulnerabilities without an accepted exception.

---

## 8. OWASP Top 10 — FaithGPT-Specific Mitigations

| OWASP Category | FaithGPT-specific risk | Mitigation |
|---|---|---|
| A01 Broken Access Control | Ministry org data leaking across organizations; users accessing others' Journals/Devotions | Prisma middleware enforcing `organizationId`/`userId` scoping on every query for org- and user-owned models; `RolesGuard` for Admin Portal |
| A02 Cryptographic Failures | Token/secret exposure | bcrypt/argon2 password hashing, hashed refresh tokens, TLS 1.3, KMS-managed encryption keys (§1) |
| A03 Injection | SQL injection; **prompt injection** via user-submitted text fed into AI Devotion/Study/Sermon prompts | Prisma parameterizes all queries; prompt templates use strict role separation (system instructions never concatenated with raw user text without delimiters) + output JSON-schema validation (§18) that rejects/flags responses that don't conform — a successful injection that alters output structure is caught before persistence |
| A04 Insecure Design | Unbounded AI cost from abusive usage | Entitlement quotas (§11) + rate limiting (§4) + anomaly detection by design, not bolted on |
| A05 Security Misconfiguration | Overly permissive CORS, debug endpoints in prod | Environment-specific config validated at boot (`@nestjs/config` schema validation fails fast); CORS allowlist per environment |
| A06 Vulnerable Components | Outdated deps with known CVEs | Dependabot + CI audit gate (§7) |
| A07 Identification & Auth Failures | Token replay, weak passwords | Refresh token rotation (§10), password strength + breach-list check, MFA for Admin (§10 §9) |
| A08 Software/Data Integrity Failures | Tampered AI-generated content presented as Scripture | Strict Scripture/AI visual separation (PRD §8) + citation validator (§06) |
| A09 Security Logging & Monitoring Failures | Undetected admin misuse (e.g., role escalation, mass refunds) | Immutable `AdminAuditLog` (§9 below) + Sentry/CloudWatch alerting on anomalous admin actions |
| A10 SSRF | Image provider result URLs fetched server-side before CDN upload | Allowlist of image-provider domains for the fetch-and-store step; no user-supplied URLs are ever fetched server-side |

Additional: **Stored XSS** in Community posts/comments — all user-generated rich text is sanitized on write (allowlist-based HTML sanitizer) and rendered via the mobile app's controlled rich-text renderer (no raw HTML/WebView rendering of user content).

---

## 9. Audit Logging

A dedicated, **immutable** `AdminAuditLog` table is recommended as a future schema addition (not yet in `schema.prisma` — flagged here for the next schema revision) capturing: `actorUserId`, `action` (e.g. `ROLE_CHANGED`, `SUBSCRIPTION_OVERRIDDEN`, `MODERATION_DECISION`, `DEVOTION_TEMPLATE_PUBLISHED`, `REFUND_ISSUED`), `targetType`/`targetId`, `before`/`after` JSON snapshots, `ipAddress`, `createdAt`. Write-only at the application layer (no update/delete endpoints); retained indefinitely for compliance. Surfaced in Admin Portal → Settings → Audit Log (§17), restricted to `SUPER_ADMIN` (read) and system-only (write).
