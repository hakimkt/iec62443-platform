# IEC 62443 Cybersecurity Management Platform — Application Architecture

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. Executive Summary

The IEC 62443 Cybersecurity Management Platform is a multi-tenant, enterprise-grade SaaS application designed for OT cybersecurity consultants, asset owners, and system integrators. It digitizes the full IEC 62443 lifecycle — from gap assessments and CSMS authoring through risk treatment, evidence collection, and remediation tracking — across multiple client engagements.

---

## 2. Design Principles

| Principle | Rationale |
|---|---|
| **Multi-tenant isolation** | Each client (asset owner) operates in a fully isolated workspace; no cross-tenant data leakage |
| **Domain-driven design** | Bounded contexts map directly to IEC 62443 concepts (assessment, risk, zones, CSMS) |
| **API-first** | All capabilities exposed via REST/GraphQL; UI is a consumer, not a coupling point |
| **Offline-capable field work** | Assessors in air-gapped plant environments can capture findings offline, sync later |
| **Audit-first** | Every mutation is event-sourced to an immutable audit log — critical for certification evidence |
| **Defense in depth** | Security architecture mirrors the Purdue model the platform itself models |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Web App     │  │  Mobile App  │  │  Offline Field Collector │  │
│  │  (React/TS)  │  │  (React      │  │  (PWA + IndexedDB        │  │
│  │              │  │   Native)    │  │   sync queue)            │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└─────────┼──────────────────┼───────────────────────┼───────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Nginx / Kong / AWS ALB                                       │ │
│  │  • TLS termination  • Rate limiting  • Request routing        │ │
│  │  • WAF rules  • API version negotiation                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                     APPLICATION SERVICES LAYER                       │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Auth &      │ │ Assessment  │ │ Risk         │ │ CSMS        │ │
│  │ Identity    │ │ Service     │ │ Service      │ │ Service     │ │
│  │ Service     │ │             │ │              │ │             │ │
│  └─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘ │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Zone &      │ │ Evidence    │ │ Remediation  │ │ Reporting   │ │
│  │ Conduit     │ │ Service     │ │ Service      │ │ Service     │ │
│  │ Service     │ │             │ │              │ │             │ │
│  └─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘ │
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐                 │
│  │ Purdue      │ │ Notification│ │ Sync &       │                 │
│  │ Model       │ │ Service     │ │ Offline Svc  │                 │
│  │ Service     │ │             │ │              │                 │
│  └─────────────┘ └─────────────┘ └──────────────┘                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                       INFRASTRUCTURE LAYER                          │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │PostgreSQL│ │  Redis   │ │   S3/    │ │  Event   │ │ Search  │ │
│  │(primary  │ │(cache,   │ │ MinIO    │ │  Bus     │ │ (Open-  │ │
│  │ data)    │ │ sessions)│ │(evidence)│ │(NATS/    │ │ Search) │ │
│  │          │ │          │ │          │ │ Kafka)   │ │         │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐   │
│  │  Audit Event Store   │  │  Background Job Queue (BullMQ)   │   │
│  │  (append-only table  │  │  • PDF report generation         │   │
│  │   + S3 cold archive) │  │  • Bulk import/export            │   │
│  └──────────────────────┘  │  • Risk recalculation            │   │
│                            └──────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 4. Deployment Topology

### 4.1 Cloud Deployment (Primary)

```
                    ┌─────────────┐
                    │  CloudFlare │
                    │  CDN + WAF  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Region  │ │  Region  │ │  Region  │
        │  eu-west │ │ us-east  │ │ ap-south │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
        ┌────▼────────────▼────────────▼────┐
        │     Shared Services (per region)  │
        │  • Auth (Keycloak)                │
        │  • PostgreSQL (RDS, read replicas)│
        │  • Redis (ElastiCache cluster)    │
        │  • S3 (evidence vault)            │
        │  • NATS (event bus)               │
        └───────────────────────────────────┘
```

### 4.2 On-Premises / Air-Gapped Deployment

For critical infrastructure clients requiring data sovereignty:

- Single-node Docker Compose for small deployments
- Kubernetes (K3s/RKE2) for enterprise on-prem
- All evidence stored in local MinIO; no external egress
- Licensing via offline JWT tokens

---

## 5. Architectural Patterns

### 5.1 Modular Monolith (Phase 1–2)

