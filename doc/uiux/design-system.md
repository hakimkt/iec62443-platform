# IEC 62443 Platform — Design System

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Implementation: Tailwind CSS 4 + Radix UI + CSS Custom Properties

---

## 1. Design Philosophy

### Brand Character

The platform communicates **authority, precision, and trust**. It is used by cybersecurity professionals who evaluate critical infrastructure — the interface must reflect the same rigor they apply to their work.

**Design adjectives:** Clinical, Confident, Structured, Professional, Uncluttered

**Design anti-patterns to avoid:** Playful, Casual, Gamified, Overly colorful, Dense/cramped

### Comparison Benchmarks

| Platform | What to emulate | What to avoid |
|---|---|---|
| **ServiceNow GRC** | Structured data density, workflow clarity | Dated visual style, slow perceived performance |
| **RSA Archer** | Comprehensive risk visualization | Cluttered navigation, overwhelming dashboards |
| **OneTrust** | Clean modern enterprise aesthetic | Generic stock-illustration style |
| **Vanta** | Crisp onboarding, clear compliance indicators | Limited depth for complex use cases |
| **Wiz (cloud security)** | Dark mode execution, threat visualization | Consumer-focused simplicity |

---

## 2. Color System

### 2.1 Brand Palette

```
Primary — "Sentinel Blue"
────────────────────────────────────────────
Token Name         Light Mode    Dark Mode    Usage
─────────────────────────────────────────────────────────────
--brand-50         #EFF6FF      #1E293B      Tint backgrounds
--brand-100        #DBEAFE      #1E3A5F      Hover states
--brand-200        #BFDBFE      #2563EB      Selected states
--brand-300        #93C5FD      #3B82F6      Decorative elements
--brand-400        #60A5FA      #60A5FA      Secondary actions
--brand-500        #3B82F6      #3B82F6      Primary actions, links
--brand-600        #2563EB      #2563EB      Primary button bg
--brand-700        #1D4ED8      #1D4ED8      Primary button hover
--brand-800        #1E40AF      #1E40AF      Active states
--brand-900        #1E3A8A      #1E3A8A      Deep accents
--brand-950        #172554      #172554      Darkest brand
```

### 2.2 Semantic Colors

```
Severity / Status Colors
───────────────────────────────────────────────────────────────
Severity     Light Mode    Dark Mode    Usage
───────────────────────────────────────────────────────────────
Critical     #DC2626       #EF4444      Critical findings, P1 risks
High         #EA580C       #F97316      High findings, overdue items
Medium       #D97706       #F59E0B      Medium findings, warnings
Low          #2563EB       #60A5FA      Low findings, info items
Info         #64748B       #94A3B8      Informational, neutral

Status Colors
───────────────────────────────────────────────────────────────
Success      #16A34A       #22C55E      Completed, verified, compliant
Warning      #D97706       #F59E0B      Partial, in-progress, review
Danger       #DC2626       #EF4444      Failed, critical, non-compliant
Neutral      #64748B       #94A3B8      Draft, pending, N/A

Security Level Colors (SL 0–4)
───────────────────────────────────────────────────────────────
SL 0         #94A3B8       #64748B      No security
SL 1         #60A5FA       #3B82F6      Basic
SL 2         #3B82F6       #2563EB      Moderate
SL 3         #7C3AED       #8B5CF6      Sophisticated
SL 4         #DC2626       #EF4444      Nation-state
```

### 2.3 Surface Colors (Light/Dark)

