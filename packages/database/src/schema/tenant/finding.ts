import {
  boolean,
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
import { engagements } from './assessment.js';

// ── Findings ─────────────────────────────────────────────────────────────

export const findings = pgTable(
  'findings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    engagementId: uuid('engagement_id').references(() => engagements.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    severity: varchar('severity', { length: 20 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('open'),
    category: varchar('category', { length: 100 }),
    subcategory: varchar('subcategory', { length: 100 }),
    iecRequirement: varchar('iec_requirement', { length: 100 }),
    assetIds: uuid('asset_ids').array().default([]),
    zoneIds: uuid('zone_ids').array().default([]),
    riskIds: uuid('risk_ids').array().default([]),
    assignedTo: uuid('assigned_to'),
    dueDate: timestamp('due_date', { withTimezone: true }),
    discoveredAt: timestamp('discovered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedBy: uuid('closed_by'),
    resolutionNote: text('resolution_note'),
    source: varchar('source', { length: 50 }).default('manual'),
    externalRef: varchar('external_ref', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'findings_severity_check',
      sql`${table.severity} IN ('critical', 'high', 'medium', 'low', 'informational')`,
    ),
    check(
      'findings_status_check',
      sql`${table.status} IN ('draft', 'open', 'acknowledged', 'remediation_planned', 'in_progress', 'verification', 'verified', 'closed', 'false_positive', 'risk_accepted')`,
    ),
    index('idx_findings_engagement_status').on(
      table.engagementId,
      table.status,
    ),
    index('idx_findings_severity_status').on(table.severity, table.status),
  ],
);

// ── Status History ───────────────────────────────────────────────────────

export const statusHistory = pgTable('status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  findingId: uuid('finding_id')
    .notNull()
    .references(() => findings.id),
  fromStatus: varchar('from_status', { length: 30 }),
  toStatus: varchar('to_status', { length: 30 }).notNull(),
  changedBy: uuid('changed_by').notNull(),
  reason: text('reason'),
  changedAt: timestamp('changed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Comments ─────────────────────────────────────────────────────────────

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  findingId: uuid('finding_id')
    .notNull()
    .references(() => findings.id),
  authorId: uuid('author_id').notNull(),
  body: text('body').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
