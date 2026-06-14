# 17 — Admin Portal Design

The Admin Portal (`admin.faithgpt.app`) is a Next.js application (Vercel-hosted, §13 §2) providing operational, financial, content, and moderation tooling for `MODERATOR`/`CONTENT_EDITOR`/`SUPPORT`/`ADMIN`/`SUPER_ADMIN` roles (§10 §5). This document specifies the design for each section in the navigation tree defined in §02 §2.

---

## 1. Tech Stack & Shell

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS, design tokens mirroring §15 §2-§4 (Inter only — no Fraunces; Scripture is never edited/displayed as a reading experience here) |
| Components | shadcn/ui (Radix-based): tables, dialogs, dropdowns, tabs, forms, toasts |
| Charts | Recharts — line/bar/area charts for trends, pie/donut for distribution |
| Data fetching | Server Components + `fetch` against `api.faithgpt.app/api/v1/admin/*` (§09), TanStack Query for client-side mutations/optimistic updates |
| Auth | Same JWT model as §10 §9 (separate login surface, MFA mandatory for `ADMIN`/`SUPER_ADMIN`) |
| Tables | TanStack Table — sortable, filterable, paginated server-side (per §09 pagination conventions) |

### 1.1 Shell Layout

- **Left sidebar** (persistent, collapsible): FaithGPT admin wordmark, nav groups matching §02 §2 sections, each with an icon; active section highlighted with `color.primary` left-border accent. Sidebar items are conditionally rendered based on the logged-in user's `role` (RBAC matrix, §10 §5) — e.g., `MODERATOR` sees only Content Moderation + Community Moderation.
- **Top bar**: breadcrumb (section > subsection), global search (users/orgs by email/name/ID), environment badge (`dev`/`staging`/`prod` — color-coded, prevents accidental prod actions from a staging session), admin avatar/menu (profile, MFA settings, logout).
- **Main content area**: max-width 1440px, 24px padding, white/`color.surfaceAlt` cards on a light gray page background (`#F4F5F7`).
- **Toast notifications**: bottom-right, used for action confirmations (e.g., "Role updated", "Refund issued") — every mutating action additionally writes to `AdminAuditLog` (§12 §9).

---

## 2. Dashboard (KPIs Overview)

**Access**: `ADMIN`, `SUPER_ADMIN` (full); `SUPPORT`/`MODERATOR`/`CONTENT_EDITOR` land on a role-scoped variant showing only their relevant queue counts.

**Layout**:
- Top row: 4 KPI cards (large number + trend arrow vs. prior period) — MAU, MRR, AI Cost (MTD), Active Subscriptions by tier (stacked mini-bar)
- Second row: two charts side-by-side — "User Growth" (line chart, daily signups + cumulative MAU, 30/90-day toggle) and "Revenue vs. AI Cost" (area chart, two series, overlapping — visually surfaces the §13 §5 margin story)
- Third row: "Operational Queues" card grid — Content Moderation queue depth, Image Moderation queue depth, AI error rate (24h), open support flags — each card links directly to its section, color-coded (red badge if above threshold)
- Fourth row: "Recent Admin Activity" — last 10 `AdminAuditLog` entries (actor, action, target, timestamp), "View full audit log" link (`SUPER_ADMIN` only)

---

## 3. User Management

### 3.1 Users

**Access**: `SUPPORT` (read-only + limited actions), `ADMIN`/`SUPER_ADMIN` (full).

**Layout**:
- Filter bar: search by email/name/ID, filter by role, subscription tier, status (active/suspended/soft-deleted), signup date range
- Table columns: Avatar, Name, Email, Role (`Badge`), Tier (`Badge`, gold for paid tiers), Status, Signup Date, Last Active, Actions (`...` menu)
- Row actions menu: View Profile, Resend Verification Email (all support+ roles), Change Role (`ADMIN`+, opens confirmation dialog — writes `AdminAuditLog.action=ROLE_CHANGED` with before/after snapshot), Suspend/Reactivate Account (`ADMIN`+), View Subscription Status (read-only for `SUPPORT`)
- **User Detail page** (click row): tabs — Profile (editable fields, denomination lens), Subscription (current `Subscription` row, `Invoice` history, "Issue Refund" button for `ADMIN`+ writing `AdminAuditLog.action=REFUND_ISSUED`), Activity (recent `AIUsageLog`/`Devotion`/`Prayer` counts — aggregate only, content excluded per §12 §2), Sessions (active `refresh_tokens`, force-logout action)

### 3.2 Organizations

