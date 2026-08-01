# IEC 62443 Platform — Page Wireframes

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> All wireframes use the design system defined in design-system.md

---

## Conventions Used in Wireframes

```
┌─────────────┐  = Container / card boundary
│  Text       │  = Text content (font size indicated in notes)
│  [Button]   │  = Interactive button
│  [Dropdown] │  = Select / dropdown control
│  [▾]        │  = Expandable / action menu
│  ───────    │  = Divider
│  ┌──┐       │  = Icon placeholder
│  │  │       │
│  └──┘       │
│  ◉ Active   │  = Radio / selected state
│  ○ Inactive │  = Radio / unselected state
│  ✓ Done     │  = Checkbox / completed
│  ░░░░░░░░░  │  = Skeleton / loading state
│  [▓▓▓▓▓▓▓]  │  = Chart / visualization placeholder
│  {Badge}    │  = Status badge / chip
│  ↗ link     │  = Navigation link
```

---

## 1. Executive Dashboard

**Route:** `/app/dashboard`
**Access:** All authenticated users
**Purpose:** At-a-glance security posture overview

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Executive Dashboard                                    [Q2 2026 ▾] [⋯]   │
└────────────────────────────────────────────────────────────────────────────┘

┌─ KPI Row (4 cards, equal width) ───────────────────────────────────────────┐
│                                                                            │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌────────┐│
│  │ Security Score   │ │ Open Findings    │ │ Active Risks     │ │Remedia-││
│  │                  │ │                  │ │                  │ │tion    ││
│  │      72          │ │      12          │ │      9           │ │        ││
│  │   /100  ↑ 7pts  │ │  3🔴 5🟠 4🟡    │ │  2🔴 4🟠 3🟡    │ │  5     ││
│  │   ▓▓▓▓▓▓▓▓░░░   │ │                  │ │                  │ │2 over- ││
│  │                  │ │                  │ │                  │ │due     ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ └────────┘│
└────────────────────────────────────────────────────────────────────────────┘

┌─ Row 2 (8 cols + 4 cols) ─────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Security Level Radar (8 cols) ────────────┐ ┌─ Assessment Progress ──┐│
│  │                                             │ │                        ││
│  │  FR7 ──●                                    │ │ Plant Alpha           ││
│  │       / \              ● Current SL         │ │ ██████████████░░ 78%  ││
│  │  FR6 ─●   ●── FR1      ○ Target SL         │ │ Gap Assessment · 3-2  ││
│  │      |     |                                │ │                        ││
│  │  FR5 ─●   ●── FR2                          │ │ Plant Beta            ││
│  │       \ /                                   │ │ ████████░░░░░░░░ 45%  ││
│  │  FR4 ──●── FR3                              │ │ System Assessment     ││
│  │                                             │ │                        ││
│  │  [View Scorecard →]                         │ │ Unit 200 DCS          ││
│  └─────────────────────────────────────────────┘ │ ██████████████████ 95%││
│                                                  │ Component Assessment  ││
│                                                  │                        ││
│                                                  │ [View All →]          ││
│                                                  └────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘

┌─ Row 3 (6 cols + 6 cols) ─────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Risk Heat Map (6 cols) ─────────────────┐ ┌─ Recent Findings (6 cols)┐│
│  │                                           │ │                          ││
│  │  Impact →  1    2    3    4    5          │ │ 🔴 F-0042 Unauth Modbus ││
│  │         ┌────┬────┬────┬────┬────┐        │ │    access to safety PLC ││
│  │  L  5   │    │    │    │ ① │ ② │        │ │    Plant Alpha · 2h ago ││
│  │  i     ├────┼────┼────┼────┼────┤        │ │                          ││
│  │  k  4   │    │    │ ① │    │    │        │ │ 🟠 F-0041 Missing       ││
│  │  e     ├────┼────┼────┼────┼────┤        │ │    network segmentation ││
│  │  l  3   │    │ ③ │ ② │    │    │        │ │    Plant Beta · 1d ago  ││
│  │  i     ├────┼────┼────┼────┼────┤        │ │                          ││
│  │  h  2   │ ② │ ④ │    │    │    │        │ │ 🟡 F-0040 Outdated      ││
│  │  o     ├────┼────┼────┼────┼────┤        │ │    firmware on 3 PLCs   ││
│  │  o  1   │ ⑤ │    │    │    │    │        │ │    Plant Alpha · 2d ago ││
│  │  d     └────┴────┴────┴────┴────┘        │ │                          ││
│  │                                           │ │ [View All Findings →]   ││
│  │  [Open Risk Register →]                   │ │                          ││
│  └───────────────────────────────────────────┘ └──────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘

┌─ Row 4 (12 cols) ─────────────────────────────────────────────────────────┐
│  ┌─ Remediation Timeline (full width) ───────────────────────────────────┐│
│  │                                                                       ││
│  │  Jul     Aug     Sep     Oct     Nov     Dec                         ││
│  │  │       │       │       │       │       │                           ││
│  │  ├──[Modbus Auth]──┤                                                ││
│  │       ├──[FW Segmentation]────┤                                     ││
│  │              ├──[PLC Firmware]──┤                                    ││
│  │                     ├──[HMI Hardening]────────────┤                  ││
│  │                                                                       ││
│  │  ● Completed  ◐ In Progress  ○ Planned  ⚠ Overdue                   ││
│  └───────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

**Widget Specifications:**

| Widget | Data Source | Refresh | Interaction |
|---|---|---|---|
| Security Score | `GET /dashboard/summary` | On load | Click → Assessment overview |
| Open Findings | `GET /findings?status=open` | Real-time (WS) | Click badge → filtered findings |
| Active Risks | `GET /dashboard/risk-heatmap` | On load | Click → risk register |
| Remediation | `GET /dashboard/remediation-status` | On load | Click → remediation tracker |
| Radar Chart | `GET /assessments/:id/scorecard` | On load | Click → scorecard detail |
| Assessment Progress | `GET /assessments` | On load | Click → assessment detail |
| Risk Heat Map | `GET /dashboard/risk-heatmap` | On load | Click cell → filtered risks |
| Recent Findings | `GET /findings?sort=-created_at&per_page=5` | Real-time (WS) | Click row → context panel |
| Remediation Timeline | `GET /remediation-plans` | On load | Click bar → action detail |

