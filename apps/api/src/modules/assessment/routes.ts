import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { AssessmentController } from './assessment.controller.js';
import { AssessmentService } from './assessment.service.js';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface AssessmentRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
}

export async function assessmentRoutes(
  app: FastifyInstance,
  options: AssessmentRouteOptions,
) {
  const { db } = options;

  // ── Rate limiting for write endpoints ────────────────────────────────
  // 30 requests per minute per IP
  app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip ?? 'unknown',
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again in ${Math.ceil(Number(context.after) / 1000)} seconds.`,
      },
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    }),
  });

  // ── Helper: create tenant-scoped service ─────────────────────────────
  function createService(tenantId: string) {
    return new AssessmentService(db, tenantId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Template routes
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assessment-templates ────────────────────────────────────────
  app.get('/assessment-templates', {
    schema: {
      tags: ['Assessment'],
      summary: 'List assessment templates',
      description: 'Returns a list of assessment templates. Requires authentication.',
      querystring: {
        type: 'object',
        properties: {
          iecPart: { type: 'string', enum: ['3-2', '3-3', '4-1', '4-2', '2-1'] },
          isSystem: { type: 'string', enum: ['true', 'false'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment.template:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.listTemplates(request, reply);
  });

  // ── POST /assessment-templates ───────────────────────────────────────
  app.post('/assessment-templates', {
    schema: {
      tags: ['Assessment'],
      summary: 'Create an assessment template',
      description: 'Creates a new assessment template. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'iecPart', 'version'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          iecPart: { type: 'string', enum: ['3-2', '3-3', '4-1', '4-2', '2-1'] },
          version: { type: 'string', minLength: 1, maxLength: 20 },
          sections: { type: 'array', items: { type: 'object' } },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment.template:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.createTemplate(request, reply);
  });

  // ── GET /assessment-templates/:id ────────────────────────────────────
  app.get('/assessment-templates/:id', {
    schema: {
      tags: ['Assessment'],
      summary: 'Get an assessment template',
      description: 'Returns a single assessment template by ID. Requires authentication.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment.template:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.getTemplate(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Engagement (assessment) routes
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assessments ─────────────────────────────────────────────────
  app.get('/assessments', {
    schema: {
      tags: ['Assessment'],
      summary: 'List assessments',
      description: 'Returns a paginated list of assessment engagements. Requires authentication.',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          perPage: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          status: { type: 'string', enum: ['draft', 'in_progress', 'review', 'completed', 'archived'] },
          type: { type: 'string', enum: ['gap', 'system', 'component', 'csms', 'custom'] },
          search: { type: 'string', maxLength: 200 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            pagination: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.listEngagements(request, reply);
  });

  // ── POST /assessments ────────────────────────────────────────────────
  app.post('/assessments', {
    schema: {
      tags: ['Assessment'],
      summary: 'Create an assessment',
      description: 'Creates a new assessment engagement. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'type', 'templateId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          type: { type: 'string', enum: ['gap', 'system', 'component', 'csms', 'custom'] },
          iecPart: { type: 'string', enum: ['3-2', '3-3', '4-1', '4-2', '2-1'] },
          scopeSystemId: { type: 'string', format: 'uuid' },
          targetSl: { type: 'integer', minimum: 0, maximum: 4 },
          leadAssessorId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date' },
          targetDate: { type: 'string', format: 'date' },
          templateId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:create')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.createEngagement(request, reply);
  });

  // ── GET /assessments/:id ─────────────────────────────────────────────
  app.get('/assessments/:id', {
    schema: {
      tags: ['Assessment'],
      summary: 'Get an assessment',
      description: 'Returns a single assessment engagement by ID. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.getEngagement(request, reply);
  });

  // ── PATCH /assessments/:id ───────────────────────────────────────────
  app.patch('/assessments/:id', {
    schema: {
      tags: ['Assessment'],
      summary: 'Update an assessment',
      description: 'Updates an assessment engagement. Only draft or in_progress engagements can be updated. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 500 },
          description: { type: 'string', maxLength: 5000 },
          type: { type: 'string', enum: ['gap', 'system', 'component', 'csms', 'custom'] },
          iecPart: { type: 'string', enum: ['3-2', '3-3', '4-1', '4-2', '2-1'] },
          scopeSystemId: { type: 'string', format: 'uuid' },
          targetSl: { type: 'integer', minimum: 0, maximum: 4 },
          currentSl: { type: 'integer', minimum: 0, maximum: 4 },
          status: { type: 'string', enum: ['draft', 'in_progress', 'review', 'completed', 'archived'] },
          leadAssessorId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date' },
          targetDate: { type: 'string', format: 'date' },
          templateId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:update')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.updateEngagement(request, reply);
  });

  // ── DELETE /assessments/:id ──────────────────────────────────────────
  app.delete('/assessments/:id', {
    schema: {
      tags: ['Assessment'],
      summary: 'Delete an assessment',
      description: 'Soft-deletes a draft assessment engagement by setting status to archived. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        204: {
          type: 'null',
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:delete')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.deleteEngagement(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Questions & Responses
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assessments/:id/questions ───────────────────────────────────
  app.get('/assessments/:id/questions', {
    schema: {
      tags: ['Assessment'],
      summary: 'Get assessment questions with responses',
      description: 'Returns all questions for an assessment engagement along with any existing responses. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment.response:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.getEngagementQuestions(request, reply);
  });

  // ── POST /assessments/:id/responses ──────────────────────────────────
  app.post('/assessments/:id/responses', {
    schema: {
      tags: ['Assessment'],
      summary: 'Submit a response',
      description: 'Submits or updates a response to a question within an assessment. Upserts if a response already exists. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['questionId'],
        properties: {
          questionId: { type: 'string', format: 'uuid' },
          score: { type: 'integer', minimum: 0, maximum: 4 },
          maturityLevel: { type: 'integer', minimum: 0, maximum: 4 },
          assessorNotes: { type: 'string', maxLength: 10000 },
          evidenceRefs: { type: 'array', items: { type: 'string', format: 'uuid' } },
          findingRefs: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment.response:write')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.submitResponse(request, reply);
  });

  // ══════════════════════════════════════════════════════════════════════
  // Scorecard & Progress
  // ══════════════════════════════════════════════════════════════════════

  // ── GET /assessments/:id/scorecard ───────────────────────────────────
  app.get('/assessments/:id/scorecard', {
    schema: {
      tags: ['Assessment'],
      summary: 'Get assessment scorecard',
      description: 'Computes and returns the scorecard for an assessment engagement, grouped by section. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.getScorecard(request, reply);
  });

  // ── GET /assessments/:id/progress ────────────────────────────────────
  app.get('/assessments/:id/progress', {
    schema: {
      tags: ['Assessment'],
      summary: 'Get assessment progress',
      description: 'Returns the completion progress for an assessment engagement. Requires authentication.',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('assessment:read')],
  }, async (request, reply) => {
    const tenantId = request.tenantId ?? '';
    const service = createService(tenantId);
    const controller = new AssessmentController(service);
    return controller.getProgress(request, reply);
  });
}
