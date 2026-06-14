# 07 — Mobile Architecture

**Platform:** Flutter (single codebase, iOS + Android) | **State:** Riverpod | **Nav:** go_router | **Offline:** Drift (SQLite)

---

## 1. Why Flutter

- **Single codebase** for iOS and Android satisfies the PRD constraint (§01 §9) while keeping the team small enough to iterate quickly on an AI-heavy, media-rich UI.
- **Near-native performance** for the animation-heavy Studio flows (streaming devotion sections, image galleries, storyboard sequencing) and for an embedded SQLite (Drift) offline Bible.
- **Strong ecosystem** for every cross-cutting need: secure storage, biometrics, push notifications, SSE/streaming HTTP, code generation for models/providers/routes.
- A future React Native rewrite is explicitly out of scope; Flutter is the canonical mobile platform referenced by §14.

---

## 2. App Architecture

**Pattern:** Clean Architecture, feature-first.

```
lib/
├── core/        # theme, router, network, storage, constants — app-wide
├── shared/      # reusable widgets used across ≥2 features
├── features/    # one folder per IA module (§02)
└── l10n/        # ARB translation files
```

Each feature follows the same internal shape (see §14 for the full tree):

```
features/<feature>/
├── data/            # models, repositories (Dio/Drift implementations)
├── domain/          # (optional) use-cases for complex features
└── presentation/
    ├── providers/   # Riverpod providers/notifiers
    ├── screens/     # full-page widgets, wired to GoRouter
    └── widgets/     # feature-local widgets
```

"Fully scaffolded" features (auth, bible, devotions) implement all layers with real model classes and repository methods. "Stub" features follow the identical shape with placeholder screens/providers, so they can be filled in incrementally without restructuring.

---

## 3. State Management — Riverpod

- **Code generation** via `riverpod_generator` (`@riverpod` annotations) — consistent provider naming: `xxxProvider` for state, `xxxRepositoryProvider` for repositories.
- **Three core provider patterns:**
  1. **AI streaming state** (`AsyncNotifier<DevotionGenerationState>`): the Devotion/Prayer/Sermon/Chat providers consume an SSE stream from the AI Gateway (§06) and emit incremental state — `state.sections` grows section-by-section as events arrive, so `DevotionResultScreen` renders progressively.
  2. **Paginated lists** (`AsyncNotifier<PagedState<T>>` via a small shared `PagedNotifier` base): Bible chapters, "My Devotions", Journal entries, Community feed — cursor-based, matching §09 API pagination convention.
  3. **Form/wizard state** (`Notifier<DevotionSetupState>`): the Devotion Setup wizard (passage → themes → type → depth) holds in-progress selections before calling `generate()`.
- Providers are the **sole DI mechanism** — no `get_it`. Repository providers wrap `ApiClient` (Dio) and/or `LocalDatabase` (Drift), and screens depend only on provider interfaces, never on concrete Dio/Drift classes.

---

## 4. Navigation — go_router

- `StatefulShellRoute.indexedStack` implements the 5 persistent bottom tabs from §02 §1: **Home, Bible, Studio, Community, Journal** — each tab preserves its own navigation stack across tab switches.
- **Modal routes** (full-screen dialogs, not part of the shell): Paywall (§02 §1 Journey 8), Verse Selection Action Sheet (presented as a `showModalBottomSheet`, not a route), onboarding flow (pre-auth, outside the shell).
- **Typed route params** for deep linking (`faithgpt://bible/<book>/<chapter>/<verse>`, `faithgpt://devotion/<id>`, `faithgpt://image/<id>`, `faithgpt://group/<id>` per §02 §4) map directly to `GoRoute` path parameters.
- Auth guard: a top-level `redirect` callback checks `authProvider` state — unauthenticated users are redirected to `/onboarding` regardless of requested path.

---

## 5. Offline-First Design

