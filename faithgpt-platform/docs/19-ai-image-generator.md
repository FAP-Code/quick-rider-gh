# 19 — AI Scripture Image Generator Design

The **AI Scripture Image Generator™** (plus its specializations: **AI Bible Story Visualizer™**, **Memory Verse Visualizer™**, and **Devotion Image Generator™**) is FaithGPT's visual generation system. All four share one pipeline through the **Image Gateway** defined in §06 AI Architecture.

---

## 1. Pipeline Overview

```mermaid
flowchart LR
  A[Source Selection] --> B[Prompt Construction]
  B --> C[Content Safety Pre-Filter]
  C -->|pass| D[Image Model Routing]
  C -->|reject| X[Blocked: GenerationStatus=MODERATION_BLOCKED]
  D --> E[Generation]
  E --> F[Post-Processing: watermark + label + thumbnail]
  F --> G[Storage / CDN]
  G --> H[Moderation Queue]
  H -->|approved| I[ImageGeneration.status=COMPLETED, moderationStatus=APPROVED]
  H -->|flagged| J[ContentModerationFlag → Admin review]
```

| Stage | Detail |
|---|---|
| Source Selection | `ImageSourceType`: `VERSE`, `CHAPTER`, `BIBLE_STORY`, `DEVOTION`, `PRAYER`, `SERMON`, `MEMORY_VERSE`, `CUSTOM_PROMPT` |
| Prompt Construction | Style-specific template (§2) merges source content + theme + style directives |
| Content Safety Pre-Filter | Screens the *constructed prompt* before it reaches the diffusion model — blocks violent/inappropriate requests regardless of style |
| Image Model Routing | Routes to base model or "FaithGPT Christian Artwork" LoRA depending on `style` (§4) |
| Post-Processing | Bakes in "AI-Generated" badge (§5), generates thumbnail, strips EXIF except label |
| Storage/CDN | S3 + CloudFront, `resultUrl`/`thumbnailUrl` written to `ImageGeneration` |
| Moderation Queue | Automated NSFW/violence classifier on the *output image*; flagged → `ContentModerationFlag` → Admin Portal (§17) |

---

## 2. Prompt Construction Per Image Style (`ImageStyle`)

| Style | Visual treatment approach | Example prompt fragment |
|---|---|---|
| `PHOTOREALISTIC` | Historically-grounded realism: period-accurate clothing, architecture, landscapes for the Ancient Near East/1st-century Judea; documentary lighting | `"...photorealistic, historically accurate Ancient Near Eastern setting, natural lighting, detailed textures, respectful and reverent tone..."` |
| `CINEMATIC` | Movie-quality composition: dramatic lighting, wide aspect ratio, depth of field, epic scale | `"...cinematic wide shot, dramatic golden-hour lighting, anamorphic lens, epic biblical scale, film grain..."` |
| `CHRISTIAN_ARTWORK` | Premium devotional fine-art: painterly, reverent, gallery-quality — routed to the FaithGPT LoRA for house consistency | `"...premium devotional fine art, reverent and luminous, classical composition, FaithGPT house style..."` |
| `CARTOON` | Friendly, bright, simplified shapes, warm palette | `"...friendly cartoon illustration, bright warm colors, simplified rounded shapes, cheerful expressions..."` |
| `CHILDRENS_STORYBOOK` | Soft, colorful, educational — content softened (see §3) | `"...colorful children's storybook illustration, soft watercolor-cartoon hybrid, gentle expressions, no violence or fear..."` |
| `COMIC_BOOK` | Sequential-art panel style: bold outlines, halftone shading, dynamic action lines | `"...comic book panel art, bold ink outlines, halftone shading, dynamic action composition, speech-bubble-ready negative space..."` |
| `WATERCOLOR` | Soft inspirational artwork: visible brush texture, muted palette, gentle gradients | `"...soft watercolor painting, visible paper texture, muted inspirational palette, gentle light diffusion..."` |
| `OIL_PAINTING` | Classical biblical artwork: Renaissance/Baroque influence, rich color, chiaroscuro | `"...classical oil painting, Baroque chiaroscuro lighting, rich deep color palette, masterwork composition..."` |
| `MINIMALIST_POSTER` | Modern scripture-based design: large typography area, flat color blocks, generous negative space (Royal Blue/Gold palette from §00) | `"...minimalist poster design, flat color blocks in deep royal blue and gold, large negative space for typography overlay, modern..."` |
| `SOCIAL_MEDIA_GRAPHIC` | Ready-to-share square/vertical formats, bold legible text-safe zones, on-brand colors | `"...social media graphic, 1:1 and 9:16 safe layout, bold legible typography zone, on-brand royal blue and gold accents..."` |

