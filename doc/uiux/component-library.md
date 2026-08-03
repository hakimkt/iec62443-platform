# IEC 62443 Platform — Component Library

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Implementation: Radix UI primitives + Tailwind CSS + React 19

---

## 1. Component Architecture

```
packages/ui/
├── primitives/          # Radix UI wrappers with design tokens
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── RadioGroup.tsx
│   ├── Switch.tsx
│   ├── Dialog.tsx
│   ├── DropdownMenu.tsx
│   ├── Popover.tsx
│   ├── Tooltip.tsx
│   ├── Tabs.tsx
│   ├── Accordion.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Separator.tsx
│   ├── ScrollArea.tsx
│   └── Skeleton.tsx
│
├── components/          # Composed domain components
│   ├── DataTable.tsx
│   ├── DataCard.tsx
│   ├── MetricCard.tsx
│   ├── StatusBadge.tsx
│   ├── SeverityBadge.tsx
│   ├── SecurityLevelBadge.tsx
│   ├── ProgressBar.tsx
│   ├── Breadcrumb.tsx
│   ├── PageHeader.tsx
│   ├── FilterBar.tsx
│   ├── SearchInput.tsx
│   ├── Pagination.tsx
│   ├── EmptyState.tsx
│   ├── ContextPanel.tsx
│   ├── NotificationToast.tsx
│   ├── FileUpload.tsx
│   ├── CommandPalette.tsx
│   └── OfflineIndicator.tsx
│
├── charts/              # Recharts wrappers
│   ├── RiskHeatMap.tsx
│   ├── RadarChart.tsx
│   ├── BarChart.tsx
│   ├── LineChart.tsx
│   ├── GaugeChart.tsx
│   ├── Sparkline.tsx
│   └── TrendArrow.tsx
│
├── diagrams/            # ReactFlow / D3 wrappers
│   ├── ZoneTopology.tsx
│   ├── PurdueModel.tsx
│   ├── ConduitLine.tsx
│   └── AssetNode.tsx
│
├── forms/               # Form-specific components
│   ├── FormField.tsx
│   ├── FormGroup.tsx
│   ├── FormWizard.tsx
│   ├── AssessmentResponseForm.tsx
│   ├── RiskScoringForm.tsx
│   └── FindingForm.tsx
│
└── layouts/             # Layout components
    ├── AppShell.tsx
    ├── Sidebar.tsx
    ├── TopBar.tsx
    ├── PageLayout.tsx
    └── DashboardGrid.tsx
```

---

## 2. Primitive Components

### 2.1 Button

```
Variants:
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Primary         [  Save Changes  ]                                  │
│                  bg-brand-600  text-white  hover:bg-brand-700        │
│                                                                      │
│  Secondary       [  Cancel  ]                                        │
│                  bg-surface-100  text-surface-700  border            │
│                                                                      │
│  Ghost           [  View Details  ]                                  │
│                  bg-transparent  text-brand-600  hover:bg-surface-50 │
│                                                                      │
│  Danger          [  Delete  ]                                        │
│                  bg-red-600  text-white  hover:bg-red-700            │
│                                                                      │
│  Danger Ghost    [  Remove  ]                                        │
│                  bg-transparent  text-red-600  hover:bg-red-50       │
│                                                                      │
│  Icon Only       [ ⋯ ]  [ × ]  [ ↓ ]                               │
│                  36×36px  rounded-md  hover:bg-surface-100           │
│                                                                      │
│  Sizes:                                                              │
│  sm:  h-8  px-3  text-sm    (table actions, inline)                 │
│  md:  h-9  px-4  text-sm    (default — most contexts)               │
│  lg:  h-10 px-5  text-base  (page headers, hero CTAs)               │
│                                                                      │
│  States:                                                             │
│  Default → Hover → Active → Focus → Disabled → Loading              │
│                                                                      │
│  Loading:                                                            │
│  [  ◌ Saving...  ]                                                   │
│  Spinner replaces text; button disabled; width preserved             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

Props:
  variant:    'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'icon'
  size:       'sm' | 'md' | 'lg'
  disabled:   boolean
  loading:    boolean
  icon:       LucideIcon (left icon)
  iconRight:  LucideIcon (right icon, e.g., dropdown arrow)
  fullWidth:  boolean
  as:         'button' | 'a' | typeof Link
```

### 2.2 Input

