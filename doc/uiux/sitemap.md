# IEC 62443 Platform — Sitemap & Navigation Hierarchy

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01

---

## 1. Application Sitemap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION SITEMAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  / ─── Landing / Login                                                      │
│  │                                                                          │
│  ├── /app ──── Shell (Authenticated)                                       │
│  │   │                                                                      │
│  │   ├── /app/dashboard ──────────── Executive Dashboard                   │
│  │   │   ├── /app/dashboard/risk ── Risk Overview (widget drill-down)      │
│  │   │   ├── /app/dashboard/assess  Assessment Overview                    │
│  │   │   └── /app/dashboard/remediation  Remediation Overview              │
│  │   │                                                                      │
│  │   ├── /app/clients ────────────── Client Workspaces                     │
│  │   │   ├── /app/clients/:id ───── Client Detail                          │
│  │   │   └── /app/clients/:id/settings  Client Config                      │
│  │   │                                                                      │
│  │   ├── /app/assessments ────────── Assessment Management                 │
│  │   │   ├── /app/assessments/new ── New Assessment (wizard)               │
│  │   │   ├── /app/assessments/:id ── Assessment Detail                     │
│  │   │   │   ├── .../questions ───── Assessment Wizard (question flow)     │
│  │   │   │   ├── .../scorecard ───── Scorecard & Gap Analysis              │
│  │   │   │   ├── .../findings ────── Linked Findings                       │
│  │   │   │   └── .../export ──────── Export / Generate Report              │
│  │   │   └── /app/assessments/templates  Template Library                  │
│  │   │                                                                      │
│  │   ├── /app/requirements ───────── IEC 62443 Requirement Library         │
│  │   │   ├── /app/requirements/:part ─ Part Detail (3-2, 3-3, etc.)       │
│  │   │   └── /app/requirements/:part/:clause  Clause Detail                │
│  │   │                                                                      │
│  │   ├── /app/assets ─────────────── Asset Inventory                       │
│  │   │   ├── /app/assets/:id ─────── Asset Detail                          │
│  │   │   └── /app/assets/import ──── Import Wizard                         │
│  │   │                                                                      │
│  │   ├── /app/purdue ─────────────── Purdue Model                          │
│  │   │   ├── /app/purdue/:id ─────── Model Detail / Visualization          │
│  │   │   └── /app/purdue/:id/rules ─ Communication Rules                   │
│  │   │                                                                      │
│  │   ├── /app/zones ──────────────── Zone & Conduit Management             │
│  │   │   ├── /app/zones/designer ─── Zone Topology Designer                │
│  │   │   ├── /app/zones/:id ──────── Zone Detail                           │
│  │   │   └── /app/zones/conduits/:id  Conduit Detail                       │
│  │   │                                                                      │
│  │   ├── /app/risks ──────────────── Risk Register                         │
│  │   │   ├── /app/risks/:id ──────── Risk Detail                           │
│  │   │   ├── /app/risks/matrix ───── Risk Matrix / Heat Map                │
│  │   │   └── /app/risks/:id/treatments  Treatments                         │
│  │   │                                                                      │
│  │   ├── /app/findings ───────────── Finding Management                    │
│  │   │   ├── /app/findings/:id ───── Finding Detail                        │
│  │   │   └── /app/findings/import ── Bulk Import                           │
│  │   │                                                                      │
│  │   ├── /app/evidence ───────────── Evidence Repository                   │
│  │   │   ├── /app/evidence/:id ───── Evidence Detail / Preview             │
│  │   │   └── /app/evidence/upload ── Upload Wizard                         │
│  │   │                                                                      │
│  │   ├── /app/remediation ────────── Remediation Tracker                   │
│  │   │   ├── /app/remediation/:id ── Plan Detail                           │
│  │   │   └── /app/remediation/:id/actions  Action Items                    │
│  │   │                                                                      │
│  │   ├── /app/csms ───────────────── CSMS Management                       │
│  │   │   ├── /app/csms/:id ───────── Framework Detail                      │
│  │   │   ├── /app/csms/:id/policies  Policy Library                        │
│  │   │   └── /app/csms/:id/gap ───── Gap Analysis                          │
│  │   │                                                                      │
│  │   ├── /app/reports ────────────── Report Generator                      │
│  │   │   ├── /app/reports/generate ── Generate Report                      │
│  │   │   └── /app/reports/:id ────── Report Detail / Download              │
│  │   │                                                                      │
│  │   └── /app/admin ──────────────── Administration                        │
│  │       ├── /app/admin/members ──── Team Members                          │
│  │       ├── /app/admin/roles ────── Roles & Permissions                   │
│  │       ├── /app/admin/integrations  Integration Hub                      │
│  │       ├── /app/admin/api-keys ─── API Keys                              │
│  │       ├── /app/admin/audit-log ── Audit Log                             │
│  │       ├── /app/admin/webhooks ─── Webhooks                              │
│  │       └── /app/admin/settings ─── Workspace Settings                    │
│  │                                                                          │
│  ├── /auth ──── Public Auth Pages                                          │
│  │   ├── /auth/login                                                       │
│  │   ├── /auth/register                                                    │
│  │   ├── /auth/forgot-password                                             │
│  │   ├── /auth/reset-password                                              │
│  │   ├── /auth/mfa                                                         │
│  │   └── /auth/sso/callback                                                │
│  │                                                                          │
│  └── /platform ── Platform Admin (cross-tenant)                            │
│      ├── /platform/tenants                                                 │
│      ├── /platform/tenants/:id                                             │
│      └── /platform/audit-log                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Navigation Structure

