# Build context must be the REPO ROOT (not packages/backend)
# docker build -f packages/backend/Dockerfile .

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Install deps ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile --filter backend

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend ./packages/backend
COPY package.json pnpm-workspace.yaml ./
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/prisma ./prisma
COPY packages/backend/package.json ./

EXPOSE 4000
CMD ["node", "dist/index.js"]
