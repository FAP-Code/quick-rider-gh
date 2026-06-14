# FaithGPT™ — Shared Reference & Glossary

> **Purpose:** This document is the canonical source of truth for naming, taxonomy, enums, tiers, and cross-cutting conventions used across every other document in `/faithgpt-platform`. All other deliverables (PRD, architecture docs, schema, API spec, mobile/backend scaffolds) MUST use the terms defined here verbatim to keep the platform internally consistent.

---

## 1. Brand

| Item | Value |
|---|---|
| Product name | **FaithGPT™** |
| Tagline | "Transforming Scripture into Daily Living" |
| Founder | Frank Adu Poku |
| Primary domains | `faithgpt.app` (consumer), `admin.faithgpt.app` (admin portal), `api.faithgpt.app` (backend API) |
| Trademarked sub-products | AI Verse-to-Devotion Engine™, AI Scripture Image Generator™, AI Bible Study Assistant™, AI Bible Story Visualizer™, Devotion Image Generator™, Memory Verse Visualizer™, Christian Content Creator™, Spiritual Growth Dashboard™ |

---

## 2. Design Tokens (referenced by §15 UI/UX Spec, §16 Screens, mobile theme)

| Token | Value | Usage |
|---|---|---|
| `color.primary` (Royal Blue) | `#1B3A6B` | Primary brand, nav bars, primary buttons |
| `color.primaryDark` | `#0F2748` | Dark mode surfaces, pressed states |
| `color.accent` (Gold) | `#D4AF37` | CTAs, highlights, premium badges, streak flames |
| `color.accentSoft` | `#F2E2A8` | Gold tints, progress bars |
| `color.surfaceLight` | `#FFFFFF` | Light mode background |
| `color.surfaceDark` | `#0B1220` | Dark mode background |
| `color.textPrimaryLight` | `#101828` | Light mode body text |
| `color.textPrimaryDark` | `#F5F5F4` | Dark mode body text |
| `color.success` | `#1E8E5A` | Streaks, answered prayers |
| `color.warning` | `#C77B14` | Soft warnings, AI disclaimers |
| `color.error` | `#C0392B` | Errors, destructive actions |
| Font – Display | "Fraunces" (serif, scripture/headlines) | Verse cards, devotion titles |
| Font – UI | "Inter" (sans, body/UI) | All UI text |
| Corner radius | 12px (cards), 24px (sheets/modals) | Component shape language |
| Elevation | 0/1/2/3 scale, soft shadow, gold glow on premium elements | Depth |

---

## 3. User Roles (RBAC)

| Role | Code | Description |
|---|---|---|
| Guest | `GUEST` | Unauthenticated; read-only Bible access, sample devotions |
| Believer | `USER` | Standard registered user (Free tier) |
| Plus Member | `USER` (subscription=`PLUS`) | Paid tier 1 |
| Premium Member | `USER` (subscription=`PREMIUM`) | Paid tier 2 |
| Group Leader | `GROUP_LEADER` | Can create/manage Bible study groups & church accounts |
| Ministry Admin | `MINISTRY_ADMIN` | Manages a Ministry/Church organization plan & its seats |
| Content Moderator | `MODERATOR` | Reviews flagged community/AI content |
| Content Editor | `CONTENT_EDITOR` | Manages devotion templates, reading plans, curated content |
| Support Agent | `SUPPORT` | Read access to user accounts for support tickets |
| Admin | `ADMIN` | Full operational access to Admin Portal |
| Super Admin | `SUPER_ADMIN` | Full access incl. billing, infra, role management |

---

## 4. Subscription Tiers

| Tier | Code | Price (USD, indicative) | Target |
|---|---|---|---|
| Free | `FREE` | $0 | Acquisition / core Bible & limited AI |
| Plus | `PLUS` | $4.99/mo or $39.99/yr | Individual believers, regular devotion users |
| Premium | `PREMIUM` | $9.99/mo or $79.99/yr | Power users, content creators, small group leaders |
| Ministry | `MINISTRY` | from $49.99/mo (seat-based) | Churches, ministries, schools |
| Lifetime | `LIFETIME` | $199.99 one-time | Early adopters / promo |

Full feature gating matrix is defined in **§11 Subscription System** and **§04 Feature Breakdown**.

---

## 5. Core Modules (Information Architecture top level)

