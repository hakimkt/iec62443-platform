import { hasPermission, type TokenPayload } from '@iec62443/auth';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// ---------------------------------------------------------------------------
// RBAC Middleware
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyInstance {
    requirePermission: (
      permission: string,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function rbacMiddleware(app: FastifyInstance) {
  app.decorate(
    'requirePermission',
    (permission: string) => async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload | undefined;

      if (!user) {
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

      if (!hasPermission(user, permission)) {
        return reply.status(403).send({
          error: {
            code: 'PERMISSION_DENIED',
            message: `You do not have permission to perform this action: ${permission}`,
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

export const rbacPlugin = fp(rbacMiddleware, {
  name: 'rbac',
  fastify: '5.x',
});
