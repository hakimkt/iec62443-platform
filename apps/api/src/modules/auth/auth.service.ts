import { eq, and, desc } from 'drizzle-orm';
import argon2 from 'argon2';
import { authenticator } from 'otplib';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  users,
  tenants,
  tenantMemberships,
  roles,
  userRoles,
  auditEvents,
} from '@iec62443/database';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  resolvePermissions,
  type TokenPayload,
  type TokenPair,
  type JwtConfig,
} from '@iec62443/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
  tenants: LoginTenant[];
}

export type LoginResult =
  | { type: 'token'; tokenPair: TokenPair; user: LoginUser; tenants: LoginTenant[] }
  | { type: 'mfa_required'; requestId: string; message: string };

export interface LoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  status: string;
}

export interface LoginTenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
}

export interface MfaSetupResult {
  secret: string;
  qrCodeUri: string;
}

export interface RefreshResult {
  tokenPair: TokenPair;
}

// ---------------------------------------------------------------------------
// Password reset token store (in-memory for now; replace with Redis/DB)
// ---------------------------------------------------------------------------

interface PasswordResetEntry {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

const passwordResetStore = new Map<string, PasswordResetEntry>();

// ---------------------------------------------------------------------------
// MFA challenge store (in-memory for now; replace with Redis)
// ---------------------------------------------------------------------------

interface MfaChallengeEntry {
  userId: string;
  mfaSecret: string;
  expiresAt: Date;
}

const mfaChallengeStore = new Map<string, MfaChallengeEntry>();

// ---------------------------------------------------------------------------
// Audit hash chain helper
// ---------------------------------------------------------------------------

async function computeEventHash(
  data: string,
  previousHash: string | null,
): Promise<string> {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AuthService {
  constructor(
    private db: NodePgDatabase,
    private jwtConfig: JwtConfig,
    private mfaIssuer: string = 'IEC62443-Platform',
  ) {}

  // ── Register ─────────────────────────────────────────────────────────

  async registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<RegisterResult> {
    // Check if email already exists
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw Object.assign(new Error('A user with this email already exists'), {
        statusCode: 409,
        code: 'CONFLICT',
      });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        status: 'active',
        mfaEnabled: false,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
        createdAt: users.createdAt,
      });

    if (!newUser) {
      throw Object.assign(new Error('Failed to create user'), {
        statusCode: 500,
        code: 'USER_CREATE_FAILED',
      });
    }

    // Audit: user created
    await this.createAuditEvent({
      userId: newUser.id,
      eventType: 'auth.user_registered',
      entityType: 'user',
      entityId: newUser.id,
      action: 'create',
      details: { email, firstName, lastName },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    // Auto-login: generate token pair
    const tokenPair = await this.generateTokenPair(newUser.id, ipAddress, userAgent);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        status: newUser.status,
        createdAt: newUser.createdAt.toISOString(),
      },
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tenants: await this.getUserTenants(newUser.id),
    };
  }

  // ── Login ────────────────────────────────────────────────────────────

