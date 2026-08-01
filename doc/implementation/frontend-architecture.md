# Implementation Blueprint — Frontend Architecture Plan

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> References: architecture.md, tech-stack.md, uiux/sitemap.md, uiux/design-system.md

---

## 1. Monorepo Structure

```
iec62443-platform/
│
├── apps/
│   ├── web/                          # Next.js 15 frontend application
│   │   ├── app/                      # App Router (file-based routing)
│   │   │   ├── (auth)/               # Auth route group (no shell layout)
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   ├── mfa/
│   │   │   │   └── sso/callback/
│   │   │   │
│   │   │   ├── (app)/                # Authenticated route group (shell layout)
│   │   │   │   ├── layout.tsx        # AppShell: Sidebar + TopBar + Content
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── risk/page.tsx
│   │   │   │   │   ├── assess/page.tsx
│   │   │   │   │   └── remediation/page.tsx
│   │   │   │   ├── clients/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── settings/page.tsx
│   │   │   │   ├── assessments/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   ├── templates/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx          # Summary tab (default)
│   │   │   │   │       ├── questions/page.tsx
│   │   │   │   │       ├── scorecard/page.tsx
│   │   │   │   │       ├── findings/page.tsx
│   │   │   │   │       └── export/page.tsx
│   │   │   │   ├── requirements/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [part]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── [clause]/page.tsx
│   │   │   │   ├── assets/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── import/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── purdue/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── rules/page.tsx
│   │   │   │   ├── zones/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── designer/page.tsx
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── conduits/[id]/page.tsx
│   │   │   │   ├── risks/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── matrix/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── treatments/page.tsx
│   │   │   │   ├── findings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── import/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── evidence/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── upload/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── remediation/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── actions/page.tsx
│   │   │   │   ├── csms/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       ├── policies/page.tsx
│   │   │   │   │       └── gap/page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── generate/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── layout.tsx        # Admin sub-nav layout
│   │   │   │       ├── members/page.tsx
│   │   │   │       ├── roles/page.tsx
│   │   │   │       ├── integrations/page.tsx
│   │   │   │       ├── api-keys/page.tsx
│   │   │   │       ├── audit-log/page.tsx
│   │   │   │       ├── webhooks/page.tsx
│   │   │   │       └── settings/page.tsx
│   │   │   │
│   │   │   ├── (platform)/               # Platform admin (cross-tenant)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── platform/
│   │   │   │       ├── tenants/page.tsx
│   │   │   │       ├── tenants/[id]/page.tsx
│   │   │   │       └── audit-log/page.tsx
│   │   │   │
│   │   │   ├── layout.tsx                # Root layout (html, body, providers)
│   │   │   ├── not-found.tsx
│   │   │   ├── error.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── components/                   # App-specific components
│   │   ├── hooks/                        # App-specific hooks
│   │   ├── lib/                          # App-specific utilities
│   │   ├── stores/                       # Zustand stores
│   │   ├── styles/                       # Global styles, CSS variables
│   │   └── public/                       # Static assets
│   │
│   ├── api/                              # Fastify backend application
│   │   ├── src/
│   │   │   ├── modules/                  # Domain modules (bounded contexts)
│   │   │   │   ├── auth/
│   │   │   │   ├── assessment/
│   │   │   │   ├── risk/
│   │   │   │   ├── zone/
│   │   │   │   ├── purdue/
│   │   │   │   ├── csms/
│   │   │   │   ├── finding/
│   │   │   │   ├── evidence/
│   │   │   │   ├── remediation/
│   │   │   │   ├── asset/
│   │   │   │   ├── report/
│   │   │   │   ├── audit/
│   │   │   │   └── tenant/
│   │   │   ├── plugins/                  # Fastify plugins
│   │   │   ├── middleware/               # Auth, tenant, RBAC middleware
│   │   │   └── shared/                   # Cross-module utilities
│   │   └── test/
│   │
│   └── worker/                           # Background job worker
│       └── src/
│           ├── jobs/
│           │   ├── report-generation.ts
│           │   ├── bulk-import.ts
│           │   ├── email-notification.ts
│           │   └── risk-recalculation.ts
│           └── workers/
│
├── packages/
│   ├── ui/                               # Shared UI component library
│   │   ├── src/
│   │   │   ├── primitives/              # Radix UI wrappers
│   │   │   ├── components/              # Composed domain components
│   │   │   ├── charts/                  # Chart components (Recharts)
│   │   │   ├── diagrams/               # Diagram components (ReactFlow, D3)
│   │   │   ├── forms/                   # Form components
│   │   │   └── layouts/                 # Layout components
│   │   └── package.json
│   │
│   ├── shared-types/                     # Shared TypeScript types/interfaces
│   │   ├── src/
│   │   │   ├── api.ts                   # API request/response types
│   │   │   ├── domain/                  # Domain entity types
│   │   │   │   ├── assessment.ts
│   │   │   │   ├── risk.ts
│   │   │   │   ├── finding.ts
│   │   │   │   ├── zone.ts
│   │   │   │   ├── purdue.ts
│   │   │   │   ├── csms.ts
│   │   │   │   ├── evidence.ts
│   │   │   │   ├── remediation.ts
│   │   │   │   └── asset.ts
│   │   │   ├── rbac.ts                  # Role/permission types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared-schemas/                   # Zod validation schemas (shared)
│   │   ├── src/
│   │   │   ├── assessment.schema.ts
│   │   │   ├── risk.schema.ts
│   │   │   ├── finding.schema.ts
│   │   │   ├── zone.schema.ts
│   │   │   ├── evidence.schema.ts
│   │   │   ├── remediation.schema.ts
│   │   │   ├── asset.schema.ts
│   │   │   └── common.schema.ts         # Pagination, filters, etc.
│   │   └── package.json
│   │
│   ├── database/                         # Drizzle schema + migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── platform/            # Shared platform schema
│   │   │   │   │   ├── tenants.ts
│   │   │   │   │   ├── users.ts
│   │   │   │   │   ├── roles.ts
│   │   │   │   │   └── audit-events.ts
│   │   │   │   └── tenant/              # Tenant schema (template)
│   │   │   │       ├── assessment.ts
│   │   │   │       ├── risk.ts
│   │   │   │       ├── zone.ts
│   │   │   │       ├── purdue.ts
│   │   │   │       ├── csms.ts
│   │   │   │       ├── finding.ts
│   │   │   │       ├── evidence.ts
│   │   │   │       ├── remediation.ts
│   │   │   │       └── asset.ts
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   └── package.json
│   │
│   ├── api-client/                       # Typed API client (generated)
│   │   ├── src/
│   │   │   ├── client.ts               # Base fetch wrapper
│   │   │   ├── hooks/                   # TanStack Query hooks per endpoint
│   │   │   │   ├── useAssessments.ts
│   │   │   │   ├── useFindings.ts
│   │   │   │   ├── useRisks.ts
│   │   │   │   └── ...
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                             # Auth utilities
│   │   ├── src/
│   │   │   ├── jwt.ts                  # JWT parsing/validation
│   │   │   ├── permissions.ts          # Permission checking helpers
│   │   │   ├── hooks.ts               # useAuth, usePermission hooks
│   │   │   └── guards.ts             # Route/component guards
│   │   └── package.json
│   │
│   └── config/                           # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│           └── preset.ts               # Tailwind preset with design tokens
│
├── infrastructure/
│   ├── terraform/
│   ├── helm/
│   └── docker/
│       ├── docker-compose.dev.yml      # Local dev environment
│       ├── docker-compose.test.yml     # Integration test environment
│       └── Dockerfile.web
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

---

## 2. Route Organization

### 2.1 Route Groups

```
Next.js App Router groups control layout inheritance:

