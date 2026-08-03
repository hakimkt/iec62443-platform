import {
  createRegisterSchema,
  createRiskSchema,
  createTreatmentSchema,
  matrixConfigSchema,
  paginationSchema,
  riskAcceptanceSchema,
  updateRegisterSchema,
  updateRiskSchema,
  updateTreatmentSchema,
} from '@iec62443/shared-schemas';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RiskService } from './risk.service.js';

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

export class RiskController {
  constructor(private riskService: RiskService) {}

  // ── Registers ────────────────────────────────────────────────────────

  async listRegisters(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;

    try {
      const result = await this.riskService.listRegisters({
        page,
        perPage,
        search: query['search'],
        status: query['status'],
      });
      return reply.status(200).send(paginatedResponse(result.data, result.pagination, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async getRegister(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    try {
      const register = await this.riskService.getRegister(id);
      return reply.status(200).send(successResponse(register, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createRegister(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createRegisterSchema.safeParse(request.body);
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
      const register = await this.riskService.createRegister(parsed.data, userId);
      return reply.status(201).send(successResponse(register, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateRegister(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    const parsed = updateRegisterSchema.safeParse(request.body);
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
      const register = await this.riskService.updateRegister(id, body, userId);
      return reply.status(200).send(successResponse(register, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteRegister(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.riskService.deleteRegister(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Risk Entries ─────────────────────────────────────────────────────

  async listRisks(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    const paginationParsed = paginationSchema.safeParse({
      page: query['page'],
      perPage: query['perPage'],
      sort: query['sort'],
    });

    const page = paginationParsed.success ? paginationParsed.data.page : 1;
    const perPage = paginationParsed.success ? paginationParsed.data.perPage : 25;
    const sort = paginationParsed.success ? paginationParsed.data.sort : undefined;

    try {
      const result = await this.riskService.listRisks({
        registerId: query['registerId'],
        category: query['category'],
        riskLevel: query['riskLevel'],
        treatment: query['treatment'],
        status: query['status'],
        search: query['search'],
        page,
        perPage,
        sort,
      });
      return reply.status(200).send(paginatedResponse(result.data, result.pagination, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async getRisk(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    try {
      const risk = await this.riskService.getRisk(id);
      return reply.status(200).send(successResponse(risk, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createRisk(request: FastifyRequest, reply: FastifyReply) {
    const parsed = createRiskSchema.safeParse(request.body);
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
      const risk = await this.riskService.createRisk(parsed.data, userId);
      return reply.status(201).send(successResponse(risk, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateRisk(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    const parsed = updateRiskSchema.safeParse(request.body);
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
      const risk = await this.riskService.updateRisk(id, parsed.data, userId);
      return reply.status(200).send(successResponse(risk, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteRisk(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.riskService.deleteRisk(id, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Risk Stats ───────────────────────────────────────────────────────

  async getRiskStats(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as Record<string, string | undefined>;

    try {
      const stats = await this.riskService.getRiskStats(query['registerId']);
      return reply.status(200).send(successResponse(stats, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Heat Map ─────────────────────────────────────────────────────────

  async getHeatMap(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    try {
      const heatMap = await this.riskService.getHeatMap(id);
      return reply.status(200).send(successResponse(heatMap, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Matrix Config ────────────────────────────────────────────────────

  async getMatrixConfig(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    try {
      const config = await this.riskService.getMatrixConfig(id);
      return reply.status(200).send(successResponse(config, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateMatrixConfig(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Register ID is required', request.id));
    }

    const parsed = matrixConfigSchema.safeParse(request.body);
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
      const config = await this.riskService.updateMatrixConfig(id, parsed.data, userId);
      return reply.status(200).send(successResponse(config, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Treatments ───────────────────────────────────────────────────────

  async listTreatments(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    try {
      const treatments = await this.riskService.listTreatments(id);
      return reply.status(200).send(successResponse(treatments, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createTreatment(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    const parsed = createTreatmentSchema.safeParse(request.body);
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
      const treatment = await this.riskService.createTreatment(id, parsed.data, userId);
      return reply.status(201).send(successResponse(treatment, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async updateTreatment(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const treatmentId = params['treatmentId'];

    if (!id || !treatmentId) {
      return reply
        .status(400)
        .send(
          errorResponse('VALIDATION_ERROR', 'Risk ID and Treatment ID are required', request.id),
        );
    }

    const parsed = updateTreatmentSchema.safeParse(request.body);
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
      const treatment = await this.riskService.updateTreatment(id, treatmentId, body, userId);
      return reply.status(200).send(successResponse(treatment, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async deleteTreatment(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];
    const treatmentId = params['treatmentId'];

    if (!id || !treatmentId) {
      return reply
        .status(400)
        .send(
          errorResponse('VALIDATION_ERROR', 'Risk ID and Treatment ID are required', request.id),
        );
    }

    const userId = this.getUserId(request);
    if (!userId) {
      return reply
        .status(401)
        .send(errorResponse('UNAUTHORIZED', 'Authentication required', request.id));
    }

    try {
      await this.riskService.deleteTreatment(id, treatmentId, userId);
      return reply.status(204).send();
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Acceptances ──────────────────────────────────────────────────────

  async listAcceptances(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    try {
      const acceptances = await this.riskService.listAcceptances(id);
      return reply.status(200).send(successResponse(acceptances, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  async createAcceptance(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as Record<string, string>;
    const id = params['id'];

    if (!id) {
      return reply
        .status(400)
        .send(errorResponse('VALIDATION_ERROR', 'Risk ID is required', request.id));
    }

    const parsed = riskAcceptanceSchema.safeParse(request.body);
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
      const acceptance = await this.riskService.createAcceptance(id, parsed.data, userId);
      return reply.status(201).send(successResponse(acceptance, request.id));
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