Start as a **modular monolith** with strict module boundaries enforced via:
- Package-level visibility (TypeScript path aliases or Go internal packages)
- Module-level database schemas (PostgreSQL schemas per bounded context)
- Inter-module communication via an in-process event bus

**Rationale:** Avoids premature microservice complexity while preserving the option to extract services when scaling demands arise.

### 5.2 Selective Microservices (Phase 3+)

Extract when justified:
- **Evidence Service** → independent service (large binary payloads, S3-native)
- **Report Generation** → worker service (CPU-intensive PDF rendering)
- **Sync Service** → independent service (complex conflict resolution)

### 5.3 Event Sourcing for Audit Domain

The audit log uses event sourcing:
- All state mutations emit domain events
- Events stored in an append-only `audit_events` table
- Event payloads serialized as JSON with cryptographic hash chains (each event hashes the previous event's hash)
- Enables full reconstruction of any entity's history for certification audits

### 5.4 CQRS for Reporting

- **Command side:** Transactional writes through domain services
- **Query side:** Materialized views / read replicas for dashboard and report queries
- Search index (OpenSearch) for full-text finding/evidence search

---

## 6. Multi-Tenancy Strategy

### Model: **Database-per-tenant with shared schema**

```
┌───────────────────────────────────┐
│         PostgreSQL Instance       │
│                                   │
│  ┌──────────┐  ┌──────────┐      │
│  │ Schema:  │  │ Schema:  │ ...  │
│  │ tenant_a │  │ tenant_b │      │
│  │          │  │          │      │
│  │ assets   │  │ assets   │      │
│  │ zones    │  │ zones    │      │
│  │ risks    │  │ risks    │      │
│  └──────────┘  └──────────┘      │
│                                   │
│  ┌──────────────────────────┐    │
│  │ Schema: platform         │    │
│  │  tenants, users,         │    │
│  │  licenses, audit_log     │    │
│  └──────────────────────────┘    │
└───────────────────────────────────┘
```

**Tenant resolution flow:**
1. JWT contains `tenant_id` claim
2. Middleware extracts `tenant_id` → sets `search_path` on PostgreSQL connection
3. All queries automatically scoped to tenant schema
4. Platform schema accessed explicitly via `platform.` prefix

---

## 7. Data Flow — Assessment Lifecycle

```
[Create Engagement]
       │
       ▼
[Import Asset Inventory]────►[Purdue Level Assignment]
       │                              │
       ▼                              ▼
[Define Zones & Conduits]◄────────────┘
       │
       ▼
[Execute Assessment]──►[Record Findings]──►[Attach Evidence]
       │                     │
       ▼                     ▼
[Risk Scoring]        [Remediation Plan]
       │                     │
       ▼                     ▼
[Risk Register]       [Track Remediation]
       │                     │
       ▼                     ▼
[Generate CSMS Gap Report]◄─┘
       │
       ▼
[Export Certification Package]
```

---

## 8. Integration Points

| System | Protocol | Purpose |
|---|---|---|
| Active Directory / Azure AD | SAML 2.0 / OIDC | Enterprise SSO |
| CMDB (ServiceNow, etc.) | REST API | Asset inventory import |
| Vulnerability scanners | STIX/TAXII, CSV | Finding ingestion |
| SIEM | Syslog / CEF | Security event correlation |
| Document management | WebDAV / S3 | Evidence linking |
| Jira / Azure DevOps | REST API | Remediation ticket sync |
| Power BI / Grafana | OData / REST | Dashboard embedding |

---

## 9. Scalability Targets

| Metric | Target |
|---|---|
| Concurrent users per tenant | 500 |
| Total tenants (cloud) | 1,000+ |
| Assessment records per tenant | 100,000+ |
| Evidence files per tenant | 1 TB |
| API response time (p95) | < 200 ms |
| Offline sync conflict resolution | < 2 s per batch |
| Report generation (100-page PDF) | < 30 s |

---

## 10. Disaster Recovery

| Parameter | Value |
|---|---|
| RPO (Recovery Point Objective) | 1 hour (continuous WAL archiving) |
| RTO (Recovery Time Objective) | 4 hours |
| Backup strategy | Continuous WAL + daily full + hourly incremental |
| Evidence vault | S3 versioning + cross-region replication |
| Failover | Automated via health checks; manual promotion for DR region |

---

*Next: [Module Breakdown →](modules.md)*
