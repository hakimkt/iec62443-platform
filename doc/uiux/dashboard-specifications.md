# IEC 62443 Platform — Dashboard Specifications

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01

---

## 1. Dashboard Architecture

### 1.1 Dashboard Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD LAYERS                                │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Executive Dashboard (all users)                   │   │
│  │  /app/dashboard                                             │   │
│  │  High-level security posture, KPIs, trends                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                     │
│              ▼               ▼               ▼                     │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐       │
│  │  Layer 2: Module  │ │  Layer 2:    │ │  Layer 2: Module │       │
│  │  Dashboards       │ │  Client      │ │  Dashboards      │       │
│  │                   │ │  Dashboard   │ │                  │       │
│  │  • Risk Overview  │ │  (per client)│ │  • Assessment    │       │
│  │  • Finding Stats  │ │              │ │    Progress      │       │
│  │  • Remediation    │ │              │ │  • CSMS Maturity │       │
│  │    Tracker        │ │              │ │                  │       │
│  └──────────────────┘ └──────────────┘ └──────────────────┘       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Entity Dashboards (detail within context panel)   │   │
│  │  • Assessment scorecard mini-view                            │   │
│  │  • Risk entry summary                                        │   │
│  │  • Finding activity feed                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Dashboard Grid System

```
Base grid: 12 columns, 24px gutter, 24px row gap

Standard widget sizes (in grid columns):
  ┌──────────────────────────────────────────────────────────────┐
  │  12 cols (full width)                                        │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │                                                        │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  8 cols + 4 cols                                             │
  │  ┌──────────────────────────────────┐ ┌──────────────────┐  │
  │  │                                  │ │                  │  │
  │  └──────────────────────────────────┘ └──────────────────┘  │
  │                                                              │
  │  6 cols + 6 cols                                             │
  │  ┌────────────────────────────────┐ ┌────────────────────┐  │
  │  │                                │ │                    │  │
  │  └────────────────────────────────┘ └────────────────────┘  │
  │                                                              │
  │  4 cols × 3                                                  │
  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
  │  │                │ │                │ │                │   │
  │  └────────────────┘ └────────────────┘ └────────────────┘   │
  │                                                              │
  │  3 cols × 4 (KPI row)                                        │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
  │  │          │ │          │ │          │ │          │       │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
  └──────────────────────────────────────────────────────────────┘

Widget heights:
  KPI card:      h-32 (128px)
  Chart widget:  h-72 to h-96 (288–384px)
  List widget:   h-auto (max-h-96, scrollable)
  Table widget:  h-auto (pagination controls)
```

---

## 2. Executive Dashboard

**Route:** `/app/dashboard`
**API:** `GET /api/v1/dashboard/summary`

### 2.1 Layout Specification

