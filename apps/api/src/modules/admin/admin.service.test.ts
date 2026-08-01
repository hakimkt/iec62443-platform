import { describe, it, expect, beforeEach } from 'vitest';
import { AdminService } from './admin.service.js';

// ---------------------------------------------------------------------------
// Mock database – thenable proxy that resolves from a queue
// ---------------------------------------------------------------------------

function createMockDb() {
  const resolvedQueue: unknown[] = [];

  function createChain(): unknown {
    const handler: ProxyHandler<object> = {
      get(_target, prop, _receiver) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void, _reject: (v: unknown) => void) => {
            const next = resolvedQueue.shift();
            resolve(next);
          };
        }
        return (..._args: unknown[]) => createChain();
      },
    };
    return new Proxy({}, handler);
  }

  return {
    db: createChain() as import('drizzle-orm/node-postgres').NodePgDatabase,
    enqueue: (...values: unknown[]) => resolvedQueue.push(...values),
  };
}

const TENANT_ID = 'tenant-123';
const USER_ID = 'user-123';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminService', () => {
  let service: AdminService;
  let mock: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mock = createMockDb();
    service = new AdminService(mock.db, TENANT_ID);
  });

  // ── inviteMember ─────────────────────────────────────────────────────

  describe('inviteMember', () => {
    it('should create user and membership for new email', async () => {
      const newUser = {
        id: 'user-new',
        email: 'new@example.com',
        firstName: 'new',
        lastName: '',
        passwordHash: '',
        status: 'active',
        avatarUrl: null,
        mfaEnabled: false,
        mfaSecret: null,
        webauthnKeys: [],
        lastLoginAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      const newMembership = {
        id: 'mem-1',
        tenantId: TENANT_ID,
        userId: 'user-new',
        role: 'member',
        status: 'invited',
        invitedBy: USER_ID,
        joinedAt: null,
        createdAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [],              // no existing user
        [newUser],       // insert user returning
        [],              // no existing membership
        [newMembership], // insert membership returning
        [],              // audit: select last hash
        undefined,       // audit: insert values
      );

      const result = await service.inviteMember('new@example.com', 'member', USER_ID);
      expect(result.userId).toBe('user-new');
      expect(result.status).toBe('invited');
    });

    it('should throw 409 when user is already a member', async () => {
      const existingUser = {
        id: 'user-existing',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        passwordHash: 'hash',
        status: 'active',
        avatarUrl: null,
        mfaEnabled: false,
        mfaSecret: null,
        webauthnKeys: [],
        lastLoginAt: null,
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [existingUser],  // existing user found
        [{ id: 'mem-1' }], // existing membership found
      );

      await expect(
        service.inviteMember('existing@example.com', 'member', USER_ID),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'MEMBERSHIP_EXISTS',
      });
    });
  });

  // ── updateMember ─────────────────────────────────────────────────────

  describe('updateMember', () => {
    it('should throw 404 when membership not found', async () => {
      mock.enqueue([]);

      await expect(
        service.updateMember('user-x', 'admin', USER_ID),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'MEMBERSHIP_NOT_FOUND',
      });
    });
  });

  // ── createRole ───────────────────────────────────────────────────────

  describe('createRole', () => {
    it('should create a role with tenant scope', async () => {
      const newRole = {
        id: 'role-1',
        tenantId: TENANT_ID,
        name: 'Assessor',
        description: 'Can perform assessments',
        isSystem: false,
        permissions: ['assessment:read', 'assessment:write'],
        createdAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [newRole],  // insert().returning()
        [],         // audit: select last hash
        undefined,  // audit: insert values
      );

      const result = await service.createRole(
        { name: 'Assessor', description: 'Can perform assessments', permissions: ['assessment:read', 'assessment:write'] },
        USER_ID,
      );
      expect(result.id).toBe('role-1');
      expect(result.isSystem).toBe(false);
    });
  });

  // ── createApiKey ─────────────────────────────────────────────────────

  describe('createApiKey', () => {
    it('should create an API key and return the raw key', async () => {
      const newKey = {
        id: 'key-1',
        tenantId: TENANT_ID,
        userId: USER_ID,
        name: 'Test Key',
        keyHash: 'abc123',
        keyPrefix: 'iec62443',
        scopes: ['read'],
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [newKey],  // insert().returning()
        [],        // audit: select last hash
        undefined, // audit: insert values
      );

      const result = await service.createApiKey(
        { name: 'Test Key', scopes: ['read'] },
        USER_ID,
      );
      expect(result.id).toBe('key-1');
      expect(result.name).toBe('Test Key');
      expect(result.key).toMatch(/^iec62443_/);
      expect(result.keyPrefix).toBe('iec62443');
    });
  });

  // ── getTenantSettings ────────────────────────────────────────────────

  describe('getTenantSettings', () => {
    it('should throw 404 when tenant not found', async () => {
      mock.enqueue([]);

      await expect(service.getTenantSettings()).rejects.toMatchObject({
        statusCode: 404,
        code: 'TENANT_NOT_FOUND',
      });
    });

    it('should return tenant settings', async () => {
      const tenant = {
        id: TENANT_ID,
        name: 'Acme Corp',
        slug: 'acme',
        schemaName: 'tenant_acme',
        status: 'active',
        plan: 'professional',
        settings: { locale: 'en', timezone: 'UTC' },
        storageQuota: BigInt(10737418240),
        storageUsed: BigInt(0),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue([tenant]);

      const result = await service.getTenantSettings();
      expect(result.id).toBe(TENANT_ID);
      expect(result.name).toBe('Acme Corp');
      expect(result.settings).toEqual({ locale: 'en', timezone: 'UTC' });
    });
  });
});
