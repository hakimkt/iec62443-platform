# Implementation Blueprint — API Requirements Per Screen

> Version: 1.0 | Status: Draft | Last Updated: 2026-08-01
> Maps every screen to its required API endpoints (all under `/api/v1`)

---

## Conventions

```
GET    → Data fetch (query)
POST   → Create / action (mutation)
PATCH  → Update (mutation)
PUT    → Replace (mutation)
DELETE → Remove (mutation)

WebSocket events are listed as: WS: event_name
```

---

## 1. Auth Screens

### 1.1 Login (`/auth/login`)

| Method | Endpoint              | Purpose                       | Response Used For             |
| ------ | --------------------- | ----------------------------- | ----------------------------- |
| POST   | `/auth/login`         | Email/password authentication | JWT tokens (access + refresh) |
| POST   | `/auth/mfa/challenge` | MFA verification (if enabled) | Completed JWT                 |

**WS events:** None

### 1.2 Register (`/auth/register`)

| Method | Endpoint             | Purpose                            |
| ------ | -------------------- | ---------------------------------- |
| POST   | `/auth/register`     | Create new user account            |
| POST   | `/auth/verify-email` | Email verification (if configured) |

### 1.3 MFA Setup (`/auth/mfa/setup`)

| Method | Endpoint           | Purpose                            |
| ------ | ------------------ | ---------------------------------- |
| POST   | `/auth/mfa/setup`  | Generate TOTP secret + QR code     |
| POST   | `/auth/mfa/verify` | Verify TOTP code to complete setup |

### 1.4 Forgot/Reset Password

| Method | Endpoint                | Purpose                            |
| ------ | ----------------------- | ---------------------------------- |
| POST   | `/auth/forgot-password` | Send password reset email          |
| POST   | `/auth/reset-password`  | Complete password reset with token |

---

## 2. Executive Dashboard (`/app/dashboard`)

| Method | Endpoint                                                      | Purpose                                               | Widget              |
| ------ | ------------------------------------------------------------- | ----------------------------------------------------- | ------------------- |
| GET    | `/dashboard/summary`                                          | KPI data (score, findings, risks, remediation counts) | All 4 KPI cards     |
| GET    | `/assessments/:id/scorecard`                                  | Scorecard for latest assessment                       | SL Radar Chart      |
| GET    | `/assessments?status=in_progress&sort=-updated_at&per_page=5` | Active assessments list                               | Assessment Progress |
| GET    | `/dashboard/risk-heatmap`                                     | Aggregated risk data by likelihood×impact             | Risk Heat Map       |
| GET    | `/findings?sort=-created_at&per_page=5`                       | Recent findings                                       | Recent Findings     |
| GET    | `/dashboard/remediation-status`                               | Remediation actions timeline data                     | Gantt Chart         |

**WS events:** `finding.updated`, `assessment.progress`, `risk.level_changed`, `remediation.milestone`

**Refresh:** KPIs every 5 min, findings/risks real-time, others on load + manual refresh

---

## 3. Assessment Management (`/app/assessments`)

### 3.1 List View

| Method | Endpoint                                                                             | Purpose                         |
| ------ | ------------------------------------------------------------------------------------ | ------------------------------- |
| GET    | `/assessments?page=&per_page=&sort=&filter[type]=&filter[status]=&filter[iec_part]=` | List assessments with filters   |
| GET    | `/assessment-templates`                                                              | Template list (for info badges) |

### 3.2 New Assessment Wizard (`/app/assessments/new`)

| Method | Endpoint                | Purpose                      | Step         |
| ------ | ----------------------- | ---------------------------- | ------------ |
| GET    | `/assessment-templates` | Available templates          | Step 4       |
| GET    | `/assets?type=system`   | Available systems/facilities | Step 3       |
| POST   | `/assessments`          | Create new engagement        | Final submit |

### 3.3 Assessment Detail (`/app/assessments/:id`)

**Summary Tab:**

| Method | Endpoint                    | Purpose                        |
| ------ | --------------------------- | ------------------------------ |
| GET    | `/assessments/:id`          | Assessment metadata            |
| GET    | `/assessments/:id/progress` | Progress data (answered/total) |

**Questions Tab** (`/app/assessments/:id/questions`):

