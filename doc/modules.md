# IEC 62443 Platform — Module Breakdown

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. Module Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IEC 62443 PLATFORM MODULES                       │
├────────────────────┬────────────────────┬───────────────────────────┤
│   Core Domain      │   Supporting       │   Platform                │
│                    │                    │                           │
│  • Assessment      │  • Evidence        │  • Auth & Identity        │
│  • Risk Mgmt       │  • Remediation     │  • Tenant Management      │
│  • Zone & Conduit  │  • Reporting       │  • Audit & Compliance     │
│  • Purdue Model    │  • Notifications   │  • Integration Hub        │
│  • CSMS            │  • Asset Mgmt      │  • Offline Sync           │
│  • Findings        │                    │  • Licensing              │
└────────────────────┴────────────────────┴───────────────────────────┘
```

---

## 2. Core Domain Modules

### 2.1 Assessment Module

**Bounded Context:** `assessment`
**IEC 62443 Reference:** Part 3-2 (Security levels), Part 3-3 (System security requirements)

#### Responsibilities

- Create and manage assessment engagements
- Configure assessment scope (which IEC 62443 parts/clauses to assess)
- Define assessment templates aligned to IEC 62443 SL-T (target security level)
- Track assessment progress and completion status
- Support multiple assessment methodologies (gap analysis, maturity, compliance)
- Version assessment results for historical comparison

#### Key Entities

| Entity                | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `Assessment`          | Top-level engagement; scoped to a system/facility                  |
| `AssessmentTemplate`  | Reusable questionnaire templates (IEC 62443-3-2, -3-3, -4-1, -4-2) |
| `AssessmentQuestion`  | Individual requirement/countermeasure to evaluate                  |
| `AssessmentResponse`  | Assessor's evaluation of a question                                |
| `AssessmentScorecard` | Aggregated scoring (current SL, target SL, gap)                    |
| `AssessmentMilestone` | Progress tracking checkpoints                                      |

#### Assessment Types

| Type                 | IEC 62443 Part | Purpose                                                 |
| -------------------- | -------------- | ------------------------------------------------------- |
| Gap Assessment       | 3-2            | Identify gaps between current and target security level |
| System Assessment    | 3-3            | Evaluate system-level security requirements             |
| Component Assessment | 4-2            | Evaluate product/component security capabilities        |
| CSMS Assessment      | 2-1            | Assess cybersecurity management system maturity         |
| Custom Assessment    | —              | Client-specific assessment frameworks                   |

#### Scoring Model

```
Security Level (SL) Scale:
  SL 0 — No security
  SL 1 — Protection against casual/coincidental violation
  SL 2 — Protection against intentional violation with simple means
  SL 3 — Protection against intentional violation with sophisticated means
  SL 4 — Protection against nation-state level attacks

Per-requirement scoring:
  - Current Capability Level (CL): 0–4
  - Target Security Level (SL-T): 0–4
  - Gap = SL-T − CL (positive = gap exists)
  - Maturity indicators: Implemented / Partially Implemented / Not Implemented / N/A
```

---

### 2.2 Risk Management Module

**Bounded Context:** `risk`
**IEC 62443 Reference:** Part 3-2 (Risk-based approach), ISO 27005 alignment

#### Responsibilities

- Maintain the OT risk register
- Perform risk identification, analysis, and evaluation
- Define risk treatment plans (mitigate, transfer, accept, avoid)
- Calculate inherent and residual risk scores
- Map risks to IEC 62443 security levels and requirements
- Risk heat map and dashboard visualization
- Support risk reassessment workflows

#### Key Entities

| Entity           | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| `RiskRegister`   | Container for all risks within a scope                         |
| `Risk`           | Individual risk with likelihood, impact, and treatment         |
| `RiskCategory`   | Classification (safety, operational, environmental, financial) |
| `RiskAssessment` | Point-in-time risk evaluation                                  |
| `RiskTreatment`  | Planned or applied treatment action                            |
| `RiskAcceptance` | Formal risk acceptance with approval chain                     |
| `ThreatScenario` | Threat modeling linked to risks                                |
| `RiskMatrix`     | Configurable likelihood × impact matrix                        |

#### Risk Scoring

```
Risk Score = Likelihood × Impact

Likelihood Scale (1–5):
  1 — Rare (unlikely in system lifetime)
  2 — Unlikely (may occur once in 10+ years)
  3 — Possible (may occur once in 1–10 years)
  4 — Likely (expected to occur within 1 year)
  5 — Almost certain (occurs regularly)

