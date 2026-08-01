import {
  bigserial,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const auditEvents = pgTable(
  'audit_events',
  {
    id: bigserial('id', { mode: 'bigint' }).primaryKey(),
    tenantId: uuid('tenant_id'),
    userId: uuid('user_id'),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    action: varchar('action', { length: 50 }).notNull(),
    details: jsonb('details'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    previousHash: varchar('previous_hash', { length: 64 }),
    eventHash: varchar('event_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'audit_events_action_check',
      sql`${table.action} IN ('create', 'update', 'delete', 'read')`,
    ),
    index('idx_audit_events_entity').on(table.entityType, table.entityId),
    index('idx_audit_events_tenant_time').on(
      table.tenantId,
      sql`${table.createdAt} DESC`,
    ),
    index('idx_audit_events_user').on(
      table.userId,
      sql`${table.createdAt} DESC`,
    ),
  ],
);
