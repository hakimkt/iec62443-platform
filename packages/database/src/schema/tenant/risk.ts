import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ── Registers ────────────────────────────────────────────────────────────

export const registers = pgTable('registers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 500 }).notNull(),
  scopeType: varchar('scope_type', { length: 50 }),
  scopeId: uuid('scope_id'),
  ownerId: uuid('owner_id'),
  status: varchar('status', { length: 30 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Entries ──────────────────────────────────────────────────────────────

export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    registerId: uuid('register_id')
      .notNull()
      .references(() => registers.id),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }),
    threatSource: varchar('threat_source', { length: 200 }),
    vulnerability: text('vulnerability'),
    threatCategory: varchar('threat_category', { length: 30 }),
    threatCapability: varchar('threat_capability', { length: 30 }),
    attackVector: varchar('attack_vector', { length: 30 }),
    threatScenario: text('threat_scenario'),
    vulnerabilityClass: varchar('vulnerability_class', { length: 30 }),
    cveRefs: varchar('cve_refs').array().default([]),
    icsaRefs: varchar('icsa_refs').array().default([]),
    assetIds: uuid('asset_ids').array().default([]),
    zoneIds: uuid('zone_ids').array().default([]),
    likelihood: smallint('likelihood'),
    impact: smallint('impact'),
    inherentScore: smallint('inherent_score').generatedAlwaysAs(sql`(likelihood * impact)`),
    riskLevel: varchar('risk_level', { length: 20 }).generatedAlwaysAs(
      sql`CASE
        WHEN (likelihood * impact) <= 4 THEN 'low'
        WHEN (likelihood * impact) <= 9 THEN 'medium'
        WHEN (likelihood * impact) <= 15 THEN 'high'
        ELSE 'critical'
      END`,
    ),
    treatment: varchar('treatment', { length: 30 }),
    residualLikelihood: smallint('residual_likelihood'),
    residualImpact: smallint('residual_impact'),
    residualScore: smallint('residual_score').generatedAlwaysAs(
      sql`(COALESCE(residual_likelihood, likelihood) * COALESCE(residual_impact, impact))`,
    ),
    riskOwnerId: uuid('risk_owner_id'),
    iecRequirement: varchar('iec_requirement', { length: 100 }),
    status: varchar('status', { length: 30 }).notNull().default('identified'),
    identifiedAt: timestamp('identified_at', { withTimezone: true }).notNull().defaultNow(),
    reassessBy: date('reassess_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'entries_category_check',
      sql`${table.category} IN ('safety', 'operational', 'environmental', 'financial', 'reputational', 'regulatory')`,
    ),
    check('entries_likelihood_check', sql`${table.likelihood} BETWEEN 1 AND 5`),
    check('entries_impact_check', sql`${table.impact} BETWEEN 1 AND 5`),
    check(
      'entries_treatment_check',
      sql`${table.treatment} IN ('mitigate', 'transfer', 'accept', 'avoid', 'pending')`,
    ),
    check('entries_residual_likelihood_check', sql`${table.residualLikelihood} BETWEEN 1 AND 5`),
    check('entries_residual_impact_check', sql`${table.residualImpact} BETWEEN 1 AND 5`),
    check(
      'entries_threat_category_check',
      sql`${table.threatCategory} IN ('accidental', 'deliberate', 'natural', 'failure')`,
    ),
    check(
      'entries_threat_capability_check',
      sql`${table.threatCapability} IN ('low', 'moderate', 'high', 'very_high')`,
    ),
    check(
      'entries_attack_vector_check',
      sql`${table.attackVector} IN ('network', 'adjacent', 'local', 'physical')`,
    ),
    check(
      'entries_vulnerability_class_check',
      sql`${table.vulnerabilityClass} IN ('design', 'implementation', 'configuration', 'operational', 'physical')`,
    ),
    index('idx_entries_register_level').on(table.registerId, table.riskLevel),
  ],
);

// ── Treatments ───────────────────────────────────────────────────────────

export const treatments = pgTable(
  'treatments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    riskId: uuid('risk_id')
      .notNull()
      .references(() => entries.id),
    type: varchar('type', { length: 30 }).notNull(),
    description: text('description').notNull(),
    responsibleId: uuid('responsible_id'),
    targetDate: date('target_date'),
    status: varchar('status', { length: 30 }).notNull().default('planned'),
    effectiveness: varchar('effectiveness', { length: 30 }),
    costEstimate: numeric('cost_estimate', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'treatments_status_check',
      sql`${table.status} IN ('planned', 'in_progress', 'completed', 'cancelled')`,
    ),
  ],
);

// ── Acceptances ──────────────────────────────────────────────────────────

export const acceptances = pgTable('acceptances', {
  id: uuid('id').primaryKey().defaultRandom(),
  riskId: uuid('risk_id')
    .notNull()
    .references(() => entries.id),
  acceptedBy: uuid('accepted_by').notNull(),
  justification: text('justification').notNull(),
  approvalChain: jsonb('approval_chain'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  reviewDate: date('review_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Matrix Config ────────────────────────────────────────────────────────

export const matrixConfig = pgTable('matrix_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  registerId: uuid('register_id')
    .notNull()
    .references(() => registers.id),
  likelihoodLabels: jsonb('likelihood_labels').notNull(),
  impactLabels: jsonb('impact_labels').notNull(),
  thresholds: jsonb('thresholds').notNull(),
  colorScheme: jsonb('color_scheme').default({}),
});
