import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
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

// ── Zones ────────────────────────────────────────────────────────────────

export const zones = pgTable(
  'zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    zoneType: varchar('zone_type', { length: 50 }),
    securityLevel: smallint('security_level'),
    targetSl: smallint('target_sl'),
    achievedSl: smallint('achieved_sl'),
    parentZoneId: uuid('parent_zone_id'),
    purdueLevel: smallint('purdue_level'),
    facilityId: uuid('facility_id'),
    diagramX: numeric('diagram_x'),
    diagramY: numeric('diagram_y'),
    diagramWidth: numeric('diagram_width'),
    diagramHeight: numeric('diagram_height'),
    color: varchar('color', { length: 7 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'zones_zone_type_check',
      sql`${table.zoneType} IN ('process_control', 'safety_instrumented', 'manufacturing_ops', 'enterprise_it', 'idmz', 'remote_access', 'wireless', 'custom')`,
    ),
    check('zones_security_level_check', sql`${table.securityLevel} BETWEEN 0 AND 4`),
    check('zones_target_sl_check', sql`${table.targetSl} BETWEEN 0 AND 4`),
    check('zones_achieved_sl_check', sql`${table.achievedSl} BETWEEN 0 AND 4`),
    check('zones_purdue_level_check', sql`${table.purdueLevel} BETWEEN 0 AND 5`),
  ],
);

// ── Conduits ─────────────────────────────────────────────────────────────

export const conduits = pgTable(
  'conduits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    sourceZoneId: uuid('source_zone_id')
      .notNull()
      .references(() => zones.id),
    targetZoneId: uuid('target_zone_id')
      .notNull()
      .references(() => zones.id),
    conduitType: varchar('conduit_type', { length: 50 }),
    protocol: varchar('protocol', { length: 100 }),
    securityLevel: smallint('security_level'),
    targetSl: smallint('target_sl'),
    achievedSl: smallint('achieved_sl'),
    encryption: boolean('encryption').default(false),
    authentication: boolean('authentication').default(false),
    monitoring: boolean('monitoring').default(false),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'conduits_conduit_type_check',
      sql`${table.conduitType} IN ('hardwired', 'network', 'wireless', 'removable_media', 'human', 'other')`,
    ),
    check('conduits_security_level_check', sql`${table.securityLevel} BETWEEN 0 AND 4`),
    check('conduits_target_sl_check', sql`${table.targetSl} BETWEEN 0 AND 4`),
    check('conduits_achieved_sl_check', sql`${table.achievedSl} BETWEEN 0 AND 4`),
  ],
);

// ── Memberships ──────────────────────────────────────────────────────────

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => zones.id),
    assetId: uuid('asset_id').notNull(),
    assignedBy: uuid('assigned_by'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('memberships_unique_zone_asset').on(table.zoneId, table.assetId)],
);

// ── Segmentation Rules ───────────────────────────────────────────────────

export const segmentationRules = pgTable(
  'segmentation_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conduitId: uuid('conduit_id').references(() => conduits.id),
    zoneId: uuid('zone_id').references(() => zones.id),
    ruleType: varchar('rule_type', { length: 50 }).notNull(),
    description: text('description'),
    direction: varchar('direction', { length: 20 }),
    action: varchar('action', { length: 20 }),
    isCompliant: boolean('is_compliant').default(true),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'segmentation_rules_direction_check',
      sql`${table.direction} IN ('inbound', 'outbound', 'bidirectional')`,
    ),
    check(
      'segmentation_rules_action_check',
      sql`${table.action} IN ('allow', 'deny', 'inspect', 'proxy')`,
    ),
  ],
);
