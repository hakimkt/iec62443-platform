import {
  check,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { clients } from './client.js';

// ── Projects ─────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('planning'),
    clientId: uuid('client_id').references(() => clients.id),
    ownerId: uuid('owner_id'),
    startDate: date('start_date'),
    targetDate: date('target_date'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
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
      'projects_type_check',
      sql`${table.type} IN ('risk_assessment', 'gap_analysis', 'csms_assessment', 'network_segmentation', 'remediation', 'compliance_audit', 'consulting', 'custom')`,
    ),
    check(
      'projects_status_check',
      sql`${table.status} IN ('planning', 'active', 'in_progress', 'on_hold', 'completed', 'cancelled')`,
    ),
  ],
);
