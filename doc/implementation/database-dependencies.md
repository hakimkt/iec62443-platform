# Implementation Blueprint — Database Dependencies Per Screen

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Maps every screen to its required database entities (tenant schema unless noted)

---

## Conventions

```
Schema prefix:
  platform.    — Shared platform schema
  assessment.  — Assessment domain tables
  risk.        — Risk domain tables
  zone.        — Zone domain tables
  purdue.      — Purdue domain tables
  csms.        — CSMS domain tables
  findings.    — Finding domain tables
  evidence.    — Evidence domain tables
  remediation. — Remediation domain tables
  asset.       — Asset domain tables
```

---

## 1. Auth & Identity Screens

### Login / Register / MFA / Password Reset

| Entity (Schema)               | Purpose               | Operations                          |
| ----------------------------- | --------------------- | ----------------------------------- |
| `platform.users`              | User authentication   | READ, UPDATE (login, MFA, password) |
| `platform.tenants`            | Tenant lookup         | READ                                |
| `platform.tenant_memberships` | Role resolution       | READ                                |
| `platform.roles`              | Permission resolution | READ                                |
| `platform.user_roles`         | User-role assignment  | READ                                |
| `platform.audit_events`       | Auth event logging    | INSERT (login success/failure, MFA) |

### Tenant Resolution (Middleware)

| Entity                        | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `platform.tenants`            | Validate tenant exists, get schema_name |
| `platform.tenant_memberships` | Verify user is member of tenant         |

---

## 2. Executive Dashboard

| Entity                   | Purpose                             | Query Pattern                  |
| ------------------------ | ----------------------------------- | ------------------------------ |
| `assessment.engagements` | Assessment progress counts          | COUNT by status                |
| `assessment.responses`   | Answered question counts            | COUNT by engagement_id         |
| `assessment.scorecards`  | Latest scorecard data (radar chart) | Latest snapshot per engagement |
| `findings.findings`      | Open findings count by severity     | COUNT by severity, status      |
| `risk.entries`           | Active risks count by level         | COUNT by risk_level, status    |
| `risk.registers`         | Active register list                | LIST active registers          |
| `remediation.plans`      | Active remediation plans            | LIST active plans              |
| `remediation.actions`    | Action counts (overdue, total)      | COUNT by status, due_date      |
| `platform.audit_events`  | Recent activity (optional widget)   | Latest events by created_at    |

**Materialized views (optional for performance):**

- `mv_dashboard_summary` — Pre-aggregated KPI data, refreshed every 5 min
- `mv_risk_heatmap` — Pre-aggregated risk counts by cell, refreshed every 5 min

---

## 3. Assessment Management

### 3.1 List View

| Entity                   | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `assessment.engagements` | List assessments with pagination/filtering      |
| `assessment.templates`   | Template names for display                      |
| `assessment.responses`   | Progress counts (answered/total per engagement) |
| `assessment.scorecards`  | Latest score for display                        |
| `findings.findings`      | Finding counts per engagement                   |
| `risk.entries`           | Risk counts per engagement (via linking)        |

### 3.2 New Assessment Wizard

| Entity                   | Purpose                              |
| ------------------------ | ------------------------------------ |
| `assessment.templates`   | Template selection (Step 4)          |
| `assessment.questions`   | Question count for selected template |
| `assessment.engagements` | INSERT new engagement                |
| `asset.assets`           | System/facility selection (Step 3)   |

### 3.3 Assessment Detail

| Entity                   | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `assessment.engagements` | Assessment metadata                      |
| `assessment.questions`   | Questions for this assessment's template |
| `assessment.responses`   | Responses (CRUD)                         |
| `assessment.scorecards`  | Scorecard calculation                    |
| `findings.findings`      | Findings linked to this engagement       |

### 3.4 Template Library

| Entity                 | Purpose                    |
| ---------------------- | -------------------------- |
| `assessment.templates` | CRUD templates             |
| `assessment.questions` | Questions within templates |

---

## 4. Requirement Library

| Entity                 | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `assessment.templates` | Template-question mapping                              |
| `assessment.questions` | Requirement text, clause refs, guidance                |
| `assessment.responses` | Where this requirement was assessed (cross-reference)  |
| `findings.findings`    | Findings related to this requirement (cross-reference) |

