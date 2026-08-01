import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { assessmentRoutes } from './routes.js';

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
// Assessment module plugin
// ---------------------------------------------------------------------------

export interface AssessmentModuleOptions {
  /** Database connection string (optional — uses app.db if already decorated) */
  connectionString?: string;
}

async function assessmentModule(
  app: FastifyInstance,
  _options: AssessmentModuleOptions,
) {
  // Use the database instance already decorated on the Fastify app
  // (set up by the auth module or app bootstrap)
  const db = app.db as unknown as NodePgDatabase;

  // ── Register assessment routes (no prefix — routes define their own paths) ──
  await app.register(assessmentRoutes, {
    db,
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const assessmentPlugin = fp(assessmentModule, {
  name: 'assessment-module',
  fastify: '5.x',
});

// Re-export for convenience
export { AssessmentService } from './assessment.service.js';
export { AssessmentController } from './assessment.controller.js';