```
Text Input:
┌──────────────────────────────────────────────────────────────────────┐
│  Label (text-sm font-medium text-surface-700)                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 🔍  Search findings...                              [×]   │     │
│  └────────────────────────────────────────────────────────────┘     │
│  h-9  rounded-md  border-surface-200  bg-surface-0                 │
│  Focus: ring-2 ring-brand-500 ring-offset-2                        │
│                                                                      │
│  Optional: prefix icon, suffix icon, clear button                   │
│                                                                      │
│  Error State:                                                        │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  email@invalid                                    [⚠]     │     │
│  └────────────────────────────────────────────────────────────┘     │
│  border-red-500  ring-red-500                                       │
│  ⚠ Please enter a valid email address                               │
│  text-sm text-red-600  mt-1                                         │
│                                                                      │
│  Disabled:                                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Read-only value (not editable)                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  bg-surface-100  text-surface-500  cursor-not-allowed               │
└──────────────────────────────────────────────────────────────────────┘

Variants:
  text, email, password, number, search, textarea, date, datetime-local
  All share the same visual treatment; differ in input type and validation
```

### 2.3 Select / Dropdown

```
Trigger:
┌──────────────────────────────────────────────────────────────────────┐
│  [  Severity: Critical  ▾]                                          │
│  h-9  rounded-md  border  bg-surface-0                              │
│  Chevron icon on right; selected value displayed                     │
│                                                                      │
│  Dropdown Menu:                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  🔍 Filter...                                              │     │  ← Optional search
│  │  ─────────────────────────────────────────────             │     │
│  │  ◉ Critical                                                │     │  ← Selected: filled circle
│  │  ○ High                                                    │     │  ← Unselected: empty circle
│  │  ○ Medium                                                  │     │
│  │  ○ Low                                                     │     │
│  │  ○ Informational                                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│  shadow-lg  rounded-lg  border  max-h-64 overflow-y-auto            │
│  Item height: 36px  hover: bg-surface-50                            │
│  Keyboard: ↑↓ navigate, Enter select, Type to filter                │
└──────────────────────────────────────────────────────────────────────┘

Multi-Select:
┌──────────────────────────────────────────────────────────────────────┐
│  [  {Critical} {High} {Medium} +2  ▾]                               │
│  Selected items shown as removable chips                             │
│  "+2" indicates overflow count                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.4 Badge / Tag

```
Status Badges:
┌──────────────────────────────────────────────────────────────────────┐
│  Variants (h-5  px-2  text-xs  rounded-full  font-medium):          │
│                                                                      │
│  {Draft}          bg-surface-200  text-surface-600                   │
│  {In Progress}    bg-blue-100     text-blue-700                      │
│  {Review}         bg-amber-100    text-amber-700                     │
│  {Completed}      bg-green-100    text-green-700                     │
│  {Archived}       bg-surface-100  text-surface-500                   │
│  {Cancelled}      bg-red-100      text-red-700                       │
│                                                                      │
│  Dark mode: use 700-level bg with 200-level text (inverted)         │
└──────────────────────────────────────────────────────────────────────┘

Severity Badges:
┌──────────────────────────────────────────────────────────────────────┐
│  🔴 Critical    bg-red-100     text-red-700      ● dot indicator    │
│  🟠 High        bg-orange-100  text-orange-700   ● dot indicator    │
│  🟡 Medium      bg-amber-100   text-amber-700    ● dot indicator    │
│  🔵 Low         bg-blue-100    text-blue-700     ● dot indicator    │
│  ⚪ Info        bg-slate-100   text-slate-600    ● dot indicator    │
│                                                                      │
│  Dot variant:  ● Critical   (dot only, no text — for compact tables)│
│  Outline:      [Critical]    (border only — for secondary context)   │
└──────────────────────────────────────────────────────────────────────┘

Security Level Badges:
┌──────────────────────────────────────────────────────────────────────┐
│  [SL 0]  bg-slate-200   text-slate-600                              │
│  [SL 1]  bg-blue-100    text-blue-700                               │
│  [SL 2]  bg-blue-200    text-blue-800                               │
│  [SL 3]  bg-violet-100  text-violet-700                             │
│  [SL 4]  bg-red-100     text-red-700                                │
└──────────────────────────────────────────────────────────────────────┘

