# Stabilization Sprint — Refactoring Report

**Date:** 2026-08-01  
**Scope:** Pre-Phase 6 architectural and security debt elimination  
**Result:** All 5 issues addressed. All 10 packages compile clean (`tsc --noEmit`).

---

## 1. Cross-Tenant Audit Hash Chain

**Problem:** The `createAuditEvent` method in all 4 services (assessment, finding, asset, evidence) fetched the last audit event hash globally without tenant filtering. This caused cross-tenant hash chain linkage — a critical security flaw where tenant A's chain could reference tenant B's event hash, breaking chain integrity and leaking cross-tenant information.

**Fix:** Added `.where(eq(auditEvents.tenantId, this.tenantId))` to the last-event query in all 4 services:

- `apps/api/src/modules/assessment/assessment.service.ts`
- `apps/api/src/modules/finding/finding.service.ts`
- `apps/api/src/modules/asset/asset.service.ts`
- `apps/api/src/modules/evidence/evidence.service.ts`

**Impact:** Each tenant now has an independent, self-contained audit hash chain. No cross-tenant hash linkage is possible. The existing `idx_audit_events_tenant_time` index on `(tenantId, createdAt DESC)` supports this query efficiently.

---

## 2. Evidence Lifecycle

**Problem:** The evidence module performed hard deletes on both evidence items and chain-of-custody records. This violated IEC 62443 compliance requirements for evidence integrity and chain-of-custody preservation. Additionally:

- `sha256Hash` was `NOT NULL` with empty string `''` for metadata-only items (should be `NULL`)
- `updatedAt` was set to `new Date().toISOString()` (string) instead of `new Date()` (Date object)

**Fix:**

### Database schema changes (`packages/database/src/schema/tenant/evidence.ts`):

- Added `status` column (`VARCHAR(20) NOT NULL DEFAULT 'active'`) with CHECK constraint: `('active', 'archived', 'superseded')`
- Added `deletedAt` column (`TIMESTAMPTZ`, nullable)
- Added `deletedBy` column (`UUID`, nullable)
- Changed `sha256Hash` from `NOT NULL` to nullable
- Added `idx_items_status` index

### Service changes (`apps/api/src/modules/evidence/evidence.service.ts`):

- `listEvidence()`: Now excludes soft-deleted items (`WHERE status = 'active'`)
- `createEvidence()`: Sets `sha256Hash: null` instead of `sha256Hash: ''`
- `updateEvidence()`: Fixed `updatedAt: new Date()` instead of `new Date().toISOString()`
- `deleteEvidence()`: Replaced hard delete with soft delete — sets `status: 'archived'`, `deletedAt`, `deletedBy`. Never deletes chain-of-custody records. Creates a `deleted` custody event.

### Type changes:

- `packages/shared-types/src/domain/evidence.ts`: Added `EvidenceItemStatus` type, `status`, `deletedAt`, `deletedBy` fields to `EvidenceItem`. Added `deleted`, `linked`, `unlinked` to `CustodyEventType`.
- `packages/shared-schemas/src/evidence.schema.ts`: Added `evidenceItemStatusSchema`.

### Migration:

- `infrastructure/migrations/002_evidence_soft_delete.sql`: Makes `sha256_hash` nullable, converts empty strings to NULL, adds `status`, `deleted_at`, `deleted_by` columns, adds CHECK constraint and index.

**Impact:** Evidence items are never hard-deleted. Deleted evidence remains auditable. Chain-of-custody records are permanently preserved. The `sha256Hash` field is now correctly nullable for metadata-only items.

---

## 3. RBAC

**Problem:** The `requirePermission()` and `canAccessResource()` functions existed in `packages/auth/src/hooks.ts` but were never used in any API route. All routes only checked authentication (valid JWT) without verifying the user's role/permissions. Any authenticated user could access any endpoint regardless of their role.

**Fix:**

### New RBAC middleware (`apps/api/src/modules/auth/middleware/rbac.ts`):

- Created `rbacPlugin` Fastify plugin that decorates `app.requirePermission(permission: string)`
- Returns 403 `PERMISSION_DENIED` with consistent error format when permission is denied
- Uses `hasPermission()` from `@iec62443/auth` which supports wildcard matching (`resource:*`)

