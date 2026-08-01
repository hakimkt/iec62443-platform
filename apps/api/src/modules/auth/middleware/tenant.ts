import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { eq, and } from 'drizzle-orm';
import { tenants, tenantMemberships } from '@iec62443/database';
import type { TokenPayload } from '@iec62443/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    tenantSchema?: string;
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export interface TenantMiddlewareOptions {
  /** Routes that should skip tenant validation */
  publicRoutes?: string[];
}

async function tenantMiddleware(
  app: FastifyInstance,
  options: TenantMiddlewareOptions,
) {
  const { publicRoutes = [] } = options;

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip for public routes
    if (publicRoutes.includes(request.url)) {
      return;
    }

    // Skip for non-API routes
    if (!request.url.startsWith('/api/') && !request.url.startsWith('/auth')) {
      return;
    }

    // Skip for OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return;
    }

    // Skip if no user is authenticated (let route handlers enforce auth)
    const user = request.user as TokenPayload | undefined;
    if (!user) {
      return;
    }

    // Skip for API key auth that doesn't require tenant context
    if (request.authType === 'api_key') {
      if (user.tenant_id) {
        request.tenantId = user.tenant_id;
        // Fall through to validate tenant status and membership
      } else {
        return;
      }
    }

    // Extract tenant_id from the JWT
    const tenantId = user.tenant_id;
    if (!tenantId) {
      // User has no tenant — this is valid for platform-level operations
      return;
    }

    const db = request.server.db;
    if (!db) {
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database connection is not available.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate tenant exists and is active
    const [tenant] = await db
      .select({
        id: tenants.id,
        schemaName: tenants.schemaName,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return reply.status(403).send({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'The specified tenant does not exist.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (tenant.status === 'suspended' || tenant.status === 'archived') {
      return reply.status(403).send({
        error: {
          code: 'TENANT_INACTIVE',
          message: `The tenant is ${tenant.status} and cannot be accessed.`,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate user is a member of the tenant
    const [membership] = await db
      .select({ id: tenantMemberships.id })
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.tenantId, tenantId),
          eq(tenantMemberships.userId, user.sub),
          eq(tenantMemberships.status, 'active'),
        ),
      )
      .limit(1);

    if (!membership) {
      return reply.status(403).send({
        error: {
          code: 'TENANT_ACCESS_DENIED',
          message: 'You are not a member of this tenant.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Set the tenant context on the request
    request.tenantId = tenantId;
    request.tenantSchema = tenant.schemaName;

    // NOTE: We do NOT set SET search_path on the database connection here.
    // Session-level SET search_path would pollute the connection pool and
    // cause subsequent requests on the same connection to fail (e.g., login
    // queries against the public.users table).
    // Instead, the service layer uses db.transaction() with SET LOCAL search_path
    // inside the transaction, which is scoped to the transaction and does not
    // contaminate the pool.
  });
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const tenantPlugin = fp(tenantMiddleware, {
  name: 'tenant-context',
  fastify: '5.x',
});
