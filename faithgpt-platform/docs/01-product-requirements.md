# 01 — Product Requirements Document (PRD)

**Product:** FaithGPT™
**Tagline:** "Transforming Scripture into Daily Living"
**Founder:** Frank Adu Poku
**Document owner:** Product Strategy
**Status:** v1.0 — Foundational PRD for production build

---

## 1. Vision

FaithGPT is the AI-native operating system for personal and corporate Christian discipleship. It fuses a full-featured Bible (text, audio, study tools) with an AI layer that turns any passage into devotions, prayers, sermons, lessons, and visual content — while keeping Scripture and AI commentary clearly separated, citable, and theologically responsible.

Where existing Bible apps answer **"what does the Bible say?"**, FaithGPT answers **"what does it mean, how do I apply it, how do I pray it, teach it, visualize it, and live it?"**

**North star:** Every believer who opens FaithGPT leaves having read Scripture, understood it more deeply, and taken one concrete spiritual action (prayer, application, sharing, memorization).

---

## 2. Problem Statement

| Problem | Current state | FaithGPT solution |
|---|---|---|
| Bible apps are read-only | YouVersion/Bible Gateway excel at reading/search but provide minimal generative help | AI Verse-to-Devotion Engine™ turns any passage into a complete devotion in seconds |
| Study tools are for scholars | Logos/Olive Tree are powerful but intimidating, expensive, desktop-first | AI Bible Study Assistant™ gives structured, cited, plain-language answers for any audience (children → scholars) |
| Sermon/lesson prep is time-consuming | Pastors/teachers spend hours assembling outlines, illustrations, slides | AI Sermon Assistant + Sabbath School Lesson generator cuts prep time by 70%+ |
| Visual content for ministry is costly | Churches pay for designers or use generic stock art | AI Scripture Image Generator™ and Christian Content Creator™ produce on-brand, Scripture-grounded visuals instantly |
| Spiritual growth is hard to track | Habit apps aren't Scripture-aware; Bible apps don't gamify growth meaningfully | Spiritual Growth Dashboard™ + streaks + community accountability |
| AI religious content risks inaccuracy/disrespect | General AI chatbots can be theologically careless or denominationally biased | Strict prompt architecture: Scripture verbatim from licensed translations, AI output labeled, denomination-neutral, cited |

---

## 3. Target Users & Personas

1. **Everyday Believer ("Ama", 28)** — Wants a daily devotion in 5 minutes, prayer prompts, and to track a reading streak.
2. **Parent ("David", 38)** — Needs children's devotions, Bible story illustrations, and family worship guides.
3. **Youth/Pathfinder Leader ("Naomi", 24)** — Needs youth devotions, engaging visuals, and discussion questions for weekly meetings.
4. **Small Group Leader ("Kwame", 45)** — Needs small-group studies, discussion guides, and the ability to share devotions with a group.
5. **Pastor/Preacher ("Pastor Linda", 52)** — Needs sermon outlines, Sabbath School lesson breakdowns, illustrations, and presentation-ready graphics.
6. **Content Creator ("Joseph", 31)** — Runs a Christian social media page; needs quote cards, scripture graphics, and short devotionals to post daily.
7. **New Believer ("Tariq", 19)** — Needs simple explanations, guided reading plans, and an encouraging on-ramp to Bible literacy.
8. **Ministry/Church Admin ("Grace Chapel")** — Needs a Ministry plan with seats for staff, branded content, and usage analytics.

---

## 4. Goals & Success Metrics (North Star + KPIs)

| Goal | Metric | Target (Year 1) |
|---|---|---|
| Daily engagement | DAU/MAU | ≥ 35% |
| Devotion generation adoption | % of WAU generating ≥1 devotion/week | ≥ 50% |
| Reading consistency | 7-day reading streak retention | ≥ 30% of WAU |
| Visual content adoption | % of devotions with generated artwork | ≥ 25% |
| Monetization | Free→Paid conversion | ≥ 4% within 30 days |
| Retention | D30 retention | ≥ 25% |
| Community | % users joining ≥1 group | ≥ 15% |
| Ministry adoption | # of Ministry plan orgs | 500 orgs by EOY1 |
| AI quality | User "helpful" rating on AI outputs | ≥ 90% positive |
| Theological trust | Scripture/AI separation audit pass rate | 100% (zero tolerance) |

---

## 5. Core Differentiators (Ranked)

1. **AI Verse-to-Devotion Engine™** — flagship; instant, structured, theologically-careful devotion generation from any selection (verse → entire book).
2. **AI Scripture Image Generator™** — 10 visual modes, source-aware (verse, story, devotion, prayer, sermon).
3. **AI Bible Study Assistant™** — natural-language Q&A with structured, cited answers across audiences and original-language insight.
4. **AI Sermon & Lesson Studio** — sermon/lesson generation for pastors, teachers, and youth leaders.
5. **Spiritual Growth Dashboard™** — gamified discipleship analytics.
6. **Christian Community** — groups, prayer wall, shared devotions/testimonies.
7. **Offline-first Bible** — full reading experience without connectivity.

---

## 6. Scope: MVP vs Phase 2/3

