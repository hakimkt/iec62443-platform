# Implementation Blueprint — Development Sequence

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Safest implementation order: foundation → shell → core → domain → polish

---

## 1. Sequencing Principles

| Principle | Rationale |
|---|---|
| **Dependency-first** | Build entities before screens that depend on them |
| **Horizontal slices** | Each sprint delivers a working feature end-to-end (DB → API → UI) |
| **Shell early** | AppShell, auth, and navigation enable testing all subsequent screens |
| **Primitives before composed** | UI primitives must exist before any feature screen can render |
| **Read before write** | List/view screens before create/edit screens (easier to test) |
| **Static before dynamic** | Reference data screens before interactive workflows |
| **Defer complex viz** | Charts and diagrams after core CRUD is working |

---

## 2. Implementation Phases

### Phase 0: Foundation (Week 1–2)

**Goal:** Monorepo, CI/CD, shared packages, database schema ready

```
Week 1: Infrastructure
┌──────────────────────────────────────────────────────────────────────┐
│  [ ] Monorepo setup (Turborepo + pnpm workspace)                    │
│  [ ] TypeScript base config, ESLint, Prettier                        │
│  [ ] Docker Compose (PostgreSQL, Redis, MinIO, NATS)                │
│  [ ] CI pipeline (lint, type-check, test, build)                    │
│  [ ] Tailwind preset with design tokens from design-system.md        │
└──────────────────────────────────────────────────────────────────────┘

Week 2: Shared Packages + Database
┌──────────────────────────────────────────────────────────────────────┐
│  [ ] packages/shared-types/ — Domain TypeScript interfaces          │
│  [ ] packages/shared-schemas/ — Zod validation schemas (P0–P3)      │
│  [ ] packages/database/ — Drizzle schema + migrations (P0–P1)       │
│  [ ] packages/ui/ — Package setup, Radix UI install                 │
│  [ ] packages/api-client/ — Base fetch client setup                 │
│  [ ] packages/auth/ — JWT context, permission hooks                 │
│  [ ] Database seed scripts (system roles, default templates)        │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** `pnpm build` passes, Docker Compose starts all services, Drizzle migrations apply cleanly.

---

### Phase 1: Primitives + Auth (Week 3–4)

**Goal:** All UI primitives working, authentication flow end-to-end

```
Week 3: UI Primitives
┌──────────────────────────────────────────────────────────────────────┐
│  UI Layer — packages/ui/src/primitives/                             │
│  ─────────────────────────────────────────                          │
│  [ ] Button (6 variants)                                            │
│  [ ] Input, Textarea (with prefix/suffix/error states)              │
│  [ ] Select (single + multi)                                        │
│  [ ] Checkbox, RadioGroup, Switch                                   │
│  [ ] Badge (status, variant, outline)                               │
│  [ ] Dialog (sm/md/lg/xl)                                           │
│  [ ] DropdownMenu, Popover, Tooltip                                 │
│  [ ] Tabs, Accordion                                                │
│  [ ] Avatar, Separator, ScrollArea, Skeleton                        │
│  [ ] Label, Slider, ProgressBar                                     │
│  [ ] Toast (via Sonner)                                             │
└──────────────────────────────────────────────────────────────────────┘

Week 4: Auth Screens + Backend Auth API
┌──────────────────────────────────────────────────────────────────────┐
│  API Layer — apps/api/src/modules/auth/                             │
│  ───────────────────────────────────                                │
│  [ ] POST /auth/login                                               │
│  [ ] POST /auth/register                                            │
│  [ ] POST /auth/refresh                                             │
│  [ ] POST /auth/logout                                              │
│  [ ] POST /auth/forgot-password                                     │
│  [ ] POST /auth/reset-password                                      │
│  [ ] POST /auth/mfa/setup, /auth/mfa/verify, /auth/mfa/challenge    │
│  [ ] JWT middleware (verify, refresh, tenant extraction)            │
│                                                                     │
│  Frontend — apps/web/app/(auth)/                                    │
│  ──────────────────────────────────                                 │
│  [ ] Root layout (Providers: QueryClient, Theme, Auth, Tenant, WS) │
│  [ ] /auth/login (email/password + MFA flow)                       │
│  [ ] /auth/register                                                 │
│  [ ] /auth/forgot-password                                          │
│  [ ] /auth/reset-password                                           │
│  [ ] /auth/mfa/setup                                                │
│  [ ] Middleware (auth guard, redirect logic)                        │
│                                                                     │
│  Database — platform schema                                         │
│  ───────────────────────                                            │
│  [ ] platform.users                                                 │
│  [ ] platform.tenants                                               │
│  [ ] platform.tenant_memberships                                    │
│  [ ] platform.roles                                                 │
│  [ ] platform.user_roles                                            │
│  [ ] platform.audit_events                                          │
│  [ ] Seed: system roles (Tenant Owner, Admin, Lead Assessor, etc.) │
│  [ ] Seed: demo tenant + user                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** User can register, login with MFA, receive JWT, and see a protected page.

