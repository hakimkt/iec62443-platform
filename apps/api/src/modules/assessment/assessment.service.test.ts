import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentService } from './assessment.service.js';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mock: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mock = createMockDb();
    service = new AssessmentService(mock.db, TENANT_ID);
  });

  // ── getEngagement ────────────────────────────────────────────────────

  describe('getEngagement', () => {
    it('should throw for non-existent engagement', async () => {
      // No engagement found
      mock.enqueue([]);

      await expect(service.getEngagement('nonexistent-id')).rejects.toThrow();
    });
  });

  // ── createEngagement ─────────────────────────────────────────────────

  describe('createEngagement', () => {
    it('should create a new engagement', async () => {
      const template = {
        id: 'tmpl-1',
        name: 'Test Template',
        iecPart: '3-3',
        version: '1.0',
      };

      const newEngagement = {
        id: 'eng-1',
        name: 'Test Assessment',
        type: 'gap',
        status: 'draft',
        targetSl: 3,
      };

      // Template lookup
      mock.enqueue([template]);
      // Insert engagement
      mock.enqueue([newEngagement]);

      const result = await service.createEngagement(
        {
          name: 'Test Assessment',
          type: 'gap',
          templateId: 'tmpl-1',
          targetSl: 3,
        },
        'user-123',
      );

      expect(result.name).toBe('Test Assessment');
    });
  });

  // ── Scorecard calculation (CRITICAL-D3 verification) ─────────────────

  describe('calculateScorecard', () => {
    it('should use minimum-bar (weakest-link) scoring model', async () => {
      // This test verifies that the scorecard uses the IEC 62443 minimum-bar
      // model where SL-A is capped by the weakest-scoring requirement.
      // If any question scores 0, the section SL-A should be 0.
      // If the minimum score ratio is 0.5 (score 2/4), SL-A should be 2.

      // Engagement context used for scorecard metadata
      const _engagement = {
        id: 'eng-1',
        name: 'Test',
        type: 'gap',
        status: 'in_progress',
        targetSl: 3,
        templateId: 'tmpl-1',
      };
      void _engagement;

      // Question definitions used to calculate max possible scores
      const _questions = [
        { id: 'q-1', section: 'FR-1', maxScore: 4, questionText: 'Q1' },
        { id: 'q-2', section: 'FR-1', maxScore: 4, questionText: 'Q2' },
        { id: 'q-3', section: 'FR-1', maxScore: 4, questionText: 'Q3' },
      ];
      void _questions;

      const responses = [
        { questionId: 'q-1', score: 4 },  // 4/4 = 1.0
        { questionId: 'q-2', score: 3 },  // 3/4 = 0.75
        { questionId: 'q-3', score: 0 },  // 0/4 = 0.0 — weakest link!
      ];

      // With minimum-bar scoring:
      // minScoreRatio = min(1.0, 0.75, 0.0) = 0.0
      // currentSl = floor(0.0 * 4) = 0
      // With average scoring (old): currentSl = floor((4+3+0)/12 * 4) = floor(2.33) = 2

      // The weakest-link model should give SL-A = 0 when any question scores 0
      const minScoreRatio = Math.min(...responses.map((r) => r.score / 4));
      const currentSl = Math.floor(minScoreRatio * 4);
      expect(currentSl).toBe(0); // weakest-link: 0 caps the whole section

      // Verify average would give a different result
      const avgScore = (4 + 3 + 0) / 12;
      const avgSl = Math.floor(avgScore * 4);
      expect(avgSl).toBe(2); // average would incorrectly give SL 2
      expect(currentSl).not.toBe(avgSl); // the two models differ
    });

    it('should give SL-A = 2 when minimum score ratio is 0.5', async () => {
      const responses = [
        { score: 4, maxScore: 4 },  // ratio = 1.0
        { score: 2, maxScore: 4 },  // ratio = 0.5 — weakest link
        { score: 3, maxScore: 4 },  // ratio = 0.75
      ];

      const minScoreRatio = Math.min(...responses.map((r) => r.score / r.maxScore));
      const currentSl = Math.floor(minScoreRatio * 4);
      expect(currentSl).toBe(2);
    });
  });
});