Impact Scale (1–5):
  1 — Negligible (no safety/operational impact)
  2 — Minor (temporary operational disruption)
  3 — Moderate (significant disruption, no safety impact)
  4 — Major (extended disruption, potential safety impact)
  5 — Catastrophic (safety incident, environmental damage)

Risk Appetite Thresholds:
  Low (1–4):     Acceptable, monitor
  Medium (5–9):  Tolerable with treatment plan
  High (10–15):  Requires immediate action
  Critical (16–25): Unacceptable, halt until treated
```

---

### 2.3 Zone & Conduit Module

**Bounded Context:** `zone_conduit`
**IEC 62443 Reference:** Part 3-2 (Zones and conduits model)

#### Responsibilities

- Define security zones with assigned security levels
- Model conduits (communication paths between zones)
- Assign assets to zones
- Validate zone boundaries against Purdue model layers
- Visualize zone/conduit topology diagrams
- Track conduit security requirements (encryption, authentication, monitoring)
- Zone segmentation compliance checking

#### Key Entities

| Entity               | Description                                         |
| -------------------- | --------------------------------------------------- |
| `Zone`               | Security zone with assigned SL, boundary definition |
| `Conduit`            | Communication path between two zones                |
| `ZoneHierarchy`      | Parent-child zone nesting (sub-zones)               |
| `ZoneMembership`     | Asset-to-zone assignment                            |
| `ConduitSecurityReq` | Security requirements for a conduit                 |
| `ZoneTopology`       | Visual layout / diagram coordinates                 |
| `SegmentationRule`   | Firewall/ACL rules enforcing zone boundaries        |

#### Zone Classification

```
Zone Types:
  • Process Control Zone
  • Safety Instrumented Zone
  • Manufacturing Operations Zone
  • Enterprise/IT Zone
  • DMZ (Industrial DMZ)
  • Remote Access Zone
  • Wireless Zone

Conduit Types:
  • Hardwired (physical connection)
  • Network (TCP/IP)
  • Wireless (Wi-Fi, cellular, radio)
  • Removable Media (USB, optical)
  • Human (operator carrying data)
```

---

### 2.4 Purdue Model Module

**Bounded Context:** `purdue`
**IEC 62443 Reference:** Part 3-2 (Reference architecture), ISA-95 alignment

#### Responsibilities

- Model the Purdue Enterprise Reference Architecture (PERA)
- Assign assets to Purdue levels (0–5)
- Validate communication paths against Purdue segmentation rules
- Visualize the Purdue model for each facility/system
- Support custom sub-levels (e.g., Level 3.5 for iDMZ)
- Generate Purdue compliance reports

#### Key Entities

| Entity               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `PurdueLevel`        | Standard levels (0–5, with optional sub-levels) |
| `PurdueModel`        | Instance of a Purdue model for a facility       |
| `PurdueAssetMapping` | Asset assignment to a Purdue level              |
| `CommunicationRule`  | Allowed/disallowed inter-level communications   |

#### Purdue Level Definitions

```
Level 5 — Enterprise Network (corporate IT, ERP, email)
Level 4 — Business Planning & Logistics (site-level business systems)
Level 3.5 — Industrial DMZ (proxies, jump hosts, data historians)
Level 3 — Manufacturing Operations (MES, SCADA servers, historians)
Level 2 — Area Supervisory Control (HMI, engineering workstations)
Level 1 — Basic Control (PLCs, RTUs, DCS controllers, VFDs)
Level 0 — Physical Process (sensors, actuators, drives, motors)
```

---

### 2.5 CSMS Module

**Bounded Context:** `csms`
**IEC 62443 Reference:** Part 2-1 (CSMS requirements)

#### Responsibilities

- Author and maintain CSMS policies and procedures
- Map CSMS elements to IEC 62443-2-1 requirements
- Track CSMS implementation status across the organization
- Manage policy review cycles and approval workflows
- Generate CSMS gap analysis reports
- Support continuous improvement tracking

#### Key Entities

| Entity              | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `CSMSFramework`     | Top-level CSMS instance for an organization            |
| `CSElement`         | Individual CSMS element (policy, procedure, guideline) |
| `CSRequirement`     | IEC 62443-2-1 requirement mapping                      |
| `CSPolicy`          | Policy document with version history                   |
| `CSProcedure`       | Implementation procedure linked to policy              |
| `CSGapAnalysis`     | Gap assessment against CSMS requirements               |
| `CSImprovementPlan` | Continuous improvement tracking                        |
| `CSReviewCycle`     | Periodic review schedule and records                   |

#### CSMS Categories (IEC 62443-2-1)

```
1. Risk Assessment
2. Addressing Risk
3. Segmentation
4. Security Policy
5. Organization & Awareness
6. Security Events
7. Contingency Planning
8. Maintenance & Repair
9. Configuration Management
10. Information Security
11. Physical Security
12. Remote Access
13. Patch Management
14. Account Management
```

---

### 2.6 Findings Module

**Bounded Context:** `findings`

#### Responsibilities

- Record assessment findings (vulnerabilities, gaps, observations)
- Classify findings by severity, category, and IEC 62443 requirement
- Link findings to risks, zones, assets, and evidence
- Track finding lifecycle (open → acknowledged → remediation → verified → closed)
- Support bulk finding import from vulnerability scanners
- Finding deduplication and merging

#### Key Entities

| Entity               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `Finding`            | Individual finding with severity, status, and metadata |
| `FindingCategory`    | Classification taxonomy                                |
| `FindingSeverity`    | Severity levels (Critical, High, Medium, Low, Info)    |
| `FindingEvidence`    | Link to supporting evidence                            |
| `FindingRemediation` | Remediation action linked to finding                   |
| `FindingAssignment`  | Assignment to responsible party                        |
| `FindingComment`     | Discussion thread on a finding                         |
| `FindingHistory`     | State transition audit trail                           |

#### Finding Lifecycle

```
[Created] ──► [Draft] ──► [Submitted] ──► [Acknowledged]
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                     [Remediation       [Risk Accepted]   [False Positive]
                      Planned]               │                │
                         │                   ▼                ▼
                         ▼               [Closed]         [Closed]
                   [In Progress]
                         │
                         ▼
                   [Verification
                    Required]
                         │
                    ┌────┴────┐
                    ▼         ▼
               [Verified]  [Reopened]
                    │         │
                    ▼         ▼
               [Closed]   [In Progress]
