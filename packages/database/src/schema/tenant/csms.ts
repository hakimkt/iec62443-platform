import {
  check,
  date,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Frameworks ───────────────────────────────────────────────────────────

export const frameworks = pgTable('frameworks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  organizationId: uuid('organization_id'),
  version: varchar('version', { length: 20 }).notNull().default('1.0'),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Elements ─────────────────────────────────────────────────────────────

export const elements = pgTable(
  'elements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frameworkId: uuid('framework_id')
      .notNull()
      .references(() => frameworks.id),
    category: varchar('category', { length: 100 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    requirementRef: varchar('requirement_ref', { length: 100 }),
    implementationStatus: varchar('implementation_status', { length: 30 }),
    maturityScore: smallint('maturity_score'),
    ownerId: uuid('owner_id'),
    lastReviewed: timestamp('last_reviewed', { withTimezone: true }),
    nextReview: date('next_review'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'elements_category_check',
      sql`${table.category} IN ('SM-1', 'SM-2', 'SM-3', 'SM-4', 'SM-5', 'SM-6', 'SM-7', 'SM-8', 'SM-9', 'SM-10', 'SM-11', 'SM-12')`,
    ),
    check(
      'elements_implementation_status_check',
      sql`${table.implementationStatus} IN ('implemented', 'partial', 'planned', 'not_started', 'na')`,
    ),
    check(
      'elements_maturity_score_check',
      sql`${table.maturityScore} BETWEEN 0 AND 4`,
    ),
  ],
);

// ── Policies ─────────────────────────────────────────────────────────────

export const policies = pgTable(
  'policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frameworkId: uuid('framework_id')
      .notNull()
      .references(() => frameworks.id),
    elementId: uuid('element_id').references(() => elements.id),
    title: varchar('title', { length: 500 }).notNull(),
    version: varchar('version', { length: 20 }).notNull().default('1.0'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    body: text('body'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    reviewCycle: integer('review_cycle').default(365),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'policies_status_check',
      sql`${table.status} IN ('draft', 'review', 'approved', 'deprecated')`,
    ),
  ],
);

// ── Improvement Plans ────────────────────────────────────────────────────

export const improvementPlans = pgTable(
  'improvement_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    frameworkId: uuid('framework_id')
      .notNull()
      .references(() => frameworks.id),
    elementId: uuid('element_id').references(() => elements.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    priority: varchar('priority', { length: 20 }),
    targetDate: date('target_date'),
    status: varchar('status', { length: 30 }).notNull().default('planned'),
    ownerId: uuid('owner_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'improvement_plans_priority_check',
      sql`${table.priority} IN ('low', 'medium', 'high', 'critical')`,
    ),
  ],
);