**Access**: `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- Table: Org Name, Tier (`MINISTRY`), Seats (used/total), Billing Email, Created Date, Actions
- **Org Detail page**: org info form (name, `seatLimit`, billing email — editable, `PATCH /api/v1/admin/organizations/:id` per §11 §5), member list (`OrganizationMember` table with `roleInOrg`), seat usage chart, org-level usage analytics (devotions/images generated, top themes — aggregated per §11 §5), "Adjust Seats" action (triggers Stripe proration per §11 §5)

---

## 4. Subscription Management

### 4.1 Plans & Pricing

**Access**: `SUPER_ADMIN` (edit), `ADMIN` (view).

**Layout**: Card per tier (`FREE`/`PLUS`/`PREMIUM`/`MINISTRY`/`LIFETIME`) showing current pricing (monthly/annual), trial length, and the §11 §2 feature-gating matrix rendered as an editable grid (capability rows × tier columns) — edits here are config changes that propagate to `EntitlementService` (§11 §7), not schema changes; a confirmation dialog warns "This affects entitlement checks for all users immediately."

### 4.2 Active Subscriptions

**Layout**: Table — User/Org, Tier, Status (`ACTIVE`/`PAST_DUE`/`EXPIRED`/`CANCELED`), Billing Provider (`Badge` per §11 §3), Current Period End, Cancel-at-Period-End flag. Filters by status/provider/tier. Status `PAST_DUE` rows highlighted with `color.warning` background tint.

### 4.3 Invoices / Refunds

**Layout**: Table of `Invoice` rows — User/Org, Amount, Currency, Status (paid/failed/refunded), Provider, Date. "Issue Refund" action (`ADMIN`+) opens a dialog requiring a reason (stored in `AdminAuditLog.action=REFUND_ISSUED` `before`/`after` snapshot).

---

## 5. Financial Dashboard

**Access**: `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Revenue tab**: MRR/ARR headline numbers, revenue-by-tier stacked bar chart (monthly), revenue-by-region/provider breakdown (donut: Apple IAP / Google Play / Stripe / Paystack / Manual per §11 §3)
- **AI Cost vs Revenue tab**: line chart overlaying AI provider spend (text generation + image generation, sourced from `AIUsageLog` cost fields) against revenue — directly visualizes the §13 §5 "AI costs dominate infra spend" relationship; a secondary metric "AI cost as % of revenue" with a configurable alert threshold (feeds §13 §9 cost alerts)
- **Churn/LTV tab**: monthly churn rate by tier (line chart), cohort retention table (cohort month × month-N retention %), average LTV by tier and by acquisition channel (cross-ref §20 §8 KPIs)

---

## 6. AI Analytics

**Access**: `ADMIN`, `SUPER_ADMIN` (full); `CONTENT_EDITOR` (read-only, for template quality decisions).

**Layout**:
- **Usage by Feature tab**: bar chart of generation counts by `AIFeature` enum (Devotion/Prayer/Sermon/AI Study/Image) over a selectable date range; table breakdown by `DevotionType`/`DevotionDepth`/`PrayerType`/`ImageStyle` for drill-down
- **Usage by Tier/User tab**: stacked bar of generation volume by subscription tier (validates whether higher tiers are actually using their unlocked quota — informs §11 pricing/quota decisions); top-N users by usage table (for anomaly review, cross-ref §12 §4)
- **Quality Feedback tab**: thumbs-up/down rates per `AIFeature` and per `DevotionTemplate` version (line chart over template version history) — surfaces which prompt template versions (§06, §18) perform best, feeding the A-B testing workflow in §9 below

---

## 7. AI Usage Monitoring

**Access**: `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Real-time request volume**: live-updating (polling/SSE) line chart of AI requests/min, split by `AIFeature`
- **Latency & error rates**: P50/P95/P99 latency chart per AI provider (Anthropic Claude / Image provider), error rate % with breakdown by error type (rate-limited, timeout, content-filter-rejected, citation-validation-failed)
- **Cost alerts / rate-limit triggers**: table of recent CloudWatch-alarm-driven events (§13 §9) — timestamp, alert type, threshold, current value, status (acknowledged/active); "Acknowledge" action logs to `AdminAuditLog`
- A prominent banner appears at the top of this page if the anomaly-detection job (§12 §4) has auto-throttled any users to FREE-tier limits pending review, with a link to the affected user list

---

## 8. Image Generation Analytics

**Access**: `ADMIN`, `SUPER_ADMIN` (full); `MODERATOR` (Moderation Queue tab only).

**Layout**:
- **Generations by Style/Source tab**: donut chart of `ImageGeneration` counts by `ImageStyle` (10 values) and by `ImageSourceType` (8 values) — identifies most-popular styles, informing which styles get priority in model/LoRA tuning (§19)
- **Moderation Queue tab**: table of `ImageGeneration` rows with `moderationStatus=FLAGGED` — thumbnail, user, prompt (sanitized), flagged reason/confidence score, Actions: Approve / Reject (writes `ContentModerationFlag` resolution + `AdminAuditLog.action=MODERATION_DECISION`)
- **Cost per Image tab**: average cost per generation by `ImageStyle` (bar chart) — cross-references §19 cost/performance targets and §13 §5 cost modeling

---

## 9. Bible Translation Management

**Access**: `CONTENT_EDITOR`, `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Versions tab**: table of `BibleVersion` rows — code (e.g., KJV, ESV), language, license type (public domain / licensed), sync status, verse count. "Add Version" opens a form for new translation metadata + a content-import job trigger (bulk `VerseText` ingestion).
- **Cross-Reference Data tab**: table/management UI for `CrossReference` rows — source passage, target passage, `CrossReferenceType` (e.g., quotation, allusion, thematic parallel), with bulk-import (CSV) and manual-add forms; search/filter by passage.

