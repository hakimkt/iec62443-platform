import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { purdueRoutes } from './routes.js';

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
// Purdue module plugin
// ---------------------------------------------------------------------------

export interface PurdueModuleOptions {
  connectionString?: string;
}

async function purdueModule(
  app: FastifyInstance,
  _options: PurdueModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(purdueRoutes, { db });
}

export const purduePlugin = fp(purdueModule, {
  name: 'purdue-module',
  fastify: '5.x',
});

export { PurdueService } from './purdue.service.js';
export { PurdueController } from './purdue.controller.js';
