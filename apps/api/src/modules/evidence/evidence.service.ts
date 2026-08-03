import crypto from 'node:crypto';
import {
  auditEvents,
  chainOfCustody,
  evidenceFiles,
  evidenceItems,
  evidenceLinks,
} from '@iec62443/database';
import { and, count, desc, eq, ilike, sql, sum } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

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

async function computeEventHash(data: string, previousHash: string | null): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class EvidenceService {
  private tenantSchema: string | undefined;

  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    tenantSchema?: string,
  ) {
    this.tenantSchema = tenantSchema;
  }

  private async withTenantSchema<T>(
    fn: (tx: Parameters<Parameters<typeof this.db.transaction>[0]>[0]) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      if (this.tenantSchema) {
        await tx.execute(
          sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`,
        );
      }
      return fn(tx);
    });
  }

  // ── Evidence CRUD ────────────────────────────────────────────────────

  async listEvidence(filters: EvidenceFilters) {
    return this.withTenantSchema(async (tx) => {
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
        conditions.push(sql`${evidenceItems.tags} && ${filters.tags}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Count total
      const [countResult] = await tx
        .select({ total: count() })
        .from(evidenceItems)
        .where(whereClause);

      const total = countResult?.total ?? 0;
      const totalPages = Math.ceil(total / perPage);

      // Determine sort order
      const sort = filters.sort ?? 'date';
      let query;

      if (sort === 'date') {
        query = tx
          .select()
          .from(evidenceItems)
          .where(whereClause)
          .orderBy(desc(evidenceItems.collectedAt))
          .limit(perPage)
          .offset(offset);
      } else {
        query = tx
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
    });
  }

  async getEvidence(id: string) {
    return this.withTenantSchema(async (tx) => {
      const [item] = await tx.select().from(evidenceItems).where(eq(evidenceItems.id, id)).limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      return item;
    });
  }

  async createEvidence(data: CreateEvidenceInput, userId: string) {
    return this.withTenantSchema(async (tx) => {
      const [newItem] = await tx
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
      await tx.insert(chainOfCustody).values({
        evidenceId: newItem.id,
        eventType: 'created',
        userId,
        details: {
          title: data.title,
          evidenceType: data.evidenceType,
        },
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.created',
        entityType: 'evidence',
        entityId: newItem.id,
        action: 'create',
        details: { title: data.title, evidenceType: data.evidenceType },
      });

      return newItem;
    });
  }

  async updateEvidence(id: string, data: UpdateEvidenceInput, userId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx.select().from(evidenceItems).where(eq(evidenceItems.id, id)).limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) updateData['title'] = data.title;
      if (data.description !== undefined) updateData['description'] = data.description;
      if (data.tags !== undefined) updateData['tags'] = data.tags;

      const [updated] = await tx
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
      await tx.insert(chainOfCustody).values({
        evidenceId: id,
        eventType: 'updated',
        userId,
        details: { updatedFields: Object.keys(data) },
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.updated',
        entityType: 'evidence',
        entityId: id,
        action: 'update',
        details: { updatedFields: Object.keys(data) },
      });

      return updated;
    });
  }

  async deleteEvidence(id: string, userId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx.select().from(evidenceItems).where(eq(evidenceItems.id, id)).limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      // Soft delete: set status to 'archived' and record deletion metadata
      await tx
        .update(evidenceItems)
        .set({
          status: 'archived',
          deletedAt: new Date(),
          deletedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(evidenceItems.id, id));

      // Create chain-of-custody 'deleted' event (never delete custody records)
      await tx.insert(chainOfCustody).values({
        evidenceId: id,
        eventType: 'deleted',
        userId,
        details: {
          title: item.title,
          previousStatus: item.status,
        },
      });

      // Audit
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.deleted',
        entityType: 'evidence',
        entityId: id,
        action: 'delete',
        details: { title: item.title, softDelete: true },
      });
    });
  }

  // ── Evidence Links ───────────────────────────────────────────────────

  async getLinks(evidenceId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      return tx
        .select()
        .from(evidenceLinks)
        .where(eq(evidenceLinks.evidenceId, evidenceId))
        .orderBy(evidenceLinks.createdAt);
    });
  }

  async linkEvidence(evidenceId: string, data: LinkEvidenceInput, userId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      // Validate entity type
      if (!VALID_ENTITY_TYPES.includes(data.entityType as (typeof VALID_ENTITY_TYPES)[number])) {
        throw Object.assign(
          new Error(
            `Invalid entity type '${data.entityType}'. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
          ),
          {
            statusCode: 400,
            code: 'INVALID_ENTITY_TYPE',
          },
        );
      }

      // Check for duplicate link
      const [existingLink] = await tx
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
        throw Object.assign(new Error('Evidence is already linked to this entity'), {
          statusCode: 409,
          code: 'EVIDENCE_ALREADY_LINKED',
        });
      }

      const [newLink] = await tx
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
      await tx.insert(chainOfCustody).values({
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
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.linked',
        entityType: 'evidence',
        entityId: evidenceId,
        action: 'update',
        details: { entityType: data.entityType, entityId: data.entityId, linkId: newLink.id },
      });

      return newLink;
    });
  }

  async unlinkEvidence(evidenceId: string, linkId: string, userId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      // Find the link
      const [link] = await tx
        .select()
        .from(evidenceLinks)
        .where(and(eq(evidenceLinks.id, linkId), eq(evidenceLinks.evidenceId, evidenceId)))
        .limit(1);

      if (!link) {
        throw Object.assign(new Error('Evidence link not found'), {
          statusCode: 404,
          code: 'EVIDENCE_LINK_NOT_FOUND',
        });
      }

      // Delete the link
      await tx.delete(evidenceLinks).where(eq(evidenceLinks.id, linkId));

      // Create chain-of-custody 'unlinked' event
      await tx.insert(chainOfCustody).values({
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
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.unlinked',
        entityType: 'evidence',
        entityId: evidenceId,
        action: 'update',
        details: { entityType: link.entityType, entityId: link.entityId, linkId },
      });
    });
  }

  // ── Chain of Custody ─────────────────────────────────────────────────

  async getChainOfCustody(evidenceId: string) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence exists (inline to use tx)
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      return tx
        .select()
        .from(chainOfCustody)
        .where(eq(chainOfCustody.evidenceId, evidenceId))
        .orderBy(chainOfCustody.createdAt);
    });
  }

  // ── Verification ─────────────────────────────────────────────────────

  async verifyEvidence(evidenceId: string) {
    return this.withTenantSchema(async (tx) => {
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      // If no hash was ever stored, the evidence cannot be verified
      if (!item.sha256Hash || item.sha256Hash === '') {
        return {
          verified: false,
          hash: null,
          reason: 'No SHA-256 hash on record',
        };
      }

      // If the evidence has a file reference, verify the hash against the stored file
      if (item.fileId) {
        // Look up the file record to get the storage key
        const [file] = await tx
          .select()
          .from(evidenceFiles)
          .where(eq(evidenceFiles.id, item.fileId))
          .limit(1);

        if (file) {
          // Attempt to fetch the file from S3/MinIO and re-compute the hash.
          // If S3 is not configured, we cannot verify the file content.
          const s3Endpoint = process.env['S3_ENDPOINT'];
          const s3Bucket = process.env['S3_BUCKET'];

          if (s3Endpoint && s3Bucket) {
            try {
              const fileBuffer = await this.fetchFileFromStorage(file.storageKey, s3Bucket);
              const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
              const hashesMatch = computedHash === item.sha256Hash;

              return {
                verified: hashesMatch,
                hash: item.sha256Hash,
                fileId: item.fileId,
                storageKey: file.storageKey,
                reason: hashesMatch
                  ? undefined
                  : 'Computed hash does not match stored hash — file may have been tampered with',
              };
            } catch {
              return {
                verified: false,
                hash: item.sha256Hash,
                fileId: item.fileId,
                storageKey: file.storageKey,
                reason: 'Unable to fetch file from storage backend for verification',
              };
            }
          }

          // S3 not configured — cannot verify file integrity
          return {
            verified: false,
            hash: item.sha256Hash,
            fileId: item.fileId,
            storageKey: file.storageKey,
            reason: 'Storage backend not configured — cannot verify file content integrity',
          };
        }
      }

      // For evidence without a file (e.g., interview notes, certificates),
      // verify that the hash is present and properly formatted
      const hashValid = /^[a-f0-9]{64}$/.test(item.sha256Hash);

      return {
        verified: hashValid,
        hash: hashValid ? item.sha256Hash : null,
        reason: hashValid ? undefined : 'Stored hash is not a valid SHA-256 hex digest',
      };
    });
  }

  // ── File Upload ──────────────────────────────────────────────────────

  async uploadFile(
    evidenceId: string,
    fileData: { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> },
    userId: string,
  ) {
    return this.withTenantSchema(async (tx) => {
      // Verify evidence item exists before uploading (inline to use tx)
      const [item] = await tx
        .select()
        .from(evidenceItems)
        .where(eq(evidenceItems.id, evidenceId))
        .limit(1);

      if (!item) {
        throw Object.assign(new Error('Evidence not found'), {
          statusCode: 404,
          code: 'EVIDENCE_NOT_FOUND',
        });
      }

      // Read the file content into a buffer
      const buffer = await fileData.toBuffer();
      const fileSize = BigInt(buffer.length);

      // Compute SHA-256 hash of the file content for integrity verification
      const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Create a file record in the evidenceFiles table
      const storageKey = `evidence/${evidenceId}/${fileData.filename}`;
      const [fileRecord] = await tx
        .insert(evidenceFiles)
        .values({
          storageBackend: 's3',
          storageKey,
          bucket: process.env['S3_BUCKET'] ?? 'iec62443-evidence',
        })
        .returning();

      if (!fileRecord) {
        throw Object.assign(new Error('Failed to create file record'), {
          statusCode: 500,
          code: 'FILE_RECORD_CREATE_FAILED',
        });
      }

      // Update the evidence item with file metadata and hash
      const [updated] = await tx
        .update(evidenceItems)
        .set({
          fileId: fileRecord.id,
          fileName: fileData.filename,
          fileSize,
          mimeType: fileData.mimetype,
          sha256Hash,
          updatedAt: new Date(),
        })
        .where(eq(evidenceItems.id, evidenceId))
        .returning();

      if (!updated) {
        throw Object.assign(new Error('Failed to update evidence item'), {
          statusCode: 500,
          code: 'EVIDENCE_UPDATE_FAILED',
        });
      }

      // Add chain of custody entry
      await tx.insert(chainOfCustody).values({
        evidenceId,
        eventType: 'file_uploaded',
        userId,
        details: {
          fileName: fileData.filename,
          fileSize: buffer.length,
          mimeType: fileData.mimetype,
          sha256Hash,
        },
      });

      // Create audit event
      await this.createAuditEvent(tx, {
        userId,
        eventType: 'evidence.file_uploaded',
        entityType: 'evidence',
        entityId: evidenceId,
        action: 'update',
        details: { fileName: fileData.filename, sha256Hash },
      });

      return {
        id: updated.id,
        fileName: updated.fileName,
        fileSize: updated.fileSize,
        mimeType: updated.mimeType,
        sha256Hash: updated.sha256Hash,
        fileId: fileRecord.id,
      };
    });
  }

  // ── Storage Quota ────────────────────────────────────────────────────

  async getStorageQuota() {
    return this.withTenantSchema(async (tx) => {
      // Sum file sizes from evidence items that have files
      const [result] = await tx
        .select({
          totalUsed: sum(evidenceItems.fileSize),
        })
        .from(evidenceItems)
        .where(eq(evidenceItems.status, 'active'));

      const quotaBytes = Number(process.env['STORAGE_QUOTA_BYTES'] ?? '10737418240'); // 10 GB default
      const usedBytes = Number(result?.totalUsed ?? 0);
      const usagePct = quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 10000) / 100 : 0;

      return {
        quotaBytes,
        usedBytes,
        usagePct,
      };
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async createAuditEvent(
    tx: Parameters<Parameters<typeof this.db.transaction>[0]>[0],
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
      const [lastEvent] = await tx
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

      await tx.insert(auditEvents).values({
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

  /**
   * Fetch a file from S3/MinIO storage backend.
   * Returns the file content as a Buffer.
   */
  private async fetchFileFromStorage(storageKey: string, bucket: string): Promise<Buffer> {
    const endpoint = process.env['S3_ENDPOINT']!;
    const accessKey = process.env['S3_ACCESS_KEY'];
    const secretKey = process.env['S3_SECRET_KEY'];

    // Use AWS SDK v3-style fetch via the S3 endpoint
    const url = `${endpoint}/${bucket}/${storageKey}`;
    const headers: Record<string, string> = {};

    if (accessKey && secretKey) {
      // Basic auth for MinIO (simplified — production should use AWS SigV4)
      headers['Authorization'] =
        'Basic ' + Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from storage: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