```

---

## 3. Supporting Modules

### 3.1 Evidence Module

**Bounded Context:** `evidence`

#### Responsibilities

- Upload, store, and manage evidence artifacts
- Support multiple evidence types (documents, screenshots, configs, logs)
- Cryptographic hashing for evidence integrity verification
- Chain of custody tracking
- Evidence linking to findings, assessments, and CSMS elements
- Retention policy enforcement

#### Key Entities

| Entity                   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `Evidence`               | Evidence record with metadata and integrity hash |
| `EvidenceFile`           | Binary file stored in object storage             |
| `EvidenceLink`           | Association between evidence and domain entities |
| `EvidenceChainOfCustody` | Access and transfer log                          |
| `EvidenceRetention`      | Retention policy and disposal schedule           |
| `EvidenceTag`            | Classification and tagging                       |

#### Evidence Types

```
• Configuration snapshots (firewall rules, PLC programs)
• Network captures (PCAP files)
• Screenshots (HMI screens, log entries)
• Documents (policies, procedures, contracts)
• Log exports (syslog, event logs)
• Scan results (vulnerability reports)
• Interview records (assessor notes)
• Certificate files (SSL/TLS, code signing)
```

---

### 3.2 Remediation Module

**Bounded Context:** `remediation`

#### Responsibilities

- Create and manage remediation plans for findings
- Track remediation progress with milestones
- Assign ownership and deadlines
- Budget and resource tracking
- Verify remediation effectiveness
- Integrate with external ticketing systems (Jira, Azure DevOps)

#### Key Entities

| Entity                    | Description                             |
| ------------------------- | --------------------------------------- |
| `RemediationPlan`         | Top-level plan grouping related actions |
| `RemediationAction`       | Individual action item                  |
| `RemediationMilestone`    | Progress checkpoint                     |
| `RemediationVerification` | Post-remediation validation             |
| `RemediationBudget`       | Cost tracking and approval              |
| `ExternalTicket`          | Link to external issue tracker          |

---

### 3.3 Asset Management Module

**Bounded Context:** `asset`

#### Responsibilities

- Maintain OT asset inventory
- Classify assets by type, criticality, and Purdue level
- Track asset attributes (vendor, model, firmware, serial)
- Import from CMDB and network discovery tools
- Asset lifecycle management
- Link assets to zones, risks, and findings

#### Key Entities

| Entity              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `Asset`             | Individual OT/IT asset                          |
| `AssetType`         | Classification (PLC, HMI, switch, server, etc.) |
| `AssetCriticality`  | Business/safety criticality rating              |
| `AssetFirmware`     | Firmware version tracking                       |
| `AssetNetworkInfo`  | IP, MAC, network segment                        |
| `AssetRelationship` | Asset-to-asset connections                      |
| `AssetImportJob`    | Bulk import tracking                            |

---

### 3.4 Reporting Module

**Bounded Context:** `reporting`

#### Responsibilities

- Generate IEC 62443 compliance reports
- Executive summary dashboards
- Risk heat maps and trend charts
- Assessment scorecards
- CSMS gap analysis reports
- Remediation progress reports
- Export to PDF, Excel, and presentation formats
- Customizable report templates

#### Report Types

```
• Assessment Summary Report
• Risk Register Report
• CSMS Gap Analysis Report
• Zone & Conduit Topology Report
• Purdue Model Compliance Report
• Remediation Status Report
• Executive Dashboard
• Audit Trail Report
• Certification Evidence Package
• Custom Client Report
```

---

## 4. Platform Modules

### 4.1 Auth & Identity Module

**Bounded Context:** `auth`

- User registration and authentication (email/password, SSO)
- OAuth2 / OIDC integration (Azure AD, Okta, Keycloak)
- Multi-factor authentication (TOTP, WebAuthn/FIDO2)
- Session management with secure token rotation
- Password policy enforcement
- Account lockout and brute-force protection

### 4.2 Tenant Management Module

**Bounded Context:** `tenant`

- Tenant provisioning and lifecycle
- Workspace configuration (branding, locale, timezone)
- Tenant-level settings management
- Subscription and billing integration
- Tenant isolation enforcement
- Data export and tenant migration

### 4.3 Audit & Compliance Module

**Bounded Context:** `audit`

- Immutable audit event logging (hash-chained)
- User activity tracking
- Data access logging
- Compliance reporting (who did what, when, on which data)
- Audit log retention and archival
- Audit log query and search

### 4.4 Integration Hub Module

**Bounded Context:** `integration`

- External system connector management
- API key and credential vault
- Webhook configuration and delivery
- Import/export job scheduling
- Integration health monitoring
- Data transformation mapping

### 4.5 Offline Sync Module

**Bounded Context:** `sync`

- Offline data capture queue (client-side IndexedDB)
- Conflict detection and resolution strategies
- Sync status tracking
- Delta synchronization protocol
- Offline-first UI state management
- Bandwidth-adaptive sync (large evidence files deferred)

### 4.6 Notification Module

**Bounded Context:** `notification`

- In-app notifications
- Email notifications (configurable per user)
- Notification templates and preferences
- Digest mode (daily/weekly summary)
- Escalation rules for overdue items
- Integration with Slack/Teams (webhook)

---

## 5. Module Dependency Matrix

```
              Auth  Tenant  Audit  Assess  Risk  Zone  Purdue  CSMS  Finding  Evidence  Remediation  Report  Asset