| Data | Storage | Sync strategy |
|---|---|---|
| Bible text (`bible_books`/`bible_verses`/`verse_texts`) for downloaded versions | Drift tables `BibleVerses`/`VerseTexts`, populated by a one-time download job per `BibleVersion` | Pull-only; versions are immutable once published — re-download only on translation update |
| Highlights, Notes, Bookmarks | Drift, mirrored to backend | Last-write-wins; local write succeeds immediately (optimistic), background sync pushes to `/api/v1/highlights` etc., conflict = server timestamp wins |
| Cached Devotions / Journal entries | Drift `CachedDevotions` table | Generated devotions are written locally immediately on stream completion; Journal entries queue for sync if offline |
| Reading position / streak state | Drift + local-first increment, reconciled with `SpiritualStat`/`UserStreak` on next sync | Optimistic local increment; server is source of truth on conflict |
| AI Studio outputs requiring connectivity (new generations, chat, images) | Not available offline — UI shows an "offline" state with a queued-retry option for non-streaming requests | N/A |

A background `SyncService` (triggered on connectivity regain + periodic timer) flushes the local write queue and re-fetches any stale cached lists.

---

## 6. Networking

- **Dio** HTTP client (`core/network/api_client.dart`) with interceptors:
  - **Auth interceptor**: attaches `Authorization: Bearer <accessToken>`; on `401`, calls `/api/v1/auth/refresh` once, retries the original request, and signs the user out if refresh also fails.
  - **Error mapping interceptor**: maps the §09 error envelope (`{error: {code, message, details}}`) to typed `ApiException`s consumed by providers.
  - **Correlation ID interceptor**: attaches a request ID for tracing (§08).
- **Streaming**: AI generation endpoints (`POST /api/v1/devotions/generate`, prayers, sermons, chat) return `text/event-stream`. Dio's `ResponseType.stream` is used with a custom SSE line-parser (`core/network/sse_client.dart`) that decodes named events into a `Stream<DevotionSectionEvent>` consumed by the relevant `AsyncNotifier`.

---

## 7. Push Notifications

Firebase Cloud Messaging, mapped to `NotificationType`:

| Type | Trigger | Deep link |
|---|---|---|
| `DAILY_DEVOTION` | Scheduled per user's reminder time | `/studio/devotion/result/:id` (pre-generated) |
| `STREAK_REMINDER` | Streak about to break (e.g., 8pm local, no activity today) | `/home` |
| `PRAYER_ANSWERED` | User marks a `PrayerRequest.isAnswered` | `/journal` |
| `GROUP_ACTIVITY` / `COMMUNITY_INTERACTION` | New post/comment/like in a followed group/post | `/community/...` |
| `SUBSCRIPTION` | Trial ending, payment failed | `/account/subscription` |
| `SYSTEM` | App updates, announcements | In-app banner |

---

## 8. Theming

Implements the design tokens from §00 §2: `AppColors` (Royal Blue `#1B3A6B` primary, Gold `#D4AF37` accent) and `AppTheme` (`ThemeData` for light and dark, `ThemeMode.system` default). Typography: Fraunces (display/serif — verse cards, devotion titles) + Inter (UI/body), both bundled as app fonts.

---

## 9. Localization

`flutter_localizations` + ARB files under `lib/l10n/`. English (`en`) ships at MVP; the provider/widget layer always reads strings via generated `AppLocalizations`, never hardcoded, so additional locales (§20 multi-language expansion, Phase 3) require only new ARB files — no code changes.

---

## 10. Security

- `flutter_secure_storage` for access/refresh tokens (Keychain on iOS, EncryptedSharedPreferences on Android).
- `local_auth` (Face ID/Touch ID/fingerprint) optionally gates app resume — unlocks access to the locally-stored refresh token, per §10 Authentication System.
- No PII or tokens are ever written to Drift in plaintext outside the secure-storage boundary.

---

## 11. Testing Strategy

| Layer | Approach |
|---|---|
| Widgets | `flutter_test` widget tests per shared component (`VerseCard`, `SectionCard`, `PrimaryButton`, `AiGeneratedBadge`) |
| Design system | Golden tests for light/dark theme renders of shared widgets |
| Providers | Unit tests with mocked repositories (`ProviderContainer` overrides) |
| Integration | `integration_test` covering the 3 flagship flows: Verse-to-Devotion (Journey 2), Scripture Image Generator (Journey 2/7), Bible Study Assistant chat |

---

## 12. CI/CD

GitHub Actions: `flutter analyze` + `flutter test` on every PR → on merge to `main`, build via **Codemagic** (or Actions + Fastlane) for TestFlight (iOS) and Play Internal Testing (Android); promotion to production releases is a manual approval step. Coordinates with §13 Cloud Infrastructure's CI/CD section.
