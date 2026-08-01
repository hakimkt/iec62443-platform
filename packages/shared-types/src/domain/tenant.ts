/**
 * IEC 62443 Tenant Domain Types
 *
 * Covers multi-tenant organisation management, tenant settings,
 * branding, membership, and storage.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

/** Lifecycle status of a tenant. */
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'archived';

/** Subscription plan tier. */
export type TenantPlan = 'professional' | 'enterprise';

/**
 * An organisation tenant in the multi-tenant platform.
 */
export interface Tenant {
  id: UUID;
  name: string;
  /** URL-friendly slug (e.g. "acme-corp"). */
  slug: string;
  /** Database schema name for tenant isolation. */
  schemaName: string;
  status: TenantStatus;
  plan: TenantPlan;
  settings: TenantSettings;
  /** Storage quota in bytes. */
  storageQuota: number;
  /** Storage used in bytes. */
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Tenant Settings
// ---------------------------------------------------------------------------

/**
 * Configurable settings for a tenant.
 */
export interface TenantSettings {
  locale: string;
  timezone: string;
  branding: BrandingConfig;
  /** Whether MFA is required for all users in the tenant. */
  mfaRequired: boolean;
  /** Password expiry in days (0 = never expires). */
  passwordExpiryDays: number;
  /** Session timeout in minutes. */
  sessionTimeoutMinutes: number;
  /** Maximum number of concurrent sessions per user. */
  maxConcurrentSessions: number;
}

// ---------------------------------------------------------------------------
// Branding Config
// ---------------------------------------------------------------------------

/**
 * Visual branding configuration for a tenant.
 */
export interface BrandingConfig {
  /** Primary brand colour (hex). */
  primaryColor: string;
  /** URL to the tenant's logo image. */
  logoUrl: string | null;
  /** Display name of the company. */
  companyName: string;
}

// ---------------------------------------------------------------------------
// Tenant Member
// ---------------------------------------------------------------------------

/** Status of a tenant membership. */
export type TenantMemberStatus = 'active' | 'invited' | 'suspended';

/**
 * A user's membership within a tenant, including their role.
 */
export interface TenantMember {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  /** Role name (references SystemRoleName or custom role). */
  role: string;
  status: TenantMemberStatus;
  invitedBy: UUID | null;
  joinedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Tenant Storage
// ---------------------------------------------------------------------------

/**
 * Storage usage information for a tenant.
 */
export interface TenantStorage {
  /** Total storage quota in bytes. */
  quotaBytes: number;
  /** Storage used in bytes. */
  usedBytes: number;
  /** Usage percentage (0–100). */
  usagePct: number;
}