### Registration (`apps/api/src/modules/auth/index.ts`):

- Registered `rbacPlugin` after tenant middleware
- Added `requirePermission` type to FastifyInstance declaration

### Route-level enforcement (44 endpoints across 4 modules):

- **Asset routes** (12 endpoints): `asset:read`, `asset:create`, `asset:update`, `asset:delete`, `asset:import`, `asset:export`
- **Evidence routes** (11 endpoints): `evidence:read`, `evidence:upload`, `evidence:update`, `evidence:delete`, `evidence:verify`
- **Finding routes** (11 endpoints): `finding:read`, `finding:create`, `finding:update`, `finding:delete`, `finding:transition`
- **Assessment routes** (10 endpoints): `assessment:read`, `assessment:create`, `assessment:update`, `assessment:delete`, `assessment.template:create`, `assessment.response:read`, `assessment.response:write`
- **Public routes** (2 endpoints): `GET /assessment-templates` and `GET /assessment-templates/:id` remain public

**Impact:** Every API endpoint now performs authorization. The `viewer` role can only read, the `assessor` role can create/update within their scope, and administrative operations require appropriate roles. Consistent 403 error responses with permission details.

---

## 4. operationalStatus Enum

**Problem:** The database CHECK constraint used `'spare'` while the Zod schema and shared-types used `'standby'`. IEC 62443 terminology uses "standby" for equipment that is available but not actively operating.

**Fix:**

### Database schema (`packages/database/src/schema/tenant/asset.ts`):

- Changed CHECK constraint from `'spare'` to `'standby'`

### Documentation (`doc/database-design.md`):

- Updated CHECK constraint and default value in the asset table definition

### Migration:

- `infrastructure/migrations/001_operational_status_spare_to_standby.sql`: Updates existing `'spare'` values to `'standby'`, drops and recreates the CHECK constraint

**Impact:** The canonical enum is now `('operational', 'maintenance', 'decommissioned', 'standby')` across all layers. The Zod schema, shared-types, and frontend were already using `'standby'` and required no changes.

---

## 5. UI Consistency

**Problem:** Frontend pages used custom implementations of components that already existed in the shared UI library (`@iec62443/ui`). This created visual inconsistency, accessibility issues, and maintenance burden.

**Fix:**

### Assets list page (`apps/web/app/(app)/assets/page.tsx`):

- Replaced custom header with `PageHeader` from `@iec62443/ui/components`
- Replaced custom stats cards with `MetricCard`
- Replaced custom search input with `SearchInput`
- Replaced custom filter bar with `FilterBar` (with active filter chips)
- Replaced custom HTML table with `DataTable` (fixes invalid `<Link>` wrapping `<tbody>` rows)
- Replaced custom empty state with `EmptyState`
- Replaced custom pagination with `DataTable`'s built-in `Pagination`
- Uses `StatusBadge` for operational status display

### Evidence list page (`apps/web/app/(app)/evidence/page.tsx`):

- Replaced custom header with `PageHeader`
- Replaced custom search input with `SearchInput`
- Replaced custom filter bar with `FilterBar`
- Replaced custom empty state with `EmptyState`
- Replaced custom pagination with `Pagination`
- Fixed `EvidenceCard` to use `onClick` navigation instead of `<Link>` wrapping

### Accessibility improvements (all detail pages):

- **Back navigation:** Replaced `<button onClick={router.push}>` with `<Link href>` in all 4 detail pages (asset, evidence, finding, assessment) — proper semantic navigation
- **Tab navigation:** Added `role="tablist"`, `role="tab"`, `aria-selected`, and `aria-label` attributes to all tab navigation across 4 detail pages
- **Evidence integrity check:** Fixed `sha256Hash` check from truthy (`item.sha256Hash`) to null-safe (`item.sha256Hash !== null`) reflecting the nullable schema change

### Files modified:

- `apps/web/app/(app)/assets/page.tsx` — Complete rewrite with shared components
- `apps/web/app/(app)/evidence/page.tsx` — Complete rewrite with shared components
- `apps/web/app/(app)/assets/[id]/page.tsx` — Back nav + ARIA labels
- `apps/web/app/(app)/evidence/[id]/page.tsx` — Back nav + ARIA labels + null-safe hash check
- `apps/web/app/(app)/findings/[id]/page.tsx` — Back nav + ARIA labels + removed unused import
- `apps/web/app/(app)/assessments/[id]/page.tsx` — Back nav + ARIA labels

