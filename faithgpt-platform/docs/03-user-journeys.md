# 03 — User Journeys

End-to-end flows for the personas defined in §01 PRD §3, mapped to the navigation defined in §02 Information Architecture. Each journey lists: trigger → steps → screens touched → data created → success state.

---

## Journey 1 — New Believer Onboarding ("Tariq", 19)

**Trigger:** Downloads app from App Store after seeing a FaithGPT-generated Instagram post.

1. **Splash → Welcome carousel** (3 slides: "Read", "Understand & Create", "Grow") — communicates AI Safety/Biblical Integrity promise on slide 2.
2. **Sign up** — email or Apple/Google one-tap (§10 Auth).
3. **Onboarding questionnaire**: faith stage ("New to faith" / "Growing" / "Mature" / "Leader"), denomination lens (optional, default "Neutral"), preferred Bible version, notification opt-in, daily reminder time.
4. **Personalized Home** generated: a "Getting Started" reading plan ("7 Days to Know Jesus") is auto-enrolled; Today's Devotion is pre-generated at `QUICK` depth, `PERSONAL` type, from Day 1 passage.
5. User reads Day 1 passage in **Bible Reader**, taps **Today's Devotion** card → **Devotion Result** (Quick).
6. CTA at bottom: "Don't understand something? Ask AI" → **Bible Study Assistant** with `SIMPLE_EXPLANATION` chip pre-selected for the day's key verse.
7. User taps **Save to Journal** on the devotion.

**Data created:** `User`, `UserReadingPlan` (Getting Started), `Devotion` (Quick/Personal), `JournalEntry` (type=DEVOTION), `UserStreak` (READING, DEVOTION = 1).
**Success state:** User completes Day 1 within first session; push notification scheduled for Day 2.

---

## Journey 2 — Verse-to-Devotion Flagship Flow ("Ama", 28, Everyday Believer)

**Trigger:** Opens app for daily devotion time, selects **Romans 8:28** in the Bible Reader.

1. **Bible → Reader**: long-press verse 28, drag to extend selection through 8:39 (passage selection).
2. **Action Sheet** appears → taps **"Generate Devotion"**.
3. **Scripture Analysis Engine** runs (cache-checked via `scripture_analysis_cache`): detects themes — *Trusting God's Plan, Purpose Through Pain, Hope During Difficult Times, God's Sovereignty, Faith Under Pressure, Spiritual Perseverance* — and biblical elements (`PROMISE`: v28, `BLESSING`: v31-39).
4. **Theme Discovery screen**: Ama multi-selects "Purpose Through Pain" and "God's Sovereignty."
5. **Type & Depth selector**: chooses `PERSONAL`, `STANDARD` (5 min).
6. AI Gateway streams the **Devotion Result** (15 canonical sections, §00 §8) — title e.g. "When Life Doesn't Make Sense: Finding Purpose in Romans 8:28."
7. Ama reads through; taps **"Generate Matching Artwork"** → Visual Studio pre-filled with `sourceType=DEVOTION`, suggested style `MINIMALIST_POSTER`.
8. Picks style, generates image, saves to Photos and sets as phone wallpaper.
9. Taps **Save to Journal**, then **Share** → posts to Community feed (`CommunityPost.type=DEVOTION_SHARE`).

**Data created:** `Devotion`, `DevotionTheme` ×2, `ImageGeneration`, `JournalEntry`, `CommunityPost`, `AIUsageLog` ×2 (devotion + image), `SpiritualStat.totalDevotions += 1`.
**Success state:** Devotion generated < 8s P95 (streamed, first section visible < 2s); image generated < 20s P95.

---

## Journey 3 — Family Worship with Children's Story Visualizer ("David", 38, Parent)

**Trigger:** Family worship time; David wants to teach "David and Goliath" to his kids (ages 5 & 8).