```
Light Mode Surfaces
──────────────────────────────────────────────
Token                Value       Usage
──────────────────────────────────────────────
--surface-0          #FFFFFF     Page background
--surface-50         #F8FAFC     Card backgrounds (subtle)
--surface-100        #F1F5F9     Sidebar, secondary panels
--surface-200        #E2E8F0     Borders, dividers
--surface-300        #CBD5E1     Disabled backgrounds
--surface-400        #94A3B8     Placeholder text
--surface-500        #64748B     Secondary text
--surface-600        #475569     Body text
--surface-700        #334155     Subheadings
--surface-800        #1E293B     Headings
--surface-900        #0F172A     Primary text

Dark Mode Surfaces
──────────────────────────────────────────────
Token                Value       Usage
──────────────────────────────────────────────
--surface-0          #0B1120     Page background
--surface-50         #0F172A     Card backgrounds
--surface-100        #1E293B     Sidebar, elevated surfaces
--surface-200        #334155     Borders, dividers
--surface-300        #475569     Disabled backgrounds
--surface-400        #64748B     Placeholder text
--surface-500        #94A3B8     Secondary text
--surface-600        #CBD5E1     Body text
--surface-700        #E2E8F0     Subheadings
--surface-800        #F1F5F9     Headings
--surface-900        #F8FAFC     Primary text
```

### 2.4 Purdue Level Colors

```
Level     Color (Light)   Color (Dark)    Label
─────────────────────────────────────────────────────────
5         #1E40AF         #3B82F6         Enterprise Network
4         #2563EB         #60A5FA         Business Planning
3.5       #7C3AED         #8B5CF6         Industrial DMZ
3         #0891B2         #06B6D4         Manufacturing Ops
2         #059669         #10B981         Area Supervisory
1         #D97706         #F59E0B         Basic Control
0         #DC2626         #EF4444         Physical Process
```

---

## 3. Typography

### 3.1 Font Stack

```
Primary (UI):     Inter Variable
                  font-family: 'Inter Variable', -apple-system, 
                  BlinkMacSystemFont, 'Segoe UI', sans-serif;

Monospace (code): JetBrains Mono
                  font-family: 'JetBrains Mono', 'Fira Code',
                  'Cascadia Code', monospace;

Numbers (tables): Inter Variable (tabular-nums)
                  font-variant-numeric: tabular-nums;
```

### 3.2 Type Scale

```
Token         Size      Weight    Line-height   Letter-spacing   Usage
────────────────────────────────────────────────────────────────────────
text-xs       12px      400       16px          0.02em           Captions, labels
text-sm       13px      400       20px          0.01em           Table cells, meta
text-base     14px      400       20px          0                Body text (default)
text-md       15px      400       24px          0                Card descriptions
text-lg       16px      500       24px          -0.01em          Section headers
text-xl       18px      600       28px          -0.02em          Page titles
text-2xl      22px      600       30px          -0.02em          Dashboard headers
text-3xl      28px      700       36px          -0.03em          Hero / KPI numbers
text-4xl      36px      700       40px          -0.03em          Marketing (rare)
```

**Design decision:** Base font size is **14px** (not 16px) to accommodate the data density required in enterprise GRC tools. The 13px `text-sm` is used extensively in tables.

### 3.3 Font Weight Usage

| Weight | Name | Usage |
|---|---|---|
| 400 | Regular | Body text, table cells, descriptions |
| 500 | Medium | Labels, navigation items, section headers |
| 600 | Semi-Bold | Page titles, KPI values, emphasis |
| 700 | Bold | Dashboard headers, large KPI numbers |

---

## 4. Spacing System

```
Base unit: 4px
Scale: 4-point grid

Token     Value    Usage
────────────────────────────────────────────────────
space-0   0px      Flush (no spacing)
space-1   4px      Tight: icon-to-text, inline badges
space-2   8px      Compact: list item padding, chip gaps
space-3   12px     Standard: form field padding, card inner gaps
space-4   16px     Default: card padding, section gaps
space-5   20px     Comfortable: between form groups
space-6   24px     Section spacing
space-8   32px     Page section separation
space-10  40px     Major section breaks
space-12  48px     Page top/bottom padding
space-16  64px     Dashboard hero spacing
```

---

## 5. Layout System

### 5.1 Shell Layout