---

## Files Changed Summary

| Category              | File                                                                    | Change                                                                            |
| --------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Audit chain**       | `apps/api/src/modules/assessment/assessment.service.ts`                 | Added tenant filter to audit hash chain query                                     |
| **Audit chain**       | `apps/api/src/modules/finding/finding.service.ts`                       | Added tenant filter to audit hash chain query                                     |
| **Audit chain**       | `apps/api/src/modules/asset/asset.service.ts`                           | Added tenant filter to audit hash chain query                                     |
| **Audit chain**       | `apps/api/src/modules/evidence/evidence.service.ts`                     | Added tenant filter + soft delete + sha256Hash fix + updatedAt fix                |
| **Evidence**          | `packages/database/src/schema/tenant/evidence.ts`                       | Added status, deletedAt, deletedBy; made sha256Hash nullable                      |
| **Evidence**          | `packages/shared-types/src/domain/evidence.ts`                          | Added EvidenceItemStatus, status, deletedAt, deletedBy; expanded CustodyEventType |
| **Evidence**          | `packages/shared-schemas/src/evidence.schema.ts`                        | Added evidenceItemStatusSchema                                                    |
| **operationalStatus** | `packages/database/src/schema/tenant/asset.ts`                          | Changed 'spare' → 'standby' in CHECK constraint                                   |
| **operationalStatus** | `doc/database-design.md`                                                | Updated asset table definition                                                    |
| **RBAC**              | `apps/api/src/modules/auth/middleware/rbac.ts`                          | **New file** — RBAC preHandler plugin                                             |
| **RBAC**              | `apps/api/src/modules/auth/index.ts`                                    | Registered rbacPlugin, added requirePermission type                               |
| **RBAC**              | `apps/api/src/modules/asset/routes.ts`                                  | Added requirePermission to all 12 routes                                          |
| **RBAC**              | `apps/api/src/modules/evidence/routes.ts`                               | Added requirePermission to all 11 routes                                          |
| **RBAC**              | `apps/api/src/modules/finding/routes.ts`                                | Added requirePermission to all 11 routes                                          |
| **RBAC**              | `apps/api/src/modules/assessment/routes.ts`                             | Added requirePermission to 10 routes (2 public)                                   |
| **UI**                | `apps/web/app/(app)/assets/page.tsx`                                    | Rewrote with shared components                                                    |
| **UI**                | `apps/web/app/(app)/evidence/page.tsx`                                  | Rewrote with shared components                                                    |
| **UI**                | `apps/web/app/(app)/assets/[id]/page.tsx`                               | Link + ARIA labels                                                                |
| **UI**                | `apps/web/app/(app)/evidence/[id]/page.tsx`                             | Link + ARIA + null-safe hash                                                      |
| **UI**                | `apps/web/app/(app)/findings/[id]/page.tsx`                             | Link + ARIA labels                                                                |
| **UI**                | `apps/web/app/(app)/assessments/[id]/page.tsx`                          | Link + ARIA labels                                                                |
| **Migration**         | `infrastructure/migrations/001_operational_status_spare_to_standby.sql` | **New file**                                                                      |
| **Migration**         | `infrastructure/migrations/002_evidence_soft_delete.sql`                | **New file**                                                                      |

---

## Backward Compatibility

- **No breaking API changes.** All existing endpoints remain at the same paths with the same request/response shapes.
- **Evidence DELETE** now performs soft delete instead of hard delete. The response is still `204 No Content` on success. Deleted evidence is excluded from list queries by default but remains accessible via direct GET for audit purposes.
- **RBAC** may return `403 Forbidden` for previously accessible endpoints. This is the intended security fix — endpoints that should have been restricted are now properly restricted.
- **operationalStatus** value `'spare'` is no longer accepted. The migration converts existing data. The `'standby'` value was already the canonical value in Zod schemas and shared types.

---

## Verification

- `pnpm -r exec tsc --noEmit` — **All 10 packages compile clean** (0 errors)
- Migrations are provided as SQL files but must be applied manually before deploying
