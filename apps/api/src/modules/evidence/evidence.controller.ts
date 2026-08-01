import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  uploadEvidenceSchema,
  updateEvidenceSchema,
  linkEvidenceSchema,
  paginationSchema,
} from '@iec62443/shared-schemas';

import type { EvidenceService } from './evidence.service.js';

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

export class EvidenceController {
  constructor(private evidenceService: EvidenceService) {}

  // ── GET /evidence ────────────────────────────────────────────────────

  async listEvidence(request: FastifyRequest, reply: FastifyReply) {
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
      evidenceType?: string;
      search?: string;
      tags?: string[];
      page?: number;
      perPage?: number;
      sort?: string;
    } = { page, perPage, sort };

    if (query['evidenceType']) filters.evidenceType = query['evidenceType'];
    if (query['search']) filters.search = query['search'];
    if (query['tags']) {
      filters.tags = query['tags'].split(',').map((t) => t.trim()).filter(Boolean);
    }

    try {
      const result = await this.evidenceService.listEvidence(filters);
      return reply.status(200).send(
        paginatedResponse(result.data, result.pagination, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /evidence ───────────────────────────────────────────────────

  async createEvidence(request: FastifyRequest, reply: FastifyReply) {
    const parsed = uploadEvidenceSchema.safeParse(request.body);
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
      const item = await this.evidenceService.createEvidence(parsed.data, userId);
      return reply.status(201).send(successResponse(item, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /evidence/:id ────────────────────────────────────────────────

  async getEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    try {
      const item = await this.evidenceService.getEvidence(id);
      return reply.status(200).send(successResponse(item, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── PATCH /evidence/:id ──────────────────────────────────────────────

  async updateEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    const parsed = updateEvidenceSchema.safeParse(request.body);
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
      const item = await this.evidenceService.updateEvidence(id, parsed.data, userId);
      return reply.status(200).send(successResponse(item, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /evidence/:id ─────────────────────────────────────────────

  async deleteEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.evidenceService.deleteEvidence(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /evidence/:id/links ──────────────────────────────────────────

  async getLinks(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    try {
      const links = await this.evidenceService.getLinks(id);
      return reply.status(200).send(successResponse(links, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /evidence/:id/links ─────────────────────────────────────────

  async linkEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    const parsed = linkEvidenceSchema.safeParse(request.body);
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
      const link = await this.evidenceService.linkEvidence(id, parsed.data, userId);
      return reply.status(201).send(successResponse(link, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /evidence/:id/links/:linkId ────────────────────────────────

  async unlinkEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const linkId = params['linkId'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    if (!linkId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Link ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.evidenceService.unlinkEvidence(id, linkId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /evidence/:id/chain-of-custody ───────────────────────────────

  async getChainOfCustody(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    try {
      const events = await this.evidenceService.getChainOfCustody(id);
      return reply.status(200).send(successResponse(events, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /evidence/:id/verify ─────────────────────────────────────────

  async verifyEvidence(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    try {
      const result = await this.evidenceService.verifyEvidence(id);
      return reply.status(200).send(successResponse(result, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /evidence/:id/upload ────────────────────────────────────────

  async uploadFile(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Evidence ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send(
          errorResponse('VALIDATION_ERROR', 'No file uploaded', request.id),
        );
      }

      const result = await this.evidenceService.uploadFile(id, data, userId);
      return reply.status(200).send(successResponse(result, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /tenant/storage ──────────────────────────────────────────────

  async getStorageQuota(request: FastifyRequest, reply: FastifyReply) {
    try {
      const quota = await this.evidenceService.getStorageQuota();
      return reply.status(200).send(successResponse(quota, request.id));
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
