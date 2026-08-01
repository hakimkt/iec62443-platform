import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  createFrameworkSchema,
  updateFrameworkSchema,
  createElementSchema,
  updateElementSchema,
  createPolicySchema,
  updatePolicySchema,
  createImprovementPlanSchema,
} from '@iec62443/shared-schemas';

import type { CSMSService } from './csms.service.js';

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

export class CSMSController {
  constructor(private csmsService: CSMSService) {}

  // ── Frameworks ──────────────────────────────────────────────────────

  async listFrameworks(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.csmsService.listFrameworks({
        status: query['status'] as string | undefined,
        search: query['search'] as string | undefined,
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list CSMS frameworks', requestId));
    }
  }

  async getFramework(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const framework = await this.csmsService.getFramework(id);
      return reply.send(successResponse(framework, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve framework', requestId));
    }
  }

  async createFramework(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;

    const parsed = createFrameworkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const framework = await this.csmsService.createFramework(
        {
          name: parsed.data.name,
          organizationId: parsed.data.organizationId as string | undefined,
          version: parsed.data.version,
        },
        userId,
      );
      return reply.status(201).send(successResponse(framework, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create framework', requestId));
    }
  }

  async updateFramework(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updateFrameworkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const framework = await this.csmsService.updateFramework(id, {
        name: parsed.data.name,
        version: parsed.data.version,
        status: parsed.data.status,
      }, userId);
      return reply.send(successResponse(framework, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update framework', requestId));
    }
  }

  async deleteFramework(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.csmsService.deleteFramework(id, userId);
      return reply.status(204).send();
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to delete framework', requestId));
    }
  }

  // ── Elements ────────────────────────────────────────────────────────

  async listElements(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.csmsService.listElements({
        frameworkId: query['frameworkId'] as string | undefined,
        category: query['category'] as string | undefined,
        implementationStatus: query['implementationStatus'] as string | undefined,
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list elements', requestId));
    }
  }

  async getElement(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const element = await this.csmsService.getElement(id);
      return reply.send(successResponse(element, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS element not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve element', requestId));
    }
  }

  async createElement(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { frameworkId } = request.params as { frameworkId: string };

    const parsed = createElementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const element = await this.csmsService.createElement(frameworkId, {
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        requirementRef: parsed.data.requirementRef,
        implementationStatus: parsed.data.implementationStatus,
        maturityScore: parsed.data.maturityScore,
        ownerId: parsed.data.ownerId as string | undefined,
        nextReview: parsed.data.nextReview?.toISOString().split('T')[0],
      }, userId);
      return reply.status(201).send(successResponse(element, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create element', requestId));
    }
  }

  async updateElement(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updateElementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const data = parsed.data as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      if (data['category'] !== undefined) updateData['category'] = data['category'];
      if (data['title'] !== undefined) updateData['title'] = data['title'];
      if (data['description'] !== undefined) updateData['description'] = data['description'];
      if (data['requirementRef'] !== undefined) updateData['requirementRef'] = data['requirementRef'];
      if (data['implementationStatus'] !== undefined) updateData['implementationStatus'] = data['implementationStatus'];
      if (data['maturityScore'] !== undefined) updateData['maturityScore'] = data['maturityScore'];
      if (data['ownerId'] !== undefined) updateData['ownerId'] = data['ownerId'];
      if (data['nextReview'] !== undefined) updateData['nextReview'] = (data['nextReview'] as Date).toISOString().split('T')[0];

      const element = await this.csmsService.updateElement(id, updateData, userId);
      return reply.send(successResponse(element, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS element not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update element', requestId));
    }
  }

  async deleteElement(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.csmsService.deleteElement(id, userId);
      return reply.status(204).send();
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS element not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to delete element', requestId));
    }
  }

  // ── Policies ────────────────────────────────────────────────────────

  async listPolicies(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const query = request.query as Record<string, unknown>;

    try {
      const result = await this.csmsService.listPolicies({
        frameworkId: query['frameworkId'] as string | undefined,
        status: query['status'] as string | undefined,
        page: query['page'] ? Number(query['page']) : undefined,
        perPage: query['perPage'] ? Number(query['perPage']) : undefined,
      });
      return reply.send(paginatedResponse(result.items, result.pagination, requestId));
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list policies', requestId));
    }
  }

  async getPolicy(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const policy = await this.csmsService.getPolicy(id);
      return reply.send(successResponse(policy, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS policy not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to retrieve policy', requestId));
    }
  }

  async createPolicy(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { frameworkId } = request.params as { frameworkId: string };

    const parsed = createPolicySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const policy = await this.csmsService.createPolicy(frameworkId, {
        elementId: parsed.data.elementId as string | undefined,
        title: parsed.data.title,
        version: parsed.data.version,
        body: parsed.data.body,
        reviewCycle: parsed.data.reviewCycle,
      }, userId);
      return reply.status(201).send(successResponse(policy, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create policy', requestId));
    }
  }

  async updatePolicy(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    const parsed = updatePolicySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const data = parsed.data as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      if (data['elementId'] !== undefined) updateData['elementId'] = data['elementId'];
      if (data['title'] !== undefined) updateData['title'] = data['title'];
      if (data['version'] !== undefined) updateData['version'] = data['version'];
      if (data['status'] !== undefined) updateData['status'] = data['status'];
      if (data['body'] !== undefined) updateData['body'] = data['body'];
      if (data['reviewCycle'] !== undefined) updateData['reviewCycle'] = data['reviewCycle'];

      const policy = await this.csmsService.updatePolicy(id, updateData, userId);
      return reply.send(successResponse(policy, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS policy not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to update policy', requestId));
    }
  }

  async approvePolicy(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const policy = await this.csmsService.approvePolicy(id, userId);
      return reply.send(successResponse(policy, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS policy not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to approve policy', requestId));
    }
  }

  async deletePolicy(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };
    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      await this.csmsService.deletePolicy(id, userId);
      return reply.status(204).send();
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS policy not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to delete policy', requestId));
    }
  }

  // ── Improvement Plans ───────────────────────────────────────────────

  async listImprovementPlans(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { frameworkId } = request.params as { frameworkId: string };

    try {
      const plans = await this.csmsService.listImprovementPlans(frameworkId);
      return reply.send(successResponse(plans, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to list improvement plans', requestId));
    }
  }

  async createImprovementPlan(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { frameworkId } = request.params as { frameworkId: string };

    const parsed = createImprovementPlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', requestId,
          parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        ),
      );
    }

    const userId = (request.user as { sub: string } | undefined)?.sub ?? '00000000-0000-0000-0000-000000000000';

    try {
      const plan = await this.csmsService.createImprovementPlan(frameworkId, {
        elementId: parsed.data.elementId as string | undefined,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        targetDate: parsed.data.targetDate?.toISOString().split('T')[0],
        ownerId: parsed.data.ownerId as string | undefined,
      }, userId);
      return reply.status(201).send(successResponse(plan, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to create improvement plan', requestId));
    }
  }

  // ── Gap Analysis ────────────────────────────────────────────────────

  async getGapAnalysis(request: FastifyRequest, reply: FastifyReply) {
    const requestId = request.id as string;
    const { id } = request.params as { id: string };

    try {
      const analysis = await this.csmsService.getGapAnalysis(id);
      return reply.send(successResponse(analysis, requestId));
    } catch (error) {
      const err = error as { statusCode?: number };
      if (err.statusCode === 404) {
        return reply.status(404).send(errorResponse('NOT_FOUND', 'CSMS framework not found', requestId));
      }
      request.log.error(error);
      return reply.status(500).send(errorResponse('INTERNAL_ERROR', 'Failed to get gap analysis', requestId));
    }
  }
}