┌──────────────────────────────────────────────────────────────────────┐
│  (auth) group — NO shell layout                                      │
│  ├── layout.tsx: Minimal layout (centered card, brand header)        │
│  ├── Used for: login, register, forgot-password, MFA, SSO callback  │
│  └── No sidebar, no top bar                                          │
│                                                                      │
│  (app) group — WITH shell layout                                     │
│  ├── layout.tsx: AppShell (Sidebar + TopBar + Content Area)          │
│  ├── All authenticated module routes live here                       │
│  └── Middleware protects: redirect to /login if no valid JWT         │
│                                                                      │
│  (platform) group — Platform admin shell                             │
│  ├── layout.tsx: Different sidebar (cross-tenant nav)                │
│  ├── Middleware protects: requires platform_admin role               │
│  └── Only accessible to platform operators                           │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layout Hierarchy

```
Root Layout (app/layout.tsx)
├── <html> with class="light" | "dark"
├── <body> with font-sans, antialiased
├── Providers:
│   ├── QueryClientProvider (TanStack Query)
│   ├── ThemeProvider (next-themes)
│   ├── AuthProvider (JWT context)
│   ├── TenantProvider (current tenant context)
│   ├── WebSocketProvider (real-time events)
│   ├── OfflineProvider (sync state)
│   └── ToasterProvider (Sonner toast container)
│
├── (auth)/layout.tsx
│   └── Centered layout, no navigation
│
├── (app)/layout.tsx
│   └── AppShell
│       ├── Sidebar (collapsible, role-filtered nav)
│       ├── TopBar (breadcrumb, notifications, user menu)
│       ├── <main> content area
│       └── ContextPanel (slide-in, conditional)
│
└── (platform)/layout.tsx
    └── PlatformShell (different sidebar)
```