```
┌─ Row 0: Page Header ─────────────────────────────────────────────────────┐
│  Height: 56px                                                            │
│  Left: "Executive Dashboard" (text-2xl font-semibold)                    │
│  Right: [Period: Q2 2026 ▾]  [Export ▾]  [⚙ Customize]                 │
│  Period selector: Current quarter (default), YTD, Last 12 months, Custom │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 1: KPI Strip (4 × 3 cols) ─────────────────────────────────────────┐
│  Height: 128px per card                                                  │
│  Gap: 24px                                                               │
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Security   │ │ Open       │ │ Active     │ │Remediation │           │
│  │ Score      │ │ Findings   │ │ Risks      │ │ Actions    │           │
│  │            │ │            │ │            │ │            │           │
│  │ 72/100     │ │ 12         │ │ 9          │ │ 5 overdue  │           │
│  │ ↑ 7 pts    │ │ 3🔴 5🟠 4🟡│ │ 2🔴 4🟠 3🟡│ │ 8 total    │           │
│  │ ▁▃▅▇█▇▅▃  │ │            │ │            │ │            │           │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │
│                                                                          │
│  Data sources:                                                           │
│  • Security Score: weighted average of assessment scores                 │
│  • Open Findings: count by severity from findings table                  │
│  • Active Risks: count by level from risk.entries                        │
│  • Remediation: overdue count + total from remediation.actions           │
│                                                                          │
│  Interactions:                                                           │
│  • Click card → drill-down to relevant module page (filtered)            │
│  • Hover → tooltip with breakdown details                                │
│  • Sparkline shows 30-day trend                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 2: Main Charts (8 cols + 4 cols) ──────────────────────────────────┐
│  Height: 384px                                                           │
│                                                                          │
│  ┌─ Security Level Radar (8 cols) ──────────┐ ┌─ Assessment Progress ─┐│
│  │                                           │ │                       ││
│  │  Radar chart: FR1–FR7                     │ │  List of assessments  ││
│  │  Two overlays:                            │ │  with progress bars   ││
│  │  • Current SL (solid, brand-500)          │ │                       ││
│  │  • Target SL (dashed, surface-400)        │ │  Each row:            ││
│  │                                           │ │  • Name + type        ││
│  │  Below chart:                             │ │  • Progress bar       ││
│  │  FR category table:                       │ │  • Status badge       ││
│  │  FR │ Current │ Target │ Gap              │ │  • Lead assessor      ││
│  │  ───┼─────────┼────────┼─────             │ │                       ││
│  │  1  │   2     │   3    │ -1              │ │  Max 5 visible        ││
│  │  2  │   3     │   3    │  0 ✓            │ │  [View All →]         ││
│  │  3  │   1     │   2    │ -1              │ │                       ││
│  │  ...│         │        │                  │ │                       ││
│  │                                           │ │                       ││
│  │  [View Scorecard →]                       │ │                       ││
│  └───────────────────────────────────────────┘ └───────────────────────┘│
│                                                                          │
│  Data sources:                                                           │
│  • Radar: GET /assessments/:id/scorecard (latest completed assessment)   │
│  • Progress: GET /assessments?status=in_progress&sort=-updated_at        │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 3: Risk & Findings (6 cols + 6 cols) ──────────────────────────────┐
│  Height: 384px                                                           │
│                                                                          │
│  ┌─ Risk Heat Map (6 cols) ─────────────────┐ ┌─ Recent Findings ──────┐│
│  │                                           │ │                        ││
│  │  5×5 matrix with color-coded cells        │ │  List of 5 most       ││
│  │  Number badges showing risk count         │ │  recent findings       ││
│  │                                           │ │                        ││
│  │  Below matrix:                            │ │  Each row:             ││
│  │  Summary:                                 │ │  • Severity dot        ││
│  │  • Critical: 2 (unacceptable)             │ │  • Title (truncated)   ││
│  │  • High: 4 (immediate action)             │ │  • Assessment + time   ││
│  │  • Medium: 2 (treatment planned)          │ │  • Status badge        ││
│  │  • Low: 1 (monitoring)                    │ │                        ││
│  │                                           │ │  [View All →]          ││
│  │  [Open Risk Register →]                   │ │                        ││
│  └───────────────────────────────────────────┘ └────────────────────────┘│
│                                                                          │
│  Data sources:                                                           │
│  • Heat map: GET /dashboard/risk-heatmap                                 │
│  • Findings: GET /findings?sort=-created_at&per_page=5                   │
│                                                                          │
│  Real-time updates:                                                      │
│  • WebSocket: finding.updated → refresh finding list                     │
│  • WebSocket: risk.level_changed → refresh heat map                      │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 4: Remediation Timeline (12 cols, full width) ─────────────────────┐
│  Height: 200px                                                           │
│                                                                          │
│  Gantt-style timeline showing remediation actions:                       │
│  • X-axis: months (current quarter)                                      │
│  • Y-axis: remediation actions (sorted by due date)                      │
│  • Bar colors: ● completed (green), ◐ in progress (blue),               │
│    ○ planned (gray), ⚠ overdue (red)                                     │
│  • Click bar → context panel with action details                         │
│  • Today marker: vertical dashed line                                    │
│                                                                          │
│  Data source: GET /dashboard/remediation-status                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Role-Based Dashboard Variants

| Widget               | CISO (Owner) | Plant Engineer (PM) | Lead Assessor | Assessor | Viewer |
| -------------------- | ------------ | ------------------- | ------------- | -------- | ------ |
| Security Score       | ✓            | ✓                   | ✓             | ✓        | ✓      |
| Open Findings        | ✓            | ✓                   | ✓             | ✓ (own)  | ✓      |
| Active Risks         | ✓            | ✓                   | ✓             | ✓ (RO)   | ✓      |
| Remediation          | ✓            | ✓ (editable)        | ✓ (RO)        | ✓ (RO)   | ✓ (RO) |
| Radar Chart          | ✓            | ✓                   | ✓ (editable)  | ✓ (RO)   | ✓      |
| Assessment Progress  | ✓            | ✓                   | ✓             | ✓ (own)  | ✓      |
| Risk Heat Map        | ✓            | ✓                   | ✓             | ✓ (RO)   | ✓      |
| Recent Findings      | ✓            | ✓                   | ✓             | ✓ (own)  | ✓      |
| Remediation Timeline | ✓            | ✓ (editable)        | ✓ (RO)        | ✓ (RO)   | ✓ (RO) |
| CSMS Maturity        | ✓            | ✓                   | ✓ (RO)        | ✓ (RO)   | ✓      |
| Budget Summary       | ✓            | ✓                   | —             | —        | —      |
| Audit Activity       | ✓            | ✓                   | —             | —        | —      |

---

## 3. Risk Overview Dashboard

**Route:** `/app/risks` (when Matrix View is active)
**API:** `GET /api/v1/dashboard/risk-heatmap`, `GET /api/v1/risk-registers/:id/risks`

### 3.1 Layout

```
┌─ Row 1: Risk KPIs (4 × 3 cols) ─────────────────────────────────────────┐
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Total Risks│ │ Inherent   │ │ Residual   │ │ Pending    │           │
│  │            │ │ Risk Score │ │ Risk Score │ │ Acceptance │           │
│  │     9      │ │    14.2    │ │    8.7     │ │     3      │           │
│  │            │ │  avg       │ │  avg       │ │            │           │
│  │            │ │ ↓ 2.1      │ │ ↓ 1.3      │ │  oldest:   │           │
│  │            │ │            │ │            │ │  12 days    │           │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 2: Heat Map (6 cols) + Risk Distribution (6 cols) ─────────────────┐
│                                                                          │
│  ┌─ Heat Map (6 cols) ──────────────────────┐ ┌─ Risk by Category ────┐│
│  │                                           │ │                        ││
│  │  5×5 color-coded matrix                   │ │  Horizontal bar chart ││
│  │  (see component-library.md §5.1)          │ │                        ││
│  │                                           │ │  Safety     ██████ 3  ││
│  │  Click cell → risk list below             │ │  Operation  ████   2  ││
│  │                                           │ │  Financial  ███    2  ││
│  │                                           │ │  Environm.  ██     1  ││
│  │                                           │ │  Regulatory █      1  ││
│  └───────────────────────────────────────────┘ │                        ││
│                                                │  Treatment Status:     ││
│                                                │  Mitigate  ████████ 5 ││
│                                                │  Accept    ███      2 ││
│                                                │  Transfer  █        1 ││
│                                                │  Avoid     █        1 ││
│                                                └────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 3: Risk Trend (8 cols) + Top Risks (4 cols) ──────────────────────┐
│                                                                         │
│  ┌─ Risk Score Trend (8 cols) ────────────────────┐ ┌─ Top 5 Risks ──┐│
│  │                                                 │ │                 ││
│  │  Line chart: avg risk score over time           │ │ 1. 🔴 SCADA   ││
│  │                                                 │ │    compromise  ││
│  │  ──── Inherent risk                             │ │    Score: 25   ││
│  │  - - - Residual risk                            │ │                 ││
│  │  ─ ─ ─ Risk appetite threshold                  │ │ 2. 🔴 Unauth  ││
│  │                                                 │ │    PLC changes ││
│  │  25 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │ │    Score: 20   ││
│  │                                                 │ │                 ││
│  │  20 ────●──────────────────────                 │ │ 3. 🟠 Missing ││
│  │                                                 │ │    segmentat.  ││
│  │  15 ────────●───●───────                        │ │    Score: 15   ││
│  │                                                 │ │                 ││
│  │  10 ────────────────●───●───                    │ │ 4. 🟠 Outdated││
│  │                                                 │ │    firmware    ││
│  │   5 ●───●───────────────────●                   │ │    Score: 12   ││
│  │                                                 │ │                 ││
│  │   Q1'25  Q2'25  Q3'25  Q4'25  Q1'26           │ │ 5. 🟡 No pass.││
│  │                                                 │ │    policy      ││
│  └─────────────────────────────────────────────────┘ │    Score: 8    ││
│                                                      │                 ││
│                                                      │ [View All →]   ││
│                                                      └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Remediation Dashboard

