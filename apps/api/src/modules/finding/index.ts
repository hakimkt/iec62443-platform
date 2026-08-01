import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { findingRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Type augmentations for Fastify decorators
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyInstance {
    db: NodePgDatabase;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    tenantId?: string;
    tenantSchema?: string;
  }
}

// ---------------------------------------------------------------------------
// Finding module plugin
// ---------------------------------------------------------------------------

export interface FindingModuleOptions {
  /** Database connection string (optional — uses app.db if already decorated) */
  connectionString?: string;
}

async function findingModule(
  app: FastifyInstance,
  _options: FindingModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(findingRoutes, {
    db,
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const findingPlugin = fp(findingModule, {
  name: 'finding-module',
  fastify: '5.x',
});

// Re-export for convenience
export { FindingService } from './finding.service.js';
export { FindingController } from './finding.controller.js';
