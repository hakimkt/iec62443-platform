import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { RiskController } from './risk.controller.js';
import { RiskService } from './risk.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface RiskRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function riskRoutes(
  app: FastifyInstance,
  options: RiskRouteOptions,
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

  function createService(tenantId: string) {
    return new RiskService(db, tenantId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Risk Registers
  // ══════════════════════════════════════════════════════════════════════

  app.get('/risk-registers', {
    schema: {
      tags: ['Risks'],
      summary: 'List risk registers',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          search: { type: 'string', maxLength: 200 },
          status: { type: 'string', enum: ['active', 'archived'] },
        },
      },
      response: { 200: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, pagination: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.listRegisters(request, reply);
  });

  app.post('/risk-registers', {
    schema: {
      tags: ['Risks'],
      summary: 'Create a risk register',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 500 },
          scopeType: { type: 'string', maxLength: 50 },
          scopeId: { type: 'string', format: 'uuid' },
          ownerId: { type: 'string', format: 'uuid' },
        },
      },
      response: { 201: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.createRegister(request, reply);
  });

  app.get('/risk-registers/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Get a risk register',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.getRegister(request, reply);
  });

  app.patch('/risk-registers/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Update a risk register',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', properties: { name: { type: 'string', maxLength: 500 }, status: { type: 'string', enum: ['active', 'archived'] } } },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.updateRegister(request, reply);
  });

  app.delete('/risk-registers/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Delete a risk register',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.deleteRegister(request, reply);
  });

  // ── Register Heat Map ────────────────────────────────────────────────

  app.get('/risk-registers/:id/heatmap', {
    schema: {
      tags: ['Risks'],
      summary: 'Get risk heat map data',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.getHeatMap(request, reply);
  });

  // ── Register Matrix Config ───────────────────────────────────────────

  app.get('/risk-registers/:id/matrix', {
    schema: {
      tags: ['Risks'],
      summary: 'Get matrix configuration',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.getMatrixConfig(request, reply);
  });

  app.put('/risk-registers/:id/matrix', {
    schema: {
      tags: ['Risks'],
      summary: 'Update matrix configuration',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.updateMatrixConfig(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Risk Entries
  // ══════════════════════════════════════════════════════════════════════

  app.get('/risks', {
    schema: {
      tags: ['Risks'],
      summary: 'List risk entries',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          registerId: { type: 'string', format: 'uuid' },
          category: { type: 'string', enum: ['safety', 'operational', 'environmental', 'financial', 'reputational', 'regulatory'] },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          treatment: { type: 'string', enum: ['mitigate', 'transfer', 'accept', 'avoid', 'pending'] },
          status: { type: 'string', enum: ['identified', 'analyzed', 'treated', 'monitored', 'closed', 'accepted'] },
          search: { type: 'string', maxLength: 200 },
          sort: { type: 'string', enum: ['date', 'score'] },
        },
      },
      response: { 200: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, pagination: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.listRisks(request, reply);
  });

  app.get('/risks/stats', {
    schema: {
      tags: ['Risks'],
      summary: 'Get risk statistics',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          registerId: { type: 'string', format: 'uuid' },
        },
      },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.getRiskStats(request, reply);
  });

  app.post('/risks', {
    schema: {
      tags: ['Risks'],
      summary: 'Create a risk entry',
      security: [{ bearerAuth: [] }],
      body: { type: 'object', required: ['registerId', 'title'] },
      response: { 201: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.createRisk(request, reply);
  });

  app.get('/risks/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Get a risk entry',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.getRisk(request, reply);
  });

  app.patch('/risks/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Update a risk entry',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.updateRisk(request, reply);
  });

  app.delete('/risks/:id', {
    schema: {
      tags: ['Risks'],
      summary: 'Delete a risk entry',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.deleteRisk(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Risk Treatments
  // ══════════════════════════════════════════════════════════════════════

  app.get('/risks/:id/treatments', {
    schema: {
      tags: ['Risks'],
      summary: 'List treatments for a risk',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.listTreatments(request, reply);
  });

  app.post('/risks/:id/treatments', {
    schema: {
      tags: ['Risks'],
      summary: 'Create a treatment for a risk',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['type', 'description'] },
      response: { 201: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.createTreatment(request, reply);
  });

  app.patch('/risks/:id/treatments/:treatmentId', {
    schema: {
      tags: ['Risks'],
      summary: 'Update a treatment',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'treatmentId'], properties: { id: { type: 'string', format: 'uuid' }, treatmentId: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.updateTreatment(request, reply);
  });

  app.delete('/risks/:id/treatments/:treatmentId', {
    schema: {
      tags: ['Risks'],
      summary: 'Delete a treatment',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id', 'treatmentId'], properties: { id: { type: 'string', format: 'uuid' }, treatmentId: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.deleteTreatment(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Risk Acceptances
  // ══════════════════════════════════════════════════════════════════════

  app.get('/risks/:id/acceptances', {
    schema: {
      tags: ['Risks'],
      summary: 'List acceptances for a risk',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.listAcceptances(request, reply);
  });

  app.post('/risks/:id/acceptances', {
    schema: {
      tags: ['Risks'],
      summary: 'Create a risk acceptance',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['justification'] },
      response: { 201: { type: 'object', properties: { data: { type: 'object' }, meta: { type: 'object' } } } },
    },
    preHandler: [app.authenticate, app.requirePermission('risk:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new RiskController(service);
    return controller.createAcceptance(request, reply);
  });
}
