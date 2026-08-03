import rateLimit from '@fastify/rate-limit';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { CSMSController } from './csms.controller.js';
import { CSMSService } from './csms.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface CSMSRouteOptions {
  db: NodePgDatabase;
}

export async function csmsRoutes(app: FastifyInstance, options: CSMSRouteOptions) {
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
    return new CSMSService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // List Frameworks
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/frameworks',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'List CSMS frameworks',
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
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.listFrameworks(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Framework
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/csms/frameworks',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Create a CSMS framework',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            organizationId: { type: 'string' },
            version: { type: 'string' },
          },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.createFramework(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Framework
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/frameworks/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Get a CSMS framework',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.getFramework(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Update Framework
  // ══════════════════════════════════════════════════════════════════════

  app.patch(
    '/csms/frameworks/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Update a CSMS framework',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.updateFramework(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Framework
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/csms/frameworks/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Delete a CSMS framework',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.deleteFramework(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Elements
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/elements',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'List CSMS elements',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            frameworkId: { type: 'string', format: 'uuid' },
            category: { type: 'string' },
            implementationStatus: { type: 'string' },
          },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.listElements(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Element (under framework)
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/csms/frameworks/:frameworkId/elements',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Create a CSMS element',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['frameworkId'],
          properties: { frameworkId: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.createElement(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Element
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/elements/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Get a CSMS element',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.getElement(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Update Element
  // ══════════════════════════════════════════════════════════════════════

  app.patch(
    '/csms/elements/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Update a CSMS element',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.updateElement(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Element
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/csms/elements/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Delete a CSMS element',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.deleteElement(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Policies
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/policies',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'List CSMS policies',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            frameworkId: { type: 'string', format: 'uuid' },
            status: { type: 'string' },
          },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.listPolicies(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Policy (under framework)
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/csms/frameworks/:frameworkId/policies',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Create a CSMS policy',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['frameworkId'],
          properties: { frameworkId: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.createPolicy(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Policy
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/policies/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Get a CSMS policy',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.getPolicy(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Update Policy
  // ══════════════════════════════════════════════════════════════════════

  app.patch(
    '/csms/policies/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Update a CSMS policy',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.updatePolicy(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Approve Policy
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/csms/policies/:id/approve',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Approve a CSMS policy',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.approvePolicy(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Policy
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/csms/policies/:id',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Delete a CSMS policy',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.deletePolicy(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Improvement Plans
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/frameworks/:frameworkId/improvement-plans',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'List improvement plans for a framework',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['frameworkId'],
          properties: { frameworkId: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.listImprovementPlans(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Improvement Plan
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/csms/frameworks/:frameworkId/improvement-plans',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Create an improvement plan',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['frameworkId'],
          properties: { frameworkId: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.createImprovementPlan(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Gap Analysis
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/csms/frameworks/:id/gap-analysis',
    {
      schema: {
        tags: ['CSMS'],
        summary: 'Get gap analysis for a CSMS framework',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('csms:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new CSMSController(service);
      return controller.getGapAnalysis(request, reply);
    },
  );
}