---

### Phase 2: App Shell (Week 5–6)

**Goal:** Complete authenticated shell with navigation, theme, and empty dashboard

```
Week 5: Shell Components
┌──────────────────────────────────────────────────────────────────────┐
│  UI Layer — packages/ui/src/components/                             │
│  ─────────────────────────────────────────                          │
│  [ ] PageHeader                                                     │
│  [ ] Breadcrumb                                                     │
│  [ ] FilterBar, SearchInput                                         │
│  [ ] Pagination                                                     │
│  [ ] EmptyState                                                     │
│  [ ] ConfirmDialog                                                  │
│  [ ] FormField, FormGroup                                           │
│  [ ] RelativeTime                                                   │
│  [ ] CopyButton                                                     │
│                                                                     │
│  Frontend — apps/web/src/components/                                │
│  ──────────────────────────────────────                             │
│  [ ] layout/AppShell.tsx (Sidebar + TopBar + Content)              │
│  [ ] layout/Sidebar.tsx (collapsible, nav items from config)       │
│  [ ] layout/SidebarNavItem.tsx                                      │
│  [ ] layout/TopBar.tsx                                              │
│  [ ] shared/UserMenu.tsx                                            │
│  [ ] shared/TenantSwitcher.tsx                                      │
│  [ ] shared/ThemeToggle.tsx                                         │
│  [ ] shared/OfflineBanner.tsx                                       │
│  [ ] shared/SyncStatusIndicator.tsx                                 │
└──────────────────────────────────────────────────────────────────────┘

Week 6: Shell Integration + Empty Dashboard
┌──────────────────────────────────────────────────────────────────────┐
│  Frontend — apps/web/app/(app)/                                     │
│  ───────────────────────────────────                                │
│  [ ] (app)/layout.tsx (AppShell wrapper)                            │
│  [ ] (app)/dashboard/page.tsx (empty state)                         │
│  [ ] not-found.tsx, error.tsx, loading.tsx                          │
│  [ ] Nav config (route → icon → label → required permissions)      │
│  [ ] Role-based nav filtering (visibility matrix from sitemap.md)   │
│  [ ] Theme persistence (localStorage + system preference)           │
│                                                                     │
│  Zustand Stores                                                     │
│  ───────────────                                                    │
│  [ ] UI Store (sidebar, context panel, theme, command palette)     │
│  [ ] Offline Store (connectivity, sync queue)                       │
│  [ ] Notification Store                                             │
│                                                                     │
│  WebSocket                                                          │
│  ───────────                                                        │
│  [ ] WebSocketProvider (connection management)                      │
│  [ ] Event handler map (empty — ready for later events)            │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** Logged-in user sees sidebar, top bar, content area. Navigation works. Theme toggles. Empty dashboard renders.

---

### Phase 3: Composed Components + Assessment CRUD (Week 7–9)

**Goal:** Core composed UI components + first domain feature (assessments)

```
Week 7: Composed UI Components
┌──────────────────────────────────────────────────────────────────────┐
│  UI Layer — packages/ui/src/components/ (continued)                 │
│  ─────────────────────────────────────────                          │
│  [ ] DataTable (with sorting, pagination, selection, column toggle) │
│  [ ] DataCard                                                       │
│  [ ] MetricCard                                                     │
│  [ ] StatusBadge, SeverityBadge, SecurityLevelBadge                 │
│  [ ] PurdueLevelBadge, IconBadge                                    │
│  [ ] ContextPanel                                                   │
│  [ ] FileUpload                                                     │
│  [ ] DateRangePicker                                                │
│  [ ] TagInput                                                       │
│  [ ] UserAvatar                                                     │
│  [ ] EntityLink                                                     │
│  [ ] FormWizard                                                     │
│  [ ] NotificationToast                                              │
│  [ ] CommandPalette                                                 │
│  [ ] OfflineIndicator                                               │
└──────────────────────────────────────────────────────────────────────┘

Week 8: Assessment Backend + Primitives
┌──────────────────────────────────────────────────────────────────────┐
│  Database — assessment schema                                       │
│  ───────────────────────────                                        │
│  [ ] assessment.templates                                           │
│  [ ] assessment.questions                                           │
│  [ ] assessment.engagements                                         │
│  [ ] assessment.responses                                           │
│  [ ] assessment.scorecards                                          │
│  [ ] Seed: IEC 62443-3-2 template (all 48 questions)               │
│                                                                     │
│  API — apps/api/src/modules/assessment/                             │
│  ───────────────────────────────────────                            │
│  [ ] GET  /assessment-templates                                     │
│  [ ] POST /assessment-templates                                     │
│  [ ] GET  /assessments                                              │
│  [ ] POST /assessments                                              │
│  [ ] GET  /assessments/:id                                          │
│  [ ] PATCH /assessments/:id                                         │
│  [ ] DELETE /assessments/:id                                        │
│  [ ] GET  /assessments/:id/questions                                │
│  [ ] GET  /assessments/:id/scorecard                                │
│  [ ] GET  /assessments/:id/progress                                 │
└──────────────────────────────────────────────────────────────────────┘