1. **Studio → AI Bible Story Visualizer™** → selects "David and Goliath" from curated story catalog.
2. **Output Type**: "Children's Book."
3. **Style**: `CHILDRENS_STORYBOOK`.
4. System generates a 6–8 frame storyboard, each frame = one `StoryboardFrame` + linked `ImageGeneration`, with captions written at a children's reading level.
5. David taps **"Generate Devotion"** from the story result, selects `DevotionType=FAMILY`, `Depth=QUICK`.
6. Family Devotion Result includes simplified "Spiritual Lessons" and "Reflection Questions" tailored for ages 5-8 (template variant uses age-appropriate language — see §18 prompt design).
7. After worship, David saves the storybook images to the family's shared **Journal** entry (type=`TESTIMONY`, "Friday Family Worship") and marks the devotion complete in the **Growth Dashboard**.

**Data created:** `BibleStoryVisualization`, `StoryboardFrame` ×6-8, `ImageGeneration` ×6-8, `Devotion` (FAMILY/QUICK), `JournalEntry`.
**Success state:** Full storybook + family devotion ready in under 2 minutes total.

---

## Journey 4 — Sermon Prep ("Pastor Linda", 52)

**Trigger:** Preparing Sunday's sermon on Philippians 4:6-7 ("Do not be anxious").

1. **Studio → Sermon Studio** → enters passage `Philippians 4:6-7`, audience = "General Congregation."
2. **Output type**: "Sermon" (full outline).
3. AI generates: Sermon Title options (3 suggestions), Introduction, 3 Main Points (each with sub-points + cross-references), Illustrations (2 per point), Application section, Altar Call.
4. Linda edits Main Point 2 inline (rich text editor), regenerates just the "Illustrations" subsection via a per-section **"Regenerate this section"** control.
5. Taps **"Generate Matching Artwork"** for a **Cinematic** style title slide background (sourceType=`SERMON`).
6. Exports the sermon as a **Teaching Notes PDF** and a **Slide Outline** (titles + key points per slide, ready to paste into PowerPoint/Keynote).
7. Shares the sermon outline to her **Ministry organization's Group** (Ministry plan feature) so co-pastors can review.

**Data created:** `Sermon` (outline JSON with edited content + version history), `ImageGeneration` (CINEMATIC), `CommunityPost` (in Ministry group).
**Success state:** Complete sermon draft ready in < 10 minutes vs. hours manually.

---

## Journey 5 — Daily Prayer with AI Prayer Generator ("Kwame", 45, Small Group Leader)

**Trigger:** Wants to pray for his small group before their weekly meeting.

1. **Studio → AI Prayer Generator** → source = "Topic," enters "guidance for my small group this week," type = `INTERCESSORY`.
2. AI generates a Scripture-grounded intercessory prayer (cites 2–3 supporting verses inline).
3. Kwame taps **"Generate Image"** → `SOCIAL_MEDIA_GRAPHIC` style with the prayer's key verse — shares to the group chat outside the app.
4. Taps **Save to Journal** (type=`PRAYER`).
5. Later, after the meeting, Kwame logs a **Prayer Request** from a group member (visibility=`GROUP`) and, the following week, marks it **Answered** (`isAnswered=true`, `answeredNote`).

**Data created:** `Prayer`, `ImageGeneration`, `JournalEntry`, `PrayerRequest` (created then updated), `UserStreak` (PRAYER).
**Success state:** Answered prayer appears in **Growth Dashboard → Answered Prayers** with a celebratory badge.

---

## Journey 6 — Memorization with Memory Verse Visualizer ("Naomi", 24, Youth Leader)

**Trigger:** Assigns this week's memory verse (Philippians 4:13) to her Pathfinder group.

