# IEC 62443 Platform — API Architecture

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. API Design Principles

| Principle | Implementation |
|---|---|
| **RESTful** | Resource-oriented URLs, standard HTTP methods, HATEOAS links |
| **Versioned** | URL path versioning (`/api/v1/`) with header override support |
| **Consistent** | Uniform response envelope, pagination, error format |
| **Secure** | JWT auth, API key auth, TLS 1.3 mandatory, CORS strict |
| **Documented** | OpenAPI 3.1 specification auto-generated from code |
| **Rate limited** | Tiered rate limits per endpoint group and tenant plan |
| **Idempotent** | PUT/DELETE are idempotent; POST uses `Idempotency-Key` header |

---

## 2. Base URL & Versioning

```
Production:  https://api.iec62443-platform.io/api/v1
Staging:     https://api-staging.iec62443-platform.io/api/v1
On-prem:     https://{host}/api/v1

Version negotiation:
  1. URL path: /api/v1/assessments (preferred)
  2. Accept header: Accept: application/vnd.iec62443.v1+json
```

---

## 3. Authentication & Authorization

### 3.1 Authentication Methods

| Method | Use Case | Flow |
|---|---|---|
| **JWT Bearer** | Web/Mobile app users | OAuth2 Authorization Code + PKCE |
| **API Key** | Integrations, scripts | `X-API-Key: iec62443_xxxx` header |
| **OAuth2 Client Credentials** | Service-to-service | Machine-to-machine token exchange |

### 3.2 JWT Structure

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "tenant_slug": "acme-corp",
  "roles": ["assessor", "risk_manager"],
  "permissions": ["findings:write", "risks:read"],
  "exp": 1690000000,
  "iat": 1689996400,
  "jti": "unique-token-id"
}
```

### 3.3 Token Lifecycle

```
┌────────┐     ┌──────────┐     ┌────────────┐
│ Client │────►│ Auth API │────►│ Access JWT │ (15 min TTL)
│        │     │          │     │ + Refresh  │ (7 day TTL, rotated)
└────────┘     └──────────┘     └────────────┘
                                      │
                                 ┌────┴────┐
                                 │ Refresh │────► New Access JWT
                                 │ Token   │      + New Refresh (rotated)
                                 └─────────┘
```

---

## 4. Response Envelope

### 4.1 Success Response

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2026-07-31T10:00:00Z"
  },
  "links": {
    "self": "/api/v1/assessments/abc-123",
    "related": { ... }
  }
}
```

### 4.2 Collection Response (Paginated)

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 142,
    "total_pages": 6
  },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2026-07-31T10:00:00Z"
  },
  "links": {
    "self": "/api/v1/findings?page=1&per_page=25",
    "next": "/api/v1/findings?page=2&per_page=25",
    "last": "/api/v1/findings?page=6&per_page=25"
  }
}
```

### 4.3 Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "severity",
        "message": "Must be one of: critical, high, medium, low, informational"
      }
    ]
  },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2026-07-31T10:00:00Z"
  }
}
```

### 4.4 Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Request body/params failed validation |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Valid auth but insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | State conflict (duplicate, version mismatch) |
| 422 | UNPROCESSABLE | Semantically invalid (business rule violation) |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 503 | SERVICE_UNAVAILABLE | Temporary maintenance or degradation |

---

## 5. API Endpoints

### 5.1 Authentication & Identity

```
POST   /api/v1/auth/register                 Register new user
POST   /api/v1/auth/login                    Email/password login
POST   /api/v1/auth/login/sso               SSO initiation (SAML/OIDC)
POST   /api/v1/auth/refresh                  Refresh access token
POST   /api/v1/auth/logout                   Revoke refresh token
POST   /api/v1/auth/forgot-password          Send password reset email
POST   /api/v1/auth/reset-password           Complete password reset
POST   /api/v1/auth/mfa/setup                Initialize MFA enrollment
POST   /api/v1/auth/mfa/verify               Verify MFA setup
POST   /api/v1/auth/mfa/challenge            Respond to MFA challenge
DELETE  /api/v1/auth/mfa                      Disable MFA
```

### 5.2 Tenant Management

```
POST   /api/v1/tenants                       Create tenant (platform admin)
GET    /api/v1/tenants                       List tenants (platform admin)
GET    /api/v1/tenants/:id                   Get tenant details
PATCH  /api/v1/tenants/:id                   Update tenant settings
DELETE  /api/v1/tenants/:id                  Archive tenant

POST   /api/v1/tenants/:id/members           Invite member
GET    /api/v1/tenants/:id/members           List members
PATCH  /api/v1/tenants/:id/members/:userId   Update member role
DELETE  /api/v1/tenants/:id/members/:userId  Remove member
```

