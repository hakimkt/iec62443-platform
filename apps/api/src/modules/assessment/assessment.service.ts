import { eq, and, desc, sql, count } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  templates,
  questions,
  engagements,
  responses,
  scorecards,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateFilters {
  iecPart?: string;
  isSystem?: boolean;
}

export interface EngagementFilters {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  iecPart: string;
  version: string;
  sections?: unknown[];
}

export interface CreateEngagementInput {
  name: string;
  description?: string;
  type: string;
  iecPart?: string;
  scopeSystemId?: string;
  targetSl?: number;
  leadAssessorId?: string;
  startDate?: Date;
  targetDate?: Date;
  templateId: string;
}

export interface UpdateEngagementInput {
  name?: string;
  description?: string;
  type?: string;
  iecPart?: string;
  scopeSystemId?: string;
  targetSl?: number;
  currentSl?: number;
  status?: string;
  leadAssessorId?: string;
  startDate?: Date;
  targetDate?: Date;
  templateId?: string;
}

export interface SubmitResponseInput {
  score?: number;
  maturityLevel?: string;
  assessorNotes?: string;
  evidenceRefs?: string[];
  findingRefs?: string[];
}

export interface Progress {
  engagementId: string;
  totalQuestions: number;
  answeredQuestions: number;
  completionPct: number;
}

// ---------------------------------------------------------------------------
// Audit hash chain helper
// ---------------------------------------------------------------------------

