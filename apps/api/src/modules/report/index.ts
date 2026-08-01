import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { reportRoutes } from './routes.js';

// ---------------------------------------------------------------------------
// Report module plugin
// ---------------------------------------------------------------------------

export interface ReportModuleOptions {
  connectionString?: string;
}

async function reportModule(
  app: FastifyInstance,
  _options: ReportModuleOptions,
) {
  const db = app.db as unknown as NodePgDatabase;

  await app.register(reportRoutes, { db });
}

export const reportPlugin = fp(reportModule, {
  name: 'report-module',
  fastify: '5.x',
});

export { ReportService } from './report.service.js';
export { ReportController } from './report.controller.js';