Week 9: Assessment Frontend
┌──────────────────────────────────────────────────────────────────────┐
│  API Client — packages/api-client/                                  │
│  ───────────────────────────                                        │
│  [ ] useAssessments (list query)                                    │
│  [ ] useAssessment (detail query)                                   │
│  [ ] useCreateAssessment (mutation)                                 │
│  [ ] useUpdateAssessment (mutation)                                 │
│  [ ] useDeleteAssessment (mutation)                                 │
│  [ ] useAssessmentTemplates (query)                                 │
│  [ ] useAssessmentScorecard (query)                                 │
│  [ ] useAssessmentQuestions (query)                                 │
│  [ ] useAssessmentProgress (query)                                  │
│                                                                     │
│  Frontend — apps/web/app/(app)/assessments/                        │
│  ───────────────────────────────────────────                        │
│  [ ] assessment/AssessmentCard.tsx                                  │
│  [ ] assessment/AssessmentTable.tsx                                 │
│  [ ] page.tsx (list with DataTable)                                 │
│  [ ] AssessmentWizard.tsx (create form, 4 steps)                   │
│  [ ] TemplateSelector.tsx                                           │
│  [ ] new/page.tsx (wizard route)                                    │
│  [ ] [id]/page.tsx (detail with tabs: Summary, Scorecard)          │
│  [ ] AssessmentSummary.tsx                                          │
│  [ ] ScorecardRadar.tsx                                             │
│  [ ] ScorecardTable.tsx                                             │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** User can create an assessment from template, view it, see scorecard. List, create, view, delete all working.

---

### Phase 4: Findings + Questions (Week 10–12)

**Goal:** Finding management + assessment question flow

```
Week 10: Finding Backend + API
┌──────────────────────────────────────────────────────────────────────┐
│  Database — findings schema                                         │
│  ─────────────────────────────                                      │
│  [ ] findings.findings                                              │
│  [ ] findings.status_history                                        │
│  [ ] findings.comments                                              │
│                                                                     │
│  API — apps/api/src/modules/finding/                                │
│  ───────────────────────────────────                                │
│  [ ] GET  /findings (with filters)                                  │
│  [ ] POST /findings                                                 │
│  [ ] GET  /findings/:id                                             │
│  [ ] PATCH /findings/:id                                            │
│  [ ] DELETE /findings/:id                                           │
│  [ ] POST /findings/:id/transition                                  │
│  [ ] GET  /findings/:id/history                                     │
│  [ ] POST /findings/:id/comments                                    │
│  [ ] GET  /findings/:id/comments                                    │
│  [ ] POST /findings/:id/evidence                                    │
│  [ ] GET  /findings/:id/evidence                                    │
│  [ ] WS: finding.updated event emitter                              │
└──────────────────────────────────────────────────────────────────────┘

Week 11: Finding Frontend
┌──────────────────────────────────────────────────────────────────────┐
│  API Client — packages/api-client/                                  │
│  ───────────────────────────                                        │
│  [ ] useFindings (list query)                                       │
│  [ ] useFinding (detail query)                                      │
│  [ ] useCreateFinding (mutation)                                    │
│  [ ] useUpdateFinding (mutation)                                    │
│  [ ] useTransitionFinding (mutation)                                │
│  [ ] useFindingHistory (query)                                      │
│  [ ] useFindingComments (query)                                     │
│  [ ] useAddComment (mutation)                                       │
│                                                                     │
│  Frontend — apps/web/app/(app)/findings/                           │
│  ─────────────────────────────────────                              │
│  [ ] finding/FindingTable.tsx                                       │
│  [ ] finding/FindingDetailPanel.tsx                                 │
│  [ ] finding/FindingForm.tsx                                        │
│  [ ] finding/FindingStatusTransition.tsx                            │
│  [ ] finding/FindingComments.tsx                                    │
│  [ ] finding/SeveritySummaryStrip.tsx                               │
│  [ ] page.tsx (list with filter bar)                                │
│  [ ] ContextPanel integration (row click → detail panel)           │
│  [ ] WebSocket handler: finding.updated → invalidate queries       │
└──────────────────────────────────────────────────────────────────────┘

Week 12: Assessment Question Flow
┌──────────────────────────────────────────────────────────────────────┐
│  API — apps/api/src/modules/assessment/                             │
│  ───────────────────────────────────────                            │
│  [ ] PUT  /assessments/:id/questions/:qId/response                  │
│  [ ] POST /assessments/:id/questions/batch-response                 │
│  [ ] POST /assessments/:id/complete                                 │
│  [ ] WS: assessment.progress event emitter                          │
│                                                                     │
│  Frontend — apps/web/app/(app)/assessments/[id]/questions/         │
│  ──────────────────────────────────────────────────────────         │
│  [ ] assessment/QuestionNavigator.tsx (sidebar)                     │
│  [ ] assessment/QuestionCard.tsx                                    │
│  [ ] page.tsx (3-column layout: nav + question + quick ref)        │
│  [ ] Auto-save on blur (debounced 500ms)                            │
│  [ ] Progress bar                                                   │
│  [ ] Keyboard navigation (← →)                                      │
│  [ ] "Create Finding" from question                                 │
│  [ ] WebSocket handler: assessment.progress                         │
│                                                                     │
│  Zustand                                                            │
│  ────────                                                           │
│  [ ] AssessmentWizardStore (multi-step state)                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** User can answer assessment questions with auto-save. Can create findings from questions. Finding lifecycle (create → acknowledge → close) works.

---

### Phase 5: Asset Inventory + Evidence (Week 13–14)

**Goal:** Asset CRUD + evidence upload/management

```
Week 13: Asset Backend + Frontend
┌──────────────────────────────────────────────────────────────────────┐
│  Database — asset schema                                            │
│  ────────────────────────                                           │
│  [ ] asset.assets                                                   │
│  [ ] asset.relationships                                            │
│  [ ] asset.import_jobs                                              │
│                                                                     │
│  API — apps/api/src/modules/asset/                                  │
│  ──────────────────────────────────                                 │
│  [ ] GET  /assets (with filters)                                    │
│  [ ] POST /assets                                                   │
│  [ ] GET  /assets/:id                                               │
│  [ ] PATCH /assets/:id                                              │
│  [ ] DELETE /assets/:id                                             │
│  [ ] GET  /assets/stats                                             │
│  [ ] POST /assets/import                                            │
│  [ ] GET  /assets/import/:jobId                                     │
│  [ ] GET  /assets/export                                            │
│                                                                     │
│  Frontend — apps/web/app/(app)/assets/                             │
│  ─────────────────────────────────────                              │
│  [ ] asset/AssetTable.tsx                                           │
│  [ ] asset/AssetDetailPanel.tsx                                     │
│  [ ] asset/AssetForm.tsx                                            │
│  [ ] asset/AssetStatsRow.tsx                                        │
│  [ ] asset/AssetTypeIcon.tsx                                        │
│  [ ] asset/AssetImportWizard.tsx                                    │
│  [ ] page.tsx (list with stats + filter)                            │
│  [ ] import/page.tsx (CSV import flow)                              │
└──────────────────────────────────────────────────────────────────────┘