**Route:** `/app/remediation` (overview mode)
**API:** `GET /api/v1/dashboard/remediation-status`

### 4.1 Layout

```
┌─ Row 1: Remediation KPIs (4 × 3 cols) ──────────────────────────────────┐
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Total      │ │ On Track   │ │ Overdue    │ │ Budget     │           │
│  │ Actions    │ │            │ │            │ │ Utilization│           │
│  │     24     │ │     17     │ │     2      │ │            │           │
│  │            │ │  71%       │ │  🔴        │ │ $145K /    │           │
│  │            │ │            │ │            │ │ $225K (64%)│           │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 2: Gantt Timeline (12 cols) ───────────────────────────────────────┐
│                                                                          │
│  ┌─ Remediation Gantt Chart ──────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  Plan / Action          │ Jul    │ Aug    │ Sep    │ Oct    │ Nov  │ │
│  │  ───────────────────────┼────────┼────────┼────────┼────────┼───── │ │
│  │  Q3 Safety PLC          │        │        │        │        │      │ │
│  │   ├─ Modbus Auth        │████████│████░░░░│        │        │      │ │
│  │   ├─ FW Segmentation    │        │████████│████░░░░│        │      │ │
│  │   ├─ PLC Firmware       │        │        │████████│████░░░░│      │ │
│  │   └─ Validation         │        │        │        │████████│████░░│ │
│  │  ───────────────────────┼────────┼────────┼────────┼────────┼───── │ │
│  │  Plant Beta Network     │        │        │        │        │      │ │
│  │   ├─ Zone Design        │        │████████│        │        │      │ │
│  │   ├─ HW Procurement     │        │        │████████│████░░░░│      │ │
│  │   └─ Implementation     │        │        │        │████████│████░░│ │
│  │                                                                    │ │
│  │  ──── Today: Aug 1, 2026 ─ ─ ─ ─ ─ ─ ─ ─ ─│                      │ │
│  │                                                                    │ │
│  │  Legend: ████ Completed  ████░░░░ In Progress  ░░░░ Planned  ⚠ Over│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Click action bar → context panel with action details                    │
│  Drag bar edges → reschedule (if user has permission)                    │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 3: Completion Rate (6 cols) + Budget (6 cols) ────────────────────┐
│                                                                         │
│  ┌─ Completion Rate by Plan ─────────────────┐ ┌─ Budget Tracking ────┐│
│  │                                            │ │                      ││
│  │  Stacked bar chart:                        │ │  Donut chart:        ││
│  │                                            │ │                      ││
│  │  Q3 Safety ████████░░░░ 67%               │ │     ╭──────╮         ││
│  │  Plant Beta ██░░░░░░░░░░ 20%              │ │    ╱ 64%    ╲        ││
│  │  HMI Hard. ░░░░░░░░░░░░ 0%               │ │   │  $145K  │        ││
│  │                                            │ │    ╲ / $225K╱        ││
│  │  ──── Completed  ░░░░ Remaining           │ │     ╰──────╯         ││
│  └────────────────────────────────────────────┘ │                      ││
│                                                  │  By category:        ││
│                                                  │  Hardware  $65K     ││
│                                                  │  Labor     $50K     ││
│                                                  │  Software  $20K     ││
│                                                  │  Other     $10K     ││
│                                                  └──────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Assessment Progress Dashboard

**Route:** `/app/assessments` (overview mode)
**API:** `GET /api/v1/dashboard/assessment-progress`

### 5.1 Layout

```
┌─ Row 1: Assessment KPIs (4 × 3 cols) ───────────────────────────────────┐
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ Active     │ │ Completed  │ │ Avg        │ │ Questions  │           │
│  │ Assessments│ │ This Qtr   │ │ Compliance │ │ Answered   │           │
│  │     4      │ │     3      │ │    68%     │ │  142/256   │           │
│  │            │ │            │ │  ↑ 8%      │ │  55%       │           │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘           │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 2: Assessment Cards (grid, 3 cols each) ───────────────────────────┐
│                                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐ ┌──────────────┐│
│  │ Plant Alpha Gap        │ │ Plant Beta System      │ │ Unit 200 DCS ││
│  │                        │ │                        │ │              ││
│  │ {In Progress}          │ │ {Draft}                │ │ {Completed}  ││
│  │ IEC 62443-3-2          │ │ IEC 62443-3-3          │ │ IEC 62443-4-2││
│  │                        │ │                        │ │              ││
│  │ ██████████████░░ 78%   │ │ ░░░░░░░░░░░░░░░░ 0%   │ │ ████████ 100%││
│  │                        │ │                        │ │              ││
│  │ SL Target: 2           │ │ SL Target: 3           │ │ SL Target: 2 ││
│  │ SL Current: 1          │ │ SL Current: —          │ │ SL Current: 2││
│  │ Gap: -1                │ │ Gap: —                 │ │ Gap: 0 ✓    ││
│  │                        │ │                        │ │              ││
│  │ 37/48 questions        │ │ 0/56 questions         │ │ 42/42 ✓     ││
│  │ 12 findings            │ │ 0 findings             │ │ 3 findings  ││
│  │                        │ │                        │ │              ││
│  │ Lead: Sarah Chen       │ │ Lead: Marcus Weber     │ │ Lead: Sarah  ││
│  │ Due: Aug 30            │ │ Due: Oct 15            │ │ Done: Jun 30 ││
│  │                        │ │                        │ │              ││
│  │ [Open →]               │ │ [Open →]               │ │ [Open →]    ││
│  └────────────────────────┘ └────────────────────────┘ └──────────────┘│
│                                                                          │
│  ┌────────────────────────┐                                             │
│  │ CSMS Maturity          │                                             │
│  │                        │                                             │
│  │ {Review}               │                                             │
│  │ IEC 62443-2-1          │                                             │
│  │                        │                                             │
│  │ █████████████████░ 85% │                                             │
│  │                        │                                             │
│  │ Maturity Score: 3.4/5  │                                             │
│  │                        │                                             │
│  │ 42 elements assessed   │                                             │
│  │ 8 policies approved    │                                             │
│  │                        │                                             │
│  │ Lead: Sarah Chen       │                                             │
│  │ Due: Aug 15            │                                             │
│  │                        │                                             │
│  │ [Open →]               │                                             │
│  └────────────────────────┘                                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 3: Compliance Trend (8 cols) + Findings by Assessment (4 cols) ────┐
│                                                                         │
│  ┌─ Compliance Trend ───────────────────────────┐ ┌─ Findings ────────┐│
│  │                                               │ │                   ││
│  │  Line chart: avg compliance % over time       │ │  Stacked bar:     ││
│  │                                               │ │  findings per     ││
│  │  100% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │ │  assessment       ││
│  │                                               │ │                   ││
│  │   80% ────────●───────────●───               │ │  Plant Alpha:     ││
│  │                                               │ │  🔴3 🟠5 🟡4    ││
│  │   60% ●───●───────────────────               │ │                   ││
│  │                                               │ │  Unit 200:        ││
│  │   40%                                         │ │  🟠1 🟡2         ││
│  │                                               │ │                   ││
│  │   Q1'26    Q2'26    Q3'26                    │ │  CSMS:            ││
│  │                                               │ │  🟡2              ││
│  └───────────────────────────────────────────────┘ │                   ││
│                                                    │  Total: 15        ││
│                                                    └───────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Client Dashboard (Consulting Workspace)

