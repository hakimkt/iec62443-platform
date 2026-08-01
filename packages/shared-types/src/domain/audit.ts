/**
 * IEC 62443 Audit Domain Types
 *
 * Covers immutable audit events, log queries, and filter parameters
 * for compliance and traceability.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Audit Event
// ---------------------------------------------------------------------------

/** High-level action types recorded in the audit log. */
export type AuditAction = 'create' | 'update' | 'delete' | 'read';

/**
 * An immutable audit event recording a state-changing action in the
 * platform.
 *
 * Events form a hash-chained ledger for tamper evidence.
 */
export interface AuditEvent {
  id: UUID;
  tenantId: UUID;
  userId: UUID | null;
  /** Event type (e.g. "assessment.completed", "finding.status_changed"). */
  eventType: string;
  /** Entity type (e.g. "finding", "asset", "risk_entry"). */
  entityType: string;
  /** ID of the affected entity. */
  entityId: UUID;
  action: AuditAction;
  /** Additional details about the event. */
  details: Record<string, unknown>;
  /** IP address of the client that initiated the action. */
  ipAddress: string | null;
  /** User-Agent header of the client. */
  userAgent: string | null;
  /** Hash of the previous event for chain integrity. */
  previousHash: string | null;
  /** Hash of this event (including previousHash for chaining). */
  eventHash: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Audit Log Query
// ---------------------------------------------------------------------------

/**
 * Query parameters for searching audit log entries.
 */
export interface AuditLogQuery {
  page: number;
  perPage: number;
  filters: AuditLogFilters;
}

// ---------------------------------------------------------------------------
// Audit Log Filters
// ---------------------------------------------------------------------------

/**
 * Filter parameters for narrowing audit log queries.
 */
export interface AuditLogFilters {
  /** Filter by event types. */
  eventTypes: string[];
  /** Filter by entity types. */
  entityTypes: string[];
  /** Filter by user IDs. */
  userIds: UUID[];
  /** Start of the date range (ISO 8601). */
  dateFrom: string;
  /** End of the date range (ISO 8601). */
  dateTo: string;
  /** Full-text search across event details. */
  search: string;
}