**Note:** The requirement library is primarily static reference data. Questions are seeded from system templates. Custom questions can be added via template creation.

---

## 5. Asset Inventory

### 5.1 List View

| Entity             | Purpose                               |
| ------------------ | ------------------------------------- |
| `asset.assets`     | List assets with pagination/filtering |
| `zone.memberships` | Zone assignment (for zone column)     |
| `zone.zones`       | Zone names (join via memberships)     |

### 5.2 Asset Detail

| Entity                  | Purpose                       |
| ----------------------- | ----------------------------- |
| `asset.assets`          | Asset metadata                |
| `asset.relationships`   | Connected assets              |
| `zone.memberships`      | Zone assignments              |
| `zone.zones`            | Zone details                  |
| `purdue.asset_mappings` | Purdue level assignment       |
| `findings.findings`     | Findings affecting this asset |

### 5.3 Asset Import

| Entity              | Purpose                   |
| ------------------- | ------------------------- |
| `asset.assets`      | INSERT/UPDATE from import |
| `asset.import_jobs` | Track import job status   |

---

## 6. Purdue Model

### 6.1 Model Detail

| Entity                       | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `purdue.models`              | Model metadata                      |
| `purdue.levels`              | Level definitions (0–5, sub-levels) |
| `purdue.asset_mappings`      | Asset-to-level assignments          |
| `asset.assets`               | Asset details for rendering         |
| `purdue.communication_rules` | Allowed inter-level communications  |
| `zone.zones`                 | Zone positions (for overlay)        |

### 6.2 Compliance Check

| Entity                       | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `purdue.communication_rules` | Rules to check against                            |
| `asset.relationships`        | Asset connections to validate                     |
| `zone.conduits`              | Conduit definitions to validate                   |
| `zone.memberships`           | Asset-to-zone assignments (to infer Purdue level) |

---

## 7. Zone & Conduit Management

### 7.1 List View

| Entity             | Purpose               |
| ------------------ | --------------------- |
| `zone.zones`       | List zones            |
| `zone.conduits`    | List conduits         |
| `zone.memberships` | Asset counts per zone |

### 7.2 Zone Designer

| Entity                    | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `zone.zones`              | Zone data (position, size, SL, type, color)   |
| `zone.conduits`           | Conduit data (source, target, type, security) |
| `zone.memberships`        | Assets in each zone                           |
| `asset.assets`            | Asset details for rendering in zone nodes     |
| `zone.segmentation_rules` | Security rules for conduits                   |

### 7.3 Zone Detail

| Entity                    | Purpose             |
| ------------------------- | ------------------- |
| `zone.zones`              | Zone metadata       |
| `zone.memberships`        | Zone members        |
| `zone.conduits`           | Connected conduits  |
| `zone.segmentation_rules` | Rules for this zone |

---

## 8. Risk Register

### 8.1 List View

| Entity             | Purpose                             |
| ------------------ | ----------------------------------- |
| `risk.registers`   | Register metadata                   |
| `risk.entries`     | Risk list with pagination/filtering |
| `risk.treatments`  | Treatment status per risk           |
| `risk.acceptances` | Acceptance status per risk          |
| `asset.assets`     | Asset names (join via asset_ids)    |
| `zone.zones`       | Zone names (join via zone_ids)      |

### 8.2 Risk Matrix View

| Entity               | Purpose                           |
| -------------------- | --------------------------------- |
| `risk.entries`       | Grouped by likelihood × impact    |
| `risk.matrix_config` | Matrix labels, thresholds, colors |
| `risk.registers`     | Register scope                    |

### 8.3 Risk Detail

| Entity                | Purpose                                  |
| --------------------- | ---------------------------------------- |
| `risk.entries`        | Risk detail                              |
| `risk.treatments`     | Treatment actions                        |
| `risk.acceptances`    | Acceptance history                       |
| `findings.findings`   | Linked findings (via risk_ids array)     |
| `remediation.actions` | Linked remediation actions (via risk_id) |

---

## 9. Finding Management

### 9.1 List View

| Entity                    | Purpose                                |
| ------------------------- | -------------------------------------- |
| `findings.findings`       | Finding list with pagination/filtering |
| `findings.status_history` | Latest status for display              |
| `assessment.engagements`  | Engagement names (for source context)  |
| `asset.assets`            | Affected asset names (via asset_ids)   |