1. **Bible** — Reading, translations, audio, search, highlights, notes, reading plans
2. **AI Study** — AI Bible Study Assistant™, Q&A, cross-references, original language tools
3. **Devotions** — AI Verse-to-Devotion Engine™, devotion library, templates, types & depth levels
4. **Sermon Studio** — AI Sermon Assistant, outlines, Sabbath School lessons, teaching notes
5. **Prayer** — AI Prayer Generator, prayer journal, prayer requests, answered prayer tracking
6. **Studio (Visual)** — AI Scripture Image Generator™, AI Bible Story Visualizer™, Devotion Image Generator™, Memory Verse Visualizer™, Christian Content Creator™
7. **Journal** — Notes, testimonies, saved devotions/prayers/insights
8. **Growth** — Spiritual Growth Dashboard™ (streaks, stats, achievements)
9. **Community** — Feed, groups, testimonies, prayer wall, friends
10. **Account** — Profile, subscription, settings, notifications

---

## 6. Devotion Types (enum `DevotionType`)

`PERSONAL`, `FAMILY`, `YOUTH`, `CHILDREN`, `PATHFINDER`, `WOMEN`, `MEN`, `LEADERSHIP`, `MARRIAGE`, `EVANGELISTIC`, `SABBATH_SCHOOL`, `SMALL_GROUP`, `SERMON_PREP`

## 7. Devotion Depth Levels (enum `DevotionDepth`)

| Code | Label | Target length |
|---|---|---|
| `QUICK` | Quick (2 min) | ~150–250 words |
| `STANDARD` | Standard (5 min) | ~400–600 words |
| `DEEP` | Deep Study (10–15 min) | ~900–1,400 words |
| `ADVANCED` | Advanced Study | ~1,500–2,500 words, includes original language notes |
| `TEACHING` | Teaching Mode | Structured for group facilitation, includes facilitator notes |
| `SERMON` | Sermon Mode | Full outline + illustrations + altar call |

## 8. Devotion Output Sections (canonical order)

`title`, `keyScripture`, `historicalContext`, `biblicalContext`, `verseExplanation`, `theologicalInsights`, `spiritualLessons`, `lifeApplications`, `reflectionQuestions`, `discussionQuestions`, `prayer`, `actionSteps`, `memoryVerse`, `relatedScriptures`, `closingEncouragement`

## 9. Scripture Analysis Output

- **Themes** (tagged from controlled vocabulary, e.g. Faith, Hope, Love, Prayer, Obedience, Wisdom, Forgiveness, Leadership, Evangelism, Worship, Stewardship, Grace, Discipleship, Courage, Service — extensible)
- **Biblical Elements**: `COMMAND`, `PROMISE`, `WARNING`, `BLESSING`, `PROPHECY`, `FULFILLMENT`, `CHARACTER_LESSON`, `LIFE_APPLICATION`, `SPIRITUAL_PRINCIPLE`

## 10. Image Generation Modes (enum `ImageStyle`)

`PHOTOREALISTIC`, `CINEMATIC`, `CHRISTIAN_ARTWORK`, `CARTOON`, `CHILDRENS_STORYBOOK`, `COMIC_BOOK`, `WATERCOLOR`, `OIL_PAINTING`, `MINIMALIST_POSTER`, `SOCIAL_MEDIA_GRAPHIC`

## 11. Image Source Types (enum `ImageSourceType`)

`VERSE`, `CHAPTER`, `BIBLE_STORY`, `DEVOTION`, `PRAYER`, `SERMON`, `MEMORY_VERSE`, `CUSTOM_PROMPT`

## 12. AI Assistant Question Categories

`MEANING`, `SIMPLE_EXPLANATION`, `CHILDRENS_EXPLANATION`, `HISTORICAL_BACKGROUND`, `CULTURAL_CONTEXT`, `MODERN_APPLICATION`, `HEBREW_ORIGINAL`, `GREEK_ORIGINAL`, `CROSS_REFERENCES`, `CHARACTER_PARALLELS`, `CHRIST_CONNECTION`

## 13. Naming Conventions

- **Database**: snake_case columns, PascalCase Prisma models, plural table names via `@@map`
- **API routes**: `/api/v1/<resource>`, kebab-case multi-word resources (e.g. `/api/v1/verse-to-devotion`)
- **Mobile (Flutter)**: feature-first folders, `snake_case.dart` filenames, `PascalCase` classes, Riverpod providers suffixed `Provider`
- **Backend (NestJS)**: one module per bounded context under `src/modules/<name>`, `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/*.dto.ts`

---

This glossary will be extended as new features are added — treat additions as additive, non-breaking changes to enum lists where possible.
