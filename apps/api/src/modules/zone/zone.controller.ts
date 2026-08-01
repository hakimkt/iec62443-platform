import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  createZoneSchema,
  updateZoneSchema,
  createConduitSchema,
  updateConduitSchema,
  zoneMembershipSchema,
  segmentationRuleSchema,
  topologyUpdateSchema,
  paginationSchema,
} from '@iec62443/shared-schemas';

import type { ZoneService } from './zone.service.js';

// ---------------------------------------------------------------------------
// Response envelope helpers
// ---------------------------------------------------------------------------

function successResponse<T>(data: T, requestId: string) {
  return {
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
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
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class ZoneController {
  constructor(private zoneService: ZoneService) {}

  // ── Zones ─────────────────────────────────────────────────────────────

  async listZones(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;

    try {
      const result = await this.zoneService.listZones({
        page,
        perPage,
        zoneType: query['zoneType'],
        securityLevel: query['securityLevel'] ? Number(query['securityLevel']) : undefined,
        parentZoneId: query['parentZoneId'],
        facilityId: query['facilityId'],
        purdueLevel: query['purdueLevel'] ? Number(query['purdueLevel']) : undefined,
        search: query['search'],
      });
      return reply.status(200).send(
        paginatedResponse(result.data, result.pagination, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async getZone(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    try {
      const zone = await this.zoneService.getZone(id);
      return reply.status(200).send(successResponse(zone, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createZone(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createZoneSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const zone = await this.zoneService.createZone(parsed.data, userId);
      return reply.status(201).send(successResponse(zone, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateZone(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    const parsed = updateZoneSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const zone = await this.zoneService.updateZone(id, parsed.data, userId);
      return reply.status(200).send(successResponse(zone, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteZone(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.zoneService.deleteZone(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Conduits ──────────────────────────────────────────────────────────

  async listConduits(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;

    try {
      const result = await this.zoneService.listConduits({
        page,
        perPage,
        sourceZoneId: query['sourceZoneId'],
        targetZoneId: query['targetZoneId'],
        conduitType: query['conduitType'],
        securityLevel: query['securityLevel'] ? Number(query['securityLevel']) : undefined,
        search: query['search'],
      });
      return reply.status(200).send(
        paginatedResponse(result.data, result.pagination, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async getConduit(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Conduit ID is required', request.id),
      );
    }

    try {
      const conduit = await this.zoneService.getConduit(id);
      return reply.status(200).send(successResponse(conduit, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createConduit(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createConduitSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const conduit = await this.zoneService.createConduit(parsed.data, userId);
      return reply.status(201).send(successResponse(conduit, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateConduit(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Conduit ID is required', request.id),
      );
    }

    const parsed = updateConduitSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const conduit = await this.zoneService.updateConduit(id, parsed.data, userId);
      return reply.status(200).send(successResponse(conduit, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteConduit(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Conduit ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.zoneService.deleteConduit(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Memberships ───────────────────────────────────────────────────────

  async listMemberships(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    try {
      const memberships = await this.zoneService.listMemberships(id);
      return reply.status(200).send(successResponse(memberships, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async addMembership(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    const parsed = zoneMembershipSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const membership = await this.zoneService.addMembership(id, parsed.data, userId);
      return reply.status(201).send(successResponse(membership, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async removeMembership(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const assetId = params['assetId'];

    if (!id || !assetId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID and Asset ID are required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.zoneService.removeMembership(id, assetId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Segmentation Rules ────────────────────────────────────────────────

  async listRules(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    try {
      const rules = await this.zoneService.listRules(id);
      return reply.status(200).send(successResponse(rules, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createRule(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Zone ID is required', request.id),
      );
    }

    const parsed = segmentationRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const rule = await this.zoneService.createRule(id, parsed.data, userId);
      return reply.status(201).send(successResponse(rule, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteRule(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const ruleId = params['ruleId'];

    if (!ruleId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Rule ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.zoneService.deleteRule(ruleId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Topology ──────────────────────────────────────────────────────────

  async getTopology(request: FastifyRequest, reply: FastifyReply) {
    try {
      const topology = await this.zoneService.getTopology();
      return reply.status(200).send(successResponse(topology, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateTopology(request: FastifyRequest, reply: FastifyReply) {
    const parsed = topologyUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const topology = await this.zoneService.updateTopology(parsed.data);
      return reply.status(200).send(successResponse(topology, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private getUserId(request: FastifyRequest): string | null {
    const user = (request as unknown as { user?: { sub?: string } }).user;
    return user?.sub ?? null;
  }

  private handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
    const err = error as {
      message?: string;
      statusCode?: number;
      code?: string;
    };

    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR');

    if (statusCode >= 500) {
      request.log.error(error);
    } else {
      request.log.warn(error);
    }

    return reply.status(statusCode).send(
      errorResponse(
        code,
        statusCode >= 500 ? 'An unexpected error occurred.' : (err.message ?? 'An error occurred'),
        request.id,
      ),
    );
  }
}