### MVP (Phase 1 — 0–6 months)
- Full Bible reader (multi-version, offline, audio, search, highlights/notes/bookmarks, reading plans)
- AI Verse-to-Devotion Engine™ (Personal, Family, Youth, Children types; Quick/Standard/Deep depths)
- Scripture Analysis Engine (themes + biblical elements) & Theme Discovery
- AI Bible Study Assistant™ (core question categories)
- AI Prayer Generator (core prayer types)
- AI Scripture Image Generator™ (Photorealistic, Christian Artwork, Cartoon, Children's Storybook, Social Media Graphic modes)
- Memory Verse Visualizer™ (flashcards, wallpapers)
- Spiritual Journal (notes, devotions, prayers)
- Spiritual Growth Dashboard™ (streaks, basic stats)
- Auth, profiles, subscriptions (Free/Plus/Premium), push notifications
- Admin Portal v1 (users, subscriptions, AI usage, content moderation basics)

### Phase 2 (6–12 months)
- AI Sermon Assistant + Sabbath School Lesson Generator + Teaching Mode
- AI Bible Story Visualizer™ (storyboards/comics/storybooks)
- Devotion Image Generator™ auto-suggestions
- Christian Content Creator™ (flyers, posters, quote cards, banners)
- Full Christian Community (groups, feed, prayer wall, testimonies)
- Cross-Reference Engine (Messianic prophecy/fulfillment graph)
- Ministry/Church plans + seat management
- Admin Portal v2 (financial dashboard, translation management, image analytics)

### Phase 3 (12–24 months)
- Scripture-to-Video framework (animated devotionals, shorts)
- Advanced personalization (AI-curated reading plans based on growth data)
- Marketplace for premium devotion packs/templates
- Multi-language expansion (translations + AI localization)
- Denominational customization packs (SDA Sabbath School, Catholic lectionary, etc.)

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | AI devotion generation P95 < 8s (streamed); image generation P95 < 20s |
| Availability | 99.9% API uptime SLA |
| Offline | Bible text, audio (downloaded books), journal, saved devotions fully available offline |
| Scalability | Support 1M MAU, 50M Bible reads/day, 5M AI generations/month at launch+1yr scale |
| Localization | English at MVP; i18n-ready architecture (translations, RTL support groundwork) |
| Accessibility | WCAG 2.1 AA; dynamic type, screen reader labels, captioned audio |
| Data residency | US/EU regions at launch; architecture supports additional regions |

---

## 8. AI Safety & Biblical Integrity (Non-negotiable Requirements)

1. Scripture text is always rendered from licensed translation data — **never AI-paraphrased** when displayed as "Scripture."
2. All AI-generated commentary, devotions, prayers, and theological insights are visually distinguished (badge: "AI-Generated Insight") and contained in clearly bordered sections.
3. Every AI response that makes a theological claim must cite supporting Scripture references.
4. The system actively avoids presenting speculative theology as settled fact; uses hedging language ("many scholars believe...", "one interpretation is...") for disputed topics.
5. Denomination-neutral by default; users may opt into a "Lens" (e.g., SDA, Catholic, Reformed, Pentecostal) that adjusts supplementary material only — never alters Scripture text.
6. All AI-generated images are watermarked/labeled "AI-Generated" and pass a content-safety filter (see §12, §19).
7. The app actively encourages direct Scripture reading (e.g., devotion flows always open with the full passage before AI commentary).

---

## 9. Constraints & Assumptions

- Bible text licensed via API providers (e.g., API.Bible / Bible Brain / ESV API / Berean) — public-domain versions (KJV, WEB, ASV) bundled for offline; licensed modern versions (NIV, ESV, NLT) streamed per license terms.
- LLM provider: Anthropic Claude (primary) via API for text generation; image generation via a hosted diffusion model provider (e.g., Stable Diffusion XL / Flux via Replicate or similar) — abstracted behind an internal AI Gateway (see §06).
- Mobile: Flutter (single codebase, iOS/Android) per explicit deliverable requirement.
- Backend: Node.js/TypeScript (NestJS), PostgreSQL, Redis, S3-compatible object storage.
- Admin Portal: Next.js web app.

---

## 10. Competitive Landscape (Summary)

| Competitor | Strength | FaithGPT advantage |
|---|---|---|
| YouVersion (Bible App) | Massive Bible content, reading plans, community | AI generative layer (devotions, images, sermon prep) not present |
| Logos Bible Software | Deep scholarly tools | Mobile-first, AI-native, affordable, beginner-friendly |
| Bible Gateway | Search & translations | No AI study/devotion generation |
| ChatGPT/Generic AI | General intelligence | Not Scripture-grounded, no citation discipline, no Bible app integration |
| Canva | Generic design tool | Scripture-aware prompt construction, theological content safety, devotion-to-image pipeline |

---

## 11. Release Roadmap (High Level)

| Milestone | Timeline | Key deliverables |
|---|---|---|
| Alpha | Month 0–3 | Bible reader, Auth, Devotion Engine (Quick/Standard), Journal |
| Beta | Month 3–5 | Bible Study Assistant, Prayer Generator, Image Generator (3 modes), Growth Dashboard, Admin v1 |
| Public Launch (v1.0) | Month 6 | Full MVP scope, subscriptions live, App Store/Play Store release |
| v1.1 | Month 8 | Sermon Assistant, Story Visualizer, Community v1 |
| v1.2 | Month 11 | Ministry plans, Cross-Reference Engine, Admin v2 |
| v2.0 | Month 18 | Content Creator suite, Marketplace, multi-language |
| v3.0 | Month 24 | Scripture-to-Video |

---

## 12. Open Questions / Risks

- **Bible licensing costs** — modern translation API licensing fees scale with usage; need contracts before public launch.
- **Image generation theological sensitivity** — depicting Jesus/divine figures is a denominational sensitivity point; must be configurable per user preference (see §19).
- **AI cost at scale** — token costs for Deep/Advanced devotions and image generation must be modeled into subscription pricing (see §11 Subscription System, §20 Growth & Monetization).
- **Content moderation at community scale** — requires automated + human moderation pipeline from day one (see §12 Security Framework).
