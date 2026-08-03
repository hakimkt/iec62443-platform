import crypto from 'node:crypto';
import {
  auditEvents,
  engagements,
  findingComments,
  findings,
  statusHistory,
} from '@iec62443/database';
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DbOrTx = NodePgDatabase | Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

export interface FindingFilters {
  status?: string;
  severity?: string;
  engagementId?: string;
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

export interface CreateFindingInput {
  engagementId?: string;
  title: string;
  description?: string;
  severity: string;
  category?: string;
  subcategory?: string;
  iecRequirement?: string;
  assetIds?: string[];
  zoneIds?: string[];
  riskIds?: string[];
  assignedTo?: string;
  dueDate?: Date;
  source?: string;
  externalRef?: string;
}

export interface UpdateFindingInput {
  engagementId?: string;
  title?: string;
  description?: string;
  severity?: string;
  category?: string;
  subcategory?: string;
  iecRequirement?: string;
  assetIds?: string[];
  zoneIds?: string[];
  riskIds?: string[];
  assignedTo?: string;
  dueDate?: Date;
  externalRef?: string;
}

export interface TransitionFindingInput {
  toStatus: string;
  reason?: string;
}

export interface CreateCommentInput {
  body: string;
  isInternal?: boolean;
}

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['open'],
  open: ['acknowledged', 'false_positive', 'risk_accepted'],
  acknowledged: ['remediation_planned', 'false_positive', 'risk_accepted'],
  remediation_planned: ['in_progress', 'false_positive', 'risk_accepted'],
  in_progress: ['verification', 'false_positive', 'risk_accepted'],
  verification: ['verified', 'false_positive', 'risk_accepted'],
  verified: ['closed', 'false_positive', 'risk_accepted'],
  closed: [],
  false_positive: [],
  risk_accepted: [],
};

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