Week 14: Evidence Backend + Frontend
┌──────────────────────────────────────────────────────────────────────┐
│  Database — evidence schema                                         │
│  ─────────────────────────────                                      │
│  [ ] evidence.files                                                 │
│  [ ] evidence.items                                                 │
│  [ ] evidence.links                                                 │
│  [ ] evidence.chain_of_custody                                      │
│                                                                     │
│  API — apps/api/src/modules/evidence/                               │
│  ───────────────────────────────────                                │
│  [ ] POST /evidence (multipart upload)                              │
│  [ ] GET  /evidence (with filters)                                  │
│  [ ] GET  /evidence/:id                                             │
│  [ ] PATCH /evidence/:id                                            │
│  [ ] DELETE /evidence/:id                                           │
│  [ ] GET  /evidence/:id/file (pre-signed URL redirect)              │
│  [ ] GET  /evidence/:id/chain-of-custody                            │
│  [ ] GET  /evidence/:id/verify                                      │
│  [ ] POST /evidence/:id/link                                        │
│  [ ] GET  /tenant/storage (quota usage)                             │
│                                                                     │
│  Frontend — apps/web/app/(app)/evidence/                           │
│  ─────────────────────────────────────                              │
│  [ ] evidence/EvidenceGrid.tsx                                      │
│  [ ] evidence/EvidenceTable.tsx                                     │
│  [ ] evidence/EvidenceUploadZone.tsx                                │
│  [ ] evidence/PdfPreview.tsx                                        │
│  [ ] evidence/ImagePreview.tsx                                      │
│  [ ] evidence/ChainOfCustodyTimeline.tsx                            │
│  [ ] evidence/IntegrityBadge.tsx                                    │
│  [ ] evidence/StorageUsageBar.tsx                                   │
│  [ ] page.tsx (grid view)                                           │
│  [ ] upload/page.tsx (upload wizard)                                │
│                                                                     │
│  Integration                                                        │
│  ───────────                                                        │
│  [ ] S3/MinIO upload integration                                    │
│  [ ] SHA-256 hash computation                                       │
│  [ ] ClamAV virus scan (optional)                                   │
│  [ ] Pre-signed URL download                                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** User can manage assets (CRUD + CSV import). Can upload evidence with integrity verification. Evidence links to findings.

---

