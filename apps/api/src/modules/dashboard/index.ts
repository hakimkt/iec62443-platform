import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { dashboardRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Dashboard module plugin
// ---------------------------------------------------------------------------

export interface DashboardModuleOptions {
  connectionString?: string;
}

async function dashboardModule(app: FastifyInstance, _options: DashboardModuleOptions) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(dashboardRoutes, { db });
}

export const dashboardPlugin = fp(dashboardModule, {
  name: 'dashboard-module',
  fastify: '5.x',
});

export { DashboardService } from './dashboard.service.js';
export { DashboardController } from './dashboard.controller.js';