---

## 2. Assessment Management

**Route:** `/app/assessments`
**Access:** All roles (read-only for Assessor, Quality Mgr, Risk Mgr, Viewer)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Assessments                                         [+ New Assessment]     │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Filters Bar ──────────────────────────────────────────────────────────────┐
│  [🔍 Search assessments...]  [Type ▾]  [Status ▾]  [IEC Part ▾]  [Clear] │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Assessment Cards (Grid View — toggle to Table View) ──────────────────────┐
│                                                                            │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ 📋 Plant Alpha Gap Assessment │  │ 📋 Plant Beta System Assessment│   │
│  │                                │  │                                │   │
│  │ {In Progress}  IEC 62443-3-2  │  │ {Draft}  IEC 62443-3-3         │   │
│  │                                │  │                                │   │
│  │ Target SL: 2    Current: 1    │  │ Target SL: 3    Current: —     │   │
│  │ ██████████████░░░░  78%       │  │ ░░░░░░░░░░░░░░░░░░  0%        │   │
│  │                                │  │                                │   │
│  │ Lead: Sarah Chen              │  │ Lead: Marcus Weber             │   │
│  │ Started: Jul 15, 2026         │  │ Created: Jul 28, 2026          │   │
│  │                                │  │                                │   │
│  │ Findings: 12  Risks: 5        │  │ Findings: 0   Risks: 0         │   │
│  │                                │  │                                │   │
│  │ [Open →]         [⋯ Actions]  │  │ [Open →]         [⋯ Actions]  │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ 📋 Unit 200 DCS Component     │  │ 📋 CSMS Maturity Assessment    │   │
│  │                                │  │                                │   │
│  │ {Completed}  IEC 62443-4-2    │  │ {Review}  IEC 62443-2-1        │   │
│  │                                │  │                                │   │
│  │ Target SL: 2    Current: 2 ✓  │  │ Maturity: 68%                  │   │
│  │ ████████████████████  100%    │  │ █████████████████░░  85%      │   │
│  │                                │  │                                │   │
│  │ Lead: Sarah Chen              │  │ Lead: Sarah Chen               │   │
│  │ Completed: Jun 30, 2026       │  │ Started: Jul 20, 2026          │   │
│  │                                │  │                                │   │
│  │ Findings: 3   Risks: 2        │  │ Elements: 42  Policies: 8      │   │
│  │                                │  │                                │   │
│  │ [Open →]         [⋯ Actions]  │  │ [Open →]         [⋯ Actions]  │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
│                                                                            │
│  ┌─ Pagination ──────────────────────────────────────────────────────────┐ │
│  │  Showing 1–6 of 14 assessments           [← Prev] [1] [2] [3] [Next →]│ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card Actions Menu (⋯):**
- Open
- Duplicate
- Export (PDF/Excel)
- Archive
- Delete (admin only)

---

## 3. IEC 62443 Requirement Library

**Route:** `/app/requirements`
**Access:** All roles (read-only reference data)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  IEC 62443 Requirement Library                          [🔍 Search reqs...] │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Part Selector (horizontal tabs) ─────────────────────────────────────────┐
│  [2-1 CSMS] [3-1 Concepts] [3-2 Risk] [3-3 System] [4-1 Product] [4-2]   │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Two-Panel Layout (10 cols + 2 cols info) ────────────────────────────────┐
│                                                                            │
│  ┌─ Requirement Tree (left, 8 cols) ─────────────────────────────────────┐│
│  │                                                                       ││
│  │  ▸ FR1: Identification and Authentication Control (IAC)     12 reqs  ││
│  │  ▸ FR2: Use Control (UC)                                   8 reqs   ││
│  │  ▸ FR3: System Integrity (SI)                              10 reqs   ││
│  │    ├─ SR 3.1  — Restrict access to authorized users        SL 1-4   ││
│  │    ├─ SR 3.2  — Manage accounts and passwords               SL 1-4   ││
│  │    ├─ SR 3.3  — Enforce access control                      SL 2-4   ││
│  │    ├─ SR 3.4  — Ensure data integrity                       SL 1-4   ││
│  │    │   ├─ SR 3.4.1 — Detect unauthorized changes            SL 1     ││
│  │    │   ├─ SR 3.4.2 — Verify integrity of loaded data        SL 2     ││
│  │    │   └─ SR 3.4.3 — Validate integrity before execution    SL 3     ││
│  │    ├─ SR 3.5  — Protect information at rest                 SL 2-4   ││
│  │    └─ ...                                                            ││
│  │  ▸ FR4: Data Confidentiality (DC)                          6 reqs   ││
│  │  ▸ FR5: Restricted Data Flow (RDF)                         10 reqs  ││
│  │  ▸ FR6: Timely Response to Events (TRE)                    4 reqs   ││
│  │  ▸ FR7: Resource Availability (RA)                         6 reqs   ││
│  │                                                                       ││
│  └───────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│  ┌─ Requirement Detail (right, 4 cols) ──────────────────────────────────┐│
│  │                                                                       ││
│  │  SR 3.4.2                                                            ││
│  │  Verify integrity of loaded data                                     ││
│  │                                                                       ││
│  │  Security Level: SL 2                                                ││
│  │  ┌─ SL Indicator ──────────────────────────────────┐                 ││
│  │  │  ○ SL0  ● SL1  ● SL2  ○ SL3  ○ SL4             │                 ││
│  │  └─────────────────────────────────────────────────┘                 ││
│  │                                                                       ││
│  │  Requirement Text:                                                   ││
│  │  "The control system shall provide the capability to                 ││
│  │   verify the integrity of data and software loaded                  ││
│  │   into the IACS components prior to execution."                     ││
│  │                                                                       ││
│  │  Enhancement Levels:                                                 ││
│  │  SL 2: Verify using checksums or hash validation                    ││
│  │  SL 3: Verify using digital signatures                              ││
│  │  SL 4: Verify using cryptographic attestation                       ││
│  │                                                                       ││
│  │  ────────────────────────────────────────                            ││
│  │                                                                       ││
│  │  Usage in Assessments:                                               ││
│  │  • Plant Alpha Gap Assessment → Score: 1 (gap: 1)                  ││
│  │  • Plant Beta System Assess. → Not yet assessed                     ││
│  │                                                                       ││
│  │  [View in Assessment →]                                              ││
│  └───────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Assessment Wizard

