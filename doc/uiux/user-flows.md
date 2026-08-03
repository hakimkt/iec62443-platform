# IEC 62443 Platform — User Flows & Journeys

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01

---

## 1. Persona Profiles

### 1.1 IEC 62443 Lead Auditor

| Attribute         | Detail                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Name**          | Sarah Chen                                                                                |
| **Role**          | Lead Assessor at OT Security Consulting firm                                              |
| **Context**       | Manages 5–8 concurrent client assessments                                                 |
| **Primary tasks** | Plan assessments, evaluate requirements, review team work, generate certification reports |
| **Pain points**   | Scattered evidence across email/drives, manual scorecard tracking, report formatting      |
| **Platform role** | Lead Assessor                                                                             |
| **Frequency**     | Daily, 4–6 hours/day                                                                      |
| **Device**        | Laptop (office), tablet (on-site at client plants)                                        |

### 1.2 OT Cybersecurity Consultant

| Attribute         | Detail                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Name**          | Marcus Weber                                                                                   |
| **Role**          | Senior OT Security Consultant                                                                  |
| **Context**       | Conducts field assessments at industrial facilities                                            |
| **Primary tasks** | Walk plant floors, interview operators, capture evidence, document findings                    |
| **Pain points**   | Poor connectivity in plant environments, re-entering field notes, linking evidence to findings |
| **Platform role** | Assessor                                                                                       |
| **Frequency**     | Daily during engagements, often on-site                                                        |
| **Device**        | Tablet (field work), laptop (report writing)                                                   |

### 1.3 Plant Security Engineer

| Attribute         | Detail                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------- |
| **Name**          | Yuki Tanaka                                                                                 |
| **Role**          | OT Security Engineer at a chemical manufacturing company                                    |
| **Context**       | Responsible for security posture of 3 plant sites                                           |
| **Primary tasks** | Track remediation actions, manage asset inventory, review risk register, prepare for audits |
| **Pain points**   | No centralized risk view, remediation tracking in spreadsheets, audit preparation stress    |
| **Platform role** | Project Manager (for their tenant)                                                          |
| **Frequency**     | Daily, 2–3 hours/day                                                                        |
| **Device**        | Desktop workstation                                                                         |

### 1.4 CISO

| Attribute         | Detail                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Name**          | David Okonkwo                                                                              |
| **Role**          | Chief Information Security Officer                                                         |
| **Context**       | Oversees OT and IT security for a multinational energy company                             |
| **Primary tasks** | Review dashboards, approve risk acceptances, present to board, track program maturity      |
| **Pain points**   | No executive-level OT security visibility, translating technical risk to business language |
| **Platform role** | Tenant Owner                                                                               |
| **Frequency**     | Weekly review, monthly deep-dive                                                           |
| **Device**        | Desktop + mobile (quick checks)                                                            |

### 1.5 Asset Owner

| Attribute         | Detail                                                                          |
| ----------------- | ------------------------------------------------------------------------------- |
| **Name**          | Elena Rodriguez                                                                 |
| **Role**          | Plant Manager at a pharmaceutical facility                                      |
| **Context**       | Accountable for plant safety and compliance, not a security specialist          |
| **Primary tasks** | Review assessment results, approve remediation budgets, sign risk acceptances   |
| **Pain points**   | Technical jargon, unclear what actions are needed, compliance deadline pressure |
| **Platform role** | Viewer (with risk acceptance authority delegated)                               |
| **Frequency**     | Monthly or as needed                                                            |
| **Device**        | Desktop, occasionally mobile                                                    |

---

## 2. Journey: IEC 62443 Lead Auditor

### 2.1 End-to-End Assessment Lifecycle

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Plan   │───►│ Prepare │───►│ Execute │───►│ Review  │───►│ Deliver │
│         │    │         │    │         │    │         │    │         │
│ Create  │    │ Configure│    │ Conduct │    │ QA the  │    │Generate │
│ engage- │    │ template│    │ assess- │    │ assess- │    │ reports │
│ ment    │    │ & scope │    │ ment    │    │ ment    │    │ & cert  │
│         │    │         │    │ on-site │    │ results │    │ package │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
  ~30 min        ~1 hour       2–5 days       ~4 hours       ~2 hours