**Route:** `/app/clients/:id`
**API:** `GET /api/v1/tenants/:id/dashboard` (platform-level aggregation)

### 6.1 Layout

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  ← Clients    Alpha Chemical Corp                        [Settings] [⋯]   │
│               Engagement since Jan 2025 · 3 facilities                     │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Row 1: Client KPIs (5 × ~2.4 cols) ─────────────────────────────────────┐
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Active   │ │ Overall  │ │ Open     │ │ Overdue  │ │ Next     │      │
│  │ Engage-  │ │ Security │ │ Findings │ │ Actions  │ │ Milestone│      │
│  │ ments    │ │ Score    │ │          │ │          │ │          │      │
│  │    4     │ │   72     │ │   12     │ │    2     │ │ Aug 15   │      │
│  │          │ │  /100    │ │          │ │          │ │          │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 2: Facility Overview (12 cols) ─────────────────────────────────────┐
│                                                                          │
│  ┌─ Facility Cards (3 × 4 cols) ──────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────┐ │ │
│  │  │ Plant Alpha        │ │ Plant Beta         │ │ Plant Gamma    │ │ │
│  │  │                    │ │                    │ │                │ │ │
│  │  │ Score: 72 ↑ 7     │ │ Score: 45 new      │ │ Score: 88 ↑ 3  │ │ │
│  │  │ ████████████░░░░  │ │ ░░░░░░░░░░░░░░░░  │ │ ██████████████ │ │ │
│  │  │                    │ │                    │ │                │ │ │
│  │  │ 1 assessment      │ │ 1 assessment       │ │ 2 assessments  │ │ │
│  │  │ 12 findings       │ │ 0 findings         │ │ 3 findings     │ │ │
│  │  │ 5 risks           │ │ 0 risks            │ │ 1 risk         │ │ │
│  │  │                    │ │                    │ │                │ │ │
│  │  │ [View →]          │ │ [View →]          │ │ [View →]       │ │ │
│  │  └────────────────────┘ └────────────────────┘ └────────────────┘ │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Row 3: Engagement Timeline (12 cols) ───────────────────────────────────┐
│                                                                          │
│  ┌─ Assessment Timeline ──────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  2025 Q1  │  2025 Q2  │  2025 Q3  │  2025 Q4  │  2026 Q1  │ Q2  │ │
│  │  ─────────┼───────────┼───────────┼───────────┼───────────┼───── │ │
│  │  Alpha Gap Assessment ██████████████████████████████████████████ ✓ │ │
│  │  Beta System Assessment          ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  │  Gamma Component 1       ████████████████████ ✓                   │ │
│  │  Gamma Component 2                   ████████████████████ ✓       │ │
│  │  CSMS Maturity                              ░░░░░░░░░░░░░░░░░░░ │ │
│  │                                                                    │ │
│  │  ✓ Completed   ████████ In Progress   ░░░░░░░░ Planned            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Dashboard Widget Configuration