### 5.3 Assessments

```
POST   /api/v1/assessments                   Create engagement
GET    /api/v1/assessments                   List engagements
GET    /api/v1/assessments/:id               Get engagement
PATCH  /api/v1/assessments/:id               Update engagement
DELETE  /api/v1/assessments/:id              Delete engagement

POST   /api/v1/assessments/:id/duplicate     Clone engagement
POST   /api/v1/assessments/:id/complete      Mark as completed
GET    /api/v1/assessments/:id/scorecard     Get scorecard
GET    /api/v1/assessments/:id/progress      Get progress summary
POST   /api/v1/assessments/:id/export        Export assessment data

# Questions & Responses
GET    /api/v1/assessments/:id/questions           List questions
GET    /api/v1/assessments/:id/questions/:qId      Get question
PUT    /api/v1/assessments/:id/questions/:qId/response   Submit/update response
POST   /api/v1/assessments/:id/questions/batch-response  Batch submit responses

# Templates
GET    /api/v1/assessment-templates                List templates
POST   /api/v1/assessment-templates                Create custom template
GET    /api/v1/assessment-templates/:id            Get template
PATCH  /api/v1/assessment-templates/:id            Update template
```

### 5.4 Risk Management

```
POST   /api/v1/risk-registers                Create risk register
GET    /api/v1/risk-registers                List risk registers
GET    /api/v1/risk-registers/:id            Get register
PATCH  /api/v1/risk-registers/:id            Update register

POST   /api/v1/risk-registers/:id/risks      Create risk entry
GET    /api/v1/risk-registers/:id/risks      List risks (filterable)
GET    /api/v1/risks/:id                     Get risk detail
PATCH  /api/v1/risks/:id                     Update risk
DELETE  /api/v1/risks/:id                    Delete risk

POST   /api/v1/risks/:id/treatments          Create treatment
GET    /api/v1/risks/:id/treatments          List treatments
PATCH  /api/v1/risks/:id/treatments/:tId     Update treatment

POST   /api/v1/risks/:id/accept              Submit risk acceptance
GET    /api/v1/risks/:id/acceptances         List acceptances
PATCH  /api/v1/risks/:id/acceptances/:aId    Update acceptance

GET    /api/v1/risk-registers/:id/matrix     Get risk matrix config
PUT    /api/v1/risk-registers/:id/matrix     Update risk matrix
GET    /api/v1/risk-registers/:id/heatmap    Get heatmap data
POST   /api/v1/risk-registers/:id/reassess   Trigger reassessment
```

### 5.5 Zones & Conduits

```
POST   /api/v1/zones                         Create zone
GET    /api/v1/zones                         List zones
GET    /api/v1/zones/:id                     Get zone
PATCH  /api/v1/zones/:id                     Update zone
DELETE  /api/v1/zones/:id                    Delete zone

POST   /api/v1/zones/:id/assets              Assign asset to zone
DELETE  /api/v1/zones/:id/assets/:assetId    Remove asset from zone
GET    /api/v1/zones/:id/assets              List zone assets

POST   /api/v1/conduits                      Create conduit
GET    /api/v1/conduits                      List conduits
GET    /api/v1/conduits/:id                  Get conduit
PATCH  /api/v1/conduits/:id                  Update conduit
DELETE  /api/v1/conduits/:id                 Delete conduit

GET    /api/v1/zone-topology                  Get full topology for visualization
PUT    /api/v1/zone-topology                  Update topology layout
GET    /api/v1/zone-topology/compliance       Check segmentation compliance
```

### 5.6 Purdue Model

```
POST   /api/v1/purdue-models                 Create Purdue model
GET    /api/v1/purdue-models                 List models
GET    /api/v1/purdue-models/:id             Get model
PATCH  /api/v1/purdue-models/:id             Update model
DELETE  /api/v1/purdue-models/:id            Delete model

POST   /api/v1/purdue-models/:id/assets      Assign asset to level
DELETE  /api/v1/purdue-models/:id/assets/:aId Remove asset assignment

GET    /api/v1/purdue-models/:id/rules       List communication rules
POST   /api/v1/purdue-models/:id/rules       Create communication rule
PATCH  /api/v1/purdue-models/:id/rules/:rId  Update rule
GET    /api/v1/purdue-models/:id/compliance  Check Purdue compliance
```

