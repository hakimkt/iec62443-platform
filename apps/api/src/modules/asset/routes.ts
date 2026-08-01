import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { AssetController } from './asset.controller.js';
import { AssetService } from './asset.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface AssetRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function assetRoutes(
  app: FastifyInstance,
  options: AssetRouteOptions,
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
    return new AssetService(db, tenantId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Asset CRUD
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assets ──────────────────────────────────────────────────────
  app.get('/assets', {
    schema: {
      tags: ['Assets'],
      summary: 'List assets',
      description: 'Returns a paginated list of assets with optional filters. Requires authentication.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          type: { type: 'string', enum: ['plc', 'hmi', 'scada_server', 'engineering_workstation', 'switch', 'router', 'firewall', 'historian', 'mes', 'erp', 'server', 'workstation', 'sensor', 'actuator', 'vfd', 'dcs_controller', 'rtu', 'safety_controller', 'other'] },
          criticality: { type: 'string', enum: ['safety_critical', 'mission_critical', 'business_critical', 'operational', 'non_critical'] },
          operationalStatus: { type: 'string', enum: ['operational', 'maintenance', 'decommissioned', 'standby'] },
          purdueLevel: { type: 'integer', minimum: 0, maximum: 5 },
          zoneId: { type: 'string', format: 'uuid' },
          search: { type: 'string', maxLength: 200 },
          sort: { type: 'string', enum: ['name', 'criticality', 'date'] },
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
    preHandler: [app.authenticate, app.requirePermission('asset:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.listAssets(request, reply);
  });

  // ── POST /assets ─────────────────────────────────────────────────────
  app.post('/assets', {
    schema: {
      tags: ['Assets'],
      summary: 'Create an asset',
      description: 'Creates a new asset. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 10000 },
          type: { type: 'string', enum: ['plc', 'hmi', 'scada_server', 'engineering_workstation', 'switch', 'router', 'firewall', 'historian', 'mes', 'erp', 'server', 'workstation', 'sensor', 'actuator', 'vfd', 'dcs_controller', 'rtu', 'safety_controller', 'other'] },
          criticality: { type: 'string', enum: ['safety_critical', 'mission_critical', 'business_critical', 'operational', 'non_critical'] },
          vendor: { type: 'string', maxLength: 255 },
          model: { type: 'string', maxLength: 255 },
          firmwareVersion: { type: 'string', maxLength: 100 },
          serialNumber: { type: 'string', maxLength: 255 },
          ipAddress: { type: 'string', maxLength: 45 },
          macAddress: { type: 'string', maxLength: 17 },
          networkSegment: { type: 'string', maxLength: 255 },
          purdueLevel: { type: 'integer', minimum: 0, maximum: 5 },
          zoneId: { type: 'string', format: 'uuid' },
          location: { type: 'string', maxLength: 500 },
          operationalStatus: { type: 'string', enum: ['operational', 'maintenance', 'decommissioned', 'standby'], default: 'operational' },
          installDate: { type: 'string', format: 'date-time' },
          lastPatchDate: { type: 'string', format: 'date-time' },
          eolDate: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
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
    preHandler: [app.authenticate, app.requirePermission('asset:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.createAsset(request, reply);
  });

  // ── GET /assets/stats ────────────────────────────────────────────────
  app.get('/assets/stats', {
    schema: {
      tags: ['Assets'],
      summary: 'Get asset statistics',
      description: 'Returns aggregate counts of assets by type, criticality, and total. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('asset:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.getAssetStats(request, reply);
  });

  // ── GET /assets/export ───────────────────────────────────────────────
  app.get('/assets/export', {
    schema: {
      tags: ['Assets'],
      summary: 'Export assets',
      description: 'Exports all assets as a JSON array. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('asset:export')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.exportAssets(request, reply);
  });

  // ── POST /assets/import ──────────────────────────────────────────────
  app.post('/assets/import', {
    schema: {
      tags: ['Assets'],
      summary: 'Start a bulk import job',
      description: 'Creates a new import job record for bulk asset import. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['totalRecords'],
        properties: {
          totalRecords: { type: 'integer', minimum: 0 },
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
    preHandler: [app.authenticate, app.requirePermission('asset:import')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.importAssets(request, reply);
  });

  // ── GET /assets/import/:jobId ────────────────────────────────────────
  app.get('/assets/import/:jobId', {
    schema: {
      tags: ['Assets'],
      summary: 'Get import job status',
      description: 'Returns the status of an import job. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['jobId'],
        properties: {
          jobId: { type: 'string', format: 'uuid' },
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
    preHandler: [app.authenticate, app.requirePermission('asset:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.getImportJobStatus(request, reply);
  });

  // ── GET /assets/:id ──────────────────────────────────────────────────
  app.get('/assets/:id', {
    schema: {
      tags: ['Assets'],
      summary: 'Get an asset',
      description: 'Returns a single asset by ID. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('asset:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.getAsset(request, reply);
  });

  // ── PATCH /assets/:id ────────────────────────────────────────────────
  app.patch('/assets/:id', {
    schema: {
      tags: ['Assets'],
      summary: 'Update an asset',
      description: 'Updates an asset. Requires authentication.',
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
          name: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 10000 },
          type: { type: 'string', enum: ['plc', 'hmi', 'scada_server', 'engineering_workstation', 'switch', 'router', 'firewall', 'historian', 'mes', 'erp', 'server', 'workstation', 'sensor', 'actuator', 'vfd', 'dcs_controller', 'rtu', 'safety_controller', 'other'] },
          criticality: { type: 'string', enum: ['safety_critical', 'mission_critical', 'business_critical', 'operational', 'non_critical'] },
          vendor: { type: 'string', maxLength: 255 },
          model: { type: 'string', maxLength: 255 },
          firmwareVersion: { type: 'string', maxLength: 100 },
          serialNumber: { type: 'string', maxLength: 255 },
          ipAddress: { type: 'string', maxLength: 45 },
          macAddress: { type: 'string', maxLength: 17 },
          networkSegment: { type: 'string', maxLength: 255 },
          purdueLevel: { type: 'integer', minimum: 0, maximum: 5 },
          zoneId: { type: 'string', format: 'uuid' },
          location: { type: 'string', maxLength: 500 },
          operationalStatus: { type: 'string', enum: ['operational', 'maintenance', 'decommissioned', 'standby'] },
          installDate: { type: 'string', format: 'date-time' },
          lastPatchDate: { type: 'string', format: 'date-time' },
          eolDate: { type: 'string', format: 'date-time' },
          metadata: { type: 'object' },
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
    preHandler: [app.authenticate, app.requirePermission('asset:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.updateAsset(request, reply);
  });

  // ── DELETE /assets/:id ───────────────────────────────────────────────
  app.delete('/assets/:id', {
    schema: {
      tags: ['Assets'],
      summary: 'Delete an asset',
      description: 'Soft-deletes an asset by setting operationalStatus to decommissioned. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('asset:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.deleteAsset(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Asset Relationships
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assets/:id/relationships ────────────────────────────────────
  app.get('/assets/:id/relationships', {
    schema: {
      tags: ['Assets'],
      summary: 'Get asset relationships',
      description: 'Returns all relationships for an asset. Requires authentication.',
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
    preHandler: [app.authenticate, app.requirePermission('asset:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.getRelationships(request, reply);
  });

  // ── POST /assets/:id/relationships ───────────────────────────────────
  app.post('/assets/:id/relationships', {
    schema: {
      tags: ['Assets'],
      summary: 'Create a relationship',
      description: 'Creates a relationship between this asset and a target asset. Requires authentication.',
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
        required: ['targetAssetId', 'relationshipType'],
        properties: {
          targetAssetId: { type: 'string', format: 'uuid' },
          relationshipType: { type: 'string', enum: ['communicates_with', 'depends_on', 'controls', 'monitored_by', 'connected_to'] },
          protocol: { type: 'string', maxLength: 100 },
          metadata: { type: 'object' },
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
    preHandler: [app.authenticate, app.requirePermission('asset:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.createRelationship(request, reply);
  });

  // ── DELETE /assets/:id/relationships/:relId ──────────────────────────
  app.delete('/assets/:id/relationships/:relId', {
    schema: {
      tags: ['Assets'],
      summary: 'Delete a relationship',
      description: 'Deletes a relationship between assets. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'relId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          relId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        204: {
          type: 'null',
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('asset:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssetController(service);
    return controller.deleteRelationship(request, reply);
  });
}
