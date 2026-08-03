import { sql } from 'drizzle-orm';
import { bigint, check, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    schemaName: varchar('schema_name', { length: 63 }).unique().notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    plan: varchar('plan', { length: 50 }).notNull().default('professional'),
    settings: jsonb('settings').default({}),
    storageQuota: bigint('storage_quota', { mode: 'bigint' }).default(BigInt(10737418240)),
    storageUsed: bigint('storage_used', { mode: 'bigint' }).default(BigInt(0)),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'tenants_status_check',
      sql`${table.status} IN ('trial', 'active', 'suspended', 'archived')`,
    ),
  ],
);