```

### 2.2 Detailed Flow: Plan & Create Engagement

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Dashboard                                                    │
│                                                                      │
│  Step 1: Click "New Assessment"                                      │
│          └─ Opens Assessment Creation Wizard                         │
│                                                                      │
│  Step 2: Wizard — Basic Info                                         │
│          ├─ Assessment name: "Plant Alpha IEC 62443-3-2 Assessment"  │
│          ├─ Client/Client Workspace: "Alpha Chemical Corp"           │
│          ├─ Assessment type: "Gap Assessment"                        │
│          ├─ IEC Part: "3-2" (auto-selected from type)                │
│          ├─ Target SL: 2 (dropdown)                                  │
│          └─ Start date, target completion date                       │
│                                                                      │
│  Step 3: Wizard — Scope                                              │
│          ├─ Select facility/system from asset inventory              │
│          ├─ Scope: "Plant Alpha — Unit 200 DCS"                     │
│          └─ Assign assessment team (add assessors from tenant)       │
│                                                                      │
│  Step 4: Wizard — Template                                           │
│          ├─ Select template: "IEC 62443-3-2 v1.0 (System)"          │
│          ├─ Preview: 48 requirements across 7 FR categories          │
│          └─ Customize: disable N/A sections if desired               │
│                                                                      │
│  Step 5: Review & Create                                             │
│          ├─ Summary of all selections                                │
│          └─ [Create Engagement]                                      │
│                                                                      │
│  RESULT: Redirected to Assessment Detail → Summary tab               │
│          Status: Draft → In Progress                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Detailed Flow: Review Assessment Results

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Assessment Detail → Scorecard tab                            │
│                                                                      │
│  Step 1: Review Scorecard                                            │
│          ├─ Radar chart: Current SL vs Target SL per FR category     │
│          ├─ Table: FR1–FR7 scores, gaps highlighted in red           │
│          └─ Overall compliance: 62%                                  │
│                                                                      │
│  Step 2: Drill into Low-Scoring Category                             │
│          ├─ Click "FR3: System Integrity" (score: 1, target: 2)     │
│          ├─ Opens question list filtered to FR3                      │
│          └─ Review assessor responses + notes                        │
│                                                                      │
│  Step 3: Review Evidence                                             │
│          ├─ Click evidence link on a question                        │
│          ├─ Context panel opens with evidence preview                │
│          ├─ Verify integrity hash: ✅ SHA-256 matches                │
│          └─ Add review note: "Evidence sufficient"                   │
│                                                                      │
│  Step 4: Mark as Reviewed                                            │
│          ├─ [Review Responses] → marks assessor work as reviewed     │
│          └─ Assessment status: In Progress → Review                  │
│                                                                      │
│  Step 5: Complete Assessment                                         │
│          ├─ [Complete Assessment]                                    │
│          ├─ Confirmation dialog: "All questions reviewed?"           │
│          └─ Status: Review → Completed                               │
│                                                                      │
│  RESULT: Assessment locked for editing (read-only)                   │
│          Scorecard finalized, available for report generation        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Journey: OT Cybersecurity Consultant

### 3.1 On-Site Field Assessment

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Mobile/Tablet → Assessment Questions tab                     │
│  CONTEXT: On-site at chemical plant, limited WiFi                    │
│                                                                      │
│  Step 1: Navigate to Current Question                                │
│          ├─ Question list shows progress: 18/48 answered             │
│          ├─ Current: "SR 3.4.2 — Are integrity checks performed     │
│          │   on configuration data?"                                  │
│          └─ Offline indicator visible (🔴 Offline)                   │
│                                                                      │
│  Step 2: Evaluate & Respond                                          │
│          ├─ Maturity: "Partially Implemented" (radio group)          │
│          ├─ Score: 1 (out of 4)                                     │
│          ├─ Notes: "PLC config backups exist but no integrity        │
│          │   verification procedure documented"                       │
│          └─ [Save] → stored locally in IndexedDB                     │
│                                                                      │
│  Step 3: Capture Evidence (Photo)                                    │
│          ├─ [Attach Evidence] → [Take Photo]                         │
│          ├─ Camera opens → photo of HMI screen showing config        │
│          ├─ Title: "HMI config screen — no integrity check visible"  │
│          └─ Stored locally, queued for upload when online             │
│                                                                      │
│  Step 4: Record Finding                                              │
│          ├─ [Create Finding] from current question                   │
│          ├─ Title auto-populated from question context               │
│          ├─ Severity: "High" (selected from dropdown)                │
│          ├─ Description: auto-filled from notes + context            │
│          ├─ Evidence: auto-linked to photo just captured             │
│          └─ [Save Finding] → stored locally                          │
│                                                                      │
│  Step 5: Connectivity Restored                                       │
│          ├─ Indicator changes: 🔴 → 🟡 Syncing (3 items)            │
│          ├─ Auto-sync: responses + evidence + finding uploaded       │
│          ├─ Integrity hash computed server-side, confirmed           │
│          └─ Indicator: 🟢 Online (all synced)                        │
│                                                                      │
│  RESULT: 19/48 questions answered, 1 finding created,                │
│          all synced to cloud                                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Journey: Plant Security Engineer

### 4.1 Daily Security Posture Review

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Executive Dashboard                                          │
│  CONTEXT: Morning routine, reviewing overnight changes               │
│                                                                      │
│  Step 1: Review Dashboard Metrics                                    │
│          ├─ Open Findings: 12 (3 critical, 5 high, 4 medium)        │
│          ├─ Overdue Remediation: 2 actions past due                  │
│          ├─ Risk Register: 4 high, 1 critical                        │
│          ├─ Assessment Progress: 78% (Plant Alpha)                   │
│          └─ Trend: findings down 15% from last month ✅              │
│                                                                      │
│  Step 2: Investigate Critical Finding                                │
│          ├─ Click "3 Critical" badge on findings widget              │
│          ├─ Navigate to: Findings → filtered to severity=critical    │
│          ├─ Open F-2024-0038: "Unauthenticated Modbus access to      │
│          │   safety PLC"                                             │
│          ├─ Review: severity, evidence, affected assets              │
│          └─ [Acknowledge] → status: Open → Acknowledged             │
│                                                                      │
│  Step 3: Create Remediation Action                                   │
│          ├─ [Create Remediation Plan] from finding                   │
│          ├─ Plan: "Q3 2026 Safety PLC Hardening"                    │
│          ├─ Action: "Implement Modbus/TCP authentication on          │
│          │   safety PLC network segment"                             │
│          ├─ Assign to: "Controls Team Lead"                          │
│          ├─ Due date: 2026-09-15                                     │
│          ├─ Cost estimate: $15,000                                   │
│          └─ [Create] → finding linked to remediation action          │
│                                                                      │
│  Step 4: Sync with Jira                                              │
│          ├─ [Push to Jira] → creates PROJ-1847                       │
│          ├─ External ticket ref saved to remediation action          │
│          └─ Future Jira updates sync back bi-directionally            │
│                                                                      │
│  Step 5: Review Risk Register                                        │
│          ├─ Navigate to: Risk Register → Heat Map view               │
│          ├─ Critical risk: "Safety system compromise" (5×5 = 25)    │
│          ├─ Click risk → view treatments                             │
│          ├─ New treatment: "Modbus authentication (linked to         │
│          │   remediation PROJ-1847)"                                 │
│          └─ Update residual risk estimate: 5×3 = 15 (High)          │
│                                                                      │
│  RESULT: Critical finding acknowledged, remediation planned,          │
│          Jira ticket created, risk register updated                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Journey: CISO

### 5.1 Monthly Executive Review

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Executive Dashboard                                          │
│  CONTEXT: Monthly board preparation, needs executive summary          │
│                                                                      │
│  Step 1: Review Security Posture Score                               │
│          ├─ Overall Score: 72/100 (up from 65 last quarter)          │
│          ├─ Current SL: 2 (Target SL: 3)                            │
│          ├─ Gap: -1 across most FR categories                        │
│          └─ Trend chart: 6-month improvement trajectory              │
│                                                                      │
│  Step 2: Review Risk Summary                                         │
│          ├─ Risk heat map widget: 2 critical, 5 high                 │
│          ├─ Top risk: "SCADA compromise — financial impact $2M+"     │
│          ├─ 3 pending risk acceptances awaiting CISO approval        │
│          └─ Click notification badge: 3 items in approval queue      │
│                                                                      │
│  Step 3: Process Risk Acceptance                                     │
│          ├─ Open acceptance request: RISK-0023                       │
│          ├─ Review: "Accept residual risk on legacy HMI (SL1)"      │
│          ├─ Justification: "Replacement scheduled Q1 2027,           │
│          │   compensating controls in place"                         │
│          ├─ Approval chain: Risk Manager ✓ → CISO (pending)          │
│          ├─ [Approve] with comment: "Approved. Ensure compensating  │
│          │   controls are verified quarterly."                       │
│          └─ Acceptance recorded with audit trail                     │
│                                                                      │
│  Step 4: Generate Executive Report                                   │
│          ├─ Navigate to: Reports → Generate                          │
│          ├─ Template: "Executive Security Summary"                   │
│          ├─ Scope: All facilities, Q2 2026                           │
│          ├─ Include: Risk summary, assessment progress,              │
│          │   remediation status, trend charts                         │
│          ├─ Format: PDF                                              │
│          └─ [Generate] → job queued                                  │
│                                                                      │
│  Step 5: Download & Review Report                                    │
│          ├─ Notification: "Report ready" (within 30s)                │
│          ├─ Download PDF                                             │
│          ├─ Review: 12-page executive summary                        │
│          └─ Ready for board presentation                             │
│                                                                      │
│  RESULT: Risk acceptance processed, executive report generated,       │
│          board-ready materials prepared                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Journey: Asset Owner

### 6.1 Review & Approve Assessment Results

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY: Email notification → "Assessment complete for Plant Beta"     │
│  CONTEXT: Not a security specialist, needs clear summaries            │
│                                                                      │
│  Step 1: Follow Link to Assessment                                   │
│          ├─ Auto-login via SSO                                       │
│          ├─ Redirected to: Assessment Detail → Scorecard             │
│          ├─ View: Simple radar chart with color-coded gaps           │
│          └─ Plain-language summary: "Plant Beta meets SL1, needs    │
│              work to reach SL2 in 3 areas"                           │
│                                                                      │
│  Step 2: Review Key Findings                                         │
│          ├─ Click "View Findings" → filtered to this assessment      │
│          ├─ Sort by severity: Critical first                         │
│          ├─ Each finding shows: title, severity badge, status,       │
│          │   business impact (not technical jargon)                   │
│          └─ 12 findings: 2 critical, 4 high, 6 medium               │
│                                                                      │
│  Step 3: Review Remediation Plan                                     │
│          ├─ Navigate to: Remediation → "Plant Beta Hardening"        │
│          ├─ View: Timeline of actions with cost estimates            │
│          ├─ Total budget: $145,000 over 6 months                     │
│          ├─ Priority breakdown: Critical ($40K), High ($65K),        │
│          │   Medium ($40K)                                           │
│          └─ [Approve Budget] → records approval with timestamp       │
│                                                                      │
│  Step 4: Download Summary                                            │
│          ├─ [Download Report] → Executive Summary PDF                │
│          ├─ Includes: scorecard, key findings, remediation timeline, │
│          │   budget summary                                          │
│          └─ Share with management team offline                        │
│                                                                      │
│  RESULT: Assessment reviewed, remediation budget approved,            │
│          summary downloaded for stakeholder communication             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Cross-Cutting User Flows

### 7.1 Finding Lifecycle Flow

```
┌─────────┐     ┌──────┐     ┌────────────┐     ┌──────────────┐
│ Created │────►│ Open │────►│Acknowledged│────►│ Remediation  │
│(Draft)  │     │      │     │            │     │  Planned     │
└─────────┘     └──────┘     └────────────┘     └──────┬───────┘
                                                       │
                                              ┌────────▼────────┐
                                              │   In Progress    │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Verification    │
                                              │  Required        │
                                              └───┬─────────┬───┘
                                                  │         │
                                        ┌─────────▼┐   ┌───▼──────┐
                                        │ Verified │   │ Reopened │
                                        └────┬─────┘   └────┬─────┘
                                             │              │
                                        ┌────▼────┐    (back to
                                        │ Closed  │   In Progress)
                                        └─────────┘

  Alternative paths:
  • Acknowledged → Risk Accepted → Closed
  • Acknowledged → False Positive → Closed

  UI actions per transition:
  • Created → Open: [Submit] button (assessor)
  • Open → Acknowledged: [Acknowledge] button (asset owner/PM)
  • Acknowledged → Remediation Planned: [Plan Remediation] (PM)
  • In Progress → Verification Required: [Request Verification] (assignee)
  • Verification → Verified/Closed: [Verify & Close] (lead assessor)
  • Any → Comment: [Add Comment] (any participant)
