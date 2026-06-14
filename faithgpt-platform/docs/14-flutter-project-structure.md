# 14 — Flutter Project Structure

Canonical project tree for `/faithgpt-platform/mobile/` (Flutter app `faithgpt`). This document explains the structure implemented by the scaffold under `mobile/`.

---

## 1. Full Project Tree

```
mobile/
├── analysis_options.yaml          # flutter_lints
├── pubspec.yaml
└── lib/
    ├── main.dart                  # entry point: Firebase init, ProviderScope
    ├── app.dart                   # FaithGptApp — MaterialApp.router
    │
    ├── core/                      # app-wide, feature-agnostic
    │   ├── theme/
    │   │   ├── app_colors.dart    # design tokens from docs/00 §2
    │   │   └── app_theme.dart     # light/dark ThemeData
    │   ├── router/
    │   │   └── app_router.dart    # go_router, StatefulShellRoute (5 tabs)
    │   ├── network/
    │   │   ├── api_client.dart    # Dio + interceptors
    │   │   ├── api_endpoints.dart # /api/v1/* path constants
    │   │   └── sse_client.dart    # SSE stream parser for AI generation
    │   ├── storage/
    │   │   ├── secure_storage_service.dart  # tokens (flutter_secure_storage)
    │   │   └── local_database.dart          # Drift: BibleVerses, CachedDevotions, ...
    │   ├── di/
    │   │   └── providers.dart     # cross-cutting provider wiring (Dio, Drift, prefs)
    │   └── constants/
    │       └── app_constants.dart # DevotionType, DevotionDepth, ImageStyle, etc.
    │
    ├── shared/
    │   └── widgets/
    │       ├── verse_card.dart
    │       ├── primary_button.dart
    │       ├── ai_generated_badge.dart
    │       ├── loading_indicator.dart
    │       ├── section_card.dart          # renders one of the 15 devotion sections
    │       └── scaffold_with_nav_bar.dart # bottom nav shell
    │
    ├── l10n/
    │   └── app_en.arb              # English strings (i18n-ready, §07 §9)
    │
    └── features/
        ├── auth/                   # FULLY SCAFFOLDED
        │   ├── data/
        │   │   ├── models/user_model.dart       # @freezed User
        │   │   └── auth_repository.dart         # login/signup/refresh/logout
        │   └── presentation/
        │       ├── providers/auth_provider.dart # AsyncNotifier<AuthState>
        │       └── screens/
        │           ├── login_screen.dart
        │           ├── signup_screen.dart
        │           └── onboarding_screen.dart
        │
        ├── home/                   # FULLY SCAFFOLDED (Home tab, §02 §1.1)
        │   └── presentation/
        │       ├── providers/home_provider.dart
        │       └── screens/home_screen.dart
        │
        ├── bible/                  # FULLY SCAFFOLDED (Bible tab, §02 §1.2)
        │   ├── data/
        │   │   ├── models/bible_models.dart     # BibleVersion, BibleBook, BibleVerse, VerseText
        │   │   └── bible_repository.dart
        │   └── presentation/
        │       ├── providers/bible_provider.dart
        │       ├── screens/bible_reader_screen.dart
        │       └── widgets/verse_selection_sheet.dart  # "Selection → Action Sheet" pattern
        │
        ├── devotions/              # FULLY SCAFFOLDED (AI Verse-to-Devotion Engine™)
        │   ├── data/
        │   │   ├── models/devotion_model.dart   # @freezed Devotion + DevotionSections (15 keys)
        │   │   └── devotions_repository.dart    # generateDevotion() → Stream<DevotionSectionEvent>
        │   └── presentation/
        │       ├── providers/devotion_provider.dart
        │       └── screens/
        │           ├── devotion_setup_screen.dart   # passage → themes → type → depth wizard
        │           └── devotion_result_screen.dart  # 15-section streamed result
        │
        ├── ai_assistant/           # STUB (AI Bible Study Assistant™)
        │   └── presentation/{providers/ai_assistant_provider.dart, screens/ai_assistant_screen.dart}
        │
        ├── prayer/                 # STUB (AI Prayer Generator)
        │   └── presentation/{providers/prayer_provider.dart, screens/prayer_screen.dart}
        │
        ├── sermon/                 # STUB (Sermon Studio)
        │   └── presentation/{providers/sermon_provider.dart, screens/sermon_screen.dart}
        │
        ├── visual_studio/          # STUB (4 sub-features, §02 §1.3)
        │   ├── image_generator/presentation/{providers/image_generator_provider.dart, screens/image_generator_screen.dart}
        │   ├── story_visualizer/presentation/{providers/story_visualizer_provider.dart, screens/story_visualizer_screen.dart}
        │   ├── memory_verse/presentation/{providers/memory_verse_provider.dart, screens/memory_verse_screen.dart}
        │   └── content_creator/presentation/{providers/content_creator_provider.dart, screens/content_creator_screen.dart}
        │
        ├── journal/                # STUB (Journal tab, §02 §1.5)
        │   └── presentation/{providers/journal_provider.dart, screens/journal_screen.dart}
        │
        ├── growth/                 # STUB (Spiritual Growth Dashboard™)
        │   └── presentation/{providers/growth_provider.dart, screens/growth_screen.dart}
        │
        ├── community/              # STUB (Community tab, §02 §1.4)
        │   └── presentation/{providers/community_provider.dart, screens/community_screen.dart}
        │
        └── account/                # STUB (Account & paywall, §02 §1.6)
            └── presentation/{providers/account_provider.dart, screens/account_screen.dart, screens/paywall_screen.dart}
```