export class FindingService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    private tenantSchema?: string,
  ) {}

  // ── Findings CRUD ────────────────────────────────────────────────────

  async listFindings(filters: FindingFilters) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const page = filters.page ?? 1;
      const perPage = filters.perPage ?? 25;
      const offset = (page - 1) * perPage;

      const conditions = [];

      if (filters.status) {
        conditions.push(eq(findings.status, filters.status));
      }

      if (filters.severity) {
        conditions.push(eq(findings.severity, filters.severity));
      }

      if (filters.engagementId) {
        conditions.push(eq(findings.engagementId, filters.engagementId));
      }

      if (filters.search) {
        conditions.push(ilike(findings.title, `%${filters.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total
      const [countResult] = await tx.select({ total: count() }).from(findings).where(whereClause);

      const total = countResult?.total ?? 0;
      const totalPages = Math.ceil(total / perPage);

      // Determine sort order
      const sort = filters.sort ?? 'severity';
      let query;

      if (sort === 'severity') {
        // Sort by severity (critical first) then by date
        query = tx
          .select()
          .from(findings)
          .where(whereClause)
          .orderBy(
            sql`CASE ${findings.severity}
            WHEN 'critical' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            WHEN 'informational' THEN 4
            ELSE 5 END`,
            desc(findings.discoveredAt),
          )
          .limit(perPage)
          .offset(offset);
      } else if (sort === 'date') {
        query = tx
          .select()
          .from(findings)
          .where(whereClause)
          .orderBy(desc(findings.discoveredAt))
          .limit(perPage)
          .offset(offset);
      } else {
        query = tx
          .select()
          .from(findings)
          .where(whereClause)
          .orderBy(desc(findings.createdAt))
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
    });
  }

  async getFinding(id: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const [finding] = await tx.select().from(findings).where(eq(findings.id, id)).limit(1);

      if (!finding) {
        throw Object.assign(new Error('Finding not found'), {
          statusCode: 404,
          code: 'FINDING_NOT_FOUND',
        });
      }

      return finding;
    });
  }

  async createFinding(data: CreateFindingInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      // Validate engagement exists if provided
      if (data.engagementId) {
        const [engagement] = await tx
          .select({ id: engagements.id })
          .from(engagements)
          .where(eq(engagements.id, data.engagementId))
          .limit(1);

        if (!engagement) {
          throw Object.assign(new Error('Referenced engagement does not exist'), {
            statusCode: 400,
            code: 'INVALID_ENGAGEMENT',
          });
        }
      }

      const [newFinding] = await tx
        .insert(findings)
        .values({
          engagementId: data.engagementId ?? null,
          title: data.title,
          description: data.description ?? null,
          severity: data.severity,
          status: 'draft',
          category: data.category ?? null,
          subcategory: data.subcategory ?? null,
          iecRequirement: data.iecRequirement ?? null,
          assetIds: data.assetIds ?? [],
          zoneIds: data.zoneIds ?? [],
          riskIds: data.riskIds ?? [],
          assignedTo: data.assignedTo ?? null,
          dueDate: data.dueDate ?? null,
          source: data.source ?? 'manual',
          externalRef: data.externalRef ?? null,
        })
        .returning();

      if (!newFinding) {
        throw Object.assign(new Error('Failed to create finding'), {
          statusCode: 500,
          code: 'FINDING_CREATE_FAILED',
        });
      }

      // Create initial status history entry (null → draft)
      await tx.insert(statusHistory).values({
        findingId: newFinding.id,
        fromStatus: null,
        toStatus: 'draft',
        changedBy: userId,
        reason: 'Finding created',
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.created',
        entityType: 'finding',
        entityId: newFinding.id,
        action: 'create',
        details: { title: data.title, severity: data.severity, status: 'draft' },
      });

      return newFinding;
    });
  }

  async updateFinding(id: string, data: UpdateFindingInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const finding = await this.getFindingTx(tx, id);

      // Only allow updates if status is 'draft' or 'open'
      if (finding.status !== 'draft' && finding.status !== 'open') {
        throw Object.assign(
          new Error('Cannot update finding that is not in draft or open status'),
          {
            statusCode: 409,
            code: 'FINDING_NOT_EDITABLE',
          },
        );
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.engagementId !== undefined) updateData['engagementId'] = data.engagementId;
      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.severity !== undefined) updateData['severity'] = data.severity;
      if (data.category !== undefined) updateData['category'] = data.category;
      if (data.subcategory !== undefined) updateData['subcategory'] = data.subcategory;
      if (data.iecRequirement !== undefined) updateData['iecRequirement'] = data.iecRequirement;
      if (data.assetIds !== undefined) updateData['assetIds'] = data.assetIds;
      if (data.zoneIds !== undefined) updateData['zoneIds'] = data.zoneIds;
      if (data.riskIds !== undefined) updateData['riskIds'] = data.riskIds;
      if (data.assignedTo !== undefined) updateData['assignedTo'] = data.assignedTo;
      if (data.dueDate !== undefined) updateData['dueDate'] = data.dueDate;
      if (data.externalRef !== undefined) updateData['externalRef'] = data.externalRef;

      // Validate engagement exists if being changed
      if (data.engagementId) {
        const [engagement] = await tx
          .select({ id: engagements.id })
          .from(engagements)
          .where(eq(engagements.id, data.engagementId))
          .limit(1);

        if (!engagement) {
          throw Object.assign(new Error('Referenced engagement does not exist'), {
            statusCode: 400,
            code: 'INVALID_ENGAGEMENT',
          });
        }
      }

      const [updated] = await tx
        .update(findings)
        .set(updateData)
        .where(eq(findings.id, id))
        .returning();

      if (!updated) {
        throw Object.assign(new Error('Failed to update finding'), {
          statusCode: 500,
          code: 'FINDING_UPDATE_FAILED',
        });
      }

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.updated',
        entityType: 'finding',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return updated;
    });
  }

  async deleteFinding(id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const finding = await this.getFindingTx(tx, id);

      // Only allow if status is 'draft' or 'false_positive'
      if (finding.status !== 'draft' && finding.status !== 'false_positive') {
        throw Object.assign(new Error('Only draft or false_positive findings can be deleted'), {
          statusCode: 409,
          code: 'FINDING_NOT_DELETABLE',
        });
      }

      // Soft delete by setting status to 'closed'
      await tx
        .update(findings)
        .set({ status: 'closed', closedAt: new Date(), closedBy: userId, updatedAt: new Date() })
        .where(eq(findings.id, id));

      // Create status history entry
      await tx.insert(statusHistory).values({
        findingId: id,
        fromStatus: finding.status,
        toStatus: 'closed',
        changedBy: userId,
        reason: 'Finding deleted (soft delete)',
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.deleted',
        entityType: 'finding',
        entityId: id,
        action: 'delete',
        details: { title: finding.title, previousStatus: finding.status },
      });
    });
  }

  // ── Status transitions ───────────────────────────────────────────────

  async transitionFinding(id: string, data: TransitionFindingInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const finding = await this.getFindingTx(tx, id);

      // Validate the transition is valid
      const allowedTransitions = VALID_TRANSITIONS[finding.status];
      if (!allowedTransitions || !allowedTransitions.includes(data.toStatus)) {
        throw Object.assign(
          new Error(`Cannot transition finding from '${finding.status}' to '${data.toStatus}'`),
          {
            statusCode: 409,
            code: 'INVALID_STATUS_TRANSITION',
          },
        );
      }

      const updateData: Record<string, unknown> = {
        status: data.toStatus,
        updatedAt: new Date(),
      };

      // If transitioning to closed, set closedAt and closedBy
      if (data.toStatus === 'closed') {
        updateData['closedAt'] = new Date();
        updateData['closedBy'] = userId;
      }

      const [updated] = await tx
        .update(findings)
        .set(updateData)
        .where(eq(findings.id, id))
        .returning();

      if (!updated) {
        throw Object.assign(new Error('Failed to transition finding status'), {
          statusCode: 500,
          code: 'FINDING_TRANSITION_FAILED',
        });
      }

      // Create status history entry
      await tx.insert(statusHistory).values({
        findingId: id,
        fromStatus: finding.status,
        toStatus: data.toStatus,
        changedBy: userId,
        reason: data.reason ?? null,
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.status_transitioned',
        entityType: 'finding',
        entityId: id,
        action: 'update',
        details: {
          fromStatus: finding.status,
          toStatus: data.toStatus,
          reason: data.reason,
        },
      });

      return updated;
    });
  }

  async getStatusHistory(findingId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      // Verify finding exists
      await this.getFindingTx(tx, findingId);

      return tx
        .select()
        .from(statusHistory)
        .where(eq(statusHistory.findingId, findingId))
        .orderBy(statusHistory.changedAt);
    });
  }

  // ── Comments ─────────────────────────────────────────────────────────

  async getComments(findingId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      // Verify finding exists
      await this.getFindingTx(tx, findingId);

      return tx
        .select()
        .from(findingComments)
        .where(eq(findingComments.findingId, findingId))
        .orderBy(findingComments.createdAt);
    });
  }

  async addComment(findingId: string, data: CreateCommentInput, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      // Verify finding exists
      await this.getFindingTx(tx, findingId);

      const [newComment] = await tx
        .insert(findingComments)
        .values({
          findingId,
          authorId: userId,
          body: data.body,
          isInternal: data.isInternal ?? false,
        })
        .returning();

      if (!newComment) {
        throw Object.assign(new Error('Failed to create comment'), {
          statusCode: 500,
          code: 'COMMENT_CREATE_FAILED',
        });
      }

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.comment_added',
        entityType: 'finding',
        entityId: findingId,
        action: 'update',
        details: { commentId: newComment.id, isInternal: data.isInternal ?? false },
      });

      return newComment;
    });
  }

  // ── Evidence linking ─────────────────────────────────────────────────

  async linkEvidence(findingId: string, evidenceId: string, userId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      const finding = await this.getFindingTx(tx, findingId);

      // Add evidenceId to the finding's metadata (using a links array)
      const existingMetadata = (finding.metadata as Record<string, unknown>) ?? {};
      const existingLinks = (existingMetadata['evidenceLinks'] as string[]) ?? [];

      if (existingLinks.includes(evidenceId)) {
        throw Object.assign(new Error('Evidence already linked to this finding'), {
          statusCode: 409,
          code: 'EVIDENCE_ALREADY_LINKED',
        });
      }

      existingLinks.push(evidenceId);

      await tx
        .update(findings)
        .set({
          metadata: { ...existingMetadata, evidenceLinks: existingLinks },
          updatedAt: new Date(),
        })
        .where(eq(findings.id, findingId));

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'finding.evidence_linked',
        entityType: 'finding',
        entityId: findingId,
        action: 'update',
        details: { evidenceId },
      });
    });
  }

  async getEvidence(findingId: string) {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }

      // Verify finding exists
      const finding = await this.getFindingTx(tx, findingId);

      const metadata = (finding.metadata as Record<string, unknown>) ?? {};
      const evidenceIds = (metadata['evidenceLinks'] as string[]) ?? [];

      return { evidenceIds };
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async getFindingTx(db: DbOrTx, id: string) {
    const [finding] = await db.select().from(findings).where(eq(findings.id, id)).limit(1);

    if (!finding) {
      throw Object.assign(new Error('Finding not found'), {
        statusCode: 404,
        code: 'FINDING_NOT_FOUND',
      });
    }

    return finding;
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
      // Get the last audit event hash for chaining (tenant-scoped)
      const [lastEvent] = await db
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
      // Audit failures should not break the primary operation
      console.error('Failed to create audit event:', error);
    }
  }
}
