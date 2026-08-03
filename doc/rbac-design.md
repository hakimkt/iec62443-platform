# IEC 62443 Platform — RBAC Design

> Version: 1.0 | Status: Draft | Last Updated: 2026-07-31

---

## 1. RBAC Model Overview

The platform uses a **hierarchical role-based access control (RBAC)** model with the following characteristics:

- **Tenant-scoped roles** — roles are assigned within a tenant context
- **Role inheritance** — higher roles inherit permissions from lower roles
- **Resource-level permissions** — permissions follow `resource:action` pattern
- **Custom roles** — tenants can create custom roles (Enterprise plan)
- **Separation of duties** — critical operations require distinct roles

```
┌─────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                        │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  Platform Admin   │  (cross-tenant, system-level)   │
│  └────────┬─────────┘                                   │
│           │                                             │
│  ┌────────▼─────────┐                                   │
│  │  Tenant Owner     │  (full tenant control)          │
│  └────────┬─────────┘                                   │
│           │                                             │
│  ┌────────▼─────────┐                                   │
│  │  Tenant Admin     │  (tenant management)            │
│  └────────┬─────────┘                                   │
│           │                                             │
│  ┌────────▼─────────┐  ┌──────────────────┐            │
│  │  Project Manager  │  │  Quality Manager │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
│           │                     │                       │
│  ┌────────▼─────────┐  ┌───────▼──────────┐            │
│  │  Lead Assessor    │  │  Risk Manager    │            │
│  └────────┬─────────┘  └───────┬──────────┘            │
│           │                     │                       │
│  ┌────────▼─────────┐  ┌───────▼──────────┐            │
│  │  Assessor         │  │  Viewer          │            │
│  └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Permission Schema

### Format: `resource:action`

| Resource              | Actions                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `tenant`              | `read`, `update`, `delete`, `manage_members`, `manage_billing`         |
| `role`                | `read`, `create`, `update`, `delete`                                   |
| `user`                | `read`, `create`, `update`, `delete`, `impersonate`                    |
| `assessment`          | `read`, `create`, `update`, `delete`, `complete`, `export`             |
| `assessment.response` | `read`, `write`, `review`                                              |
| `assessment.template` | `read`, `create`, `update`, `delete`                                   |
| `risk`                | `read`, `create`, `update`, `delete`, `accept`, `export`               |
| `risk.treatment`      | `read`, `create`, `update`, `delete`                                   |
| `risk.register`       | `read`, `create`, `update`, `delete`                                   |
| `zone`                | `read`, `create`, `update`, `delete`                                   |
| `conduit`             | `read`, `create`, `update`, `delete`                                   |
| `purdue`              | `read`, `create`, `update`, `delete`                                   |
| `csms`                | `read`, `create`, `update`, `delete`, `approve_policy`                 |
| `finding`             | `read`, `create`, `update`, `delete`, `transition`, `assign`, `export` |
| `evidence`            | `read`, `upload`, `update`, `delete`, `download`, `verify`             |
| `remediation`         | `read`, `create`, `update`, `delete`, `verify`, `assign`               |
| `asset`               | `read`, `create`, `update`, `delete`, `import`, `export`               |
| `report`              | `read`, `generate`, `download`, `delete`                               |
| `audit_log`           | `read`, `export`                                                       |
| `api_key`             | `read`, `create`, `delete`                                             |
| `webhook`             | `read`, `create`, `update`, `delete`                                   |
| `integration`         | `read`, `create`, `update`, `delete`                                   |

---

## 3. System Roles

### 3.1 Platform Admin

**Scope:** Cross-tenant, system-level operations
**Assignment:** Platform operator only

```
Permissions:
  tenant:*                    — Full tenant management
  user:impersonate            — Impersonate any user (for support)
  audit_log:read              — Cross-tenant audit log access
  audit_log:export            — Export cross-tenant audit data

Restrictions:
  - Cannot access tenant data (assessments, findings, etc.)
  - Cannot impersonate without audit trail entry
  - All actions logged to platform-level audit log
```

### 3.2 Tenant Owner

**Scope:** Full control within their tenant
**Assignment:** Initial tenant creator; transferable

```
Permissions:
  tenant:read|update|delete|manage_members|manage_billing
  role:*                      — Full role management
  user:*                      — Full user management within tenant

  + All permissions of Tenant Admin (inherited)
```

### 3.3 Tenant Admin

**Scope:** Tenant management, no billing/ownership

```
Permissions:
  tenant:read|update|manage_members
  role:read|create|update
  user:read|create|update|delete
  api_key:*
  webhook:*
  integration:*

  + All permissions of Project Manager (inherited)