```

### 7.2 Evidence Upload & Linking Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  TRIGGER: [Upload Evidence] from any context                         │
│                                                                      │
│  Step 1: Upload Dialog                                               │
│          ├─ Drag & drop zone OR [Browse Files]                      │
│          ├─ Multi-file upload supported                              │
│          ├─ Accepted: PDF, DOCX, XLSX, PNG, JPG, CSV, PCAP, XML    │
│          └─ Max 100MB per file                                       │
│                                                                      │
│  Step 2: Metadata (per file)                                         │
│          ├─ Title: editable (auto from filename)                     │
│          ├─ Type: dropdown (Document, Screenshot, Config, Log, etc.) │
│          ├─ Tags: multi-select chip input                            │
│          └─ Description: optional text area                          │
│                                                                      │
│  Step 3: Linking                                                     │
│          ├─ Link to: Finding / Assessment / Risk (type-ahead search) │
│          ├─ Multiple links allowed                                   │
│          └─ [Upload & Link]                                         │
│                                                                      │
│  PROCESSING:                                                         │
│  ├─ File uploaded to S3/MinIO (encrypted)                            │
│  ├─ SHA-256 hash computed                                            │
│  ├─ ClamAV virus scan                                                │
│  ├─ Chain of custody: "created" event                                │
│  └─ Links created in evidence.links table                            │
│                                                                      │
│  RESULT:                                                             │
│  ├─ Evidence card appears in linked entity's evidence section        │
│  ├─ Toast notification: "Evidence uploaded (hash: a1b2c3...)"        │
│  └─ Available in Evidence Repository for future linking              │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.3 Risk Acceptance Workflow (2-Party Approval)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TRIGGER: Risk Manager clicks [Request Acceptance] on a risk entry   │
│                                                                      │
│  Step 1: Risk Manager — Submit Acceptance Request                    │
│          ├─ Justification: text area (required)                      │
│          ├─ Compensating controls: text area                         │
│          ├─ Expiry date: date picker                                 │
│          ├─ Review date: date picker                                 │
│          └─ [Submit for Approval]                                    │
│                                                                      │
│  Step 2: System                                                      │
│          ├─ Determine approval chain based on risk level:            │
│          │   • High risk → Quality Manager approval                  │
│          │   • Critical risk → Tenant Owner approval                 │
│          ├─ Notification sent to approver(s)                         │
│          └─ Risk status: "Pending Acceptance"                        │
│                                                                      │
│  Step 3: Approver — Review & Decide                                  │
│          ├─ Notification: "Risk acceptance pending your approval"    │
│          ├─ Open risk detail → Acceptance tab                        │
│          ├─ Review: risk details, treatments attempted,              │
│          │   justification, compensating controls                    │
│          ├─ [Approve] or [Reject]                                    │
│          ├─ If approved: comment (optional)                          │
│          ├─ If rejected: reason (required)                           │
│          └─ Decision recorded in approval chain                      │
│                                                                      │
│  Step 4: System                                                      │
│          ├─ If approved:                                             │
│          │   • Risk treatment set to "accept"                        │
│          │   • Acceptance record created with expiry                 │
│          │   • Calendar reminder set for review date                 │
│          │   • Audit event: risk.accepted                            │
│          ├─ If rejected:                                             │
│          │   • Risk treatment remains unchanged                      │
│          │   • Notification to risk manager with rejection reason    │
│          │   • Audit event: risk.acceptance_rejected                 │
│          └─ Both parties notified of outcome                         │
│                                                                      │
│  RESULT: Audit trail complete, risk status updated,                   │
│          calendar reminders set for periodic review                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.4 Bulk Import Flow (Assets / Findings)

```
┌──────────────────────────────────────────────────────────────────────┐
│  TRIGGER: [Import] button on Assets or Findings index page           │
│                                                                      │
│  Step 1: Upload CSV                                                  │
│          ├─ Drag & drop or browse                                    │
│          ├─ Accepted: CSV, XLSX, JSON                                │
│          └─ Max 50MB                                                 │
│                                                                      │
│  Step 2: Column Mapping                                              │
│          ├─ Auto-detected mappings shown in table                    │
│          ├─ Source column → Target field (editable dropdowns)        │
│          ├─ Preview: first 5 rows with mapped values                 │
│          ├─ Required fields highlighted if unmapped                  │
│          └─ [Continue]                                               │
│                                                                      │
│  Step 3: Validation Preview                                          │
│          ├─ Full file parsed client-side                             │
│          ├─ Validation results table:                                │
│          │   ✓ 142 rows valid                                       │
│          │   ⚠ 3 rows with warnings (non-critical)                  │
│          │   ✗ 2 rows with errors (critical — will be skipped)      │
│          ├─ Click row to see error details                           │
│          ├─ Option: [Import valid rows only] or [Fix & re-upload]   │
│          └─ [Import]                                                 │
│                                                                      │
│  Step 4: Processing                                                  │
│          ├─ Progress bar: "Importing 142 assets..."                  │
│          ├─ Real-time count: 50/142... 100/142... 142/142           │
│          └─ Job completes                                            │
│                                                                      │
│  Step 5: Results                                                     │
│          ├─ Summary: "140 imported, 2 skipped, 3 warnings"          │
│          ├─ [Download error report] (CSV with error details)         │
│          ├─ [View imported assets] → navigate to filtered list       │
│          └─ Import job recorded in audit log                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.5 Assessment Wizard Flow (Question-by-Question)

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYOUT: Assessment Questions Tab                                    │
│                                                                      │
│  ┌─ Progress Bar ───────────────────────────────────────────────┐   │
│  │  ████████████████░░░░░░░░░░░░░░░░░░░░  18/48 (37.5%)       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─ Section Navigation ─┐  ┌─ Question Area ────────────────────┐  │
│  │                       │  │                                    │  │
│  │ FR1: Identification  │  │  SR 3.4.2                          │  │
│  │  ✓ 6/6               │  │  "Are integrity checks performed   │  │
│  │                       │  │   on configuration data loaded     │  │
│  │ FR2: Use Control     │  │   into the IACS?"                  │  │
│  │  ✓ 8/8               │  │                                    │  │
│  │                       │  │  ┌────────────────────────────┐   │  │
│  │ FR3: System Integrity│  │  │ 💡 Guidance: This includes  │   │  │
│  │  ▶ 4/8 (current)     │  │  │ checksums, digital signa-   │   │  │
│  │                       │  │  │ tures, or hash verification │   │  │
│  │ FR4: Data Confidential│  │  └────────────────────────────┘   │  │
│  │  ○ 0/6               │  │                                    │  │
│  │                       │  │  Maturity Level:                   │  │
│  │ FR5: Restrict Flow   │  │  ○ Implemented                    │  │
│  │  ○ 0/10              │  │  ● Partially Implemented          │  │
│  │                       │  │  ○ Not Implemented                │  │
│  │ FR6: Timely Response │  │  ○ N/A                             │  │
│  │  ○ 0/4               │  │                                    │  │
│  │                       │  │  Score: [1] / 4                   │  │
│  │ FR7: Resource Avail. │  │                                    │  │
│  │  ○ 0/6               │  │  Assessor Notes:                  │  │
│  │                       │  │  ┌────────────────────────────┐   │  │
│  └───────────────────────┘  │  │ PLC config backups exist   │   │  │
│                             │  │ but no integrity verify... │   │  │
│                             │  └────────────────────────────┘   │  │
│                             │                                    │  │
│                             │  Evidence: [+ Attach]              │  │
│                             │  📎 hmi_config_screenshot.png     │  │
│                             │                                    │  │
│                             │  [Create Finding]                  │  │
│                             │                                    │  │
│                             │  [← Previous]    [Save & Next →]  │  │
│                             └────────────────────────────────────┘  │
│                                                                      │
│  Navigation:                                                         │
│  • Section nav: click to jump to any section                         │
│  • Previous/Next: sequential question navigation                     │
│  • Keyboard: ← → arrow keys for prev/next                            │
│  • Auto-save: responses saved on blur (debounced 500ms)              │
│  • Progress indicators: ✓ complete, ▶ current, ○ not started        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Error & Edge Case Flows

