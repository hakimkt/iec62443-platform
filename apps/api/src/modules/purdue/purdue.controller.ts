import {
  assetMappingSchema,
  communicationRuleSchema,
  createLevelSchema,
  createPurdueModelSchema,
  paginationSchema,
  updateCommunicationRuleSchema,
  updateLevelSchema,
  updatePurdueModelSchema,
} from '@iec62443/shared-schemas';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PurdueService } from './purdue.service.js';

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

export class PurdueController {
  constructor(private purdueService: PurdueService) {}

  // ── Models ───────────────────────────────────────────────────────────

  async listModels(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;

    try {
      const result = await this.purdueService.listModels({
        page,
        perPage,
        search: query['search'],
      });
      return reply.status(200).send(paginatedResponse(result.data, result.pagination, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async getModel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    try {
      const model = await this.purdueService.getModel(id);
      return reply.status(200).send(successResponse(model, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createModel(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createPurdueModelSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const model = await this.purdueService.createModel(parsed.data, userId);
      return reply.status(201).send(successResponse(model, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateModel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    const parsed = updatePurdueModelSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const body = parsed.data;

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const model = await this.purdueService.updateModel(id, body, userId);
      return reply.status(200).send(successResponse(model, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteModel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.purdueService.deleteModel(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Levels ───────────────────────────────────────────────────────────

  async listLevels(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    try {
      const levels = await this.purdueService.listLevels(id);
      return reply.status(200).send(successResponse(levels, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createLevel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    const parsed = createLevelSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const level = await this.purdueService.createLevel(id, parsed.data, userId);
      return reply.status(201).send(successResponse(level, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateLevel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const levelId = params['levelId'];

    if (!id || !levelId) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID and Level ID are required', request.id));
    }

    const parsed = updateLevelSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const body = parsed.data;

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const level = await this.purdueService.updateLevel(levelId, body, userId);
      return reply.status(200).send(successResponse(level, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteLevel(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const levelId = params['levelId'];

    if (!id || !levelId) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID and Level ID are required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.purdueService.deleteLevel(levelId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Asset Mappings ───────────────────────────────────────────────────

  async listMappings(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    try {
      const mappings = await this.purdueService.listMappings(id);
      return reply.status(200).send(successResponse(mappings, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async addMapping(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    const parsed = assetMappingSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const mapping = await this.purdueService.addMapping(id, parsed.data, userId);
      return reply.status(201).send(successResponse(mapping, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async removeMapping(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const assetId = params['assetId'];

    if (!id || !assetId) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID and Asset ID are required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.purdueService.removeMapping(id, assetId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Communication Rules ──────────────────────────────────────────────

  async listRules(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    try {
      const rules = await this.purdueService.listRules(id);
      return reply.status(200).send(successResponse(rules, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createRule(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    const parsed = communicationRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const rule = await this.purdueService.createRule(id, parsed.data, userId);
      return reply.status(201).send(successResponse(rule, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateRule(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const ruleId = params['ruleId'];

    if (!id || !ruleId) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID and Rule ID are required', request.id));
    }

    const parsed = updateCommunicationRuleSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details));
    }

    const body = parsed.data;

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      const rule = await this.purdueService.updateRule(ruleId, body, userId);
      return reply.status(200).send(successResponse(rule, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteRule(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const ruleId = params['ruleId'];

    if (!id || !ruleId) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID and Rule ID are required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.purdueService.deleteRule(ruleId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Compliance ───────────────────────────────────────────────────────

  async getCompliance(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Model ID is required', request.id));
    }

    try {
      const compliance = await this.purdueService.getCompliance(id);
      return reply.status(200).send(successResponse(compliance, request.id));
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

    return reply
      .status(statusCode)
      .send(
        errorResponse(
          code,
          statusCode >= 500
            ? 'An unexpected error occurred.'
            : (err.message ?? 'An error occurred'),
          request.id,
        ),
      );
  }
}
