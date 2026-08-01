# IEC 62443 Platform — Development Roadmap

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. Roadmap Overview

```
2026 Q3           2026 Q4           2027 Q1           2027 Q2           2027 Q3-Q4
  │                 │                 │                 │                 │
  ▼                 ▼                 ▼                 ▼                 ▼
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│ Phase 1 │    │ Phase 2  │    │ Phase 3  │    │ Phase 4  │    │   Phase 5    │
│         │    │          │    │          │    │          │    │              │
│Foundation│    │ Core     │    │Advanced  │    │ Scale &  │    │ Intelligence │
│& MVP    │    │ Features │    │ Features │    │Integrate │    │  & Ecosystem │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────────┘
```

---

## 2. Phase 1 — Foundation & MVP (Q3 2026)

**Goal:** Establish the platform foundation and deliver a minimum viable product for internal testing.

### 2.1 Infrastructure & DevOps

| Deliverable | Details |
|---|---|
| Monorepo setup | Turborepo + pnpm workspace structure |
| CI/CD pipeline | GitHub Actions: lint, type-check, test, build, deploy to staging |
| Docker environment | Docker Compose for local dev (PostgreSQL, Redis, MinIO, NATS) |
| Staging deployment | Kubernetes cluster on AWS EKS with ArgoCD GitOps |
| Database migrations | Drizzle Kit migration system, seed scripts |
| Monitoring baseline | OpenTelemetry + Prometheus + Grafana dashboard |

### 2.2 Backend Core

| Deliverable | Details |
|---|---|
| Fastify application | Plugin architecture, request lifecycle hooks |
| Authentication | JWT access + refresh tokens, login, register, password reset |
| MFA | TOTP enrollment and verification |
| RBAC middleware | Role resolution, permission checking, tenant scoping |
| Multi-tenancy | Schema-per-tenant provisioning, search_path middleware |
| Audit logging | Event capture middleware, hash-chained audit events |
| Error handling | Standardized error responses, request ID tracking |
| API versioning | URL path versioning (/api/v1) |

### 2.3 Frontend Core

| Deliverable | Details |
|---|---|
| Next.js application | App Router, layouts, authentication flow |
| Design system | Tailwind + Radix UI component library, brand tokens |
| Auth UI | Login, register, MFA enrollment, password reset |
| Dashboard shell | Navigation, sidebar, header, tenant switcher |
| RBAC guards | Route-level and component-level permission checks |
| API client | TanStack Query setup, typed API client, error handling |

### 2.4 Domain — Assessment (MVP)

| Deliverable | Details |
|---|---|
| Assessment templates | IEC 62443-3-2 built-in template with questions |
| Engagement CRUD | Create, list, view, update assessments |
| Question/response flow | Navigate questions, submit responses with scoring |
| Basic scorecard | Current SL vs target SL calculation |
| Assessment progress | Completion percentage tracking |

### 2.5 Domain — Findings (MVP)

| Deliverable | Details |
|---|---|
| Finding CRUD | Create, list, view, update findings |
| Status lifecycle | Draft → Open → Acknowledged → Closed |
| Finding ↔ Assessment link | Associate findings with assessments |
| Basic search | Filter by severity, status, category |

### Phase 1 Exit Criteria
- [ ] User can register, log in with MFA, and access tenant workspace
- [ ] User can create an assessment from the IEC 62443-3-2 template
- [ ] User can answer assessment questions and view scorecard
- [ ] User can create findings linked to assessments
- [ ] All mutations recorded in hash-chained audit log
- [ ] Staging environment deployed with monitoring

---

## 3. Phase 2 — Core Features (Q4 2026)

**Goal:** Complete the core domain modules for first external client engagement.

### 3.1 Risk Management

| Deliverable | Details |
|---|---|
| Risk register CRUD | Create registers, add risk entries |
| Risk scoring | Likelihood × impact matrix, inherent/residual scores |
| Risk treatment | Create treatment plans, track status |
| Risk acceptance | Approval workflow (2-party for high/critical) |
| Risk matrix config | Configurable labels, thresholds, colors |
| Risk heat map | Visual heat map dashboard |

### 3.2 Zone & Conduit Modeling