### 2.3 Loading & Error Boundaries

```
Per-route loading.tsx:
  • Shows skeleton matching the page layout
  • Prevents layout shift during data fetch
  • Uses Skeleton components from packages/ui

Per-route error.tsx:
  • Catches render errors
  • Shows error card with retry button
  • Logs to error tracking service
  • "Go back" and "Retry" actions

Global not-found.tsx:
  • 404 page with search suggestion
  • "Go to Dashboard" link
```

---

## 3. Component Hierarchy

### 3.1 Three-Layer Component Model

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1: Primitives (packages/ui/src/primitives/)                  │
│  ─────────────────────────────────────────────────                   │
│  • Thin wrappers around Radix UI                                     │
│  • Apply design tokens (colors, spacing, radius, shadows)           │
│  • No domain knowledge                                               │
│  • Examples: Button, Input, Dialog, Tabs, Badge, Tooltip            │
│  • Import: import { Button } from '@iec62443/ui/primitives'         │
│                                                                      │
│  Layer 2: Composed Components (packages/ui/src/components/)         │
│  ────────────────────────────────────────────────────────            │
│  • Combine primitives into reusable patterns                         │
│  • May include light domain awareness (e.g., SeverityBadge)         │
│  • No direct API calls (receive data via props)                     │
│  • Examples: DataTable, MetricCard, FilterBar, ContextPanel         │
│  • Import: import { DataTable } from '@iec62443/ui/components'      │
│                                                                      │
│  Layer 3: Feature Components (apps/web/src/components/)             │
│  ────────────────────────────────────────────────────────            │
│  • Page-specific or module-specific components                       │
│  • Connect to data (TanStack Query hooks, Zustand stores)           │
│  • Compose Layer 1 + Layer 2 components                             │
│  • Examples: RiskHeatMapWidget, AssessmentWizard, FindingRow        │
│  • Import: import { RiskHeatMapWidget } from '@/components/risk'    │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Feature Component Organization