```

### 3.4 Project Manager

**Scope:** Manage engagements and oversee delivery

```
Permissions:
  assessment:read|create|update|delete|complete|export
  assessment.template:read|create|update
  risk:read|create|update|delete|accept|export
  risk.register:read|create|update|delete
  risk.treatment:read|create|update
  finding:read|create|update|delete|transition|assign|export
  remediation:read|create|update|delete|verify|assign
  report:read|generate|download|delete
  asset:read|create|update|delete|import|export

  + All permissions of Lead Assessor (inherited)
```

### 3.5 Lead Assessor

**Scope:** Lead assessment execution

```
Permissions:
  assessment:read|create|update|export
  assessment.response:read|write|review
  assessment.template:read
  finding:read|create|update|transition|assign
  evidence:read|upload|update|download|verify
  risk:read|create|update
  zone:read|create|update
  conduit:read|create|update
  purdue:read|create|update
  asset:read|create|update
  report:read|generate|download

  + All permissions of Assessor (inherited)
```

### 3.6 Assessor

**Scope:** Conduct assessments, record findings

```
Permissions:
  assessment:read
  assessment.response:read|write
  finding:read|create|update
  evidence:read|upload|download
  zone:read
  conduit:read
  purdue:read
  asset:read
  risk:read
  csms:read
  remediation:read
  report:read
```

### 3.7 Quality Manager

**Scope:** Review, approve, and ensure quality

```
Permissions:
  assessment:read|complete|export
  assessment.response:read|review
  finding:read|update|transition
  risk:read|accept
  evidence:read|verify
  remediation:read|verify
  csms:read|approve_policy
  report:read|generate|download
  audit_log:read|export
```

### 3.8 Risk Manager

**Scope:** Risk register ownership

```
Permissions:
  risk:read|create|update|delete|accept|export
  risk.register:read|create|update
  risk.treatment:read|create|update|delete
  finding:read
  assessment:read
  zone:read
  asset:read
  report:read|generate|download
```

### 3.9 Viewer

**Scope:** Read-only access for stakeholders

```
Permissions:
  assessment:read
  finding:read
  risk:read
  zone:read
  conduit:read
  purdue:read
  csms:read
  remediation:read
  asset:read
  evidence:read        (no download — metadata only)
  report:read|download
```

---

## 4. Permission Matrix

| Permission                 | Platform Admin | Tenant Owner | Tenant Admin | Project Mgr | Lead Assessor | Assessor | Quality Mgr | Risk Mgr | Viewer |
| -------------------------- | :------------: | :----------: | :----------: | :---------: | :-----------: | :------: | :---------: | :------: | :----: |
| tenant:manage_billing      |                |      ✓       |              |             |               |          |             |          |        |
| tenant:delete              |                |      ✓       |              |             |               |          |             |          |        |
| tenant:manage_members      |                |      ✓       |      ✓       |             |               |          |             |          |        |
| role:*                     |                |      ✓       |     RCU      |             |               |          |             |          |        |
| user:*                     |                |      ✓       |     RCUD     |             |               |          |             |          |        |
| assessment:create          |                |      ✓       |      ✓       |      ✓      |       ✓       |          |             |          |        |
| assessment:delete          |                |      ✓       |      ✓       |      ✓      |               |          |             |          |        |
| assessment:complete        |                |      ✓       |      ✓       |      ✓      |               |          |      ✓      |          |        |
| assessment.response:write  |                |      ✓       |      ✓       |      ✓      |       ✓       |    ✓     |             |          |        |
| assessment.response:review |                |      ✓       |      ✓       |      ✓      |       ✓       |          |      ✓      |          |        |
| risk:accept                |                |      ✓       |      ✓       |      ✓      |               |          |      ✓      |    ✓     |        |
| risk:delete                |                |      ✓       |      ✓       |      ✓      |               |          |             |    ✓     |        |
| finding:transition         |                |      ✓       |      ✓       |      ✓      |       ✓       |          |      ✓      |          |        |
| finding:assign             |                |      ✓       |      ✓       |      ✓      |       ✓       |          |             |          |        |
| evidence:upload            |                |      ✓       |      ✓       |      ✓      |       ✓       |    ✓     |             |          |        |
| evidence:download          |                |      ✓       |      ✓       |      ✓      |       ✓       |    ✓     |             |          |   ✓    |
| evidence:verify            |                |      ✓       |      ✓       |      ✓      |       ✓       |          |      ✓      |          |        |
| remediation:verify         |                |      ✓       |      ✓       |      ✓      |               |          |      ✓      |          |        |
| csms:approve_policy        |                |      ✓       |      ✓       |             |               |          |      ✓      |          |        |
| report:generate            |                |      ✓       |      ✓       |      ✓      |       ✓       |          |      ✓      |    ✓     |        |
| audit_log:read             |       ✓        |      ✓       |      ✓       |             |               |          |      ✓      |          |        |
| audit_log:export           |       ✓        |      ✓       |      ✓       |             |               |          |      ✓      |          |        |
| api_key:*                  |                |      ✓       |      ✓       |             |               |          |             |          |        |
| integration:*              |                |      ✓       |      ✓       |             |               |          |             |          |        |

---

## 5. Data Scoping Rules

Beyond role permissions, data access is scoped by:

### 5.1 Project-Level Scoping

Users can be assigned to specific engagements/projects:

```
Assignment:
  user_id: uuid
  engagement_id: uuid
  scope: 'assigned' | 'all'

