# Production Dockerfile for Cloud Run deployment
FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source
COPY . .

# Build with environment variables
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1

# Firebase configuration (public - safe to include)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKS_cGxwhPAIiSLMsKvo-KIh_bi2MmXMo
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=doublecheck-9f8c1.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=doublecheck-9f8c1
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doublecheck-9f8c1.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672207092025
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:672207092025:web:8765da71fdbae52ee790e8
ENV NEXT_PUBLIC_APP_URL=https://doublecheck-9f8c1.run.app
ENV FIREBASE_ADMIN_PROJECT_ID=doublecheck-9f8c1
ENV FIREBASE_ADMIN_DATABASE_URL=https://doublecheck-9f8c1-default-rtdb.firebaseio.com

RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Firebase configuration (public - safe to include, will be overridden by Cloud Run env vars if set)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKS_cGxwhPAIiSLMsKvo-KIh_bi2MmXMo
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=doublecheck-9f8c1.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=doublecheck-9f8c1
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=doublecheck-9f8c1.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=672207092025
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:672207092025:web:8765da71fdbae52ee790e8
ENV NEXT_PUBLIC_APP_URL=https://doublecheck-9f8c1.run.app
ENV FIREBASE_ADMIN_PROJECT_ID=doublecheck-9f8c1
ENV FIREBASE_ADMIN_DATABASE_URL=https://doublecheck-9f8c1-default-rtdb.firebaseio.com

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.js ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

USER nextjs

EXPOSE 8080

# Set PATH to include node_modules bin
ENV PATH="/app/node_modules/.bin:$PATH"

WORKDIR /app/apps/web
CMD ["next", "start", "-p", "8080"]