```
apps/web/src/components/
├── dashboard/
│   ├── DashboardGrid.tsx           # Main dashboard layout
│   ├── SecurityScoreCard.tsx       # Gauge + trend
│   ├── FindingsSummaryCard.tsx     # Count by severity
│   ├── RisksSummaryCard.tsx        # Count by level
│   ├── RemediationSummaryCard.tsx  # Overdue count
│   ├── AssessmentProgressList.tsx  # List of active assessments
│   ├── RiskHeatMapWidget.tsx       # Mini heat map
│   ├── RecentFindingsList.tsx      # Latest 5 findings
│   └── RemediationTimeline.tsx     # Gantt chart
│
├── assessment/
│   ├── AssessmentCard.tsx          # Card for list view
│   ├── AssessmentTable.tsx         # Table for list view
│   ├── AssessmentWizard.tsx        # Multi-step creation form
│   ├── QuestionNavigator.tsx       # Section nav sidebar
│   ├── QuestionCard.tsx            # Single question response form
│   ├── ScorecardRadar.tsx          # Radar chart
│   ├── ScorecardTable.tsx          # FR gap table
│   └── TemplateSelector.tsx        # Template picker
│
├── risk/
│   ├── RiskMatrixView.tsx          # Heat map (full page)
│   ├── RiskTable.tsx               # Table view
│   ├── RiskDetailPanel.tsx         # Context panel content
│   ├── RiskScoringForm.tsx         # L × I scoring
│   ├── TreatmentList.tsx           # Treatments for a risk
│   └── RiskAcceptanceForm.tsx      # Acceptance workflow
│
├── finding/
│   ├── FindingTable.tsx            # Main findings table
│   ├── FindingDetailPanel.tsx      # Context panel content
│   ├── FindingForm.tsx             # Create/edit form
│   ├── FindingStatusTransition.tsx # Status change dialog
│   ├── FindingComments.tsx         # Comment thread
│   └── FindingBulkImport.tsx       # Import wizard
│
├── zone/
│   ├── ZoneTopologyDesigner.tsx    # ReactFlow canvas
│   ├── ZoneNode.tsx                # Custom ReactFlow node
│   ├── ConduitEdge.tsx             # Custom ReactFlow edge
│   ├── ZonePropertiesPanel.tsx     # Properties sidebar
│   ├── ZoneCard.tsx                # Card for list view
│   └── ConduitList.tsx             # Conduit table
│
├── purdue/
│   ├── PurdueModelDiagram.tsx      # D3/ReactFlow visualization
│   ├── PurdueLevelBand.tsx         # Single level band
│   ├── PurdueAssetChip.tsx         # Asset within a level
│   ├── CommunicationRulesTable.tsx # Rules table
│   └── PurdueComplianceBadge.tsx   # Compliance indicator
│
├── asset/
│   ├── AssetTable.tsx              # Main asset table
│   ├── AssetDetailPanel.tsx        # Context panel
│   ├── AssetForm.tsx               # Create/edit form
│   ├── AssetImportWizard.tsx       # CSV import flow
│   └── AssetTypeIcon.tsx           # Type-specific icons
│
├── evidence/
│   ├── EvidenceGrid.tsx            # Card grid view
│   ├── EvidenceTable.tsx           # Table view
│   ├── EvidenceUploadZone.tsx      # Drag-and-drop upload
│   ├── EvidencePreview.tsx         # File preview (PDF, image)
│   ├── EvidenceChainOfCustody.tsx  # Custody timeline
│   └── EvidenceIntegrityBadge.tsx  # Hash verification badge
│
├── remediation/
│   ├── RemediationPlanCard.tsx     # Plan card for list
│   ├── RemediationGantt.tsx        # Gantt chart
│   ├── ActionItemList.tsx          # Action items table
│   ├── ActionItemForm.tsx          # Create/edit action
│   └── VerificationForm.tsx        # Verification dialog
│
├── csms/
│   ├── CSMSFrameworkCard.tsx       # Framework card
│   ├── CSMSlementTree.tsx          # Category tree
│   ├── PolicyEditor.tsx            # Policy document editor
│   ├── GapAnalysisView.tsx         # Gap analysis table
│   └── ImprovementPlanList.tsx     # Improvement plans
│
├── report/
│   ├── ReportTemplateSelector.tsx  # Template picker dialog
│   ├── ReportConfigForm.tsx        # Report configuration
│   ├── ReportList.tsx              # Generated reports list
│   └── ReportStatusBadge.tsx       # Generation status
│
├── admin/
│   ├── MemberTable.tsx             # Team members table
│   ├── InviteMemberDialog.tsx      # Invite dialog
│   ├── RoleEditor.tsx              # Custom role editor
│   ├── ApiKeyList.tsx              # API key management
│   ├── AuditLogTable.tsx           # Audit log table
│   ├── IntegrationCard.tsx         # Integration connector
│   └── WebhookEditor.tsx           # Webhook config form
│
└── shared/
    ├── GlobalSearch.tsx            # Cmd+K command palette
    ├── NotificationCenter.tsx      # Bell dropdown
    ├── OfflineBanner.tsx           # Offline indicator
    ├── SyncStatusIndicator.tsx     # Sync state in top bar
    ├── TenantSwitcher.tsx          # Tenant dropdown in sidebar
    └── UserMenu.tsx                # Avatar dropdown
```