1. **Bible Reader** → selects Philippians 4:13 → Action Sheet → **"Memory Verse Visualizer"**.
2. Generates 3 formats in one flow: `FLASHCARD` (for in-app review/spaced repetition), `WALLPAPER` (gold/royal-blue minimalist), and `PRINTABLE` (PDF grid of cards for the whole group).
3. Shares the printable PDF to the group via **Community → Group → Pathfinder Group → Post**.
4. Each Pathfinder member who has the app can add the same verse to **My Flashcards** and review via spaced-repetition prompts (push notifications) — completions increment `SpiritualStat.totalMemoryVerses`.

**Data created:** `MemoryVerseCard` ×3 (+ `ImageGeneration` for wallpaper/printable/flashcard art), `CommunityPost`.
**Success state:** Group members' memory verse counts visible to Naomi via group analytics (Ministry feature).

---

## Journey 7 — Content Creator Daily Post ("Joseph", 31)

**Trigger:** Needs today's Instagram post for his Christian page.

1. **Studio → Christian Content Creator™** → template = "Quote Card."
2. Source = "Today's Verse" (auto-suggested from his reading plan) — Psalm 23:1.
3. Style = `SOCIAL_MEDIA_GRAPHIC`, brand colors auto-applied from his saved brand kit (Premium feature).
4. AI proposes 3 layout variants; Joseph picks one, edits the accompanying caption text (AI-suggested caption + hashtags, clearly labeled "AI-suggested").
5. Exports at Instagram (1080×1080) and Stories (1080×1920) dimensions simultaneously.
6. Posts to his **Community** feed and externally via native share sheet.

**Data created:** `ImageGeneration` ×2 (two dimensions), `CommunityPost` (type=`IMAGE_SHARE`).
**Success state:** Export-ready assets in both dimensions in < 30 seconds.

---

## Journey 8 — Subscription Upgrade Flow ("Ama", hitting Free tier limits)

**Trigger:** Ama has used her 3 free Deep-Study devotions this month (see §11 Subscription System for limits) and attempts a 4th.

1. Tapping **"Deep Study"** depth on a `FREE` account surfaces a **Paywall Sheet**: "Deep Study & Advanced devotions are part of FaithGPT Plus" with a feature comparison (Free vs Plus vs Premium table from §11).
2. Ama selects **Plus — Annual ($39.99/yr, save 33%)**.
3. **Apple In-App Purchase** sheet (or Stripe Checkout on web) completes payment.
4. `Subscription.tier` updates to `PLUS` via webhook (App Store Server Notifications / Stripe webhook → Subscription service, §08/§11).
5. Paywall dismisses; the Deep Study devotion generates immediately; confirmation toast: "Welcome to FaithGPT Plus 🎉."
6. **Account → Subscription** now shows plan, renewal date, and "Manage Subscription" (deep-links to App Store/Play subscription management).

**Data created:** `Subscription` (tier=PLUS, status=ACTIVE, provider=APPLE_IAP), `Invoice`.
**Success state:** Upgrade-to-unlock latency < 3s; no loss of in-progress generation context.

---

## Journey 9 — Ministry Onboarding ("Grace Chapel" Admin)

**Trigger:** Church admin signs up for a Ministry plan to equip 25 staff/volunteers.

1. Signs up, selects **Ministry** tier during onboarding, enters organization name "Grace Chapel," seat count = 25.
2. Completes payment (annual invoice via Stripe, `BillingProvider=STRIPE`) → `Organization` + `Subscription` (organizationId set) created.
3. Admin Portal-lite "Org Console" (within mobile app, gated to `MINISTRY_ADMIN` role): invites staff by email (creates `OrganizationMember` rows, sends invite notifications).
4. Each invited staff member signs up; their `User.role` can be elevated to `GROUP_LEADER` for group management.
5. Org Console shows aggregate usage: devotions generated, images generated, top themes studied — feeding the same data model as Admin Portal's AI Analytics (§17), filtered to `organizationId`.

**Data created:** `Organization`, `Subscription` (organizationId), `OrganizationMember` ×N, `Notification` (invites).
**Success state:** All 25 seats activated within first week; org-level usage dashboard populated.
