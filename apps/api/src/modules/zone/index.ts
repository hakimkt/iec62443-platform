import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { zoneRoutes } from './routes.js';

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
// Zone module plugin
// ---------------------------------------------------------------------------

export interface ZoneModuleOptions {
  connectionString?: string;
}

async function zoneModule(
  app: FastifyInstance,
  _options: ZoneModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(zoneRoutes, { db });
}

export const zonePlugin = fp(zoneModule, {
  name: 'zone-module',
  fastify: '5.x',
});

export { ZoneService } from './zone.service.js';
export { ZoneController } from './zone.controller.js';