### 5.7 CSMS

```
POST   /api/v1/csms                          Create CSMS framework
GET    /api/v1/csms                          List frameworks
GET    /api/v1/csms/:id                      Get framework
PATCH  /api/v1/csms/:id                      Update framework

GET    /api/v1/csms/:id/elements             List CSMS elements
POST   /api/v1/csms/:id/elements             Create element
PATCH  /api/v1/csms/:id/elements/:eId        Update element

POST   /api/v1/csms/:id/policies             Create policy
GET    /api/v1/csms/:id/policies             List policies
PATCH  /api/v1/csms/:id/policies/:pId        Update policy
POST   /api/v1/csms/:id/policies/:pId/approve  Approve policy

GET    /api/v1/csms/:id/gap-analysis         Get gap analysis
POST   /api/v1/csms/:id/improvement-plans    Create improvement plan
GET    /api/v1/csms/:id/improvement-plans    List improvement plans
```

### 5.8 Findings

```
POST   /api/v1/findings                      Create finding
GET    /api/v1/findings                      List findings (filterable)
GET    /api/v1/findings/:id                  Get finding
PATCH  /api/v1/findings/:id                  Update finding
DELETE  /api/v1/findings/:id                 Delete finding

POST   /api/v1/findings/bulk-import          Bulk import findings
POST   /api/v1/findings/:id/transition       Transition finding status
GET    /api/v1/findings/:id/history          Get status history

POST   /api/v1/findings/:id/comments         Add comment
GET    /api/v1/findings/:id/comments         List comments
PATCH  /api/v1/findings/:id/comments/:cId    Edit comment

POST   /api/v1/findings/:id/evidence         Link evidence
GET    /api/v1/findings/:id/evidence         List linked evidence
DELETE  /api/v1/findings/:id/evidence/:eId   Unlink evidence
```

### 5.9 Evidence

```
POST   /api/v1/evidence                      Upload evidence (multipart)
GET    /api/v1/evidence                      List evidence (filterable)
GET    /api/v1/evidence/:id                  Get evidence metadata
PATCH  /api/v1/evidence/:id                  Update evidence metadata
DELETE  /api/v1/evidence/:id                 Delete evidence

GET    /api/v1/evidence/:id/file             Download evidence file
GET    /api/v1/evidence/:id/chain-of-custody Get chain of custody
POST   /api/v1/evidence/:id/link             Link to entity
DELETE  /api/v1/evidence/:id/link/:linkId    Unlink from entity
GET    /api/v1/evidence/:id/verify           Verify integrity hash
```

### 5.10 Remediation

```
POST   /api/v1/remediation-plans             Create plan
GET    /api/v1/remediation-plans             List plans
GET    /api/v1/remediation-plans/:id         Get plan
PATCH  /api/v1/remediation-plans/:id         Update plan

POST   /api/v1/remediation-plans/:id/actions Create action
GET    /api/v1/remediation-plans/:id/actions List actions
PATCH  /api/v1/remediation-actions/:id       Update action
POST   /api/v1/remediation-actions/:id/verify  Submit verification
```

### 5.11 Assets

```
POST   /api/v1/assets                        Create asset
GET    /api/v1/assets                        List assets (filterable)
GET    /api/v1/assets/:id                    Get asset
PATCH  /api/v1/assets/:id                    Update asset
DELETE  /api/v1/assets/:id                   Delete asset

POST   /api/v1/assets/import                 Bulk import assets
GET    /api/v1/assets/import/:jobId          Get import job status
GET    /api/v1/assets/export                 Export assets (CSV/JSON)
GET    /api/v1/assets/:id/relationships      Get asset relationships
```

### 5.12 Reporting

```
POST   /api/v1/reports/generate              Generate report
GET    /api/v1/reports                       List generated reports
GET    /api/v1/reports/:id                   Get report status/metadata
GET    /api/v1/reports/:id/download          Download report file
DELETE  /api/v1/reports/:id                  Delete report

GET    /api/v1/reports/templates             List report templates
GET    /api/v1/dashboard/summary             Dashboard summary data
GET    /api/v1/dashboard/risk-heatmap        Risk heatmap data
GET    /api/v1/dashboard/assessment-progress Assessment progress data
GET    /api/v1/dashboard/remediation-status  Remediation status data
```

### 5.13 Audit & Admin