| Deliverable | Details |
|---|---|
| Zone CRUD | Create zones with SL assignment, sub-zone nesting |
| Conduit CRUD | Define communication paths between zones |
| Zone membership | Assign assets to zones |
| Topology visualization | Interactive zone diagram (ReactFlow) |
| Segmentation rules | Define and track boundary security rules |

### 3.3 Purdue Model

| Deliverable | Details |
|---|---|
| Purdue model CRUD | Create models with standard + custom levels |
| Asset mapping | Assign assets to Purdue levels |
| Communication rules | Define allowed inter-level communications |
| Purdue compliance | Validate communications against rules |
| Purdue diagram | Level-based visualization |

### 3.4 Asset Management

| Deliverable | Details |
|---|---|
| Asset CRUD | Full asset inventory management |
| Asset classification | Type, criticality, vendor, firmware tracking |
| CSV import | Bulk import from spreadsheet |
| Asset relationships | Model connections between assets |
| Asset ↔ Zone/Purdue | Link assets to zones and Purdue levels |

### 3.5 Evidence Management

| Deliverable | Details |
|---|---|
| Evidence upload | Multi-file upload with drag-and-drop |
| Evidence types | Documents, screenshots, configs, logs, scan results |
| Integrity hashing | SHA-256 hash on upload, verification API |
| Evidence linking | Associate evidence with findings, assessments, risks |
| Chain of custody | Track access and transfer events |
| S3/MinIO storage | Encrypted object storage with pre-signed URLs |

### 3.6 Enhanced Findings

| Deliverable | Details |
|---|---|
| Full lifecycle | All status transitions including remediation and verification |
| Finding assignment | Assign to responsible parties with due dates |
| Comments & discussion | Threaded comments on findings |
| Evidence attachment | Link evidence directly to findings |
| Bulk operations | Bulk import, bulk status transition |
| Finding ↔ Risk | Link findings to risk entries |

### 3.7 Reporting (Basic)

| Deliverable | Details |
|---|---|
| Assessment report | PDF export of assessment results + scorecard |
| Risk register report | PDF export of risk register with heat map |
| Finding report | PDF export of findings by severity/status |
| Executive summary | Dashboard with key metrics |

### Phase 2 Exit Criteria
- [ ] Complete risk management workflow with matrix and treatment tracking
- [ ] Zone & conduit modeling with interactive topology diagram
- [ ] Purdue model with asset mapping and compliance checking
- [ ] Evidence upload, integrity verification, and chain of custody
- [ ] Full finding lifecycle with assignment, comments, and bulk operations
- [ ] PDF report generation for assessments, risks, and findings
- [ ] First external client onboarded for pilot

---

## 4. Phase 3 — Advanced Features (Q1 2027)

**Goal:** Deliver advanced capabilities for enterprise consulting workflows.

### 4.1 CSMS Management

| Deliverable | Details |
|---|---|
| CSMS framework | Full IEC 62443-2-1 framework with 14 categories |
| Policy management | Create, version, and approve CSMS policies |
| Gap analysis | Assess current vs required CSMS elements |
| Improvement plans | Track CSMS continuous improvement |
| Review cycles | Scheduled review workflows |

### 4.2 Remediation Tracking

| Deliverable | Details |
|---|---|
| Remediation plans | Group related remediation actions |
| Action tracking | Individual action items with status and milestones |
| Budget tracking | Cost estimation and actual tracking |
| Verification | Post-remediation validation workflow |
| External ticket sync | Jira / Azure DevOps integration |

### 4.3 Advanced Reporting

| Deliverable | Details |
|---|---|
| CSMS gap report | Comprehensive gap analysis report |
| Zone topology report | Exportable zone diagram + compliance status |
| Purdue compliance report | Communication rule violations + recommendations |
| Remediation progress report | Status tracking with budget summary |
| Custom report templates | Configurable report layouts |
| Excel export | Data export to Excel for offline analysis |

### 4.4 Offline / Field Work

| Deliverable | Details |
|---|---|
| PWA setup | Service worker, offline-capable shell |
| IndexedDB sync | Client-side data store with sync queue |
| Offline assessment | Answer questions without connectivity |
| Offline findings | Create findings with evidence attachments |
| Conflict resolution | Server-wins strategy with manual override |
| Sync status UI | Visual indicator of online/offline state |

### 4.5 Notification System