Auth           —     ●       ◌      ◌      ◌     ◌      ◌      ◌      ◌        ◌        ◌           ◌      ◌
Tenant         ●      —      ●      ◌      ◌     ◌      ◌      ◌      ◌        ◌        ◌           ◌      ◌
Audit          ●     ●        —     ●      ●     ●      ●      ●      ●        ●        ●           ●      ●
Assessment     ●     ●       ●       —     ◌     ◌      ◌      ◌      ◌        ◌        ◌           ◌      ◌
Risk           ●     ●       ●       ●      —    ●      ◌      ◌      ●        ◌        ●           ◌      ◌
Zone           ●     ●       ●       ◌      ◌      —     ●      ◌      ◌        ◌        ◌           ◌      ●
Purdue         ●     ●       ●       ◌      ◌     ●       —     ◌      ◌        ◌        ◌           ◌      ●
CSMS           ●     ●       ●       ●      ◌     ◌      ◌       —     ◌        ◌        ◌           ◌      ◌
Finding        ●     ●       ●       ●      ●     ●      ◌      ◌       —       ●        ●           ◌      ●
Evidence       ●     ●       ●       ◌      ◌     ◌      ◌      ◌      ●         —       ◌           ◌      ◌
Remediation    ●     ●       ●       ◌      ●     ◌      ◌      ◌      ●         ◌         —         ◌      ◌
Report         ●     ●       ●       ●      ●     ●      ●      ●      ●        ●        ●            —     ●
Asset          ●     ●       ●       ◌      ◌     ●      ●      ◌      ◌        ◌        ◌           ◌       —

● = Direct dependency    ◌ = No direct dependency
```

---

_Next: [Database Entity Model →](database-design.md)_
