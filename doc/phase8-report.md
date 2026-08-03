# Phase 8 — Remediation + CSMS + Administration

**Date:** 2026-08-01
**Scope:** Phase 8 from development-sequence.md (Week 21-23)
**Result:** All 3 modules implemented. All 10 packages compile clean (`tsc --noEmit`). 23 tests pass.

---

## 1. Remediation Management

### Backend

**Files created:**

- `apps/api/src/modules/remediation/remediation.service.ts` — `RemediationService` with CRUD for plans, actions, and verifications. Hash-chained audit events on every write operation.
- `apps/api/src/modules/remediation/remediation.controller.ts` — `RemediationController` with Zod validation. Maps verification result (`passed`/`failed`/`partial` → `pass`/`fail`/`partial`) to match DB constraints.
- `apps/api/src/modules/remediation/routes.ts` — 12 routes: plan CRUD, action CRUD, verifications list + create.
- `apps/api/src/modules/remediation/index.ts` — `remediationPlugin` exported via `fp` with name `remediation-module`.

**API endpoints:**

| Method | Endpoint                                       | Permission          | Purpose                              |
| ------ | ---------------------------------------------- | ------------------- | ------------------------------------ |
| GET    | `/remediation/plans`                           | `remediation:read`  | List plans (paginated, filterable)   |
| POST   | `/remediation/plans`                           | `remediation:write` | Create plan                          |
| GET    | `/remediation/plans/:id`                       | `remediation:read`  | Get plan detail                      |
| PATCH  | `/remediation/plans/:id`                       | `remediation:write` | Update plan                          |
| DELETE | `/remediation/plans/:id`                       | `remediation:write` | Delete plan                          |
| GET    | `/remediation/actions`                         | `remediation:read`  | List actions (paginated, filterable) |
| POST   | `/remediation/plans/:planId/actions`           | `remediation:write` | Create action                        |
| GET    | `/remediation/actions/:id`                     | `remediation:read`  | Get action detail                    |
| PATCH  | `/remediation/actions/:id`                     | `remediation:write` | Update action                        |
| DELETE | `/remediation/actions/:id`                     | `remediation:write` | Delete action                        |
| GET    | `/remediation/actions/:actionId/verifications` | `remediation:read`  | List verifications                   |
| POST   | `/remediation/actions/:actionId/verifications` | `remediation:write` | Verify action                        |

### Frontend

**Files created:**

- `apps/web/src/hooks/useRemediation.ts` — 12 hooks: `useRemediationPlans`, `useRemediationPlan`, `useCreatePlan`, `useUpdatePlan`, `useDeletePlan`, `useRemediationActions`, `useRemediationAction`, `useCreateAction`, `useUpdateAction`, `useDeleteAction`, `useVerifications`, `useVerifyAction`
- `apps/web/app/(app)/remediation/page.tsx` — Plan list page with search, status filter, pagination
- `apps/web/app/(app)/remediation/[id]/page.tsx` — Plan detail page with action items list and verification history

---

## 2. CSMS Management

### Backend

**Files created:**

- `apps/api/src/modules/csms/csms.service.ts` — `CSMSService` with CRUD for frameworks, elements, policies, improvement plans. Includes `getGapAnalysis` (returns elements not implemented/na with priority based on maturityScore) and `approvePolicy` (sets status=approved, approvedBy, approvedAt).
- `apps/api/src/modules/csms/csms.controller.ts` — `CSMSController` with Zod validation.
- `apps/api/src/modules/csms/routes.ts` — 16 routes: framework CRUD, element CRUD, policy CRUD + approve, improvement plans, gap analysis.
- `apps/api/src/modules/csms/index.ts` — `csmsPlugin` exported via `fp` with name `csms-module`.

**API endpoints:**

| Method | Endpoint                                          | Permission   | Purpose                 |
| ------ | ------------------------------------------------- | ------------ | ----------------------- |
| GET    | `/csms/frameworks`                                | `csms:read`  | List frameworks         |
| POST   | `/csms/frameworks`                                | `csms:write` | Create framework        |
| GET    | `/csms/frameworks/:id`                            | `csms:read`  | Get framework detail    |
| PATCH  | `/csms/frameworks/:id`                            | `csms:write` | Update framework        |
| DELETE | `/csms/frameworks/:id`                            | `csms:write` | Delete framework        |
| GET    | `/csms/frameworks/:frameworkId/elements`          | `csms:read`  | List elements           |
| POST   | `/csms/frameworks/:frameworkId/elements`          | `csms:write` | Create element          |
| GET    | `/csms/elements/:id`                              | `csms:read`  | Get element             |
| PATCH  | `/csms/elements/:id`                              | `csms:write` | Update element          |
| DELETE | `/csms/elements/:id`                              | `csms:write` | Delete element          |
| GET    | `/csms/frameworks/:frameworkId/policies`          | `csms:read`  | List policies           |
| POST   | `/csms/frameworks/:frameworkId/policies`          | `csms:write` | Create policy           |
| GET    | `/csms/policies/:id`                              | `csms:read`  | Get policy              |
| PATCH  | `/csms/policies/:id`                              | `csms:write` | Update policy           |
| POST   | `/csms/policies/:id/approve`                      | `csms:write` | Approve policy          |
| DELETE | `/csms/policies/:id`                              | `csms:write` | Delete policy           |
| GET    | `/csms/frameworks/:id/gap-analysis`               | `csms:read`  | Gap analysis            |
| POST   | `/csms/frameworks/:frameworkId/improvement-plans` | `csms:write` | Create improvement plan |

