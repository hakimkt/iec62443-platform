import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  createAssetSchema,
  updateAssetSchema,
  assetRelationshipSchema,
  paginationSchema,
  uuidSchema,
} from '@iec62443/shared-schemas';

import type { AssetService } from './asset.service.js';

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

export class AssetController {
  constructor(private assetService: AssetService) {}

  // ── GET /assets ──────────────────────────────────────────────────────

  async listAssets(request: FastifyRequest, reply: FastifyReply) {
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
      type?: string;
      criticality?: string;
      operationalStatus?: string;
      purdueLevel?: string;
      zoneId?: string;
      search?: string;
      page?: number;
      perPage?: number;
      sort?: string;
    } = { page, perPage, sort };

    if (query['type']) filters.type = query['type'];
    if (query['criticality']) filters.criticality = query['criticality'];
    if (query['operationalStatus']) filters.operationalStatus = query['operationalStatus'];
    if (query['purdueLevel']) filters.purdueLevel = query['purdueLevel'];
    if (query['zoneId']) filters.zoneId = query['zoneId'];
    if (query['search']) filters.search = query['search'];

    try {
      const result = await this.assetService.listAssets(filters);
      return reply.status(200).send(
        paginatedResponse(result.data, result.pagination, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assets ─────────────────────────────────────────────────────

  async createAsset(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createAssetSchema.safeParse(request.body);
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
      const asset = await this.assetService.createAsset(parsed.data, userId);
      return reply.status(201).send(successResponse(asset, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assets/:id ──────────────────────────────────────────────────

  async getAsset(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    try {
      const asset = await this.assetService.getAsset(id);
      return reply.status(200).send(successResponse(asset, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── PATCH /assets/:id ────────────────────────────────────────────────

  async updateAsset(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    const parsed = updateAssetSchema.safeParse(request.body);
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
      const asset = await this.assetService.updateAsset(id, parsed.data, userId);
      return reply.status(200).send(successResponse(asset, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /assets/:id ───────────────────────────────────────────────

  async deleteAsset(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.assetService.deleteAsset(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assets/stats ────────────────────────────────────────────────

  async getAssetStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.assetService.getAssetStats();
      return reply.status(200).send(successResponse(stats, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assets/:id/relationships ────────────────────────────────────

  async getRelationships(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    try {
      const rels = await this.assetService.getRelationships(id);
      return reply.status(200).send(successResponse(rels, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assets/:id/relationships ───────────────────────────────────

  async createRelationship(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    const parsed = assetRelationshipSchema.safeParse(request.body);
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
      const relationship = await this.assetService.createRelationship(id, parsed.data, userId);
      return reply.status(201).send(successResponse(relationship, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /assets/:id/relationships/:relId ──────────────────────────

  async deleteRelationship(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const relId = params['relId'];

    if (!id) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Asset ID is required', request.id),
      );
    }

    if (!relId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Relationship ID is required', request.id),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.assetService.deleteRelationship(id, relId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /assets/import ──────────────────────────────────────────────

  async importAssets(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as Record<string, unknown> | undefined;
    const totalRecords = body?.['totalRecords'] as number | undefined;

    if (totalRecords === undefined || totalRecords === null) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'totalRecords is required', request.id, [
          { field: 'totalRecords', message: 'totalRecords is required' },
        ]),
      );
    }

    if (typeof totalRecords !== 'number' || totalRecords < 0 || !Number.isInteger(totalRecords)) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'totalRecords must be a non-negative integer', request.id, [
          { field: 'totalRecords', message: 'totalRecords must be a non-negative integer' },
        ]),
      );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const job = await this.assetService.importAssets(totalRecords, userId);
      return reply.status(201).send(successResponse(job, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assets/import/:jobId ────────────────────────────────────────

  async getImportJobStatus(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const jobId = params['jobId'];

    if (!jobId) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Job ID is required', request.id),
      );
    }

    const uuidParsed = uuidSchema.safeParse(jobId);
    if (!uuidParsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Job ID must be a valid UUID', request.id, [
          { field: 'jobId', message: 'Job ID must be a valid UUID' },
        ]),
      );
    }

    try {
      const job = await this.assetService.getImportJobStatus(jobId);
      return reply.status(200).send(successResponse(job, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── GET /assets/export ───────────────────────────────────────────────

  async exportAssets(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await this.assetService.exportAssets();
      return reply.status(200).send(successResponse(data, request.id));
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