---

## 4. State Management Strategy

### 4.1 State Categories

```
┌──────────────────────────────────────────────────────────────────────┐
│  STATE TYPE          │ TECHNOLOGY          │ LIFETIME               │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Server state        │ TanStack Query      │ Per-session, cached    │
│  (API data)          │                     │ with invalidation      │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Client state        │ Zustand             │ Per-session            │
│  (UI, preferences)   │                     │                        │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Form state          │ React Hook Form     │ Per-form lifecycle     │
│  (form inputs)       │                     │                        │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  URL state           │ Next.js searchParams│ Per-navigation         │
│  (filters, pagination│                     │                        │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Auth state          │ Context + cookies   │ Per-session            │
│  (user, tenant, JWT) │                     │                        │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Offline queue       │ IndexedDB (Dexie)   │ Persistent until sync  │
│  (pending mutations) │                     │                        │
│  ────────────────────┼─────────────────────┼─────────────────────── │
│  Real-time events    │ WebSocket + Zustand │ Ephemeral              │
│  (WS notifications)  │ (event buffer)      │                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Zustand Stores

```typescript
// apps/web/src/stores/

// UI Store — sidebar, panels, modals
interface UIStore {
  sidebarExpanded: boolean;
  sidebarCollapsed: boolean;        // manual override
  contextPanelOpen: boolean;
  contextPanelEntity: { type: string; id: string } | null;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  // actions
  toggleSidebar: () => void;
  openContextPanel: (type: string, id: string) => void;
  closeContextPanel: () => void;
}

// Notification Store — toast queue, notification center
interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

// Offline Store — sync state, pending queue
interface OfflineStore {
  isOnline: boolean;
  pendingMutations: PendingMutation[];
  syncInProgress: boolean;
  lastSyncAt: Date | null;
  // actions
  enqueueMutation: (m: PendingMutation) => void;
  processQueue: () => Promise<void>;
  resolveConflict: (id: string, resolution: 'local' | 'remote') => void;
}

// Assessment Wizard Store — multi-step form state
interface AssessmentWizardStore {
  currentStep: number;
  basicInfo: BasicInfoData;
  scope: ScopeData;
  template: TemplateData;
  // actions
  setStep: (step: number) => void;
  updateBasicInfo: (data: Partial<BasicInfoData>) => void;
  updateScope: (data: Partial<ScopeData>) => void;
  updateTemplate: (data: Partial<TemplateData>) => void;
  reset: () => void;
}
```

### 4.3 TanStack Query Configuration

```typescript
// apps/web/src/lib/query-client.ts

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min before refetch
      gcTime: 30 * 60 * 1000,         // 30 min garbage collection
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Per-entity query key factories
export const queryKeys = {
  assessments: {
    all:      ['assessments'] as const,
    lists:    () => [...queryKeys.assessments.all, 'list'] as const,
    list:     (filters: AssessmentFilters) => [...queryKeys.assessments.lists(), filters] as const,
    details:  () => [...queryKeys.assessments.all, 'detail'] as const,
    detail:   (id: string) => [...queryKeys.assessments.details(), id] as const,
    scorecard:(id: string) => [...queryKeys.assessments.detail(id), 'scorecard'] as const,
    questions:(id: string) => [...queryKeys.assessments.detail(id), 'questions'] as const,
  },
  findings: {
    all:      ['findings'] as const,
    lists:    () => [...queryKeys.findings.all, 'list'] as const,
    list:     (filters: FindingFilters) => [...queryKeys.findings.lists(), filters] as const,
    details:  () => [...queryKeys.findings.all, 'detail'] as const,
    detail:   (id: string) => [...queryKeys.findings.details(), id] as const,
    history:  (id: string) => [...queryKeys.findings.detail(id), 'history'] as const,
    comments: (id: string) => [...queryKeys.findings.detail(id), 'comments'] as const,
  },
  risks: { /* same pattern */ },
  zones: { /* same pattern */ },
  assets: { /* same pattern */ },
  evidence: { /* same pattern */ },
  // ...
};
```

### 4.4 WebSocket Integration

```typescript
// apps/web/src/lib/websocket.ts

