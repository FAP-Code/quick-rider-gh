# TailorPattern AI

**The Tailor’s Friend™ — Phase 1 MVP**

AI-powered garment pattern generation for tailors, fashion designers, and fashion schools.

## Features (Phase 1)

- ✅ **Customer Management** — Full CRUD with search, tags, and profile pages
- ✅ **Measurement Engine** — Comprehensive body measurement entry with anatomical validation
- ✅ **Pattern Generator** — Real industry-standard garment pattern computation
  - Men’s: Suit jacket, Trousers, Shirt, Traditional (Agbada, Senator, Kaftan)
  - Women’s: Blouse, A-line/Straight/Flared skirt, Shift/Fit-Flare dress
  - Children’s: Shirt, dress, trousers (age-scaled)
  - Uniform: Corporate shirts, school uniforms
- ✅ **SVG Pattern Preview** — Zoomable/pannable pattern viewer with grain lines, darts, fold lines
- ✅ **PDF Export** — Multi-page A4 printable pattern sheets
- ✅ **Sketch Canvas** — In-app freehand drawing tool with undo/redo
- ✅ **Offline-First** — Workbox service worker, IndexedDB (Dexie.js), sync queue
- ✅ **PWA** — Installable on iOS, Android, and desktop
- ✅ **Module Stubs** — Phase 3–12 module folders ready for expansion

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Local DB | Dexie.js (IndexedDB) |
| Service Worker | Workbox 7 (via vite-plugin-pwa) |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| PDF | jsPDF |
| Icons | Lucide React |

## Setup

```bash
cd packages/tailorpattern-ai
npm install   # or pnpm install
npm run dev
```

## Platform Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | TailorPattern AI (this) | ✅ Active |
| 2 | AI Pattern Suggestions | 🚧 Upcoming |
| 3 | Customer CRM & Orders | 🔒 Stub |
| 4 | Finance Module | 🔒 Stub |
| 5 | Inventory | 🔒 Stub |
| 6 | Production Management (Kanban) | 🔒 Stub |
| 7 | Employee Management | 🔒 Stub |
| 8 | TailorMarket™ | 🔒 Stub |
| 9 | Tailor Academy | 🔒 Stub |
| 10 | AI Business Assistant | 🔒 Stub |
| 11 | Enterprise Cloud Platform | 🔒 Stub |
| 12 | Global Fashion Ecosystem | 🔒 Stub |

---
*The Tailor’s Friend™ — AI-Powered. Tailor-Made. Future-Ready.*
