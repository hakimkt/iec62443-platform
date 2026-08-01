import { eq, and, desc, sql, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  purdueModels,
  purdueLevels,
  assetMappings,
  communicationRules,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PurdueModelFilters {
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

export interface CreatePurdueModelInput {
  name: string;
  facilityId?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdatePurdueModelInput {
  name?: string;
  facilityId?: string;
  description?: string;
  isDefault?: boolean;
}

export interface CreateLevelInput {
  levelNumber: number;
  name: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateLevelInput {
  levelNumber?: number;
  name?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}

export interface AssetMappingInput {
  assetId: string;
  levelId: string;
}

export interface CommunicationRuleInput {
  sourceLevelId: string;
  targetLevelId: string;
  isAllowed?: boolean;
  condition?: string;
  protocol?: string;
}

export interface ComplianceViolation {
  ruleId: string;
  sourceLevel: string;
  targetLevel: string;
  assetName: string;
  protocol: string | null;
  condition: string | null;
}

export interface ComplianceResult {
  modelId: string;
  violations: ComplianceViolation[];
  compliantCount: number;
  violationCount: number;
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

export class PurdueService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  // ── Models CRUD ─────────────────────────────────────────────────────

  async listModels(filters: PurdueModelFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.search) {
      conditions.push(ilike(purdueModels.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(purdueModels)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const data = await this.db
      .select()
      .from(purdueModels)
      .where(whereClause)
      .orderBy(desc(purdueModels.createdAt))
      .limit(perPage)
      .offset(offset);

    return { data, pagination: { page, perPage, total, totalPages } as Pagination };
  }

  async getModel(id: string) {
    const [model] = await this.db
      .select()
      .from(purdueModels)
      .where(eq(purdueModels.id, id))
      .limit(1);

    if (!model) {
      throw Object.assign(new Error('Purdue model not found'), {
        statusCode: 404,
        code: 'PURDUE_MODEL_NOT_FOUND',
      });
    }

    return model;
  }

  async createModel(data: CreatePurdueModelInput, userId: string) {
    const [newModel] = await this.db
      .insert(purdueModels)
      .values({
        name: data.name,
        facilityId: data.facilityId ?? null,
        description: data.description ?? null,
        isDefault: data.isDefault ?? false,
      })
      .returning();

    if (!newModel) {
      throw Object.assign(new Error('Failed to create Purdue model'), {
        statusCode: 500,
        code: 'PURDUE_MODEL_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.model_created',
      entityType: 'purdue_model',
      entityId: newModel.id,
      action: 'create',
      details: { name: data.name },
    });

    return newModel;
  }

  async updateModel(id: string, data: UpdatePurdueModelInput, userId: string) {
    await this.getModel(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.facilityId !== undefined) updateData['facilityId'] = data.facilityId;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.isDefault !== undefined) updateData['isDefault'] = data.isDefault;

    const [updated] = await this.db
      .update(purdueModels)
      .set(updateData)
      .where(eq(purdueModels.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update Purdue model'), {
        statusCode: 500,
        code: 'PURDUE_MODEL_UPDATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.model_updated',
      entityType: 'purdue_model',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteModel(id: string, userId: string) {
    await this.getModel(id);

    // Delete related records first
    await this.db.delete(communicationRules).where(eq(communicationRules.modelId, id));
    await this.db.delete(assetMappings).where(eq(assetMappings.modelId, id));
    await this.db.delete(purdueLevels).where(eq(purdueLevels.modelId, id));
    await this.db.delete(purdueModels).where(eq(purdueModels.id, id));

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.model_deleted',
      entityType: 'purdue_model',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── Levels ──────────────────────────────────────────────────────────

  async listLevels(modelId: string) {
    await this.getModel(modelId);

    return this.db
      .select()
      .from(purdueLevels)
      .where(eq(purdueLevels.modelId, modelId))
      .orderBy(purdueLevels.sortOrder);
  }

  async createLevel(modelId: string, data: CreateLevelInput, userId: string) {
    await this.getModel(modelId);

    const [newLevel] = await this.db
      .insert(purdueLevels)
      .values({
        modelId,
        levelNumber: data.levelNumber.toString(),
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    if (!newLevel) {
      throw Object.assign(new Error('Failed to create Purdue level'), {
        statusCode: 500,
        code: 'PURDUE_LEVEL_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.level_created',
      entityType: 'purdue_model',
      entityId: modelId,
      action: 'update',
      details: { levelId: newLevel.id, name: data.name },
    });

    return newLevel;
  }

  async updateLevel(levelId: string, data: UpdateLevelInput, userId: string) {
    const updateData: Record<string, unknown> = {};
    if (data.levelNumber !== undefined) updateData['levelNumber'] = data.levelNumber.toString();
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.color !== undefined) updateData['color'] = data.color;
    if (data.sortOrder !== undefined) updateData['sortOrder'] = data.sortOrder;

    const [updated] = await this.db
      .update(purdueLevels)
      .set(updateData)
      .where(eq(purdueLevels.id, levelId))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Purdue level not found'), {
        statusCode: 404,
        code: 'PURDUE_LEVEL_NOT_FOUND',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.level_updated',
      entityType: 'purdue_model',
      entityId: updated.modelId,
      action: 'update',
      details: { levelId, updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteLevel(levelId: string, userId: string) {
    const [level] = await this.db
      .select()
      .from(purdueLevels)
      .where(eq(purdueLevels.id, levelId))
      .limit(1);

    if (!level) {
      throw Object.assign(new Error('Purdue level not found'), {
        statusCode: 404,
        code: 'PURDUE_LEVEL_NOT_FOUND',
      });
    }

    // Delete related mappings and rules
    await this.db.delete(assetMappings).where(eq(assetMappings.levelId, levelId));
    await this.db.delete(communicationRules).where(
      sql`${communicationRules.sourceLevelId} = ${levelId} OR ${communicationRules.targetLevelId} = ${levelId}`,
    );
    await this.db.delete(purdueLevels).where(eq(purdueLevels.id, levelId));

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.level_deleted',
      entityType: 'purdue_model',
      entityId: level.modelId,
      action: 'update',
      details: { levelId },
    });
  }

  // ── Asset Mappings ──────────────────────────────────────────────────

  async listMappings(modelId: string) {
    await this.getModel(modelId);

    return this.db
      .select()
      .from(assetMappings)
      .where(eq(assetMappings.modelId, modelId))
      .orderBy(assetMappings.assignedAt);
  }

  async addMapping(modelId: string, data: AssetMappingInput, userId: string) {
    await this.getModel(modelId);

    const [newMapping] = await this.db
      .insert(assetMappings)
      .values({
        modelId,
        assetId: data.assetId,
        levelId: data.levelId,
        assignedBy: userId,
      })
      .returning();

    if (!newMapping) {
      throw Object.assign(new Error('Failed to create asset mapping'), {
        statusCode: 500,
        code: 'PURDUE_MAPPING_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.asset_mapped',
      entityType: 'purdue_model',
      entityId: modelId,
      action: 'update',
      details: { assetId: data.assetId, levelId: data.levelId },
    });

    return newMapping;
  }

  async removeMapping(modelId: string, assetId: string, userId: string) {
    await this.getModel(modelId);

    await this.db
      .delete(assetMappings)
      .where(
        and(
          eq(assetMappings.modelId, modelId),
          eq(assetMappings.assetId, assetId),
        ),
      );

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.asset_unmapped',
      entityType: 'purdue_model',
      entityId: modelId,
      action: 'update',
      details: { assetId },
    });
  }

  // ── Communication Rules ─────────────────────────────────────────────

  async listRules(modelId: string) {
    await this.getModel(modelId);

    return this.db
      .select()
      .from(communicationRules)
      .where(eq(communicationRules.modelId, modelId))
      .orderBy(communicationRules.createdAt);
  }

  async createRule(modelId: string, data: CommunicationRuleInput, userId: string) {
    await this.getModel(modelId);

    const [newRule] = await this.db
      .insert(communicationRules)
      .values({
        modelId,
        sourceLevelId: data.sourceLevelId,
        targetLevelId: data.targetLevelId,
        isAllowed: data.isAllowed ?? false,
        condition: data.condition ?? null,
        protocol: data.protocol ?? null,
      })
      .returning();

    if (!newRule) {
      throw Object.assign(new Error('Failed to create communication rule'), {
        statusCode: 500,
        code: 'PURDUE_RULE_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.rule_created',
      entityType: 'purdue_model',
      entityId: modelId,
      action: 'update',
      details: { ruleId: newRule.id, sourceLevelId: data.sourceLevelId, targetLevelId: data.targetLevelId },
    });

    return newRule;
  }

  async updateRule(ruleId: string, data: Partial<CommunicationRuleInput>, userId: string) {
    const updateData: Record<string, unknown> = {};
    if (data.sourceLevelId !== undefined) updateData['sourceLevelId'] = data.sourceLevelId;
    if (data.targetLevelId !== undefined) updateData['targetLevelId'] = data.targetLevelId;
    if (data.isAllowed !== undefined) updateData['isAllowed'] = data.isAllowed;
    if (data.condition !== undefined) updateData['condition'] = data.condition;
    if (data.protocol !== undefined) updateData['protocol'] = data.protocol;

    const [updated] = await this.db
      .update(communicationRules)
      .set(updateData)
      .where(eq(communicationRules.id, ruleId))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Communication rule not found'), {
        statusCode: 404,
        code: 'PURDUE_RULE_NOT_FOUND',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.rule_updated',
      entityType: 'purdue_model',
      entityId: updated.modelId,
      action: 'update',
      details: { ruleId, updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteRule(ruleId: string, userId: string) {
    const [rule] = await this.db
      .select()
      .from(communicationRules)
      .where(eq(communicationRules.id, ruleId))
      .limit(1);

    if (!rule) {
      throw Object.assign(new Error('Communication rule not found'), {
        statusCode: 404,
        code: 'PURDUE_RULE_NOT_FOUND',
      });
    }

    await this.db
      .delete(communicationRules)
      .where(eq(communicationRules.id, ruleId));

    await this.createAuditEvent({
      userId,
      eventType: 'purdue.rule_deleted',
      entityType: 'purdue_model',
      entityId: rule.modelId,
      action: 'update',
      details: { ruleId },
    });
  }

  // ── Compliance ──────────────────────────────────────────────────────

  async getCompliance(modelId: string): Promise<ComplianceResult> {
    await this.getModel(modelId);

    const rules = await this.db
      .select()
      .from(communicationRules)
      .where(eq(communicationRules.modelId, modelId));

    const violations: ComplianceViolation[] = [];
    let compliantCount = 0;

    for (const rule of rules) {
      if (!rule.isAllowed) {
        // This is a denied rule — check if any actual communications violate it
        // For now, we just count denied rules as potential violations
        // In a real implementation, we'd cross-reference with actual conduit data
        violations.push({
          ruleId: rule.id,
          sourceLevel: rule.sourceLevelId,
          targetLevel: rule.targetLevelId,
          assetName: 'Unknown',
          protocol: rule.protocol,
          condition: rule.condition,
        });
      } else {
        compliantCount++;
      }
    }

    return {
      modelId,
      violations,
      compliantCount,
      violationCount: violations.length,
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
