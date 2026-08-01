import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

import { verifyToken, type JwtConfig, type TokenPayload } from '@iec62443/auth';
import { eq, and } from 'drizzle-orm';
import { apiKeys, users } from '@iec62443/database';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
    authType?: 'jwt' | 'api_key';
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export interface JwtMiddlewareOptions {
  jwtConfig: JwtConfig;
  /** Routes that should skip authentication */
  publicRoutes?: string[];
}

async function jwtMiddleware(
  app: FastifyInstance,
  options: JwtMiddlewareOptions,
) {
  const { jwtConfig, publicRoutes = [] } = options;

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip authentication for public routes
    if (publicRoutes.includes(request.url)) {
      return;
    }

    // Skip for non-API routes (health, docs, etc.)
    if (!request.url.startsWith('/api/') && !request.url.startsWith('/auth')) {
      return;
    }

    // Skip for OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return;
    }

    // Try API key authentication first
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined;
    if (apiKeyHeader) {
      const payload = await authenticateApiKey(request, apiKeyHeader);
      if (payload) {
        request.user = payload;
        request.authType = 'api_key';
        return;
      }
      // If API key was provided but invalid, reject immediately
      return reply.status(401).send({
        error: {
          code: 'INVALID_API_KEY',
          message: 'The provided API key is invalid or has been revoked.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Try JWT authentication
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      // No auth header — let the route handler decide if auth is needed
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          code: 'INVALID_AUTH_HEADER',
          message: 'Authorization header must use Bearer scheme.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return reply.status(401).send({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Bearer token is required.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      const payload = await verifyToken(token, jwtConfig);
      request.user = payload;
      request.authType = 'jwt';
    } catch {
      return reply.status(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'The provided token is invalid or has expired.',
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
}

// ---------------------------------------------------------------------------
// API Key Authentication
// ---------------------------------------------------------------------------

async function authenticateApiKey(
  request: FastifyRequest,
  apiKey: string,
): Promise<TokenPayload | null> {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const keyPrefix = apiKey.slice(0, 8);

  const db = request.server.db;
  if (!db) {
    return null;
  }

  // Look up the API key
  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.keyPrefix, keyPrefix),
      ),
    )
    .limit(1);

  if (!keyRecord) {
    return null;
  }

  // Check if key is revoked
  if (keyRecord.revokedAt) {
    return null;
  }

  // Check if key is expired
  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
    return null;
  }

  // Update last used timestamp (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id))
    .catch(() => {
      // Silently ignore update failures
    });

  // Fetch the user associated with this API key
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, keyRecord.userId))
    .limit(1);

  if (!user || user.status !== 'active') {
    return null;
  }

  // Build a TokenPayload from the API key's context
  const scopes = (keyRecord.scopes as string[]) ?? [];

  return {
    sub: keyRecord.userId,
    tenant_id: keyRecord.tenantId,
    tenant_slug: '',
    roles: [],
    permissions: scopes,
    jti: keyRecord.id,
    iss: '',
    aud: '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };
}

// ---------------------------------------------------------------------------
// Export as Fastify plugin
// ---------------------------------------------------------------------------

export const jwtAuthPlugin = fp(jwtMiddleware, {
  name: 'jwt-auth',
  fastify: '5.x',
});
