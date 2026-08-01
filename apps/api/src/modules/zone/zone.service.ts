import { eq, and, desc, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  zones,
  conduits,
  memberships,
  segmentationRules,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ZoneFilters {
  zoneType?: string;
  securityLevel?: number;
  parentZoneId?: string;
  facilityId?: string;
  purdueLevel?: number;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ConduitFilters {
  sourceZoneId?: string;
  targetZoneId?: string;
  conduitType?: string;
  securityLevel?: number;
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

export interface CreateZoneInput {
  name: string;
  description?: string;
  zoneType?: string;
  securityLevel?: number;
  parentZoneId?: string;
  purdueLevel?: number;
  facilityId?: string;
  diagramX?: number;
  diagramY?: number;
  diagramWidth?: number;
  diagramHeight?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateZoneInput {
  name?: string;
  description?: string;
  zoneType?: string;
  securityLevel?: number;
  parentZoneId?: string | null;
  purdueLevel?: number;
  facilityId?: string | null;
  diagramX?: number | null;
  diagramY?: number | null;
  diagramWidth?: number | null;
  diagramHeight?: number | null;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateConduitInput {
  name: string;
  description?: string;
  sourceZoneId: string;
  targetZoneId: string;
  conduitType: string;
  protocol?: string;
  securityLevel?: number;
  encryption?: boolean;
  authentication?: boolean;
  monitoring?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateConduitInput {
  name?: string;
  description?: string;
  conduitType?: string;
  protocol?: string;
  securityLevel?: number;
  encryption?: boolean;
  authentication?: boolean;
  monitoring?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AddMembershipInput {
  assetId: string;
}

export interface CreateSegmentationRuleInput {
  ruleType: string;
  description?: string;
  direction?: string;
  action?: string;
  isCompliant?: boolean;
  conduitId?: string;
}

export interface TopologyUpdateInput {
  zones: Array<{
    id: string;
    diagramX?: number;
    diagramY?: number;
    diagramWidth?: number;
    diagramHeight?: number;
  }>;
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

export class ZoneService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    tenantSchema?: string,
  ) {
    void tenantSchema;
  }

  // ── Zones CRUD ──────────────────────────────────────────────────────

  async listZones(filters: ZoneFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.zoneType) {
      conditions.push(eq(zones.zoneType, filters.zoneType));
    }

    if (filters.securityLevel !== undefined) {
      conditions.push(eq(zones.securityLevel, filters.securityLevel));
    }

    if (filters.parentZoneId) {
      conditions.push(eq(zones.parentZoneId, filters.parentZoneId));
    }

    if (filters.facilityId) {
      conditions.push(eq(zones.facilityId, filters.facilityId));
    }

    if (filters.purdueLevel !== undefined) {
      conditions.push(eq(zones.purdueLevel, filters.purdueLevel));
    }

    if (filters.search) {
      conditions.push(ilike(zones.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(zones)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const data = await this.db
      .select()
      .from(zones)
      .where(whereClause)
      .orderBy(desc(zones.createdAt))
      .limit(perPage)
      .offset(offset);

    return { data, pagination: { page, perPage, total, totalPages } as Pagination };
  }

  async getZone(id: string) {
    const [zone] = await this.db
      .select()
      .from(zones)
      .where(eq(zones.id, id))
      .limit(1);

    if (!zone) {
      throw Object.assign(new Error('Zone not found'), {
        statusCode: 404,
        code: 'ZONE_NOT_FOUND',
      });
    }

    return zone;
  }

  async createZone(data: CreateZoneInput, userId: string) {
    const [newZone] = await this.db
      .insert(zones)
      .values({
        name: data.name,
        description: data.description ?? null,
        zoneType: data.zoneType ?? null,
        securityLevel: data.securityLevel ?? null,
        parentZoneId: data.parentZoneId ?? null,
        purdueLevel: data.purdueLevel ?? null,
        facilityId: data.facilityId ?? null,
        diagramX: data.diagramX?.toString() ?? null,
        diagramY: data.diagramY?.toString() ?? null,
        diagramWidth: data.diagramWidth?.toString() ?? null,
        diagramHeight: data.diagramHeight?.toString() ?? null,
        color: data.color ?? null,
        metadata: data.metadata ?? {},
      })
      .returning();

    if (!newZone) {
      throw Object.assign(new Error('Failed to create zone'), {
        statusCode: 500,
        code: 'ZONE_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.created',
      entityType: 'zone',
      entityId: newZone.id,
      action: 'create',
      details: { name: data.name },
    });

    return newZone;
  }

  async updateZone(id: string, data: UpdateZoneInput, userId: string) {
    await this.getZone(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.zoneType !== undefined) updateData['zoneType'] = data.zoneType;
    if (data.securityLevel !== undefined) updateData['securityLevel'] = data.securityLevel;
    if (data.parentZoneId !== undefined) updateData['parentZoneId'] = data.parentZoneId;
    if (data.purdueLevel !== undefined) updateData['purdueLevel'] = data.purdueLevel;
    if (data.facilityId !== undefined) updateData['facilityId'] = data.facilityId;
    if (data.diagramX !== undefined) updateData['diagramX'] = data.diagramX?.toString() ?? null;
    if (data.diagramY !== undefined) updateData['diagramY'] = data.diagramY?.toString() ?? null;
    if (data.diagramWidth !== undefined) updateData['diagramWidth'] = data.diagramWidth?.toString() ?? null;
    if (data.diagramHeight !== undefined) updateData['diagramHeight'] = data.diagramHeight?.toString() ?? null;
    if (data.color !== undefined) updateData['color'] = data.color;
    if (data.metadata !== undefined) updateData['metadata'] = data.metadata;

    const [updated] = await this.db
      .update(zones)
      .set(updateData)
      .where(eq(zones.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update zone'), {
        statusCode: 500,
        code: 'ZONE_UPDATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.updated',
      entityType: 'zone',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteZone(id: string, userId: string) {
    await this.getZone(id);

    await this.db.delete(zones).where(eq(zones.id, id));

    await this.createAuditEvent({
      userId,
      eventType: 'zone.deleted',
      entityType: 'zone',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── Conduits CRUD ───────────────────────────────────────────────────

  async listConduits(filters: ConduitFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.sourceZoneId) {
      conditions.push(eq(conduits.sourceZoneId, filters.sourceZoneId));
    }

    if (filters.targetZoneId) {
      conditions.push(eq(conduits.targetZoneId, filters.targetZoneId));
    }

    if (filters.conduitType) {
      conditions.push(eq(conduits.conduitType, filters.conduitType));
    }

    if (filters.securityLevel !== undefined) {
      conditions.push(eq(conduits.securityLevel, filters.securityLevel));
    }

    if (filters.search) {
      conditions.push(ilike(conduits.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(conduits)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const data = await this.db
      .select()
      .from(conduits)
      .where(whereClause)
      .orderBy(desc(conduits.createdAt))
      .limit(perPage)
      .offset(offset);

    return { data, pagination: { page, perPage, total, totalPages } as Pagination };
  }

  async getConduit(id: string) {
    const [conduit] = await this.db
      .select()
      .from(conduits)
      .where(eq(conduits.id, id))
      .limit(1);

    if (!conduit) {
      throw Object.assign(new Error('Conduit not found'), {
        statusCode: 404,
        code: 'CONDUIT_NOT_FOUND',
      });
    }

    return conduit;
  }

  async createConduit(data: CreateConduitInput, userId: string) {
    const [newConduit] = await this.db
      .insert(conduits)
      .values({
        name: data.name,
        description: data.description ?? null,
        sourceZoneId: data.sourceZoneId,
        targetZoneId: data.targetZoneId,
        conduitType: data.conduitType,
        protocol: data.protocol ?? null,
        securityLevel: data.securityLevel ?? null,
        encryption: data.encryption ?? false,
        authentication: data.authentication ?? false,
        monitoring: data.monitoring ?? false,
        metadata: data.metadata ?? {},
      })
      .returning();

    if (!newConduit) {
      throw Object.assign(new Error('Failed to create conduit'), {
        statusCode: 500,
        code: 'CONDUIT_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.conduit_created',
      entityType: 'conduit',
      entityId: newConduit.id,
      action: 'create',
      details: { name: data.name, sourceZoneId: data.sourceZoneId, targetZoneId: data.targetZoneId },
    });

    return newConduit;
  }

  async updateConduit(id: string, data: UpdateConduitInput, userId: string) {
    await this.getConduit(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.conduitType !== undefined) updateData['conduitType'] = data.conduitType;
    if (data.protocol !== undefined) updateData['protocol'] = data.protocol;
    if (data.securityLevel !== undefined) updateData['securityLevel'] = data.securityLevel;
    if (data.encryption !== undefined) updateData['encryption'] = data.encryption;
    if (data.authentication !== undefined) updateData['authentication'] = data.authentication;
    if (data.monitoring !== undefined) updateData['monitoring'] = data.monitoring;
    if (data.metadata !== undefined) updateData['metadata'] = data.metadata;

    const [updated] = await this.db
      .update(conduits)
      .set(updateData)
      .where(eq(conduits.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update conduit'), {
        statusCode: 500,
        code: 'CONDUIT_UPDATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.conduit_updated',
      entityType: 'conduit',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteConduit(id: string, userId: string) {
    await this.getConduit(id);

    await this.db.delete(conduits).where(eq(conduits.id, id));

    await this.createAuditEvent({
      userId,
      eventType: 'zone.conduit_deleted',
      entityType: 'conduit',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── Memberships ─────────────────────────────────────────────────────

  async listMemberships(zoneId: string) {
    await this.getZone(zoneId);

    return this.db
      .select()
      .from(memberships)
      .where(eq(memberships.zoneId, zoneId))
      .orderBy(desc(memberships.assignedAt));
  }

  async addMembership(zoneId: string, data: AddMembershipInput, userId: string) {
    await this.getZone(zoneId);

    const [newMembership] = await this.db
      .insert(memberships)
      .values({
        zoneId,
        assetId: data.assetId,
        assignedBy: userId,
      })
      .returning();

    if (!newMembership) {
      throw Object.assign(new Error('Failed to add zone membership'), {
        statusCode: 500,
        code: 'MEMBERSHIP_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.membership_added',
      entityType: 'zone',
      entityId: zoneId,
      action: 'update',
      details: { assetId: data.assetId },
    });

    return newMembership;
  }

  async removeMembership(zoneId: string, assetId: string, userId: string) {
    await this.getZone(zoneId);

    await this.db
      .delete(memberships)
      .where(and(eq(memberships.zoneId, zoneId), eq(memberships.assetId, assetId)));

    await this.createAuditEvent({
      userId,
      eventType: 'zone.membership_removed',
      entityType: 'zone',
      entityId: zoneId,
      action: 'update',
      details: { assetId },
    });
  }

  // ── Segmentation Rules ──────────────────────────────────────────────

  async listRules(zoneId: string) {
    await this.getZone(zoneId);

    return this.db
      .select()
      .from(segmentationRules)
      .where(eq(segmentationRules.zoneId, zoneId))
      .orderBy(desc(segmentationRules.createdAt));
  }

  async createRule(zoneId: string, data: CreateSegmentationRuleInput, userId: string) {
    await this.getZone(zoneId);

    const [newRule] = await this.db
      .insert(segmentationRules)
      .values({
        conduitId: data.conduitId ?? null,
        zoneId,
        ruleType: data.ruleType,
        description: data.description ?? null,
        direction: data.direction ?? null,
        action: data.action ?? null,
        isCompliant: data.isCompliant ?? true,
      })
      .returning();

    if (!newRule) {
      throw Object.assign(new Error('Failed to create segmentation rule'), {
        statusCode: 500,
        code: 'RULE_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'zone.segmentation_rule_created',
      entityType: 'segmentation_rule',
      entityId: newRule.id,
      action: 'create',
      details: { zoneId, ruleType: data.ruleType },
    });

    return newRule;
  }

  async deleteRule(ruleId: string, userId: string) {
    const [rule] = await this.db
      .select()
      .from(segmentationRules)
      .where(eq(segmentationRules.id, ruleId))
      .limit(1);

    if (!rule) {
      throw Object.assign(new Error('Segmentation rule not found'), {
        statusCode: 404,
        code: 'RULE_NOT_FOUND',
      });
    }

    await this.db
      .delete(segmentationRules)
      .where(eq(segmentationRules.id, ruleId));

    await this.createAuditEvent({
      userId,
      eventType: 'zone.segmentation_rule_deleted',
      entityType: 'segmentation_rule',
      entityId: ruleId,
      action: 'delete',
      details: { zoneId: rule.zoneId },
    });
  }

  // ── Topology ────────────────────────────────────────────────────────

  async getTopology() {
    const allZones = await this.db
      .select()
      .from(zones)
      .orderBy(desc(zones.createdAt));

    const allConduits = await this.db
      .select()
      .from(conduits)
      .orderBy(desc(conduits.createdAt));

    const allMemberships = await this.db
      .select()
      .from(memberships)
      .orderBy(desc(memberships.assignedAt));

    return { zones: allZones, conduits: allConduits, memberships: allMemberships };
  }

  async updateTopology(data: TopologyUpdateInput) {
    for (const zoneUpdate of data.zones) {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (zoneUpdate.diagramX !== undefined) updateData['diagramX'] = zoneUpdate.diagramX.toString();
      if (zoneUpdate.diagramY !== undefined) updateData['diagramY'] = zoneUpdate.diagramY.toString();
      if (zoneUpdate.diagramWidth !== undefined) updateData['diagramWidth'] = zoneUpdate.diagramWidth.toString();
      if (zoneUpdate.diagramHeight !== undefined) updateData['diagramHeight'] = zoneUpdate.diagramHeight.toString();

      await this.db
        .update(zones)
        .set(updateData)
        .where(eq(zones.id, zoneUpdate.id));
    }

    return this.getTopology();
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