| Method | Endpoint                                    | Purpose                |
| ------ | ------------------------------------------- | ---------------------- |
| GET    | `/assessments/:id/questions`                | List all questions     |
| GET    | `/assessments/:id/questions/:qId`           | Single question        |
| PUT    | `/assessments/:id/questions/:qId/response`  | Submit response        |
| POST   | `/assessments/:id/questions/batch-response` | Batch submit responses |

**Scorecard Tab** (`/app/assessments/:id/scorecard`):

| Method | Endpoint                     | Purpose                        |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/assessments/:id/scorecard` | Scorecard data (per-FR scores) |

**Findings Tab** (`/app/assessments/:id/findings`):

| Method | Endpoint                              | Purpose         |
| ------ | ------------------------------------- | --------------- |
| GET    | `/findings?filter[engagement_id]=:id` | Linked findings |

**Export Tab** (`/app/assessments/:id/export`):

| Method | Endpoint                    | Purpose                  |
| ------ | --------------------------- | ------------------------ |
| POST   | `/assessments/:id/export`   | Trigger export           |
| POST   | `/assessments/:id/complete` | Mark assessment complete |

### 3.4 Template Library (`/app/assessments/templates`)

| Method | Endpoint                    | Purpose                |
| ------ | --------------------------- | ---------------------- |
| GET    | `/assessment-templates`     | List templates         |
| POST   | `/assessment-templates`     | Create custom template |
| GET    | `/assessment-templates/:id` | Template detail        |

---

## 4. Requirement Library (`/app/requirements`)

| Method | Endpoint                                          | Purpose                                     |
| ------ | ------------------------------------------------- | ------------------------------------------- |
| GET    | `/requirements?filter[iec_part]=:part`            | Requirements for a part                     |
| GET    | `/requirements/:id`                               | Single requirement detail                   |
| GET    | `/requirements/search?q=`                         | Full-text search across requirements        |
| GET    | `/assessments?filter[response][question_id]=:qId` | Findings where this requirement is assessed |

---

## 5. Asset Inventory (`/app/assets`)

### 5.1 List View

| Method | Endpoint                                                                                         | Purpose                           |
| ------ | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| GET    | `/assets?page=&per_page=&sort=&filter[type]=&filter[criticality]=&filter[purdue_level]=&search=` | List assets                       |
| GET    | `/assets/stats`                                                                                  | Asset type counts (for stats row) |

### 5.2 Asset Detail (`/app/assets/:id`)

| Method | Endpoint                    | Purpose                       |
| ------ | --------------------------- | ----------------------------- |
| GET    | `/assets/:id`               | Asset detail                  |
| GET    | `/assets/:id/relationships` | Asset connections             |
| GET    | `/assets/:id/findings`      | Findings linked to this asset |

### 5.3 Asset Import (`/app/assets/import`)

| Method | Endpoint                | Purpose                    |
| ------ | ----------------------- | -------------------------- |
| POST   | `/assets/import`        | Submit CSV/JSON for import |
| GET    | `/assets/import/:jobId` | Check import job status    |

---

## 6. Purdue Model (`/app/purdue`)

### 6.1 List View

| Method | Endpoint         | Purpose            |
| ------ | ---------------- | ------------------ |
| GET    | `/purdue-models` | List Purdue models |

### 6.2 Model Detail (`/app/purdue/:id`)

| Method | Endpoint                        | Purpose                  |
| ------ | ------------------------------- | ------------------------ |
| GET    | `/purdue-models/:id`            | Model metadata           |
| GET    | `/purdue-models/:id/levels`     | Level definitions        |
| GET    | `/purdue-models/:id/assets`     | Assets mapped to levels  |
| GET    | `/purdue-models/:id/rules`      | Communication rules      |
| GET    | `/purdue-models/:id/compliance` | Compliance check results |

### 6.3 Communication Rules (`/app/purdue/:id/rules`)

| Method | Endpoint                        | Purpose     |
| ------ | ------------------------------- | ----------- |
| POST   | `/purdue-models/:id/rules`      | Create rule |
| PATCH  | `/purdue-models/:id/rules/:rId` | Update rule |

---

## 7. Zone & Conduit Management (`/app/zones`)

### 7.1 List View

| Method | Endpoint    | Purpose       |
| ------ | ----------- | ------------- |
| GET    | `/zones`    | List zones    |
| GET    | `/conduits` | List conduits |

### 7.2 Zone Designer (`/app/zones/designer`)

| Method | Endpoint         | Purpose                                   |
| ------ | ---------------- | ----------------------------------------- |
| GET    | `/zone-topology` | Full topology (zones + conduits + layout) |
| PUT    | `/zone-topology` | Update layout positions                   |
| POST   | `/zones`         | Create zone                               |
| PATCH  | `/zones/:id`     | Update zone                               |
| POST   | `/conduits`      | Create conduit                            |
| PATCH  | `/conduits/:id`  | Update conduit                            |

### 7.3 Zone Detail (`/app/zones/:id`)

| Method | Endpoint                        | Purpose            |
| ------ | ------------------------------- | ------------------ |
| GET    | `/zones/:id`                    | Zone detail        |
| GET    | `/zones/:id/assets`             | Zone members       |
| POST   | `/zones/:id/assets`             | Assign asset       |
| DELETE | `/zones/:id/assets/:assetId`    | Remove asset       |
| GET    | `/zones/:id/conduits`           | Connected conduits |
| GET    | `/zones/:id/segmentation-rules` | Segmentation rules |

---

## 8. Risk Register (`/app/risks`)

### 8.1 List View

| Method | Endpoint                                                                                        | Purpose        |
| ------ | ----------------------------------------------------------------------------------------------- | -------------- |
| GET    | `/risk-registers`                                                                               | List registers |
| GET    | `/risk-registers/:id/risks?page=&per_page=&filter[level]=&filter[category]=&filter[treatment]=` | List risks     |
| GET    | `/risk-registers/:id/heatmap`                                                                   | Heat map data  |

### 8.2 Risk Matrix View (`/app/risks/matrix`)

| Method | Endpoint                      | Purpose                                 |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/risk-registers/:id/matrix`  | Risk matrix config (labels, thresholds) |
| GET    | `/risk-registers/:id/heatmap` | Aggregated heat map data                |
| PUT    | `/risk-registers/:id/matrix`  | Update matrix config                    |

