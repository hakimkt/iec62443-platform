import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CSMSService } from './csms.service.js';

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

describe('CSMSService', () => {
  let service: CSMSService;
  let mock: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mock = createMockDb();
    service = new CSMSService(mock.db, TENANT_ID);
  });

  // ── getFramework ─────────────────────────────────────────────────────

  describe('getFramework', () => {
    it('should throw 404 when framework not found', async () => {
      mock.enqueue([]);

      await expect(service.getFramework('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'FRAMEWORK_NOT_FOUND',
      });
    });

    it('should return framework when found', async () => {
      const framework = {
        id: 'fw-1',
        name: 'IEC 62443 CSMS',
        organizationId: null,
        version: '1.0',
        status: 'draft',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      mock.enqueue([framework]);

      const result = await service.getFramework('fw-1');
      expect(result.id).toBe('fw-1');
      expect(result.name).toBe('IEC 62443 CSMS');
    });
  });

  // ── createFramework ──────────────────────────────────────────────────

  describe('createFramework', () => {
    it('should create a framework with default version', async () => {
      const newFramework = {
        id: 'fw-new',
        name: 'New CSMS',
        organizationId: null,
        version: '1.0',
        status: 'draft',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [newFramework],  // insert().returning()
        [],              // audit: select last hash
        undefined,       // audit: insert values
        [newFramework],  // getFramework() select
      );

      const result = await service.createFramework({ name: 'New CSMS' }, USER_ID);
      expect(result.id).toBe('fw-new');
      expect(result.version).toBe('1.0');
    });

    it('should throw 500 when insert fails', async () => {
      mock.enqueue([]); // insert().returning() → []

      await expect(
        service.createFramework({ name: 'Fail' }, USER_ID),
      ).rejects.toMatchObject({
        statusCode: 500,
        code: 'FRAMEWORK_CREATE_FAILED',
      });
    });
  });

  // ── approvePolicy ────────────────────────────────────────────────────

  describe('approvePolicy', () => {
    it('should set status to approved and set approvedBy/approvedAt', async () => {
      const policy = {
        id: 'pol-1',
        frameworkId: 'fw-1',
        elementId: null,
        title: 'Policy',
        version: '1.0',
        status: 'review',
        body: null,
        approvedBy: null,
        approvedAt: null,
        reviewCycle: 365,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mock.enqueue(
        [policy],                                                                  // getPolicy() existence check
        undefined,                                                                  // update().set().where()
        [],                                                                         // audit: select last hash
        undefined,                                                                  // audit: insert values
        [{ ...policy, status: 'approved', approvedBy: USER_ID, approvedAt: new Date() }], // getPolicy() return
      );

      const result = await service.approvePolicy('pol-1', USER_ID);
      expect(result.status).toBe('approved');
    });
  });

  // ── getGapAnalysis ───────────────────────────────────────────────────

  describe('getGapAnalysis', () => {
    it('should return gap items for non-implemented elements', async () => {
      const framework = {
        id: 'fw-1',
        name: 'CSMS',
        organizationId: null,
        version: '1.0',
        status: 'active',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };
      const elements = [
        {
          id: 'elem-1',
          frameworkId: 'fw-1',
          category: 'Policy',
          title: 'Access Control',
          description: null,
          requirementRef: '4.2.1',
          implementationStatus: 'partial',
          maturityScore: 2,
          ownerId: null,
          lastReviewed: null,
          nextReview: null,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'elem-2',
          frameworkId: 'fw-1',
          category: 'Procedure',
          title: 'Incident Response',
          description: null,
          requirementRef: '4.3.1',
          implementationStatus: 'implemented',
          maturityScore: 4,
          ownerId: null,
          lastReviewed: null,
          nextReview: null,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];

      mock.enqueue(
        [framework],  // getFramework() existence check
        elements,      // select elements → orderBy resolves
      );

      const result = await service.getGapAnalysis('fw-1');
      expect(result.frameworkId).toBe('fw-1');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]!.elementId).toBe('elem-1');
      expect(result.elements[0]!.priority).toBe('critical');
    });
  });

  // ── getElement ───────────────────────────────────────────────────────

  describe('getElement', () => {
    it('should throw 404 when element not found', async () => {
      mock.enqueue([]);

      await expect(service.getElement('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'ELEMENT_NOT_FOUND',
      });
    });
  });

  // ── getPolicy ────────────────────────────────────────────────────────

  describe('getPolicy', () => {
    it('should throw 404 when policy not found', async () => {
      mock.enqueue([]);

      await expect(service.getPolicy('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'POLICY_NOT_FOUND',
      });
    });
  });
});
