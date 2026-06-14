# 16 — Screen Designs (Figma-Level Specifications)

This document provides text-based, Figma-fidelity specifications for the key screens of the FaithGPT mobile app, derived from the navigation structure (§02) and user journeys (§03). Each screen spec lists: **Purpose**, **Layout** (top-to-bottom regions), **Components** (referencing §15's library), and **States**. All components/colors/typography reference §15 tokens; all data shapes reference §05/`schema.prisma`.

---

## 1. Onboarding — Welcome & Denomination Lens

**Purpose**: First-run experience (Journey 1, §03) — introduces FaithGPT, sets `denominationLens`, and routes to signup.

**Layout**:
1. Full-bleed hero illustration (denomination-neutral, warm gold/navy gradient) + `display.large` headline: "Transforming Scripture into Daily Living"
2. 3-slide carousel (swipeable): (a) "Read & Study Scripture" (Bible tab preview), (b) "AI-Powered Devotions, Prayers & Sermons" (Devotion Engine preview), (c) "Visualize Scripture" (Image Generator preview) — each slide has an `AIGeneratedBadge` on AI-related previews to set expectations early
3. Denomination Lens picker (`Chip` grid, single-select): Non-denominational (default, pre-selected), Baptist, Methodist, Pentecostal, Catholic, Adventist, Presbyterian, Lutheran, Anglican, Other — with helper caption: "This personalizes devotional language. You can change this anytime in Settings."
4. `PrimaryButton` "Get Started" (gold variant) → Signup screen
5. `SecondaryButton` "I already have an account" → Login screen

**States**: None (static); carousel auto-advances every 5s but is swipe-interruptible.

---

## 2. Login & Signup

**Purpose**: Authenticate via §10's 5 `AuthProviderType` methods.

**Layout (Signup)**:
1. App logo + `heading.h1` "Create your account"
2. OAuth buttons stacked: "Continue with Apple" (black, required on iOS per §10 §1), "Continue with Google" (white, Google-branded), "Continue with Facebook" (Facebook blue)
3. Divider "or"
4. Email + Password `TextField`s, password strength indicator (color shifts `color.error` → `color.warning` → `color.success`)
5. Phone OTP alternative: "Use phone number instead" link → phone input + Twilio Verify OTP screen (6-digit code input, 10-min countdown, §10 §6)
6. Terms/Privacy checkbox (required) — ToS acceptance is the GDPR lawful-basis consent record (§12 §5)
7. `PrimaryButton` "Create Account"
8. Footer link: "Already have an account? Log in"

**Layout (Login)**: Same OAuth buttons + email/password fields + "Forgot password?" link (→ Password Reset flow, §10 §7) + `PrimaryButton` "Log In".

**States**:
- Inline validation errors (`color.error`, below each field)
- Loading state on submit (`PrimaryButton` shows spinner, disabled)
- OAuth failure → toast: "Sign-in was cancelled or failed. Please try again."
- Account-linking confirmation modal (when OAuth email matches an existing account, §10 §1): "We found an account with this email — link your Google account to it?"

---

## 3. Home (Dashboard)

**Purpose**: Daily landing screen (§02 §1.1) — surfaces the daily habit loop.

**Layout** (scrollable, top to bottom):
1. App bar: FaithGPT wordmark (left), notification bell icon (right, badge count) → Notification Center, avatar icon (far right) → Account
2. **Daily Verse Card** (`VerseCard`, Fraunces): verse text + reference, with two inline buttons below: "Generate Devotion" (gold `PrimaryButton`, small) and "Generate Image" (`SecondaryButton`, small)
3. **Continue Reading** card: book/chapter thumbnail + "Continue reading {Book} {Chapter}" + progress bar (`color.accentSoft` fill)
4. **Streak Summary** row: three `StreakBadge`s side-by-side (Reading, Prayer, Devotion streaks) with flame icon + day count
5. **Today's Devotion** card: auto-suggested devotion title + first ~2 lines of `lifeApplications` section as a teaser, `AIGeneratedBadge`, tap → Devotion Result
6. **Quick Actions Grid** (2x2, `Chip`-style large tappable cards with icons): New Devotion, Ask AI Bible Study Assistant, Generate Prayer, Create Image
7. **Suggested Reading Plan** card: plan title, day X of Y, "Start Today's Reading" button
8. **Recent Activity** horizontal scroll: last 3 devotions/prayers/images as small cards (thumbnail + title + relative timestamp)

**States**:
- First-run (no activity yet): Quick Actions Grid promoted to top, Streak Summary shows "Start your first streak today" empty state, Recent Activity hidden
- Offline: Daily Verse Card and Continue Reading work from Drift cache (§07 §6); AI quick actions show a subtle offline indicator and queue/disable until reconnect

---

## 4. Bible Reader

**Purpose**: Core Bible reading experience (§02 §1.2, Journey 2 entry point).

**Layout**:
1. App bar: Book/Chapter selector (tap → bottom sheet book/chapter grid), version selector badge (e.g., "KJV ▾" → version picker, parallel-view toggle), audio player icon (chapter narration)
2. Verse list: each verse rendered as `scripture.body` (Fraunces) with `scripture.reference` verse numbers as small superscripts; highlighted verses show `color.accentSoft` background per existing `Highlight` rows
3. Floating audio player bar (when active): play/pause, scrub bar, speed control — sticks to bottom above nav bar
4. Long-press or drag-select on verse(s) → enters **Verse Selection Mode**: selected verses get `color.primary` 10%-opacity overlay + selection handles (single verse, range, or "select chapter"/"select passage" quick actions in a small toolbar)

**Verse Selection → Action Sheet** (triggered from selection toolbar "..." button):
- Bottom sheet (`ActionSheet`, §15 §5.1), title shows selected reference (e.g., "Romans 8:28-39")
- Rows: Generate Devotion, Ask AI about this passage, Generate Prayer, Generate Image, Highlight (color swatches), Note (opens note editor), Bookmark, Cross-References

**Verse Detail Sheet** (tap single verse, no selection):
- Compact bottom sheet: verse text, Cross-References list (tappable, navigates reader), Original Language toggle (Hebrew/Greek interlinear, `PLUS`+), "Ask AI" shortcut button

**States**:
- Loading chapter: skeleton verse-line placeholders
- Offline: only downloaded versions selectable in version picker; non-downloaded versions show a download icon instead of being grayed out
- Audio unavailable for version: audio icon hidden

---

## 5. Devotion Setup Wizard

**Purpose**: Entry to the AI Verse-to-Devotion Engine™ (Journey 2, §02 §1.3).

**Layout**: 4-step `WizardStepper` flow, each step a full screen with "Back"/"Continue" footer buttons:

1. **Passage Selection**: Pre-filled if arriving from Bible selection (shows passage as a `VerseCard` with "Change passage" link); otherwise a search/reference input + recent passages list
2. **Scripture Analysis Result**: Read-only summary card showing detected Themes (`Chip`s, e.g., "Faith", "Suffering", "Hope") and Biblical Elements (`PROMISE`, `CHARACTER_LESSON` tags) from `ScriptureAnalysisCache` — `AIGeneratedBadge` shown since this is AI-derived analysis
3. **Theme Discovery + Devotion Type**: Multi-select `Chip`s for suggested themes (pre-checked from step 2, editable) + a 13-item grid of Devotion Types (§00 §6) as large icon cards, grouped visually by audience (Personal/Family row, Age-specific row, Ministry-context row)
4. **Depth Selector**: 6 `DevotionDepth` options (§00 §7) as a vertical list of cards, each showing label + target length + a lock icon for depths beyond the user's tier (tap shows `PaywallSheet`)

Final screen footer: `PrimaryButton` "Generate Devotion" (gold) → navigates to Devotion Result screen, which immediately begins streaming.

**States**:
- Step 2 loading: shimmer skeleton over theme/element chips while `ScriptureAnalysisCache` resolves (cache hit is near-instant; miss triggers AI call, §06)
- Depth locked for tier: tapping shows `PaywallSheet` with the §11 §2 comparison for "Devotion depth" row highlighted

---

## 6. Devotion Result

**Purpose**: Display the 15-section structured devotion output (Journey 2 climax).

**Layout**:
1. App bar: passage reference + Devotion Type/Depth subtitle, share icon, "..." menu (Regenerate, Adjust Tone, Delete)
2. Hero: devotion `title` (`display.large`, Fraunces) + `keyScripture` as a `VerseCard`
3. 15 `SectionCard`s in canonical order (§00 §8): `historicalContext`, `biblicalContext`, `verseExplanation`, `theologicalInsights`, `spiritualLessons`, `lifeApplications`, `reflectionQuestions`, `discussionQuestions`, `prayer`, `actionSteps`, `memoryVerse`, `relatedScriptures`, `closingEncouragement` — `lifeApplications`/`prayer`/`actionSteps` expanded by default, rest collapsed
4. Each `SectionCard` with `AIGeneratedBadge`; Scripture quotations within sections rendered per §15 §6 (Fraunces blockquote, gold left border)
5. `relatedScriptures` section renders each reference as a tappable chip → navigates to Bible Reader at that reference
6. Sticky bottom action bar: "Generate Matching Artwork" (→ Image Generator pre-filled with `ImageSourceType=DEVOTION`), "Save to Journal", "Share"
7. Per-section "Regenerate this section" icon button (small, top-right of each `SectionCard`) — `PREMIUM`+/`PLUS`+ per §11 §2 "Per-section regenerate"

**States**:
- **Streaming** (initial generation): sections appear progressively top-to-bottom as SSE chunks arrive (§09 §6); not-yet-arrived sections show shimmer skeleton with section title already visible (titles arrive first in the stream)
- **Citation validation failure** (§06/§18): affected section shows `color.warning` banner ("showing general guidance instead") in place of the failed content
- **Cached/already-generated**: loads instantly from `Devotion` row, no streaming animation

---

## 7. AI Bible Study Assistant™ — Chat

**Purpose**: Conversational Q&A interface (§02 §1.3).

**Layout**:
1. App bar: conversation title (auto-generated from first question) or "New Conversation", history icon → Conversation List
2. Question Category Chips row (horizontal scroll, sticky below app bar): 11 categories (§00 §12) as `Chip`s — tapping a chip with no message pre-fills an input template (e.g., "Explain ___ in simple terms")
3. Chat scroll area:
   - User messages: right-aligned, `color.primary` bubble, white text
   - AI messages: left-aligned, `color.surfaceAlt` bubble, `AIGeneratedBadge` at top of bubble, Structured Answer Card format (category label, answer body with inset Scripture quotes per §15 §6, citation chips for `relatedScriptures`)
   - Each AI message footer: "Generate Devotion from this answer" link + thumbs-up/down feedback icons (feeds §12 quality tracking)
4. Input bar (bottom, above nav bar): text field + send button; category chip selection shown as a removable tag above the input when active

**States**:
- Free-tier quota reached (5/day): input bar replaced with a banner "You've used today's 5 free questions" + `PrimaryButton` "Upgrade for unlimited" → `PaywallSheet`
- AI streaming: assistant bubble shows animated "thinking" dots, then streams text token-by-token
- Crisis-resource intercept (§12 §3): if pre-generation filter flags self-harm signals, AI bubble is replaced with a crisis-resources card (hotline numbers, "talk to someone" CTA) instead of normal generation

---

## 8. AI Prayer Generator — Result

**Purpose**: Display generated prayer (Journey 5, §02 §1.3).

**Layout**:
1. Setup (single screen, not wizard): Source Selector (`Chip`s: Verse / Devotion / Topic — topic shows a free-text input), Prayer Type Selector (9 types, `Chip` grid, locked types show paywall lock per tier)
2. Result screen: `display.medium` title (e.g., "A Prayer for Healing"), prayer body in `body.regular` with `AIGeneratedBadge`, source reference shown as a `VerseCard` above the prayer if source was a verse
3. Bottom action bar: "Save to Journal", "Share", "Generate Image" (→ Image Generator, `ImageSourceType=PRAYER`), "Generate Another" (regenerate)

**States**: Same streaming/quota patterns as Devotion Result and Chat (5/day on `FREE` per §11 §2).

---

## 9. Sermon Studio — Result

**Purpose**: AI Sermon Assistant output (Journey 4, `PREMIUM`+ per §11 §2).

**Layout**:
1. Setup screen: Passage/Topic input, Audience Selector (`Chip`s: General Congregation, Youth, Children, Small Group, New Believers), Output Type selector (Sermon, Sabbath School Lesson, Bible Study Guide, Youth Message, Children's Message, Teaching Notes, Slide Outline)
2. Result screen: outline-style layout — collapsible tree view (Introduction, Main Points 1-N each with sub-points/illustrations/Scripture refs, Conclusion, Altar Call/Application) using nested `SectionCard`s with indentation
3. Each main point card includes a "suggested illustration" sub-block and Scripture references as tappable chips
4. Bottom action bar: "Export PDF", "Export to Slides" (Phase 2), "Generate Image for slides", "Save to Journal"

**States**: `PaywallSheet` shown immediately if user is below `PREMIUM` (Sermon Studio is `—` for `FREE`/`PLUS` per §11 §2), rather than after generation.

---

## 10. AI Scripture Image Generator™

**Purpose**: Visual Studio entry point (§02 §1.3, §19).

**Layout**:
1. Source Selector (`Chip`s, 8 `ImageSourceType` values, §00 §11) — selecting "Verse"/"Chapter" opens a passage picker; "Custom Prompt" reveals a text input
2. Style Selector: 10 `ImageStyle` grid (§00 §10), each cell shows a small preview thumbnail + label; locked styles (per §11 §2 "Image styles available") show a lock badge
3. Prompt Preview/Edit: read-only generated prompt text with an "Edit prompt" toggle (advanced users) — edits still pass through the §19 §1 pre-filter
4. `PrimaryButton` "Generate" (gold) → loading state (progress bar with estimated time, §19 cost/perf targets)
5. Result Gallery: generated image(s) in a grid (1-4 variations depending on tier), each with `AIGeneratedBadge` + watermark overlay (§19 §4), tap → full-screen viewer with Save/Share/Set as Wallpaper actions

**States**:
- Monthly quota reached (§11 §2 "Image generations"): Generate button replaced with `PaywallSheet` trigger showing remaining quota ("0 of 5 remaining this month")
- Moderation flag (§19 §6): if output fails NSFW/violence classifier, result slot shows a "This image couldn't be generated — try a different style or prompt" message instead of the image

---

## 11. AI Bible Story Visualizer™ — Sequence Viewer

**Purpose**: Multi-frame story visualization (§02 §1.3, §19 specializations).

**Layout**:
1. Story Picker: curated grid of Bible stories (Noah's Ark, Exodus, David & Goliath, Daniel, Good Samaritan, Prodigal Son, Birth of Jesus, Crucifixion, Resurrection, etc.) — each a card with thumbnail + title
2. Output Type selector (`Chip`s): Storyboard, Comic, Children's Storybook, Teaching Slides — availability per §11 §2 ("Storyboard, Children's Book" on `PLUS`; full set on `PREMIUM`+)
3. Sequence Viewer: horizontal page-view (swipeable) of `StoryboardFrame`s — each frame shows generated image (full width) + caption/narration text below in `scripture.reference` style for Scripture-derived captions or `body.regular` for narrative bridges
4. Page indicator dots; bottom bar: "Save All to Journal", "Share Sequence", "Export as PDF" (Children's Storybook/Teaching Slides output types)

**States**: Frame-by-frame generation progress shown as sequential loading (frame 1 appears, then frame 2, etc.) since story sequences generate iteratively (§19).

---

## 12. Memory Verse Visualizer™ — Card Gallery

**Purpose**: Shareable verse cards (§02 §1.3, §19 specializations).

**Layout**:
1. Verse Picker (search or "from my highlights/bookmarks")
2. Format Selector (`Chip`s, 5 `MemoryCardFormat` values per §11 §2: Flashcard, Wallpaper, Lock Screen, Children's Card, Printable — `FREE` limited to Flashcard/Wallpaper)
3. Card Gallery: grid of generated card previews per format/style combination, each showing verse text overlaid on generated artwork in `scripture.body` typography
4. Tap a card → full-screen preview with Save/Share/"Set as Wallpaper" (deep OS integration where platform allows)

**States**: Same paywall-lock pattern for format chips beyond tier.

---

## 13. Journal

**Purpose**: Personal saved-content hub (§02 §1.5).

**Layout**:
1. App bar: "Journal" title, filter icon (by `JournalEntryType`: Note/Devotion/Prayer/Testimony/Insight/Answered Prayer), search icon
2. Entry list: each row shows type icon, title/preview text, relative timestamp, and a small thumbnail if image-linked
3. Tap entry → Entry Detail/Editor: full content view (read-only for AI-sourced entries, editable for user Notes/Testimonies), source link ("View original devotion/prayer"), tags
4. Floating action button "+" → New Entry (manual note/testimony)
5. "Answered Prayers" filter surfaces `PrayerRequest.isAnswered=true` entries with a `color.success` checkmark badge

**States**: Empty state (no entries): illustration + "Save devotions, prayers, and your own reflections here" + CTA to Studio.

---

## 14. Spiritual Growth Dashboard™

**Purpose**: Gamified progress overview (§02 §1.5).

**Layout**:
1. Header: large streak displays (Reading/Prayer/Devotion) with flame animations (§15 §8) and "longest streak" sub-labels
2. Stats grid (2x3): chapters read, books completed, devotions generated, memory verses saved, study minutes, prayers generated — each a card with icon + number + small trend sparkline
3. Achievements section: horizontal scroll of badge icons (locked badges grayed out with progress ring, e.g., "14/30 days")
4. Weekly/Monthly Growth Report card: summary text ("This week you read 5 chapters...") + "View full report" → detail screen with charts (Recharts-equivalent for Flutter, e.g., `fl_chart`)

**States**: New users see all stats at 0 with encouraging copy ("Every journey starts with day one") rather than a blank/empty look.

---

## 15. Community Feed

**Purpose**: Social layer (§02 §1.4).

**Layout**:
1. Tabs: Feed | Prayer Wall | Groups | Friends
2. Feed: vertical list of `CommunityPost` cards — author avatar/name, post type icon (devotion share/testimony/insight/image), content preview (image posts show the generated image with `AIGeneratedBadge`; devotion shares show title + excerpt), like/comment counts, relative timestamp
3. Prayer Wall: list of `PrayerRequest` cards (visibility=GROUP/PUBLIC) with "🙏 Praying" tap-to-increment counter and "Mark as Answered" (own requests only)
4. Post Composer (floating action button): type selector (devotion/testimony/prayer/image share), content picker from My AI Library, caption input, visibility selector

**States**: Flagged content (`moderationStatus=FLAGGED`) is hidden from feed for all users except the author (who sees a "Under review" label) and `MODERATOR`s.

---

## 16. Paywall Sheet

**Purpose**: Universal upgrade prompt (Journey 8, §02 §1.6, §11 §7).

**Layout**:
1. Bottom sheet, 24px top radius, gold-accented header icon + `heading.h1` "Unlock with {Tier}" (dynamically PLUS or PREMIUM based on the blocked capability)
2. Context line: "{Capability} requires {Tier}" (e.g., "Sermon Studio requires Premium")
3. Mini comparison table: 3-4 rows from §11 §2 most relevant to the blocking capability, current tier vs. recommended tier, with checkmarks/numbers
4. Plan toggle: Monthly / Annual (annual shows "Save 33%" gold tag)
5. `PrimaryButton` "Start 7-Day Free Trial" (or "Upgrade Now" if no trial eligible) — gold
6. `SecondaryButton` "Not now" (dismiss)
7. Fine print: trial terms, auto-renewal disclosure (App Store/Play Store compliance)

**States**: If user is `PAST_DUE`/`EXPIRED` (§11 §8), header changes to "Reactivate {Tier}" with a "Resume your subscription" framing instead of "Unlock".

---

## 17. Account & Settings

**Purpose**: Profile/subscription/privacy hub (§02 §1.6).

**Layout**: Grouped list (iOS-style settings list), sections:
1. **Profile**: avatar, name, email/phone, denomination lens (re-openable picker), default Bible version
2. **Subscription**: current plan badge (gold if paid), "Manage Subscription" → billing history (`Invoice` list) + upgrade/downgrade
3. **Notifications**: toggles per `NotificationType`, transactional ones shown but disabled (always-on)
4. **Reading Preferences**: font size slider, theme (Light/Dark/System segmented control)
5. **Privacy & Data**: "Download My Data" (triggers async export job, §12 §5), "Delete Account" (14-day soft-delete flow with confirmation modal explaining the grace period)
6. **Offline Content Manager**: list of downloaded Bible versions with size + delete-to-free-space
7. **Ministry/Organization** (if `OrganizationMember`): org name, role, seat info, "Open Org Console" (for `MINISTRY_ADMIN`)
8. **Help & Support**, **About/Legal** (AI Disclosure statement — links to §01 §8 principles in user-facing language, Theological Statement, Terms, Privacy Policy)
9. **Active Sessions** (§10 §3): list of devices with "Log out" per device + "Log out everywhere"
10. "Log Out" button (destructive style, `color.error` text on plain background)

**States**: `MINISTRY_ADMIN`-only Org Console section hidden for regular `USER`s; "Active Sessions" shows current device tagged "This device".

---

## 18. Notification Center

**Purpose**: In-app notification list, reached from Home bell icon.

**Layout**: Chronological list grouped by day, each row: type icon (mapped from `NotificationType`), title/body text, relative timestamp, unread indicator (gold dot). Tapping navigates per the notification's deep link (§02 §4 deep linking schemes — e.g., streak-at-risk → Home, devotion-ready → Devotion Result, prayer-wall-response → Community Prayer Wall).

**States**: Empty state: "You're all caught up" illustration. Marketing-type notifications visually distinguished with a small "Offer" tag (gold) vs. transactional (no tag).