async function computeEventHash(
  data: string,
  previousHash: string | null,
): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AssessmentService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  // ── Templates ────────────────────────────────────────────────────────

  async listTemplates(filters: TemplateFilters) {
    const conditions = [];

    if (filters.iecPart) {
      conditions.push(eq(templates.iecPart, filters.iecPart));
    }

    if (filters.isSystem !== undefined) {
      conditions.push(eq(templates.isSystem, filters.isSystem));
    }

    if (conditions.length > 0) {
      return this.db
        .select()
        .from(templates)
        .where(and(...conditions))
        .orderBy(desc(templates.createdAt));
    }

    return this.db
      .select()
      .from(templates)
      .orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: string) {
    const [template] = await this.db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);

    if (!template) {
      throw Object.assign(new Error('Template not found'), {
        statusCode: 404,
        code: 'TEMPLATE_NOT_FOUND',
      });
    }

    return template;
  }

  async createTemplate(data: CreateTemplateInput, userId: string) {
    const [newTemplate] = await this.db
      .insert(templates)
      .values({
        name: data.name,
        description: data.description ?? null,
        iecPart: data.iecPart,
        version: data.version,
        isSystem: false,
        sections: data.sections ?? [],
      })
      .returning();

    if (!newTemplate) {
      throw Object.assign(new Error('Failed to create template'), {
        statusCode: 500,
        code: 'TEMPLATE_CREATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'assessment.template_created',
      entityType: 'template',
      entityId: newTemplate.id,
      action: 'create',
      details: { name: data.name, iecPart: data.iecPart, version: data.version },
    });

    return newTemplate;
  }

  // ── Engagements ──────────────────────────────────────────────────────

  async listEngagements(filters: EngagementFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    // Exclude archived by default
    conditions.push(sql`${engagements.status} != 'archived'`);

    if (filters.status) {
      conditions.push(eq(engagements.status, filters.status));
    }

    if (filters.type) {
      conditions.push(eq(engagements.type, filters.type));
    }

    if (filters.search) {
      conditions.push(sql`${engagements.name} ILIKE ${`%${filters.search}%`}`);
    }

    const whereClause = and(...conditions);

    // Count total
    const [countResult] = await this.db
      .select({ total: count() })
      .from(engagements)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Fetch page
    const data = await this.db
      .select()
      .from(engagements)
      .where(whereClause)
      .orderBy(desc(engagements.createdAt))
      .limit(perPage)
      .offset(offset);

    const pagination: Pagination = {
      page,
      perPage,
      total,
      totalPages,
    };

    return { data, pagination };
  }

  async getEngagement(id: string) {
    const [engagement] = await this.db
      .select()
      .from(engagements)
      .where(eq(engagements.id, id))
      .limit(1);

    if (!engagement) {
      throw Object.assign(new Error('Engagement not found'), {
        statusCode: 404,
        code: 'ENGAGEMENT_NOT_FOUND',
      });
    }

    return engagement;
  }

  async createEngagement(data: CreateEngagementInput, userId: string) {
    // Validate template exists
    const [template] = await this.db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.id, data.templateId))
      .limit(1);

    if (!template) {
      throw Object.assign(new Error('Referenced template does not exist'), {
        statusCode: 400,
        code: 'INVALID_TEMPLATE',
      });
    }

    const engagementValues = {
      name: data.name,
      description: data.description ?? null,
      type: data.type,
      iecPart: data.iecPart ?? null,
      scopeSystemId: data.scopeSystemId ?? null,
      targetSl: data.targetSl ?? null,
      status: 'draft' as const,
      leadAssessorId: data.leadAssessorId ?? null,
      startDate: data.startDate ? data.startDate.toISOString().split('T')[0] : null,
      targetDate: data.targetDate ? data.targetDate.toISOString().split('T')[0] : null,
      templateId: data.templateId,
    };

    const [newEngagement] = await this.db
      .insert(engagements)
      .values(engagementValues)
      .returning();

    if (!newEngagement) {
      throw Object.assign(new Error('Failed to create engagement'), {
        statusCode: 500,
        code: 'ENGAGEMENT_CREATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'assessment.engagement_created',
      entityType: 'engagement',
      entityId: newEngagement.id,
      action: 'create',
      details: { name: data.name, type: data.type, templateId: data.templateId },
    });

    return newEngagement;
  }

  async updateEngagement(id: string, data: UpdateEngagementInput, userId: string) {
    const engagement = await this.getEngagement(id);

    // Only allow updates if status is 'draft' or 'in_progress'
    if (engagement.status !== 'draft' && engagement.status !== 'in_progress') {
      throw Object.assign(
        new Error('Cannot update engagement that is in review, completed, or archived'),
        {
          statusCode: 409,
          code: 'ENGAGEMENT_NOT_EDITABLE',
        },
      );
    }

    // Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ['in_progress', 'archived'],
        in_progress: ['review', 'draft'],
      };

      const allowed = validTransitions[engagement.status];
      if (!allowed || !allowed.includes(data.status)) {
        throw Object.assign(
          new Error(`Cannot transition engagement from '${engagement.status}' to '${data.status}'`),
          {
            statusCode: 409,
            code: 'INVALID_STATUS_TRANSITION',
          },
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.type !== undefined) updateData['type'] = data.type;
    if (data.iecPart !== undefined) updateData['iecPart'] = data.iecPart;
    if (data.scopeSystemId !== undefined) updateData['scopeSystemId'] = data.scopeSystemId;
    if (data.targetSl !== undefined) updateData['targetSl'] = data.targetSl;
    if (data.currentSl !== undefined) updateData['currentSl'] = data.currentSl;
    if (data.status !== undefined) updateData['status'] = data.status;
    if (data.leadAssessorId !== undefined) updateData['leadAssessorId'] = data.leadAssessorId;
    if (data.startDate !== undefined) updateData['startDate'] = data.startDate ? data.startDate.toISOString().split('T')[0] : null;
    if (data.targetDate !== undefined) updateData['targetDate'] = data.targetDate ? data.targetDate.toISOString().split('T')[0] : null;
    if (data.templateId !== undefined) updateData['templateId'] = data.templateId;

    const [updated] = await this.db
      .update(engagements)
      .set(updateData)
      .where(eq(engagements.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update engagement'), {
        statusCode: 500,
        code: 'ENGAGEMENT_UPDATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'assessment.engagement_updated',
      entityType: 'engagement',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteEngagement(id: string, userId: string) {
    const engagement = await this.getEngagement(id);

    // Only allow if status is 'draft'
    if (engagement.status !== 'draft') {
      throw Object.assign(
        new Error('Only draft engagements can be deleted'),
        {
          statusCode: 409,
          code: 'ENGAGEMENT_NOT_DELETABLE',
        },
      );
    }

    // Soft delete by setting status to 'archived'
    await this.db
      .update(engagements)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(engagements.id, id));

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'assessment.engagement_deleted',
      entityType: 'engagement',
      entityId: id,
      action: 'delete',
      details: { name: engagement.name },
    });
  }

  // ── Questions & Responses ────────────────────────────────────────────

  async listQuestions(templateId: string) {
    return this.db
      .select()
      .from(questions)
      .where(and(eq(questions.templateId, templateId), eq(questions.isActive, true)))
      .orderBy(questions.sortOrder);
  }

  async getEngagementQuestions(engagementId: string) {
    // Get the engagement to find its template
    const engagement = await this.getEngagement(engagementId);

    if (!engagement.templateId) {
      throw Object.assign(new Error('Engagement has no associated template'), {
        statusCode: 400,
        code: 'NO_TEMPLATE',
      });
    }

    // Get all questions for the template
    const templateQuestions = await this.db
      .select()
      .from(questions)
      .where(and(eq(questions.templateId, engagement.templateId), eq(questions.isActive, true)))
      .orderBy(questions.sortOrder);

    // Get existing responses for this engagement
    const existingResponses = await this.db
      .select()
      .from(responses)
      .where(eq(responses.engagementId, engagementId));

    // Build a map of questionId -> response
    const responseMap = new Map(existingResponses.map((r) => [r.questionId, r]));

    // Merge questions with their responses
    return templateQuestions.map((q) => ({
      ...q,
      response: responseMap.get(q.id) ?? null,
    }));
  }

  async submitResponse(
    engagementId: string,
    questionId: string,
    data: SubmitResponseInput,
    userId: string,
  ) {
    // Verify engagement exists and is editable
    const engagement = await this.getEngagement(engagementId);

    if (engagement.status !== 'draft' && engagement.status !== 'in_progress') {
      throw Object.assign(
        new Error('Cannot submit responses for an engagement that is not draft or in_progress'),
        {
          statusCode: 409,
          code: 'ENGAGEMENT_NOT_EDITABLE',
        },
      );
    }

    // Verify question exists
    const [question] = await this.db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    if (!question) {
      throw Object.assign(new Error('Question not found'), {
        statusCode: 404,
        code: 'QUESTION_NOT_FOUND',
      });
    }

    // Check if a response already exists for this engagement+question
    const [existing] = await this.db
      .select({ id: responses.id })
      .from(responses)
      .where(
        and(
          eq(responses.engagementId, engagementId),
          eq(responses.questionId, questionId),
        ),
      )
      .limit(1);

    const now = new Date();

    if (existing) {
      // Update existing response
      const [updated] = await this.db
        .update(responses)
        .set({
          score: data.score ?? null,
          maturityLevel: data.maturityLevel ?? null,
          assessorNotes: data.assessorNotes ?? null,
          evidenceRefs: data.evidenceRefs ?? [],
          findingRefs: data.findingRefs ?? [],
          answeredBy: userId,
          answeredAt: now,
          updatedAt: now,
        })
        .where(eq(responses.id, existing.id))
        .returning();

      if (!updated) {
        throw Object.assign(new Error('Failed to update response'), {
          statusCode: 500,
          code: 'RESPONSE_UPDATE_FAILED',
        });
      }

      // Audit
      await this.createAuditEvent({
        userId,
        eventType: 'assessment.response_updated',
        entityType: 'response',
        entityId: updated.id,
        action: 'update',
        details: { engagementId, questionId, score: data.score },
      });

      return updated;
    }

    // Insert new response
    const [newResponse] = await this.db
      .insert(responses)
      .values({
        engagementId,
        questionId,
        score: data.score ?? null,
        maturityLevel: data.maturityLevel ?? null,
        assessorNotes: data.assessorNotes ?? null,
        evidenceRefs: data.evidenceRefs ?? [],
        findingRefs: data.findingRefs ?? [],
        answeredBy: userId,
        answeredAt: now,
      })
      .returning();

    if (!newResponse) {
      throw Object.assign(new Error('Failed to submit response'), {
        statusCode: 500,
        code: 'RESPONSE_CREATE_FAILED',
      });
    }

    // If this is the first response, update engagement status to 'in_progress'
    if (engagement.status === 'draft') {
      await this.db
        .update(engagements)
        .set({ status: 'in_progress', updatedAt: now })
        .where(eq(engagements.id, engagementId));
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'assessment.response_created',
      entityType: 'response',
      entityId: newResponse.id,
      action: 'create',
      details: { engagementId, questionId, score: data.score },
    });

    return newResponse;
  }

  // ── Scorecard ─────────────────────────────────────────────────────────

  async getScorecard(engagementId: string) {
    // Verify engagement exists and get its template
    const engagement = await this.getEngagement(engagementId);

    if (!engagement.templateId) {
      throw Object.assign(new Error('Engagement has no associated template'), {
        statusCode: 400,
        code: 'NO_TEMPLATE',
      });
    }

    // Get all questions for the engagement's template

    const allQuestions = await this.db
      .select()
      .from(questions)
      .where(and(eq(questions.templateId, engagement.templateId), eq(questions.isActive, true)))
      .orderBy(questions.sortOrder);

    // Get all responses for this engagement
    const allResponses = await this.db
      .select()
      .from(responses)
      .where(eq(responses.engagementId, engagementId));

    // Build response map
    const responseMap = new Map(allResponses.map((r) => [r.questionId, r]));

    // Group questions by section
    const sectionMap = new Map<string, typeof allQuestions>();
    for (const q of allQuestions) {
      const section = q.section ?? 'Uncategorized';
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section)!.push(q);
    }

    // Calculate scorecard per section
    const scorecardResults: Array<{
      category: string;
      currentSl: number;
      targetSl: number;
      gap: number;
      totalQuestions: number;
      answeredCount: number;
      compliancePct: number;
    }> = [];

    for (const [section, sectionQuestions] of sectionMap) {
      const totalQuestions = sectionQuestions.length;
      let answeredCount = 0;
      let totalScore = 0;
      let maxPossibleScore = 0;

      for (const q of sectionQuestions) {
        const r = responseMap.get(q.id);
        maxPossibleScore += q.maxScore ?? 4;

        if (r && r.score !== null) {
          answeredCount++;
          totalScore += r.score;
        }
      }

      const currentSl = maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 4 * 10) / 10
        : 0;

      const targetSl = engagement.targetSl ?? 0;
      const gap = Math.max(0, targetSl - Math.floor(currentSl));
      const compliancePct = maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
        : 0;

      scorecardResults.push({
        category: section,
        currentSl: Math.min(4, Math.floor(currentSl)),
        targetSl,
        gap,
        totalQuestions,
        answeredCount,
        compliancePct,
      });
    }

    // Upsert scorecard rows
    const now = new Date();
    for (const entry of scorecardResults) {
      // Check if a scorecard row already exists for this engagement+category
      const [existing] = await this.db
        .select({ id: scorecards.id })
        .from(scorecards)
        .where(
          and(
            eq(scorecards.engagementId, engagementId),
            eq(scorecards.category, entry.category),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(scorecards)
          .set({
            currentSl: entry.currentSl,
            targetSl: entry.targetSl,
            totalQuestions: entry.totalQuestions,
            answeredCount: entry.answeredCount,
            compliancePct: String(entry.compliancePct),
            snapshotAt: now,
          })
          .where(eq(scorecards.id, existing.id));
      } else {
        await this.db.insert(scorecards).values({
          engagementId,
          category: entry.category,
          currentSl: entry.currentSl,
          targetSl: entry.targetSl,
          totalQuestions: entry.totalQuestions,
          answeredCount: entry.answeredCount,
          compliancePct: String(entry.compliancePct),
          snapshotAt: now,
        });
      }
    }

    // Return the full scorecard
    return this.db
      .select()
      .from(scorecards)
      .where(eq(scorecards.engagementId, engagementId))
      .orderBy(scorecards.category);
  }

  // ── Progress ──────────────────────────────────────────────────────────

  async getProgress(engagementId: string): Promise<Progress> {
    const engagement = await this.getEngagement(engagementId);

    if (!engagement.templateId) {
      throw Object.assign(new Error('Engagement has no associated template'), {
        statusCode: 400,
        code: 'NO_TEMPLATE',
      });
    }

    // Count total questions for the template
    const [totalResult] = await this.db
      .select({ total: count() })
      .from(questions)
      .where(and(eq(questions.templateId, engagement.templateId), eq(questions.isActive, true)));

    const totalQuestions = totalResult?.total ?? 0;

    // Count answered responses for this engagement (score is not null)
    const [answeredResult] = await this.db
      .select({ total: count() })
      .from(responses)
      .where(
        and(
          eq(responses.engagementId, engagementId),
          sql`${responses.score} IS NOT NULL`,
        ),
      );

    const answeredQuestions = answeredResult?.total ?? 0;
    const completionPct = totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 10000) / 100
      : 0;

    return {
      engagementId,
      totalQuestions,
      answeredQuestions,
      completionPct,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async createAuditEvent(params: {
    userId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'read';
    details: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      // Get the last audit event hash for chaining (tenant-scoped)
      const [lastEvent] = await this.db
        .select({ eventHash: auditEvents.eventHash })
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, this.tenantId))
        .orderBy(desc(auditEvents.id))
        .limit(1);

      const previousHash = lastEvent?.eventHash ?? null;

      // Compute the hash for this event
      const dataToHash = JSON.stringify({
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        timestamp: new Date().toISOString(),
      });
      const eventHash = await computeEventHash(dataToHash, previousHash);

      await this.db.insert(auditEvents).values({
        tenantId: this.tenantId,
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        previousHash,
        eventHash,
      });
    } catch (error) {
      // Audit failures should not break the primary operation
      console.error('Failed to create audit event:', error);
    }
  }
}