**Route:** `/app/assessments/:id/questions`
**Access:** Assessor+, Lead Assessor+ (write), Quality Mgr (review only)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  ← Plant Alpha Gap Assessment                                              │
│  Assessment Questions           [Save Draft] [Mark Complete ↗]             │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Progress Strip ───────────────────────────────────────────────────────────┐
│  ████████████████░░░░░░░░░░░░░░░░░░░░  18/48 answered (37.5%)             │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Three-Column Layout ──────────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Section Nav ─┐  ┌─ Question Area ──────────────────┐  ┌─ Quick Ref ──┐│
│  │  (3 cols)     │  │  (6 cols)                        │  │  (3 cols)    ││
│  │               │  │                                  │  │              ││
│  │ FR1: IAC      │  │  ┌─ Question Card ─────────────┐ │  │ IEC 62443-3-2││
│  │  ✓ 6/6        │  │  │                             │ │  │ § 4.2.3.1     ││
│  │               │  │  │  SR 3.4.2                   │ │  │              ││
│  │ FR2: UC       │  │  │                             │ │  │ Requirement: ││
│  │  ✓ 8/8        │  │  │  Are integrity checks       │ │  │ "The control ││
│  │               │  │  │  performed on configuration  │ │  │  system shall││
│  │ FR3: SI       │  │  │  data loaded into the IACS?  │ │  │  provide..." ││
│  │  ▶ 4/8        │  │  │                             │ │  │              ││
│  │    SR 3.1  ✓  │  │  │  ┌─ Guidance Box ─────────┐ │ │  │ Enhancement  ││
│  │    SR 3.2  ✓  │  │  │  │ 💡 Includes checksums,  │ │ │  │ Levels:      ││
│  │    SR 3.3  ✓  │  │  │  │ digital signatures, or   │ │ │  │              ││
│  │    SR 3.4  ▶  │  │  │  │ hash verification of     │ │ │  │ SL1: Basic   ││
│  │    SR 3.5  ○  │  │  │  │ config data loaded into   │ │ │  │ SL2: Checksum││
│  │    ...        │  │  │  │ IACS components.          │ │ │  │ SL3: Digital ││
│  │               │  │  │  └──────────────────────────┘ │ │  │      sign.   ││
│  │ FR4: DC       │  │  │                             │ │  │ SL4: Crypto    ││
│  │  ○ 0/6        │  │  │  Maturity:                  │ │  │      attest.   ││
│  │               │  │  │  ○ Implemented              │ │  │              ││
│  │ FR5: RDF      │  │  │  ● Partially Implemented    │ │  │ ──────────── ││
│  │  ○ 0/10       │  │  │  ○ Not Implemented          │ │  │              ││
│  │               │  │  │  ○ N/A                      │ │  │ Assessment   ││
│  │ FR6: TRE      │  │  │                             │ │  │ History:     ││
│  │  ○ 0/4        │  │  │  Score:  [1 ▾]  / 4        │ │  │              ││
│  │               │  │  │                             │ │  │ 2025 Q4:     ││
│  │ FR7: RA       │  │  │  Notes:                     │ │  │ Score: 0     ││
│  │  ○ 0/6        │  │  │  ┌────────────────────────┐ │ │  │ "No process  ││
│  │               │  │  │  │ PLC config backups      │ │ │  │  exists"     ││
│  └───────────────┘  │  │  │ exist but no integrity  │ │  │              ││
│                     │  │  │ verification procedure   │ │  │ 2026 Q2:     ││
│                     │  │  │ documented               │ │  │ Score: 1     ││
│                     │  │  └────────────────────────┘ │  │ "Backups but   ││
│                     │  │                             │  │  no verify"    ││
│                     │  │  Evidence:  [+ Attach]      │ │  │              ││
│                     │  │  📎 hmi_config.png    [×]   │ │  └──────────────┘│
│                     │  │                             │ │                   │
│                     │  │  [+ Create Finding]          │ │                   │
│                     │  │                             │ │                   │
│                     │  │  [← Prev SR 3.3]            │ │                   │
│                     │  │       [Save & Next SR 3.5 →]│ │                   │
│                     │  └─────────────────────────────┘ │                   │
│                     └──────────────────────────────────┘                   │
└────────────────────────────────────────────────────────────────────────────┘

Keyboard Shortcuts:
  ←  Previous question
  →  Next question
  ⌘S Save current response
  ⌘K Search questions
