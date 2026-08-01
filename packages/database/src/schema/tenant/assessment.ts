import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Templates ────────────────────────────────────────────────────────────

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  iecPart: varchar('iec_part', { length: 20 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  sections: jsonb('sections').default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Questions ────────────────────────────────────────────────────────────

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => templates.id),
  section: varchar('section', { length: 200 }),
  clauseRef: varchar('clause_ref', { length: 50 }),
  questionText: text('question_text').notNull(),
  requirementId: varchar('requirement_id', { length: 100 }),
  maxScore: smallint('max_score').default(4),
  guidanceText: text('guidance_text'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
});

// ── Engagements ──────────────────────────────────────────────────────────

export const engagements = pgTable(
  'engagements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(),
    iecPart: varchar('iec_part', { length: 20 }),
    scopeSystemId: uuid('scope_system_id'),
    targetSl: smallint('target_sl'),
    currentSl: smallint('current_sl'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    leadAssessorId: uuid('lead_assessor_id'),
    startDate: date('start_date'),
    targetDate: date('target_date'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    templateId: uuid('template_id').references(() => templates.id),
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
      'engagements_type_check',
      sql`${table.type} IN ('gap', 'system', 'component', 'csms', 'custom')`,
    ),
    check(
      'engagements_target_sl_check',
      sql`${table.targetSl} BETWEEN 0 AND 4`,
    ),
    check(
      'engagements_current_sl_check',
      sql`${table.currentSl} BETWEEN 0 AND 4`,
    ),
    check(
      'engagements_status_check',
      sql`${table.status} IN ('draft', 'in_progress', 'review', 'completed', 'archived')`,
    ),
    index('idx_engagements_status').on(table.status),
  ],
);

// ── Responses ────────────────────────────────────────────────────────────

export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    engagementId: uuid('engagement_id')
      .notNull()
      .references(() => engagements.id),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id),
    score: smallint('score'),
    maturityLevel: varchar('maturity_level', { length: 30 }),
    assessorNotes: text('assessor_notes'),
    evidenceRefs: uuid('evidence_refs').array().default([]),
    findingRefs: uuid('finding_refs').array().default([]),
    answeredBy: uuid('answered_by'),
    answeredAt: timestamp('answered_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check('responses_score_check', sql`${table.score} >= 0`),
    check(
      'responses_maturity_level_check',
      sql`${table.maturityLevel} IN ('implemented', 'partial', 'not_implemented', 'na')`,
    ),
    unique('responses_unique_engagement_question').on(
      table.engagementId,
      table.questionId,
    ),
    index('idx_responses_engagement').on(table.engagementId),
  ],
);

// ── Scorecards ───────────────────────────────────────────────────────────

export const scorecards = pgTable('scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  engagementId: uuid('engagement_id')
    .notNull()
    .references(() => engagements.id),
  category: varchar('category', { length: 200 }),
  currentSl: smallint('current_sl'),
  targetSl: smallint('target_sl'),
  gap: smallint('gap').generatedAlwaysAs(
    sql`(target_sl - current_sl)`,
  ),
  totalQuestions: integer('total_questions'),
  answeredCount: integer('answered_count'),
  compliancePct: numeric('compliance_pct', { precision: 5, scale: 2 }),
  snapshotAt: timestamp('snapshot_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
