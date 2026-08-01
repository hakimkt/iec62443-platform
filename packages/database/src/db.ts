import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as platformSchema from './schema/platform/index.js';
import * as tenantSchema from './schema/tenant/index.js';

export type PlatformSchema = typeof platformSchema;
export type TenantSchema = typeof tenantSchema;

/**
 * Create a Drizzle instance connected to the platform schema.
 * Uses the shared `platform` schema for cross-tenant tables.
 */
export function createDb(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema: platformSchema });
}

/**
 * Create a Drizzle instance connected to a specific tenant schema.
 * Sets `search_path` to the tenant's schema so all tenant-scoped
 * queries resolve against that schema automatically.
 */
export function createTenantDb(connectionString: string, schemaName: string) {
  const pool = new pg.Pool({
    connectionString,
    options: `-c search_path=${schemaName},public`,
  });
  return drizzle(pool, { schema: tenantSchema });
}
