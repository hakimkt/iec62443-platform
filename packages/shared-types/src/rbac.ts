/**
 * IEC 62443 Role-Based Access Control (RBAC) Types
 *
 * Covers roles, permissions, system role names, permission checks,
 * and role assignments.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * A permission string in the format `resource:action`.
 *
 * Examples: `"assessment:read"`, `"finding:write"`, `"asset:delete"`.
 */
export type Permission = `${string}:${string}`;

// ---------------------------------------------------------------------------
// System Role Names
// ---------------------------------------------------------------------------

/**
 * Well-known system role names that are provisioned by default.
 *
 * Custom roles may also exist but are not covered by this type.
 */
export type SystemRoleName =
  | 'platform_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'project_manager'
  | 'lead_assessor'
  | 'assessor'
  | 'quality_manager'
  | 'risk_manager'
  | 'viewer';

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/**
 * A role within a tenant that aggregates a set of permissions.
 */
export interface Role {
  id: UUID;
  tenantId: UUID;
  name: SystemRoleName | string;
  description: string;
  /** Whether this is a system-provided role that cannot be modified. */
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Permission Check
// ---------------------------------------------------------------------------

/**
 * Parameters for checking whether a user has the required permissions
 * within a tenant.
 */
export interface PermissionCheck {
  userId: UUID;
  /** All permissions must be satisfied (AND logic). */
  requiredPermissions: Permission[];
  tenantId: UUID;
}

// ---------------------------------------------------------------------------
// Role Assignment
// ---------------------------------------------------------------------------

/**
 * A record of a role being granted to a user within a tenant.
 */
export interface RoleAssignment {
  userId: UUID;
  roleId: UUID;
  tenantId: UUID;
  grantedBy: UUID;
  grantedAt: string;
}
