import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { csmsRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// CSMS module plugin
// ---------------------------------------------------------------------------

export interface CSMSModuleOptions {
  connectionString?: string;
}

async function csmsModule(app: FastifyInstance, _options: CSMSModuleOptions) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(csmsRoutes, { db });
}

export const csmsPlugin = fp(csmsModule, {
  name: 'csms-module',
  fastify: '5.x',
});

export { CSMSService } from './csms.service.js';
export { CSMSController } from './csms.controller.js';