```

---

## 5. Asset Inventory

**Route:** `/app/assets`
**Access:** All roles (read-only for Assessor, Quality Mgr)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Asset Inventory                        [Import ▾] [Export] [+ Add Asset]  │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Stats Row ────────────────────────────────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  47     │ │  12     │ │  8       │ │  15      │ │  12      │          │
│  │ Total   │ │ PLCs    │ │ HMIs     │ │ Switches │ │ Servers  │          │
│  │ Assets  │ │         │ │          │ │          │ │          │          │
│  └─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘          │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Filters ──────────────────────────────────────────────────────────────────┐
│  [🔍 Search assets...]  [Type ▾] [Criticality ▾] [Purdue ▾] [Zone ▾]     │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Asset Table ──────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ☐ │ Name              │ Type    │ Vendor    │ Criticality │ Purdue │Z │ │
│  │───┼───────────────────┼─────────┼───────────┼─────────────┼────────┼──│ │
│  │ ☐ │ DCS-CTRL-001      │ {PLC}   │ Siemens   │ {🔴Safety}  │ L1     │Z1│ │
│  │   │ S7-1500           │         │           │ Critical    │        │  │ │
│  │   │ 10.10.1.10        │         │           │             │        │  │ │
│  │───┼───────────────────┼─────────┼───────────┼─────────────┼────────┼──│ │
│  │ ☐ │ HMI-OPS-003       │ {HMI}   │ Rockwell  │ {🟠Biz}     │ L2     │Z2│ │
│  │   │ PanelView Plus 7  │         │           │ Critical    │        │  │ │
│  │   │ 10.10.2.15        │         │           │             │        │  │ │
│  │───┼───────────────────┼─────────┼───────────┼─────────────┼────────┼──│ │
│  │ ☐ │ SW-CORE-001       │ {Switch}│ Cisco     │ {🟡Oper.}   │ L3     │Z3│ │
│  │   │ IE-4000           │         │           │             │        │  │ │
│  │   │ 10.10.3.1         │         │           │             │        │  │ │
│  │───┼───────────────────┼─────────┼───────────┼─────────────┼────────┼──│ │
│  │ ☐ │ SRV-HIST-001      │ {Server}│ OSIsoft   │ {🟠Biz}     │ L3     │Z3│ │
│  │   │ PI Server 2024    │         │           │ Critical    │        │  │ │
│  │   │ 10.10.3.50        │         │           │             │        │  │ │
│  └───┴───────────────────┴─────────┴───────────┴─────────────┴────────┴──┘ │
│                                                                            │
│  ┌─ Bulk Actions Bar (shown when items selected) ────────────────────────┐ │
│  │  2 selected    [Assign to Zone ▾]  [Set Purdue Level ▾]  [Delete]   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  Showing 1–25 of 47 assets       [← Prev] [1] [2] [Next →]               │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Purdue Model Visualization

**Route:** `/app/purdue/:id`
**Access:** All roles

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  ← Purdue Model: Plant Alpha                              [Edit] [Export]  │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Purdue Diagram (Full Width, scrollable) ──────────────────────────────────┐
│                                                                            │
│  ┌─ Level 5: Enterprise Network ─────────────────────────────────────────┐ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐                                        │ │
│  │  │ ERP  │  │Email │  │ AD   │  3 assets                             │ │
│  │  │Server│  │Server│  │Domain│                                        │ │
│  │  └──────┘  └──────┘  └──────┘                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 4: Business Planning ──────────────────────────────────────────┐ │
│  │  ┌──────┐  ┌──────┐                                                   │ │
│  │  │ MES  │  │ SAP  │  2 assets                                        │ │
│  │  │Client│  │ PI   │                                                   │ │
│  │  └──────┘  └──────┘                                                   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 3.5: Industrial DMZ ──────── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐                                       │ │
│  │  │ Jump │  │ PI   │  │ WSUS │  4 assets  (dashed border = DMZ)      │ │
│  │  │ Host │  │Proxy │  │Proxy │                                       │ │
│  │  └──────┘  └──────┘  └──────┘                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 3: Manufacturing Operations ───────────────────────────────────┐ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐                                        │ │
│  │  │SCADA │  │Hist- │  │ Eng  │  5 assets                             │ │
│  │  │Server│  │orian │  │  WS  │                                        │ │
│  │  └──────┘  └──────┘  └──────┘                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 2: Area Supervisory Control ───────────────────────────────────┐ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                             │ │
│  │  │ HMI  │  │ HMI  │  │ HMI  │  │ Eng  │  8 assets                  │ │
│  │  │ Ops1 │  │ Ops2 │  │ Ops3 │  │  WS  │                             │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 1: Basic Control ──────────────────────────────────────────────┐ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │ │
│  │  │ PLC  │ │ PLC  │ │ PLC  │ │ RTU  │ │ DCS  │ │ VFD  │  15 assets │ │
│  │  │  01  │ │  02  │ │  03  │ │  01  │ │ Ctrl │ │  01  │             │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                            │                                               │
│  ┌─ Level 0: Physical Process ───────────────────────────────────────────┐ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │ │
│  │  │Sensor│ │Sensor│ │Actua-│ │Motor │ │Valve │  10 assets           │ │
│  │  │  T1  │ │  P1  │ │ tor  │ │  M1  │ │  V1  │                      │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                      │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Legend ──────────────────────────────────────────────────────────────┐ │
│  │  Asset type icons:  ▪ Server  ▪ Workstation  ▪ PLC  ▪ HMI  ▪ Other  │ │
│  │  Colors by Purdue level (see design-system.md §2.4)                  │ │
│  │  ──── Allowed comm.  - - - Via DMZ only  ════ Violation (red)       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Compliance Summary ───────────────────────────────────────────────────────┐
│  Communication Rules: 24 defined  │  Violations: 2  │  Compliant: 91.7%  │
│                                                                            │
│  ⚠ Violation: Direct Level 2 → Level 5 communication detected (no DMZ)   │
│  ⚠ Violation: Level 1 → Level 3 unencrypted Modbus/TCP traffic          │
│                                                                            │
│  [View All Rules]  [Generate Compliance Report]                          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Zone & Conduit Designer

**Route:** `/app/zones/designer`
**Access:** Lead Assessor+, Project Manager, Admin

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Zone & Conduit Designer                      [+ Zone] [+ Conduit] [Save] │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Canvas + Properties Panel ────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Canvas (8 cols, drag-and-drop) ──────────┐  ┌─ Properties (4 cols) ─┐│
│  │                                            │  │                       ││
│  │  ┌─ Zone: Enterprise IT ─────── SL3 ────┐ │  │ Zone Properties       ││
│  │  │                                       │ │  │                       ││
│  │  │  [ERP]  [Email]  [AD]                 │ │  │ Name:                 ││
│  │  │                                       │ │  │ [Process Control Z.]  ││
│  │  └───────────────────────────────────────┘ │  │                       ││
│  │        │ conduit: HTTPS/VPN                │  │ Type:                 ││
│  │  ┌─ Zone: Industrial DMZ ──── SL2 ────┐ │  │ [Process Control ▾]   ││
│  │  │                                     │ │  │                       ││
│  │  │  [Jump Host]  [PI Proxy]  [WSUS]    │ │  │ Security Level:       ││
│  │  │                                     │ │  │ [2 ▾]  (SL 0–4)      ││
│  │  └─────────────────────────────────────┘ │  │                       ││
│  │        │ conduit: OPC UA/TLS             │  │ Purdue Level:         ││
│  │  ┌─ Zone: Process Control ─── SL2 ────┐ │  │ [1 ▾]  (0–5)         ││
│  │  │                                     │ │  │                       ││
│  │  │  ┌─ Sub-Zone: Safety ─ SL3 ──┐     │ │  │ Color:                ││
│  │  │  │  [Safety PLC] [SIS]       │     │ │  │ [🟠]  #D97706        ││
│  │  │  └────────────────────────────┘     │ │  │                       ││
│  │  │  [DCS Controller]  [PLC-001]        │ │  │ ───────────────────── ││
│  │  │  [PLC-002]  [PLC-003]               │ │  │                       ││
│  │  │                                     │ │  │ Members (15 assets):  ││
│  │  └─────────────────────────────────────┘ │  │ • DCS-CTRL-001       ││
│  │                                           │  │ • PLC-001            ││
│  │  ┌─ Zone: Remote Access ──── SL1 ────┐ │  │ • PLC-002            ││
│  │  │                                     │ │  │ • PLC-003            ││
│  │  │  [VPN Gateway]  [MFA Proxy]         │ │  │ [+ Add Assets]       ││
│  │  │                                     │ │  │                       ││
│  │  └─────────────────────────────────────┘ │  │ ───────────────────── ││
│  │                                           │  │                       ││
│  │  Canvas controls:                         │  │ Segmentation Rules:   ││
│  │  [+] Zoom in  [-] Zoom out               │  │ ✓ Firewall (inbound)  ││
│  │  [⊡] Fit to screen  [↶] Undo [↷] Redo  │  │ ✓ ACL (bidirectional) ││
│  │  Grid: [●] Snap to grid                  │  │ ○ IDS monitoring      ││
│  │                                           │  │ [+ Add Rule]          ││
│  └────────────────────────────────────────────┘  └───────────────────────┘│
│                                                                            │
│  ┌─ Conduit List (bottom panel, collapsible) ────────────────────────────┐ │
│  │  Conduit                │ Source Zone        │ Target Zone       │Type │ │
│  │  ───────────────────────┼────────────────────┼───────────────────┼──── │ │
│  │  Enterprise ↔ DMZ       │ Enterprise IT      │ Industrial DMZ    │Net  │ │
│  │  HTTPS/TLS · Encrypted  │                    │                   │     │ │
│  │  ───────────────────────┼────────────────────┼───────────────────┼──── │ │
│  │  DMZ ↔ Process Control  │ Industrial DMZ     │ Process Control   │Net  │ │
│  │  OPC UA/TLS · Encrypted │                    │                   │     │ │
│  │  ───────────────────────┼────────────────────┼───────────────────┼──── │ │
│  │  Remote → Process       │ Remote Access      │ Process Control   │Net  │ │
│  │  VPN+MFA · Encrypted    │                    │                   │     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Risk Register

**Route:** `/app/risks`
**Access:** All roles (write: Risk Manager, Project Manager, Admin)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Risk Register                        [Matrix View] [Table View] [+ Risk]  │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Tabs ─────────────────────────────────────────────────────────────────────┐
│  [All Risks (9)]  [Critical (2)]  [High (4)]  [Pending Acceptance (3)]    │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Matrix View (default) ────────────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Risk Heat Map ───────────────────────────┐  ┌─ Risk Summary ─────────┐│
│  │                                            │  │                        ││
│  │         │ 1-Neglig │ 2-Minor│ 3-Mod  │ 4-Maj │ 5-Cat  │              ││
│  │  ───────┼─────────┼────────┼────────┼──────┼───────┤  Total: 9      ││
│  │  5-Almost│         │        │        │ ①   │  ②   │  Critical: 2    ││
│  │  Certain │         │        │        │      │      │  High: 4        ││
│  │  ───────┼─────────┼────────┼────────┼──────┼───────┤  Medium: 2      ││
│  │  4-Likel│         │        │  ①    │      │      │  Low: 1         ││
│  │  y      │         │        │       │      │      │                  ││
│  │  ───────┼─────────┼────────┼────────┼──────┼───────┤  ──────────── ││
│  │  3-Possi│         │  ③   │  ②    │      │      │  Treated: 5      ││
│  │  ble    │         │       │       │      │      │  Accepted: 2     ││
│  │  ───────┼─────────┼────────┼────────┼──────┼───────┤  Pending: 2      ││
│  │  2-Unlik│  ②    │  ①   │       │      │      │                  ││
│  │  ely    │        │       │       │      │      │  Treatments:     ││
│  │  ───────┼─────────┼────────┼────────┼──────┼───────┤  In Progress: 3  ││
│  │  1-Rare │  ⑤    │        │       │      │      │  Planned: 2      ││
│  │         │        │       │       │      │      │  Completed: 2    ││
│  │         │        │       │       │      │      │                  ││
│  └────────────────────────────────────────────┘  └────────────────────────┘│
│                                                                            │
│  Click a numbered cell → shows risk list below:                           │
│                                                                            │
│  ┌─ Risks in Cell (Likelihood 5 × Impact 5 = Score 25, Critical) ────────┐│
│  │                                                                       ││
│  │  ① RISK-0023  SCADA system compromise via phishing                    ││
│  │     Category: Safety  │  Treatment: Mitigate (In Progress)            ││
│  │     Owner: Marcus Weber  │  Reassess: Aug 15, 2026                    ││
│  │                                                                       ││
│  │  ② RISK-0017  Unauthorized PLC programming changes                    ││
│  │     Category: Operational  │  Treatment: Mitigate (Planned)           ││
│  │     Owner: Yuki Tanaka  │  Reassess: Sep 01, 2026                     ││
│  │                                                                       ││
│  └───────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Finding Management

**Route:** `/app/findings`
**Access:** All roles (write: Assessor+, Lead Assessor+, Project Manager, Admin)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Findings                          [Import] [Export] [+ New Finding]       │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Filter Bar ───────────────────────────────────────────────────────────────┐
│  [🔍 Search findings...]  [Severity ▾] [Status ▾] [Assessment ▾]          │
│  [Zone ▾]  [Assigned to ▾]  [Date range ▾]  [Clear all]                   │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Severity Summary Strip ───────────────────────────────────────────────────┐
│  🔴 Critical: 3    🟠 High: 5    🟡 Medium: 4    🔵 Low: 2    ⚪ Info: 1 │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Findings Table ───────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ ID       │ Title                    │ Sev     │ Status      │ Assets │ │
│  │──────────┼──────────────────────────┼─────────┼─────────────┼────────│ │
│  │ F-2024-  │ Unauthenticated Modbus    │{🔴Crit} │{Acknowledged}│ 2     │ │
│  │ 0042     │ access to safety PLC      │         │             │        │ │
│  │          │ Plant Alpha · Marcus W.   │         │ Due: Aug 15 │        │ │
│  │──────────┼──────────────────────────┼─────────┼─────────────┼────────│ │
│  │ F-2024-  │ Missing network segment-  │{🟠High} │{In Progress} │ 3     │ │
│  │ 0041     │ ation between L2 and L3   │         │             │        │ │
│  │          │ Plant Beta · Yuki T.      │         │ Due: Aug 30 │        │ │
│  │──────────┼──────────────────────────┼─────────┼─────────────┼────────│ │
│  │ F-2024-  │ Outdated firmware on 3    │{🟠High} │{Remediation} │ 3     │ │
│  │ 0040     │ PLCs in Unit 200          │         │  Planned    │        │ │
│  │          │ Plant Alpha · Sarah C.    │         │ Due: Sep 15 │        │ │
│  │──────────┼──────────────────────────┼─────────┼─────────────┼────────│ │
│  │ F-2024-  │ No password policy for    │{🟡Med}  │{Open}        │ 1     │ │
│  │ 0039     │ HMI operator accounts     │         │             │        │ │
│  │          │ Plant Alpha · Unassigned  │         │             │        │ │
│  │──────────┼──────────────────────────┼─────────┼─────────────┼────────│ │
│  │ F-2024-  │ USB ports not physically  │{🟡Med}  │{Open}        │ 5     │ │
│  │ 0038     │ disabled on engineering   │         │             │        │ │
│  │          │ workstations              │         │             │        │ │
│  └──────────┴──────────────────────────┴─────────┴─────────────┴────────┘ │
│                                                                            │
│  Showing 1–15 of 15 findings     [← Prev] [1] [Next →]                   │
└────────────────────────────────────────────────────────────────────────────┘

Row click → Context Panel:
┌─ Finding Context Panel (420px, slide-in from right) ──────────────────────┐
│                                                                            │
│  F-2024-0042                                            [Full View →]     │
│  Unauthenticated Modbus access to safety PLC                              │
│                                                                            │
│  {🔴 Critical}  {Acknowledged}                                            │
│                                                                            │
│  ────────────────────────────────────────                                  │
│                                                                            │
│  Description:                                                             │
│  The safety PLC (DCS-CTRL-001) accepts Modbus/TCP connections             │
│  from any host on the process control network without                     │
│  authentication. An attacker on the network could read/write              │
│  safety-critical registers.                                               │
│                                                                            │
│  IEC 62443 Reference: SR 7.4 — Zone boundary protection                  │
│                                                                            │
│  ────────────────────────────────────────                                  │
│                                                                            │
│  Affected Assets:                                                         │
│  • DCS-CTRL-001 (Siemens S7-1500)       ↗                                │
│  • SW-CORE-001 (Cisco IE-4000)           ↗                                │
│                                                                            │
│  Evidence (3):                                                            │
│  📎 modbus_wireshark_capture.pcap         [↓]                            │
│  📎 plc_config_export.xml                 [↓]                            │
│  📎 network_scan_results.pdf              [↓]                            │
│                                                                            │
│  ────────────────────────────────────────                                  │
│                                                                            │
│  Remediation:                                                             │
│  Plan: Q3 2026 Safety PLC Hardening                                       │
│  Action: Implement Modbus/TCP authentication   Status: In Progress        │
│  Jira: PROJ-1847                           ↗                              │
│                                                                            │
│  ────────────────────────────────────────                                  │
│                                                                            │
│  History:                                                                 │
│  Jul 28 — Created by Marcus Weber                                        │
│  Jul 29 — Severity set to Critical                                       │
│  Jul 30 — Acknowledged by Yuki Tanaka                                    │
│  Jul 31 — Linked to remediation plan                                     │
│                                                                            │
│  [Transition Status ▾]  [+ Comment]  [+ Evidence]                        │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Evidence Repository

**Route:** `/app/evidence`
**Access:** All roles (upload: Assessor+; download: Assessor+; Viewer: metadata only)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Evidence Repository                            [Upload Evidence]          │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Filter Bar ───────────────────────────────────────────────────────────────┐
│  [🔍 Search evidence...]  [Type ▾]  [Tags ▾]  [Linked to ▾]  [Date ▾]    │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Evidence Grid (card layout, toggle to table) ─────────────────────────────┐
│                                                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────┐│
│  │  📄            │  │  🖼             │  │  ⚙             │  │  📊      ││
│  │  (thumbnail)   │  │  (thumbnail)   │  │  (thumbnail)   │  │(thumb)   ││
│  │                │  │                │  │                │  │          ││
│  │ fw_rules.pdf   │  │ hmi_screen.png │  │ plc_config.xml │  │scan.csv ││
│  │                │  │                │  │                │  │          ││
│  │ {Document}     │  │ {Screenshot}   │  │ {Config}       │  │{Scan}   ││
│  │                │  │                │  │                │  │          ││
│  │ 2.4 MB         │  │ 847 KB         │  │ 156 KB         │  │ 12.1 MB ││
│  │ Jul 28, 2026   │  │ Jul 28, 2026   │  │ Jul 27, 2026   │  │Jul 25   ││
│  │                │  │                │  │                │  │          ││
│  │ SHA-256: ✓     │  │ SHA-256: ✓     │  │ SHA-256: ✓     │  │ ✓       ││
│  │ a1b2c3d4...    │  │ e5f6g7h8...    │  │ i9j0k1l2...    │  │ m3n4...  ││
│  │                │  │                │  │                │  │          ││
│  │ Linked to:     │  │ Linked to:     │  │ Linked to:     │  │ Linked:  ││
│  │ F-0042, F-0041 │  │ F-0042         │  │ F-0040         │  │ 3 find.  ││
│  │                │  │                │  │                │  │          ││
│  │ Tags:          │  │ Tags:          │  │ Tags:          │  │ Tags:    ││
│  │ {firewall}     │  │ {hmi} {config} │  │ {plc} {backup} │  │ {scan}   ││
│  │ {network}      │  │                │  │                │  │ {vuln}   ││
│  │                │  │                │  │                │  │          ││
│  │ [↓ Download]   │  │ [↓ Download]   │  │ [↓ Download]   │  │[↓ Down] ││
│  │ [⋯]           │  │ [⋯]           │  │ [⋯]           │  │ [⋯]     ││
│  └────────────────┘  └────────────────┘  └────────────────┘  └──────────┘│
│                                                                            │
│  Showing 1–24 of 86 evidence items    [← Prev] [1] [2] [3] [4] [Next →]  │
│  Storage used: 2.4 GB / 10 GB  ━━━━━━━━━━━━━━━━░░░░  24%                 │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Remediation Tracker

**Route:** `/app/remediation`
**Access:** All roles (write: Project Manager, Admin)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Remediation Tracker                                  [+ New Plan]        │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Plan Cards ───────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ 📋 Q3 2026 Safety PLC Hardening                    {In Progress}       ││
│  │                                                                        ││
│  │ Owner: Yuki Tanaka    │  Budget: $45,000 / $60,000  (75%)             ││
│  │ Start: Jul 15, 2026   │  Target: Sep 30, 2026                         ││
│  │                                                                        ││
│  │ Actions:                                                               ││
│  │ ✓ Implement Modbus authentication (PLC-001, PLC-002)    PROJ-1847    ││
│  │ ◐ Deploy network segmentation (firewall rules)          PROJ-1848    ││
│  │ ○ Update PLC firmware to v4.2.1                         PROJ-1849    ││
│  │ ○ Verify and validate security controls                 PROJ-1850    ││
│  │                                                                        ││
│  │ Progress: ██████████░░░░░░░░░░  50%  (2/4 actions completed)          ││
│  │                                                                        ││
│  │ Linked Findings: F-0042, F-0040, F-0038                               ││
│  │ Linked Risks: RISK-0023, RISK-0017                                    ││
│  │                                                                        ││
│  │ [Open Plan →]    [⋯ Actions]                                          ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ 📋 Plant Beta Network Segmentation                  {Draft}            ││
│  │                                                                        ││
│  │ Owner: Marcus Weber   │  Budget: — / $120,000                         ││
│  │ Start: Aug 01, 2026   │  Target: Dec 31, 2026                         ││
│  │                                                                        ││
│  │ Actions:                                                               ││
│  │ ○ Design zone architecture                             —             ││
│  │ ○ Procure industrial firewall hardware                 —             ││
│  │ ○ Implement VLAN segmentation                           —             ││
│  │ ○ Configure firewall rules between zones                —             ││
│  │ ○ Test and validate segmentation                        —             ││
│  │                                                                        ││
│  │ Progress: ░░░░░░░░░░░░░░░░░░░░  0%  (0/5 actions completed)          ││
│  │                                                                        ││
│  │ [Open Plan →]    [⋯ Actions]                                          ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Report Generator

**Route:** `/app/reports`
**Access:** All roles (generate: Lead Assessor+, Project Manager, Quality Mgr, Admin)

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Reports                                            [+ Generate Report]   │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Generate Report Dialog (Modal) ───────────────────────────────────────────┐
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Generate Report                                                    │  │
│  │                                                                     │  │
│  │  Report Template:                                                   │  │
│  │  [Assessment Summary Report          ▾]                            │  │
│  │                                                                     │  │
│  │  Available Templates:                                               │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │ 📄 Assessment Summary Report                                │   │  │
│  │  │ 📄 Risk Register Report                                     │   │  │
│  │  │ 📄 CSMS Gap Analysis Report                                 │   │  │
│  │  │ 📄 Zone & Conduit Topology Report                           │   │  │
│  │  │ 📄 Purdue Model Compliance Report                           │   │  │
│  │  │ 📄 Remediation Status Report                                │   │  │
│  │  │ 📄 Executive Security Summary                               │   │  │
│  │  │ 📄 Audit Trail Report                                       │   │  │
│  │  │ 📄 Certification Evidence Package                           │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  │  Scope:                                                             │  │
│  │  Assessment: [Plant Alpha Gap Assessment        ▾]                  │  │
│  │  Facility:   [Plant Alpha — All Units           ▾]                  │  │
│  │  Date range: [Jan 1, 2026] to [Jul 31, 2026]                       │  │
│  │                                                                     │  │
│  │  Include sections:                                                  │  │
│  │  ✓ Executive Summary     ✓ Scorecard & Gaps                        │  │
│  │  ✓ Findings Summary      ✓ Risk Summary                            │  │
│  │  ✓ Remediation Status    ✓ Evidence Index                          │  │
│  │  ○ Detailed Findings     ○ Full Audit Trail                        │  │
│  │                                                                     │  │
│  │  Format:  ◉ PDF  ○ Excel  ○ Both                                  │  │
│  │                                                                     │  │
│  │  [Cancel]                                    [Generate Report]      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Generated Reports List ───────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Report Name                  │ Type             │ Date     │ Status  │ │
│  │──────────────────────────────┼──────────────────┼──────────┼─────────│ │
│  │ Plant Alpha Assessment       │ Assessment       │ Jul 31   │ ✓ Ready │ │
│  │ Summary — Q2 2026            │ Summary          │          │  [↓]   │ │
│  │──────────────────────────────┼──────────────────┼──────────┼─────────│ │
│  │ Risk Register — All          │ Risk Register    │ Jul 30   │ ✓ Ready │ │
│  │ Facilities                   │                  │          │  [↓]   │ │
│  │──────────────────────────────┼──────────────────┼──────────┼─────────│ │
│  │ CSMS Gap Analysis            │ CSMS Gap         │ Jul 28   │ ⏳ Gen. │ │
│  │                              │ Analysis         │          │  60%   │ │
│  │──────────────────────────────┼──────────────────┼──────────┼─────────│ │
│  │ Executive Security Summary   │ Executive        │ Jul 25   │ ✓ Ready │ │
│  │ — Q2 2026                    │ Summary          │          │  [↓]   │ │
│  └──────────────────────────────┴──────────────────┴──────────┴─────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Administration

**Route:** `/app/admin/*`
**Access:** Tenant Admin, Tenant Owner

```
┌─ Page Header ──────────────────────────────────────────────────────────────┐
│  Administration                                                             │
└────────────────────────────────────────────────────────────────────────────┘

┌─ Admin Sub-Navigation (vertical tabs, left) ───────────────────────────────┐
│                                                                            │
│  ┌─ Admin Nav ─┐  ┌─ Content Area (Team Members tab active) ────────────┐ │
│  │             │  │                                                      │ │
│  │ ▶ Members   │  │  Team Members                        [+ Invite]      │ │
│  │   Roles     │  │                                                      │ │
│  │   Integrat. │  │  ┌────────────────────────────────────────────────┐  │ │
│  │   API Keys  │  │  │ Name             │ Email              │ Role    │  │ │
│  │   Audit Log │  │  │──────────────────┼────────────────────┼─────────│  │ │
│  │   Webhooks  │  │  │ 👤 Sarah Chen    │ s.chen@consult.com │ Lead    │  │ │
│  │   Settings  │  │  │                  │                    │Assessor │  │ │
│  │             │  │  │──────────────────┼────────────────────┼─────────│  │ │
│  │             │  │  │ 👤 Marcus Weber  │ m.weber@consult.c  │Assessor │  │ │
│  │             │  │  │──────────────────┼────────────────────┼─────────│  │ │
│  │             │  │  │ 👤 Yuki Tanaka   │ y.tanaka@alpha.c   │ Project │  │ │
│  │             │  │  │                  │                    │ Manager │  │ │
│  │             │  │  │──────────────────┼────────────────────┼─────────│  │ │
│  │             │  │  │ 👤 David Okon.   │ d.okonkwo@alpha.c  │ Tenant  │  │ │
│  │             │  │  │                  │                    │ Owner   │  │ │
│  │             │  │  │──────────────────┼────────────────────┼─────────│  │ │
│  │             │  │  │ 📧 elena@alpha.c │ Pending invitation │ Viewer  │  │ │
│  │             │  │  │    (invited)     │ Sent: Jul 29       │         │  │ │
│  │             │  │  └────────────────────────────────────────────────┘  │ │
│  │             │  │                                                      │ │
│  │             │  │  Showing 5 members (4 active, 1 pending)            │ │
│  │             │  └──────────────────────────────────────────────────────┘ │
│  └─────────────┘                                                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

Admin Tab Descriptions:
  Members     → Team member list, invite, role assignment, deactivate
  Roles       → System roles (read-only) + custom roles (CRUD)
  Integrations→ Connected services (Jira, ServiceNow, scanners)
  API Keys    → Create/revoke API keys with scoped permissions
  Audit Log   → Searchable, filterable audit event log with export
  Webhooks    → Configure outbound webhook endpoints
  Settings    → Workspace name, branding, locale, timezone, data retention
```

---

## 14. Common Patterns Across Wireframes

### 14.1 Empty States

```
┌──────────────────────────────────────────┐
│                                          │
│              ┌──────┐                    │
│              │  📋  │  ← 48px icon      │
│              └──────┘                    │
│                                          │
│         No assessments yet               │  ← text-xl font-medium
│                                          │
│    Create your first IEC 62443           │  ← text-base text-muted
│    assessment to begin evaluating         │
│    your security posture.                 │
│                                          │
│       [+ New Assessment]                 │  ← Primary CTA
│                                          │
│    or [Import from template]             │  ← Secondary action (link)
└──────────────────────────────────────────┘
```

### 14.2 Loading States

```
Table loading:
  ┌───────────────────────────────────────┐
  │ ░░░░░░░░░░░░  ░░░░░░  ░░░░░░░░░░░░  │  ← Skeleton rows
  │ ░░░░░░░░░░░░  ░░░░░░  ░░░░░░░░░░░░  │    (animate: pulse 1.5s)
  │ ░░░░░░░░░░░░  ░░░░░░  ░░░░░░░░░░░░  │
  │ ░░░░░░░░░░░░  ░░░░░░  ░░░░░░░░░░░░  │
  └───────────────────────────────────────┘

Card loading:
  ┌──────────────────┐
  │ ░░░░░░░░░░░░░░░░ │  ← Header skeleton
  │                  │
  │ ░░░░░░░░░░░░░░░░ │  ← Content skeleton
  │ ░░░░░░░░░░░░░░░░ │
  │ ░░░░░░░░░░░░     │
  └──────────────────┘

Chart loading:
  ┌──────────────────┐
  │                  │
  │    [Spinner]     │  ← Centered spinner + "Loading chart..."
  │  Loading chart.. │
  │                  │
  └──────────────────┘
```

### 14.3 Confirmation Dialogs

```
┌──────────────────────────────────────┐
│  ⚠ Delete Finding F-2024-0042?      │  ← Warning icon
│                                      │
│  This action cannot be undone. The   │  ← Body text
│  finding and all associated evidence │
│  links will be permanently removed.  │
│                                      │
│  This will be recorded in the        │  ← Audit notice
│  audit log.                          │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Type "DELETE" to confirm:      │  │  ← Destructive action
│  │ [                    ]         │  │    requires text confirm
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel]              [Delete]      │  ← Cancel = ghost button
│                                      │     Delete = danger button
└──────────────────────────────────────┘
```

---

*Next: [Component Library →](component-library.md)*
