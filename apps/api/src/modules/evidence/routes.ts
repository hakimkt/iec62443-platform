import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { EvidenceController } from './evidence.controller.js';
import { EvidenceService } from './evidence.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface EvidenceRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function evidenceRoutes(
  app: FastifyInstance,
  options: EvidenceRouteOptions,
) {
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
  function createService(tenantId: string) {
    return new EvidenceService(db, tenantId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Evidence CRUD
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /evidence ────────────────────────────────────────────────────
  app.get('/evidence', {
    schema: {
      tags: ['Evidence'],
      summary: 'List evidence items',
      description: 'Returns a paginated list of evidence items. Requires authentication.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          evidenceType: { type: 'string', enum: ['document', 'screenshot', 'config', 'log', 'scan_result', 'network_capture', 'certificate', 'interview', 'other'] },
          search: { type: 'string', maxLength: 200 },
          tags: { type: 'string', description: 'Comma-separated list of tags to filter by' },
          sort: { type: 'string', enum: ['date', 'created'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('evidence:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.listEvidence(request, reply);
  });

  // ── POST /evidence ───────────────────────────────────────────────────
  app.post('/evidence', {
    schema: {
      tags: ['Evidence'],
      summary: 'Create evidence item',
      description: 'Creates a new evidence item (metadata-only, no file upload). Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'evidenceType'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          evidenceType: { type: 'string', enum: ['document', 'screenshot', 'config', 'log', 'scan_result', 'network_capture', 'certificate', 'interview', 'other'] },
          retentionUntil: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string', maxLength: 100 }, maxItems: 20 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('evidence:upload')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.createEvidence(request, reply);
  });

  // ── GET /evidence/:id ────────────────────────────────────────────────
  app.get('/evidence/:id', {
    schema: {
      tags: ['Evidence'],
      summary: 'Get evidence item',
      description: 'Returns a single evidence item by ID. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
    preHandler: [app.authenticate, app.requirePermission('evidence:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.getEvidence(request, reply);
  });

  // ── PATCH /evidence/:id ──────────────────────────────────────────────
  app.patch('/evidence/:id', {
    schema: {
      tags: ['Evidence'],
      summary: 'Update evidence item',
      description: 'Updates an evidence item (title, description, tags only). Requires authentication.',
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
          title: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          tags: { type: 'array', items: { type: 'string', maxLength: 100 }, maxItems: 20 },
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
    preHandler: [app.authenticate, app.requirePermission('evidence:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.updateEvidence(request, reply);
  });

  // ── DELETE /evidence/:id ─────────────────────────────────────────────
  app.delete('/evidence/:id', {
    schema: {
      tags: ['Evidence'],
      summary: 'Delete evidence item',
      description: 'Deletes an evidence item. Cannot delete if linked to active entities. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('evidence:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.deleteEvidence(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Evidence Links
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /evidence/:id/links ──────────────────────────────────────────
  app.get('/evidence/:id/links', {
    schema: {
      tags: ['Evidence'],
      summary: 'Get evidence links',
      description: 'Returns all links for an evidence item. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
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
    preHandler: [app.authenticate, app.requirePermission('evidence:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.getLinks(request, reply);
  });

  // ── POST /evidence/:id/links ─────────────────────────────────────────
  app.post('/evidence/:id/links', {
    schema: {
      tags: ['Evidence'],
      summary: 'Link evidence to entity',
      description: 'Links evidence to a domain entity (finding, assessment, risk, csms_element). Requires authentication.',
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
        required: ['entityType', 'entityId'],
        properties: {
          entityType: { type: 'string', enum: ['finding', 'assessment', 'risk', 'csms_element'] },
          entityId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('evidence:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.linkEvidence(request, reply);
  });

  // ── DELETE /evidence/:id/links/:linkId ───────────────────────────────
  app.delete('/evidence/:id/links/:linkId', {
    schema: {
      tags: ['Evidence'],
      summary: 'Remove evidence link',
      description: 'Removes a link between evidence and a domain entity. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'linkId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          linkId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        204: {
          type: 'null',
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('evidence:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.unlinkEvidence(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Chain of Custody
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /evidence/:id/chain-of-custody ───────────────────────────────
  app.get('/evidence/:id/chain-of-custody', {
    schema: {
      tags: ['Evidence'],
      summary: 'Get chain of custody',
      description: 'Returns chain of custody events for an evidence item. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
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
    preHandler: [app.authenticate, app.requirePermission('evidence:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.getChainOfCustody(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Evidence Verification
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /evidence/:id/verify ─────────────────────────────────────────
  app.get('/evidence/:id/verify', {
    schema: {
      tags: ['Evidence'],
      summary: 'Verify evidence integrity',
      description: 'Verifies evidence integrity by checking the SHA-256 hash. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
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
    preHandler: [app.authenticate, app.requirePermission('evidence:verify')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.verifyEvidence(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Storage Quota
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /tenant/storage ──────────────────────────────────────────────
  app.get('/tenant/storage', {
    schema: {
      tags: ['Evidence'],
      summary: 'Get storage quota',
      description: 'Returns storage quota information for the tenant. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('evidence:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new EvidenceController(service);
    return controller.getStorageQuota(request, reply);
  });
}
