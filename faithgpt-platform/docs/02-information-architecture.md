# 02 — Information Architecture

This document defines the navigational structure of the FaithGPT mobile app, the Admin Portal, and the content taxonomy that underpins both. It is the spine for §15 (UI/UX Specifications), §16 (Screen Designs), §17 (Admin Portal Design), and §14 (Flutter Project Structure).

---

## 1. Mobile App — Top-Level Navigation (Bottom Tab Bar)

Five persistent tabs. Each tab is a separate navigation stack (Flutter `go_router` branch — see §14).

```
┌─────────┬─────────┬──────────┬───────────┬─────────┐
│  Home   │  Bible  │  Studio  │ Community │ Journal │
│  🏠     │  📖     │  ✨ (AI) │  👥       │  📓     │
└─────────┴─────────┴──────────┴───────────┴─────────┘
```

Account/Settings is reached via an avatar icon in the top-right app bar on every tab (not a bottom tab) — see §1.6.

---

### 1.1 Home (Dashboard)

```
Home
├── Daily Verse Card (with "Generate Devotion" / "Generate Image" quick actions)
├── Continue Reading (last Bible position)
├── Streak Summary (Reading / Prayer / Devotion streaks)
├── Today's Devotion (auto-suggested, tap → Devotion Result)
├── Quick Actions Grid
│   ├── New Devotion
│   ├── Ask AI Bible Study Assistant
│   ├── Generate Prayer
│   └── Create Image
├── Suggested Reading Plan
├── Recent Activity (last 3 devotions/prayers/images)
└── Notifications bell → Notification Center
```

### 1.2 Bible

```
Bible
├── Reader (Book → Chapter → Verse view)
│   ├── Version Selector (parallel view toggle)
│   ├── Audio Player (chapter narration)
│   ├── Verse Selection Mode (single / range / chapter / passage)
│   │   └── Selection Action Sheet
│   │       ├── Generate Devotion
│   │       ├── Ask AI about this passage
│   │       ├── Generate Prayer
│   │       ├── Generate Image
│   │       ├── Highlight / Note / Bookmark
│   │       └── Cross-References
│   └── Verse Detail Sheet (tap single verse)
│       ├── Cross-References
│       ├── Original Language (Hebrew/Greek)
│       └── "Ask AI" shortcut
├── Search (full text, by reference, by theme)
├── Reading Plans
│   ├── Plan Library (by category)
│   ├── My Plans (active/completed)
│   └── Plan Detail → Daily Reading → Reader
├── Highlights / Notes / Bookmarks (tabs)
└── Downloads (offline version management)
```

### 1.3 Studio (AI Hub)

The Studio tab is the entry point to every generative tool, organized as a grid of "engines."

```
Studio
├── AI Verse-to-Devotion Engine™
│   ├── Passage Selector (or carried over from Bible selection)
│   ├── Scripture Analysis Result (themes + biblical elements)
│   ├── Theme Discovery (suggested themes, multi-select)
│   ├── Devotion Type Selector (13 types)
│   ├── Depth Selector (Quick/Standard/Deep/Advanced/Teaching/Sermon)
│   └── Devotion Result Screen
│       ├── 15-section structured output
│       ├── "Generate Matching Artwork" → Image Generator (pre-filled)
│       ├── "Save to Journal"
│       ├── "Share"
│       └── "Regenerate" / "Adjust Tone"
│
├── AI Bible Study Assistant™
│   ├── Conversation List
│   └── Chat Screen
│       ├── Question Category Chips (Meaning, Simple, Children's, Historical, Cultural, Modern, Hebrew, Greek, Cross-Refs, Characters, Christ Connection)
│       ├── Structured Answer Cards (with citations)
│       └── "Generate Devotion from this answer"
│
├── AI Prayer Generator
│   ├── Source Selector (verse/devotion/topic)
│   ├── Prayer Type Selector (9 types)
│   └── Prayer Result → Save / Share / Generate Image
│
├── Sermon Studio (AI Sermon Assistant)
│   ├── Passage/Topic Input
│   ├── Audience Selector
│   ├── Output Type (Sermon, Sabbath School Lesson, Bible Study Guide, Youth Message, Children's Message, Teaching Notes, Slide Outline)
│   └── Sermon Result → Outline view → Export (PDF/Slides)
│
├── Visual Studio
│   ├── AI Scripture Image Generator™
│   │   ├── Source Selector (Verse/Chapter/Story/Devotion/Prayer/Sermon/Custom)
│   │   ├── Style Selector (10 modes)
│   │   ├── Prompt Preview/Edit
│   │   └── Result Gallery → Save/Share/Set as Wallpaper
│   ├── AI Bible Story Visualizer™
│   │   ├── Story Picker (curated list: Noah's Ark, Exodus, David & Goliath, etc.)
│   │   ├── Output Type (Storyboard/Comic/Storybook/Teaching Slides)
│   │   └── Sequence Viewer
│   ├── Memory Verse Visualizer™
│   │   ├── Verse Picker
│   │   ├── Format Selector (Flashcard/Wallpaper/Lock Screen/Children's Card/Printable)
│   │   └── Card Gallery
│   └── Christian Content Creator™
│       ├── Template Picker (Flyer, Poster, Quote Card, Banner, Social Post...)
│       ├── Source/Theme Input
│       └── Result Editor (basic text/logo overlay) → Export
│
└── My AI Library
    ├── My Devotions
    ├── My Prayers
    ├── My Sermons
    ├── My Images
    └── My Conversations
```

