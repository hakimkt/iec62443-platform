/**
 * IEC 62443 User Domain Types
 *
 * Covers user identity, profiles, and tenant membership summaries.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/** Account status of a user. */
export type UserStatus = 'active' | 'suspended' | 'locked';

/**
 * A platform user identity.
 */
export interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
  /** Number of consecutive failed login attempts. */
  failedAttempts: number;
  /** If locked, the time until which the account is locked. */
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

/**
 * A user's profile including their tenant memberships.
 * Used for authenticated user responses.
 */
export interface UserProfile {
  userId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  /** Tenants the user belongs to. */
  tenants: TenantMemberSummary[];
}

// ---------------------------------------------------------------------------
// Tenant Member Summary
// ---------------------------------------------------------------------------

/**
 * Summary of a user's membership in a single tenant.
 */
export interface TenantMemberSummary {
  tenantId: UUID;
  tenantName: string;
  tenantSlug: string;
  /** Role name within the tenant. */
  role: string;
}
