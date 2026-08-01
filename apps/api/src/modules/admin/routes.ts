import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface AdminRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function adminRoutes(
  app: FastifyInstance,
  options: AdminRouteOptions,
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
    return new AdminService(db, tenantId, tenantSchema);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Members
  // ══════════════════════════════════════════════════════════════════════

  app.get('/admin/members', {
    schema: {
      tags: ['Admin'],
      summary: 'List tenant members',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          search: { type: 'string', maxLength: 200 },
          role: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.listMembers(request, reply);
  });

  app.post('/admin/members/invite', {
    schema: {
      tags: ['Admin'],
      summary: 'Invite a member to the tenant',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.inviteMember(request, reply);
  });

  app.patch('/admin/members/:userId', {
    schema: {
      tags: ['Admin'],
      summary: 'Update a member role',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: { userId: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.updateMember(request, reply);
  });

  app.delete('/admin/members/:userId', {
    schema: {
      tags: ['Admin'],
      summary: 'Remove a member from the tenant',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['userId'],
        properties: { userId: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.removeMember(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Roles
  // ══════════════════════════════════════════════════════════════════════

  app.get('/admin/roles', {
    schema: {
      tags: ['Admin'],
      summary: 'List tenant roles',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('admin:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.listRoles(request, reply);
  });

  app.post('/admin/roles', {
    schema: {
      tags: ['Admin'],
      summary: 'Create a custom role',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'permissions'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.createRole(request, reply);
  });

  app.patch('/admin/roles/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Update a role',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.updateRole(request, reply);
  });

  app.delete('/admin/roles/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Delete a custom role',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.deleteRole(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // API Keys
  // ══════════════════════════════════════════════════════════════════════

  app.get('/admin/api-keys', {
    schema: {
      tags: ['Admin'],
      summary: 'List API keys',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('admin:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.listApiKeys(request, reply);
  });

  app.post('/admin/api-keys', {
    schema: {
      tags: ['Admin'],
      summary: 'Create an API key',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } },
          expiresAt: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.createApiKey(request, reply);
  });

  app.post('/admin/api-keys/:id/revoke', {
    schema: {
      tags: ['Admin'],
      summary: 'Revoke an API key',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', format: 'uuid' } },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.revokeApiKey(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Audit Log
  // ══════════════════════════════════════════════════════════════════════

  app.get('/admin/audit-log', {
    schema: {
      tags: ['Admin'],
      summary: 'Get audit log entries',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          eventTypes: { type: 'string' },
          entityTypes: { type: 'string' },
          userIds: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          search: { type: 'string', maxLength: 200 },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('admin:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.getAuditLog(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Tenant Settings
  // ══════════════════════════════════════════════════════════════════════

  app.get('/admin/settings', {
    schema: {
      tags: ['Admin'],
      summary: 'Get tenant settings',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('admin:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.getTenantSettings(request, reply);
  });

  app.patch('/admin/settings', {
    schema: {
      tags: ['Admin'],
      summary: 'Update tenant settings',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate, app.requirePermission('admin:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId, request.tenantSchema);
    const controller = new AdminController(service);
    return controller.updateTenantSettings(request, reply);
  });
}
