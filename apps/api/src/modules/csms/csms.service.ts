import { eq, and, desc, count, ilike, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  csmsFrameworks,
  csmsElements,
  csmsPolicies,
  improvementPlans,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DbOrTx = NodePgDatabase | Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

export interface FrameworkFilters {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ElementFilters {
  frameworkId?: string;
  category?: string;
  implementationStatus?: string;
  page?: number;
  perPage?: number;
}

export interface PolicyFilters {
  frameworkId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CreateFrameworkInput {
  name: string;
  organizationId?: string;
  version?: string;
}

export interface CreateElementInput {
  category: string;
  title: string;
  description?: string;
  requirementRef?: string;
  implementationStatus?: string;
  maturityScore?: number;
  ownerId?: string;
  nextReview?: string;
}

export interface UpdateElementInput {
  category?: string;
  title?: string;
  description?: string;
  requirementRef?: string;
  implementationStatus?: string;
  maturityScore?: number;
  ownerId?: string;
  lastReviewed?: string;
  nextReview?: string;
}

export interface CreatePolicyInput {
  elementId?: string;
  title: string;
  version?: string;
  body?: string;
  reviewCycle?: number;
}

export interface UpdatePolicyInput {
  elementId?: string;
  title?: string;
  version?: string;
  status?: string;
  body?: string;
  reviewCycle?: number;
}

export interface CreateImprovementPlanInput {
  elementId?: string;
  title: string;
  description?: string;
  priority?: string;
  targetDate?: string;
  ownerId?: string;
}

export interface GapAnalysisItem {
  elementId: string;
  category: string;
  title: string;
  currentStatus: string;
  targetStatus: string;
  gap: string;
  priority: string;
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

export class CSMSService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    private tenantSchema?: string,
  ) {}

  // ── Frameworks CRUD ─────────────────────────────────────────────────

  async listFrameworks(filters: FrameworkFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      const page = filters.page ?? 1;
      const perPage = Math.min(filters.perPage ?? 25, 100);
      const offset = (page - 1) * perPage;
      const conditions = [];

      if (filters.status) {
        conditions.push(eq(csmsFrameworks.status, filters.status));
      }
      if (filters.search) {
        conditions.push(ilike(csmsFrameworks.name, `%${filters.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        tx
          .select()
          .from(csmsFrameworks)
          .where(whereClause)
          .orderBy(desc(csmsFrameworks.createdAt))
          .limit(perPage)
          .offset(offset),
        tx
          .select({ count: count() })
          .from(csmsFrameworks)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((f) => ({
          id: f.id,
          name: f.name,
          organizationId: f.organizationId,
          version: f.version,
          status: f.status,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    });
  }

  async getFramework(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      return this.getFrameworkWithTx(tx, id);
    });
  }

  async createFramework(data: CreateFrameworkInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      const [newFramework] = await tx
        .insert(csmsFrameworks)
        .values({
          name: data.name,
          organizationId: data.organizationId ?? null,
          version: data.version ?? '1.0',
          status: 'draft',
        })
        .returning();

      if (!newFramework) {
        throw Object.assign(new Error('Failed to create CSMS framework'), {
          statusCode: 500,
          code: 'FRAMEWORK_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.framework_created',
        entityType: 'csms_framework',
        entityId: newFramework.id,
        action: 'create',
        details: { name: data.name },
      });

      return this.getFrameworkWithTx(tx, newFramework.id);
    });
  }

  async updateFramework(id: string, data: { name?: string; version?: string; status?: string }, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, id);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.version !== undefined) updateData['version'] = data.version;
      if (data.status !== undefined) updateData['status'] = data.status;

      await tx
        .update(csmsFrameworks)
        .set(updateData)
        .where(eq(csmsFrameworks.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.framework_updated',
        entityType: 'csms_framework',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return this.getFrameworkWithTx(tx, id);
    });
  }

  async deleteFramework(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, id);

      await tx.delete(csmsFrameworks).where(eq(csmsFrameworks.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.framework_deleted',
        entityType: 'csms_framework',
        entityId: id,
        action: 'delete',
        details: {},
      });
    });
  }

  // ── Elements CRUD ───────────────────────────────────────────────────

  async listElements(filters: ElementFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      const page = filters.page ?? 1;
      const perPage = Math.min(filters.perPage ?? 25, 100);
      const offset = (page - 1) * perPage;
      const conditions = [];

      if (filters.frameworkId) {
        conditions.push(eq(csmsElements.frameworkId, filters.frameworkId));
      }
      if (filters.category) {
        conditions.push(eq(csmsElements.category, filters.category));
      }
      if (filters.implementationStatus) {
        conditions.push(eq(csmsElements.implementationStatus, filters.implementationStatus));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        tx
          .select()
          .from(csmsElements)
          .where(whereClause)
          .orderBy(desc(csmsElements.createdAt))
          .limit(perPage)
          .offset(offset),
        tx
          .select({ count: count() })
          .from(csmsElements)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((e) => ({
          id: e.id,
          frameworkId: e.frameworkId,
          category: e.category,
          title: e.title,
          description: e.description,
          requirementRef: e.requirementRef,
          implementationStatus: e.implementationStatus,
          maturityScore: e.maturityScore,
          ownerId: e.ownerId,
          lastReviewed: e.lastReviewed?.toISOString() ?? null,
          nextReview: e.nextReview,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    });
  }

  async getElement(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      return this.getElementWithTx(tx, id);
    });
  }

  async createElement(frameworkId: string, data: CreateElementInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, frameworkId);

      const [newElement] = await tx
        .insert(csmsElements)
        .values({
          frameworkId,
          category: data.category,
          title: data.title,
          description: data.description ?? null,
          requirementRef: data.requirementRef ?? null,
          implementationStatus: data.implementationStatus ?? 'not_started',
          maturityScore: data.maturityScore ?? null,
          ownerId: data.ownerId ?? null,
          nextReview: data.nextReview ?? null,
        })
        .returning();

      if (!newElement) {
        throw Object.assign(new Error('Failed to create CSMS element'), {
          statusCode: 500,
          code: 'ELEMENT_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.element_created',
        entityType: 'csms_element',
        entityId: newElement.id,
        action: 'create',
        details: { title: data.title, frameworkId },
      });

      return this.getElementWithTx(tx, newElement.id);
    });
  }

  async updateElement(id: string, data: UpdateElementInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getElementWithTx(tx, id);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.category !== undefined) updateData['category'] = data.category;
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.requirementRef !== undefined) updateData['requirementRef'] = data.requirementRef;
      if (data.implementationStatus !== undefined) updateData['implementationStatus'] = data.implementationStatus;
      if (data.maturityScore !== undefined) updateData['maturityScore'] = data.maturityScore;
      if (data.ownerId !== undefined) updateData['ownerId'] = data.ownerId;
      if (data.lastReviewed !== undefined) updateData['lastReviewed'] = data.lastReviewed;
      if (data.nextReview !== undefined) updateData['nextReview'] = data.nextReview;

      await tx
        .update(csmsElements)
        .set(updateData)
        .where(eq(csmsElements.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.element_updated',
        entityType: 'csms_element',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return this.getElementWithTx(tx, id);
    });
  }

  async deleteElement(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getElementWithTx(tx, id);

      await tx.delete(csmsElements).where(eq(csmsElements.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.element_deleted',
        entityType: 'csms_element',
        entityId: id,
        action: 'delete',
        details: {},
      });
    });
  }

  // ── Policies CRUD ───────────────────────────────────────────────────

  async listPolicies(filters: PolicyFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      const page = filters.page ?? 1;
      const perPage = Math.min(filters.perPage ?? 25, 100);
      const offset = (page - 1) * perPage;
      const conditions = [];

      if (filters.frameworkId) {
        conditions.push(eq(csmsPolicies.frameworkId, filters.frameworkId));
      }
      if (filters.status) {
        conditions.push(eq(csmsPolicies.status, filters.status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        tx
          .select()
          .from(csmsPolicies)
          .where(whereClause)
          .orderBy(desc(csmsPolicies.createdAt))
          .limit(perPage)
          .offset(offset),
        tx
          .select({ count: count() })
          .from(csmsPolicies)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((p) => ({
          id: p.id,
          frameworkId: p.frameworkId,
          elementId: p.elementId,
          title: p.title,
          version: p.version,
          status: p.status,
          body: p.body,
          approvedBy: p.approvedBy,
          approvedAt: p.approvedAt?.toISOString() ?? null,
          reviewCycle: p.reviewCycle,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    });
  }

  async getPolicy(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      return this.getPolicyWithTx(tx, id);
    });
  }

  async createPolicy(frameworkId: string, data: CreatePolicyInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, frameworkId);

      const [newPolicy] = await tx
        .insert(csmsPolicies)
        .values({
          frameworkId,
          elementId: data.elementId ?? null,
          title: data.title,
          version: data.version ?? '1.0',
          status: 'draft',
          body: data.body ?? null,
          reviewCycle: data.reviewCycle ?? 365,
        })
        .returning();

      if (!newPolicy) {
        throw Object.assign(new Error('Failed to create CSMS policy'), {
          statusCode: 500,
          code: 'POLICY_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.policy_created',
        entityType: 'csms_policy',
        entityId: newPolicy.id,
        action: 'create',
        details: { title: data.title, frameworkId },
      });

      return this.getPolicyWithTx(tx, newPolicy.id);
    });
  }

  async updatePolicy(id: string, data: UpdatePolicyInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getPolicyWithTx(tx, id);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.elementId !== undefined) updateData['elementId'] = data.elementId;
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.version !== undefined) updateData['version'] = data.version;
      if (data.status !== undefined) updateData['status'] = data.status;
      if (data.body !== undefined) updateData['body'] = data.body;
      if (data.reviewCycle !== undefined) updateData['reviewCycle'] = data.reviewCycle;

      await tx
        .update(csmsPolicies)
        .set(updateData)
        .where(eq(csmsPolicies.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.policy_updated',
        entityType: 'csms_policy',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return this.getPolicyWithTx(tx, id);
    });
  }

  async approvePolicy(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getPolicyWithTx(tx, id);

      await tx
        .update(csmsPolicies)
        .set({
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(csmsPolicies.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.policy_approved',
        entityType: 'csms_policy',
        entityId: id,
        action: 'update',
        details: {},
      });

      return this.getPolicyWithTx(tx, id);
    });
  }

  async deletePolicy(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getPolicyWithTx(tx, id);

      await tx.delete(csmsPolicies).where(eq(csmsPolicies.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.policy_deleted',
        entityType: 'csms_policy',
        entityId: id,
        action: 'delete',
        details: {},
      });
    });
  }

  // ── Improvement Plans ───────────────────────────────────────────────

  async listImprovementPlans(frameworkId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, frameworkId);

      const items = await tx
        .select()
        .from(improvementPlans)
        .where(eq(improvementPlans.frameworkId, frameworkId))
        .orderBy(desc(improvementPlans.createdAt));

      return items.map((ip) => ({
        id: ip.id,
        frameworkId: ip.frameworkId,
        elementId: ip.elementId,
        title: ip.title,
        description: ip.description,
        priority: ip.priority,
        targetDate: ip.targetDate,
        status: ip.status,
        ownerId: ip.ownerId,
        createdAt: ip.createdAt.toISOString(),
        updatedAt: ip.updatedAt.toISOString(),
      }));
    });
  }

  async createImprovementPlan(frameworkId: string, data: CreateImprovementPlanInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, frameworkId);

      const [newPlan] = await tx
        .insert(improvementPlans)
        .values({
          frameworkId,
          elementId: data.elementId ?? null,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority ?? 'medium',
          targetDate: data.targetDate ?? null,
          status: 'planned',
          ownerId: data.ownerId ?? null,
        })
        .returning();

      if (!newPlan) {
        throw Object.assign(new Error('Failed to create improvement plan'), {
          statusCode: 500,
          code: 'IMPROVEMENT_PLAN_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'csms.improvement_plan_created',
        entityType: 'csms_improvement_plan',
        entityId: newPlan.id,
        action: 'create',
        details: { title: data.title, frameworkId },
      });

      return {
        id: newPlan.id,
        frameworkId: newPlan.frameworkId,
        elementId: newPlan.elementId,
        title: newPlan.title,
        description: newPlan.description,
        priority: newPlan.priority,
        targetDate: newPlan.targetDate,
        status: newPlan.status,
        ownerId: newPlan.ownerId,
        createdAt: newPlan.createdAt.toISOString(),
        updatedAt: newPlan.updatedAt.toISOString(),
      };
    });
  }

  // ── Gap Analysis ────────────────────────────────────────────────────

  async getGapAnalysis(frameworkId: string): Promise<{ frameworkId: string; elements: GapAnalysisItem[] }> {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      await this.getFrameworkWithTx(tx, frameworkId);

      const elements = await tx
        .select()
        .from(csmsElements)
        .where(eq(csmsElements.frameworkId, frameworkId));

      const gapItems: GapAnalysisItem[] = elements
        .filter((e) => e.implementationStatus !== 'implemented' && e.implementationStatus !== 'na')
        .map((e) => ({
          elementId: e.id,
          category: e.category,
          title: e.title,
          currentStatus: e.implementationStatus ?? 'not_started',
          targetStatus: 'implemented',
          gap: `${e.title} is currently ${e.implementationStatus ?? 'not started'}, needs to reach implemented status`,
          priority: e.maturityScore !== null && e.maturityScore <= 2 ? 'critical'
            : e.maturityScore !== null && e.maturityScore <= 3 ? 'high'
            : 'medium',
        }));

      return { frameworkId, elements: gapItems };
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async getFrameworkWithTx(db: DbOrTx, id: string) {
    const [framework] = await db
      .select()
      .from(csmsFrameworks)
      .where(eq(csmsFrameworks.id, id))
      .limit(1);

    if (!framework) {
      throw Object.assign(new Error('CSMS framework not found'), {
        statusCode: 404,
        code: 'FRAMEWORK_NOT_FOUND',
      });
    }

    return {
      id: framework.id,
      name: framework.name,
      organizationId: framework.organizationId,
      version: framework.version,
      status: framework.status,
      createdAt: framework.createdAt.toISOString(),
      updatedAt: framework.updatedAt.toISOString(),
    };
  }

  private async getElementWithTx(db: DbOrTx, id: string) {
    const [element] = await db
      .select()
      .from(csmsElements)
      .where(eq(csmsElements.id, id))
      .limit(1);

    if (!element) {
      throw Object.assign(new Error('CSMS element not found'), {
        statusCode: 404,
        code: 'ELEMENT_NOT_FOUND',
      });
    }

    return {
      id: element.id,
      frameworkId: element.frameworkId,
      category: element.category,
      title: element.title,
      description: element.description,
      requirementRef: element.requirementRef,
      implementationStatus: element.implementationStatus,
      maturityScore: element.maturityScore,
      ownerId: element.ownerId,
      lastReviewed: element.lastReviewed?.toISOString() ?? null,
      nextReview: element.nextReview,
      createdAt: element.createdAt.toISOString(),
      updatedAt: element.updatedAt.toISOString(),
    };
  }

  private async getPolicyWithTx(db: DbOrTx, id: string) {
    const [policy] = await db
      .select()
      .from(csmsPolicies)
      .where(eq(csmsPolicies.id, id))
      .limit(1);

    if (!policy) {
      throw Object.assign(new Error('CSMS policy not found'), {
        statusCode: 404,
        code: 'POLICY_NOT_FOUND',
      });
    }

    return {
      id: policy.id,
      frameworkId: policy.frameworkId,
      elementId: policy.elementId,
      title: policy.title,
      version: policy.version,
      status: policy.status,
      body: policy.body,
      approvedBy: policy.approvedBy,
      approvedAt: policy.approvedAt?.toISOString() ?? null,
      reviewCycle: policy.reviewCycle,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
    };
  }

  private async createAuditEvent(db: DbOrTx, params: {
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
      const [lastEvent] = await db
        .select({ eventHash: auditEvents.eventHash })
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, this.tenantId))
        .orderBy(desc(auditEvents.id))
        .limit(1);

      const previousHash = lastEvent?.eventHash ?? null;

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

      await db.insert(auditEvents).values({
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
      console.error('Failed to create audit event:', error);
    }
  }
}