### Frontend

**Files created:**

- `apps/web/src/hooks/useCSMS.ts` — 19 hooks: framework CRUD, element CRUD, policy CRUD + approve, improvement plans, gap analysis
- `apps/web/app/(app)/csms/page.tsx` — Framework list page with search, status filter, pagination
- `apps/web/app/(app)/csms/[id]/page.tsx` — Framework detail page with tabs: Elements, Policies, Gap Analysis, Improvement Plans

---

## 3. Administration

### Backend

**Files created:**

- `apps/api/src/modules/admin/admin.service.ts` — `AdminService` with: Members (list with innerJoin to users, invite with user creation, update, remove), Roles (list, create, update, delete — all scoped to tenantId), API Keys (list, create with SHA-256 hash, revoke), Audit Log (with filters for eventTypes, entityTypes, userIds, dateFrom, dateTo), Tenant Settings (get, update).
- `apps/api/src/modules/admin/admin.controller.ts` — `AdminController` with Zod validation.
- `apps/api/src/modules/admin/routes.ts` — 12 routes: Members, Roles, API Keys, Audit Log, Settings.
- `apps/api/src/modules/admin/index.ts` — `adminPlugin` exported via `fp` with name `admin-module`.

**API endpoints:**

| Method | Endpoint                     | Permission    | Purpose                |
| ------ | ---------------------------- | ------------- | ---------------------- |
| GET    | `/admin/members`             | `admin:read`  | List members           |
| POST   | `/admin/members/invite`      | `admin:write` | Invite member          |
| PATCH  | `/admin/members/:userId`     | `admin:write` | Update member role     |
| DELETE | `/admin/members/:userId`     | `admin:write` | Remove member          |
| GET    | `/admin/roles`               | `admin:read`  | List roles             |
| POST   | `/admin/roles`               | `admin:write` | Create role            |
| PATCH  | `/admin/roles/:id`           | `admin:write` | Update role            |
| DELETE | `/admin/roles/:id`           | `admin:write` | Delete role            |
| GET    | `/admin/api-keys`            | `admin:read`  | List API keys          |
| POST   | `/admin/api-keys`            | `admin:write` | Create API key         |
| POST   | `/admin/api-keys/:id/revoke` | `admin:write` | Revoke API key         |
| GET    | `/admin/audit-log`           | `admin:read`  | Query audit log        |
| GET    | `/admin/settings`            | `admin:read`  | Get tenant settings    |
| PATCH  | `/admin/settings`            | `admin:write` | Update tenant settings |

### Frontend

**Files created:**

- `apps/web/src/hooks/useAdmin.ts` — 14 hooks: members, roles, API keys, audit log, tenant settings
- `apps/web/app/(app)/admin/page.tsx` — Administration page with tabbed interface: Members, Roles, API Keys, Audit Log, Settings

---

## 4. Shared Infrastructure

**Files modified:**

- `apps/api/src/server.ts` — Added imports and registration of `remediationPlugin`, `csmsPlugin`, `adminPlugin`
- `apps/web/src/lib/query-client.ts` — Added query keys for `remediation` (plans, actions), `csms` (frameworks, elements, policies), `admin` (members, roles, apiKeys, auditLog, settings)

---

## 5. Tests

**Files created:**

- `apps/api/src/modules/remediation/remediation.service.test.ts` — 8 tests covering getPlan (404, found), createPlan (success, 500), updatePlan (completedAt), deletePlan (404), getAction (404), verifyAction (success)
- `apps/api/src/modules/csms/csms.service.test.ts` — 8 tests covering getFramework (404, found), createFramework (success, 500), approvePolicy (approved), getGapAnalysis (gap items), getElement (404), getPolicy (404)
- `apps/api/src/modules/admin/admin.service.test.ts` — 7 tests covering inviteMember (new user, 409 conflict), updateMember (404), createRole (success), createApiKey (success), getTenantSettings (404, found)

**Result:** 23 tests pass across 3 test files.

---

## 6. Verification

```
✓ pnpm --filter api exec tsc --noEmit     → 0 errors
✓ pnpm --filter web exec tsc --noEmit     → 0 errors
✓ pnpm --filter shared-types exec tsc --noEmit  → 0 errors
✓ pnpm --filter shared-schemas exec tsc --noEmit → 0 errors
✓ pnpm --filter database exec tsc --noEmit      → 0 errors
✓ pnpm --filter api test                  → 23/23 tests pass
```

---

## 7. Key Design Decisions

1. **Verification result mapping:** DB uses `pass`/`fail`/`partial` but shared-schemas uses `passed`/`failed`/`partial`. The controller maps between them to keep the API user-facing while respecting DB constraints.

2. **Gap analysis priority:** Elements with maturityScore ≤ 2 are `critical`, ≤ 3 are `high`, otherwise `medium`. Only elements not `implemented` or `na` appear in gap analysis.

3. **API key security:** Raw keys are generated with `crypto.randomBytes(32)` and prefixed with `iec62443_`. Only the SHA-256 hash is stored; the raw key is returned once on creation.

4. **Policy approval:** Sets `approvedBy`, `approvedAt`, and `status: 'approved'` atomically. The approve endpoint is separate from the generic update endpoint to enforce the approval workflow.

5. **Admin module scope:** All role and API key operations are scoped to the tenant via `eq(roles.tenantId, this.tenantId)`. Member operations use `innerJoin` to combine membership data with user profile data.