```
┌──────────────────────────────────────────────────────────────┐
│                         TOP BAR (48px)                       │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ SIDEBAR  │              CONTENT AREA                         │
│ (256px)  │              (fluid, max 1440px)                  │
│          │                                                   │
│          │   ┌─ Page Header ──────────────────────────────┐  │
│          │   │  Title + Actions                           │  │
│          │   └────────────────────────────────────────────┘  │
│          │                                                   │
│          │   ┌─ Page Content ─────────────────────────────┐  │
│          │   │                                            │  │
│          │   │  (Module content renders here)             │  │
│          │   │                                            │  │
│          │   └────────────────────────────────────────────┘  │
│          │                                                   │
│          │   ┌─ Page Footer (optional) ───────────────────┐  │
│          │   │  Pagination / Bulk Actions                 │  │
│          │   └────────────────────────────────────────────┘  │
│          │                                                   │
├──────────┴───────────────────────────────────────────────────┤
│                      (no persistent footer)                  │
└──────────────────────────────────────────────────────────────┘

Dimensions:
  Top bar height:     48px
  Sidebar width:      256px (expanded) / 64px (collapsed)
  Content padding:    24px (desktop) / 16px (tablet)
  Content max-width:  1440px (centered with auto margins)
  Page header height: 56px
  Min touch target:   44px × 44px
```

### 5.2 Grid System

```
Content grid: 12-column, 24px gutter

Dashboard layouts:
  • 4-column card grid (3 cards × 4 cols each, or 4 cards × 3 cols)
  • 2-column split (8 cols + 4 cols for sidebar detail)
  • Full-width for tables and diagrams

Responsive breakpoints:
  xs:    0–639px      (mobile — limited functionality)
  sm:    640–767px    (large mobile)
  md:    768–1023px   (tablet — sidebar as drawer)
  lg:    1024–1279px  (laptop — sidebar collapsed)
  xl:    1280–1535px  (desktop — sidebar expanded)
  2xl:   1536px+      (wide desktop)
```

### 5.3 Card Layout

```
Standard Card:
┌──────────────────────────────────┐
│  padding: 16px                   │  border: 1px solid --surface-200
│  border-radius: 8px              │  background: --surface-0
│  box-shadow: none (flat)         │
│                                  │
│  ┌─ Card Header ──────────────┐  │  height: 36px, mb: 12px
│  │  Title          [Action ▾] │  │  text-lg font-medium
│  └────────────────────────────┘  │
│                                  │
│  ┌─ Card Body ────────────────┐  │  flex: 1
│  │                            │  │
│  │  Content                   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─ Card Footer (optional) ───┐  │  pt: 12px, border-top
│  │  Meta / Actions            │  │  text-sm text-muted
│  └────────────────────────────┘  │
└──────────────────────────────────┘

Card Variants:
  • Metric Card: KPI number + trend arrow + sparkline
  • List Card: Scrollable list of items (max 5 visible)
  • Chart Card: Visualization with header controls
  • Status Card: Icon + label + status indicator
  • Action Card: Clickable with hover elevation
```

---

## 6. Border Radius

```
Token          Value    Usage
─────────────────────────────────────────────
radius-none    0px      Tables, full-width dividers
radius-sm      4px      Badges, chips, small buttons
radius-md      6px      Inputs, dropdowns, tooltips
radius-lg      8px      Cards, dialogs, panels
radius-xl      12px     Modals, large panels
radius-full    9999px   Avatars, pills, circular badges
```

---

## 7. Shadow System

```
Token          Value                                    Usage
─────────────────────────────────────────────────────────────────
shadow-none    none                                     Cards (flat design)
shadow-xs      0 1px 2px rgba(0,0,0,0.05)              Subtle elevation
shadow-sm      0 1px 3px rgba(0,0,0,0.1),              Dropdowns, popovers
               0 1px 2px rgba(0,0,0,0.06)
shadow-md      0 4px 6px rgba(0,0,0,0.07),             Tooltips, context panels
               0 2px 4px rgba(0,0,0,0.06)
shadow-lg      0 10px 15px rgba(0,0,0,0.1),            Modals, dialogs
               0 4px 6px rgba(0,0,0,0.05)
shadow-xl      0 20px 25px rgba(0,0,0,0.1),            Command palette overlay
               0 8px 10px rgba(0,0,0,0.04)

Dark mode adjustment:
  • Multiply alpha by 2.5 (shadows are more visible on dark bg)
  • Add subtle inner border (1px solid rgba(255,255,255,0.05))
    for elevation differentiation
```

