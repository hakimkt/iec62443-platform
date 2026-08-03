import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { assetRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Type augmentations for Fastify decorators
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyInstance {
    db: NodePgDatabase;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    tenantId?: string;
    tenantSchema?: string;
  }
}

// ---------------------------------------------------------------------------
// Asset module plugin
// ---------------------------------------------------------------------------

export interface AssetModuleOptions {
  /** Database connection string (optional — uses app.db if already decorated) */
  connectionString?: string;
}

async function assetModule(app: FastifyInstance, _options: AssetModuleOptions) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(assetRoutes, {
    db,
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const assetPlugin = fp(assetModule, {
  name: 'asset-module',
  fastify: '5.x',
});

// Re-export for convenience
export { AssetService } from './asset.service.js';
export { AssetController } from './asset.controller.js';
