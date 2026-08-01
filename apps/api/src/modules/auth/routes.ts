import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import type { JwtConfig } from '@iec62443/auth';

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export interface AuthRouteOptions {
  db: import('drizzle-orm/node-postgres').NodePgDatabase;
  jwtConfig: JwtConfig;
  mfaIssuer?: string;
}

// Shared response schema — allows nested properties through serialization
const responseSchema = {
  type: 'object' as const,
  properties: {
    data: { type: 'object' as const, additionalProperties: true },
    meta: { type: 'object' as const, additionalProperties: true },
  },
};

export async function authRoutes(
  app: FastifyInstance,
  options: AuthRouteOptions,
) {
  const { db, jwtConfig, mfaIssuer } = options;

  const authService = new AuthService(db, jwtConfig, mfaIssuer);
  const controller = new AuthController(authService);

  // ── Rate limiting for auth endpoints ────────────────────────────────
  // Login: 10 requests per minute per IP
  app.register(rateLimit, {
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip ?? 'unknown',
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many login attempts. Please try again in ${Math.ceil(Number(context.after) / 1000)} seconds.`,
      },
      meta: {
        requestId: '',
        timestamp: new Date().toISOString(),
      },
    }),
  });

  // ── GET /auth/me ─────────────────────────────────────────────────────
  app.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current user',
      description: 'Returns the authenticated user profile and their tenant memberships.',
      security: [{ bearerAuth: [] }],
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => controller.getMe(request, reply));

  // ── POST /auth/register ─────────────────────────────────────────────
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Creates a new user account with email and password.',
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 320 },
          password: { type: 'string', minLength: 8, maxLength: 128 },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
        },
      },
      response: { 201: responseSchema },
    },
  }, async (request, reply) => controller.register(request, reply));

  // ── POST /auth/login ────────────────────────────────────────────────
  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      description:
        'Authenticates a user with email and password. Returns JWT tokens or an MFA challenge if MFA is enabled.',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1, maxLength: 128 },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.login(request, reply));

  // ── POST /auth/refresh ──────────────────────────────────────────────
  app.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      description: 'Exchanges a valid refresh token for a new access/refresh token pair.',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.refresh(request, reply));

  // ── POST /auth/logout ───────────────────────────────────────────────
  app.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Logout',
      description: 'Invalidates the provided refresh token.',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.logout(request, reply));

  // ── POST /auth/forgot-password ──────────────────────────────────────
  app.post('/forgot-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Request password reset',
      description: 'Initiates a password reset flow by sending a reset token to the registered email.',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.forgotPassword(request, reply));

  // ── POST /auth/reset-password ───────────────────────────────────────
  app.post('/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset password with token',
      description: 'Completes a password reset using a valid reset token and new password.',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.resetPassword(request, reply));

  // ── POST /auth/mfa/setup ────────────────────────────────────────────
  app.post('/mfa/setup', {
    schema: {
      tags: ['Auth'],
      summary: 'Setup MFA (TOTP)',
      description: 'Generates a TOTP secret and QR code URI for MFA enrollment. Requires authentication.',
      security: [{ bearerAuth: [] }],
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => controller.setupMfa(request, reply));

  // ── POST /auth/mfa/verify ───────────────────────────────────────────
  app.post('/mfa/verify', {
    schema: {
      tags: ['Auth'],
      summary: 'Verify MFA setup',
      description: 'Validates a TOTP code to complete MFA enrollment. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['code', 'secret'],
        properties: {
          code: { type: 'string', minLength: 6, maxLength: 6, pattern: '^\\d{6}$' },
          secret: { type: 'string' },
        },
      },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => controller.verifyMfaSetup(request, reply));

  // ── POST /auth/mfa/challenge ────────────────────────────────────────
  app.post('/mfa/challenge', {
    schema: {
      tags: ['Auth'],
      summary: 'Respond to MFA challenge',
      description: 'Validates a TOTP code during login to complete MFA authentication.',
      body: {
        type: 'object',
        required: ['code', 'requestId'],
        properties: {
          code: { type: 'string', minLength: 6, maxLength: 6, pattern: '^\\d{6}$' },
          requestId: { type: 'string' },
        },
      },
      response: { 200: responseSchema },
    },
  }, async (request, reply) => controller.challengeMfa(request, reply));

  // ── DELETE /auth/mfa ────────────────────────────────────────────────
  app.delete('/mfa', {
    schema: {
      tags: ['Auth'],
      summary: 'Disable MFA',
      description: 'Disables MFA after verifying the current password. Requires authentication.',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string' },
        },
      },
      response: { 200: responseSchema },
    },
    preHandler: [app.authenticate],
  }, async (request, reply) => controller.disableMfa(request, reply));
}