| Deliverable | Details |
|---|---|
| In-app notifications | Real-time notification center |
| Email notifications | Configurable email alerts per event type |
| Digest mode | Daily/weekly summary emails |
| WebSocket delivery | Real-time push for in-app notifications |
| Escalation rules | Auto-escalate overdue findings and remediation actions |

### Phase 3 Exit Criteria
- [ ] CSMS framework with policy management and gap analysis
- [ ] Remediation tracking with budget and verification workflows
- [ ] Offline-capable field assessment (PWA + sync)
- [ ] Notification system with email and in-app delivery
- [ ] Advanced report generation across all domains

---

## 5. Phase 4 — Scale & Integration (Q2 2027)

**Goal:** Enterprise-scale features, external integrations, and certification readiness.

### 5.1 Integration Hub

| Deliverable | Details |
|---|---|
| CMDB import | ServiceNow / REST API asset import |
| Vulnerability scanner import | Nessus, Qualys, OpenVAS finding import |
| SIEM integration | Syslog/CEF event forwarding |
| Webhook system | Outbound webhooks with retry and dead letter queue |
| API key management | Scoped API keys for integrations |
| Integration dashboard | Health monitoring for all integrations |

### 5.2 Enterprise Features

| Deliverable | Details |
|---|---|
| SSO (SAML/OIDC) | Azure AD, Okta, Keycloak integration |
| SCIM provisioning | Automated user provisioning from IdP |
| Custom roles | Tenant-defined roles with custom permissions |
| Data residency | Region selection for data storage |
| White-labeling | Custom branding, domain, and email templates |
| SLA management | Uptime tracking and SLA reporting |

### 5.3 Multi-Assessment Management

| Deliverable | Details |
|---|---|
| Assessment programs | Group related assessments across facilities |
| Cross-assessment analytics | Trend analysis, benchmarking |
| Assessment scheduling | Recurring assessment calendars |
| Comparison reports | Year-over-year security posture comparison |
| Portfolio dashboard | Multi-facility security overview |

### 5.4 Security Hardening

| Deliverable | Details |
|---|---|
| Penetration testing | Third-party pen test + remediation |
| SOC 2 Type II | Audit preparation and evidence collection |
| WebAuthn/FIDO2 | Passkey authentication support |
| Advanced audit | Full entity history reconstruction |
| Anomaly detection | ML-based unusual activity detection |

### Phase 4 Exit Criteria
- [ ] 3+ external integrations operational (CMDB, scanner, SIEM)
- [ ] SSO with at least 2 identity providers
- [ ] SOC 2 Type II audit completed
- [ ] Penetration test completed with all critical/high findings resolved
- [ ] Multi-assessment portfolio management
- [ ] 10+ active tenants on production

---

## 6. Phase 5 — Intelligence & Ecosystem (Q3-Q4 2027)

**Goal:** AI-assisted features, marketplace, and long-term ecosystem growth.

### 6.1 AI-Assisted Features

| Deliverable | Details |
|---|---|
| Finding auto-classification | ML-based severity and category suggestion |
| Risk prediction | Historical data-driven risk trend forecasting |
| Remediation recommendation | Suggest treatments based on similar findings |
| Report narrative generation | AI-assisted executive summary writing |
| Anomaly correlation | Link related findings across assessments |
| IEC 62443 clause mapping | Auto-map findings to IEC requirements |

### 6.2 Mobile Application

| Deliverable | Details |
|---|---|
| React Native app | iOS + Android native application |
| Field assessment | Mobile-optimized assessment workflow |
| Photo capture | Camera integration for evidence photos |
| Barcode scanning | Asset identification via barcode/QR code |
| Push notifications | Real-time mobile notifications |
| Offline mode | Full offline support with sync |

### 6.3 Template & Knowledge Marketplace

| Deliverable | Details |
|---|---|
| Template library | Community-contributed assessment templates |
| Best practice guides | In-app guidance for IEC 62443 implementation |
| Benchmark data | Anonymized industry benchmark comparisons |
| Plugin system | Extensible architecture for custom modules |

### 6.4 Advanced Analytics

| Deliverable | Details |
|---|---|
| Security posture scoring | Composite security score across all dimensions |
| Executive dashboards | C-suite focused KPI dashboards |
| Regulatory mapping | Map IEC 62443 controls to NIST, ISO 27001, etc. |
| Custom analytics | User-defined dashboards and reports |
| Data warehouse | Analytics-optimized data store for historical analysis |