---

## 8. Motion & Transitions

```
Token              Duration    Easing                   Usage
────────────────────────────────────────────────────────────────────
duration-instant   50ms        ease-out                 Button press feedback
duration-fast      100ms       ease-out                 Hover states, toggles
duration-normal    150ms       ease-in-out              Panel slides, tab switches
duration-slow      200ms       ease-in-out              Dialog open/close
duration-page      250ms       cubic-bezier(0.4,0,0.2,1) Page transitions

Motion preferences:
  • prefers-reduced-motion: reduce → all durations set to 0ms
  • No animations on data loading (instant state change)
  • Skeleton loaders instead of spinners for content loading
```

---

## 9. Icon System

```
Library: Lucide React (24×24 default, 1.5px stroke)
Consistent with: Tailwind ecosystem, accessible, well-maintained

Icon sizes:
  14px    Inline text icons (badges, labels)
  16px    Navigation items, table actions
  20px    Buttons, form field prefixes
  24px    Card headers, section titles
  32px    Empty states, onboarding
  48px    Hero illustrations (rare)

Navigation icon mapping:
  Dashboard         → LayoutDashboard
  Assessments       → ClipboardCheck
  Requirements      → BookOpen
  Assets            → Server
  Purdue Model      → Layers
  Zones & Conduits  → Network
  Findings          → AlertTriangle
  Risk Register     → Target
  Evidence          → Paperclip
  Remediation       → Wrench
  CSMS              → Shield
  Reports           → FileText
  Administration    → Settings
```

---

## 10. Data Visualization Colors

### 10.1 Chart Palette (Categorical)

```
12-color sequential palette for charts:

#3B82F6  (Blue)      — Primary data series
#8B5CF6  (Violet)    — Secondary
#06B6D4  (Cyan)      — Tertiary
#10B981  (Emerald)   — Quaternary
#F59E0B  (Amber)     — Quinary
#EF4444  (Red)       — Senary
#EC4899  (Pink)      — Septenary
#6366F1  (Indigo)    — Octonary
#14B8A6  (Teal)      — Nonary
#F97316  (Orange)    — Denary
#84CC16  (Lime)      — Undecenary
#A855F7  (Purple)    — Duodenary

Rules:
  • Max 7 series per chart (use "Other" for beyond)
  • Consistent color assignment per entity type
  • Light/dark mode: same hues, adjusted saturation
```

### 10.2 Heat Map Gradient

```
Risk Heat Map (Low → Critical):

Light mode:
  #22C55E → #84CC16 → #F59E0B → #F97316 → #EF4444
  (Green)   (Lime)    (Amber)   (Orange)   (Red)

Dark mode:
  #16A34A → #65A30D → #D97706 → #EA580C → #DC2626

Assessment Scorecard Gradient (Gap = 0 → Gap = 4):
  #22C55E → #3B82F6 → #F59E0B → #EF4444
  (Met)     (Minor)   (Moderate)  (Major gap)
```

---

## 11. Accessibility

### 11.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|---|---|
| Color contrast (text) | Minimum 4.5:1 for normal text, 3:1 for large text |
| Color contrast (UI) | Minimum 3:1 for interactive elements, icons, boundaries |
| Non-color indicators | Icons + text labels; never color-only for status |
| Focus indicators | 2px solid brand-500, offset 2px, visible on all surfaces |
| Keyboard navigation | Full keyboard support; logical tab order; visible focus |
| Screen readers | Semantic HTML; ARIA labels; live regions for dynamic content |
| Motion | Respects `prefers-reduced-motion` |
| Text scaling | Functional at 200% zoom |

### 11.2 Focus Ring

```css
/* Global focus-visible style */
:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

/* Dark mode: brighter focus ring */
.dark :focus-visible {
  outline-color: var(--brand-400);
}
```

---

## 12. Dark Mode Strategy

```
Implementation: CSS class toggle (.dark on <html>) + Tailwind dark: variant
Preference:    User preference (localStorage) + OS preference (prefers-color-scheme)
Default:       Light mode

Override hierarchy:
  1. User explicit toggle (localStorage)
  2. OS preference (prefers-color-scheme)
  3. Default: light

Theme toggle location: User menu dropdown (top-right avatar → Theme: Light/Dark/System)
```