### 8.3 Risk Detail (`/app/risks/:id`)

| Method | Endpoint                     | Purpose                |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/risks/:id`                 | Risk detail            |
| PATCH  | `/risks/:id`                 | Update risk            |
| POST   | `/risks/:id/treatments`      | Create treatment       |
| GET    | `/risks/:id/treatments`      | List treatments        |
| PATCH  | `/risks/:id/treatments/:tId` | Update treatment       |
| POST   | `/risks/:id/accept`          | Submit risk acceptance |
| GET    | `/risks/:id/acceptances`     | List acceptances       |

---

## 9. Finding Management (`/app/findings`)

### 9.1 List View

| Method | Endpoint                                                                                           | Purpose        |
| ------ | -------------------------------------------------------------------------------------------------- | -------------- |
| GET    | `/findings?page=&per_page=&sort=&filter[severity]=&filter[status]=&filter[engagement_id]=&search=` | List findings  |
| POST   | `/findings`                                                                                        | Create finding |

### 9.2 Finding Detail (`/app/findings/:id`)

| Method | Endpoint                   | Purpose              |
| ------ | -------------------------- | -------------------- |
| GET    | `/findings/:id`            | Finding detail       |
| PATCH  | `/findings/:id`            | Update finding       |
| POST   | `/findings/:id/transition` | Change status        |
| GET    | `/findings/:id/history`    | Status history       |
| POST   | `/findings/:id/comments`   | Add comment          |
| GET    | `/findings/:id/comments`   | List comments        |
| POST   | `/findings/:id/evidence`   | Link evidence        |
| GET    | `/findings/:id/evidence`   | List linked evidence |

### 9.3 Bulk Import (`/app/findings/import`)

| Method | Endpoint                | Purpose                     |
| ------ | ----------------------- | --------------------------- |
| POST   | `/findings/bulk-import` | Submit bulk findings import |
| GET    | `/jobs/:jobId`          | Check import job status     |

---

## 10. Evidence Repository (`/app/evidence`)

### 10.1 List View

| Method | Endpoint                                                        | Purpose             |
| ------ | --------------------------------------------------------------- | ------------------- |
| GET    | `/evidence?page=&per_page=&filter[type]=&filter[tags]=&search=` | List evidence       |
| GET    | `/tenant/storage`                                               | Storage quota usage |

### 10.2 Upload (`/app/evidence/upload`)

| Method | Endpoint             | Purpose                 |
| ------ | -------------------- | ----------------------- |
| POST   | `/evidence`          | Upload file (multipart) |
| POST   | `/evidence/:id/link` | Link to entity          |

### 10.3 Evidence Detail (`/app/evidence/:id`)

| Method | Endpoint                         | Purpose                                 |
| ------ | -------------------------------- | --------------------------------------- |
| GET    | `/evidence/:id`                  | Metadata                                |
| PATCH  | `/evidence/:id`                  | Update metadata                         |
| GET    | `/evidence/:id/file`             | Download file (pre-signed URL redirect) |
| GET    | `/evidence/:id/chain-of-custody` | Custody events                          |
| GET    | `/evidence/:id/verify`           | Verify integrity hash                   |

---

## 11. Remediation Tracker (`/app/remediation`)

### 11.1 List View

| Method | Endpoint                        | Purpose               |
| ------ | ------------------------------- | --------------------- |
| GET    | `/remediation-plans`            | List plans            |
| GET    | `/dashboard/remediation-status` | Summary for KPI cards |

### 11.2 Plan Detail (`/app/remediation/:id`)

| Method | Endpoint                          | Purpose           |
| ------ | --------------------------------- | ----------------- |
| GET    | `/remediation-plans/:id`          | Plan detail       |
| PATCH  | `/remediation-plans/:id`          | Update plan       |
| GET    | `/remediation-plans/:id/actions`  | List actions      |
| POST   | `/remediation-plans/:id/actions`  | Create action     |
| PATCH  | `/remediation-actions/:id`        | Update action     |
| POST   | `/remediation-actions/:id/verify` | Verify completion |

---

## 12. CSMS Management (`/app/csms`)

| Method | Endpoint                          | Purpose                 |
| ------ | --------------------------------- | ----------------------- |
| GET    | `/csms`                           | List frameworks         |
| GET    | `/csms/:id`                       | Framework detail        |
| GET    | `/csms/:id/elements`              | CSMS elements           |
| PATCH  | `/csms/:id/elements/:eId`         | Update element          |
| POST   | `/csms/:id/policies`              | Create policy           |
| GET    | `/csms/:id/policies`              | List policies           |
| PATCH  | `/csms/:id/policies/:pId`         | Update policy           |
| POST   | `/csms/:id/policies/:pId/approve` | Approve policy          |
| GET    | `/csms/:id/gap-analysis`          | Gap analysis data       |
| POST   | `/csms/:id/improvement-plans`     | Create improvement plan |

---

## 13. Report Generator (`/app/reports`)

### 13.1 List View

| Method | Endpoint                   | Purpose                |
| ------ | -------------------------- | ---------------------- |
| GET    | `/reports?page=&per_page=` | List generated reports |
| GET    | `/reports/templates`       | List report templates  |

### 13.2 Generate Report (`/app/reports/generate`)

| Method | Endpoint                | Purpose                      |
| ------ | ----------------------- | ---------------------------- |
| POST   | `/reports/generate`     | Submit report generation job |
| GET    | `/reports/:id`          | Check report status          |
| GET    | `/reports/:id/download` | Download generated report    |

**WS events:** `report.completed`

---

## 14. Administration

### 14.1 Members (`/app/admin/members`)

| Method | Endpoint                       | Purpose       |
| ------ | ------------------------------ | ------------- |
| GET    | `/tenants/:id/members`         | List members  |
| POST   | `/tenants/:id/members`         | Invite member |
| PATCH  | `/tenants/:id/members/:userId` | Update role   |
| DELETE | `/tenants/:id/members/:userId` | Remove member |

### 14.2 Roles (`/app/admin/roles`)

| Method | Endpoint     | Purpose            |
| ------ | ------------ | ------------------ |
| GET    | `/roles`     | List roles         |
| POST   | `/roles`     | Create custom role |
| PATCH  | `/roles/:id` | Update role        |

### 14.3 Integrations (`/app/admin/integrations`)

| Method | Endpoint            | Purpose               |
| ------ | ------------------- | --------------------- |
| GET    | `/integrations`     | List integrations     |
| POST   | `/integrations`     | Configure integration |
| DELETE | `/integrations/:id` | Remove integration    |

### 14.4 API Keys (`/app/admin/api-keys`)

| Method | Endpoint        | Purpose    |
| ------ | --------------- | ---------- |
| GET    | `/api-keys`     | List keys  |
| POST   | `/api-keys`     | Create key |
| DELETE | `/api-keys/:id` | Revoke key |

### 14.5 Audit Log (`/app/admin/audit-log`)

| Method | Endpoint                                                                                       | Purpose                     |
| ------ | ---------------------------------------------------------------------------------------------- | --------------------------- |
| GET    | `/audit-log?page=&per_page=&filter[event_type]=&filter[entity_type]=&filter[user_id]=&search=` | Query audit log             |
| GET    | `/audit-log/export`                                                                            | Export audit log            |
| GET    | `/audit-log/entities/:type/:id`                                                                | Entity-specific audit trail |

### 14.6 Webhooks (`/app/admin/webhooks`)

| Method | Endpoint        | Purpose        |
| ------ | --------------- | -------------- |
| GET    | `/webhooks`     | List webhooks  |
| POST   | `/webhooks`     | Create webhook |
| PATCH  | `/webhooks/:id` | Update webhook |
| DELETE | `/webhooks/:id` | Delete webhook |

### 14.7 Settings (`/app/admin/settings`)

| Method | Endpoint       | Purpose                |
| ------ | -------------- | ---------------------- |
| GET    | `/tenants/:id` | Tenant settings        |
| PATCH  | `/tenants/:id` | Update tenant settings |

---

## 15. Global / Shell

### 15.1 Global Search (Cmd+K)

| Method | Endpoint                                         | Purpose               |
| ------ | ------------------------------------------------ | --------------------- |
| GET    | `/search?q=&types=finding,assessment,asset,risk` | Global search results |

### 15.2 Notifications

| Method | Endpoint                                 | Purpose           |
| ------ | ---------------------------------------- | ----------------- |
| GET    | `/notifications?unread=true&per_page=20` | Notification list |
| POST   | `/notifications/:id/read`                | Mark as read      |
| POST   | `/notifications/read-all`                | Mark all read     |

### 15.3 Theme

| Method | Endpoint       | Purpose                          |
| ------ | -------------- | -------------------------------- |
| —      | `localStorage` | Theme preference (no API needed) |

---

## 16. Client Dashboard (`/app/clients/:id`)

| Method | Endpoint                   | Purpose                   |
| ------ | -------------------------- | ------------------------- |
| GET    | `/tenants/:id`             | Client metadata           |
| GET    | `/tenants/:id/dashboard`   | Aggregated client metrics |
| GET    | `/tenants/:id/assessments` | Client assessments        |

---

## API Endpoint Summary

| Screen           | GET    | POST   | PATCH  | PUT   | DELETE | WS Events |
| ---------------- | ------ | ------ | ------ | ----- | ------ | --------- |
| Login/Register   | 0      | 3      | 0      | 0     | 0      | 0         |
| Dashboard        | 6      | 0      | 0      | 0     | 0      | 4         |
| Assessments      | 10     | 3      | 1      | 2     | 0      | 1         |
| Requirements     | 3      | 0      | 0      | 0     | 0      | 0         |
| Assets           | 5      | 2      | 1      | 0     | 0      | 0         |
| Purdue Model     | 6      | 1      | 1      | 1     | 0      | 0         |
| Zones & Conduits | 7      | 2      | 2      | 1     | 1      | 0         |
| Risk Register    | 7      | 2      | 2      | 1     | 1      | 1         |
| Findings         | 7      | 4      | 2      | 0     | 0      | 1         |
| Evidence         | 5      | 2      | 1      | 0     | 0      | 0         |
| Remediation      | 4      | 2      | 2      | 0     | 0      | 1         |
| CSMS             | 7      | 3      | 2      | 0     | 0      | 0         |
| Reports          | 3      | 2      | 0      | 0     | 1      | 1         |
| Administration   | 8      | 3      | 2      | 0     | 1      | 0         |
| **Total**        | **81** | **29** | **16** | **6** | **5**  | **8**     |

---

_Next: [Database Dependencies →](database-dependencies.md)_
