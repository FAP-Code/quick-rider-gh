# Quick Rider GH — Deployment Guide

## Architecture
```
packages/
├── backend/   Node.js + Express + TypeScript → Railway / Render
├── web/       Next.js 14 admin dashboard    → Vercel
└── mobile/    React Native (Expo)           → App Store / Play Store
```

---

## 1. Local Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL)
- PostgreSQL 16

### Setup

```bash
# Clone & install
git clone <repo>
cd quick-rider-gh
pnpm install

# Start PostgreSQL (Docker)
docker compose up postgres -d

# Backend setup
cd packages/backend
cp .env.example .env          # fill in your secrets
pnpm db:migrate               # run migrations
pnpm db:seed                  # seed admin user + pricing
pnpm dev                      # starts on :4000

# Web admin dashboard
cd packages/web
cp .env.example .env.local
pnpm dev                      # starts on :3000
```

Admin login: `admin@quickridergh.com` / `Admin@QuickRider2024!`

---

## 2. Deploy Backend → Railway

1. Create a Railway project
2. Add a PostgreSQL database plugin
3. Deploy from the `packages/backend` directory
4. Set environment variables from `.env.example`
5. Railway auto-runs `prisma migrate deploy` via start command

**railway.toml** (create in packages/backend):
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npx prisma migrate deploy && node dist/index.js"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

---

## 3. Deploy Admin Dashboard → Vercel

```bash
cd packages/web
vercel --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app/api/v1
```

---

## 4. Deploy with Docker Compose (VPS)

```bash
# Copy .env.example → .env, fill secrets
docker compose up -d --build

# Run migrations
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx tsx prisma/seed.ts
```

---

## 5. Mobile App (Expo / EAS)

```bash
cd packages/mobile
cp app.config.example.ts app.config.ts   # set API URL

# Development
pnpm start

# Production builds
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 6. Environment Variables Summary

### Backend
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 32 chars, random string |
| `JWT_REFRESH_SECRET` | Min 32 chars, different from JWT_SECRET |
| `CLOUDINARY_*` | File upload credentials |
| `TWILIO_*` | SMS/OTP credentials |
| `PAYSTACK_SECRET_KEY` | Payment processing |
| `FIREBASE_SERVICE_ACCOUNT` | Push notifications (JSON stringified) |

### Web
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps JavaScript API key |

---

## 7. Third-Party Integrations

### Mobile Money (Ghana)
- **MTN MoMo**: Use Paystack or Hubtel Ghana API
- **Telecel Cash**: Hubtel Ghana API
- Set `PAYSTACK_SECRET_KEY` or configure Hubtel credentials

### SMS (OTP)
- Sign up at [Twilio](https://twilio.com)
- Get a Ghana-capable number
- Set `TWILIO_*` env vars

### File Storage
- Sign up at [Cloudinary](https://cloudinary.com)
- Set `CLOUDINARY_*` env vars

### Push Notifications
- Create a Firebase project
- Enable Cloud Messaging
- Download service account JSON, stringify it → `FIREBASE_SERVICE_ACCOUNT`

### Google Maps
- Enable Maps SDK for Android, iOS, and JavaScript API
- Set `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

---

## 8. Production Checklist

- [ ] Replace all `.env.example` secrets with strong random values
- [ ] Enable HTTPS on your domain
- [ ] Set `FRONTEND_URL` to your actual Vercel domain
- [ ] Configure CORS appropriately
- [ ] Set up database backups (Railway / Supabase handle this)
- [ ] Configure Firebase for push notifications
- [ ] Test Mobile Money sandbox before going live
- [ ] Enable rate limiting and monitoring (Sentry, Grafana)
- [ ] Submit mobile app to Play Store / App Store

---

## 9. Default Admin Credentials

```
Email:    admin@quickridergh.com
Password: Admin@QuickRider2024!
```

**Change this immediately after first login.**
