import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ── Models ───────────────────────────────────────────────────────────────

export const models = pgTable('models', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  facilityId: uuid('facility_id'),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Levels ───────────────────────────────────────────────────────────────

export const levels = pgTable('levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => models.id),
  levelNumber: numeric('level_number', { precision: 3, scale: 1 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  sortOrder: integer('sort_order').default(0),
});

// ── Asset Mappings ───────────────────────────────────────────────────────

export const assetMappings = pgTable(
  'asset_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => models.id),
    assetId: uuid('asset_id').notNull(),
    levelId: uuid('level_id')
      .notNull()
      .references(() => levels.id),
    assignedBy: uuid('assigned_by'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('asset_mappings_unique_model_asset').on(table.modelId, table.assetId)],
);

// ── Communication Rules ──────────────────────────────────────────────────

export const communicationRules = pgTable('communication_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => models.id),
  sourceLevelId: uuid('source_level_id')
    .notNull()
    .references(() => levels.id),
  targetLevelId: uuid('target_level_id')
    .notNull()
    .references(() => levels.id),
  isAllowed: boolean('is_allowed').notNull().default(false),
  condition: text('condition'),
  protocol: varchar('protocol', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
