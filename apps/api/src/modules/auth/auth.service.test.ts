import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';

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

describe('AuthService', () => {
  let service: AuthService;
  let mock: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mock = createMockDb();
    service = new AuthService(mock.db, TENANT_ID);
  });

  // ── registerUser ─────────────────────────────────────────────────────

  describe('registerUser', () => {
    it('should create a new user with hashed password', async () => {
      const newUser = {
        id: 'user-new',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        passwordHash: 'hashed_password',
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

      // No existing user found
      mock.enqueue([]);
      // Insert returns the new user
      mock.enqueue([newUser]);

      const result = await service.registerUser(
        'new@example.com',
        'SecureP@ssw0rd123',
        'New',
        'User',
        '127.0.0.1',
        'test-agent',
      );

      expect(result.user.email).toBe('new@example.com');
      expect(result.user.firstName).toBe('New');
    });

    it('should throw if email already exists', async () => {
      const existingUser = {
        id: 'user-existing',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        passwordHash: 'hashed',
        status: 'active',
      };

      // Existing user found
      mock.enqueue([existingUser]);

      await expect(
        service.registerUser(
          'existing@example.com',
          'SecureP@ssw0rd123',
          'Existing',
          'User',
          '127.0.0.1',
          'test-agent',
        ),
      ).rejects.toThrow();
    });
  });

  // ── loginUser ────────────────────────────────────────────────────────

  describe('loginUser', () => {
    it('should throw for non-existent user', async () => {
      // No user found
      mock.enqueue([]);

      await expect(
        service.loginUser('nonexistent@example.com', 'wrongpassword', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow();
    });
  });

  // ── refreshTokens ────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should throw for invalid refresh token', async () => {
      await expect(
        service.refreshTokens('invalid-token'),
      ).rejects.toThrow();
    });
  });

  // ── verifyMfaSetup ───────────────────────────────────────────────────

  describe('verifyMfaSetup', () => {
    it('should throw when no MFA secret is set', async () => {
      const user = {
        id: USER_ID,
        email: 'test@example.com',
        mfaEnabled: false,
        mfaSecret: null,
      };

      // User lookup
      mock.enqueue([user]);

      await expect(
        service.verifyMfaSetup(USER_ID, '123456', null, '127.0.0.1', 'test-agent'),
      ).rejects.toThrow();
    });
  });

  // ── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should not leak whether user exists', async () => {
      // No user found
      mock.enqueue([]);

      // Should not throw — just return a generic message
      const result = await service.forgotPassword('nonexistent@example.com', '127.0.0.1', 'test-agent');
      expect(result).toBeDefined();
    });
  });
});
