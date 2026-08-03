# IEC 62443 Platform — Recommended Technology Stack

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                             │
├───────────────┬─────────────────────────────────────────────────────┤
│ Frontend      │ React 19, TypeScript, Next.js 15, Tailwind CSS     │
│ State         │ TanStack Query, Zustand                            │
│ Backend       │ Node.js 22 LTS, TypeScript, Fastify 5              │
│ ORM           │ Drizzle ORM                                        │
│ Database      │ PostgreSQL 16, Redis 7                             │
│ Search        │ OpenSearch 2                                       │
│ Object Store  │ AWS S3 / MinIO                                     │
│ Event Bus     │ NATS 2                                             │
│ Queue         │ BullMQ (Redis-backed)                              │
│ Auth          │ Custom + Keycloak (optional)                       │
│ Infrastructure│ Docker, Kubernetes, Terraform                      │
│ CI/CD         │ GitHub Actions                                     │
│ Monitoring    │ OpenTelemetry, Grafana, Prometheus, Loki           │
│ Testing       │ Vitest, Playwright, k6                             │
└───────────────┴─────────────────────────────────────────────────────┘
```

---

## 2. Frontend Stack

### 2.1 Core Framework

| Technology       | Version | Rationale                                                             |
| ---------------- | ------- | --------------------------------------------------------------------- |
| **React**        | 19      | Mature ecosystem, Server Components for performance                   |
| **TypeScript**   | 5.x     | Type safety across the stack; shared types with backend               |
| **Next.js**      | 15      | App Router, SSR/SSG hybrid, excellent DX, built-in API routes for BFF |
| **Tailwind CSS** | 4       | Utility-first, design system consistency, small production bundle     |

### 2.2 State Management

| Technology                       | Purpose                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| **TanStack Query** (React Query) | Server state: API data fetching, caching, background refetching, optimistic updates |
| **Zustand**                      | Client state: UI state, form drafts, sidebar/navigation state                       |
| **React Hook Form** + **Zod**    | Form handling + schema validation (shared schemas with backend)                     |

### 2.3 Visualization & Diagrams

| Technology    | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| **D3.js**     | Zone & conduit topology diagrams, Purdue model visualization |
| **Recharts**  | Dashboards, risk heat maps, assessment scorecards            |
| **ReactFlow** | Interactive node-based diagrams (zone topology editor)       |
| **PDF.js**    | In-browser document preview for evidence                     |

### 2.4 UI Component Library

| Technology               | Purpose                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| **Radix UI**             | Accessible headless primitives (dialogs, dropdowns, tabs, tooltips) |
| **Tailwind CSS**         | Styling layer                                                       |
| **Custom design system** | Branded components built on Radix + Tailwind                        |

### 2.5 Offline / PWA

| Technology               | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| **Workbox**              | Service worker generation, offline caching strategies |
| **Dexie.js** (IndexedDB) | Client-side database for offline data capture         |
| **Background Sync API**  | Queue mutations for replay when connectivity resumes  |

### 2.6 Internationalization

| Technology            | Purpose                               |
| --------------------- | ------------------------------------- |
| **next-intl**         | i18n support for Next.js App Router   |
| **ICU MessageFormat** | Pluralization, number/date formatting |

Supported languages: English (default), German, French, Spanish, Japanese, Chinese (Simplified)

---

## 3. Backend Stack

### 3.1 Core Runtime

| Technology     | Version | Rationale                                                      |
| -------------- | ------- | -------------------------------------------------------------- |
| **Node.js**    | 22 LTS  | Unified TypeScript stack, excellent async I/O, large ecosystem |
| **TypeScript** | 5.x     | End-to-end type safety                                         |
| **Fastify**    | 5       | High performance, schema-based validation, plugin architecture |

**Alternative considered:** Go (Gin/Fiber) — higher raw performance, but dual-language stack increases complexity. Node.js with Fastify provides sufficient performance for this workload with the advantage of shared TypeScript types.

### 3.2 ORM & Database

| Technology        | Purpose                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Drizzle ORM**   | Type-safe SQL builder, migration management, lightweight, excellent TypeScript inference |
| **PostgreSQL 16** | Primary data store — JSONB, full-text search, RLS, array types, generated columns        |
| **Redis 7**       | Session store, rate limiting, caching, job queue backend                                 |

### 3.3 Authentication

| Technology                    | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| **Custom JWT implementation** | Access + refresh token flow, built on `jose` library      |
| **Keycloak** (optional)       | Enterprise SSO (SAML/OIDC), user federation, social login |
| **argon2**                    | Password hashing (Argon2id)                               |
| **otplib**                    | TOTP MFA implementation                                   |
| **@simplewebauthn/server**    | WebAuthn/FIDO2 passkey support                            |

### 3.4 File & Evidence Storage

| Technology                     | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| **AWS SDK v3** / **MinIO SDK** | Object storage operations (S3-compatible)        |
| **sharp**                      | Image processing (thumbnails, format conversion) |
| **ClamAV** (via `clamscan`)    | Virus scanning on upload                         |
| **pdf-lib**                    | PDF generation and manipulation                  |

### 3.5 Report Generation

| Technology     | Purpose                                   |
| -------------- | ----------------------------------------- |
| **Puppeteer**  | PDF report generation from HTML templates |
| **Handlebars** | Report template engine                    |
| **ExcelJS**    | Excel report generation                   |
| **BullMQ**     | Job queue for async report generation     |

### 3.6 Event Bus & Async Processing

| Technology | Purpose                                                     |
| ---------- | ----------------------------------------------------------- |
| **NATS 2** | Lightweight event bus for domain events (publish/subscribe) |
| **BullMQ** | Redis-backed job queue for background processing            |

### 3.7 Search

| Technology                         | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| **OpenSearch 2**                   | Full-text search across findings, evidence, assessments |
| **@opensearch-project/opensearch** | Node.js client                                          |

---

## 4. Infrastructure

### 4.1 Containerization & Orchestration

| Technology           | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| **Docker**           | Application containerization                                       |
| **Docker Compose**   | Local development environment                                      |
| **Kubernetes** (K8s) | Production orchestration (EKS/GKE for cloud, K3s/RKE2 for on-prem) |
| **Helm**             | Kubernetes package management                                      |

### 4.2 Infrastructure as Code

| Technology    | Purpose                                     |
| ------------- | ------------------------------------------- |
| **Terraform** | Cloud infrastructure provisioning (AWS/GCP) |
| **Ansible**   | On-premises server configuration            |

### 4.3 CI/CD Pipeline

| Technology                    | Purpose                              |
| ----------------------------- | ------------------------------------ |
| **GitHub Actions**            | CI/CD pipeline (build, test, deploy) |
| **GitHub Container Registry** | Docker image storage                 |
| **ArgoCD**                    | GitOps deployment to Kubernetes      |

### 4.4 CI/CD Pipeline Flow

```
┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
│ Push │───►│Lint +│───►│ Test │───►│Build │───►│Stage │───►│Deploy│
│ to   │    │Type  │    │      │    │Docker│    │Deploy│    │Prod  │
│ main │    │Check │    │      │    │Image │    │      │    │      │
└──────┘    └──────┘    └──────┘    └──────┘    └──────┘    └──────┘
     │           │           │           │           │           │
     │           ▼           ▼           ▼           ▼           ▼
     │      ESLint      Vitest      Trivy       Smoke      Canary
     │      Prettier    Playwright  Snyk        Tests      Deploy
     │      tsc         k6 (perf)   SBOM                   + Rollback
     │
     └──► PR checks (required): lint + type-check + unit tests
