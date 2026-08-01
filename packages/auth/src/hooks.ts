import { hasAllPermissions, hasAnyPermission, hasPermission, resolvePermissions } from './permissions.js';
import type { TokenPayload } from './jwt.js';

export { hasAllPermissions, hasAnyPermission, hasPermission, resolvePermissions };

export interface AuthContext {
  user: TokenPayload;
  isAuthenticated: boolean;
  tenantId: string;
  permissions: string[];
}

export function createAuthContext(payload: TokenPayload): AuthContext {
  const permissions = payload.permissions ?? resolvePermissions(payload.roles ?? []);
  return {
    user: payload,
    isAuthenticated: true,
    tenantId: payload.tenant_id,
    permissions,
  };
}

export function canAccessResource(
  context: AuthContext,
  resource: string,
  action: string,
): boolean {
  return hasPermission(context.user, `${resource}:${action}`);
}

export function requirePermission(
  context: AuthContext,
  resource: string,
  action: string,
): void {
  if (!canAccessResource(context, resource, action)) {
    throw new PermissionDeniedError(resource, action);
  }
}

export class PermissionDeniedError extends Error {
  public readonly resource: string;
  public readonly action: string;

  constructor(resource: string, action: string) {
    super(`Permission denied: ${resource}:${action}`);
    this.name = 'PermissionDeniedError';
    this.resource = resource;
    this.action = action;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class TenantAccessError extends Error {
  constructor(tenantId: string) {
    super(`Access denied to tenant: ${tenantId}`);
    this.name = 'TenantAccessError';
  }
}