Every prompt template also injects: (1) the source Scripture text or summary, (2) the dominant theme(s) from Scripture Analysis (§18) or the source devotion's themes, and (3) a **content-safety suffix** (§3) appended automatically — never user-editable.

---

## 3. Worked Examples (from the product brief)

### 3.1 "David and Goliath" (`sourceType=BIBLE_STORY`, `storyKey=david-and-goliath`)

| Requested output | Style | Result |
|---|---|---|
| Realistic battle scene | `PHOTOREALISTIC` | Wide shot, two armies on a valley ridge, David and Goliath at center, period armor/clothing, tense but non-gratuitous framing |
| Children's cartoon | `CARTOON` | David with sling, friendly expressions, Goliath large but non-threatening, bright palette |
| Comic strip | `COMIC_BOOK` | 3-4 panel sequence: David refuses armor → sling throw → impact → victory, bold ink lines |
| Storybook illustration | `CHILDRENS_STORYBOOK` | Soft colors, Goliath's "fall" implied off-panel or stylized (no graphic impact), focus on David's courage and faith |
| Sermon illustration | `CHRISTIAN_ARTWORK` | Single emotive frame emphasizing "faith over fear" theme, suitable as a sermon title slide background |
| Church presentation slide | `MINIMALIST_POSTER` | Silhouette composition with large negative space for the sermon title/verse overlay |

### 3.2 "Psalm 23" (`sourceType=CHAPTER`, reference=`PSA.23`)

| Requested output | Style | Result |
|---|---|---|
| Shepherd scene | `PHOTOREALISTIC` or `OIL_PAINTING` | Shepherd with flock in green pastures/still waters, golden light |
| Inspirational poster | `MINIMALIST_POSTER` | "The Lord is my shepherd" typography zone over a soft pasture gradient |
| Wallpaper | `WATERCOLOR` | Vertical (mobile) aspect ratio, calm palette, suitable for lock screen |
| Children's illustration | `CHILDRENS_STORYBOOK` | Friendly shepherd and sheep, bright daytime scene |
| Devotional artwork | `CHRISTIAN_ARTWORK` | Reverent painterly rendering, FaithGPT house style |

---

## 4. Theological & Content-Sensitivity Handling

1. **Depicting Jesus / divine figures.** Many denominations hold differing views on visual depictions of Christ. `User.denominationLens` drives a generation preference, exposed in Account settings:
   - `AVOID_DIVINE_DEPICTION` (default for users who opt in): prompts referencing Jesus are rewritten to emphasize symbolic/indirect representation (light, empty tomb, hands, silhouette from behind) instead of a face.
   - `ALLOW_DIVINE_DEPICTION` (default overall, opt-out available): standard reverent depiction permitted, always non-graphic.
   - This preference is injected into prompt construction as a directive, not left to the diffusion model's defaults.

2. **Violence/fear for children's content.** Regardless of source material (e.g., Goliath's defeat, the Crucifixion, Daniel's lions), `CHILDRENS_STORYBOOK` and any `BibleStoryVisualization` with `outputType` aimed at children automatically applies a **softening directive**: "no blood, no graphic injury, implied rather than depicted danger, focus on courage/faith/God's protection." This is enforced in the content-safety suffix (§2) and cannot be disabled by the user for this style.

3. **Denomination-neutral default.** Image content avoids denomination-specific iconography (e.g., specific saints, denominational symbols) unless the user's `denominationLens` explicitly requests it — consistent with PRD §8 rule 5.

