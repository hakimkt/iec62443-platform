import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  createTemplateSchema,
  createEngagementSchema,
  updateEngagementSchema,
  submitResponseSchema,
  paginationSchema,
} from '@iec62443/shared-schemas';

import type { AssessmentService } from './assessment.service.js';

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

export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  // ── GET /assessment-templates ─────────────────────────────────────────

  async listTemplates(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;
    const filters: { iecPart?: string; isSystem?: boolean } = {};

    if (query['iecPart']) {
      filters.iecPart = query['iecPart'];
    }
    if (query['isSystem'] !== undefined) {
      filters.isSystem = query['isSystem'] === 'true';
    }

    try {
      const templates = await this.assessmentService.listTemplates(filters);
      return reply.status(200).send(successResponse(templates, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessment-templates/:id ─────────────────────────────────────

  async getTemplate(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Template ID is required', request.id),
      );
    }

    try {
      const template = await this.assessmentService.getTemplate(id);
      return reply.status(200).send(successResponse(template, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assessment-templates ────────────────────────────────────────

  async createTemplate(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createTemplateSchema.safeParse(request.body);
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
      const template = await this.assessmentService.createTemplate(
        parsed.data,
        userId,
      );
      return reply.status(201).send(successResponse(template, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessments ─────────────────────────────────────────────────

  async listEngagements(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;

    const filters: {
      status?: string;
      type?: string;
      search?: string;
      page?: number;
      perPage?: number;
    } = { page, perPage };

    if (query['status']) filters.status = query['status'];
    if (query['type']) filters.type = query['type'];
    if (query['search']) filters.search = query['search'];

    try {
      const result = await this.assessmentService.listEngagements(filters);
      return reply.status(200).send(
        paginatedResponse(result.data, result.pagination, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessments/:id ─────────────────────────────────────────────

  async getEngagement(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    try {
      const engagement = await this.assessmentService.getEngagement(id);
      return reply.status(200).send(successResponse(engagement, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assessments ────────────────────────────────────────────────

  async createEngagement(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createEngagementSchema.safeParse(request.body);
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
      const engagement = await this.assessmentService.createEngagement(
        parsed.data,
        userId,
      );
      return reply.status(201).send(successResponse(engagement, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── PATCH /assessments/:id ───────────────────────────────────────────

  async updateEngagement(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    const parsed = updateEngagementSchema.safeParse(request.body);
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
      const engagement = await this.assessmentService.updateEngagement(
        id,
        parsed.data,
        userId,
      );
      return reply.status(200).send(successResponse(engagement, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /assessments/:id ──────────────────────────────────────────

  async deleteEngagement(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.assessmentService.deleteEngagement(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessments/:id/questions ───────────────────────────────────

  async getEngagementQuestions(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    try {
      const questionsWithResponses = await this.assessmentService.getEngagementQuestions(id);
      return reply.status(200).send(successResponse(questionsWithResponses, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assessments/:id/responses ──────────────────────────────────

  async submitResponse(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const engagementId = params['id'];
    const body = request.body as Record<string, unknown> | undefined;
    const questionId = body?.['questionId'] as string | undefined;

    if (!engagementId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    if (!questionId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Question ID is required', request.id, [
          { field: 'questionId', message: 'Question ID is required' },
        ]),
      );
    }

    const parsed = submitResponseSchema.safeParse(request.body);
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
      const response = await this.assessmentService.submitResponse(
        engagementId,
        questionId,
        parsed.data,
        userId,
      );
      return reply.status(201).send(successResponse(response, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessments/:id/scorecard ───────────────────────────────────

  async getScorecard(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    try {
      const scorecard = await this.assessmentService.getScorecard(id);
      return reply.status(200).send(successResponse(scorecard, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assessments/:id/progress ────────────────────────────────────

  async getProgress(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Engagement ID is required', request.id),
      );
    }

    try {
      const progress = await this.assessmentService.getProgress(id);
      return reply.status(200).send(successResponse(progress, request.id));
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