### 7.1 Widget Registry

```typescript
interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'table' | 'timeline' | 'custom';
  title: string;
  description: string;
  size: { cols: number; minRows: number; maxRows?: number };
  dataEndpoint: string;
  refreshInterval: number; // seconds, 0 = no auto-refresh
  roles: string[]; // which roles can see this widget
  configurable: boolean; // can user customize display?
  drillDownRoute?: string; // where clicking the widget navigates
}
```

### 7.2 Available Widgets

| Widget              | Type     | Size | Roles     | Refresh    |
| ------------------- | -------- | ---- | --------- | ---------- |
| Security Score      | metric   | 3×1  | all       | 300s       |
| Open Findings       | metric   | 3×1  | all       | 60s (WS)   |
| Active Risks        | metric   | 3×1  | all       | 300s       |
| Remediation Status  | metric   | 3×1  | all       | 300s       |
| SL Radar Chart      | chart    | 8×2  | all       | 0 (manual) |
| Assessment Progress | list     | 4×2  | all       | 300s       |
| Risk Heat Map       | chart    | 6×2  | all       | 0 (manual) |
| Risk Distribution   | chart    | 6×2  | PM+       | 300s       |
| Recent Findings     | list     | 6×2  | all       | 60s (WS)   |
| Risk Trend          | chart    | 8×2  | PM+       | 3600s      |
| Top Risks           | list     | 4×2  | all       | 300s       |
| Remediation Gantt   | timeline | 12×1 | PM+       | 3600s      |
| Completion Rate     | chart    | 6×2  | PM+       | 3600s      |
| Budget Tracking     | chart    | 6×2  | Owner, PM | 3600s      |
| CSMS Maturity       | chart    | 6×2  | all       | 3600s      |
| Audit Activity      | list     | 6×2  | Admin+    | 300s       |
| Facility Overview   | custom   | 12×1 | all       | 3600s      |
| Engagement Timeline | timeline | 12×1 | all       | 3600s      |

