# IEC 62443 Cybersecurity Management Platform

A multi-tenant, enterprise-grade SaaS application for managing industrial cybersecurity assessments, risk registers, zone/conduit modeling, and CSMS compliance per IEC 62443 standards.

## Architecture

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4, Radix UI
- **Backend:** Fastify 5, Node.js 22, TypeScript
- **Database:** PostgreSQL 16, Drizzle ORM
- **Cache:** Redis 7
- **Storage:** MinIO / S3
- **Events:** NATS 2
- **Search:** OpenSearch 2
- **Queue:** BullMQ (Redis-backed)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start infrastructure services:**
   ```bash
   docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
   ```

3. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Generate database migrations:**
   ```bash
   pnpm db:generate
   ```

5. **Run database migrations:**
   ```bash
   pnpm db:migrate
   ```

6. **Seed the database:**
   ```bash
   pnpm db:seed
   ```

7. **Start development servers:**
   ```bash
   pnpm dev
   ```

### Access Points

| Service | URL |
|---|---|
| Web Application | http://localhost:3000 |
| API Server | http://localhost:4000 |
| API Documentation | http://localhost:4000/api/docs |
| MinIO Console | http://localhost:9001 |

## Monorepo Structure

```
iec62443-platform/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Fastify backend
│   └── worker/                 # Background job worker
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-schemas/         # Zod validation schemas
│   ├── database/               # Drizzle schema + migrations
│   ├── ui/                     # Shared UI components
│   ├── api-client/             # Typed API client
│   ├── auth/                   # Authentication utilities
│   └── config/                 # Shared configuration
├── infrastructure/
│   ├── docker/                 # Docker Compose files
│   ├── terraform/              # IaC definitions
│   └── helm/                   # Kubernetes charts
└── doc/                        # Project documentation
```

## Development

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests only |
| `pnpm format` | Format code with Prettier |

### Database

| Command | Description |
|---|---|
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed database with initial data |
| `pnpm db:studio` | Open Drizzle Studio |

## License

Proprietary — All rights reserved.