### Phase 6: Risk + Zone + Purdue (Week 15–18)

**Goal:** Risk register, zone designer, Purdue model

```
Week 15: Risk Backend + List
┌──────────────────────────────────────────────────────────────────────┐
│  Database — risk schema                                             │
│  ────────────────────────                                           │
│  [ ] risk.registers                                                 │
│  [ ] risk.entries                                                   │
│  [ ] risk.treatments                                                │
│  [ ] risk.acceptances                                               │
│  [ ] risk.matrix_config                                             │
│                                                                     │
│  API — apps/api/src/modules/risk/                                   │
│  ──────────────────────────────────                                 │
│  [ ] CRUD for risk-registers, risks, treatments, acceptances        │
│  [ ] GET  /risk-registers/:id/heatmap                               │
│  [ ] GET  /risk-registers/:id/matrix                                │
│  [ ] PUT  /risk-registers/:id/matrix                                │
│  [ ] WS: risk.level_changed event emitter                           │
│                                                                     │
│  Frontend — apps/web/app/(app)/risks/                              │
│  ────────────────────────────────────                               │
│  [ ] risk/RiskTable.tsx                                             │
│  [ ] risk/RiskDetailPanel.tsx                                       │
│  [ ] risk/RiskScoringForm.tsx                                       │
│  [ ] risk/TreatmentList.tsx                                         │
│  [ ] risk/RiskAcceptanceForm.tsx                                    │
│  [ ] page.tsx (list)                                                │
└──────────────────────────────────────────────────────────────────────┘

Week 16: Risk Heat Map + Distribution
┌──────────────────────────────────────────────────────────────────────┐
│  Charts — packages/ui/src/charts/                                   │
│  ──────────────────────────────────                                 │
│  [ ] charts/RiskHeatMap.tsx (custom CSS Grid)                       │
│  [ ] charts/LineChart.tsx (Recharts)                                │
│  [ ] charts/BarChart.tsx (Recharts)                                 │
│                                                                     │
│  Frontend — apps/web/app/(app)/risks/matrix/                       │
│  ────────────────────────────────────────────                       │
│  [ ] risk/RiskMatrixView.tsx                                        │
│  [ ] risk/RiskDistributionChart.tsx                                 │
│  [ ] risk/RiskTrendChart.tsx                                        │
│  [ ] risk/TopRisksList.tsx                                          │
│  [ ] matrix/page.tsx                                                │
│  [ ] WebSocket handler: risk.level_changed → invalidate heatmap    │
└──────────────────────────────────────────────────────────────────────┘

Week 17: Zone & Conduit Backend + Designer
┌──────────────────────────────────────────────────────────────────────┐
│  Database — zone schema                                             │
│  ────────────────────────                                           │
│  [ ] zone.zones                                                     │
│  [ ] zone.conduits                                                  │
│  [ ] zone.memberships                                               │
│  [ ] zone.segmentation_rules                                        │
│                                                                     │
│  API — apps/api/src/modules/zone/                                   │
│  ──────────────────────────────────                                 │
│  [ ] CRUD for zones, conduits, memberships, rules                   │
│  [ ] GET  /zone-topology                                            │
│  [ ] PUT  /zone-topology                                            │
│                                                                     │
│  Frontend — apps/web/app/(app)/zones/                              │
│  ────────────────────────────────────                               │
│  [ ] zone/ZoneTopologyDesigner.tsx (ReactFlow)                      │
│  [ ] zone/ZoneNode.tsx (custom ReactFlow node)                      │
│  [ ] zone/ConduitEdge.tsx (custom ReactFlow edge)                   │
│  [ ] zone/ZonePropertiesPanel.tsx                                   │
│  [ ] zone/ZoneCard.tsx                                              │
│  [ ] zone/ZoneTable.tsx                                             │
│  [ ] zone/ConduitList.tsx                                           │
│  [ ] zone/ConduitDetailPanel.tsx                                    │
│  [ ] designer/page.tsx                                              │
│  [ ] page.tsx (list)                                                │
│                                                                     │
│  Diagrams — packages/ui/src/diagrams/                               │
│  ─────────────────────────────────────                              │
│  [ ] diagrams/ZoneTopology.tsx                                      │
│  [ ] diagrams/ZoneNode.tsx                                          │
│  [ ] diagrams/ConduitEdge.tsx                                       │
│  [ ] diagrams/SubZoneNode.tsx                                       │
└──────────────────────────────────────────────────────────────────────┘

Week 18: Purdue Model
┌──────────────────────────────────────────────────────────────────────┐
│  Database — purdue schema                                           │
│  ────────────────────────                                           │
│  [ ] purdue.models                                                  │
│  [ ] purdue.levels                                                  │
│  [ ] purdue.asset_mappings                                          │
│  [ ] purdue.communication_rules                                     │
│                                                                     │
│  API — apps/api/src/modules/purdue/                                 │
│  ──────────────────────────────────                                 │
│  [ ] CRUD for models, levels, asset_mappings, rules                 │
│  [ ] GET  /purdue-models/:id/compliance                             │
│                                                                     │
│  Frontend — apps/web/app/(app)/purdue/                             │
│  ────────────────────────────────────                               │
│  [ ] purdue/PurdueModelDiagram.tsx (ReactFlow)                      │
│  [ ] purdue/PurdueLevelBand.tsx (custom node)                       │
│  [ ] purdue/AssetChip.tsx (custom node)                             │
│  [ ] purdue/CommunicationRulesTable.tsx                             │
│  [ ] purdue/PurdueComplianceSummary.tsx                             │
│  [ ] page.tsx (list)                                                │
│  [ ] [id]/page.tsx (visualization)                                  │
│  [ ] [id]/rules/page.tsx                                            │
│                                                                     │
│  Diagrams — packages/ui/src/diagrams/                               │
│  ─────────────────────────────────────                              │
│  [ ] diagrams/PurdueModel.tsx                                       │
│  [ ] diagrams/PurdueLevelBand.tsx                                   │
│  [ ] diagrams/AssetChip.tsx                                         │
│  [ ] diagrams/CommunicationArrow.tsx                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** Risk register with heat map works. Zone designer with drag-and-drop works. Purdue model visualization works. All three cross-reference assets.

---

### Phase 7: Dashboard + Reports (Week 19–20)

**Goal:** Executive dashboard with all widgets, report generation

```
Week 19: Executive Dashboard
┌──────────────────────────────────────────────────────────────────────┐
│  API — apps/api/src/modules/dashboard/                              │
│  ───────────────────────────────────────                            │
│  [ ] GET  /dashboard/summary (KPI data)                             │
│  [ ] GET  /dashboard/risk-heatmap                                   │
│  [ ] GET  /dashboard/remediation-status                             │
│                                                                     │
│  Charts — packages/ui/src/charts/                                   │
│  ──────────────────────────────────                                 │
│  [ ] charts/RadarChart.tsx (Recharts)                               │
│  [ ] charts/GaugeChart.tsx (Recharts)                               │
│  [ ] charts/Sparkline.tsx (Recharts)                                │
│  [ ] charts/TrendArrow.tsx (Custom SVG)                             │
│                                                                     │
│  Frontend — apps/web/app/(app)/dashboard/                          │
│  ────────────────────────────────────                               │
│  [ ] dashboard/DashboardGrid.tsx                                    │
│  [ ] dashboard/SecurityScoreCard.tsx                                │
│  [ ] dashboard/FindingsSummaryCard.tsx                              │
│  [ ] dashboard/RisksSummaryCard.tsx                                 │
│  [ ] dashboard/RemediationSummaryCard.tsx                           │
│  [ ] dashboard/ScorecardRadarWidget.tsx                             │
│  [ ] dashboard/AssessmentProgressList.tsx                           │
│  [ ] dashboard/RiskHeatMapWidget.tsx                                │
│  [ ] dashboard/RecentFindingsList.tsx                               │
│  [ ] dashboard/RemediationTimelineWidget.tsx                        │
│  [ ] page.tsx (full dashboard layout)                               │
│  [ ] GlobalSearch.tsx (Cmd+K)                                       │
│  [ ] NotificationCenter.tsx                                         │
└──────────────────────────────────────────────────────────────────────┘