### 9.2 Finding Detail

| Entity                    | Purpose                       |
| ------------------------- | ----------------------------- |
| `findings.findings`       | Finding detail                |
| `findings.status_history` | Status change history         |
| `findings.comments`       | Discussion thread             |
| `evidence.links`          | Linked evidence IDs           |
| `evidence.items`          | Evidence metadata             |
| `remediation.actions`     | Linked remediation actions    |
| `risk.entries`            | Linked risks (via risk_ids)   |
| `asset.assets`            | Affected assets               |
| `zone.zones`              | Affected zones (via zone_ids) |

### 9.3 Bulk Import

| Entity              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `findings.findings` | Bulk INSERT                              |
| `evidence.items`    | Evidence linked during import (optional) |

---

## 10. Evidence Repository

### 10.1 List View

| Entity           | Purpose                                 |
| ---------------- | --------------------------------------- |
| `evidence.items` | Evidence list with pagination/filtering |
| `evidence.links` | Linked entity counts                    |
| `evidence.files` | Storage metadata                        |

### 10.2 Upload

| Entity                      | Purpose                            |
| --------------------------- | ---------------------------------- |
| `evidence.files`            | INSERT storage record              |
| `evidence.items`            | INSERT evidence record (with hash) |
| `evidence.links`            | INSERT links to entities           |
| `evidence.chain_of_custody` | INSERT "created" event             |

### 10.3 Evidence Detail

| Entity                      | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `evidence.items`            | Evidence metadata                       |
| `evidence.files`            | Storage key for download                |
| `evidence.links`            | Entity links                            |
| `evidence.chain_of_custody` | Custody history                         |
| `findings.findings`         | Linked findings (via evidence_links)    |
| `assessment.engagements`    | Linked assessments (via evidence_links) |

---

## 11. Remediation Tracker

### 11.1 List View

| Entity                | Purpose                |
| --------------------- | ---------------------- |
| `remediation.plans`   | Plan list              |
| `remediation.actions` | Action counts per plan |

### 11.2 Plan Detail

| Entity                      | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `remediation.plans`         | Plan metadata                           |
| `remediation.actions`       | Action items                            |
| `remediation.verifications` | Verification records                    |
| `findings.findings`         | Linked findings (via action.finding_id) |
| `risk.entries`              | Linked risks (via action.risk_id)       |

---

## 12. CSMS Management

| Entity                   | Purpose                       |
| ------------------------ | ----------------------------- |
| `csms.frameworks`        | Framework metadata            |
| `csms.elements`          | CSMS elements (14 categories) |
| `csms.policies`          | Policy documents              |
| `csms.improvement_plans` | Improvement tracking          |

---

## 13. Report Generator

| Entity                   | Purpose                     |
| ------------------------ | --------------------------- |
| `assessment.engagements` | Assessment data for reports |
| `assessment.scorecards`  | Scorecard data              |
| `findings.findings`      | Findings data               |
| `risk.entries`           | Risk data                   |
| `risk.registers`         | Register data               |
| `csms.frameworks`        | CSMS data                   |
| `csms.elements`          | Element data                |
| `remediation.plans`      | Remediation data            |
| `remediation.actions`    | Action data                 |

---

## 14. Administration

### 14.1 Members

| Entity                        | Purpose            |
| ----------------------------- | ------------------ |
| `platform.tenant_memberships` | Member list, roles |
| `platform.users`              | User details       |
| `platform.roles`              | Available roles    |
| `platform.user_roles`         | Role assignments   |

### 14.2 Roles

| Entity           | Purpose   |
| ---------------- | --------- |
| `platform.roles` | Role CRUD |

### 14.3 Integrations

| Entity                         | Purpose                           |
| ------------------------------ | --------------------------------- |
| `platform.integration_configs` | Integration settings (TBD schema) |
| `platform.api_keys`            | API key storage                   |

### 14.4 API Keys

| Entity              | Purpose   |
| ------------------- | --------- |
| `platform.api_keys` | CRUD keys |

### 14.5 Audit Log

