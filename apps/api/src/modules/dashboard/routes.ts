import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface DashboardRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function dashboardRoutes(
  app: FastifyInstance,
  options: DashboardRouteOptions,
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
    return new DashboardService(db, tenantId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Dashboard Summary
  // ══════════════════════════════════════════════════════════════════════

  app.get('/dashboard/summary', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get dashboard summary',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('dashboard:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new DashboardController(service);
    return controller.getSummary(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Risk Heat Map
  // ══════════════════════════════════════════════════════════════════════

  app.get('/dashboard/risk-heatmap', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get risk heat map data',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          registerId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('dashboard:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new DashboardController(service);
    return controller.getRiskHeatMap(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Assessment Progress
  // ══════════════════════════════════════════════════════════════════════

  app.get('/dashboard/assessment-progress', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get assessment progress list',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('dashboard:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new DashboardController(service);
    return controller.getAssessmentProgress(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Recent Findings
  // ══════════════════════════════════════════════════════════════════════

  app.get('/dashboard/recent-findings', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get recent findings',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('dashboard:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new DashboardController(service);
    return controller.getRecentFindings(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Remediation Status
  // ══════════════════════════════════════════════════════════════════════

  app.get('/dashboard/remediation-status', {
    schema: {
      tags: ['Dashboard'],
      summary: 'Get remediation status summary',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('dashboard:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new DashboardController(service);
    return controller.getRemediationStatus(request, reply);
  });
}
