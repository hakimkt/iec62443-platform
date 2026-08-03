import rateLimit from '@fastify/rate-limit';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface ReportRouteOptions {
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

export async function reportRoutes(app: FastifyInstance, options: ReportRouteOptions) {
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
    return new ReportService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Report Templates
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/reports/templates',
    {
      schema: {
        tags: ['Reports'],
        summary: 'List report templates',
        security: [{ bearerAuth: [] }],
        response: { 200: listResponseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('report:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.getTemplates(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // List Reports
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/reports',
    {
      schema: {
        tags: ['Reports'],
        summary: 'List reports',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
            type: { type: 'string' },
            status: { type: 'string' },
            search: { type: 'string', maxLength: 200 },
          },
        },
        response: { 200: paginatedResponseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('report:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.listReports(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Create Report
  // ══════════════════════════════════════════════════════════════════════

  app.post(
    '/reports',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Generate a new report',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['type', 'config'],
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            config: { type: 'object' },
          },
        },
        response: { 201: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('report:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.createReport(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Get Report
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/reports/:id',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Get a report by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('report:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.getReport(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Download Report
  // ══════════════════════════════════════════════════════════════════════

  app.get(
    '/reports/:id/download',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Download a generated report',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: { 200: responseSchema },
      },
      preHandler: [app.authenticate, app.requirePermission('report:read')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.downloadReport(request, reply);
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // Delete Report
  // ══════════════════════════════════════════════════════════════════════

  app.delete(
    '/reports/:id',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Delete a report',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: { type: 'null' },
        },
      },
      preHandler: [app.authenticate, app.requirePermission('report:write')],
    },
    async (request, reply) => {
      const tenantId = request.tenantId ?? '';
      const service = createService(tenantId, request.tenantSchema);
      const controller = new ReportController(service);
      return controller.deleteReport(request, reply);
    },
  );
}