### 2.1 Primary Navigation — Left Sidebar

The sidebar uses a **two-level navigation** pattern with collapsible section groups.

```
┌─────────────────────────┐
│  ┌──────────────────┐   │
│  │ ◆ IEC62443       │   │  ← Brand mark + Tenant name
│  │   Acme Corp      │   │     (clickable tenant switcher)
│  └──────────────────┘   │
│                         │
│  ┌──────────────────┐   │
│  │ 🔍 Search...  ⌘K │   │  ← Global search (Cmd+K)
│  └──────────────────┘   │
│                         │
│  OVERVIEW               │  ← Section label (11px uppercase)
│  ├─ 📊 Dashboard        │  ← Active item: filled bg + left accent
│  │                      │
│  ENGAGEMENT             │
│  ├─ 📋 Assessments    3 │  ← Badge: count of in-progress
│  ├─ 📑 Requirements     │
│  ├─ 🏭 Assets         47│
│  ├─ 🔲 Purdue Model     │
│  ├─ 🔗 Zones & Conduits │
│  │                      │
│  ANALYSIS               │
│  ├─ ⚠ Findings       12│  ← Badge: count of open critical
│  ├─ 🎯 Risk Register    │
│  ├─ 📎 Evidence          │
│  ├─ 🔧 Remediation    5 │  ← Badge: overdue count
│  ├─ 🛡 CSMS              │
│  │                      │
│  OUTPUT                 │
│  ├─ 📄 Reports          │
│  │                      │
│  ───────────────────    │  ← Divider
│  ⚙ Administration       │  ← Only visible to Admin roles
│                         │
├─────────────────────────┤
│  👤 Sarah Chen          │  ← User footer: avatar + name
│  Lead Assessor          │     Role label
│  ◉ Online               │     Sync status indicator
└─────────────────────────┘
```

**Sidebar Behavior:**

| Breakpoint  | State                     | Width                |
| ----------- | ------------------------- | -------------------- |
| ≥ 1440px    | Expanded (labels visible) | 256px                |
| 1024–1439px | Collapsed (icons only)    | 64px                 |
| < 1024px    | Hidden (slide-out drawer) | 280px overlay        |
| User toggle | Manual expand/collapse    | Overrides breakpoint |

### 2.2 Secondary Navigation — Top Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Assessments  ›  Plant Alpha Gap Assessment  ›  Scorecard       │
│                                                                     │
│  ┌──────────────────────────────────┐                               │
│  │ ← Back   Assessment Actions ▼   │   ← Contextual actions        │
│  └──────────────────────────────────┘                               │
│                                                                     │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐                                           │
│  │🔔│  │💬│  │🔄│  │👤│   ← Icon buttons: Notifications, Help,   │
│  │ 3│  │  │  │  │  │  │     Sync Status, User Menu                │
│  └──┘  └──┘  └──┘  └──┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Top Bar Components:**