### 1.4 Community

```
Community
├── Feed (Devotion shares, testimonies, insights, image shares)
├── Prayer Wall (PrayerRequests with visibility=GROUP/PUBLIC)
├── Groups
│   ├── My Groups
│   ├── Discover Groups
│   └── Group Detail
│       ├── Group Feed
│       ├── Members
│       ├── Group Prayer Wall
│       └── Group Reading Plan (Ministry feature)
├── Friends (Follow/Following)
└── Post Composer (share devotion/testimony/prayer/image)
```

### 1.5 Journal & Growth

```
Journal
├── All Entries (filter by type: Note/Devotion/Prayer/Testimony/Insight/Answered Prayer)
├── Entry Detail / Editor
├── Answered Prayers (PrayerRequest.isAnswered=true)
└── Spiritual Growth Dashboard™
    ├── Streaks (Reading/Prayer/Devotion)
    ├── Stats (chapters read, books completed, devotions, memory verses, study minutes)
    ├── Achievements / Badges
    └── Weekly/Monthly Growth Report
```

### 1.6 Account & Settings (via avatar icon)

```
Account
├── Profile (name, avatar, denomination lens, default Bible version)
├── Subscription (current plan, upgrade, billing history)
├── Notification Preferences
├── Reading Preferences (font, theme: light/dark/system)
├── Privacy & Data (export data, delete account)
├── Offline Content Manager
├── Ministry/Organization (if member — seat info)
├── Help & Support
└── About / Legal (AI Disclosure, Theological Statement, Terms, Privacy Policy)
```

---

## 2. Admin Portal — Top-Level Navigation

```
Admin Portal (admin.faithgpt.app)
├── Dashboard (KPIs overview)
├── User Management
│   ├── Users (search, view, suspend, role change)
│   └── Organizations (Ministry accounts, seats)
├── Subscription Management
│   ├── Plans & Pricing
│   ├── Active Subscriptions
│   └── Invoices/Refunds
├── Financial Dashboard
│   ├── Revenue (MRR/ARR, by tier)
│   ├── AI Cost vs Revenue
│   └── Churn/LTV
├── AI Analytics
│   ├── Usage by Feature (Devotion/Study/Prayer/Sermon/Image)
│   ├── Usage by Tier/User
│   └── Quality Feedback (thumbs up/down rates)
├── AI Usage Monitoring
│   ├── Real-time request volume
│   ├── Latency & error rates
│   └── Cost alerts / rate-limit triggers
├── Image Generation Analytics
│   ├── Generations by Style/Source
│   ├── Moderation Queue
│   └── Cost per Image
├── Bible Translation Management
│   ├── Versions (add/sync translations)
│   └── Cross-Reference Data
├── Devotion Template Management
│   ├── Templates by Type × Depth
│   └── Prompt Versioning / A-B Testing
├── Content Moderation
│   ├── Flagged Community Posts/Comments
│   └── Flagged Images
├── Community Moderation
│   ├── Groups oversight
│   └── User reports
├── Notification Center
│   ├── Campaign Composer (push/in-app)
│   └── Scheduled Notifications
└── Settings
    ├── Admin Roles & Permissions
    ├── Feature Flags
    └── Audit Log
```

---

## 3. Content Taxonomy (cross-reference to §00 and §05)

| Taxonomy | Source of truth | Used by |
|---|---|---|
| Bible Books/Chapters/Verses/Translations | `bible_books`, `bible_verses`, `verse_texts` | Bible tab, all AI tools (passage selection) |
| Themes (Faith, Hope, Love, ...) | `themes` | Theme Discovery, Devotion tagging, Community feed filters |
| Biblical Elements (Command/Promise/...) | `ScriptureElementTag` | Scripture Analysis result display |
| Devotion Types (13) | `DevotionType` enum | Studio → Devotion Engine type selector |
| Devotion Depths (6) | `DevotionDepth` enum | Studio → Devotion Engine depth selector |
| Image Styles (10) | `ImageStyle` enum | Visual Studio style selector |
| Image Source Types (8) | `ImageSourceType` enum | Visual Studio source selector |
| AI Question Categories (11) | `AIQuestionCategory` enum | Bible Study Assistant chips |
| Prayer Types (9) | `PrayerType` enum | Prayer Generator selector |
| Curated Bible Stories | Story catalog (admin-managed list, e.g. Noah's Ark, Exodus, Daniel, David & Goliath, Good Samaritan, Prodigal Son, Birth of Jesus, Crucifixion, Resurrection) | Story Visualizer picker |

---

## 4. Cross-Cutting Navigation Patterns

- **"Selection → Action Sheet" pattern**: Any Scripture selection (single verse, range, chapter, passage) anywhere in the app surfaces the same action sheet (Generate Devotion / Ask AI / Generate Prayer / Generate Image / Highlight / Note / Bookmark / Cross-References). This is the primary "everything connects to everything" mechanic.
- **"Generate Matching Artwork" pattern**: Any AI output (devotion, prayer, sermon) surfaces a persistent CTA into the Visual Studio with source/style pre-filled.
- **"Save to Journal" pattern**: Any AI output and any Bible note can be saved to the Journal with one tap, creating a `JournalEntry` linked to its source.
- **Deep linking**: `faithgpt://bible/<book>/<chapter>/<verse>`, `faithgpt://devotion/<id>`, `faithgpt://image/<id>`, `faithgpt://group/<id>` — used for notifications, sharing, and widget taps.