| Entity                  | Purpose               |
| ----------------------- | --------------------- |
| `platform.audit_events` | Query, filter, export |

### 14.6 Webhooks

| Entity                     | Purpose                   |
| -------------------------- | ------------------------- |
| `platform.webhook_configs` | Webhook CRUD (TBD schema) |

### 14.7 Settings

| Entity             | Purpose                 |
| ------------------ | ----------------------- |
| `platform.tenants` | Tenant settings (JSONB) |

---

## 15. Entity Dependency Graph

```
Platform Schema (shared):
  tenants ──┬── tenant_memberships ── users
            │                        ├── roles
            │                        └── user_roles
            ├── audit_events
            ├── api_keys
            ├── integration_configs
            └── webhook_configs

Tenant Schema (per tenant):
  assessment.engagements ───┬── assessment.templates ─── assessment.questions
                            ├── assessment.responses ───┬── assessment.questions
                            │                           ├── evidence.items
                            │                           └── findings.findings
                            ├── assessment.scorecards
                            └── findings.findings

  findings.findings ────────┬── assessment.engagements
                            ├── evidence.links ─── evidence.items ─── evidence.files
                            ├── evidence.chain_of_custody
                            ├── findings.status_history
                            ├── findings.comments
                            ├── risk.entries
                            ├── asset.assets
                            └── remediation.actions

  risk.registers ───────────┬── risk.entries ───┬── risk.treatments
                            │                   ├── risk.acceptances
                            │                   ├── asset.assets
                            │                   └── zone.zones
                            └── risk.matrix_config
                            └── risk.treatments

  zone.zones ───────────────┬── zone.conduits
                            ├── zone.memberships ─── asset.assets
                            ├── zone.segmentation_rules
                            └── purdue.levels

  purdue.models ────────────┬── purdue.levels ─── purdue.asset_mappings ─── asset.assets
                            └── purdue.communication_rules

  csms.frameworks ──────────┬── csms.elements
                            ├── csms.policies
                            └── csms.improvement_plans

  remediation.plans ────────┬── remediation.actions ───┬── findings.findings
                            │                          ├── risk.entries
                            │                          └── remediation.verifications
                            └── asset.assets (budget link)

  asset.assets ─────────────┬── asset.relationships
                            ├── asset.import_jobs
                            ├── zone.memberships
                            ├── purdue.asset_mappings
                            └── findings.findings
```

---

## 16. Entity Implementation Priority

Entities are ordered by dependency (must exist before dependents):

| Priority             | Entities                                                                                                                              | Phase |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| P0 (Foundation)      | `platform.tenants`, `platform.users`, `platform.roles`, `platform.user_roles`, `platform.tenant_memberships`, `platform.audit_events` | 1     |
| P1 (Auth + Shell)    | `platform.api_keys`                                                                                                                   | 1     |
| P2 (Core Assessment) | `assessment.templates`, `assessment.questions`, `assessment.engagements`, `assessment.responses`, `assessment.scorecards`             | 2     |
| P3 (Findings)        | `findings.findings`, `findings.status_history`, `findings.comments`                                                                   | 2     |
| P4 (Assets)          | `asset.assets`, `asset.relationships`, `asset.import_jobs`                                                                            | 3     |
| P5 (Zones)           | `zone.zones`, `zone.conduits`, `zone.memberships`, `zone.segmentation_rules`                                                          | 3     |
| P6 (Purdue)          | `purdue.models`, `purdue.levels`, `purdue.asset_mappings`, `purdue.communication_rules`                                               | 3     |
| P7 (Risk)            | `risk.registers`, `risk.entries`, `risk.treatments`, `risk.acceptances`, `risk.matrix_config`                                         | 3     |
| P8 (Evidence)        | `evidence.files`, `evidence.items`, `evidence.links`, `evidence.chain_of_custody`                                                     | 3     |
| P9 (Remediation)     | `remediation.plans`, `remediation.actions`, `remediation.verifications`                                                               | 4     |
| P10 (CSMS)           | `csms.frameworks`, `csms.elements`, `csms.policies`, `csms.improvement_plans`                                                         | 4     |
| P11 (Admin)          | `platform.integration_configs`, `platform.webhook_configs`                                                                            | 4     |

---

_Next: [Development Sequence →](development-sequence.md)_