Week 20: Report Generator
┌──────────────────────────────────────────────────────────────────────┐
│  API — apps/api/src/modules/report/                                 │
│  ───────────────────────────────────                                │
│  [ ] GET  /reports/templates                                        │
│  [ ] POST /reports/generate (async job)                             │
│  [ ] GET  /reports/:id (status check)                               │
│  [ ] GET  /reports/:id/download                                     │
│  [ ] DELETE /reports/:id                                            │
│  [ ] WS: report.completed event emitter                             │
│                                                                     │
│  Worker — apps/worker/src/jobs/                                     │
│  ──────────────────────────────────                                 │
│  [ ] report-generation.ts (Puppeteer + Handlebars)                  │
│                                                                     │
│  Frontend — apps/web/app/(app)/reports/                            │
│  ────────────────────────────────────                               │
│  [ ] report/ReportTemplateSelector.tsx                              │
│  [ ] report/ReportConfigForm.tsx                                    │
│  [ ] report/ReportList.tsx                                          │
│  [ ] report/ReportStatusBadge.tsx                                   │
│  [ ] page.tsx                                                       │
│  [ ] generate/page.tsx                                              │
│  [ ] WebSocket handler: report.completed → invalidate              │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** Dashboard renders all widgets with real data. Reports generate as PDF and download.

---

### Phase 8: Remediation + CSMS + Admin (Week 21–23)

**Goal:** Remediation tracking, CSMS management, administration screens

