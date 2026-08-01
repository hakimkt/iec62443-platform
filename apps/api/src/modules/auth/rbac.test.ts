import { describe, it, expect } from 'vitest';
import { hasPermission, resolvePermissions, SYSTEM_ROLE_PERMISSIONS } from '@iec62443/auth';

// ---------------------------------------------------------------------------
// Helper to create a TokenPayload from permissions
// ---------------------------------------------------------------------------

function makePayload(permissions: string[] = [], roles: string[] = []) {
  return {
    sub: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
    roles,
    permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    type: 'access' as const,
  };
}

// ---------------------------------------------------------------------------
// RBAC Permission Tests
// ---------------------------------------------------------------------------

describe('RBAC Permission System', () => {
  describe('SYSTEM_ROLE_PERMISSIONS', () => {
    it('should define all 9 roles', () => {
      const roles = Object.keys(SYSTEM_ROLE_PERMISSIONS);
      expect(roles).toHaveLength(9);
      expect(roles).toContain('platform_admin');
      expect(roles).toContain('tenant_owner');
      expect(roles).toContain('tenant_admin');
      expect(roles).toContain('project_manager');
      expect(roles).toContain('risk_manager');
      expect(roles).toContain('assessor');
      expect(roles).toContain('quality_manager');
      expect(roles).toContain('viewer');
    });

    it('should have dashboard:read permission for all roles', () => {
      for (const [, perms] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
        expect(perms).toContain('dashboard:read');
      }
    });

    it('should have admin:read for platform_admin, tenant_owner, tenant_admin, quality_manager', () => {
      const rolesWithAdmin = ['platform_admin', 'tenant_owner', 'tenant_admin', 'quality_manager'];
      for (const role of rolesWithAdmin) {
        expect(SYSTEM_ROLE_PERMISSIONS[role as keyof typeof SYSTEM_ROLE_PERMISSIONS]).toContain('admin:read');
      }
      expect(SYSTEM_ROLE_PERMISSIONS['viewer']).not.toContain('admin:read');
    });

    it('should have csms:write for tenant_owner, tenant_admin, project_manager, quality_manager', () => {
      const rolesWithCsmsWrite = ['tenant_owner', 'tenant_admin', 'project_manager', 'quality_manager'];
      for (const role of rolesWithCsmsWrite) {
        expect(SYSTEM_ROLE_PERMISSIONS[role as keyof typeof SYSTEM_ROLE_PERMISSIONS]).toContain('csms:write');
      }
    });

    it('should have report:write for tenant_owner, tenant_admin, project_manager, risk_manager, quality_manager', () => {
      const rolesWithReportWrite = ['tenant_owner', 'tenant_admin', 'project_manager', 'risk_manager', 'quality_manager'];
      for (const role of rolesWithReportWrite) {
        expect(SYSTEM_ROLE_PERMISSIONS[role as keyof typeof SYSTEM_ROLE_PERMISSIONS]).toContain('report:write');
      }
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the exact permission', () => {
      const payload = makePayload(['assessment:read', 'assessment:create']);
      expect(hasPermission(payload, 'assessment:read')).toBe(true);
    });

    it('should return true when user has wildcard permission', () => {
      const payload = makePayload(['assessment:*']);
      expect(hasPermission(payload, 'assessment:read')).toBe(true);
      expect(hasPermission(payload, 'assessment:create')).toBe(true);
    });

    it('should return false when user lacks the permission', () => {
      const payload = makePayload(['assessment:read']);
      expect(hasPermission(payload, 'assessment:create')).toBe(false);
    });

    it('should return false for empty permissions', () => {
      const payload = makePayload([]);
      expect(hasPermission(payload, 'assessment:read')).toBe(false);
    });

    it('should resolve permissions from roles when no explicit permissions', () => {
      // When permissions is undefined/null, hasPermission falls through to resolvePermissions
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        roles: ['viewer'],
        permissions: null as unknown as string[],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        type: 'access' as const,
      };
      expect(hasPermission(payload, 'assessment:read')).toBe(true);
      expect(hasPermission(payload, 'dashboard:read')).toBe(true);
    });
  });

  describe('resolvePermissions', () => {
    it('should resolve permissions for a single role', () => {
      const perms = resolvePermissions(['viewer']);
      expect(perms).toContain('dashboard:read');
      expect(perms).toContain('assessment:read');
    });

    it('should resolve permissions for multiple roles', () => {
      const perms = resolvePermissions(['viewer', 'assessor']);
      expect(perms.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown role', () => {
      const perms = resolvePermissions(['nonexistent_role']);
      expect(perms).toEqual([]);
    });
  });
});