  async loginUser(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    // Fetch user
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    if (user.status === 'locked' && user.lockedUntil && new Date() < user.lockedUntil) {
      throw Object.assign(
        new Error(
          `Account is locked until ${user.lockedUntil.toISOString()}. Please try again later.`,
        ),
        { statusCode: 423, code: 'ACCOUNT_LOCKED' },
      );
    }

    // If lockout expired, reset status
    if (user.status === 'locked' && user.lockedUntil && new Date() >= user.lockedUntil) {
      await this.db
        .update(users)
        .set({ status: 'active', failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      user.status = 'active';
      user.failedAttempts = 0;
    }

    // Verify password
    if (!user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
      const newAttempts = user.failedAttempts + 1;
      const lockThreshold = 5;

      if (newAttempts >= lockThreshold) {
        const lockDuration = 30 * 60 * 1000; // 30 minutes
        await this.db
          .update(users)
          .set({
            failedAttempts: newAttempts,
            status: 'locked',
            lockedUntil: new Date(Date.now() + lockDuration),
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Audit: account locked
        await this.createAuditEvent({
          userId: user.id,
          eventType: 'auth.account_locked',
          entityType: 'user',
          entityId: user.id,
          action: 'update',
          details: { failedAttempts: newAttempts, lockThreshold },
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
        });
      } else {
        await this.db
          .update(users)
          .set({ failedAttempts: newAttempts, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      throw Object.assign(new Error('Invalid email or password'), {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check account is active
    if (user.status === 'suspended') {
      throw Object.assign(new Error('Account is suspended'), {
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // Reset failed attempts and update last login
    await this.db
      .update(users)
      .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // If MFA enabled, generate challenge
    if (user.mfaEnabled && user.mfaSecret) {
      const requestId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      mfaChallengeStore.set(requestId, {
        userId: user.id,
        mfaSecret: user.mfaSecret,
        expiresAt,
      });

      // Audit: MFA challenge issued
      await this.createAuditEvent({
        userId: user.id,
        eventType: 'auth.mfa_challenge_issued',
        entityType: 'user',
        entityId: user.id,
        action: 'read',
        details: { requestId },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      });

      return {
        type: 'mfa_required',
        requestId,
        message: 'MFA verification required. Please provide the TOTP code.',
      };
    }

    // Generate token pair
    const tokenPair = await this.generateTokenPair(user.id, ipAddress, userAgent);

    // Audit: successful login
    await this.createAuditEvent({
      userId: user.id,
      eventType: 'auth.login_success',
      entityType: 'user',
      entityId: user.id,
      action: 'read',
      details: { mfaUsed: false },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return {
      type: 'token',
      tokenPair,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
      },
      tenants: await this.getUserTenants(user.id),
    };
  }

  // ── Refresh Tokens ───────────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<RefreshResult> {
    let payload: TokenPayload;
    try {
      payload = await verifyToken(refreshToken, this.jwtConfig);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), {
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Verify it's a refresh token
    if ((payload as Record<string, unknown>)['type'] !== 'refresh') {
      throw Object.assign(new Error('Invalid token type'), {
        statusCode: 401,
        code: 'INVALID_TOKEN_TYPE',
      });
    }

    // Verify user still exists and is active
    const [user] = await this.db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'active') {
      throw Object.assign(new Error('User account is not active'), {
        statusCode: 401,
        code: 'USER_INACTIVE',
      });
    }

    const tokenPair = await this.generateTokenPair(user.id);

    // Audit: token refreshed
    await this.createAuditEvent({
      userId: user.id,
      eventType: 'auth.token_refreshed',
      entityType: 'user',
      entityId: user.id,
      action: 'read',
      details: {},
    });

    return { tokenPair };
  }

  // ── Logout ───────────────────────────────────────────────────────────

  async logoutUser(refreshToken: string): Promise<void> {
    // In a production system, we would add the token jti to a revocation
    // list (e.g., Redis set). For now, we verify the token is valid and
    // record the logout event.
    let payload: TokenPayload | null = null;
    try {
      payload = await verifyToken(refreshToken, this.jwtConfig);
    } catch {
      // Token is already invalid — nothing to revoke
      return;
    }

    if (payload) {
      // Audit: logout
      await this.createAuditEvent({
        userId: payload.sub,
        eventType: 'auth.logout',
        entityType: 'user',
        entityId: payload.sub,
        action: 'read',
        details: { jti: payload.jti },
      });
    }
  }

  // ── Forgot Password ─────────────────────────────────────────────────

  async forgotPassword(email: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const [user] = await this.db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to avoid user enumeration
    if (!user) {
      return crypto.randomUUID(); // Fake token to prevent timing attacks
    }

    const resetToken = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    passwordResetStore.set(tokenHash, {
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    // Audit: password reset requested
    await this.createAuditEvent({
      userId: user.id,
      eventType: 'auth.password_reset_requested',
      entityType: 'user',
      entityId: user.id,
      action: 'update',
      details: {},
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    // ── Email placeholder ──
    // In production, send an email with the reset link containing the token.
    // Example: sendPasswordResetEmail(user.email, resetToken);
    // TODO: Implement email delivery. The reset token must NOT be returned in the API response.

    return 'ok';
  }

  // ── Reset Password ──────────────────────────────────────────────────

  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const entry = passwordResetStore.get(tokenHash);

    if (!entry) {
      throw Object.assign(new Error('Invalid or expired reset token'), {
        statusCode: 400,
        code: 'INVALID_RESET_TOKEN',
      });
    }

    if (new Date() > entry.expiresAt) {
      passwordResetStore.delete(tokenHash);
      throw Object.assign(new Error('Reset token has expired'), {
        statusCode: 400,
        code: 'RESET_TOKEN_EXPIRED',
      });
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.db
      .update(users)
      .set({
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, entry.userId));

    // Consume the token
    passwordResetStore.delete(tokenHash);

    // Audit: password reset completed
    await this.createAuditEvent({
      userId: entry.userId,
      eventType: 'auth.password_reset_completed',
      entityType: 'user',
      entityId: entry.userId,
      action: 'update',
      details: {},
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  }

  // ── MFA Setup ────────────────────────────────────────────────────────

  async setupMfa(userId: string): Promise<MfaSetupResult> {
    const [user] = await this.db
      .select({ id: users.id, mfaEnabled: users.mfaEnabled, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.mfaEnabled) {
      throw Object.assign(new Error('MFA is already enabled for this account'), {
        statusCode: 409,
        code: 'MFA_ALREADY_ENABLED',
      });
    }

    const secret = authenticator.generateSecret();
    const qrCodeUri = authenticator.keyuri(user.email, this.mfaIssuer, secret);

    // Store the secret temporarily — it won't be activated until verified
    // We store it in mfaSecret but keep mfaEnabled = false until verifyMfaSetup
    await this.db
      .update(users)
      .set({ mfaSecret: secret, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { secret, qrCodeUri };
  }

  // ── Verify MFA Setup ────────────────────────────────────────────────

  async verifyMfaSetup(
    userId: string,
    code: string,
    secret: string | null,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const [user] = await this.db
      .select({ id: users.id, mfaEnabled: users.mfaEnabled, mfaSecret: users.mfaSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    // Use the server-stored secret from the database.
    // If a secret was passed from the client, verify it matches the stored one
    // (backwards compatibility), but prefer the DB-stored secret for security.
    const storedSecret = user.mfaSecret;
    if (!storedSecret) {
      throw Object.assign(new Error('MFA setup not initiated. Call setupMfa first.'), {
        statusCode: 400,
        code: 'MFA_NOT_SETUP',
      });
    }

    if (secret !== null && secret !== storedSecret) {
      throw Object.assign(new Error('MFA secret mismatch'), {
        statusCode: 400,
        code: 'MFA_SECRET_MISMATCH',
      });
    }

    // Verify the TOTP code using the server-stored secret
    const isValid = authenticator.verify({ token: code, secret: storedSecret });
    if (!isValid) {
      throw Object.assign(new Error('Invalid TOTP code'), {
        statusCode: 400,
        code: 'INVALID_TOTP_CODE',
      });
    }

    // Enable MFA
    await this.db
      .update(users)
      .set({ mfaEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Audit: MFA enabled
    await this.createAuditEvent({
      userId,
      eventType: 'auth.mfa_enabled',
      entityType: 'user',
      entityId: userId,
      action: 'update',
      details: {},
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  }

  // ── MFA Challenge ───────────────────────────────────────────────────

  async challengeMfa(
    requestId: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const entry = mfaChallengeStore.get(requestId);

    if (!entry) {
      throw Object.assign(new Error('Invalid or expired MFA challenge'), {
        statusCode: 400,
        code: 'INVALID_MFA_CHALLENGE',
      });
    }

    if (new Date() > entry.expiresAt) {
      mfaChallengeStore.delete(requestId);
      throw Object.assign(new Error('MFA challenge has expired'), {
        statusCode: 400,
        code: 'MFA_CHALLENGE_EXPIRED',
      });
    }

    // Verify TOTP code
    const isValid = authenticator.verify({ token: code, secret: entry.mfaSecret });
    if (!isValid) {
      throw Object.assign(new Error('Invalid TOTP code'), {
        statusCode: 400,
        code: 'INVALID_TOTP_CODE',
      });
    }

    // Consume the challenge
    mfaChallengeStore.delete(requestId);

    // Fetch user for response
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, entry.userId))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    // Generate token pair
    const tokenPair = await this.generateTokenPair(user.id, ipAddress, userAgent);

    // Audit: MFA login success
    await this.createAuditEvent({
      userId: user.id,
      eventType: 'auth.login_success',
      entityType: 'user',
      entityId: user.id,
      action: 'read',
      details: { mfaUsed: true },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return {
      type: 'token',
      tokenPair,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
      },
      tenants: await this.getUserTenants(user.id),
    };
  }

  // ── Disable MFA ─────────────────────────────────────────────────────

  async disableMfa(
    userId: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.mfaEnabled) {
      throw Object.assign(new Error('MFA is not enabled for this account'), {
        statusCode: 400,
        code: 'MFA_NOT_ENABLED',
      });
    }

    // Verify current password
    if (!user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
      throw Object.assign(new Error('Invalid password'), {
        statusCode: 401,
        code: 'INVALID_PASSWORD',
      });
    }

    // Disable MFA
    await this.db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Audit: MFA disabled
    await this.createAuditEvent({
      userId,
      eventType: 'auth.mfa_disabled',
      entityType: 'user',
      entityId: userId,
      action: 'update',
      details: {},
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  }

  // ── Get Current User (GET /auth/me) ──────────────────────────────────

  async getCurrentUser(userId: string): Promise<{
    user: LoginUser;
    tenants: LoginTenant[];
  }> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        mfaEnabled: users.mfaEnabled,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw Object.assign(new Error('User not found'), {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
      },
      tenants: await this.getUserTenants(userId),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async getUserTenants(userId: string): Promise<LoginTenant[]> {
    const memberships = await this.db
      .select({
        tenantId: tenantMemberships.tenantId,
        role: tenantMemberships.role,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantStatus: tenants.status,
      })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'active'),
        ),
      );

    return memberships.map((m) => ({
      id: m.tenantId,
      name: m.tenantName,
      slug: m.tenantSlug,
      role: m.role ?? 'viewer',
      status: m.tenantStatus,
    }));
  }

  private async generateTokenPair(
    userId: string,
    _ipAddress?: string,
    _userAgent?: string,
  ): Promise<TokenPair> {
    // Fetch the user's primary tenant membership and roles
    const [membership] = await this.db
      .select({
        tenantId: tenantMemberships.tenantId,
        role: tenantMemberships.role,
      })
      .from(tenantMemberships)
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'active'),
        ),
      )
      .limit(1);

    let tenantId = '';
    let tenantSlug = '';
    let roleNames: string[] = [];

    if (membership) {
      tenantId = membership.tenantId;

      // Fetch tenant details
      const [tenant] = await this.db
        .select({ slug: tenants.slug })
        .from(tenants)
        .where(eq(tenants.id, membership.tenantId))
        .limit(1);

      tenantSlug = tenant?.slug ?? '';

      // Fetch user roles for this tenant
      const userRolesRows = await this.db
        .select({ name: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.tenantId, membership.tenantId),
          ),
        );

      roleNames = userRolesRows.map((r) => r.name);

      // Also include the membership role if not already in the list
      if (membership.role && !roleNames.includes(membership.role)) {
        roleNames.push(membership.role);
      }
    }

    // Resolve permissions from roles
    const permissions = resolvePermissions(roleNames);

    const accessToken = await signAccessToken(
      {
        sub: userId,
        tenant_id: tenantId,
        tenant_slug: tenantSlug,
        roles: roleNames,
        permissions,
      },
      this.jwtConfig,
    );

    const refreshToken = await signRefreshToken(
      userId,
      tenantId,
      this.jwtConfig,
    );

    return { accessToken, refreshToken };
  }

  private async createAuditEvent(params: {
    userId: string | null;
    eventType: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'read';
    details: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
    tenantId?: string | null;
  }): Promise<void> {
    try {
      // Get the last audit event hash for chaining
      const [lastEvent] = await this.db
        .select({ eventHash: auditEvents.eventHash })
        .from(auditEvents)
        .orderBy(desc(auditEvents.id))
        .limit(1);

      const previousHash = lastEvent?.eventHash ?? null;

      // Compute the hash for this event
      const dataToHash = JSON.stringify({
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        timestamp: new Date().toISOString(),
      });
      const eventHash = await computeEventHash(dataToHash, previousHash);

      await this.db.insert(auditEvents).values({
        tenantId: params.tenantId ?? null,
        userId: params.userId,
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        previousHash,
        eventHash,
      });
    } catch (error) {
      // Audit failures should not break the primary operation
      console.error('Failed to create audit event:', error);
    }
  }
}