```
Week 21: Remediation
┌──────────────────────────────────────────────────────────────────────┐
│  Database — remediation schema                                      │
│  ───────────────────────────────                                    │
│  [ ] remediation.plans                                              │
│  [ ] remediation.actions                                            │
│  [ ] remediation.verifications                                      │
│                                                                     │
│  API — apps/api/src/modules/remediation/                            │
│  ──────────────────────────────────────                             │
│  [ ] CRUD for plans, actions, verifications                         │
│  [ ] WS: remediation.milestone event emitter                        │
│                                                                     │
│  Frontend — apps/web/app/(app)/remediation/                        │
│  ────────────────────────────────────                               │
│  [ ] remediation/RemediationPlanCard.tsx                            │
│  [ ] remediation/RemediationGantt.tsx                               │
│  [ ] remediation/ActionItemList.tsx                                 │
│  [ ] remediation/ActionItemForm.tsx                                 │
│  [ ] remediation/VerificationForm.tsx                               │
│  [ ] remediation/BudgetDonut.tsx                                    │
│  [ ] page.tsx                                                       │
│                                                                     │
│  Charts — packages/ui/src/charts/                                   │
│  ──────────────────────────────────                                 │
│  [ ] charts/GanttChart.tsx (Custom SVG + date-fns)                  │
│  [ ] charts/DonutChart.tsx (Recharts)                               │
│  [ ] charts/StackedBarChart.tsx (Recharts)                          │
└──────────────────────────────────────────────────────────────────────┘

Week 22: CSMS + Requirement Library
┌──────────────────────────────────────────────────────────────────────┐
│  Database — csms schema                                             │
│  ────────────────────────                                           │
│  [ ] csms.frameworks                                                │
│  [ ] csms.elements                                                  │
│  [ ] csms.policies                                                  │
│  [ ] csms.improvement_plans                                         │
│                                                                     │
│  API — apps/api/src/modules/csms/                                   │
│  ──────────────────────────────────                                 │
│  [ ] CRUD for frameworks, elements, policies, improvement_plans     │
│  [ ] GET  /csms/:id/gap-analysis                                    │
│  [ ] POST /csms/:id/policies/:pId/approve                           │
│                                                                     │
│  Frontend — apps/web/app/(app)/csms/                               │
│  ────────────────────────────────────                               │
│  [ ] csms/CSMSFrameworkCard.tsx                                     │
│  [ ] csms/CSMSlementTree.tsx                                        │
│  [ ] csms/PolicyEditor.tsx                                          │
│  [ ] csms/GapAnalysisView.tsx                                       │
│  [ ] csms/ImprovementPlanList.tsx                                   │
│  [ ] page.tsx                                                       │
│                                                                     │
│  Frontend — apps/web/app/(app)/requirements/                       │
│  ─────────────────────────────────────                              │
│  [ ] requirements/PartTabs.tsx                                      │
│  [ ] requirements/RequirementTree.tsx                               │
│  [ ] requirements/RequirementDetail.tsx                             │
│  [ ] requirements/RequirementSearch.tsx                             │
│  [ ] page.tsx                                                       │
└──────────────────────────────────────────────────────────────────────┘

Week 23: Administration
┌──────────────────────────────────────────────────────────────────────┐
│  Frontend — apps/web/app/(app)/admin/                              │
│  ────────────────────────────────────                               │
│  [ ] admin/MemberTable.tsx                                          │
│  [ ] admin/InviteMemberDialog.tsx                                   │
│  [ ] admin/RoleEditor.tsx                                           │
│  [ ] admin/ApiKeyList.tsx                                           │
│  [ ] admin/AuditLogTable.tsx                                        │
│  [ ] admin/IntegrationCard.tsx                                      │
│  [ ] admin/WebhookEditor.tsx                                        │
│  [ ] admin/WorkspaceSettingsForm.tsx                                │
│  [ ] All admin page.tsx files                                       │
│                                                                     │
│  API — remaining admin endpoints                                    │
│  ──────────────────────────────────                                 │
│  [ ] Tenant member CRUD                                             │
│  [ ] Role CRUD                                                      │
│  [ ] API key CRUD                                                   │
│  [ ] Audit log query + export                                       │
│  [ ] Webhook CRUD                                                   │
│  [ ] Integration config CRUD                                        │
│  [ ] Tenant settings update                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** Full admin panel working. Remediation tracking with Gantt chart. CSMS management with policy approval.

---

### Phase 9: Polish + Testing (Week 24–26)

**Goal:** Performance, accessibility, testing, documentation

```
Week 24: Performance + Accessibility
┌──────────────────────────────────────────────────────────────────────┐
│  [ ] Bundle analysis (@next/bundle-analyzer)                        │
│  [ ] Code splitting audit (dynamic imports for heavy components)    │
│  [ ] Virtual scrolling for large tables                             │
│  [ ] Image optimization (next/image, WebP)                          │
│  [ ] Font optimization (next/font)                                  │
│  [ ] Lighthouse audit (performance, accessibility, SEO, best practice)│
│  [ ] WCAG 2.1 AA compliance check                                   │
│  [ ] Screen reader testing                                          │
│  [ ] Keyboard navigation audit                                      │
│  [ ] prefers-reduced-motion support                                 │
│  [ ] Dark mode polish across all screens                            │
└──────────────────────────────────────────────────────────────────────┘