// WebSocket events → TanStack Query invalidation
const wsEventHandlers = {
  'finding.updated': (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.findings.detail(data.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.findings.lists() });
    notificationStore.addNotification({ ... });
  },
  'assessment.progress': (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assessments.detail(data.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
  },
  'risk.level_changed': (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(data.id) });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'risk-heatmap'] });
  },
  'remediation.milestone': (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.remediation.detail(data.planId) });
  },
  'report.completed': (data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.detail(data.id) });
    notificationStore.addNotification({ ... });
  },
  'notification.new': (data) => {
    notificationStore.addNotification(data);
  },
  'sync.conflict': (data) => {
    offlineStore.showConflictDialog(data);
  },
};
```

---

## 5. Data Fetching Approach

### 5.1 API Client Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  packages/api-client/                                                │
│  ├── client.ts          Base fetch wrapper                           │
│  │   • JWT injection from cookie                                    │
│  │   • Tenant ID header injection                                   │
│  │   • Error normalization (API error → typed Error)                │
│  │   • Response envelope unwrapping (data, meta, links)             │
│  │   • Retry logic for 5xx / network errors                         │
│  │                                                                  │
│  ├── hooks/             TanStack Query hooks per domain              │
│  │   ├── useAssessments.ts                                          │
│  │   │   useAssessments(filters)     → query (list)                 │
│  │   │   useAssessment(id)           → query (detail)               │
│  │   │   useCreateAssessment()       → mutation                     │
│  │   │   useUpdateAssessment()       → mutation                     │
│  │   │   useDeleteAssessment()       → mutation                     │
│  │   │   useAssessmentScorecard(id)  → query                        │
│  │   │   useAssessmentQuestions(id)  → query                        │
│  │   │   useSubmitResponse()         → mutation                     │
│  │   │                                                              │
│  │   ├── useFindings.ts                                             │
│  │   ├── useRisks.ts                                                │
│  │   ├── useZones.ts                                                │
│  │   ├── useAssets.ts                                               │
│  │   ├── useEvidence.ts                                             │
│  │   ├── useRemediation.ts                                          │
│  │   ├── useReports.ts                                              │
│  │   └── useDashboard.ts                                            │
│  │                                                                  │
│  └── index.ts         Re-exports all hooks                          │
│                                                                      │
│  Usage in feature components:                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  import { useFindings } from '@iec62443/api-client';       │     │
│  │                                                            │     │
│  │  function FindingsPage() {                                 │     │
│  │    const [filters, setFilters] = useQueryState(filters);   │     │
│  │    const { data, isLoading } = useFindings(filters);       │     │
│  │    // ...                                                  │     │
│  │  }                                                         │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 Server Components vs Client Components

```
┌──────────────────────────────────────────────────────────────────────┐
│  SERVER COMPONENTS (default)                                         │
│  ─────────────────────────────                                       │
│  • Page files (page.tsx) — initial data fetch on server              │
│  • Layout files (layout.tsx) — shell structure                       │
│  • Static content, SEO-critical pages                                │
│  • No useState, useEffect, event handlers                            │
│  • Can call API directly (server-side fetch)                         │
│                                                                      │
│  CLIENT COMPONENTS ('use client')                                    │
│  ─────────────────────────────────                                   │
│  • All interactive components (forms, tables, charts)                │
│  • Components using hooks (TanStack Query, Zustand)                 │
│  • Components with event handlers                                    │
│  • Context providers                                                 │
│  • All packages/ui components (primitives + composed)               │
│                                                                      │
│  Strategy:                                                           │
│  • page.tsx files are SERVER components                              │
│  • They fetch initial data server-side, pass as props                │
│  • Child interactive components are CLIENT components                │
│  • This enables SSR for fast initial paint + hydration               │
│                                                                      │
│  Exception:                                                          │
│  • Pages with heavy real-time needs (dashboard, assessment wizard)   │
│  • Mark as 'use client' when most content is dynamic                 │
│  • Trade SSR for simpler client-side data management                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 URL State for Filters & Pagination