Purdue Level Badges:
┌──────────────────────────────────────────────────────────────────────┐
│  [L0] [L1] [L2] [L3] [L3.5] [L4] [L5]                             │
│  Each uses its Purdue level color from design-system.md §2.4        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.5 Tooltip

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Trigger element ─── hover/focus ───► Tooltip appears                │
│                                                                      │
│  ┌────────────────────────────────┐                                  │
│  │  Modbus/TCP without auth       │  ← text-sm  max-w-xs            │
│  │  Allows unauthenticated access │    bg-surface-800 text-white    │
│  │  to safety PLC registers       │    rounded-md  p-2  shadow-md   │
│  └────────────────────────────────┘                                  │
│                                                                      │
│  Position: auto (top/bottom/left/right based on viewport)            │
│  Delay: 300ms show, 0ms hide                                        │
│  Arrow: 6px triangle pointing to trigger                             │
│  Dark mode: bg-surface-100  text-surface-800  border                 │
│                                                                      │
│  Rich Tooltip (with more content):                                   │
│  ┌────────────────────────────────────┐                              │
│  │  DCS-CTRL-001                      │  ← Header: font-medium      │
│  │  Siemens S7-1500                   │                              │
│  │  ──────────────────────────────    │                              │
│  │  Zone: Process Control (SL 2)     │  ← Body: text-sm             │
│  │  Purdue: Level 1                   │                              │
│  │  IP: 10.10.1.10                   │                              │
│  │  Criticality: Safety Critical      │                              │
│  │  ──────────────────────────────    │                              │
│  │  Findings: 2 open                  │  ← Footer: text-xs muted    │
│  └────────────────────────────────────┘                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.6 Dialog / Modal

