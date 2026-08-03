import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { riskRoutes } from './routes.js';

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
// Risk module plugin
// ---------------------------------------------------------------------------

export interface RiskModuleOptions {
  connectionString?: string;
}

async function riskModule(app: FastifyInstance, _options: RiskModuleOptions) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(riskRoutes, { db });
}

export const riskPlugin = fp(riskModule, {
  name: 'risk-module',
  fastify: '5.x',
});

export { RiskService } from './risk.service.js';
export { RiskController } from './risk.controller.js';
