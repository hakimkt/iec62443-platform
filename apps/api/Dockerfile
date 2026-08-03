# --------------------------------------------------
# Stage 1: Build + Deploy
# --------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests and package.json files for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-schemas/package.json ./packages/shared-schemas/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy all source and build
COPY . .
RUN pnpm --filter @iec62443/api build

# Prune production dependencies into a self-contained deploy directory
RUN pnpm --filter @iec62443/api --prod deploy --legacy /deploy

# --------------------------------------------------
# Stage 2: Runner
# --------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

# Copy the pruned production deploy (includes node_modules with native deps)
COPY --from=builder /deploy ./

# Copy the built dist (tsup bundled workspace packages into dist/server.js)
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]