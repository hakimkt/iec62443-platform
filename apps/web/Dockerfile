# --------------------------------------------------
# Stage 1: Build
# --------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests and package.json files for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/auth/package.json ./packages/auth/
COPY packages/shared-schemas/package.json ./packages/shared-schemas/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/package.json ./packages/config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy all source and build
COPY . .
RUN pnpm --filter @iec62443/web build

# --------------------------------------------------
# Stage 2: Runner
# --------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app

ENV NODE_ENV=production

# Copy Next.js standalone output (includes all production node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# public directory is optional — create it so the COPY doesn't fail
RUN mkdir -p ./apps/web/public

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]