```typescript
// Use nuqs (Next.js URL state) for filter/pagination persistence
// This makes URLs shareable and bookmarkable

import { useQueryState, parseAsInteger, parseAsStringLiteral } from 'nuqs';

function FindingsPage() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('per_page', parseAsInteger.withDefault(25));
  const [sort, setSort] = useQueryState('sort', parseAsString().withDefault('-created_at'));
  const [severity, setSeverity] = useQueryState('filter[severity]');
  const [status, setStatus] = useQueryState('filter[status]');
  const [search, setSearch] = useQueryState('search');

  const filters = useMemo(() => ({
    page, per_page: perPage, sort,
    'filter[severity]': severity,
    'filter[status]': status,
    search,
  }), [page, perPage, sort, severity, status, search]);

  const { data } = useFindings(filters);
  // ...
}

// URL: /app/findings?page=2&filter[severity]=critical,high&sort=-severity&search=firewall
```

---

## 6. Form Handling Approach

### 6.1 Form Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Form Stack: React Hook Form + Zod + shared-schemas                  │
│                                                                      │
│  packages/shared-schemas/          apps/web/src/components/          │
│  ┌──────────────────────┐         ┌──────────────────────────┐     │
│  │ finding.schema.ts    │         │ FindingForm.tsx           │     │
│  │                      │ import  │                           │     │
│  │ export const         │────────►│ const form = useForm({   │     │
│  │   findingCreateSchema│         │   resolver: zodResolver(  │     │
│  │   = z.object({      │         │     findingCreateSchema   │     │
│  │     title: z.string()│         │   ),                      │     │
│  │     severity: z.enum │         │   defaultValues: {...}    │     │
│  │     ...              │         │ });                       │     │
│  │   })                 │         │                           │     │
│  └──────────────────────┘         └──────────────────────────┘     │
│                                                                      │
│  Benefits:                                                           │
│  • Single source of truth for validation (shared with backend)       │
│  • Type-safe form data (inferred from Zod schema)                    │
│  • Backend validates with same schema (Fastify JSON schema from Zod) │
│  • Consistent error messages across client/server                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Form Patterns

```
Pattern 1: Simple CRUD Form (Dialog)
  • Used for: Create/edit risk, asset, zone, etc.
  • React Hook Form + Zod resolver
  • Submit → mutation → invalidateQueries → close dialog
  • Optimistic update on list

Pattern 2: Multi-Step Wizard
  • Used for: New assessment, bulk import, evidence upload
  • Zustand store for cross-step state
  • Each step validates independently before advancing
  • Final step: single mutation to create entity
  • URL updates per step (?step=2)

Pattern 3: Inline Editing (Assessment Questions)
  • Used for: Assessment question responses
  • Auto-save on blur (debounced 500ms)
  • React Hook Form per question (not one giant form)
  • Mutation per question (not batch)
  • Progress saved to IndexedDB for offline

Pattern 4: Batch Operations
  • Used for: Bulk finding import, bulk status change
  • File upload → client-side validation → preview → submit
  • Async job with polling for progress
  • Results page with success/error breakdown
```

---

## 7. Chart Implementation Approach

### 7.1 Chart Library Mapping