Week 25: Testing
┌──────────────────────────────────────────────────────────────────────┐
│  Unit Tests (Vitest):                                               │
│  [ ] Shared schemas (Zod validation)                                │
│  [ ] UI primitives (render, interaction)                            │
│  [ ] Utility functions                                              │
│                                                                     │
│  Component Tests (Playwright):                                      │
│  [ ] Auth flow (login → dashboard)                                  │
│  [ ] Assessment lifecycle (create → answer → complete)              │
│  [ ] Finding lifecycle (create → acknowledge → close)               │
│  [ ] Evidence upload + integrity check                              │
│  [ ] Role-based access (Assessor vs Owner views)                    │
│                                                                     │
│  Performance Tests (k6):                                            │
│  [ ] API endpoint response times                                    │
│  [ ] Concurrent user simulation (500 users)                         │
│  [ ] Database query performance                                     │
└──────────────────────────────────────────────────────────────────────┘

Week 26: Documentation + Deployment
┌──────────────────────────────────────────────────────────────────────┐
│  [ ] API documentation (OpenAPI 3.1 auto-generated)                 │
│  [ ] Component Storybook                                            │
│  [ ] Deployment to staging (Kubernetes + ArgoCD)                    │
│  [ ] Load testing on staging                                        │
│  [ ] Security review (SAST, DAST, dependency audit)                 │
│  [ ] Penetration test preparation                                   │
│  [ ] Runbook / operational documentation                            │
│  [ ] User guide (for pilot clients)                                 │
└──────────────────────────────────────────────────────────────────────┘
```

**Exit criteria:** All tests pass. Lighthouse > 90. Staging deployment functional. Ready for pilot.

---

## 3. Dependency Graph

```
Phase 0: Foundation
  ↓
Phase 1: Primitives + Auth
  ↓
Phase 2: App Shell
  ↓
Phase 3: Composed Components + Assessment CRUD
  ↓                              ↘
Phase 4: Findings + Questions    Phase 5: Asset + Evidence
  ↓                              ↓
Phase 6: Risk + Zone + Purdue ←─┘ (assets needed for zones/purdue)
  ↓
Phase 7: Dashboard + Reports
  ↓
Phase 8: Remediation + CSMS + Admin
  ↓
Phase 9: Polish + Testing
```

**Parallelization opportunities:**
- Phase 4 (Findings) and Phase 5 (Assets) can run in parallel (no dependency between them)
- Within Phase 6: Risk backend (Week 15) and Zone backend (Week 17) are independent
- Chart/diagram component development in `packages/ui` can happen parallel to frontend feature pages
- API development can always be one week ahead of frontend consumption

---

## 4. Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| ReactFlow complexity for zone designer | High | Use simplified SVG first, upgrade to ReactFlow in Phase 6 |
| Large template seeding (48+ questions) | Medium | Seed via migration scripts, not API calls |
| S3/MinIO integration delays | Medium | Use local filesystem for Phase 3–5, add S3 in Phase 5 |
| WebSocket reliability in offline mode | High | Start with polling, add WebSocket in Phase 4+ |
| Multi-tenant schema complexity | Medium | Single schema + tenant_id column for Phase 1–3, migrate to schema-per-tenant later |
| Chart rendering performance | Low | Lazy-load chart components, defer until scroll into view |

---

## 5. Milestone Summary

| Milestone | Week | Deliverable |
|---|---|---|
| M1: Dev Environment | 2 | Monorepo, CI/CD, Docker Compose |
| M2: Auth Complete | 4 | Login, register, MFA, JWT, middleware |
| M3: App Shell | 6 | Sidebar, top bar, navigation, empty dashboard |
| M4: Assessment CRUD | 9 | Create, list, view, scorecard, templates |
| M5: Finding Lifecycle | 12 | CRUD, status transitions, comments, linking |
| M6: Question Flow | 12 | 3-column assessment wizard with auto-save |
| M7: Asset + Evidence | 14 | Asset CRUD + CSV import, evidence upload |
| M8: Risk Register | 16 | CRUD + heat map + distribution charts |
| M9: Zone + Purdue | 18 | Zone designer + Purdue visualization |
| M10: Dashboard | 20 | All dashboard widgets, report generation |
| M11: Full Feature Set | 23 | Remediation, CSMS, Admin complete |
| M12: Production Ready | 26 | Tested, documented, staging deployed |

---

*Back to: [Frontend Architecture →](frontend-architecture.md) | [Component Mapping →](component-mapping.md) | [API Requirements →](api-requirements.md) | [Database Dependencies →](database-dependencies.md)*