Behavior:
  scope = 'assigned'  → user sees only data linked to assigned engagements
  scope = 'all'       → user sees all tenant data (subject to role permissions)
```

### 5.2 Field-Level Security

| Field                   | Visibility       | Rule                                    |
| ----------------------- | ---------------- | --------------------------------------- |
| Evidence files (binary) | Restricted       | `evidence:download` permission required |
| Audit log IP addresses  | Restricted       | `audit_log:read` + Tenant Admin role    |
| User email addresses    | Masked           | Viewer role sees `j***@example.com`     |
| API key values          | One-time display | Shown only at creation time             |
| MFA secrets             | Never exposed    | Write-only via MFA flow                 |

### 5.3 Row-Level Security (RLS)

PostgreSQL RLS policies enforce tenant isolation at the database level:

```sql
-- Every tenant-scoped table has an RLS policy:
CREATE POLICY tenant_isolation ON {schema}.{table}
    USING (true)  -- schema-level isolation handles this
    WITH CHECK (true);

-- The search_path set by middleware ensures queries
-- only see the current tenant's schema.
```

---

## 6. Separation of Duties

Critical operations enforce multi-party approval:

| Operation                      | Required Roles                                    | Flow                           |
| ------------------------------ | ------------------------------------------------- | ------------------------------ |
| **Risk acceptance (Critical)** | Risk Manager proposes → Tenant Owner approves     | 2-party                        |
| **Risk acceptance (High)**     | Risk Manager proposes → Quality Manager approves  | 2-party                        |
| **Assessment completion**      | Lead Assessor completes → Quality Manager reviews | 2-party                        |
| **Evidence deletion**          | Creator requests → Tenant Admin approves          | 2-party                        |
| **Audit log export**           | Tenant Owner or Tenant Admin                      | 1-party + audit trail          |
| **User impersonation**         | Platform Admin only                               | 1-party + audit + notification |
| **Tenant deletion**            | Tenant Owner confirms → Platform Admin executes   | 2-party                        |
| **Policy approval**            | Author submits → Quality Manager approves         | 2-party                        |

---

## 7. Custom Roles (Enterprise Plan)

Tenants on the Enterprise plan can create custom roles:

```json
POST /api/v1/roles
{
  "name": "OT Security Analyst",
  "description": "Reads assessments, manages findings and risks",
  "permissions": [
    "assessment:read",
    "finding:read|create|update|transition",
    "risk:read|create|update",
    "evidence:read|upload|download",
    "report:read|generate"
  ],
  "inherits_from": null
}
```

### Constraints on Custom Roles

- Cannot include permissions above the creator's own role
- Cannot include `tenant:delete`, `user:impersonate`, or `role:delete`
- Maximum 50 custom roles per tenant
- Custom role changes do not retroactively remove existing assignments

---

## 8. Access Control Middleware Flow

```
┌────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐     ┌─────────┐
│Request │────►│  Auth    │────►│  Tenant   │────►│   RBAC   │────►│ Handler │
│        │     │  (JWT    │     │  Resolve  │     │  Check   │     │         │
│        │     │  verify) │     │           │     │          │     │         │
└────────┘     └──────────┘     └───────────┘     └──────────┘     └─────────┘
                    │                 │                  │
                    ▼                 ▼                  ▼
              ┌──────────┐     ┌──────────┐      ┌──────────┐
              │ Expired? │     │ Set DB   │      │ Has      │
              │ Invalid? │     │ schema   │      │ required │
              │ Revoked? │     │ context  │      │ perms?   │
              └──────────┘     └──────────┘      └──────────┘
                                                       │
                                                  ┌────┴────┐
                                                  │  No?    │
                                                  │  → 403  │
                                                  └─────────┘
```

---

## 9. Audit Requirements for RBAC

Every RBAC-relevant event is audit-logged:

| Event               | Data Captured                                   |
| ------------------- | ----------------------------------------------- |
| `role.granted`      | user_id, role_id, granted_by, tenant_id         |
| `role.revoked`      | user_id, role_id, revoked_by, reason            |
| `role.created`      | role definition, created_by                     |
| `role.updated`      | role_id, changed permissions (diff)             |
| `role.deleted`      | role_id, deleted_by                             |
| `permission.denied` | user_id, requested_permission, resource, action |
| `user.impersonated` | admin_id, target_user_id, duration              |
| `mfa.enabled`       | user_id, method                                 |
| `mfa.disabled`      | user_id, disabled_by                            |

---

_Next: [Security Architecture →](security-model.md)_
