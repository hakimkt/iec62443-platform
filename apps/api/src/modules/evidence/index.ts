import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { evidenceRoutes } from './routes.js';

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
// Evidence module plugin
// ---------------------------------------------------------------------------

export interface EvidenceModuleOptions {
  /** Database connection string (optional — uses app.db if already decorated) */
  connectionString?: string;
}

async function evidenceModule(
  app: FastifyInstance,
  _options: EvidenceModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(evidenceRoutes, {
    db,
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const evidencePlugin = fp(evidenceModule, {
  name: 'evidence-module',
  fastify: '5.x',
});

// Re-export for convenience
export { EvidenceService } from './evidence.service.js';
export { EvidenceController } from './evidence.controller.js';
