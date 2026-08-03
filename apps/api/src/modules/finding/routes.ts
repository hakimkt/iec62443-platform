import rateLimit from '@fastify/rate-limit';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { FindingController } from './finding.controller.js';
import { FindingService } from './finding.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface FindingRouteOptions {
  db: NodePgDatabase;
}

const responseSchema = {
  type: 'object' as const,
  properties: {
    data: { type: 'object' as const, additionalProperties: true },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

const listResponseSchema = {
  type: 'object' as const,
  properties: {
    data: {
      type: 'array' as const,
      items: { type: 'object' as const, additionalProperties: true },
    },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

const paginatedResponseSchema = {
  type: 'object' as const,
  properties: {
    data: {
      type: 'array' as const,
      items: { type: 'object' as const, additionalProperties: true },
    },
    pagination: { type: 'object' as const, additionalProperties: true },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

export async function findingRoutes(app: FastifyInstance, options: FindingRouteOptions) {
  const { db } = options;

  // ── Rate limiting for write endpoints ────────────────────────────────
  // 30 requests per minute per IP
  app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip ?? 'unknown',
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again in ${Math.ceil(Number(context.after) / 1000)} seconds.`,
      },
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    }),
  });

  // ── Helper: create tenant-scoped service ─────────────────────────────
  function createService(tenantId: string, tenantSchema?: string) {
    return new FindingService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Finding CRUD
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /findings ────────────────────────────────────────────────────
  app.get(
    '/findings',
    {
      schema: {
        tags: ['Findings'],
        summary: 'List findings',
        description: 'Returns a paginated list of security findings. Requires authentication.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            status: {
              type: 'string',
              enum: [
                'draft',
                'open',
                'acknowledged',
                'remediation_planned',
                'in_progress',
                'verification',
                'verified',
                'closed',
                'false_positive',
                'risk_accepted',
              ],
            },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'informational'],
            },
            engagementId: { type: 'string', format: 'uuid' },
            search: { type: 'string', maxLength: 200 },
            sort: { type: 'string', enum: ['severity', 'date', 'created'] },
          },
        },
        response: {
          200: paginatedResponseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.listFindings(request, reply);
    },
  );

  // ── POST /findings ───────────────────────────────────────────────────
  app.post(
    '/findings',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Create a finding',
        description: 'Creates a new security finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['title', 'severity'],
          properties: {
            engagementId: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 500 },
            description: { type: 'string', maxLength: 10000 },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'informational'],
            },
            category: { type: 'string', maxLength: 100 },
            subcategory: { type: 'string', maxLength: 100 },
            iecRequirement: { type: 'string', maxLength: 100 },
            assetIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            zoneIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            riskIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            assignedTo: { type: 'string', format: 'uuid' },
            dueDate: { type: 'string', format: 'date-time' },
            source: { type: 'string', enum: ['manual', 'scanner', 'import'] },
            externalRef: { type: 'string', maxLength: 255 },
          },
        },
        response: {
          201: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:create')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.createFinding(request, reply);
    },
  );

  // ── GET /findings/:id ────────────────────────────────────────────────
  app.get(
    '/findings/:id',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Get a finding',
        description: 'Returns a single security finding by ID. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.getFinding(request, reply);
    },
  );

  // ── PATCH /findings/:id ──────────────────────────────────────────────
  app.patch(
    '/findings/:id',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Update a finding',
        description:
          'Updates a security finding. Only draft or open findings can be updated. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            engagementId: { type: 'string', format: 'uuid' },
            title: { type: 'string', minLength: 1, maxLength: 500 },
            description: { type: 'string', maxLength: 10000 },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'informational'],
            },
            category: { type: 'string', maxLength: 100 },
            subcategory: { type: 'string', maxLength: 100 },
            iecRequirement: { type: 'string', maxLength: 100 },
            assetIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            zoneIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            riskIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
            assignedTo: { type: 'string', format: 'uuid' },
            dueDate: { type: 'string', format: 'date-time' },
            externalRef: { type: 'string', maxLength: 255 },
          },
        },
        response: {
          200: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:update')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.updateFinding(request, reply);
    },
  );

  // ── DELETE /findings/:id ─────────────────────────────────────────────
  app.delete(
    '/findings/:id',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Delete a finding',
        description: 'Soft-deletes a draft or false_positive finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:delete')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.deleteFinding(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Status Transitions
  // ══════════════════════════════════════════════════════════════════════

  // ── POST /findings/:id/transition ────────────────────────────────────
  app.post(
    '/findings/:id/transition',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Transition finding status',
        description:
          'Transitions a finding to a new status. The transition must be valid per the status workflow. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['toStatus'],
          properties: {
            toStatus: {
              type: 'string',
              enum: [
                'draft',
                'open',
                'acknowledged',
                'remediation_planned',
                'in_progress',
                'verification',
                'verified',
                'closed',
                'false_positive',
                'risk_accepted',
              ],
            },
            reason: { type: 'string', maxLength: 5000 },
          },
        },
        response: {
          200: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:transition')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.transitionFinding(request, reply);
    },
  );

  // ── GET /findings/:id/history ────────────────────────────────────────
  app.get(
    '/findings/:id/history',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Get finding status history',
        description:
          'Returns the status transition history for a finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: listResponseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.getStatusHistory(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Comments
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /findings/:id/comments ───────────────────────────────────────
  app.get(
    '/findings/:id/comments',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Get finding comments',
        description: 'Returns all comments for a finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: listResponseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.getComments(request, reply);
    },
  );

  // ── POST /findings/:id/comments ──────────────────────────────────────
  app.post(
    '/findings/:id/comments',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Add a comment',
        description: 'Adds a comment to a finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['body'],
          properties: {
            body: { type: 'string', minLength: 1, maxLength: 10000 },
            isInternal: { type: 'boolean', default: false },
          },
        },
        response: {
          201: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:update')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.addComment(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Evidence
  // ══════════════════════════════════════════════════════════════════════

  // ── POST /findings/:id/evidence ──────────────────────────────────────
  app.post(
    '/findings/:id/evidence',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Link evidence to a finding',
        description: 'Links an evidence item to a finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['evidenceId'],
          properties: {
            evidenceId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:update')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.linkEvidence(request, reply);
    },
  );

  // ── GET /findings/:id/evidence ───────────────────────────────────────
  app.get(
    '/findings/:id/evidence',
    {
      schema: {
        tags: ['Findings'],
        summary: 'Get linked evidence',
        description: 'Returns evidence IDs linked to a finding. Requires authentication.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: responseSchema,
        },
      },
      preHandler: [app.authenticate, app.requirePermission('finding:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new FindingController(service);
      return controller.getEvidence(request, reply);
    },
  );
}
