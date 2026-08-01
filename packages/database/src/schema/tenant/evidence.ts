import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Files ────────────────────────────────────────────────────────────────

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  storageBackend: varchar('storage_backend', { length: 20 })
    .notNull()
    .default('s3'),
  storageKey: varchar('storage_key', { length: 1000 }).notNull(),
  bucket: varchar('bucket', { length: 255 }),
  encryptionKeyId: varchar('encryption_key_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Items ────────────────────────────────────────────────────────────────

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    evidenceType: varchar('evidence_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default('active'),
    fileId: uuid('file_id'),
    fileName: varchar('file_name', { length: 500 }),
    fileSize: bigint('file_size', { mode: 'bigint' }),
    mimeType: varchar('mime_type', { length: 200 }),
    sha256Hash: varchar('sha256_hash', { length: 64 }),
    md5Hash: varchar('md5_hash', { length: 32 }),
    collectedBy: uuid('collected_by'),
    collectedAt: timestamp('collected_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    retentionUntil: timestamp('retention_until', { withTimezone: true }),
    tags: text('tags').array().default([]),
    metadata: jsonb('metadata').default({}),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'items_evidence_type_check',
      sql`${table.evidenceType} IN ('document', 'screenshot', 'config', 'log', 'scan_result', 'network_capture', 'certificate', 'interview', 'other')`,
    ),
    check(
      'items_status_check',
      sql`${table.status} IN ('active', 'archived', 'superseded')`,
    ),
    index('idx_items_sha256_hash').on(table.sha256Hash),
    index('idx_items_status').on(table.status),
  ],
);

// ── Links ────────────────────────────────────────────────────────────────

export const links = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    evidenceId: uuid('evidence_id')
      .notNull()
      .references(() => items.id),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('links_unique_evidence_entity').on(
      table.evidenceId,
      table.entityType,
      table.entityId,
    ),
    index('idx_links_entity').on(table.entityType, table.entityId),
  ],
);

// ── Chain of Custody ─────────────────────────────────────────────────────

export const chainOfCustody = pgTable('chain_of_custody', {
  id: uuid('id').primaryKey().defaultRandom(),
  evidenceId: uuid('evidence_id')
    .notNull()
    .references(() => items.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  userId: uuid('user_id').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
