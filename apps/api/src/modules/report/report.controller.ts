import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  generateReportSchema,
  paginationSchema,
} from '@iec62443/shared-schemas';

import type { ReportService } from './report.service.js';

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
// Report Controller
// ---------------------------------------------------------------------------

export class ReportController {
  constructor(private reportService: ReportService) {}

  async listReports(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid query parameters', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const query = parsed.data as Record<string, unknown>;
    const filters = {
      type: query['type'] as string | undefined,
      status: query['status'] as string | undefined,
      search: query['search'] as string | undefined,
      page: query['page'] as number | undefined,
      perPage: query['perPage'] as number | undefined,
    };

    try {
      const result = await this.reportService.listReports(filters);
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to list reports', requestId),
      );
    }
  }

  async getReport(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const report = await this.reportService.getReport(id);
      if (!report) {
        return reply.status(404).send(
          errorResponse('NOT_FOUND', 'Report not found', requestId),
        );
      }
      return reply.send(successResponse(report, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to retrieve report', requestId),
      );
    }
  }

  async createReport(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = generateReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const report = await this.reportService.createReport(
        {
          type: parsed.data.type,
          title: parsed.data.title,
          config: {
            scope: parsed.data.config.scope,
            scopeId: parsed.data.config.scopeId,
            dateRange: parsed.data.config.dateRange
              ? {
                  from: parsed.data.config.dateRange.from?.toISOString(),
                  to: parsed.data.config.dateRange.to?.toISOString(),
                }
              : undefined,
            includeSections: parsed.data.config.includeSections,
            format: parsed.data.config.format,
          },
        },
        userId,
      );

      return reply.status(201).send(successResponse(report, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to create report', requestId),
      );
    }
  }

  async deleteReport(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const deleted = await this.reportService.deleteReport(id, userId);
      if (!deleted) {
        return reply.status(404).send(
          errorResponse('NOT_FOUND', 'Report not found', requestId),
        );
      }
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to delete report', requestId),
      );
    }
  }

  async getTemplates(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const templates = this.reportService.getTemplates();
      return reply.send(successResponse(templates, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to retrieve templates', requestId),
      );
    }
  }

  async downloadReport(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const report = await this.reportService.getReport(id);
      if (!report) {
        return reply.status(404).send(
          errorResponse('NOT_FOUND', 'Report not found', requestId),
        );
      }
      if (report.status !== 'completed' || !report.fileUrl) {
        return reply.status(404).send(
          errorResponse('NOT_READY', 'Report file is not available yet', requestId),
        );
      }

      return reply.send(successResponse({ downloadUrl: report.fileUrl }, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(
        errorResponse('INTERNAL_ERROR', 'Failed to download report', requestId),
      );
    }
  }
}
