import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { PurdueController } from './purdue.controller.js';
import { PurdueService } from './purdue.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface PurdueRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
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
    data: { type: 'array' as const, items: { type: 'object' as const, additionalProperties: true } },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

const paginatedResponseSchema = {
  type: 'object' as const,
  properties: {
    data: { type: 'array' as const, items: { type: 'object' as const, additionalProperties: true } },
    pagination: { type: 'object' as const, additionalProperties: true },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

export async function purdueRoutes(
  app: FastifyInstance,
  options: PurdueRouteOptions,
) {
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
    return new PurdueService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Purdue Models
  // ══════════════════════════════════════════════════════════════════════

  app.get('/purdue-models', {
    schema: {
      tags: ['Purdue'],
      summary: 'List Purdue models',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          search: { type: 'string', maxLength: 200 },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.listModels(request, reply);
  });

  app.post('/purdue-models', {
    schema: {
      tags: ['Purdue'],
      summary: 'Create a Purdue model',
      security: [{ bearerAuth: [] }],
      body: { type: 'object', required: ['name'] },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.createModel(request, reply);
  });

  app.get('/purdue-models/:id', {
    schema: {
      tags: ['Purdue'],
      summary: 'Get a Purdue model',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.getModel(request, reply);
  });

  app.patch('/purdue-models/:id', {
    schema: {
      tags: ['Purdue'],
      summary: 'Update a Purdue model',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.updateModel(request, reply);
  });

  app.delete('/purdue-models/:id', {
    schema: {
      tags: ['Purdue'],
      summary: 'Delete a Purdue model',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.deleteModel(request, reply);
  });

  // ── Levels ───────────────────────────────────────────────────────────

  app.get('/purdue-models/:id/levels', {
    schema: {
      tags: ['Purdue'],
      summary: 'List levels for a model',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: listResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.listLevels(request, reply);
  });

  app.post('/purdue-models/:id/levels', {
    schema: {
      tags: ['Purdue'],
      summary: 'Create a level',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['levelNumber', 'name'] },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.createLevel(request, reply);
  });

  app.patch('/purdue-models/:id/levels/:levelId', {
    schema: {
      tags: ['Purdue'],
      summary: 'Update a level',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'levelId'], properties: { id: { type: 'string', format: 'uuid' }, levelId: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.updateLevel(request, reply);
  });

  app.delete('/purdue-models/:id/levels/:levelId', {
    schema: {
      tags: ['Purdue'],
      summary: 'Delete a level',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'levelId'], properties: { id: { type: 'string', format: 'uuid' }, levelId: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.deleteLevel(request, reply);
  });

  // ── Asset Mappings ───────────────────────────────────────────────────

  app.get('/purdue-models/:id/mappings', {
    schema: {
      tags: ['Purdue'],
      summary: 'List asset mappings',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: listResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.listMappings(request, reply);
  });

  app.post('/purdue-models/:id/mappings', {
    schema: {
      tags: ['Purdue'],
      summary: 'Add an asset mapping',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['assetId', 'levelId'] },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.addMapping(request, reply);
  });

  app.delete('/purdue-models/:id/mappings/:assetId', {
    schema: {
      tags: ['Purdue'],
      summary: 'Remove an asset mapping',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'assetId'], properties: { id: { type: 'string', format: 'uuid' }, assetId: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.removeMapping(request, reply);
  });

  // ── Communication Rules ──────────────────────────────────────────────

  app.get('/purdue-models/:id/rules', {
    schema: {
      tags: ['Purdue'],
      summary: 'List communication rules',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: listResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.listRules(request, reply);
  });

  app.post('/purdue-models/:id/rules', {
    schema: {
      tags: ['Purdue'],
      summary: 'Create a communication rule',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['sourceLevelId', 'targetLevelId'] },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.createRule(request, reply);
  });

  app.patch('/purdue-models/:id/rules/:ruleId', {
    schema: {
      tags: ['Purdue'],
      summary: 'Update a communication rule',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'ruleId'], properties: { id: { type: 'string', format: 'uuid' }, ruleId: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.updateRule(request, reply);
  });

  app.delete('/purdue-models/:id/rules/:ruleId', {
    schema: {
      tags: ['Purdue'],
      summary: 'Delete a communication rule',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'ruleId'], properties: { id: { type: 'string', format: 'uuid' }, ruleId: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.deleteRule(request, reply);
  });

  // ── Compliance ───────────────────────────────────────────────────────

  app.get('/purdue-models/:id/compliance', {
    schema: {
      tags: ['Purdue'],
      summary: 'Get Purdue model compliance',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('purdue:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new PurdueController(service);
    return controller.getCompliance(request, reply);
  });
}