```
GET    /api/v1/audit-log                     Query audit log
GET    /api/v1/audit-log/export              Export audit log
GET    /api/v1/audit-log/entities/:type/:id  Entity-specific audit trail

GET    /api/v1/roles                         List roles
POST   /api/v1/roles                         Create role
PATCH  /api/v1/roles/:id                     Update role
DELETE  /api/v1/roles/:id                    Delete role

GET    /api/v1/api-keys                      List API keys
POST   /api/v1/api-keys                      Create API key
DELETE  /api/v1/api-keys/:id                 Revoke API key
```

---

## 6. Query Parameters (Standard)

| Parameter | Type | Description | Example |
|---|---|---|---|
| `page` | integer | Page number (1-indexed) | `?page=2` |
| `per_page` | integer | Items per page (max 100) | `?per_page=50` |
| `sort` | string | Sort field (prefix `-` for desc) | `?sort=-created_at` |
| `filter[field]` | string | Filter by field value | `?filter[status]=open` |
| `filter[field][op]` | string | Filter with operator | `?filter[severity][in]=high,critical` |
| `search` | string | Full-text search | `?search=firewall+config` |
| `include` | string | Eager-load relations | `?include=evidence,findings` |
| `fields[type]` | string | Sparse fieldsets | `?fields[findings]=title,severity` |

### Filter Operators

| Operator | Description | Example |
|---|---|---|
| `eq` (default) | Equal | `?filter[status]=open` |
| `neq` | Not equal | `?filter[status][neq]=closed` |
| `in` | In set | `?filter[severity][in]=high,critical` |
| `gt`, `gte` | Greater than | `?filter[created_at][gte]=2026-01-01` |
| `lt`, `lte` | Less than | `?filter[score][lt]=3` |
| `like` | Pattern match | `?filter[title][like]=%firewall%` |

---

## 7. WebSocket / Real-Time

```
WS /api/v1/ws

Events:
  • finding.updated       — Finding state change
  • assessment.progress   — Assessment completion update
  • remediation.milestone — Remediation milestone reached
  • notification.new      — New notification
  • sync.conflict         — Offline sync conflict detected
  • report.completed      — Report generation finished
  • import.completed      — Import job finished

Message format:
{
  "type": "finding.updated",
  "data": { ... },
  "timestamp": "2026-07-31T10:00:00Z"
}
```

---

## 8. Rate Limiting

| Tier | Rate Limit | Burst |
|---|---|---|
| **Standard** (read operations) | 600 req/min | 100 |
| **Write** (mutations) | 120 req/min | 20 |
| **Auth** (login, register) | 10 req/min | 5 |
| **Upload** (evidence) | 30 req/min | 5 |
| **Export/Report** (generation) | 10 req/min | 3 |
| **Search** (full-text) | 60 req/min | 15 |

Headers returned on every response:
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 594
X-RateLimit-Reset: 1690000060
```

---

## 9. Webhooks (Outbound)

```json
POST /api/v1/webhooks
{
  "url": "https://client-system.example.com/webhook",
  "events": ["finding.created", "risk.level_changed", "remediation.completed"],
  "secret": "whsec_...",
  "active": true
}

Delivery:
  • POST to configured URL
  • HMAC-SHA256 signature in X-Signature-256 header
  • Retry: exponential backoff (1s, 5s, 30s, 5m, 30m) — max 5 attempts
  • Dead letter queue for failed deliveries
```

---

## 10. Bulk Operations

| Operation | Endpoint | Method | Format |
|---|---|---|---|
| Bulk create findings | `/api/v1/findings/bulk` | POST | JSON array |
| Bulk update findings | `/api/v1/findings/bulk` | PATCH | JSON array with IDs |
| Bulk import assets | `/api/v1/assets/import` | POST | CSV/JSON multipart |
| Bulk export | `/api/v1/export` | POST | Configurable scope |
| Bulk status transition | `/api/v1/findings/bulk-transition` | POST | IDs + target status |

All bulk operations return a job ID and are processed asynchronously:
```json
{
  "data": {
    "job_id": "job-uuid",
    "status": "processing",
    "total": 150
  }
}

// Poll: GET /api/v1/jobs/:jobId
{
  "data": {
    "job_id": "job-uuid",
    "status": "completed",
    "total": 150,
    "succeeded": 148,
    "failed": 2,
    "errors": [ ... ]
  }
}
```

---

*Next: [RBAC Design →](rbac-design.md)*
