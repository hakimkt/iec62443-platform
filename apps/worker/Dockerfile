# --------------------------------------------------
# Stage 1: Build + Deploy
# --------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests and package.json files for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-schemas/package.json ./packages/shared-schemas/
COPY packages/config/package.json ./packages/config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy all source and build
COPY . .
RUN pnpm --filter @iec62443/worker build

# Prune production dependencies into a self-contained deploy directory
RUN pnpm --filter @iec62443/worker --prod deploy --legacy /deploy

# --------------------------------------------------
# Stage 2: Runner
# --------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat chromium wget
WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy the pruned production deploy (includes node_modules with native deps)
COPY --from=builder /deploy ./

# Copy the built dist (tsup bundled workspace packages into dist/worker.js)
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

CMD ["node", "apps/worker/dist/worker.js"]