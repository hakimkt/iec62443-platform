import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { adminRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Admin module plugin
// ---------------------------------------------------------------------------

export interface AdminModuleOptions {
  connectionString?: string;
}

async function adminModule(
  app: FastifyInstance,
  _options: AdminModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(adminRoutes, { db });
}

export const adminPlugin = fp(adminModule, {
  name: 'admin-module',
  fastify: '5.x',
});

export { AdminService } from './admin.service.js';
export { AdminController } from './admin.controller.js';
