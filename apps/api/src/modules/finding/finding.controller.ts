import {
  createCommentSchema,
  createFindingSchema,
  paginationSchema,
  transitionFindingSchema,
  updateFindingSchema,
  uuidSchema,
} from '@iec62443/shared-schemas';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FindingService } from './finding.service.js';

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

export class FindingController {
  constructor(private findingService: FindingService) {}

  // ── GET /findings ────────────────────────────────────────────────────

  async listFindings(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
      sort: query['sort'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;
    const sort = paginationParsed.success ? paginationParsed.data.sort : undefined;

    const filters: {
      status?: string;
      severity?: string;
      engagementId?: string;
      search?: string;
      page?: number;
      perPage?: number;
      sort?: string;
    } = { page, perPage, sort };

    if (query['status']) filters.status = query['status'];
    if (query['severity']) filters.severity = query['severity'];
    if (query['engagementId']) filters.engagementId = query['engagementId'];
    if (query['search']) filters.search = query['search'];

    try {
      const result = await this.findingService.listFindings(filters);
      return reply.status(200).send(paginatedResponse(result.data, result.pagination, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /findings ───────────────────────────────────────────────────

  async createFinding(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createFindingSchema.safeParse(request.body);
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
      const finding = await this.findingService.createFinding(parsed.data, userId);
      return reply.status(201).send(successResponse(finding, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /findings/:id ────────────────────────────────────────────────

  async getFinding(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    try {
      const finding = await this.findingService.getFinding(id);
      return reply.status(200).send(successResponse(finding, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── PATCH /findings/:id ──────────────────────────────────────────────

  async updateFinding(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    const parsed = updateFindingSchema.safeParse(request.body);
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
      const finding = await this.findingService.updateFinding(id, parsed.data, userId);
      return reply.status(200).send(successResponse(finding, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /findings/:id ─────────────────────────────────────────────

  async deleteFinding(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.findingService.deleteFinding(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /findings/:id/transition ────────────────────────────────────

  async transitionFinding(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    const parsed = transitionFindingSchema.safeParse(request.body);
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
      const finding = await this.findingService.transitionFinding(id, parsed.data, userId);
      return reply.status(200).send(successResponse(finding, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /findings/:id/history ────────────────────────────────────────

  async getStatusHistory(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    try {
      const history = await this.findingService.getStatusHistory(id);
      return reply.status(200).send(successResponse(history, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /findings/:id/comments ───────────────────────────────────────

  async getComments(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    try {
      const comments = await this.findingService.getComments(id);
      return reply.status(200).send(successResponse(comments, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /findings/:id/comments ──────────────────────────────────────

  async addComment(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    const parsed = createCommentSchema.safeParse(request.body);
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
      const comment = await this.findingService.addComment(id, parsed.data, userId);
      return reply.status(201).send(successResponse(comment, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /findings/:id/evidence ──────────────────────────────────────

  async linkEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    const body = request.body as Record<string, unknown> | undefined;
    const evidenceId = body?.['evidenceId'] as string | undefined;

    if (!evidenceId) {
      return reply
        .status(400)
        .send(
          errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id, [
            { field: 'evidenceId', message: 'Evidence ID is required' },
          ]),
        );
    }

    // Validate evidenceId is a UUID
    const uuidParsed = uuidSchema.safeParse(evidenceId);
    if (!uuidParsed.success) {
      return reply
        .status(400)
        .send(
          errorResponse('VALIDATION_ERROR', 'Evidence ID must be a valid UUID', request.id, [
            { field: 'evidenceId', message: 'Evidence ID must be a valid UUID' },
          ]),
        );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.findingService.linkEvidence(id, evidenceId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /findings/:id/evidence ───────────────────────────────────────

  async getEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Finding ID is required', request.id));
    }

    try {
      const evidence = await this.findingService.getEvidence(id);
      return reply.status(200).send(successResponse(evidence, request.id));
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