```
┌──────────────────────────────────────────────────────────────────────┐
│  Overlay: bg-black/50  backdrop-blur-sm                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  ┌─ Header ──────────────────────────────────────────┐    │     │
│  │  │  Dialog Title                          [×]        │    │     │
│  │  │  text-xl font-semibold                            │    │     │
│  │  └───────────────────────────────────────────────────┘    │     │
│  │                                                            │     │
│  │  ┌─ Body ────────────────────────────────────────────┐    │     │
│  │  │                                                    │    │     │
│  │  │  (Form content or information)                     │    │     │
│  │  │                                                    │    │     │
│  │  │  Max width: 560px (standard) / 720px (wide)       │    │     │
│  │  │  Max height: 85vh (scrollable body)                │    │     │
│  │  │                                                    │    │     │
│  │  └────────────────────────────────────────────────────┘    │     │
│  │                                                            │     │
│  │  ┌─ Footer ──────────────────────────────────────────┐    │     │
│  │  │                          [Cancel]  [Primary Action]│    │     │
│  │  │  text-right  pt-4  border-t  gap-3                │    │     │
│  │  └───────────────────────────────────────────────────┘    │     │
│  │                                                            │     │
│  │  shadow-xl  rounded-xl  bg-surface-0  border              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Sizes:                                                              │
│  sm:  max-w-sm   (confirmations, simple forms)                      │
│  md:  max-w-lg   (standard forms, detail views)                     │
│  lg:  max-w-2xl  (complex forms, multi-section)                     │
│  xl:  max-w-4xl  (full-page-like content)                           │
│                                                                      │
│  Behavior:                                                           │
│  • ESC key closes (unless form has unsaved changes)                  │
│  • Click overlay closes (same condition)                             │
│  • Focus trap inside dialog                                          │
│  • Scroll lock on body                                               │
│  • Animate: scale(0.95) → scale(1) + fade, 200ms                   │
│                                                                      │
│  Unsaved Changes Guard:                                              │
│  ┌──────────────────────────────────────────┐                       │
│  │  ⚠ Unsaved Changes                       │                       │
│  │                                          │                       │
│  │  You have unsaved changes. Discard?      │                       │
│  │                                          │                       │
│  │  [Stay]  [Discard Changes]               │                       │
│  └──────────────────────────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Composed Components

### 3.1 DataTable

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ─────────────────────────────────────────────────────┐  │
│  │  [🔍 Search...]  [Column filters ▾]  [Bulk actions ▾]  [⚙]  │  │
│  │  h-12  border-b  flex items-center gap-3                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Table ───────────────────────────────────────────────────────┐  │
│  │  ┌─ Header Row ───────────────────────────────────────────┐  │  │
│  │  │ ☐ │ Column A ↕  │ Column B ↕ │ Column C │ Column D ▾ │  │  │  │
│  │  │   │ text-xs     │            │          │            │  │  │  │
│  │  │   │ font-medium │            │          │            │  │  │  │
│  │  │   │ text-muted  │            │          │            │  │  │  │
│  │  │   │ uppercase   │            │          │            │  │  │  │
│  │  └───┴─────────────┴────────────┴──────────┴────────────┘  │  │  │
│  │                                                              │  │  │
│  │  ┌─ Data Row ────────────────────────────────────────────┐  │  │  │
│  │  │ ☐ │ Value A      │ Value B    │ {Badge}  │ Value D   │  │  │  │
│  │  │   │ text-sm      │            │          │           │  │  │  │
│  │  │   │ h-12 (row)   │            │          │           │  │  │  │
│  │  └───┴──────────────┴────────────┴──────────┴───────────┘  │  │  │
│  │  hover: bg-surface-50  cursor-pointer                       │  │  │
│  │  selected: bg-brand-50  border-l-2 border-brand-500         │  │  │
│  │                                                              │  │  │
│  │  ┌─ Alternating Row ─────────────────────────────────────┐  │  │  │
│  │  │ ☐ │ ...           │ ...        │ ...      │ ...       │  │  │  │
│  │  └───┴───────────────┴────────────┴──────────┴───────────┘  │  │  │
│  │  bg-surface-50/50 (subtle tint for alternating rows)        │  │  │
│  │                                                              │  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─ Footer ──────────────────────────────────────────────────────┐  │
│  │  2 selected  │  Showing 1–25 of 142  │  [←] [1] [2] [3] [→] │  │
│  │  h-10  border-t  text-sm  flex items-center justify-between   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Features:                                                           │
│  • Sortable columns (click header, ↕ indicator)                     │
│  • Resizable columns (drag header edge)                              │
│  • Column visibility toggle (⚙ icon → checkbox list)               │
│  • Row selection (checkbox, shift-click for range)                   │
│  • Bulk action bar appears when rows selected                        │
│  • Responsive: horizontal scroll on narrow viewports                 │
│  • Sticky header on scroll                                           │
│  • Keyboard: ↑↓ row nav, Space select, Enter open detail             │
│  • Virtual scrolling for 1000+ rows                                  │
│                                                                      │
│  Column Types:                                                       │
│  text      — Left-aligned, truncation with ellipsis                  │
│  number    — Right-aligned, tabular-nums                             │
│  badge     — StatusBadge / SeverityBadge rendering                   │
│  date      — Relative time ("2h ago") with full date on hover        │
│  avatar    — Avatar + name (for user columns)                        │
│  actions   — Icon button group or dropdown menu                      │
│  checkbox  — Selection checkbox                                      │
│  expand    — Row expansion chevron                                   │
│  progress  — Inline progress bar                                     │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 MetricCard

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────┐                                │
│  │  ┌─ Icon ─┐                     │                                │
│  │  │  🔍    │  Label               │                                │
│  │  │ 32×32  │  text-sm text-muted  │                                │
│  │  │ bg-    │                      │                                │
│  │  │ brand  │  42                  │                                │
│  │  │ -50    │  text-3xl font-bold  │                                │
│  │  └────────┘  text-surface-900    │                                │
│  │                                  │                                │
│  │  ↑ 12% from last month           │                                │
│  │  text-sm  text-green-600         │                                │
│  │                                  │                                │
│  │  ┌─ Sparkline ─────────────────┐ │                                │
│  │  │  ▁▂▃▂▃▅▇▅▃▂▃▅▇█▇▅▃        │ │  ← 30-day trend, 40px height  │
│  │  └────────────────────────────┘ │                                │
│  └──────────────────────────────────┘                                │
│                                                                      │
│  h-32  p-4  rounded-lg  border  bg-surface-0                       │
│  Clickable → navigates to detail page                                │
│  Hover: shadow-sm transition                                         │
│                                                                      │
│  Trend indicators:                                                   │
│  ↑ 12%  text-green-600   (positive improvement)                     │
│  ↓ 5%   text-red-600     (negative change)                          │
│  → 0%   text-surface-500  (no change)                               │
│                                                                      │
│  Variant — Compact (for dashboard grids):                            │
│  ┌──────────────────┐                                                │
│  │  42              │  ← text-2xl font-bold                         │
│  │  Open Findings   │  ← text-sm text-muted                         │
│  └──────────────────┘                                                │
│  h-20  p-3  (no icon, no sparkline)                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 ContextPanel (Slide-in Detail)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Main Content Area                          │◄── Panel slides in     │
│                                             │                        │
│  (Table, list, or other content)            │  ┌──────────────────┐  │
│                                             │  │ ← Back    [×]    │  │
│                                             │  │                  │  │
│                                             │  │ F-2024-0042      │  │
│                                             │  │ Unauthenticated  │  │
│                                             │  │ Modbus access... │  │
│                                             │  │                  │  │
│                                             │  │ {Critical}       │  │
│                                             │  │ {Acknowledged}   │  │
│                                             │  │ ──────────────── │  │
│                                             │  │                  │  │
│                                             │  │ (Scrollable      │  │
│                                             │  │  content area)   │  │
│                                             │  │                  │  │
│                                             │  │ ──────────────── │  │
│                                             │  │ [Transition ▾]   │  │
│                                             │  │ [+ Comment]      │  │
│                                             │  └──────────────────┘  │
│                                             │                        │
│                                             │  width: 420px          │
│                                             │  border-l              │
│                                             │  bg-surface-0          │
│                                             │  shadow-lg             │
│                                             │  animate: slide-in     │
│                                             │  from-right 200ms      │
└──────────────────────────────────────────────────────────────────────┘

Behavior:
  • Opens on row click or entity link
  • Can be closed: ESC, × button, click outside (optional)
  • [Full View →] navigates to full entity page
  • Content is scrollable independently from main area
  • On mobile: full-screen overlay instead of side panel
  • Multiple panels can stack (back navigation within panel)
```