```

---

## 5. Observability

### 5.1 Monitoring Stack

| Technology        | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| **OpenTelemetry** | Unified tracing, metrics, and logging instrumentation |
| **Prometheus**    | Metrics collection and alerting                       |
| **Grafana**       | Dashboards and visualization                          |
| **Loki**          | Log aggregation                                       |
| **Tempo**         | Distributed tracing                                   |
| **AlertManager**  | Alert routing and notification                        |

### 5.2 Key Metrics

| Category           | Metrics                                                         |
| ------------------ | --------------------------------------------------------------- |
| **Application**    | Request latency (p50/p95/p99), error rate, throughput           |
| **Business**       | Active assessments, findings created/day, reports generated/day |
| **Infrastructure** | CPU, memory, disk I/O, network, DB connections                  |
| **Security**       | Failed auth attempts, rate limit hits, permission denials       |
| **Queue**          | Job queue depth, processing time, failure rate                  |

### 5.3 Alerting Rules

| Alert                         | Severity | Trigger                                      |
| ----------------------------- | -------- | -------------------------------------------- |
| High error rate               | P1       | Error rate > 1% for 5 minutes                |
| API latency spike             | P2       | p99 latency > 2s for 10 minutes              |
| Queue backlog                 | P2       | Job queue depth > 1000 for 15 minutes        |
| DB connection pool exhaustion | P1       | Available connections < 5                    |
| Certificate expiry            | P3       | Certificate expires in < 30 days             |
| Failed login spike            | P2       | > 50 failed logins from same IP in 5 minutes |
| Disk usage                    | P3       | Disk > 80% utilization                       |

---

## 6. Development Tooling

### 6.1 Local Development

| Tool               | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| **pnpm**           | Fast, disk-efficient package manager                        |
| **Turborepo**      | Monorepo build system and caching                           |
| **Docker Compose** | Local services (PostgreSQL, Redis, NATS, MinIO, OpenSearch) |
| **Husky**          | Git hooks (pre-commit lint, commit message format)          |
| **lint-staged**    | Run linters on staged files only                            |

### 6.2 Monorepo Structure

```
iec62443-platform/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Fastify backend
│   ├── worker/                 # Background job worker
│   └── docs/                   # Documentation site
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   ├── shared-schemas/         # Zod validation schemas
│   ├── ui/                     # Shared UI components
│   ├── database/               # Drizzle schema + migrations
│   ├── auth/                   # Authentication utilities
│   └── config/                 # Shared config (ESLint, TSConfig)
├── infrastructure/
│   ├── terraform/              # IaC definitions
│   ├── helm/                   # Kubernetes Helm charts
│   └── docker/                 # Dockerfiles
├── scripts/                    # Build/deploy scripts
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root package.json
```

### 6.3 Testing Stack

| Technology                 | Type        | Purpose                                      |
| -------------------------- | ----------- | -------------------------------------------- |
| **Vitest**                 | Unit        | Fast, Vite-native unit testing               |
| **@testing-library/react** | Component   | React component testing                      |
| **Playwright**             | E2E         | Cross-browser end-to-end testing             |
| **k6**                     | Performance | Load testing and performance benchmarks      |
| **MSW**                    | Integration | API mocking for frontend tests               |
| **Testcontainers**         | Integration | Docker-based integration testing for backend |

### 6.4 Code Quality

| Tool                     | Purpose                            |
| ------------------------ | ---------------------------------- |
| **ESLint** (flat config) | Code linting with custom rules     |
| **Prettier**             | Code formatting                    |
| **Semgrep**              | Security-focused static analysis   |
| **Knip**                 | Dead code and dependency detection |
| **depcheck**             | Unused dependency detection        |

---

## 7. Technology Decision Records

### 7.1 Why Node.js over Go for Backend?

| Factor            | Node.js                 | Go                                   |
| ----------------- | ----------------------- | ------------------------------------ |
| **Unified stack** | ✓ TypeScript end-to-end | ✗ Two languages                      |
| **Type sharing**  | ✓ Shared types/schemas  | ✗ Code generation needed             |
| **Performance**   | Adequate (Fastify)      | Better raw throughput                |
| **Ecosystem**     | NPM (largest)           | Smaller but focused                  |
| **Hiring**        | Larger talent pool      | Smaller, specialized                 |
| **Verdict**       | **Selected**            | Reconsider for Phase 3 microservices |

### 7.2 Why Drizzle ORM over Prisma?

| Factor                | Drizzle                   | Prisma                        |
| --------------------- | ------------------------- | ----------------------------- |
| **Type safety**       | ✓ Excellent inference     | ✓ Good                        |
| **SQL proximity**     | ✓ SQL-like syntax         | ✗ Abstracted query API        |
| **Migration control** | ✓ Explicit SQL migrations | Auto-generated (less control) |
| **Multi-schema**      | ✓ Native support          | Limited                       |
| **Bundle size**       | Lightweight               | Heavier runtime               |
| **Performance**       | ✓ Minimal overhead        | Connection pool overhead      |
| **Verdict**           | **Selected**              | —                             |

### 7.3 Why NATS over Kafka?

| Factor               | NATS                      | Kafka                       |
| -------------------- | ------------------------- | --------------------------- |
| **Complexity**       | Simple, single binary     | Complex (ZooKeeper/KRaft)   |
| **Resource usage**   | ~10 MB RAM                | ~1 GB+ RAM                  |
| **Throughput**       | Sufficient for this scale | Higher (overkill)           |
| **Operational cost** | Low                       | High                        |
| **Features**         | Pub/sub, jetstream        | Streams, partitions, replay |
| **Verdict**          | **Selected**              | Reconsider at 10K+ tenants  |

---

## 8. Dependency Security Policy

| Category                    | Update Cadence                  | Review                             |
| --------------------------- | ------------------------------- | ---------------------------------- |
| Security patches (critical) | Within 24 hours                 | Automated PR + expedited review    |
| Security patches (high)     | Within 7 days                   | Automated PR + standard review     |
| Minor version updates       | Monthly batch                   | Renovate bot + CI validation       |
| Major version upgrades      | Quarterly review                | Manual assessment + migration plan |
| Transitive dependencies     | Audited via `pnpm audit` weekly | Automated                          |

---

_Next: [Development Roadmap →](roadmap.md)_
