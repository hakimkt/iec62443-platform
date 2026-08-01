import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { ZoneController } from './zone.controller.js';
import { ZoneService } from './zone.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface ZoneRouteOptions {
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

export async function zoneRoutes(
  app: FastifyInstance,
  options: ZoneRouteOptions,
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
    return new ZoneService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Zones
  // ══════════════════════════════════════════════════════════════════════

  app.get('/zones', {
    schema: {
      tags: ['Zones'],
      summary: 'List zones',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          zoneType: { type: 'string', enum: ['process_control', 'safety_instrumented', 'manufacturing_ops', 'enterprise_it', 'idmz', 'remote_access', 'wireless', 'custom'] },
          securityLevel: { type: 'integer', minimum: 0, maximum: 4 },
          parentZoneId: { type: 'string', format: 'uuid' },
          facilityId: { type: 'string', format: 'uuid' },
          purdueLevel: { type: 'integer', minimum: 0, maximum: 5 },
          search: { type: 'string', maxLength: 200 },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.listZones(request, reply);
  });

  app.post('/zones', {
    schema: {
      tags: ['Zones'],
      summary: 'Create a zone',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 5000 },
          zoneType: { type: 'string', enum: ['process_control', 'safety_instrumented', 'manufacturing_ops', 'enterprise_it', 'idmz', 'remote_access', 'wireless', 'custom'] },
          securityLevel: { type: 'integer', minimum: 0, maximum: 4 },
          parentZoneId: { type: 'string', format: 'uuid' },
          purdueLevel: { type: 'integer', minimum: 0, maximum: 5 },
          facilityId: { type: 'string', format: 'uuid' },
          diagramX: { type: 'number' },
          diagramY: { type: 'number' },
          diagramWidth: { type: 'number', exclusiveMinimum: 0 },
          diagramHeight: { type: 'number', exclusiveMinimum: 0 },
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
          metadata: { type: 'object' },
        },
      },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.createZone(request, reply);
  });

  app.get('/zones/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Get a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.getZone(request, reply);
  });

  app.patch('/zones/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Update a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.updateZone(request, reply);
  });

  app.delete('/zones/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Delete a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.deleteZone(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Conduits
  // ══════════════════════════════════════════════════════════════════════

  app.get('/conduits', {
    schema: {
      tags: ['Zones'],
      summary: 'List conduits',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          sourceZoneId: { type: 'string', format: 'uuid' },
          targetZoneId: { type: 'string', format: 'uuid' },
          conduitType: { type: 'string', enum: ['hardwired', 'network', 'wireless', 'removable_media', 'human', 'other'] },
          securityLevel: { type: 'integer', minimum: 0, maximum: 4 },
          search: { type: 'string', maxLength: 200 },
        },
      },
      response: { 200: paginatedResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.listConduits(request, reply);
  });

  app.post('/conduits', {
    schema: {
      tags: ['Zones'],
      summary: 'Create a conduit',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'sourceZoneId', 'targetZoneId', 'conduitType'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 5000 },
          sourceZoneId: { type: 'string', format: 'uuid' },
          targetZoneId: { type: 'string', format: 'uuid' },
          conduitType: { type: 'string', enum: ['hardwired', 'network', 'wireless', 'removable_media', 'human', 'other'] },
          protocol: { type: 'string', maxLength: 100 },
          securityLevel: { type: 'integer', minimum: 0, maximum: 4 },
          encryption: { type: 'boolean' },
          authentication: { type: 'boolean' },
          monitoring: { type: 'boolean' },
          metadata: { type: 'object' },
        },
      },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.createConduit(request, reply);
  });

  app.get('/conduits/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Get a conduit',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.getConduit(request, reply);
  });

  app.patch('/conduits/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Update a conduit',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object' },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.updateConduit(request, reply);
  });

  app.delete('/conduits/:id', {
    schema: {
      tags: ['Zones'],
      summary: 'Delete a conduit',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.deleteConduit(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Zone Memberships
  // ══════════════════════════════════════════════════════════════════════

  app.get('/zones/:id/memberships', {
    schema: {
      tags: ['Zones'],
      summary: 'List memberships for a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: listResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.listMemberships(request, reply);
  });

  app.post('/zones/:id/memberships', {
    schema: {
      tags: ['Zones'],
      summary: 'Add an asset to a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['assetId'],
        properties: {
          assetId: { type: 'string', format: 'uuid' },
        },
      },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.addMembership(request, reply);
  });

  app.delete('/zones/:id/memberships/:assetId', {
    schema: {
      tags: ['Zones'],
      summary: 'Remove an asset from a zone',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'assetId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          assetId: { type: 'string', format: 'uuid' },
        },
      },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.removeMembership(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Segmentation Rules
  // ══════════════════════════════════════════════════════════════════════

  app.get('/zones/:id/rules', {
    schema: {
      tags: ['Zones'],
      summary: 'List segmentation rules for a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      response: { 200: listResponseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.listRules(request, reply);
  });

  app.post('/zones/:id/rules', {
    schema: {
      tags: ['Zones'],
      summary: 'Create a segmentation rule for a zone',
      security: [{ bearerAuth: [] }],
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } },
      body: {
        type: 'object',
        required: ['ruleType'],
        properties: {
          ruleType: { type: 'string', maxLength: 50 },
          description: { type: 'string', maxLength: 5000 },
          direction: { type: 'string', enum: ['inbound', 'outbound', 'bidirectional'] },
          action: { type: 'string', enum: ['allow', 'deny', 'inspect', 'proxy'] },
          isCompliant: { type: 'boolean', default: true },
        },
      },
      response: { 201: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.createRule(request, reply);
  });

  app.delete('/zones/:id/rules/:ruleId', {
    schema: {
      tags: ['Zones'],
      summary: 'Delete a segmentation rule',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id', 'ruleId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          ruleId: { type: 'string', format: 'uuid' },
        },
      },
      response: { 204: { type: 'null' } },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.deleteRule(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Topology
  // ══════════════════════════════════════════════════════════════════════

  app.get('/zone-topology', {
    schema: {
      tags: ['Zones'],
      summary: 'Get the full zone and conduit topology',
      security: [{ bearerAuth: [] }],
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.getTopology(request, reply);
  });

  app.put('/zone-topology', {
    schema: {
      tags: ['Zones'],
      summary: 'Update the zone topology diagram positions',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['zones'],
        properties: {
          zones: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { type: 'string', format: 'uuid' },
                diagramX: { type: 'number' },
                diagramY: { type: 'number' },
                diagramWidth: { type: 'number', exclusiveMinimum: 0 },
                diagramHeight: { type: 'number', exclusiveMinimum: 0 },
              },
            },
          },
        },
      },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate, app.requirePermission('zone:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new ZoneController(service);
    return controller.updateTopology(request, reply);
  });
}
