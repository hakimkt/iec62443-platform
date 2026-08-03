import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ── Assets ───────────────────────────────────────────────────────────────

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }),
    criticality: varchar('criticality', { length: 30 }),
    vendor: varchar('vendor', { length: 255 }),
    model: varchar('model', { length: 255 }),
    firmwareVersion: varchar('firmware_version', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    macAddress: varchar('mac_address', { length: 17 }),
    networkSegment: varchar('network_segment', { length: 255 }),
    purdueLevel: smallint('purdue_level'),
    zoneId: uuid('zone_id'),
    location: varchar('location', { length: 500 }),
    operationalStatus: varchar('operational_status', { length: 30 })
      .notNull()
      .default('operational'),
    installDate: timestamp('install_date', { withTimezone: true }),
    lastPatchDate: timestamp('last_patch_date', { withTimezone: true }),
    eolDate: timestamp('eol_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('assets_purdue_level_check', sql`${table.purdueLevel} BETWEEN 0 AND 5`),
    check(
      'assets_operational_status_check',
      sql`${table.operationalStatus} IN ('operational', 'decommissioned', 'maintenance', 'standby')`,
    ),
    index('idx_assets_type_status').on(table.type, table.operationalStatus),
  ],
);

// ── Relationships ────────────────────────────────────────────────────────

export const relationships = pgTable('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceAssetId: uuid('source_asset_id')
    .notNull()
    .references(() => assets.id),
  targetAssetId: uuid('target_asset_id')
    .notNull()
    .references(() => assets.id),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  protocol: varchar('protocol', { length: 100 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Import Jobs ──────────────────────────────────────────────────────────

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    totalRecords: integer('total_records'),
    processedRecords: integer('processed_records'),
    succeededCount: integer('succeeded_count'),
    failedCount: integer('failed_count'),
    errors: jsonb('errors').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'import_jobs_status_check',
      sql`${table.status} IN ('pending', 'processing', 'completed', 'failed')`,
    ),
  ],
);
