import { desc, eq, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { auditEvents } from './schema/platform/audit-events.js';

// ---------------------------------------------------------------------------
// Audit Service — shared audit event creation with atomic hash chain
// ---------------------------------------------------------------------------

export interface CreateAuditEventParams {
  userId: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'read';
  details: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  tenantId?: string | null;
}

async function computeEventHash(
  data: string,
  previousHash: string | null,
): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Advisory lock ID for audit hash chain — must be unique across the database
const AUDIT_CHAIN_LOCK_ID = 20260801;

export class AuditService {
  constructor(private db: NodePgDatabase) {}

  async createEvent(params: CreateAuditEventParams): Promise<void> {
    try {
      // Acquire a transaction-level advisory lock to prevent concurrent hash chain forks.
      // pg_advisory_xact_lock is automatically released when the transaction ends.
      await this.db.execute(
        sql`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_ID})`,
      );

      // Fetch the last event hash within the lock scope
      const lastEventQuery = params.tenantId
        ? this.db
            .select({ eventHash: auditEvents.eventHash })
            .from(auditEvents)
            .where(eq(auditEvents.tenantId, params.tenantId))
            .orderBy(desc(auditEvents.id))
            .limit(1)
        : this.db
            .select({ eventHash: auditEvents.eventHash })
            .from(auditEvents)
            .orderBy(desc(auditEvents.id))
            .limit(1);

      const [lastEvent] = await lastEventQuery;

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
        tenantId: params.tenantId ?? null,
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
