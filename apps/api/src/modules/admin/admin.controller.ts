import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  createRoleSchema,
  updateRoleSchema,
  createApiKeySchema,
  inviteMemberSchema,
  updateMemberSchema,
  updateTenantSchema,
} from '@iec62443/shared-schemas';

import type { AdminService } from './admin.service.js';

// ---------------------------------------------------------------------------
// Response envelope helpers
// ---------------------------------------------------------------------------

function successResponse<T>(data: T, requestId: string) {
  return {
    data,
    meta: { requestId, timestamp: new Date().toISOString() },
  };
}

function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; perPage: number; total: number; totalPages: number },
  requestId: string,
) {
  return {
    data,
    pagination,
    meta: { requestId, timestamp: new Date().toISOString() },
  };
}

function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    error: { code, message, details },
    meta: { requestId, timestamp: new Date().toISOString() },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Members ─────────────────────────────────────────────────────────

  async listMembers(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.adminService.listMembers({
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
        search: query['search'] as string | undefined,
        role: query['role'] as string | undefined,
        status: query['status'] as string | undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list members', requestId));
    }
  }

  async inviteMember(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = inviteMemberSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      const member = await this.adminService.inviteMember(
        parsed.data.email,
        parsed.data.role,
        userId,
      );
      return reply.status(201).send(successResponse(member, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 409) {
        return reply.status(409).send(errorResponse('CONFLICT', 'User is already a member', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to invite member', requestId));
    }
  }

  async updateMember(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { userId } = request.params as { userId: string };

    const parsed = updateMemberSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const updatedBy = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      await this.adminService.updateMember(userId, parsed.data.role, updatedBy);
      return reply.send(successResponse({ userId, role: parsed.data.role }, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'Membership not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update member', requestId));
    }
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { userId } = request.params as { userId: string };
    const removedBy = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      await this.adminService.removeMember(userId, removedBy);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to remove member', requestId));
    }
  }

  // ── Roles ───────────────────────────────────────────────────────────

  async listRoles(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const roles = await this.adminService.listRoles();
      return reply.send(successResponse(roles, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list roles', requestId));
    }
  }

  async createRole(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = createRoleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      const role = await this.adminService.createRole(
        { name: parsed.data.name, description: parsed.data.description, permissions: parsed.data.permissions },
        userId,
      );
      return reply.status(201).send(successResponse(role, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create role', requestId));
    }
  }

  async updateRole(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updateRoleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      await this.adminService.updateRole(id, {
        name: parsed.data.name,
        description: parsed.data.description,
        permissions: parsed.data.permissions,
      }, userId);
      return reply.send(successResponse({ id, updated: true }, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update role', requestId));
    }
  }

  async deleteRole(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      await this.adminService.deleteRole(id, userId);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to delete role', requestId));
    }
  }

  // ── API Keys ────────────────────────────────────────────────────────

  async listApiKeys(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const keys = await this.adminService.listApiKeys();
      return reply.send(successResponse(keys, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list API keys', requestId));
    }
  }

  async createApiKey(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = createApiKeySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      const key = await this.adminService.createApiKey(
        {
          name: parsed.data.name,
          scopes: parsed.data.scopes as string[] | undefined,
          expiresAt: parsed.data.expiresAt?.toISOString(),
        },
        userId,
      );
      return reply.status(201).send(successResponse(key, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create API key', requestId));
    }
  }

  async revokeApiKey(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      await this.adminService.revokeApiKey(id, userId);
      return reply.send(successResponse({ id, revoked: true }, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to revoke API key', requestId));
    }
  }

  // ── Audit Log ───────────────────────────────────────────────────────

  async getAuditLog(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.adminService.getAuditLog({
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
        eventTypes: query['eventTypes'] ? String(query['eventTypes']).split(',') : undefined,
        entityTypes: query['entityTypes'] ? String(query['entityTypes']).split(',') : undefined,
        userIds: query['userIds'] ? String(query['userIds']).split(',') : undefined,
        dateFrom: query['dateFrom'] as string | undefined,
        dateTo: query['dateTo'] as string | undefined,
        search: query['search'] as string | undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to get audit log', requestId));
    }
  }

  // ── Tenant Settings ─────────────────────────────────────────────────

  async getTenantSettings(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const settings = await this.adminService.getTenantSettings();
      return reply.send(successResponse(settings, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to get tenant settings', requestId));
    }
  }

  async updateTenantSettings(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = updateTenantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { id: string } | undefined)?.id ?? 'system';

    try {
      const settings = await this.adminService.updateTenantSettings(
        {
          name: parsed.data.name,
          settings: parsed.data.settings as Record<string, unknown> | undefined,
        },
        userId,
      );
      return reply.send(successResponse(settings, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update tenant settings', requestId));
    }
  }
}
