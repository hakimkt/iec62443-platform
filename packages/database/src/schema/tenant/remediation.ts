import { sql } from 'drizzle-orm';
import { check, date, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// ── Plans ────────────────────────────────────────────────────────────────

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    findingIds: uuid('finding_ids').array().default([]),
    riskIds: uuid('risk_ids').array().default([]),
    ownerId: uuid('owner_id'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    budgetEstimate: numeric('budget_estimate', { precision: 12, scale: 2 }),
    budgetActual: numeric('budget_actual', { precision: 12, scale: 2 }),
    startDate: date('start_date'),
    targetDate: date('target_date'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'plans_status_check',
      sql`${table.status} IN ('draft', 'planned', 'approved', 'in_progress', 'completed', 'cancelled', 'overdue')`,
    ),
  ],
);

// ── Actions ──────────────────────────────────────────────────────────────

export const actions = pgTable(
  'actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    findingId: uuid('finding_id'),
    riskId: uuid('risk_id'),
    assigneeId: uuid('assignee_id'),
    status: varchar('status', { length: 30 }).notNull().default('planned'),
    startDate: date('start_date'),
    dueDate: date('due_date'),
    completedDate: date('completed_date'),
    costEstimate: numeric('cost_estimate', { precision: 12, scale: 2 }),
    costActual: numeric('cost_actual', { precision: 12, scale: 2 }),
    milestone: text('milestone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'actions_status_check',
      sql`${table.status} IN ('planned', 'in_progress', 'completed', 'cancelled')`,
    ),
  ],
);

// ── Verifications ────────────────────────────────────────────────────────

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actionId: uuid('action_id')
      .notNull()
      .references(() => actions.id),
    verifiedBy: uuid('verified_by').notNull(),
    verificationDate: timestamp('verification_date', { withTimezone: true }),
    result: varchar('result', { length: 30 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('verifications_result_check', sql`${table.result} IN ('pass', 'fail', 'partial')`),
  ],
);