### 7.3 Dashboard Customization

```
Users with appropriate roles can customize their dashboard:

┌──────────────────────────────────────────────────────────────────────┐
│  Customize Dashboard                                    [Save] [×]  │
│                                                                      │
│  ┌─ Available Widgets ──────────┐  ┌─ Your Dashboard ────────────┐  │
│  │                              │  │                              │  │
│  │  □ Security Score            │  │  ┌────────────────────────┐  │  │
│  │  □ Open Findings             │  │  │  Row 1: 4 metric cards │  │  │
│  │  □ Active Risks              │  │  ├────────────────────────┤  │  │
│  │  □ Remediation Status        │  │  │  Row 2: Radar + Prog.  │  │  │
│  │  □ SL Radar Chart            │  │  ├────────────────────────┤  │  │
│  │  □ Risk Heat Map             │  │  │  Row 3: Heat + Find.   │  │  │
│  │  □ Recent Findings           │  │  ├────────────────────────┤  │  │
│  │  □ Remediation Gantt         │  │  │  Row 4: Gantt timeline │  │  │
│  │  □ Budget Tracking           │  │  └────────────────────────┘  │  │
│  │  □ Audit Activity            │  │                              │  │
│  │  □ CSMS Maturity             │  │  [Reset to Default]          │  │
│  │                              │  │                              │  │
│  │  Drag widgets to add ──────► │  │  Drag to reorder ↕           │  │
│  └──────────────────────────────┘  └──────────────────────────────┘  │
│                                                                      │
│  Layout: ◉ Compact  ○ Comfortable  ○ Spacious                       │
│  Theme:  Follow system  ○ Light  ○ Dark                             │
└──────────────────────────────────────────────────────────────────────┘

Customization is saved per-user, per-dashboard.
Default layout is restored via [Reset to Default].
```

