# 15 — UI/UX Specifications

This document expands the design tokens defined in **§00 §2** into a full design system: color system (light/dark), typography scale, spacing/layout grid, component library, iconography, motion, accessibility, and AI-content visual conventions. It is the implementation reference for `mobile/lib/core/theme/` (§07, §14) and the Admin Portal (§17).

---

## 1. Design Principles

| Principle | Application |
|---|---|
| **Scripture is sacred, AI is a tool** | Scripture text always renders in the Display font (Fraunces) on a neutral card with no AI styling; AI-generated content always carries the AI badge (§6 below) and uses the UI font (Inter) |
| **Calm, devotional pace** | Generous whitespace, soft elevation, no aggressive red/urgent colors outside error states — even paywall/upsell moments use warm gold rather than alarm red |
| **One-handed mobile use** | Primary actions (Generate, Save, Share) anchored to bottom of screen within thumb reach; bottom nav bar (§02 §1) is the constant anchor |
| **Progressive disclosure** | Long AI outputs (15-section devotions, sermons) use collapsible sections with the most "actionable" sections (Life Applications, Prayer, Action Steps) expanded by default |
| **Denomination-neutral by default** | Default visual language (icons, imagery, color) avoids denomination-specific iconography (crosses with specific liturgical styling, denomination logos) unless `denominationLens` is set |

---

## 2. Color System

### 2.1 Light Mode

| Token (from §00 §2) | Hex | Role |
|---|---|---|
| `color.primary` | `#1B3A6B` | App bar, bottom nav active state, primary buttons, links |
| `color.primaryDark` | `#0F2748` | Pressed/active states of primary elements |
| `color.accent` | `#D4AF37` | Premium badges, streak flame icon, "Generate" CTA accents, AI badge border |
| `color.accentSoft` | `#F2E2A8` | Progress bar fills, premium card background tint, highlight color (Bible text highlight default) |
| `color.surfaceLight` | `#FFFFFF` | Screen backgrounds, cards |
| `color.surfaceAlt` | `#F7F8FA` | Secondary surfaces (e.g., chat bubbles, input fields) |
| `color.textPrimaryLight` | `#101828` | Headings, body text |
| `color.textSecondaryLight` | `#5C6470` | Captions, metadata, timestamps |
| `color.success` | `#1E8E5A` | Streak counters, "answered prayer" tag, success toasts |
| `color.warning` | `#C77B14` | AI disclaimer banners, soft warnings (e.g., "approaching daily limit") |
| `color.error` | `#C0392B` | Validation errors, destructive action confirmations |
| `color.divider` | `#E5E7EB` | List separators, card borders |

### 2.2 Dark Mode

| Token | Hex | Role |
|---|---|---|
| `color.surfaceDark` | `#0B1220` | Screen background |
| `color.surfaceDarkAlt` | `#141C2E` | Cards, sheets, chat bubbles |
| `color.primaryDarkMode` | `#3E6BB0` | Primary actions (lighter tint of `color.primary` for contrast on dark backgrounds) |
| `color.accent` | `#D4AF37` | Unchanged — gold retains identity in both modes |
| `color.textPrimaryDark` | `#F5F5F4` | Headings, body text |
| `color.textSecondaryDark` | `#9CA3AF` | Captions, metadata |
| `color.dividerDark` | `#1F2937` | List separators, card borders |