| Element             | Position                | Behavior                                                       |
| ------------------- | ----------------------- | -------------------------------------------------------------- |
| **Breadcrumb**      | Left                    | Max 3 levels, truncate middle with `...`                       |
| **Context Actions** | Left (after breadcrumb) | Page-specific primary actions                                  |
| **Notifications**   | Right                   | Bell icon with unread count badge                              |
| **Help**            | Right                   | Opens help drawer (documentation search)                       |
| **Sync Status**     | Right                   | Online/Offline indicator with sync queue count                 |
| **User Menu**       | Right                   | Avatar → dropdown (Profile, Settings, Switch Tenant, Sign Out) |

### 2.3 Tertiary Navigation — Page-Level Tabs

For complex modules with sub-views, use **horizontal tab bars** within the page content:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Plant Alpha Gap Assessment                                         │
│                                                                     │
│  ┌──────┬────────┬─────────┬──────────┬──────────┐                 │
│  │Summary│Questions│Scorecard│ Findings │  Export  │  ← Tab bar     │
│  └──────┴────────┴─────────┴──────────┴──────────┘                 │
│                                                                     │
│  ┌─ Tab Content ──────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │  (Active tab content renders here)                            │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Tabs Per Module:**

| Module            | Tabs                                                       |
| ----------------- | ---------------------------------------------------------- |
| Assessment Detail | Summary, Questions, Scorecard, Findings, Export            |
| Risk Detail       | Overview, Treatments, Acceptances, History                 |
| Finding Detail    | Details, Evidence, Comments, History, Remediation          |
| Zone Detail       | Properties, Assets, Conduits, Segmentation Rules           |
| Asset Detail      | Overview, Network Info, Zone Assignment, Findings, History |
| Remediation Plan  | Overview, Actions, Budget, Verification                    |
| CSMS Framework    | Overview, Elements, Policies, Gap Analysis, Improvements   |

---

## 3. Navigation Depth Rules

```
Level 0: Shell (/app)
  └─ Global layout: Sidebar + Top Bar + Content Area

Level 1: Module (/app/assessments)
  └─ Module index page with data table/grid

Level 2: Entity (/app/assessments/:id)
  └─ Entity detail with tab navigation

Level 3: Sub-entity (/app/assessments/:id/questions)
  └─ Tab content within entity detail

Maximum depth: 3 levels
  - Never nest deeper than 3 levels
  - Level 3 uses tabs, not additional URL segments
  - Cross-references open in context panels (not new pages)
```

---

## 4. Context Panel Pattern

For related-entity drill-downs without leaving the current page:

```
┌─────────────────────────────────┬───────────────────┐
│                                 │                   │
│   Main Content Area             │  Context Panel    │
│                                 │  (slide-in)       │
│   e.g., Findings Table          │                   │
│                                 │  ┌─────────────┐  │
│   Click finding row ────────────┼─►│ F-2024-0042 │  │
│                                 │  │             │  │
│                                 │  │ Severity:   │  │
│                                 │  │ Critical    │  │
│                                 │  │             │  │
│                                 │  │ Status:     │  │
│                                 │  │ Open        │  │
│                                 │  │             │  │
│                                 │  │ [Full View] │  │
│                                 │  └─────────────┘  │
│                                 │                   │
└─────────────────────────────────┴───────────────────┘

Panel width: 420px (desktop), full-width (mobile)
Panel triggers: Row click in tables, entity reference links
Panel close: ESC key, click outside, close button
```

---

## 5. URL Pattern Conventions

| Pattern                   | Example                              | Description              |
| ------------------------- | ------------------------------------ | ------------------------ |
| `/app/{module}`           | `/app/findings`                      | Module index (list view) |
| `/app/{module}/:id`       | `/app/findings/abc-123`              | Entity detail            |
| `/app/{module}/new`       | `/app/assessments/new`               | Create form (wizard)     |
| `/app/{module}/:id/{sub}` | `/app/assessments/abc-123/questions` | Sub-view tab             |
| `/app/{module}/{action}`  | `/app/assets/import`                 | Module-level action      |