---

## 8. Data Refresh Strategy

| Data Type                | Strategy                   | Frequency | Mechanism                        |
| ------------------------ | -------------------------- | --------- | -------------------------------- |
| KPI metrics              | Polling                    | 5 min     | TanStack Query `refetchInterval` |
| Finding counts           | Real-time                  | Instant   | WebSocket `finding.updated`      |
| Risk changes             | Real-time                  | Instant   | WebSocket `risk.level_changed`   |
| Assessment progress      | Real-time                  | Instant   | WebSocket `assessment.progress`  |
| Charts (radar, heat map) | On load + manual           | —         | User clicks refresh or navigates |
| Remediation timeline     | Polling                    | 1 hour    | TanStack Query `refetchInterval` |
| Audit activity           | Polling                    | 5 min     | TanStack Query `refetchInterval` |
| Report status            | Polling (while generating) | 3 sec     | Until status = completed         |

```
Refresh indicator:
  • Subtle spinner in widget header during refresh
  • "Last updated: 2 min ago" timestamp in widget footer
  • [↻] manual refresh button in widget header
  • Stale data warning if > 15 min old: "Data may be outdated"
```

---

## 9. Empty & Loading States for Dashboards

### 9.1 No Data State

```
When a tenant has no assessments, findings, or risks yet:

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │              ┌──────┐                                        │   │
│  │              │  📊  │  48px icon                              │   │
│  │              └──────┘                                        │   │
│  │                                                              │   │
│  │         Your dashboard is empty                              │   │
│  │                                                              │   │
│  │    Start by creating your first IEC 62443 assessment         │   │
│  │    to see security metrics and insights here.                │   │
│  │                                                              │   │
│  │         [+ New Assessment]                                   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  KPI cards show:                                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │     —      │ │     —      │ │     —      │ │     —      │       │
│  │  No data   │ │  No data   │ │  No data   │ │  No data   │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│  (dashed borders, muted text, no sparklines)                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Skeleton Loading

```
Dashboard loading (before first data fetch):