```
┌──────────────────────────────────────────────────────────────────────┐
│  Chart Type          │ Library        │ Component                    │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Radar chart         │ Recharts       │ charts/RadarChart.tsx        │
│  (scorecard)         │                │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Heat map            │ Custom CSS     │ charts/RiskHeatMap.tsx       │
│  (risk matrix)       │ Grid + SVG     │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Line chart          │ Recharts       │ charts/LineChart.tsx         │
│  (trends)            │                │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Bar chart           │ Recharts       │ charts/BarChart.tsx          │
│  (distribution)      │                │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Gauge / Radial      │ Recharts       │ charts/GaugeChart.tsx        │
│  (security score)    │ RadialBarChart │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Sparkline           │ Recharts       │ charts/Sparkline.tsx         │
│  (inline trends)     │ Minimal config │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Gantt chart         │ Custom SVG     │ charts/GanttChart.tsx        │
│  (remediation)       │ + date-fns     │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Donut chart         │ Recharts       │ charts/DonutChart.tsx        │
│  (budget)            │ PieChart       │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Zone topology       │ ReactFlow      │ diagrams/ZoneTopology.tsx    │
│  (interactive)       │                │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Purdue model        │ ReactFlow      │ diagrams/PurdueModel.tsx     │
│  (layered diagram)   │ Custom nodes   │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Document preview    │ PDF.js         │ components/PdfPreview.tsx    │
│  (evidence)          │ + react-pdf    │                              │
│  ────────────────────┼────────────────┼───────────────────────────── │
│  Image preview       │ Native <img>   │ components/ImagePreview.tsx  │
│  (evidence)          │ + zoom library │                              │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Chart Wrapper Pattern

```typescript
// All charts follow a consistent wrapper pattern:

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;       // Header action buttons
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  height?: number;
  children: ReactNode;       // The actual chart
}

// Usage:
<ChartWrapper
  title="Risk Heat Map"
  subtitle="Likelihood × Impact"
  actions={<Button variant="ghost" size="sm"><ExternalLink /></Button>}
  loading={isLoading}
  error={error}
  height={384}
>
  <RiskHeatMap data={data} onCellClick={handleCellClick} />
</ChartWrapper>

// This ensures consistent:
// • Header with title + actions
// • Loading skeleton
// • Error state
// • Empty state
// • Height constraints
// • Responsive behavior
```

---

## 8. Authentication & Tenant Resolution Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. User visits /app/dashboard                                       │
│                                                                      │
│  2. Next.js middleware (middleware.ts) checks:                        │
│     • Cookie: access_token exists?                                   │
│     • If NO → redirect to /auth/login?redirect=/app/dashboard        │
│     • If YES → decode JWT, extract tenant_id + roles                 │
│     • Set request headers: x-tenant-id, x-user-roles                 │
│                                                                      │
│  3. Root layout.tsx:                                                 │
│     • AuthProvider reads JWT from cookie                             │
│     • Provides: user, tenantId, roles, permissions                   │
│     • TenantProvider sets current tenant context                     │
│                                                                      │
│  4. (app)/layout.tsx (AppShell):                                     │
│     • Sidebar renders nav items filtered by permissions              │
│     • TopBar shows tenant name, user avatar                          │
│     • QueryClientProvider initialized with auth headers              │
│                                                                      │
│  5. API calls:                                                       │
│     • api-client reads JWT from cookie (httpOnly)                    │
│     • Adds Authorization: Bearer <token> header                      │
│     • Adds X-Tenant-ID header from TenantProvider                    │
│     • On 401 response → attempt refresh token                        │
│     • On refresh failure → redirect to /auth/login                   │
│                                                                      │
│  6. Token refresh:                                                   │
│     • TanStack Query intercepts 401                                  │
│     • Calls POST /auth/refresh with refresh_token cookie             │
│     • On success: retries original request                           │
│     • On failure: clears cookies, redirects to login                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. Performance Strategy

| Strategy | Implementation |
|---|---|
| **Route-based code splitting** | Next.js App Router auto-splits per route |
| **Component lazy loading** | `dynamic(() => import('./HeavyChart'))` for charts, diagrams |
| **Image optimization** | `next/image` with responsive sizes, WebP format |
| **Font optimization** | `next/font` with Inter Variable, `font-display: swap` |
| **Bundle analysis** | `@next/bundle-analyzer` in CI, < 300KB initial JS target |
| **Prefetching** | `<Link prefetch>` on sidebar nav items |
| **Virtual scrolling** | `@tanstack/react-virtual` for tables with 500+ rows |
| **Debounced search** | 300ms debounce on search inputs |
| **Optimistic updates** | TanStack Query `onMutate` for instant UI feedback |
| **Stale-while-revalidate** | 5-min staleTime, background refetch on focus |
| **Service worker** | Workbox for offline shell caching (Phase 3) |

---

*Next: [Component Mapping →](component-mapping.md)*