**Query Parameters for List Views:**

```
/app/findings?status=open&severity=critical,high&sort=-created_at&page=2
/app/risks?register=reg-001&level=high&category=safety
/app/assets?type=plc&criticality=safety_critical&search=controller
```

---

## 6. Role-Based Navigation Visibility

| Nav Item         | Owner | Admin | Proj Mgr | Lead Assessor | Assessor | Quality Mgr | Risk Mgr | Viewer |
| ---------------- | :---: | :---: | :------: | :-----------: | :------: | :---------: | :------: | :----: |
| Dashboard        |   ✓   |   ✓   |    ✓     |       ✓       |    ✓     |      ✓      |    ✓     |   ✓    |
| Assessments      |   ✓   |   ✓   |    ✓     |       ✓       |  ✓(RO)   |    ✓(RO)    |  ✓(RO)   | ✓(RO)  |
| Requirements     |   ✓   |   ✓   |    ✓     |       ✓       |    ✓     |      ✓      |    ✓     |   ✓    |
| Assets           |   ✓   |   ✓   |    ✓     |       ✓       |  ✓(RO)   |      —      |  ✓(RO)   | ✓(RO)  |
| Purdue Model     |   ✓   |   ✓   |    ✓     |       ✓       |  ✓(RO)   |      —      |    —     | ✓(RO)  |
| Zones & Conduits |   ✓   |   ✓   |    ✓     |       ✓       |  ✓(RO)   |      —      |    —     | ✓(RO)  |
| Findings         |   ✓   |   ✓   |    ✓     |       ✓       |    ✓     |      ✓      |  ✓(RO)   | ✓(RO)  |
| Risk Register    |   ✓   |   ✓   |    ✓     |     ✓(RO)     |  ✓(RO)   |      ✓      |    ✓     | ✓(RO)  |
| Evidence         |   ✓   |   ✓   |    ✓     |       ✓       |    ✓     |    ✓(RO)    |    —     |   —    |
| Remediation      |   ✓   |   ✓   |    ✓     |     ✓(RO)     |  ✓(RO)   |      ✓      |  ✓(RO)   | ✓(RO)  |
| CSMS             |   ✓   |   ✓   |    ✓     |     ✓(RO)     |  ✓(RO)   |      ✓      |    —     | ✓(RO)  |
| Reports          |   ✓   |   ✓   |    ✓     |       ✓       |  ✓(RO)   |      ✓      |    ✓     |   ✓    |
| Administration   |   ✓   |   ✓   |    —     |       —       |    —     |      —      |    —     |   —    |

(RO) = Read-only access; nav item visible but write actions disabled

---

## 7. Global Search (Cmd+K)

```
┌──────────────────────────────────────────────────────┐
│  🔍  Search assessments, findings, assets, risks...  │
│                                                      │
│  ── Recent ─────────────────────────────────────     │
│  📋 Plant Alpha Gap Assessment    Assessment          │
│  ⚠ F-2024-0042: Missing firewall  Finding  Critical  │
│  🎯 RISK-0017: PLC unauthorized…  Risk     High      │
│                                                      │
│  ── Quick Actions ────────────────────────────────   │
│  + New Finding                                       │
│  + New Assessment                                    │
│  ↑ Upload Evidence                                   │
│  📄 Generate Report                                  │
│                                                      │
│  ── Navigation ───────────────────────────────────   │
│  → Risk Register                                     │
│  → Zone & Conduit Designer                           │
│  → Administration                                    │
└──────────────────────────────────────────────────────┘

Search indexes:
  • Assessments (name, type, status)
  • Findings (title, description, external_ref)
  • Assets (name, tag, vendor, model, IP)
  • Risks (title, category)
  • Evidence (title, file_name, tags)
  • Zones (name, type)
  • Reports (name, type)

Results ranked by: relevance + recency + user's recent activity
```

---

_Next: [User Flows →](user-flows.md)_