┌──────────────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (header)    │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │       │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
│                                                                      │
│  ┌──────────────────────────────────┐ ┌──────────────────┐          │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░░░░░ │          │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░░░░░ │          │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ ░░░░░░░░░░░░░░░░ │          │
│  └──────────────────────────────────┘ └──────────────────┘          │
│                                                                      │
│  Skeleton animation: pulse 1.5s infinite                             │
│  Skeleton color: surface-200 (light) / surface-100 (dark)            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Dashboard Performance Targets

| Metric                              | Target                      |
| ----------------------------------- | --------------------------- |
| Initial dashboard load (TTI)        | < 2 seconds                 |
| Widget data fetch (single)          | < 500ms                     |
| Full dashboard render (all widgets) | < 3 seconds                 |
| WebSocket event → UI update         | < 100ms                     |
| Skeleton → data transition          | No layout shift (CLS < 0.1) |
| Dashboard customization save        | < 200ms                     |
| Chart render time                   | < 300ms per chart           |

### Performance Strategies

| Strategy               | Implementation                                                |
| ---------------------- | ------------------------------------------------------------- |
| Lazy widget loading    | Intersection Observer — load widgets as they scroll into view |
| Parallel data fetching | TanStack Query parallel queries for all widgets               |
| Chart lazy rendering   | Defer chart render until container is visible                 |
| Optimistic updates     | Update KPI counts immediately on WebSocket event              |
| Memoization            | React.memo on widget components; stable query keys            |
| Caching                | 5-minute stale-while-revalidate for non-real-time data        |
| Virtual scrolling      | For lists with 50+ items                                      |
| Image optimization     | Lazy-load evidence thumbnails; use WebP format                |

---

_Back to: [Sitemap →](sitemap.md) | [User Flows →](user-flows.md) | [Design System →](design-system.md) | [Wireframes →](wireframes.md) | [Component Library →](component-library.md)_
