import { eq, and, desc, sql, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  assets,
  assetRelationships,
  importJobs,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssetFilters {
  type?: string;
  criticality?: string;
  operationalStatus?: string;
  purdueLevel?: string;
  zoneId?: string;
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

export interface CreateAssetInput {
  name: string;
  description?: string;
  type?: string;
  criticality?: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  ipAddress?: string;
  macAddress?: string;
  networkSegment?: string;
  purdueLevel?: number;
  zoneId?: string;
  location?: string;
  operationalStatus?: string;
  installDate?: Date;
  lastPatchDate?: Date;
  eolDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetInput {
  name?: string;
  description?: string;
  type?: string;
  criticality?: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  serialNumber?: string;
  ipAddress?: string;
  macAddress?: string;
  networkSegment?: string;
  purdueLevel?: number;
  zoneId?: string;
  location?: string;
  operationalStatus?: string;
  installDate?: Date;
  lastPatchDate?: Date;
  eolDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateRelationshipInput {
  targetAssetId: string;
  relationshipType: string;
  protocol?: string;
  metadata?: Record<string, unknown>;
}

export interface AssetStats {
  byType: Record<string, number>;
  byCriticality: Record<string, number>;
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

export class AssetService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  // ── Assets CRUD ──────────────────────────────────────────────────────

  async listAssets(filters: AssetFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    if (filters.type) {
      conditions.push(eq(assets.type, filters.type));
    }

    if (filters.criticality) {
      conditions.push(eq(assets.criticality, filters.criticality));
    }

    if (filters.operationalStatus) {
      conditions.push(eq(assets.operationalStatus, filters.operationalStatus));
    }

    if (filters.purdueLevel) {
      conditions.push(eq(assets.purdueLevel, Number(filters.purdueLevel)));
    }

    if (filters.zoneId) {
      conditions.push(eq(assets.zoneId, filters.zoneId));
    }

    if (filters.search) {
      conditions.push(ilike(assets.name, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await this.db
      .select({ total: count() })
      .from(assets)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Determine sort order
    const sort = filters.sort ?? 'name';
    let query;

    if (sort === 'name') {
      query = this.db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(assets.name)
        .limit(perPage)
        .offset(offset);
    } else if (sort === 'criticality') {
      query = this.db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(
          sql`CASE ${assets.criticality}
            WHEN 'safety_critical' THEN 0
            WHEN 'mission_critical' THEN 1
            WHEN 'business_critical' THEN 2
            WHEN 'operational' THEN 3
            WHEN 'non_critical' THEN 4
            ELSE 5 END`,
        )
        .limit(perPage)
        .offset(offset);
    } else if (sort === 'date') {
      query = this.db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(desc(assets.createdAt))
        .limit(perPage)
        .offset(offset);
    } else {
      query = this.db
        .select()
        .from(assets)
        .where(whereClause)
        .orderBy(assets.name)
        .limit(perPage)
        .offset(offset);
    }

    const data = await query;

    const pagination: Pagination = {
      page,
      perPage,
      total,
      totalPages,
    };

    return { data, pagination };
  }

  async getAsset(id: string) {
    const [asset] = await this.db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);

    if (!asset) {
      throw Object.assign(new Error('Asset not found'), {
        statusCode: 404,
        code: 'ASSET_NOT_FOUND',
      });
    }

    return asset;
  }

  async createAsset(data: CreateAssetInput, userId: string) {
    const insertData = {
      name: data.name,
      description: data.description ?? null,
      type: data.type ?? null,
      criticality: data.criticality ?? null,
      vendor: data.vendor ?? null,
      model: data.model ?? null,
      firmwareVersion: data.firmwareVersion ?? null,
      serialNumber: data.serialNumber ?? null,
      ipAddress: data.ipAddress ?? null,
      macAddress: data.macAddress ?? null,
      networkSegment: data.networkSegment ?? null,
      purdueLevel: data.purdueLevel ?? null,
      zoneId: data.zoneId ?? null,
      location: data.location ?? null,
      operationalStatus: data.operationalStatus ?? 'operational',
      installDate: data.installDate ?? null,
      lastPatchDate: data.lastPatchDate ?? null,
      eolDate: data.eolDate ?? null,
      metadata: data.metadata ?? {},
    };

    const [newAsset] = await this.db
      .insert(assets)
      .values(insertData)
      .returning();

    if (!newAsset) {
      throw Object.assign(new Error('Failed to create asset'), {
        statusCode: 500,
        code: 'ASSET_CREATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.created',
      entityType: 'asset',
      entityId: newAsset.id,
      action: 'create',
      details: { name: data.name, type: data.type, criticality: data.criticality },
    });

    return newAsset;
  }

  async updateAsset(id: string, data: UpdateAssetInput, userId: string) {
    // Verify asset exists
    await this.getAsset(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.type !== undefined) updateData['type'] = data.type;
    if (data.criticality !== undefined) updateData['criticality'] = data.criticality;
    if (data.vendor !== undefined) updateData['vendor'] = data.vendor;
    if (data.model !== undefined) updateData['model'] = data.model;
    if (data.firmwareVersion !== undefined) updateData['firmwareVersion'] = data.firmwareVersion;
    if (data.serialNumber !== undefined) updateData['serialNumber'] = data.serialNumber;
    if (data.ipAddress !== undefined) updateData['ipAddress'] = data.ipAddress;
    if (data.macAddress !== undefined) updateData['macAddress'] = data.macAddress;
    if (data.networkSegment !== undefined) updateData['networkSegment'] = data.networkSegment;
    if (data.purdueLevel !== undefined) updateData['purdueLevel'] = data.purdueLevel;
    if (data.zoneId !== undefined) updateData['zoneId'] = data.zoneId;
    if (data.location !== undefined) updateData['location'] = data.location;
    if (data.operationalStatus !== undefined) updateData['operationalStatus'] = data.operationalStatus;
    if (data.metadata !== undefined) updateData['metadata'] = data.metadata;

    // Date fields — pass Date objects directly for Drizzle timestamp columns
    if (data.installDate !== undefined) {
      updateData['installDate'] = data.installDate;
    }
    if (data.lastPatchDate !== undefined) {
      updateData['lastPatchDate'] = data.lastPatchDate;
    }
    if (data.eolDate !== undefined) {
      updateData['eolDate'] = data.eolDate;
    }

    const [updated] = await this.db
      .update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update asset'), {
        statusCode: 500,
        code: 'ASSET_UPDATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.updated',
      entityType: 'asset',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteAsset(id: string, userId: string) {
    const asset = await this.getAsset(id);

    // Soft delete by setting operationalStatus to 'decommissioned'
    await this.db
      .update(assets)
      .set({ operationalStatus: 'decommissioned', updatedAt: new Date() })
      .where(eq(assets.id, id));

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.deleted',
      entityType: 'asset',
      entityId: id,
      action: 'delete',
      details: { name: asset.name, previousStatus: asset.operationalStatus },
    });
  }

  // ── Asset Statistics ─────────────────────────────────────────────────

  async getAssetStats(): Promise<AssetStats> {
    // Count by type
    const typeRows = await this.db
      .select({
        type: assets.type,
        count: count(),
      })
      .from(assets)
      .groupBy(assets.type);

    const byType: Record<string, number> = {};
    for (const row of typeRows) {
      if (row.type !== null) {
        byType[row.type] = row.count;
      }
    }

    // Count by criticality
    const criticalityRows = await this.db
      .select({
        criticality: assets.criticality,
        count: count(),
      })
      .from(assets)
      .groupBy(assets.criticality);

    const byCriticality: Record<string, number> = {};
    for (const row of criticalityRows) {
      if (row.criticality !== null) {
        byCriticality[row.criticality] = row.count;
      }
    }

    // Total count
    const [totalResult] = await this.db
      .select({ total: count() })
      .from(assets);

    return {
      byType,
      byCriticality,
      total: totalResult?.total ?? 0,
    };
  }

  // ── Asset Relationships ──────────────────────────────────────────────

  async getRelationships(assetId: string) {
    // Verify asset exists
    await this.getAsset(assetId);

    return this.db
      .select()
      .from(assetRelationships)
      .where(
        sql`${assetRelationships.sourceAssetId} = ${assetId} OR ${assetRelationships.targetAssetId} = ${assetId}`,
      )
      .orderBy(assetRelationships.createdAt);
  }

  async createRelationship(
    assetId: string,
    data: CreateRelationshipInput,
    userId: string,
  ) {
    // Verify source asset exists
    await this.getAsset(assetId);

    // Verify target asset exists
    const [targetAsset] = await this.db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.id, data.targetAssetId))
      .limit(1);

    if (!targetAsset) {
      throw Object.assign(new Error('Target asset does not exist'), {
        statusCode: 400,
        code: 'INVALID_TARGET_ASSET',
      });
    }

    // Prevent self-referential assetRelationships
    if (assetId === data.targetAssetId) {
      throw Object.assign(
        new Error('Cannot create a relationship between an asset and itself'),
        {
          statusCode: 400,
          code: 'SELF_REFERENTIAL_RELATIONSHIP',
        },
      );
    }

    const [newRelationship] = await this.db
      .insert(assetRelationships)
      .values({
        sourceAssetId: assetId,
        targetAssetId: data.targetAssetId,
        relationshipType: data.relationshipType,
        protocol: data.protocol ?? null,
        metadata: data.metadata ?? {},
      })
      .returning();

    if (!newRelationship) {
      throw Object.assign(new Error('Failed to create relationship'), {
        statusCode: 500,
        code: 'RELATIONSHIP_CREATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.relationship_created',
      entityType: 'asset',
      entityId: assetId,
      action: 'update',
      details: {
        relationshipId: newRelationship.id,
        targetAssetId: data.targetAssetId,
        relationshipType: data.relationshipType,
      },
    });

    return newRelationship;
  }

  async deleteRelationship(assetId: string, relId: string, userId: string) {
    // Verify asset exists
    await this.getAsset(assetId);

    // Verify the relationship belongs to this asset
    const [relationship] = await this.db
      .select()
      .from(assetRelationships)
      .where(
        and(
          eq(assetRelationships.id, relId),
          sql`${assetRelationships.sourceAssetId} = ${assetId} OR ${assetRelationships.targetAssetId} = ${assetId}`,
        ),
      )
      .limit(1);

    if (!relationship) {
      throw Object.assign(new Error('Relationship not found'), {
        statusCode: 404,
        code: 'RELATIONSHIP_NOT_FOUND',
      });
    }

    await this.db
      .delete(assetRelationships)
      .where(eq(assetRelationships.id, relId));

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.relationship_deleted',
      entityType: 'asset',
      entityId: assetId,
      action: 'update',
      details: {
        relationshipId: relId,
        relationshipType: relationship.relationshipType,
      },
    });
  }

  // ── Asset Import ─────────────────────────────────────────────────────

  async importAssets(
    totalRecords: number,
    userId: string,
  ) {
    const [job] = await this.db
      .insert(importJobs)
      .values({
        status: 'pending',
        totalRecords,
        processedRecords: 0,
        succeededCount: 0,
        failedCount: 0,
        errors: [],
      })
      .returning();

    if (!job) {
      throw Object.assign(new Error('Failed to create import job'), {
        statusCode: 500,
        code: 'IMPORT_JOB_CREATE_FAILED',
      });
    }

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'asset.import_started',
      entityType: 'import_job',
      entityId: job.id,
      action: 'create',
      details: { totalRecords, jobId: job.id },
    });

    return job;
  }

  async getImportJobStatus(jobId: string) {
    const [job] = await this.db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, jobId))
      .limit(1);

    if (!job) {
      throw Object.assign(new Error('Import job not found'), {
        statusCode: 404,
        code: 'IMPORT_JOB_NOT_FOUND',
      });
    }

    return job;
  }

  // ── Asset Export ─────────────────────────────────────────────────────

  async exportAssets() {
    return this.db
      .select()
      .from(assets)
      .orderBy(assets.name);
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
