import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemediationService } from './remediation.service.js';

// ---------------------------------------------------------------------------
// Mock database – every method returns a thenable proxy that resolves from
// a queue when awaited.  Non-awaited calls (chaining) return the proxy.
// ---------------------------------------------------------------------------

function createMockDb() {
  const resolvedQueue: unknown[] = [];

  function createChain(): unknown {
    const handler: ProxyHandler<object> = {
      get(_target, prop, _receiver) {
        if (prop === 'then') {
          // When awaited, pop the next value from the queue
          return (resolve: (v: unknown) => void, _reject: (v: unknown) => void) => {
            const next = resolvedQueue.shift();
            resolve(next);
          };
        }
        // Any other method call returns the chain for further chaining
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

describe('RemediationService', () => {
  let service: RemediationService;
  let mock: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mock = createMockDb();
    service = new RemediationService(mock.db, TENANT_ID);
  });

  // ── getPlan ──────────────────────────────────────────────────────────

  describe('getPlan', () => {
    it('should throw 404 when plan not found', async () => {
      mock.enqueue([]); // getPlan select → []

      await expect(service.getPlan('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'PLAN_NOT_FOUND',
      });
    });

    it('should return plan when found', async () => {
      const plan = {
        id: 'plan-1',
        name: 'Test Plan',
        description: 'desc',
        findingIds: [],
        riskIds: [],
        ownerId: null,
        status: 'planned',
        budgetEstimate: null,
        budgetActual: null,
        startDate: null,
        targetDate: null,
        completedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      mock.enqueue([plan]); // getPlan select

      const result = await service.getPlan('plan-1');
      expect(result.id).toBe('plan-1');
      expect(result.name).toBe('Test Plan');
    });
  });

  // ── createPlan ───────────────────────────────────────────────────────

  describe('createPlan', () => {
    it('should create a plan and return it', async () => {
      const newPlan = {
        id: 'plan-new',
        name: 'New Plan',
        description: null,
        findingIds: [],
        riskIds: [],
        ownerId: null,
        status: 'planned',
        budgetEstimate: null,
        budgetActual: null,
        startDate: null,
        targetDate: null,
        completedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [newPlan],  // insert().returning()
        [],         // audit: select last hash
        undefined,  // audit: insert values
        [newPlan],  // getPlan() → select().from().where().limit()
      );

      const result = await service.createPlan({ name: 'New Plan' }, USER_ID);
      expect(result.id).toBe('plan-new');
      expect(result.name).toBe('New Plan');
    });

    it('should throw 500 when insert fails', async () => {
      mock.enqueue([]); // insert().returning() → []

      await expect(
        service.createPlan({ name: 'Fail Plan' }, USER_ID),
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'PLAN_CREATE_FAILED',
      });
    });
  });

  // ── updatePlan ───────────────────────────────────────────────────────

  describe('updatePlan', () => {
    it('should set completedAt when status is completed', async () => {
      const existingPlan = {
        id: 'plan-1',
        name: 'Plan',
        description: null,
        findingIds: [],
        riskIds: [],
        ownerId: null,
        status: 'in_progress',
        budgetEstimate: null,
        budgetActual: null,
        startDate: null,
        targetDate: null,
        completedAt: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [existingPlan],                                                   // getPlan() existence check
        undefined,                                                        // update().set().where()
        [],                                                               // audit: select last hash
        undefined,                                                        // audit: insert values
        [{ ...existingPlan, status: 'completed', completedAt: new Date() }], // getPlan() return
      );

      const result = await service.updatePlan('plan-1', { status: 'completed' }, USER_ID);
      expect(result.status).toBe('completed');
    });
  });

  // ── deletePlan ───────────────────────────────────────────────────────

  describe('deletePlan', () => {
    it('should throw 404 when plan not found', async () => {
      mock.enqueue([]); // getPlan() → []

      await expect(service.deletePlan('nonexistent', USER_ID)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ── getAction ────────────────────────────────────────────────────────

  describe('getAction', () => {
    it('should throw 404 when action not found', async () => {
      mock.enqueue([]); // select().from().where().limit() → []

      await expect(service.getAction('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'ACTION_NOT_FOUND',
      });
    });
  });

  // ── verifyAction ─────────────────────────────────────────────────────

  describe('verifyAction', () => {
    it('should create a verification record', async () => {
      const existingAction = {
        id: 'action-1',
        planId: 'plan-1',
        title: 'Action',
        description: null,
        findingId: null,
        riskId: null,
        assigneeId: null,
        status: 'completed',
        startDate: null,
        dueDate: null,
        completedDate: null,
        costEstimate: null,
        costActual: null,
        milestone: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      const newVerification = {
        id: 'ver-1',
        actionId: 'action-1',
        verifiedBy: USER_ID,
        verificationDate: new Date('2025-06-01'),
        result: 'pass',
        notes: null,
        createdAt: new Date('2025-06-01'),
      };

      mock.enqueue(
        [existingAction],    // getAction() existence check
        [newVerification],   // insert().returning()
        [],                  // audit: select last hash
        undefined,           // audit: insert values
      );

      const result = await service.verifyAction(
        'action-1',
        { result: 'pass', notes: 'Looks good' },
        USER_ID,
      );
      expect(result.id).toBe('ver-1');
      expect(result.result).toBe('pass');
    });
  });
});
