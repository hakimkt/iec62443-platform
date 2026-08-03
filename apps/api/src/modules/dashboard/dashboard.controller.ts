import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DashboardService } from './dashboard.service.js';

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
// Dashboard Controller
// ---------------------------------------------------------------------------

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const summary = await this.dashboardService.getSummary();
      return reply.send(successResponse(summary, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve dashboard summary', requestId));
    }
  }

  async getRiskHeatMap(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as { registerId?: string };

    try {
      const heatMap = await this.dashboardService.getRiskHeatMap(query.registerId);
      return reply.send(successResponse(heatMap, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve risk heat map', requestId));
    }
  }

  async getAssessmentProgress(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const progress = await this.dashboardService.getAssessmentProgress();
      return reply.send(successResponse(progress, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve assessment progress', requestId));
    }
  }

  async getRecentFindings(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const findings = await this.dashboardService.getRecentFindings();
      return reply.send(successResponse(findings, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve recent findings', requestId));
    }
  }

  async getRemediationStatus(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    try {
      const status = await this.dashboardService.getRemediationStatus();
      return reply.send(successResponse(status, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve remediation status', requestId));
    }
  }
}