### 3.4 FileUpload

```
┌──────────────────────────────────────────────────────────────────────┐
│  Drop Zone (idle):                                                   │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                                                            │     │
│  │              ┌──────┐                                      │     │
│  │              │  ↑   │  ← Upload icon, 40px                 │     │
│  │              └──────┘                                      │     │
│  │                                                            │     │
│  │         Drag files here or click to browse                 │     │
│  │         text-sm text-surface-500                           │     │
│  │                                                            │     │
│  │         PDF, DOCX, PNG, JPG, CSV up to 100MB              │     │
│  │         text-xs text-surface-400                           │     │
│  │                                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  border-2 border-dashed border-surface-200  rounded-lg  p-8         │
│  hover: border-brand-400  bg-brand-50/30                            │
│                                                                      │
│  Drop Zone (dragging over):                                          │
│  border-brand-500  bg-brand-50  ring-2 ring-brand-200               │
│                                                                      │
│  Upload Progress (per file):                                         │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  📄 firewall_config.pdf                                    │     │
│  │  2.4 MB  ████████████████░░░░░░░░  65%                    │     │
│  │  Uploading...                                    [×]       │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Upload Complete:                                                    │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  ✓ 📄 firewall_config.pdf                                  │     │
│  │  2.4 MB  SHA-256: a1b2c3d4...               [×]           │     │
│  └────────────────────────────────────────────────────────────┘     │
│  text-green-600  border-green-200  bg-green-50                      │
│                                                                      │
│  Upload Error:                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  ⚠ 📄 suspicious_file.exe                                  │     │
│  │  Virus detected — file rejected                             │     │
│  │  [Retry]  [Remove]                                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│  text-red-600  border-red-200  bg-red-50                            │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.5 CommandPalette (Cmd+K)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Overlay: bg-black/50  backdrop-blur-sm                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  🔍  Search or type a command...                    [ESC]  │     │
│  │  h-12  border-b  text-base                                │     │
│  │                                                            │     │
│  │  ── Suggestions ──────────────────────────────────────────│     │
│  │                                                            │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │ 📋 Plant Alpha Gap Assessment              Assessment│ │     │
│  │  │ IEC 62443-3-2 · In Progress · 78%                   │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  │  hover: bg-surface-50  selected: bg-brand-50              │     │
│  │                                                            │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │ ⚠ F-2024-0042: Unauthenticated Modbus     Finding   │ │     │
│  │  │ Critical · Acknowledged · Plant Alpha                │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  │                                                            │     │
│  │  ── Quick Actions ────────────────────────────────────────│     │
│  │                                                            │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │ +  New Finding                                       │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │ +  New Assessment                                    │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  │  ┌──────────────────────────────────────────────────────┐ │     │
│  │  │ ↑  Upload Evidence                                   │ │     │
│  │  └──────────────────────────────────────────────────────┘ │     │
│  │                                                            │     │
│  │  ── Navigation ───────────────────────────────────────────│     │
│  │  → Risk Register                                          │     │
│  │  → Zone & Conduit Designer                                │     │
│  │  → Administration                                         │     │
│  │                                                            │     │
│  │  ↑↓ Navigate  ↵ Open  ⌘+↵ New tab  esc Close            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  max-w-xl  shadow-xl  rounded-xl  bg-surface-0  border              │
│  max-h-[70vh]  overflow-y-auto                                      │
│  Animate: scale(0.98) → scale(1) + fade, 150ms                     │
│  Keyboard: full arrow-key navigation, type-ahead filtering           │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.6 OfflineIndicator

```
Top Bar Indicator States:

