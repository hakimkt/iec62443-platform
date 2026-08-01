import { eq, and, desc, sql, count, ilike } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  evidenceItems,
  evidenceLinks,
  chainOfCustody,
  auditEvents,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvidenceFilters {
  evidenceType?: string;
  search?: string;
  tags?: string[];
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

export interface CreateEvidenceInput {
  title: string;
  description?: string;
  evidenceType: string;
  retentionUntil?: Date;
  tags?: string[];
}

export interface UpdateEvidenceInput {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface LinkEvidenceInput {
  entityType: string;
  entityId: string;
}

// ---------------------------------------------------------------------------
// Valid entity types for evidence links
// ---------------------------------------------------------------------------

const VALID_ENTITY_TYPES = ['finding', 'assessment', 'risk', 'csms_element'] as const;

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

export class EvidenceService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
  ) {}

  // ── Evidence CRUD ────────────────────────────────────────────────────

  async listEvidence(filters: EvidenceFilters) {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 25;
    const offset = (page - 1) * perPage;

    const conditions = [];

    // Exclude soft-deleted items by default
    conditions.push(eq(evidenceItems.status, 'active'));

    if (filters.evidenceType) {
      conditions.push(eq(evidenceItems.evidenceType, filters.evidenceType));
    }

    if (filters.search) {
      conditions.push(ilike(evidenceItems.title, `%${filters.search}%`));
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(
        sql`${evidenceItems.tags} && ${filters.tags}`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await this.db
      .select({ total: count() })
      .from(evidenceItems)
      .where(whereClause);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Determine sort order
    const sort = filters.sort ?? 'date';
    let query;

    if (sort === 'date') {
      query = this.db
        .select()
        .from(evidenceItems)
        .where(whereClause)
        .orderBy(desc(evidenceItems.collectedAt))
        .limit(perPage)
        .offset(offset);
    } else {
      query = this.db
        .select()
        .from(evidenceItems)
        .where(whereClause)
        .orderBy(desc(evidenceItems.createdAt))
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

  async getEvidence(id: string) {
    const [item] = await this.db
      .select()
      .from(evidenceItems)
      .where(eq(evidenceItems.id, id))
      .limit(1);

    if (!item) {
      throw Object.assign(new Error('Evidence not found'), {
        statusCode: 404,
        code: 'EVIDENCE_NOT_FOUND',
      });
    }

    return item;
  }

  async createEvidence(data: CreateEvidenceInput, userId: string) {
    const [newItem] = await this.db
      .insert(evidenceItems)
      .values({
        title: data.title,
        description: data.description ?? null,
        evidenceType: data.evidenceType,
        sha256Hash: null,
        collectedBy: userId,
        retentionUntil: data.retentionUntil ?? null,
        tags: data.tags ?? [],
        metadata: {},
      })
      .returning();

    if (!newItem) {
      throw Object.assign(new Error('Failed to create evidence item'), {
        statusCode: 500,
        code: 'EVIDENCE_CREATE_FAILED',
      });
    }

    // Create chain-of-custody 'created' event
    await this.db.insert(chainOfCustody).values({
      evidenceId: newItem.id,
      eventType: 'created',
      userId,
      details: {
        title: data.title,
        evidenceType: data.evidenceType,
      },
    });

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'evidence.created',
      entityType: 'evidence',
      entityId: newItem.id,
      action: 'create',
      details: { title: data.title, evidenceType: data.evidenceType },
    });

    return newItem;
  }

  async updateEvidence(id: string, data: UpdateEvidenceInput, userId: string) {
    await this.getEvidence(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData['title'] = data.title;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.tags !== undefined) updateData['tags'] = data.tags;

    const [updated] = await this.db
      .update(evidenceItems)
      .set(updateData)
      .where(eq(evidenceItems.id, id))
      .returning();

    if (!updated) {
      throw Object.assign(new Error('Failed to update evidence item'), {
        statusCode: 500,
        code: 'EVIDENCE_UPDATE_FAILED',
      });
    }

    // Create chain-of-custody 'updated' event
    await this.db.insert(chainOfCustody).values({
      evidenceId: id,
      eventType: 'updated',
      userId,
      details: { updatedFields: Object.keys(data) },
    });

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'evidence.updated',
      entityType: 'evidence',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  async deleteEvidence(id: string, userId: string) {
    const item = await this.getEvidence(id);

    // Soft delete: set status to 'archived' and record deletion metadata
    await this.db
      .update(evidenceItems)
      .set({
        status: 'archived',
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(evidenceItems.id, id));

    // Create chain-of-custody 'deleted' event (never delete custody records)
    await this.db.insert(chainOfCustody).values({
      evidenceId: id,
      eventType: 'deleted',
      userId,
      details: {
        title: item.title,
        previousStatus: item.status,
      },
    });

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'evidence.deleted',
      entityType: 'evidence',
      entityId: id,
      action: 'delete',
      details: { title: item.title, softDelete: true },
    });
  }

  // ── Evidence Links ───────────────────────────────────────────────────

  async getLinks(evidenceId: string) {
    // Verify evidence exists
    await this.getEvidence(evidenceId);

    return this.db
      .select()
      .from(evidenceLinks)
      .where(eq(evidenceLinks.evidenceId, evidenceId))
      .orderBy(evidenceLinks.createdAt);
  }

  async linkEvidence(evidenceId: string, data: LinkEvidenceInput, userId: string) {
    // Verify evidence exists
    await this.getEvidence(evidenceId);

    // Validate entity type
    if (!VALID_ENTITY_TYPES.includes(data.entityType as typeof VALID_ENTITY_TYPES[number])) {
      throw Object.assign(
        new Error(`Invalid entity type '${data.entityType}'. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`),
        {
          statusCode: 400,
          code: 'INVALID_ENTITY_TYPE',
        },
      );
    }

    // Check for duplicate link
    const [existingLink] = await this.db
      .select({ id: evidenceLinks.id })
      .from(evidenceLinks)
      .where(
        and(
          eq(evidenceLinks.evidenceId, evidenceId),
          eq(evidenceLinks.entityType, data.entityType),
          eq(evidenceLinks.entityId, data.entityId),
        ),
      )
      .limit(1);

    if (existingLink) {
      throw Object.assign(
        new Error('Evidence is already linked to this entity'),
        {
          statusCode: 409,
          code: 'EVIDENCE_ALREADY_LINKED',
        },
      );
    }

    const [newLink] = await this.db
      .insert(evidenceLinks)
      .values({
        evidenceId,
        entityType: data.entityType,
        entityId: data.entityId,
      })
      .returning();

    if (!newLink) {
      throw Object.assign(new Error('Failed to create evidence link'), {
        statusCode: 500,
        code: 'EVIDENCE_LINK_FAILED',
      });
    }

    // Create chain-of-custody 'linked' event
    await this.db.insert(chainOfCustody).values({
      evidenceId,
      eventType: 'linked',
      userId,
      details: {
        entityType: data.entityType,
        entityId: data.entityId,
        linkId: newLink.id,
      },
    });

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'evidence.linked',
      entityType: 'evidence',
      entityId: evidenceId,
      action: 'update',
      details: { entityType: data.entityType, entityId: data.entityId, linkId: newLink.id },
    });

    return newLink;
  }

  async unlinkEvidence(evidenceId: string, linkId: string, userId: string) {
    // Verify evidence exists
    await this.getEvidence(evidenceId);

    // Find the link
    const [link] = await this.db
      .select()
      .from(evidenceLinks)
      .where(
        and(
          eq(evidenceLinks.id, linkId),
          eq(evidenceLinks.evidenceId, evidenceId),
        ),
      )
      .limit(1);

    if (!link) {
      throw Object.assign(new Error('Evidence link not found'), {
        statusCode: 404,
        code: 'EVIDENCE_LINK_NOT_FOUND',
      });
    }

    // Delete the link
    await this.db
      .delete(evidenceLinks)
      .where(eq(evidenceLinks.id, linkId));

    // Create chain-of-custody 'unlinked' event
    await this.db.insert(chainOfCustody).values({
      evidenceId,
      eventType: 'unlinked',
      userId,
      details: {
        entityType: link.entityType,
        entityId: link.entityId,
        linkId,
      },
    });

    // Audit
    await this.createAuditEvent({
      userId,
      eventType: 'evidence.unlinked',
      entityType: 'evidence',
      entityId: evidenceId,
      action: 'update',
      details: { entityType: link.entityType, entityId: link.entityId, linkId },
    });
  }

  // ── Chain of Custody ─────────────────────────────────────────────────

  async getChainOfCustody(evidenceId: string) {
    // Verify evidence exists
    await this.getEvidence(evidenceId);

    return this.db
      .select()
      .from(chainOfCustody)
      .where(eq(chainOfCustody.evidenceId, evidenceId))
      .orderBy(chainOfCustody.createdAt);
  }

  // ── Verification ─────────────────────────────────────────────────────

  async verifyEvidence(evidenceId: string) {
    const item = await this.getEvidence(evidenceId);

    const verified = item.sha256Hash !== null && item.sha256Hash !== '';

    return {
      verified,
      hash: verified ? item.sha256Hash : null,
    };
  }

  // ── Storage Quota ────────────────────────────────────────────────────

  async getStorageQuota() {
    // Placeholder: tenant storage quota not directly accessible from tenant schema
    return {
      quotaBytes: 10737418240,
      usedBytes: 0,
      usagePct: 0,
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
