import rateLimit from '@fastify/rate-limit';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { RemediationController } from './remediation.controller.js';
import { RemediationService } from './remediation.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface RemediationRouteOptions {
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

export async function remediationRoutes(app: FastifyInstance, options: RemediationRouteOptions) {
  const { db } = options;

  app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip ?? 'unknown',
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again in ${Math.ceil(Number(context.after) / 1000)} seconds.`,
      },
      meta: { requestId: '', timestamp: new Date().toISOString() },
    }),
  });

  function createService(tenantId: string, tenantSchema?: string) {
    return new RemediationService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // List Plans
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/remediation/plans',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'List remediation plans',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            status: { type: 'string' },
            search: { type: 'string', maxLength: 200 },
          },
        },
        response: { 200: paginatedResponseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.listPlans(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Plan
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/remediation/plans',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Create a remediation plan',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            findingIds: { type: 'array', items: { type: 'string' } },
            riskIds: { type: 'array', items: { type: 'string' } },
            ownerId: { type: 'string' },
            budgetEstimate: { type: 'number' },
            startDate: { type: 'string' },
            targetDate: { type: 'string' },
          },
        },
        response: { 201: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.createPlan(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Plan
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/remediation/plans/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Get a remediation plan',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.getPlan(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Update Plan
  // ══════════════════════════════════════════════════════════════════════

  app.patch(
    '/remediation/plans/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Update a remediation plan',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.updatePlan(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Plan
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/remediation/plans/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Delete a remediation plan',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 204: { type: 'null' } },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.deletePlan(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Actions
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/remediation/actions',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'List remediation actions',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            planId: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
            assigneeId: { type: 'string', format: 'uuid' },
          },
        },
        response: { 200: paginatedResponseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.listActions(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Action (under plan)
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/remediation/plans/:planId/actions',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Create a remediation action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['planId'],
          properties: { planId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            findingId: { type: 'string' },
            riskId: { type: 'string' },
            assigneeId: { type: 'string' },
            startDate: { type: 'string' },
            dueDate: { type: 'string' },
            costEstimate: { type: 'number' },
            milestone: { type: 'string' },
          },
        },
        response: { 201: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.createAction(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Action
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/remediation/actions/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Get a remediation action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.getAction(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Update Action
  // ══════════════════════════════════════════════════════════════════════

  app.patch(
    '/remediation/actions/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Update a remediation action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.updateAction(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Action
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/remediation/actions/:id',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Delete a remediation action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: { 204: { type: 'null' } },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.deleteAction(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Verifications
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/remediation/actions/:actionId/verifications',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'List verifications for an action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['actionId'],
          properties: { actionId: { type: 'string', format: 'uuid' } },
        },
        response: { 200: listResponseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.listVerifications(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Verify Action
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/remediation/actions/:actionId/verifications',
    {
      schema: {
        tags: ['Remediation'],
        summary: 'Verify a remediation action',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['actionId'],
          properties: { actionId: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['result'],
          properties: {
            result: { type: 'string', enum: ['pass', 'fail', 'partial'] },
            notes: { type: 'string' },
          },
        },
        response: { 201: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('remediation:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new RemediationController(service);
      return controller.verifyAction(request, reply);
    },
  );
}
