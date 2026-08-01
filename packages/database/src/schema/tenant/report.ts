import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Reports ────────────────────────────────────────────────────────────

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    config: jsonb('config').notNull().$type<{
      scope: string;
      scopeId: string | null;
      dateRange: { from: string; to: string } | null;
      includeSections: string[];
      format: string;
    }>(),
    fileUrl: text('file_url'),
    fileSize: integer('file_size'),
    generatedBy: uuid('generated_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    check('report_status_check', sql`${table.status} IN ('pending', 'processing', 'completed', 'failed')`),
    check('report_type_check', sql`${table.type} IN ('assessment_summary', 'risk_register', 'csms_gap', 'zone_topology', 'purdue_compliance', 'remediation_status', 'executive', 'audit_trail', 'certification_evidence', 'custom')`),
  ],
);
