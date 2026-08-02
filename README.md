# IEC 62443 Cybersecurity Management Platform

A full-stack platform for managing IEC 62443 industrial cybersecurity compliance — assessments, risk analysis, asset inventory, zone/conduit modeling, Purdue Model visualization, remediation tracking, and CSMS management.

## Architecture

| Layer | App | Stack |
|-------|-----|-------|
| **Web** | `apps/web` | Next.js 15, React 19, Tailwind CSS 4, Radix UI, Recharts, XYFlow |
| **API** | `apps/api` | Fastify 5, Drizzle ORM, PostgreSQL, JWT + RBAC auth |
| **Worker** | `apps/worker` | BullMQ, Puppeteer (PDF/report generation) |
| **Shared** | `packages/*` | shared-types, shared-schemas, database, auth, api-client, ui, config |

**Infrastructure** (Docker Compose): PostgreSQL 16, Redis 7, MinIO, NATS 2 (JetStream), OpenSearch 2

## Prerequisites

- **Node.js** ≥ 22.0.0
- **pnpm** 10.12.1 (corepack recommended: `corepack enable && corepack prepare pnpm@10.12.1 --activate`)
- **Docker** & Docker Compose (for infrastructure services)

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> && cd iec62443-platform
pnpm install
```

### 2. Start infrastructure

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

Wait for all services to report healthy:

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml ps
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` match the Docker Compose services, so you can start developing without changes. For production, change at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `S3_ACCESS_KEY` / `S3_SECRET_KEY`

### 4. Database setup

```bash
# Generate Drizzle migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Seed with demo data
pnpm db:seed
```

### 5. Start the development servers

```bash
pnpm dev
```

This starts all three apps concurrently via Turborepo:

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| API server | http://localhost:4000 |
| API docs (Swagger) | http://localhost:4000/documentation |
| MinIO Console | http://localhost:9001 |

## Project Structure

```
iec62443-platform/
├── apps/
│   ├── api/          # Fastify 5 REST API
│   ├── web/          # Next.js 15 frontend
│   └── worker/       # BullMQ background jobs
├── packages/
│   ├── api-client/   # Typed API client (fetch-based)
│   ├── auth/         # JWT, RBAC, MFA utilities
│   ├── config/       # Shared configuration
│   ├── database/     # Drizzle ORM schema + queries
│   ├── shared-schemas/ # Zod validation schemas
│   ├── shared-types/   # TypeScript type definitions
│   └── ui/           # Component library + Tailwind preset
├── infrastructure/
│   ├── docker/       # Docker Compose for local dev
│   ├── migrations/   # SQL migration files
│   ├── helm/         # Kubernetes Helm charts
│   └── terraform/    # Infrastructure as code
└── doc/              # Project documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode (watch) |
| `pnpm build` | Production build (all packages + apps) |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm type-check` | TypeScript `--noEmit` across all packages |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:e2e` | End-to-end tests |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |
| `pnpm clean` | Remove all build artifacts and node_modules |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Drizzle Studio (DB browser) |

## Running Individual Apps

```bash
# API only
pnpm --filter @iec62443/api dev

# Web only
pnpm --filter @iec62443/web dev

# Worker only
pnpm --filter @iec62443/worker dev
```

## Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm --filter @iec62443/api test

# Watch mode
pnpm --filter @iec62443/api vitest --watch
```

## Infrastructure Services

The Docker Compose stack in `infrastructure/docker/docker-compose.dev.yml` provides:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | Primary database |
| Redis 7 | 6379 | Job queue, caching, sessions |
| MinIO | 9000 / 9001 | S3-compatible evidence storage |
| NATS 2 | 4222 / 8222 | Event messaging (JetStream) |
| OpenSearch 2 | 9200 | Audit log search & analytics |

Stop all services:

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml down
```

Wipe data and start fresh:

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml down -v
```

## License

UNLICENSED — proprietary software.
