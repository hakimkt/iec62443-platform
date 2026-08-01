import { eq, and, desc, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  registers,
  entries,
  treatments,
  acceptances,
  matrixConfig,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskFilters {
  registerId?: string;
  category?: string;
  riskLevel?: string;
  treatment?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sort?: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CreateRegisterInput {
  name: string;
  scopeType?: string;
  scopeId?: string;
  ownerId?: string;
}

export interface UpdateRegisterInput {
  name?: string;
  scopeType?: string;
  scopeId?: string;
  ownerId?: string;
  status?: string;
}

export interface CreateRiskInput {
  registerId: string;
  title: string;
  description?: string;
  category?: string;
  threatSource?: string;
  vulnerability?: string;
  assetIds?: string[];
  zoneIds?: string[];
  likelihood?: number;
  impact?: number;
  treatment?: string;
  residualLikelihood?: number;
  residualImpact?: number;
  riskOwnerId?: string;
  iecRequirement?: string;
  reassessBy?: Date;
}

export interface UpdateRiskInput {
  title?: string;
  description?: string;
  category?: string;
  threatSource?: string;
  vulnerability?: string;
  assetIds?: string[];
  zoneIds?: string[];
  likelihood?: number;
  impact?: number;
  treatment?: string;
  residualLikelihood?: number;
  residualImpact?: number;
  riskOwnerId?: string;
  iecRequirement?: string;
  status?: string;
  reassessBy?: Date;
}

export interface CreateTreatmentInput {
  type: string;
  description: string;
  responsibleId?: string;
  targetDate?: Date;
  costEstimate?: number;
}

export interface RiskAcceptanceInput {
  justification: string;
  expiresAt?: Date;
  reviewDate?: Date;
}

export interface HeatMapCell {
  likelihood: number;
  impact: number;
  count: number;
  riskLevel: string;
}

export interface RiskStats {
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
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

export class RiskService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  // ── Registers CRUD ──────────────────────────────────────────────────

  async listRegisters(filters: { page?: number; perPage?: number; search?: string; status?: string }) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.search) {
      conditions.push(ilike(registers.name, `%${filters.search}%`));
    }

    if (filters.status) {
      conditions.push(eq(registers.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(registers)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const data = await this.db
      .select()
      .from(registers)
      .where(whereClause)
      .orderBy(desc(registers.createdAt))
      .limit(perPage)
      .offset(offset);

    return { data, pagination: { page, perPage, total, totalPages } as Pagination };
  }

  async getRegister(id: string) {
    const [register] = await this.db
      .select()
      .from(registers)
      .where(eq(registers.id, id))
      .limit(1);

    if (!register) {
      throw Object.assign(new Error('Risk register not found'), {
        statusCode: 404,
        code: 'REGISTER_NOT_FOUND',
      });
    }

    return register;
  }

  async createRegister(data: CreateRegisterInput, userId: string) {
    const [newRegister] = await this.db
      .insert(registers)
      .values({
        name: data.name,
        scopeType: data.scopeType ?? null,
        scopeId: data.scopeId ?? null,
        ownerId: data.ownerId ?? null,
        status: 'active',
      })
      .returning();

    if (!newRegister) {
      throw Object.assign(new Error('Failed to create register'), {
        statusCode: 500,
        code: 'REGISTER_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.register_created',
      entityType: 'risk_register',
      entityId: newRegister.id,
      action: 'create',
      details: { name: data.name },
    });

    return newRegister;
  }

  async updateRegister(id: string, data: UpdateRegisterInput, userId: string) {
    await this.getRegister(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.scopeType !== undefined) updateData['scopeType'] = data.scopeType;
    if (data.scopeId !== undefined) updateData['scopeId'] = data.scopeId;
    if (data.ownerId !== undefined) updateData['ownerId'] = data.ownerId;
    if (data.status !== undefined) updateData['status'] = data.status;

    const [updated] = await this.db
      .update(registers)
      .set(updateData)
      .where(eq(registers.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update register'), {
        statusCode: 500,
        code: 'REGISTER_UPDATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.register_updated',
      entityType: 'risk_register',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteRegister(id: string, userId: string) {
    await this.getRegister(id);

    await this.db
      .update(registers)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(registers.id, id));

    await this.createAuditEvent({
      userId,
      eventType: 'risk.register_deleted',
      entityType: 'risk_register',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── Risk Entries CRUD ───────────────────────────────────────────────

  async listRisks(filters: RiskFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.registerId) {
      conditions.push(eq(entries.registerId, filters.registerId));
    }

    if (filters.category) {
      conditions.push(eq(entries.category, filters.category));
    }

    if (filters.riskLevel) {
      conditions.push(eq(entries.riskLevel, filters.riskLevel));
    }

    if (filters.treatment) {
      conditions.push(eq(entries.treatment, filters.treatment));
    }

    if (filters.status) {
      conditions.push(eq(entries.status, filters.status));
    }

    if (filters.search) {
      conditions.push(ilike(entries.title, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(entries)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const sort = filters.sort ?? 'date';
    let query;

    if (sort === 'date') {
      query = this.db
        .select()
        .from(entries)
        .where(whereClause)
        .orderBy(desc(entries.createdAt))
        .limit(perPage)
        .offset(offset);
    } else if (sort === 'score') {
      query = this.db
        .select()
        .from(entries)
        .where(whereClause)
        .orderBy(desc(entries.inherentScore))
        .limit(perPage)
        .offset(offset);
    } else {
      query = this.db
        .select()
        .from(entries)
        .where(whereClause)
        .orderBy(desc(entries.createdAt))
        .limit(perPage)
        .offset(offset);
    }

    const data = await query;

    return { data, pagination: { page, perPage, total, totalPages } as Pagination };
  }

  async getRisk(id: string) {
    const [risk] = await this.db
      .select()
      .from(entries)
      .where(eq(entries.id, id))
      .limit(1);

    if (!risk) {
      throw Object.assign(new Error('Risk entry not found'), {
        statusCode: 404,
        code: 'RISK_NOT_FOUND',
      });
    }

    return risk;
  }

  async createRisk(data: CreateRiskInput, userId: string) {
    const [newRisk] = await this.db
      .insert(entries)
      .values({
        registerId: data.registerId,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        threatSource: data.threatSource ?? null,
        vulnerability: data.vulnerability ?? null,
        assetIds: data.assetIds ?? [],
        zoneIds: data.zoneIds ?? [],
        likelihood: data.likelihood ?? null,
        impact: data.impact ?? null,
        treatment: data.treatment ?? null,
        residualLikelihood: data.residualLikelihood ?? null,
        residualImpact: data.residualImpact ?? null,
        riskOwnerId: data.riskOwnerId ?? null,
        iecRequirement: data.iecRequirement ?? null,
        status: 'identified',
        reassessBy: data.reassessBy ? data.reassessBy.toISOString().split('T')[0] : null,
      })
      .returning();

    if (!newRisk) {
      throw Object.assign(new Error('Failed to create risk entry'), {
        statusCode: 500,
        code: 'RISK_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.created',
      entityType: 'risk',
      entityId: newRisk.id,
      action: 'create',
      details: { title: data.title, registerId: data.registerId },
    });

    return newRisk;
  }

  async updateRisk(id: string, data: UpdateRiskInput, userId: string) {
    await this.getRisk(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateData['title'] = data.title;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.category !== undefined) updateData['category'] = data.category;
    if (data.threatSource !== undefined) updateData['threatSource'] = data.threatSource;
    if (data.vulnerability !== undefined) updateData['vulnerability'] = data.vulnerability;
    if (data.assetIds !== undefined) updateData['assetIds'] = data.assetIds;
    if (data.zoneIds !== undefined) updateData['zoneIds'] = data.zoneIds;
    if (data.likelihood !== undefined) updateData['likelihood'] = data.likelihood;
    if (data.impact !== undefined) updateData['impact'] = data.impact;
    if (data.treatment !== undefined) updateData['treatment'] = data.treatment;
    if (data.residualLikelihood !== undefined) updateData['residualLikelihood'] = data.residualLikelihood;
    if (data.residualImpact !== undefined) updateData['residualImpact'] = data.residualImpact;
    if (data.riskOwnerId !== undefined) updateData['riskOwnerId'] = data.riskOwnerId;
    if (data.iecRequirement !== undefined) updateData['iecRequirement'] = data.iecRequirement;
    if (data.status !== undefined) updateData['status'] = data.status;
    if (data.reassessBy !== undefined) updateData['reassessBy'] = data.reassessBy;

    const [updated] = await this.db
      .update(entries)
      .set(updateData)
      .where(eq(entries.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update risk entry'), {
        statusCode: 500,
        code: 'RISK_UPDATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.updated',
      entityType: 'risk',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteRisk(id: string, userId: string) {
    await this.getRisk(id);

    await this.db.delete(entries).where(eq(entries.id, id));

    await this.createAuditEvent({
      userId,
      eventType: 'risk.deleted',
      entityType: 'risk',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── Risk Stats ──────────────────────────────────────────────────────

  async getRiskStats(registerId?: string): Promise<RiskStats> {
    const whereClause = registerId
      ? eq(entries.registerId, registerId)
      : undefined;

    const categoryRows = await this.db
      .select({ category: entries.category, count: count() })
      .from(entries)
      .where(whereClause)
      .groupBy(entries.category);

    const byCategory: Record<string, number> = {};
    for (const row of categoryRows) {
      if (row.category !== null) {
        byCategory[row.category] = row.count;
      }
    }

    const levelRows = await this.db
      .select({ riskLevel: entries.riskLevel, count: count() })
      .from(entries)
      .where(whereClause)
      .groupBy(entries.riskLevel);

    const byLevel: Record<string, number> = {};
    for (const row of levelRows) {
      if (row.riskLevel !== null) {
        byLevel[row.riskLevel] = row.count;
      }
    }

    const statusRows = await this.db
      .select({ status: entries.status, count: count() })
      .from(entries)
      .where(whereClause)
      .groupBy(entries.status);

    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      if (row.status !== null) {
        byStatus[row.status] = row.count;
      }
    }

    const [totalResult] = await this.db
      .select({ total: count() })
      .from(entries)
      .where(whereClause);

    return {
      byCategory,
      byLevel,
      byStatus,
      total: totalResult?.total ?? 0,
    };
  }

  // ── Heat Map ────────────────────────────────────────────────────────

  async getHeatMap(registerId: string): Promise<HeatMapCell[]> {
    const rows = await this.db
      .select({
        likelihood: entries.likelihood,
        impact: entries.impact,
        riskLevel: entries.riskLevel,
        count: count(),
      })
      .from(entries)
      .where(eq(entries.registerId, registerId))
      .groupBy(entries.likelihood, entries.impact, entries.riskLevel);

    return rows
      .filter((r): r is typeof r & { likelihood: number; impact: number; riskLevel: string } =>
        r.likelihood !== null && r.impact !== null && r.riskLevel !== null,
      )
      .map((r) => ({
        likelihood: r.likelihood,
        impact: r.impact,
        count: r.count,
        riskLevel: r.riskLevel,
      }));
  }

  // ── Matrix Config ───────────────────────────────────────────────────

  async getMatrixConfig(registerId: string) {
    const [config] = await this.db
      .select()
      .from(matrixConfig)
      .where(eq(matrixConfig.registerId, registerId))
      .limit(1);

    if (!config) {
      // Return default matrix config
      return {
        id: null,
        registerId,
        likelihoodLabels: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
        impactLabels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
        thresholds: {
          low: { max: 4 },
          medium: { min: 5, max: 9 },
          high: { min: 10, max: 15 },
          critical: { min: 16 },
        },
        colorScheme: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
      };
    }

    return config;
  }

  async updateMatrixConfig(registerId: string, data: {
    likelihoodLabels?: string[];
    impactLabels?: string[];
    thresholds?: Record<string, unknown>;
    colorScheme?: Record<string, string>;
  }, userId: string) {
    // Check if config exists
    const [existing] = await this.db
      .select()
      .from(matrixConfig)
      .where(eq(matrixConfig.registerId, registerId))
      .limit(1);

    let result;

    if (existing) {
      const updateData: Record<string, unknown> = {};
      if (data.likelihoodLabels !== undefined) updateData['likelihoodLabels'] = data.likelihoodLabels;
      if (data.impactLabels !== undefined) updateData['impactLabels'] = data.impactLabels;
      if (data.thresholds !== undefined) updateData['thresholds'] = data.thresholds;
      if (data.colorScheme !== undefined) updateData['colorScheme'] = data.colorScheme;

      [result] = await this.db
        .update(matrixConfig)
        .set(updateData)
        .where(eq(matrixConfig.registerId, registerId))
        .returning();
    } else {
      [result] = await this.db
        .insert(matrixConfig)
        .values({
          registerId,
          likelihoodLabels: data.likelihoodLabels ?? ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
          impactLabels: data.impactLabels ?? ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
          thresholds: data.thresholds ?? {
            low: { max: 4 },
            medium: { min: 5, max: 9 },
            high: { min: 10, max: 15 },
            critical: { min: 16 },
          },
          colorScheme: data.colorScheme ?? {
            low: '#22c55e',
            medium: '#f59e0b',
            high: '#f97316',
            critical: '#ef4444',
          },
        })
        .returning();
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.matrix_config_updated',
      entityType: 'risk_register',
      entityId: registerId,
      action: 'update',
      details: {},
    });

    return result;
  }

  // ── Treatments ──────────────────────────────────────────────────────

  async listTreatments(riskId: string) {
    await this.getRisk(riskId);

    return this.db
      .select()
      .from(treatments)
      .where(eq(treatments.riskId, riskId))
      .orderBy(desc(treatments.createdAt));
  }

  async createTreatment(riskId: string, data: CreateTreatmentInput, userId: string) {
    await this.getRisk(riskId);

    const [newTreatment] = await this.db
      .insert(treatments)
      .values({
        riskId,
        type: data.type,
        description: data.description,
        responsibleId: data.responsibleId ?? null,
        targetDate: data.targetDate ? data.targetDate.toISOString().split('T')[0] : null,
        costEstimate: data.costEstimate?.toString() ?? null,
        status: 'planned',
      })
      .returning();

    if (!newTreatment) {
      throw Object.assign(new Error('Failed to create treatment'), {
        statusCode: 500,
        code: 'TREATMENT_CREATE_FAILED',
      });
    }

    // Update risk status to 'treated'
    await this.db
      .update(entries)
      .set({ treatment: 'mitigate', status: 'treated', updatedAt: new Date() })
      .where(eq(entries.id, riskId));

    await this.createAuditEvent({
      userId,
      eventType: 'risk.treatment_created',
      entityType: 'risk',
      entityId: riskId,
      action: 'update',
      details: { treatmentId: newTreatment.id, type: data.type },
    });

    return newTreatment;
  }

  async updateTreatment(riskId: string, treatmentId: string, data: {
    type?: string;
    description?: string;
    status?: string;
    responsibleId?: string;
    targetDate?: Date;
    costEstimate?: number;
    effectiveness?: string;
  }, userId: string) {
    await this.getRisk(riskId);

    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData['type'] = data.type;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.status !== undefined) updateData['status'] = data.status;
    if (data.responsibleId !== undefined) updateData['responsibleId'] = data.responsibleId;
    if (data.targetDate !== undefined) updateData['targetDate'] = data.targetDate;
    if (data.costEstimate !== undefined) updateData['costEstimate'] = data.costEstimate.toString();
    if (data.effectiveness !== undefined) updateData['effectiveness'] = data.effectiveness;

    const [updated] = await this.db
      .update(treatments)
      .set(updateData)
      .where(and(eq(treatments.id, treatmentId), eq(treatments.riskId, riskId)))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Treatment not found'), {
        statusCode: 404,
        code: 'TREATMENT_NOT_FOUND',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'risk.treatment_updated',
      entityType: 'risk',
      entityId: riskId,
      action: 'update',
      details: { treatmentId, updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteTreatment(riskId: string, treatmentId: string, userId: string) {
    await this.getRisk(riskId);

    await this.db
      .delete(treatments)
      .where(and(eq(treatments.id, treatmentId), eq(treatments.riskId, riskId)));

    await this.createAuditEvent({
      userId,
      eventType: 'risk.treatment_deleted',
      entityType: 'risk',
      entityId: riskId,
      action: 'update',
      details: { treatmentId },
    });
  }

  // ── Acceptances ─────────────────────────────────────────────────────

  async listAcceptances(riskId: string) {
    await this.getRisk(riskId);

    return this.db
      .select()
      .from(acceptances)
      .where(eq(acceptances.riskId, riskId))
      .orderBy(desc(acceptances.createdAt));
  }

  async createAcceptance(riskId: string, data: RiskAcceptanceInput, userId: string) {
    await this.getRisk(riskId);

    const [newAcceptance] = await this.db
      .insert(acceptances)
      .values({
        riskId,
        acceptedBy: userId,
        justification: data.justification,
        expiresAt: data.expiresAt ?? null,
        reviewDate: data.reviewDate ? data.reviewDate.toISOString().split('T')[0] : null,
      })
      .returning();

    if (!newAcceptance) {
      throw Object.assign(new Error('Failed to create risk acceptance'), {
        statusCode: 500,
        code: 'ACCEPTANCE_CREATE_FAILED',
      });
    }

    // Update risk status to 'accepted'
    await this.db
      .update(entries)
      .set({ treatment: 'accept', status: 'accepted', updatedAt: new Date() })
      .where(eq(entries.id, riskId));

    await this.createAuditEvent({
      userId,
      eventType: 'risk.acceptance_created',
      entityType: 'risk',
      entityId: riskId,
      action: 'update',
      details: { acceptanceId: newAcceptance.id },
    });

    return newAcceptance;
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
      const [lastEvent] = await this.db
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
      console.error('Failed to create audit event:', error);
    }
  }
}
