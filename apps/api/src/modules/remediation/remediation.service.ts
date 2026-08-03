import crypto from 'node:crypto';
import {
  auditEvents,
  remediationActions,
  remediationPlans,
  verifications,
} from '@iec62443/database';
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DbOrTx = NodePgDatabase | Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

export interface PlanFilters {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ActionFilters {
  planId?: string;
  status?: string;
  assigneeId?: string;
  page?: number;
  perPage?: number;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  findingIds?: string[];
  riskIds?: string[];
  ownerId?: string;
  budgetEstimate?: number;
  startDate?: string;
  targetDate?: string;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  findingIds?: string[];
  riskIds?: string[];
  ownerId?: string;
  status?: string;
  budgetEstimate?: number;
  budgetActual?: number;
  startDate?: string;
  targetDate?: string;
}

export interface CreateActionInput {
  title: string;
  description?: string;
  findingId?: string;
  riskId?: string;
  assigneeId?: string;
  startDate?: string;
  dueDate?: string;
  costEstimate?: number;
  milestone?: string;
}

export interface UpdateActionInput {
  title?: string;
  description?: string;
  findingId?: string;
  riskId?: string;
  assigneeId?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  costEstimate?: number;
  costActual?: number;
  milestone?: string;
}

export interface VerifyActionInput {
  result: 'pass' | 'fail' | 'partial';
  notes?: string;
}

// ---------------------------------------------------------------------------
// Audit hash chain helper
// ---------------------------------------------------------------------------

async function computeEventHash(data: string, previousHash: string | null): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class RemediationService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    private tenantSchema?: string,
  ) {}

  // ── Plans CRUD ──────────────────────────────────────────────────────

  async listPlans(filters: PlanFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const page = filters.page ?? 1;
      const perPage = Math.min(filters.perPage ?? 25, 100);
      const offset = (page - 1) * perPage;
      const conditions = [];

      if (filters.status) {
        conditions.push(eq(remediationPlans.status, filters.status));
      }
      if (filters.search) {
        conditions.push(ilike(remediationPlans.name, `%${filters.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await tx
        .select()
        .from(remediationPlans)
        .where(whereClause)
        .orderBy(desc(remediationPlans.createdAt))
        .limit(perPage)
        .offset(offset);
      const totalResult = await tx
        .select({ count: count() })
        .from(remediationPlans)
        .where(whereClause);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          findingIds: p.findingIds,
          riskIds: p.riskIds,
          ownerId: p.ownerId,
          status: p.status,
          budgetEstimate: p.budgetEstimate,
          budgetActual: p.budgetActual,
          startDate: p.startDate,
          targetDate: p.targetDate,
          completedAt: p.completedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    });
  }

  async getPlan(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const [plan] = await tx
        .select()
        .from(remediationPlans)
        .where(eq(remediationPlans.id, id))
        .limit(1);

      if (!plan) {
        throw Object.assign(new Error('Remediation plan not found'), {
          statusCode: 404,
          code: 'PLAN_NOT_FOUND',
        });
      }

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        findingIds: plan.findingIds,
        riskIds: plan.riskIds,
        ownerId: plan.ownerId,
        status: plan.status,
        budgetEstimate: plan.budgetEstimate,
        budgetActual: plan.budgetActual,
        startDate: plan.startDate,
        targetDate: plan.targetDate,
        completedAt: plan.completedAt?.toISOString() ?? null,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      };
    });
  }

  async createPlan(data: CreatePlanInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const [newPlan] = await tx
        .insert(remediationPlans)
        .values({
          name: data.name,
          description: data.description ?? null,
          findingIds: data.findingIds ?? [],
          riskIds: data.riskIds ?? [],
          ownerId: data.ownerId ?? null,
          status: 'planned',
          budgetEstimate: data.budgetEstimate?.toString() ?? null,
          startDate: data.startDate ?? null,
          targetDate: data.targetDate ?? null,
        })
        .returning();

      if (!newPlan) {
        throw Object.assign(new Error('Failed to create remediation plan'), {
          statusCode: 500,
          code: 'PLAN_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.plan_created',
        entityType: 'remediation_plan',
        entityId: newPlan.id,
        action: 'create',
        details: { name: data.name },
      });

      return this.getPlanWithTx(tx, newPlan.id);
    });
  }

  async updatePlan(id: string, data: UpdatePlanInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getPlanWithTx(tx, id);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) updateData['name'] = data.name;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.findingIds !== undefined) updateData['findingIds'] = data.findingIds;
      if (data.riskIds !== undefined) updateData['riskIds'] = data.riskIds;
      if (data.ownerId !== undefined) updateData['ownerId'] = data.ownerId;
      if (data.status !== undefined) {
        updateData['status'] = data.status;
        if (data.status === 'completed') {
          updateData['completedAt'] = new Date();
        }
      }
      if (data.budgetEstimate !== undefined)
        updateData['budgetEstimate'] = data.budgetEstimate.toString();
      if (data.budgetActual !== undefined)
        updateData['budgetActual'] = data.budgetActual.toString();
      if (data.startDate !== undefined) updateData['startDate'] = data.startDate;
      if (data.targetDate !== undefined) updateData['targetDate'] = data.targetDate;

      await tx.update(remediationPlans).set(updateData).where(eq(remediationPlans.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.plan_updated',
        entityType: 'remediation_plan',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return this.getPlanWithTx(tx, id);
    });
  }

  async deletePlan(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getPlanWithTx(tx, id);

      await tx.delete(remediationPlans).where(eq(remediationPlans.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.plan_deleted',
        entityType: 'remediation_plan',
        entityId: id,
        action: 'delete',
        details: {},
      });
    });
  }

  // ── Actions CRUD ────────────────────────────────────────────────────

  async listActions(filters: ActionFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const page = filters.page ?? 1;
      const perPage = Math.min(filters.perPage ?? 25, 100);
      const offset = (page - 1) * perPage;
      const conditions = [];

      if (filters.planId) {
        conditions.push(eq(remediationActions.planId, filters.planId));
      }
      if (filters.status) {
        conditions.push(eq(remediationActions.status, filters.status));
      }
      if (filters.assigneeId) {
        conditions.push(eq(remediationActions.assigneeId, filters.assigneeId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await tx
        .select()
        .from(remediationActions)
        .where(whereClause)
        .orderBy(desc(remediationActions.createdAt))
        .limit(perPage)
        .offset(offset);
      const totalResult = await tx
        .select({ count: count() })
        .from(remediationActions)
        .where(whereClause);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((a) => ({
          id: a.id,
          planId: a.planId,
          title: a.title,
          description: a.description,
          findingId: a.findingId,
          riskId: a.riskId,
          assigneeId: a.assigneeId,
          status: a.status,
          startDate: a.startDate,
          dueDate: a.dueDate,
          completedDate: a.completedDate,
          costEstimate: a.costEstimate,
          costActual: a.costActual,
          milestone: a.milestone,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    });
  }

  async getAction(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const [action] = await tx
        .select()
        .from(remediationActions)
        .where(eq(remediationActions.id, id))
        .limit(1);

      if (!action) {
        throw Object.assign(new Error('Remediation action not found'), {
          statusCode: 404,
          code: 'ACTION_NOT_FOUND',
        });
      }

      return {
        id: action.id,
        planId: action.planId,
        title: action.title,
        description: action.description,
        findingId: action.findingId,
        riskId: action.riskId,
        assigneeId: action.assigneeId,
        status: action.status,
        startDate: action.startDate,
        dueDate: action.dueDate,
        completedDate: action.completedDate,
        costEstimate: action.costEstimate,
        costActual: action.costActual,
        milestone: action.milestone,
        createdAt: action.createdAt.toISOString(),
        updatedAt: action.updatedAt.toISOString(),
      };
    });
  }

  async createAction(planId: string, data: CreateActionInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getPlanWithTx(tx, planId);

      const [newAction] = await tx
        .insert(remediationActions)
        .values({
          planId,
          title: data.title,
          description: data.description ?? null,
          findingId: data.findingId ?? null,
          riskId: data.riskId ?? null,
          assigneeId: data.assigneeId ?? null,
          status: 'planned',
          startDate: data.startDate ?? null,
          dueDate: data.dueDate ?? null,
          costEstimate: data.costEstimate?.toString() ?? null,
          milestone: data.milestone ?? null,
        })
        .returning();

      if (!newAction) {
        throw Object.assign(new Error('Failed to create remediation action'), {
          statusCode: 500,
          code: 'ACTION_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.action_created',
        entityType: 'remediation_action',
        entityId: newAction.id,
        action: 'create',
        details: { title: data.title, planId },
      });

      return this.getActionWithTx(tx, newAction.id);
    });
  }

  async updateAction(id: string, data: UpdateActionInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getActionWithTx(tx, id);

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.findingId !== undefined) updateData['findingId'] = data.findingId;
      if (data.riskId !== undefined) updateData['riskId'] = data.riskId;
      if (data.assigneeId !== undefined) updateData['assigneeId'] = data.assigneeId;
      if (data.status !== undefined) {
        updateData['status'] = data.status;
        if (data.status === 'completed') {
          updateData['completedDate'] =
            data.completedDate ?? new Date().toISOString().split('T')[0];
        }
      }
      if (data.startDate !== undefined) updateData['startDate'] = data.startDate;
      if (data.dueDate !== undefined) updateData['dueDate'] = data.dueDate;
      if (data.completedDate !== undefined) updateData['completedDate'] = data.completedDate;
      if (data.costEstimate !== undefined)
        updateData['costEstimate'] = data.costEstimate.toString();
      if (data.costActual !== undefined) updateData['costActual'] = data.costActual.toString();
      if (data.milestone !== undefined) updateData['milestone'] = data.milestone;

      await tx.update(remediationActions).set(updateData).where(eq(remediationActions.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.action_updated',
        entityType: 'remediation_action',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return this.getActionWithTx(tx, id);
    });
  }

  async deleteAction(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getActionWithTx(tx, id);

      await tx.delete(remediationActions).where(eq(remediationActions.id, id));

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.action_deleted',
        entityType: 'remediation_action',
        entityId: id,
        action: 'delete',
        details: {},
      });
    });
  }

  // ── Verifications ───────────────────────────────────────────────────

  async listVerifications(actionId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getActionWithTx(tx, actionId);

      const items = await tx
        .select()
        .from(verifications)
        .where(eq(verifications.actionId, actionId))
        .orderBy(desc(verifications.createdAt));

      return items.map((v) => ({
        id: v.id,
        actionId: v.actionId,
        verifiedBy: v.verifiedBy,
        verificationDate: v.verificationDate?.toISOString() ?? null,
        result: v.result,
        notes: v.notes,
        createdAt: v.createdAt.toISOString(),
      }));
    });
  }

  async verifyAction(actionId: string, data: VerifyActionInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      await this.getActionWithTx(tx, actionId);

      const [newVerification] = await tx
        .insert(verifications)
        .values({
          actionId,
          verifiedBy: userId,
          verificationDate: new Date(),
          result: data.result,
          notes: data.notes ?? null,
        })
        .returning();

      if (!newVerification) {
        throw Object.assign(new Error('Failed to create verification'), {
          statusCode: 500,
          code: 'VERIFICATION_CREATE_FAILED',
        });
      }

      await this.createAuditEvent(tx, {
        userId,
        eventType: 'remediation.action_verified',
        entityType: 'remediation_action',
        entityId: actionId,
        action: 'update',
        details: { result: data.result, verificationId: newVerification.id },
      });

      return {
        id: newVerification.id,
        actionId: newVerification.actionId,
        verifiedBy: newVerification.verifiedBy,
        verificationDate: newVerification.verificationDate?.toISOString() ?? null,
        result: newVerification.result,
        notes: newVerification.notes,
        createdAt: newVerification.createdAt.toISOString(),
      };
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async getPlanWithTx(db: DbOrTx, id: string) {
    const [plan] = await db
      .select()
      .from(remediationPlans)
      .where(eq(remediationPlans.id, id))
      .limit(1);

    if (!plan) {
      throw Object.assign(new Error('Remediation plan not found'), {
        statusCode: 404,
        code: 'PLAN_NOT_FOUND',
      });
    }

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      findingIds: plan.findingIds,
      riskIds: plan.riskIds,
      ownerId: plan.ownerId,
      status: plan.status,
      budgetEstimate: plan.budgetEstimate,
      budgetActual: plan.budgetActual,
      startDate: plan.startDate,
      targetDate: plan.targetDate,
      completedAt: plan.completedAt?.toISOString() ?? null,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  private async getActionWithTx(db: DbOrTx, id: string) {
    const [action] = await db
      .select()
      .from(remediationActions)
      .where(eq(remediationActions.id, id))
      .limit(1);

    if (!action) {
      throw Object.assign(new Error('Remediation action not found'), {
        statusCode: 404,
        code: 'ACTION_NOT_FOUND',
      });
    }

    return {
      id: action.id,
      planId: action.planId,
      title: action.title,
      description: action.description,
      findingId: action.findingId,
      riskId: action.riskId,
      assigneeId: action.assigneeId,
      status: action.status,
      startDate: action.startDate,
      dueDate: action.dueDate,
      completedDate: action.completedDate,
      costEstimate: action.costEstimate,
      costActual: action.costActual,
      milestone: action.milestone,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
    };
  }

  private async createAuditEvent(
    db: DbOrTx,
    params: {
      userId: string;
      eventType: string;
      entityType: string;
      entityId: string;
      action: 'create' | 'update' | 'delete' | 'read';
      details: Record<string, unknown>;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ): Promise<void> {
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