### Dark Mode Adjustments

| Element | Light | Dark |
|---|---|---|
| Cards | White bg, no shadow | Dark bg, subtle border |
| Tables | Alternating row tint | Border-based separation |
| Code blocks | Light gray bg | Darker bg with colored syntax |
| Charts | Standard saturation | +10% saturation for visibility |
| Images | Full brightness | 90% brightness (reduce glare) |
| Overlay | rgba(0,0,0,0.5) | rgba(0,0,0,0.7) |

---

## 13. CSS Custom Properties (Design Tokens)

```css
:root {
  /* Brand */
  --brand-50: #EFF6FF;
  --brand-100: #DBEAFE;
  --brand-500: #3B82F6;
  --brand-600: #2563EB;
  --brand-700: #1D4ED8;

  /* Surfaces */
  --surface-0: #FFFFFF;
  --surface-50: #F8FAFC;
  --surface-100: #F1F5F9;
  --surface-200: #E2E8F0;
  --surface-500: #64748B;
  --surface-800: #1E293B;
  --surface-900: #0F172A;

  /* Semantic */
  --color-critical: #DC2626;
  --color-high: #EA580C;
  --color-medium: #D97706;
  --color-low: #2563EB;
  --color-info: #64748B;
  --color-success: #16A34A;

  /* Typography */
  --font-sans: 'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.8125rem;  /* 13px */
  --text-base: 0.875rem; /* 14px */
  --text-lg: 1rem;       /* 16px */
  --text-xl: 1.125rem;   /* 18px */
  --text-2xl: 1.375rem;  /* 22px */
  --text-3xl: 1.75rem;   /* 28px */

  /* Spacing */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Layout */
  --sidebar-width: 256px;
  --sidebar-collapsed: 64px;
  --topbar-height: 48px;
  --content-max-width: 1440px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);

  /* Transitions */
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 200ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
  --surface-0: #0B1120;
  --surface-50: #0F172A;
  --surface-100: #1E293B;
  --surface-200: #334155;
  --surface-500: #94A3B8;
  --surface-800: #F1F5F9;
  --surface-900: #F8FAFC;

  --color-critical: #EF4444;
  --color-high: #F97316;
  --color-medium: #F59E0B;
  --color-low: #60A5FA;
  --color-info: #94A3B8;
  --color-success: #22C55E;
}
```

---

## 14. Responsive Design Strategy

```
Mobile-first approach with progressive enhancement:

┌──────────────┬────────────────────────────────────────────────┐
│ Breakpoint   │ Layout Adaptation                              │
├──────────────┼────────────────────────────────────────────────┤
│ < 640px      │ Stack everything vertically                    │
│              │ Tables → card lists                            │
│              │ Dashboards → single column                     │
│              │ Limited functionality (view only)              │
├──────────────┼────────────────────────────────────────────────┤
│ 640–767px    │ 2-column grids                                 │
│              │ Tables with horizontal scroll                  │
│              │ Sidebar as slide-out drawer                    │
├──────────────┼────────────────────────────────────────────────┤
│ 768–1023px   │ Sidebar as drawer (triggered by hamburger)     │
│              │ Full table layouts                             │
│              │ 2–3 column dashboard grids                     │
├──────────────┼────────────────────────────────────────────────┤
│ 1024–1279px  │ Sidebar collapsed (icon-only, 64px)            │
│              │ Full table + context panel side by side        │
│              │ 3–4 column dashboard grids                     │
├──────────────┼────────────────────────────────────────────────┤
│ 1280–1535px  │ Sidebar expanded (256px)                       │
│              │ All layouts available                          │
│              │ Context panels coexist with tables             │
├──────────────┼────────────────────────────────────────────────┤
│ 1536px+      │ Content max-width: 1440px centered             │
│              │ Extra space as margins                         │
│              │ Optional: wider tables                         │
└──────────────┴────────────────────────────────────────────────┘
```

---

*Next: [Wireframes →](wireframes.md)*
