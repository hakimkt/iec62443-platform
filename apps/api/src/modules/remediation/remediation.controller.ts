import {
  createActionSchema,
  createPlanSchema,
  updateActionSchema,
  updatePlanSchema,
  verifyActionSchema,
} from '@iec62443/shared-schemas';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RemediationService } from './remediation.service.js';

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

export class RemediationController {
  constructor(private remediationService: RemediationService) {}

  // ── Plans ───────────────────────────────────────────────────────────

  async listPlans(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.remediationService.listPlans({
        status: query['status'] as string | undefined,
        search: query['search'] as string | undefined,
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to list remediation plans', requestId));
    }
  }

  async getPlan(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const plan = await this.remediationService.getPlan(id);
      return reply.send(successResponse(plan, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation plan not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve plan', requestId));
    }
  }

  async createPlan(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = createPlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const plan = await this.remediationService.createPlan(
        {
          name: parsed.data.name,
          description: parsed.data.description,
          findingIds: parsed.data.findingIds as string[] | undefined,
          riskIds: parsed.data.riskIds as string[] | undefined,
          ownerId: parsed.data.ownerId as string | undefined,
          budgetEstimate: parsed.data.budgetEstimate,
          startDate: parsed.data.startDate?.toISOString().split('T')[0],
          targetDate: parsed.data.targetDate?.toISOString().split('T')[0],
        },
        userId,
      );
      return reply.status(201).send(successResponse(plan, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to create remediation plan', requestId));
    }
  }

  async updatePlan(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updatePlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const data = parsed.data as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      if (data['name'] !== undefined) updateData['name'] = data['name'];
      if (data['description'] !== undefined) updateData['description'] = data['description'];
      if (data['findingIds'] !== undefined) updateData['findingIds'] = data['findingIds'];
      if (data['riskIds'] !== undefined) updateData['riskIds'] = data['riskIds'];
      if (data['ownerId'] !== undefined) updateData['ownerId'] = data['ownerId'];
      if (data['budgetEstimate'] !== undefined)
        updateData['budgetEstimate'] = data['budgetEstimate'];
      if (data['startDate'] !== undefined)
        updateData['startDate'] = (data['startDate'] as Date).toISOString().split('T')[0];
      if (data['targetDate'] !== undefined)
        updateData['targetDate'] = (data['targetDate'] as Date).toISOString().split('T')[0];

      const plan = await this.remediationService.updatePlan(id, updateData, userId);
      return reply.send(successResponse(plan, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation plan not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to update plan', requestId));
    }
  }

  async deletePlan(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.remediationService.deletePlan(id, userId);
      return reply.status(204).send();
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation plan not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to delete plan', requestId));
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────

  async listActions(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.remediationService.listActions({
        planId: query['planId'] as string | undefined,
        status: query['status'] as string | undefined,
        assigneeId: query['assigneeId'] as string | undefined,
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to list actions', requestId));
    }
  }

  async getAction(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const action = await this.remediationService.getAction(id);
      return reply.send(successResponse(action, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation action not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve action', requestId));
    }
  }

  async createAction(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { planId } = request.params as { planId: string };

    const parsed = createActionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const action = await this.remediationService.createAction(
        planId,
        {
          title: parsed.data.title,
          description: parsed.data.description,
          findingId: parsed.data.findingId as string | undefined,
          riskId: parsed.data.riskId as string | undefined,
          assigneeId: parsed.data.assigneeId as string | undefined,
          startDate: parsed.data.startDate?.toISOString().split('T')[0],
          dueDate: parsed.data.dueDate?.toISOString().split('T')[0],
          costEstimate: parsed.data.costEstimate,
          milestone: parsed.data.milestone,
        },
        userId,
      );
      return reply.status(201).send(successResponse(action, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation plan not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to create action', requestId));
    }
  }

  async updateAction(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updateActionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const data = parsed.data as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      if (data['title'] !== undefined) updateData['title'] = data['title'];
      if (data['description'] !== undefined) updateData['description'] = data['description'];
      if (data['findingId'] !== undefined) updateData['findingId'] = data['findingId'];
      if (data['riskId'] !== undefined) updateData['riskId'] = data['riskId'];
      if (data['assigneeId'] !== undefined) updateData['assigneeId'] = data['assigneeId'];
      if (data['startDate'] !== undefined)
        updateData['startDate'] = (data['startDate'] as Date).toISOString().split('T')[0];
      if (data['dueDate'] !== undefined)
        updateData['dueDate'] = (data['dueDate'] as Date).toISOString().split('T')[0];
      if (data['costEstimate'] !== undefined) updateData['costEstimate'] = data['costEstimate'];
      if (data['milestone'] !== undefined) updateData['milestone'] = data['milestone'];

      const action = await this.remediationService.updateAction(id, updateData, userId);
      return reply.send(successResponse(action, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation action not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to update action', requestId));
    }
  }

  async deleteAction(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.remediationService.deleteAction(id, userId);
      return reply.status(204).send();
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation action not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to delete action', requestId));
    }
  }

  // ── Verifications ───────────────────────────────────────────────────

  async listVerifications(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { actionId } = request.params as { actionId: string };

    try {
      const verifications = await this.remediationService.listVerifications(actionId);
      return reply.send(successResponse(verifications, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation action not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to list verifications', requestId));
    }
  }

  async verifyAction(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { actionId } = request.params as { actionId: string };

    const parsed = verifyActionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid request body',
          requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId =
      (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const verification = await this.remediationService.verifyAction(
        actionId,
        {
          result:
            parsed.data.result === 'passed'
              ? 'pass'
              : parsed.data.result === 'failed'
                ? 'fail'
                : 'partial',
          notes: parsed.data.notes,
        },
        userId,
      );
      return reply.status(201).send(successResponse(verification, requestId));
    } catch (error) {
      const err = error as { statusCode?: number; code?: string };
      if (err.statusCode === 404) {
        return reply
          .status(404)
          .send(errorResponse('NOT_FOUND', 'Remediation action not found', requestId));
      }
      request.log.error(error);
      return reply
        .status(500)
        .send(errorResponse('INTERNAL_ERROR', 'Failed to verify action', requestId));
    }
  }
}