### 8.1 Offline Mode Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  DETECTION: Network connectivity lost                                │
│                                                                      │
│  Step 1: Visual Indicator                                            │
│          ├─ Top bar sync icon: 🟢 → 🔴 Offline                      │
│          ├─ Toast: "You are offline. Changes will sync when          │
│          │   connectivity is restored."                               │
│          └─ Offline banner appears at top of content area            │
│                                                                      │
│  Step 2: Continued Operation                                         │
│          ├─ All read operations use cached data                      │
│          ├─ Write operations stored in IndexedDB queue               │
│          ├─ Queue counter shows in sync icon: 🔴 (3 pending)        │
│          ├─ Evidence uploads deferred (large files)                  │
│          └─ New evidence stored locally with placeholder             │
│                                                                      │
│  Step 3: Reconnection                                                │
│          ├─ Auto-detect connectivity restored                        │
│          ├─ Sync icon: 🔴 → 🟡 Syncing (3 items)                   │
│          ├─ Small items sync first (responses, findings)             │
│          ├─ Evidence files sync with progress per file               │
│          ├─ Conflict detection: if server data changed since         │
│          │   offline edit → conflict resolution dialog               │
│          └─ Sync icon: 🟢 Online (all synced)                       │
│                                                                      │
│  Step 4: Conflict Resolution (if needed)                             │
│          ├─ Dialog: "Conflict detected for F-2024-0042"             │
│          ├─ Side-by-side: Your changes vs Server changes             │
│          ├─ Options: [Keep Yours] [Keep Server] [Merge Manually]    │
│          └─ Resolution recorded in audit trail                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Permission Denied Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  TRIGGER: User attempts action without permission                    │
│                                                                      │
│  Scenario A: Hidden (preferred)                                      │
│  ├─ Button/action not rendered if user lacks permission              │
│  ├─ Nav items hidden per RBAC visibility matrix                      │
│  └─ Tab not shown if no sub-views accessible                         │
│                                                                      │
│  Scenario B: Visible but Disabled                                    │
│  ├─ Button shown but disabled with tooltip:                          │
│  │   "Requires 'finding:transition' permission"                      │
│  └─ Used when user might need to request access                      │
│                                                                      │
│  Scenario C: API-Level Denial (edge case)                            │
│  ├─ If permission changed after page load:                           │
│  ├─ API returns 403                                                  │
│  ├─ UI shows toast: "Permission denied. Contact your administrator."│
│  ├─ Action not applied (optimistic update rolled back)               │
│  └─ Page refresh recommended (shown in toast action)                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

_Next: [Wireframes →](wireframes.md)_
