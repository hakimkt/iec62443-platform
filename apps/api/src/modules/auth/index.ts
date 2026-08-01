import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { createDb } from '@iec62443/database';
import type { JwtConfig } from '@iec62443/auth';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { authRoutes } from './routes.js';
import { jwtAuthPlugin, type JwtMiddlewareOptions } from './middleware/jwt.js';
import { tenantPlugin, type TenantMiddlewareOptions } from './middleware/tenant.js';
import { rbacPlugin } from './middleware/rbac.js';

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
    requirePermission: (permission: string) => (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

// ---------------------------------------------------------------------------
// Auth module plugin
// ---------------------------------------------------------------------------

export interface AuthModuleOptions {
  /** Database connection string */
  connectionString: string;
  /** JWT configuration */
  jwtConfig: JwtConfig;
  /** MFA issuer name (shown in authenticator apps) */
  mfaIssuer?: string;
  /** Routes that should skip authentication */
  publicRoutes?: string[];
}

async function authModule(app: FastifyInstance, options: AuthModuleOptions) {
  const {
    connectionString,
    jwtConfig,
    mfaIssuer = 'IEC62443-Platform',
    publicRoutes = [],
  } = options;

  // ── Create the platform database connection ─────────────────────────
  const db = createDb(connectionString) as unknown as NodePgDatabase;

  // Decorate the app with the database instance so middleware can access it
  app.decorate('db', db);

  // ── Register the authenticate decorator ─────────────────────────────
  // This is used as a preHandler by routes that require authentication
  if (!app.hasDecorator('authenticate')) {
    app.decorate(
      'authenticate',
      async function (request: FastifyRequest, reply: FastifyReply) {
        if (!request.user) {
          return reply.status(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required.',
            },
            meta: {
              requestId: request.id,
              timestamp: new Date().toISOString(),
            },
          });
        }
      },
    );
  }

  // ── Public routes that don't require authentication ─────────────────
  const authPublicRoutes = [
    '/auth/register',
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/mfa/challenge',
    ...publicRoutes,
  ];

  // ── Register JWT middleware ─────────────────────────────────────────
  await app.register(jwtAuthPlugin, {
    jwtConfig,
    publicRoutes: authPublicRoutes,
  } satisfies JwtMiddlewareOptions);

  // ── Register tenant middleware ──────────────────────────────────────
  await app.register(tenantPlugin, {
    publicRoutes: authPublicRoutes,
  } satisfies TenantMiddlewareOptions);

  // ── Register RBAC middleware ────────────────────────────────────────
  await app.register(rbacPlugin);

  // ── Register auth routes under /auth prefix ─────────────────────────
  await app.register(authRoutes, {
    prefix: '/auth',
    db,
    jwtConfig,
    mfaIssuer,
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const authPlugin = fp(authModule, {
  name: 'auth-module',
  fastify: '5.x',
});

// Re-export types and utilities for convenience
export { AuthService } from './auth.service.js';
export { AuthController } from './auth.controller.js';
export { jwtAuthPlugin } from './middleware/jwt.js';
export { tenantPlugin } from './middleware/tenant.js';