---

## 5. Labeling, Watermarking & Model Routing

- **Labeling (PRD §8 rule 6, non-negotiable):** every generated image receives (a) a visible "AI-Generated" badge baked into the bottom corner (configurable opacity/position), and (b) an IPTC/XMP metadata tag `"AI-Generated: FaithGPT"`. FREE/PLUS tiers cannot disable the visible badge. PREMIUM may disable the *visible* badge but the metadata label is always retained.
- **Model routing:**
  - Base model: a hosted diffusion model (e.g., SDXL or Flux via a managed API such as Replicate/Stability) for `PHOTOREALISTIC`, `CINEMATIC`, `CARTOON`, `COMIC_BOOK`, `WATERCOLOR`, `OIL_PAINTING`, `MINIMALIST_POSTER`, `SOCIAL_MEDIA_GRAPHIC`.
  - **FaithGPT Christian Artwork LoRA** (a fine-tuned adapter trained on licensed devotional art) for `CHRISTIAN_ARTWORK` and `CHILDRENS_STORYBOOK`, ensuring a consistent, recognizable "house style" across devotional content.
  - Routing logic lives in `ImageGatewayService.generateImage({ style, prompt })` (§06), which selects the model/adapter combination per style.

---

## 6. Moderation Queue

| `moderationStatus` | Meaning | Transition |
|---|---|---|
| `PENDING` | Image generated, awaiting automated check | → `APPROVED` or `FLAGGED` via NSFW/violence classifier (seconds after generation) |
| `APPROVED` | Visible to user immediately; eligible for Community sharing | Terminal (unless later reported → `FLAGGED`) |
| `FLAGGED` | Held from Community sharing (still visible privately to creator with a notice); creates `ContentModerationFlag` | → `APPROVED`/`REJECTED` by Admin Moderator (§17) |
| `REJECTED` | Removed from user's gallery; `AIUsageLog` records the event for abuse-pattern monitoring | Terminal |

---

## 7. Specializations

### 7.1 AI Bible Story Visualizer™
Produces a `BibleStoryVisualization` with N `StoryboardFrame`s. To maintain visual continuity across frames (consistent character appearance, setting, lighting), every frame's prompt is prefixed with a shared **"scene bible"** — a short description of each recurring character/setting generated once at visualization start and reused verbatim across all frame prompts. Output types: `STORYBOARD` (key moments), `COMIC` (panel sequence with captions), `CHILDRENS_BOOK` (full-page illustrations + simplified text), `TEACHING_SLIDES` (one image + key point per slide).

### 7.2 Memory Verse Visualizer™
Maps `MemoryCardFormat` to fixed aspect ratios/templates: `FLASHCARD` (1:1, verse text overlay, front/back), `WALLPAPER` (9:16, mobile lock screen), `LOCK_SCREEN` (9:19.5, notification-safe zone avoided), `CHILDRENS_CARD` (1:1, larger type, illustration-forward), `PRINTABLE` (US Letter/A4 grid of multiple cards for group distribution). Style defaults to `MINIMALIST_POSTER` but is user-selectable.

### 7.3 Devotion Image Generator™
The "Generate Matching Artwork" CTA on every `Devotion`/`Prayer`/`Sermon`. Auto-suggests a style based on the artifact's themes (e.g., themes like "Hope"/"Comfort" → `WATERCOLOR`; "Leadership"/"Courage" → `CINEMATIC`; children's devotion types → `CHILDRENS_STORYBOOK`) via a small style-suggestion lookup table keyed on `Theme.slug`, while always allowing manual override.

---

## 8. Cost & Performance Targets

- P95 generation latency: < 20s (per PRD §7), achieved via async job (BullMQ) + push notification on completion for non-blocking UX; mobile shows a progress state with the source content visible while waiting.
- Every generation logs an `AIUsageLog` row (`feature=IMAGE_GENERATION`) for cost tracking and tier-quota enforcement (§11).
- Story Visualizer batches frame generations as parallel jobs with the shared scene-bible prefix, bounded by tier-based concurrency limits to control burst cost.
