# syntax=docker/dockerfile:1.7

# ── Stage 1: dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: builder ───────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at `next build`
# time, so they MUST be present here. Pass them via --build-arg from
# Cloud Build (see cloudbuild.yaml).
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUI_NETWORK
ARG NEXT_PUBLIC_SUI_RPC_URL
ARG NEXT_PUBLIC_CARDJOY_PACKAGE_ID
ARG NEXT_PUBLIC_CARDJOY_TREASURY
ARG NEXT_PUBLIC_CARDJOY_FEE_MIST
ARG NEXT_PUBLIC_WALRUS_PUBLISHER_URL
ARG NEXT_PUBLIC_WALRUS_AGGREGATOR_URL

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUI_NETWORK=$NEXT_PUBLIC_SUI_NETWORK \
    NEXT_PUBLIC_SUI_RPC_URL=$NEXT_PUBLIC_SUI_RPC_URL \
    NEXT_PUBLIC_CARDJOY_PACKAGE_ID=$NEXT_PUBLIC_CARDJOY_PACKAGE_ID \
    NEXT_PUBLIC_CARDJOY_TREASURY=$NEXT_PUBLIC_CARDJOY_TREASURY \
    NEXT_PUBLIC_CARDJOY_FEE_MIST=$NEXT_PUBLIC_CARDJOY_FEE_MIST \
    NEXT_PUBLIC_WALRUS_PUBLISHER_URL=$NEXT_PUBLIC_WALRUS_PUBLISHER_URL \
    NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=$NEXT_PUBLIC_WALRUS_AGGREGATOR_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