Online:
  ┌──┐
  │🟢│  ← Green dot, 8px
  └──┘  tooltip: "Online"

Syncing:
  ┌──┐
  │🟡│  ← Amber dot, pulsing animation
  └──┘  tooltip: "Syncing 3 items..."

Offline:
  ┌──┐
  │🔴│  ← Red dot
  └──┘  tooltip: "Offline — 5 changes pending"

Offline Banner (below top bar):
┌──────────────────────────────────────────────────────────────────────┐
│  🔴 You are offline. Changes will be saved locally and synced when  │
│     connectivity is restored.                           [Dismiss]   │
│  bg-amber-50  text-amber-800  border-b border-amber-200  h-8        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Form Components

### 4.1 FormField

```
┌──────────────────────────────────────────────────────────────────────┐
│  Label *                                                             │
│  text-sm font-medium text-surface-700                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Input / Select / Textarea                                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Helper text (optional)                                              │
│  text-xs text-surface-500                                            │
│                                                                      │
│  Error text (when invalid)                                           │
│  text-xs text-red-600                                                │
│                                                                      │
│  Layout:                                                             │
│  • Vertical (default): label above input                             │
│  • Horizontal: label left (w-48), input right (flex-1)              │
│  • Inline: label + input on same line (for checkboxes, switches)    │
│                                                                      │
│  Required indicator: red asterisk after label                        │
│  Optional indicator: "(optional)" text after label (muted)           │
│                                                                      │
│  Character count (textarea):                                         │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Notes...                                                  │     │
│  │                                                            │     │
│  │                                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  245 / 2000 characters                                               │
│  text-xs text-right text-surface-400                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 FormWizard

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Step Indicator ─────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  ① Basic ──── ② Scope ──── ③ Template ──── ④ Review        │   │
│  │  ●            ●            ○               ○                │   │
│  │  completed    current      upcoming        upcoming          │   │
│  │                                                              │   │
│  │  ● = brand-600 (filled circle)                               │   │
│  │  ◐ = brand-600 (ring, pulsing)                               │   │
│  │  ○ = surface-300 (empty circle)                              │   │
│  │  ─── = brand-600 (completed connector)                       │   │
│  │  ─ ─ ─ = surface-300 (upcoming connector, dashed)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ Step Content ───────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  (Current step form fields render here)                      │   │
│  │                                                              │   │
│  │  max-w-2xl  centered                                         │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ Step Actions ───────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [← Back]                                      [Next →]     │   │
│  │  ghost button                                primary button  │   │
│  │                                                              │   │
│  │  On last step: [← Back]              [Create Assessment]     │   │
│  │                                      primary button          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Behavior:                                                           │
│  • Steps validated before advancing                                  │
│  • Can navigate back without losing data                             │
│  • Can jump to completed steps (click step number)                   │
│  • Data preserved in form state (Zustand) across steps               │
│  • URL updates per step: /assessments/new?step=2                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Chart Components

### 5.1 RiskHeatMap

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Header ──────────────────────────────────────────────────────┐  │
│  │  Risk Heat Map                              [Config ▾] [↗]    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Impact →                                                            │
│  ┌────────┬────────┬────────┬────────┬────────┐                     │
│  │        │  1     │  2     │  3     │  4     │  5                 │
│  │  5     │  5     │  10    │  15    │  20    │  25               │
│  │        │{green} │{yellow}│{orange}│{red}   │{red}               │
│  ├────────┼────────┼────────┼────────┼────────┤                     │
│  │  4     │  4     │  8     │  12    │  16    │  20               │
│  │        │{green} │{yellow}│{orange}│{red}   │{red}               │
│  ├────────┼────────┼────────┼────────┼────────┤                     │
│  │  3     │  3     │  6     │  9     │  12    │  15               │
│  │        │{green} │{yellow}│{yellow}│{orange}│{red}               │
│  ├────────┼────────┼────────┼────────┼────────┤                     │
│  │  2     │  2     │  4     │  6     │  8     │  10               │
│  │        │{green} │{green} │{yellow}│{yellow}│{orange}            │
│  ├────────┼────────┼────────┼────────┼────────┤                     │
│  │  1     │  1     │  2     │  3     │  4     │  5                │
│  │        │{green} │{green} │{green} │{green} │{yellow}            │
│  └────────┴────────┴────────┴────────┴────────┘                     │
│                                                                      │
│  Cell behavior:                                                      │
│  • Number = risk score (L × I)                                       │
│  • Number badge = count of risks in that cell (if > 0)              │
│  • Click cell → filters risk list below                              │
│  • Hover → tooltip with risk count + names                           │
│  • Color intensity scales with score                                 │
│                                                                      │
│  Cell colors (from heat map gradient, §10.2):                        │
│  1-4:   #22C55E (green)                                              │
│  5-9:   #F59E0B (amber)                                              │
│  10-15: #F97316 (orange)                                             │
│  16-25: #EF4444 (red)                                                │
│                                                                      │
│  Implementation: Recharts custom Cell component or CSS Grid           │
│  Size: min 320px, max 600px width, aspect-ratio: 1.2                │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 RadarChart (Security Level Scorecard)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌─ Header ──────────────────────────────────────────────────────┐  │
│  │  Security Level Gap Analysis                [Current] [Target] │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                    FR1: IAC                                          │
│                   ╱        ╲                                         │
│              4  ╱    ●──●   ╲  4                                    │
│                ╱   ╱      ╲  ╲                                      │
│           3  ╱  ╱    ○──○   ╲ ╲  3                                  │
│             ╱  ╱              ╲ ╲                                    │
│        2  ╱ ╱                  ╲╲  2                                │
│          ╱╱    FR7 ◄─────► FR2                                      │
│          ╲╲    ╱╲              ╱╱                                    │
│        1  ╲ ╲ ╱  ╲          ╱╱  1                                  │
│            ╲╱╱    ╲        ╱                                        │
│           0  ╲      ╲────╱   0                                      │
│               FR6 ◄──► FR3                                          │
│                   ╲  ╱                                              │
│                    FR4 ── FR5                                       │
│                                                                      │
│  ──── Current SL (solid line, brand-500, fill: brand-500/20)        │
│  - - - Target SL (dashed line, surface-400)                         │
│  ● Current data points                                              │
│  ○ Target data points                                               │
│                                                                      │
│  Legend:                                                             │
│  ──── Current SL    - - - Target SL    Gap area (red fill)          │
│                                                                      │
│  Implementation: Recharts RadarChart                                 │
│  Size: 400×400px (square)                                            │
│  7 axes (FR1–FR7), scale 0–4                                        │
│  Responsive: scales down to 280px on tablet                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3 GaugeChart (Security Score)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│              ╭──────────────╮                                        │
│            ╱                  ╲                                      │
│          ╱    ╭──────────╮      ╲                                   │
│         │     │          │       │                                  │
│         │     │    72    │       │  ← Score number, text-3xl bold   │
│         │     │  / 100   │       │                                  │
│         │     ╰──────────╯       │                                  │
│          ╲                      ╱                                   │
│            ╲    ╭────────╮    ╱                                     │
│              ╰──╯        ╰──╯                                      │
│                                                                      │
│  Arc: 240° sweep (from 210° to -30°)                                │
│  Background arc: surface-200                                         │
│  Value arc: gradient from green → amber → red based on score         │
│  0-40: red, 41-60: amber, 61-80: blue, 81-100: green               │
│                                                                      │
│  Trend indicator below:                                              │
│  ↑ 7 pts from last quarter                                           │
│                                                                      │
│  Implementation: Recharts RadialBarChart or custom SVG               │
│  Size: 160×120px                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.4 Sparkline

```
Inline sparkline (used in MetricCards and table cells):

  ┌──────────────────────┐
  │  42  ▁▂▃▂▃▅▇▅▃▂▃▅▇█ │  ← 30 data points, 80×24px
  └──────────────────────┘

  Color: brand-500 (positive trend) or red-500 (negative trend)
  Stroke width: 1.5px
  No axes, no labels — trend direction only
  Hover: tooltip shows full date range + min/max values

  Implementation: Recharts LineChart (minimal config)
  Size: 80×24px (inline), 120×32px (card)
