import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { remediationRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Remediation module plugin
// ---------------------------------------------------------------------------

export interface RemediationModuleOptions {
  connectionString?: string;
}

async function remediationModule(
  app: FastifyInstance,
  _options: RemediationModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(remediationRoutes, { db });
}

export const remediationPlugin = fp(remediationModule, {
  name: 'remediation-module',
  fastify: '5.x',
});

export { RemediationService } from './remediation.service.js';
export { RemediationController } from './remediation.controller.js';