Dark mode is not a simple inversion: `color.primary` (#1B3A6B) is too low-contrast against `#0B1220` for interactive elements, so a lighter `primaryDarkMode` tint is defined specifically for buttons/links in dark mode, while navy retains its role as a *surface* accent (e.g., gradient headers).

### 2.3 Semantic Color Usage Rules

- **Gold (`color.accent`) is reserved for**: premium/paywall indicators, the AI-generated content badge border, streak flame, and primary "Generate" CTAs. It must never be used for destructive or error states.
- **Royal Blue (`color.primary`) is reserved for**: navigation, primary brand chrome, and the Scripture reader's accent (e.g., active chapter indicator). It signals "FaithGPT structure," distinguishing it from AI-generated or user-generated content areas.
- Scripture text blocks use `color.textPrimaryLight`/`Dark` on a plain `color.surfaceLight`/`Dark` card with **no colored background tint** — reinforcing the "Scripture is not AI output" visual separation mandated by §01 §8.

---

## 3. Typography

| Style | Font | Size / Line height | Weight | Usage |
|---|---|---|---|---|
| `display.large` | Fraunces | 32 / 40 | 600 (SemiBold) | Devotion titles, screen hero headers |
| `display.medium` | Fraunces | 24 / 32 | 600 | Section headers within devotion/sermon results |
| `scripture.body` | Fraunces | 18 / 28 | 400 (Regular) | Bible reader verse text |
| `scripture.reference` | Fraunces | 14 / 20 | 500 (Medium), italic | Verse reference labels (e.g., "Romans 8:28") |
| `heading.h1` | Inter | 22 / 28 | 700 (Bold) | Screen titles (app bar) |
| `heading.h2` | Inter | 18 / 24 | 600 | Card titles, list section headers |
| `body.regular` | Inter | 15 / 22 | 400 | Default UI body text |
| `body.medium` | Inter | 15 / 22 | 500 | Emphasized body text, button labels |
| `caption` | Inter | 13 / 18 | 400 | Timestamps, metadata, helper text |
| `label.small` | Inter | 11 / 14 | 600, letter-spacing 0.5 | Chips, badges, tab labels |

**Scaling**: All sizes respect the OS-level text scaling setting (Flutter `MediaQuery.textScaler`) up to 130% before truncation/ellipsis rules engage (§7 Accessibility).

---

## 4. Spacing & Layout Grid

| Token | Value | Usage |
|---|---|---|
| `space.xs` | 4px | Icon-to-label gaps, chip internal padding |
| `space.sm` | 8px | Internal card padding (compact), gaps between related elements |
| `space.md` | 16px | Standard card padding, screen horizontal margins |
| `space.lg` | 24px | Section spacing, gap between cards in a list |
| `space.xl` | 32px | Major section breaks (e.g., between "Today's Devotion" and "Quick Actions Grid" on Home) |
| `space.xxl` | 48px | Empty-state vertical centering, onboarding screen padding |

- **Screen margins**: 16px horizontal on mobile (`space.md`), max content width 600px on tablet (centered).
- **Grid**: Quick Actions Grid (§02 §1.1) and Style/Type selectors use a responsive grid — 2 columns on phones, 3-4 on tablets, fixed `space.md` gutters.
- **Corner radius**: 12px for cards/buttons/chips, 24px for bottom sheets and modals (per §00 §2), 8px for input fields, full-circle (`999px`) for avatar/icon buttons and the AI badge pill.

---

## 5. Component Library

### 5.1 Core Components

| Component | Spec |
|---|---|
| `PrimaryButton` | Height 52px, radius 12px, `color.primary` fill / `color.surfaceLight` text (light mode); gold variant (`color.accent` fill, `color.textPrimaryLight` text) for "Generate" CTAs; disabled state at 40% opacity |
| `SecondaryButton` | Outlined, 1.5px `color.primary` border, transparent fill, `color.primary` text |
| `VerseCard` | `scripture.body`/`scripture.reference` typography on `color.surfaceLight`/`Dark`, 12px radius, 1px `color.divider` border, optional highlight background (`color.accentSoft` at 30% opacity) when `Highlight` exists |
| `SectionCard` | Renders one of the 15 devotion output sections (§00 §8); header row (icon + `heading.h2` title + collapse chevron), body in `body.regular`; collapsed by default except `lifeApplications`, `prayer`, `actionSteps` |
| `AIGeneratedBadge` | Small pill, gold (`color.accent`) 1px border, `label.small` text "AI Generated", optional info icon opening the AI Disclosure sheet (§01 §8) — see §6 below |
| `LoadingIndicator` | Two variants: (1) standard spinner for short waits; (2) "streaming skeleton" — animated shimmer placeholder for sections of a devotion/sermon still streaming via SSE (§09 §6) |
| `PaywallSheet` | Bottom sheet, 24px top radius, gold-accented header ("Unlock with Premium"), tier comparison table (subset of §11 §2 matrix relevant to the blocked capability), `PrimaryButton` "Upgrade" + `SecondaryButton` "Not now" |
| `StreakBadge` | Flame icon (`color.accent`) + numeral, used on Home and Growth Dashboard |
| `Chip` (selector) | 36px height, 999px radius, `label.small`/`body.medium` text; unselected: `color.surfaceAlt` fill, `color.textSecondary` text; selected: `color.primary` fill, white text — used for Theme/Question Category/Devotion Type selectors |
| `BottomNavBar` | `scaffold_with_nav_bar.dart` (§14) — 5 items per §02 §1, active item in `color.primary` (light) / `color.primaryDarkMode` (dark) with label, inactive in `color.textSecondary` |
| `ActionSheet` (Selection → Action Sheet) | Bottom sheet, 24px radius, list of icon+label rows per §02 §4 pattern — consistent ordering: Generate Devotion, Ask AI, Generate Prayer, Generate Image, Highlight/Note/Bookmark, Cross-References |

### 5.2 Form & Input Components

| Component | Spec |
|---|---|
| `TextField` | 8px radius, `color.surfaceAlt` fill, 1px `color.divider` border (focus: `color.primary` 2px), 48px height |
| `WizardStepper` | Used in Devotion Setup (passage → themes → type → depth, §02 §1.3) — horizontal step dots, current step in `color.primary`, completed in `color.success` |
| `SearchBar` | Persistent in Bible tab, 8px radius, leading search icon, trailing voice-search icon (Phase 2) |

---

## 6. AI-Generated Content Visual Conventions

Per §01 §8 (AI Safety & Biblical Integrity) and §12 §3, every AI-generated surface must be visually distinguishable from Scripture and from user-authored content:

| Element | Treatment |
|---|---|
| AI text output (devotions, prayers, sermons, AI Study answers) | Rendered in **Inter** (UI font) — never Fraunces — inside a `SectionCard`/chat bubble with `AIGeneratedBadge` at the top of the result screen |
| AI-generated images | Visible watermark overlay (per §19 §4 — tier-dependent) + `AIGeneratedBadge` below the image with metadata label always present regardless of tier |
| Scripture quotations *within* AI output | Rendered in `scripture.reference` style (Fraunces, italic) inside a distinct inset blockquote with a thin `color.accent` left border — visually "citing into" the AI text, reinforcing that the AI is referencing Scripture, not generating it |
| Citation validation failure fallback (§06, §18) | Generic fallback content renders with a `color.warning` banner: "We couldn't generate this section accurately — showing general guidance instead" |

---

## 7. Iconography

- **Icon set**: Phosphor Icons (or equivalent open-license outline set), 24px default, 1.5px stroke weight, matching Inter's geometric character.
- **Tab bar icons** (§02 §1): Home (house), Bible (open book), Studio (sparkle/wand), Community (people), Journal (notebook).
- **AI feature icons**: each "engine" gets a consistent icon used across Studio grid, result-screen headers, and notifications — e.g., Devotion Engine = sparkle-on-book, Prayer Generator = praying hands, Image Generator = image-with-sparkle, Sermon Studio = podium/microphone.
- **Custom icons** (not in standard sets): the gold flame for streaks, and the "AI Generated" badge icon (sparkle inside a rounded square) — defined as custom SVG assets in `shared/widgets/ai_generated_badge.dart` (§14).

---

## 8. Motion & Animation

| Interaction | Motion spec |
|---|---|
| Screen transitions | Standard Material/Cupertino adaptive transitions (slide for push, fade for tab switches) — 250ms, ease-in-out |
| AI streaming reveal | Each devotion/sermon section fades + slides up (150ms) as its SSE chunk completes (§09 §6); shimmer skeleton (§5.1) shown for not-yet-streamed sections |
| Bottom sheet (Action Sheet, Paywall, Selection) | Slide up from bottom, 300ms spring curve, scrim fade-in |
| Streak flame increment | Small scale-bounce (1.0 → 1.2 → 1.0, 400ms) + gold particle burst on streak milestone (7/30/100 days) |
| Generate button press | Subtle scale-down (0.97) on press, ripple in `color.accent` for gold CTAs |
| Pull-to-refresh (Bible reader, Community feed) | Standard platform spinner, themed in `color.primary` |

Motion is intentionally restrained — no bouncing/playful animations on Scripture content itself; expressive motion (particle bursts, bounces) is reserved for Growth Dashboard gamification elements, kept away from the Bible reader and devotion text.

---

## 9. Accessibility

| Requirement | Implementation |
|---|---|
| Text scaling | All typography supports OS text-scale up to 130%; `SectionCard` and `VerseCard` reflow (no fixed-height clipping) |
| Color contrast | All text/background combinations meet WCAG AA (4.5:1 for body text, 3:1 for large text ≥18px); `color.accent` (gold) on white fails AA for text, so gold is restricted to icons/badges/borders, never body text on light backgrounds |
| Screen reader labels | Every icon-only button (bottom nav, action sheet rows, AI badge) has a semantic label; AI-generated content regions are wrapped with a "AI-generated content" accessibility announcement before reading the content itself |
| Touch targets | Minimum 44x44px for all interactive elements (chips, icon buttons) |
| Dark mode | Full parity — not just inverted colors but re-tuned contrast (§2.2); respects system setting by default with manual override in Account → Reading Preferences (§02 §1.6) |
| Audio Bible | Provides an accessible alternative to reading for visually-impaired users (§11 §2 — `PLUS`+) |
| Reduced motion | Respects OS "reduce motion" setting — disables shimmer/particle effects, replaces with static states |

---

## 10. Theming Implementation Notes (cross-ref §07, §14)

- All tokens in §2-§4 are defined in `mobile/lib/core/theme/app_colors.dart` (color constants + light/dark `ColorScheme`) and `app_theme.dart` (`ThemeData` for `ThemeMode.light`/`ThemeMode.dark`, including `TextTheme` mapping to §3's type scale).
- Components in §5 are implemented under `mobile/lib/shared/widgets/` (§14) as reusable widgets consumed by every feature — no feature should define its own button/card styling.
- The Admin Portal (§17) reuses the same color tokens and Inter typography (via Tailwind config) but does **not** use Fraunces — the admin surface is purely operational/UI, with no Scripture-display contexts.