---

## 10. Devotion Template Management

**Access**: `CONTENT_EDITOR`, `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Templates by Type × Depth tab**: grid (13 `DevotionType` rows × 6 `DevotionDepth` columns per §00 §6/§7), each cell shows the active `DevotionTemplate` version number and a status indicator (published/draft); clicking a cell opens the **Template Editor**
- **Template Editor**: code-editor-style panel (syntax-highlighted prompt template text per §06/§18's prompt anatomy), version history sidebar (diff view between versions), "Save as Draft" / "Publish" actions — publishing writes `AdminAuditLog.action=DEVOTION_TEMPLATE_PUBLISHED` and is the only way a new template version becomes live (no direct prod edits)
- **Prompt Versioning / A-B Testing tab**: table of active A/B tests (template version A vs. B, traffic split %, sample size, quality-feedback comparison pulled from §6's Quality Feedback data) — "Promote Winner" action sets the winning version as the sole active template

---

## 11. Content Moderation

**Access**: `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Flagged Community Posts/Comments tab**: queue table — content preview (sanitized rich text render), author, `moderationStatus` (`FLAGGED`/`REJECTED`), flag reason/confidence, reported-by count (if user-reported). Actions: Approve (clears flag), Reject (sets `REJECTED`, hides from feed), View Author History (link to User Detail). High-confidence severe violations show a "(Auto-rejected)" tag — already actioned, shown for audit visibility.
- **Flagged Images tab**: same pattern as §8's Moderation Queue, surfaced here too for `MODERATOR` role (which lacks access to the broader Image Generation Analytics section).

---

## 12. Community Moderation

**Access**: `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.

**Layout**:
- **Groups oversight tab**: table of `Group` rows — name, member count, `GroupRole` distribution, creation date, recent activity level; "View Group Feed" (read-only) for investigating reported groups; "Disband Group" action (`ADMIN`+, high-friction confirmation dialog)
- **User reports tab**: table of user-submitted reports against other users/posts/comments — reporter, reported entity, reason category, status (open/resolved), Actions: Resolve (with resolution note), Escalate to Content Moderation (links the underlying post into §11's queue)

---

## 13. Notification Center

**Access**: `CONTENT_EDITOR` (campaigns), `ADMIN`/`SUPER_ADMIN` (full).

**Layout**:
- **Campaign Composer tab**: form — title, body, target `NotificationType`, audience segment builder (filter by tier/role/last-active/denomination lens — reuses query patterns from §6's Usage by Tier), schedule (immediate/scheduled datetime), preview pane (renders as it would appear on iOS/Android push + in-app). "Send Test" (to admin's own account) before "Schedule"/"Send Now".
- **Scheduled Notifications tab**: table of pending/sent campaigns — title, audience size, scheduled time, status (scheduled/sending/sent/failed), with cancel action for not-yet-sent campaigns.

---

## 14. Settings

### 14.1 Admin Roles & Permissions

**Access**: `SUPER_ADMIN` only.

**Layout**: Table of admin-capable users (roles `MODERATOR`→`SUPER_ADMIN`) with role dropdown per row (change triggers confirmation + `AdminAuditLog.action=ROLE_CHANGED`); "Invite Admin" form (email + role, sends setup link requiring MFA enrollment per §10 §9 before first login).

### 14.2 Feature Flags

**Access**: `SUPER_ADMIN` only.

**Layout**: Table of feature flags (name, description, enabled environments — `dev`/`staging`/`prod` toggles, rollout % slider for gradual rollout). Used for staged rollout of new AI features (e.g., new `ImageStyle`, new `DevotionType`) ahead of full Studio availability.

### 14.3 Audit Log

**Access**: `SUPER_ADMIN` (read only — write-only at the application layer per §12 §9).

**Layout**: Full searchable/filterable table of `AdminAuditLog` — columns: Timestamp, Actor, Action (`Badge`, color-coded by category: role/access in blue, financial in gold, moderation in purple, content in green), Target Type/ID, IP Address. Row expansion shows the `before`/`after` JSON diff. No edit/delete UI exists anywhere in the portal for this table, by design.

---

## 15. Cross-Cutting Patterns

- **Server-side role enforcement**: every page and API call re-checks `role` server-side (§12 §8 A01 mitigation) — sidebar visibility is a UX convenience, not a security boundary.
- **Audit-everything**: any action that mutates user-facing state (role changes, refunds, moderation decisions, template publishes, feature flag changes) writes an `AdminAuditLog` row (§12 §9) and triggers a toast confirming the write succeeded.
- **Environment guardrails**: the top-bar environment badge (§1.1) is paired with destructive-action confirmation dialogs that repeat the environment name ("You are about to issue a refund in **PROD**") to prevent staging/prod mix-ups.
- **Consistent empty/loading/error states**: shadcn `Skeleton` components for loading, standardized empty-state illustration + copy for zero-result tables, and toast-based error reporting (with Sentry capture, §13 §9) for failed mutations.