```

---

## 6. Notification Components

### 6.1 Toast

```
Position: top-right corner, stacked (max 3 visible)

Success Toast:
┌──────────────────────────────────────────────────────────────────────┐
│  ✓  Evidence uploaded successfully                                   │
│     hmi_config.png — SHA-256 verified                    [×]        │
│  bg-green-50  border-green-200  text-green-800                      │
│  Auto-dismiss: 5 seconds                                             │
└──────────────────────────────────────────────────────────────────────┘

Error Toast:
┌──────────────────────────────────────────────────────────────────────┐
│  ⚠  Failed to save finding                                          │
│     Network error. Your changes are saved locally.       [Retry] [×] │
│  bg-red-50  border-red-200  text-red-800                             │
│  No auto-dismiss (requires manual action)                            │
└──────────────────────────────────────────────────────────────────────┘

Info Toast:
┌──────────────────────────────────────────────────────────────────────┐
│  ℹ  Assessment progress updated                                      │
│     Plant Alpha: 19/48 questions answered (40%)           [×]        │
│  bg-blue-50  border-blue-200  text-blue-800                         │
│  Auto-dismiss: 4 seconds                                             │
└──────────────────────────────────────────────────────────────────────┘

Toast dimensions: max-w-sm  rounded-lg  shadow-md  p-3
Animate: slide-in from right 200ms, fade-out 150ms
```

### 6.2 Notification Center (Bell Dropdown)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Notifications (3 unread)                            [Mark all read] │
│  ─────────────────────────────────────────────────────────────       │
│                                                                      │
│  ● F-2024-0042 acknowledged by Yuki Tanaka           2 min ago      │
│    Finding · Plant Alpha                                             │
│                                                                      │
│  ● Report ready: "Plant Alpha Assessment Summary"     15 min ago     │
│    Report · [Download]                                               │
│                                                                      │
│  ● Risk acceptance pending your approval              1 hour ago     │
│    Risk · RISK-0023 · [Review]                                       │
│                                                                      │
│  ─────────────────────────────────────────────────────────────       │
│  ○ Remediation action PROJ-1848 completed             Yesterday     │
│  ○ Assessment "Unit 200 DCS" completed                Jul 28        │
│  ○ New member Elena Rodriguez joined                  Jul 27        │
│                                                                      │
│  [View All Notifications →]                                          │
└──────────────────────────────────────────────────────────────────────┘

width: 380px  max-h-[70vh]  overflow-y-auto
● = unread (bold text, brand-50 dot)
○ = read (normal text)
Click notification → navigate to entity + mark as read
```