### Phase 5 Exit Criteria
- [ ] AI-assisted finding classification operational
- [ ] Mobile app published (iOS + Android)
- [ ] Template marketplace with 20+ community templates
- [ ] Security posture scoring algorithm validated
- [ ] 50+ active tenants

---

## 7. Team Composition

### Phase 1–2 (Foundation + Core)

| Role | Count | Focus |
|---|---|---|
| Technical Lead / Architect | 1 | Architecture, code review, technical decisions |
| Senior Backend Engineer | 2 | API, database, domain services |
| Senior Frontend Engineer | 2 | UI, state management, design system |
| DevOps Engineer | 1 | Infrastructure, CI/CD, monitoring |
| QA Engineer | 1 | Test strategy, E2E tests, performance tests |
| Product Owner | 1 | Requirements, prioritization, stakeholder management |
| IEC 62443 Subject Matter Expert | 1 (part-time) | Domain accuracy, template authoring |

### Phase 3–4 (Advanced + Scale)

| Role | Count | Focus |
|---|---|---|
| Backend Engineer | +2 | Integration hub, offline sync, CSMS |
| Frontend Engineer | +1 | Advanced visualizations, offline UI |
| Security Engineer | 1 | Pen test prep, SOC 2, security features |
| DevOps Engineer | +1 | Multi-region, scaling, SLA management |
| Technical Writer | 1 | Documentation, API docs, user guides |

### Phase 5 (Intelligence)

| Role | Count | Focus |
|---|---|---|
| ML Engineer | 1 | AI features, classification models |
| Mobile Engineer | 2 | React Native app (iOS + Android) |
| Data Engineer | 1 | Analytics, data warehouse, benchmarks |

---

## 8. Key Milestones

| Date | Milestone | Success Criteria |
|---|---|---|
| 2026-08-15 | **M1: Dev environment ready** | Monorepo, CI/CD, Docker Compose operational |
| 2026-09-15 | **M2: Auth + RBAC complete** | Full auth flow, MFA, tenant scoping |
| 2026-09-30 | **M3: Assessment MVP** | IEC 62443-3-2 assessment end-to-end |
| 2026-10-31 | **M4: Findings MVP** | Finding lifecycle with evidence attachment |
| 2026-11-30 | **M5: Internal alpha** | Full Phase 1+2 scope, internal testing |
| 2026-12-31 | **M6: Pilot client** | First external client using platform |
| 2027-02-28 | **M7: CSMS + Remediation** | Phase 3 core features complete |
| 2027-03-31 | **M8: Offline support** | PWA with offline assessment capability |
| 2027-05-31 | **M9: Enterprise integrations** | SSO + CMDB + scanner integrations |
| 2027-06-30 | **M10: SOC 2 certified** | Type II audit completed |
| 2027-09-30 | **M11: Mobile app** | iOS + Android app published |
| 2027-12-31 | **M12: AI features** | ML-assisted classification live |

---

## 9. Risk Register (Project)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IEC 62443 standard updates require template rework | Medium | Medium | Modular template design; version templates |
| Multi-tenancy performance at scale | Medium | High | Load test early; plan for read replicas, partitioning |
| Offline sync conflict complexity | High | Medium | Start with simple server-wins; iterate |
| Key person dependency (SME) | Medium | High | Document domain knowledge; cross-train engineers |
| Scope creep from consulting clients | High | Medium | Strict phase scope; feature requests go to backlog |
| Third-party dependency vulnerability | Medium | High | Dependency scanning, SBOM, patch SLA |
| Data residency regulatory complexity | Low | High | Region-specific legal review before expansion |

---

## 10. Success Metrics

| Metric | Target (Year 1) | Target (Year 2) |
|---|---|---|
| Active tenants | 20 | 100 |
| Assessments completed | 100 | 1,000 |
| Findings tracked | 5,000 | 50,000 |
| Reports generated | 200 | 2,000 |
| Platform uptime | 99.5% | 99.9% |
| API response time (p95) | < 300 ms | < 200 ms |
| Customer satisfaction (NPS) | > 40 | > 60 |
| Time to complete assessment | -30% vs manual | -50% vs manual |

---

*Back to: [Application Architecture →](architecture.md)*
