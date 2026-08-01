import type { FastifyRequest, FastifyReply } from 'fastify';

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaVerifySchema,
  mfaChallengeSchema,
} from '@iec62443/shared-schemas';

import type { AuthService } from './auth.service.js';

// ---------------------------------------------------------------------------
// Response envelope helpers
// ---------------------------------------------------------------------------

function successResponse<T>(data: T, requestId: string) {
  return {
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class AuthController {
  constructor(private authService: AuthService) {}

  // ── POST /auth/register ──────────────────────────────────────────────

  async register(request: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const result = await this.authService.registerUser(
        parsed.data.email,
        parsed.data.password,
        parsed.data.firstName,
        parsed.data.lastName,
        request.ip,
        request.headers['user-agent'],
      );

      return reply.status(201).send(successResponse(result, request.id));
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/login ─────────────────────────────────────────────────

  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const result = await this.authService.loginUser(
        parsed.data.email,
        parsed.data.password,
        request.ip,
        request.headers['user-agent'],
      );

      if (result.type === 'mfa_required') {
        return reply.status(200).send(
          successResponse(
            {
              mfaRequired: true,
              requestId: result.requestId,
              message: result.message,
            },
            request.id,
          ),
        );
      }

      return reply.status(200).send(
        successResponse(
          {
            accessToken: result.tokenPair.accessToken,
            refreshToken: result.tokenPair.refreshToken,
            user: result.user,
          },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/refresh ───────────────────────────────────────────────

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const parsed = refreshTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const result = await this.authService.refreshTokens(parsed.data.refreshToken);

      return reply.status(200).send(
        successResponse(
          {
            accessToken: result.tokenPair.accessToken,
            refreshToken: result.tokenPair.refreshToken,
          },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/logout ────────────────────────────────────────────────

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const parsed = refreshTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      await this.authService.logoutUser(parsed.data.refreshToken);

      return reply.status(200).send(
        successResponse({ loggedOut: true }, request.id),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/forgot-password ───────────────────────────────────────

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const token = await this.authService.forgotPassword(
        parsed.data.email,
        request.ip,
        request.headers['user-agent'],
      );

      return reply.status(200).send(
        successResponse(
          {
            message: 'If an account with this email exists, a password reset link has been sent.',
            token, // In production, this would be sent via email only
          },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/reset-password ────────────────────────────────────────

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      await this.authService.resetPassword(
        parsed.data.token,
        parsed.data.password,
        request.ip,
        request.headers['user-agent'],
      );

      return reply.status(200).send(
        successResponse(
          { message: 'Password has been reset successfully.' },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/mfa/setup ─────────────────────────────────────────────

  async setupMfa(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as unknown as { user: { sub: string } }).user?.sub;
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      const result = await this.authService.setupMfa(userId);

      return reply.status(200).send(
        successResponse(
          {
            secret: result.secret,
            qrCodeUri: result.qrCodeUri,
          },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/mfa/verify ────────────────────────────────────────────

  async verifyMfaSetup(request: FastifyRequest, reply: FastifyReply) {
    const parsed = mfaVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    const userId = (request as unknown as { user: { sub: string } }).user?.sub;
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    try {
      await this.authService.verifyMfaSetup(
        userId,
        parsed.data.code,
        parsed.data.secret,
        request.ip,
        request.headers['user-agent'],
      );

      return reply.status(200).send(
        successResponse(
          { mfaEnabled: true, message: 'MFA has been enabled successfully.' },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── POST /auth/mfa/challenge ─────────────────────────────────────────

  async challengeMfa(request: FastifyRequest, reply: FastifyReply) {
    const parsed = mfaChallengeSchema.safeParse(request.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Invalid request body', request.id, details),
      );
    }

    try {
      const result = await this.authService.challengeMfa(
        parsed.data.requestId,
        parsed.data.code,
        request.ip,
        request.headers['user-agent'],
      );

      if (result.type === 'mfa_required') {
        // Should not happen from challengeMfa, but handle defensively
        return reply.status(200).send(
          successResponse(
            {
              mfaRequired: true,
              requestId: result.requestId,
              message: result.message,
            },
            request.id,
          ),
        );
      }

      return reply.status(200).send(
        successResponse(
          {
            accessToken: result.tokenPair.accessToken,
            refreshToken: result.tokenPair.refreshToken,
            user: result.user,
          },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── DELETE /auth/mfa ─────────────────────────────────────────────────

  async disableMfa(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as unknown as { user: { sub: string } }).user?.sub;
    if (!userId) {
      return reply.status(401).send(
        errorResponse('UNAUTHORIZED', 'Authentication required', request.id),
      );
    }

    const body = request.body as { password?: string } | undefined;
    if (!body?.password) {
      return reply.status(400).send(
        errorResponse('VALIDATION_ERROR', 'Password is required', request.id, [
          { field: 'password', message: 'Password is required to disable MFA' },
        ]),
      );
    }

    try {
      await this.authService.disableMfa(
        userId,
        body.password,
        request.ip,
        request.headers['user-agent'],
      );

      return reply.status(200).send(
        successResponse(
          { mfaEnabled: false, message: 'MFA has been disabled successfully.' },
          request.id,
        ),
      );
    } catch (error: unknown) {
      return this.handleError(error, request, reply);
    }
  }

  // ── Error handler ────────────────────────────────────────────────────

  private handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
    const err = error as {
      message?: string;
      statusCode?: number;
      code?: string;
    };

    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? (statusCode >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR');

    if (statusCode >= 500) {
      request.log.error(error);
    } else {
      request.log.warn(error);
    }

    return reply.status(statusCode).send(
      errorResponse(
        code,
        statusCode >= 500 ? 'An unexpected error occurred.' : (err.message ?? 'An error occurred'),
        request.id,
      ),
    );
  }
}