---

## 2. Fully-Scaffolded vs Stub Features

Every feature — fully scaffolded or stub — uses the **same folder shape** (`data/`, `presentation/{providers,screens,widgets}`), so a stub can be filled in without restructuring:

- **Fully scaffolded** (`auth`, `home`, `bible`, `devotions`): real `@freezed` model classes mirroring Prisma models/enums (§05), a repository with real method signatures (return types are `Future`/`Stream` as appropriate, bodies call `ApiClient`/`LocalDatabase`), a working provider, and real screens wired into `app_router.dart`.
- **Stub** (`ai_assistant`, `prayer`, `sermon`, `visual_studio/*`, `journal`, `growth`, `community`, `account`): one placeholder screen (`Scaffold` + `AppBar` + centered "Coming soon" text) and one provider returning placeholder state — establishes the import paths `app_router.dart` and navigation expect, ready for incremental implementation.

---

## 3. Code Generation

| Tool | Used for | Generated file pattern |
|---|---|---|
| `freezed` + `freezed_annotation` | Immutable data models (`User`, `BibleVerse`, `Devotion`, `DevotionSections`, ...) | `*.freezed.dart` |
| `json_serializable` + `json_annotation` | JSON (de)serialization for API DTOs | `*.g.dart` |
| `riverpod_generator` + `riverpod_annotation` | `@riverpod` provider boilerplate | `*.g.dart` |
| `drift_dev` | Local SQLite table/DAO code for `local_database.dart` | `*.g.dart` |

All generated files run via a single `dart run build_runner build --delete-conflicting-outputs`, wired into CI (§07 §12) before `flutter analyze`/`flutter test`.

---

## 4. Dependency Injection

Riverpod **is** the DI mechanism — no `get_it`/service locator. `core/di/providers.dart` exposes the few app-wide singletons (`dioProvider`, `localDatabaseProvider`, `secureStorageProvider`); every feature repository provider depends on these via `ref.watch(...)`, and every screen depends only on its feature's provider — never directly on Dio/Drift. This keeps repositories trivially swappable in tests via `ProviderContainer(overrides: [...])`.

---

## 5. Naming Conventions (applied throughout the scaffold)

- Files: `snake_case.dart` — e.g. `devotion_result_screen.dart`, `bible_repository.dart`.
- Classes: `PascalCase` — e.g. `DevotionResultScreen`, `BibleRepository`, `DevotionSections`.
- Providers: `camelCase` suffixed `Provider` — e.g. `authProvider`, `bibleChapterProvider`, `devotionGenerationProvider`.
- Enums mirror Prisma `PascalCase` enum **values** as Dart `camelCase` — e.g. Prisma `DevotionType.SABBATH_SCHOOL` → Dart `DevotionType.sabbathSchool` (see `core/constants/app_constants.dart`).
- Routes: kebab-case path segments, `camelCase` route `name`s — e.g. path `devotion/result/:devotionId`, name `devotionResult`.