---

## 7. Responsive Behavior Summary

| Component      | Desktop (≥1280)     | Laptop (1024–1279)  | Tablet (768–1023)    | Mobile (<768)      |
| -------------- | ------------------- | ------------------- | -------------------- | ------------------ |
| DataTable      | Full columns        | Horizontal scroll   | Horizontal scroll    | Card list view     |
| ContextPanel   | 420px side panel    | 360px side panel    | Full-width overlay   | Full-screen page   |
| CommandPalette | max-w-xl centered   | max-w-lg            | max-w-md, full-width | Full-screen        |
| Dialog         | Centered modal      | Centered modal      | Centered modal       | Full-screen sheet  |
| Dashboard      | 4-col grid          | 2-col grid          | 2-col grid           | Single column      |
| Zone Designer  | Canvas + properties | Canvas + properties | Canvas only          | Canvas only (view) |
| Sidebar        | Expanded (256px)    | Collapsed (64px)    | Drawer overlay       | Drawer overlay     |
| Risk Heat Map  | Full 5×5 grid       | Full 5×5 grid       | 5×5 (smaller cells)  | Scrollable list    |
| Radar Chart    | 400×400             | 350×350             | 300×300              | 280×280            |

---

_Next: [Dashboard Specifications →](dashboard-specifications.md)_
