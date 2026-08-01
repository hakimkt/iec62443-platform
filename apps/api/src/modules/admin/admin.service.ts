import { eq, and, desc, count, ilike, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import {
  users,
  roles,
  tenantMemberships,
  apiKeys,
  auditEvents,
  tenants,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberFilters {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface AuditLogFilters {
  page?: number;
  perPage?: number;
  eventTypes?: string[];
  entityTypes?: string[];
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

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

export class AdminService {
  constructor(
    private db: NodePgDatabase,
    private tenantId: string,
    tenantSchema?: string,
  ) {
    void tenantSchema;
  }

  // ── Members ─────────────────────────────────────────────────────────

  async listMembers(filters: MemberFilters) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 25, 100);
    const offset = (page - 1) * perPage;
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(tenantMemberships.status, filters.status));
    }
    if (filters.role) {
      conditions.push(eq(tenantMemberships.role, filters.role));
    }
    if (filters.search) {
      conditions.push(ilike(users.email, `%${filters.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
        .select({
          id: tenantMemberships.id,
          tenantId: tenantMemberships.tenantId,
          userId: tenantMemberships.userId,
          role: tenantMemberships.role,
          status: tenantMemberships.status,
          invitedBy: tenantMemberships.invitedBy,
          joinedAt: tenantMemberships.joinedAt,
          createdAt: tenantMemberships.createdAt,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        })
        .from(tenantMemberships)
        .innerJoin(users, eq(tenantMemberships.userId, users.id))
        .where(whereClause)
        .orderBy(desc(tenantMemberships.createdAt))
        .limit(perPage)
        .offset(offset);
    const totalResult = await this.db
        .select({ count: count() })
        .from(tenantMemberships)
        .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: items.map((m) => ({
        id: m.id,
        tenantId: m.tenantId,
        userId: m.userId,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        avatarUrl: m.avatarUrl,
        role: m.role,
        status: m.status,
        invitedBy: m.invitedBy,
        joinedAt: m.joinedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async inviteMember(email: string, role: string, invitedBy: string) {
    // Find or create user by email
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create a placeholder user
      const [newUser] = await this.db
        .insert(users)
        .values({
          email,
          firstName: email.split('@')[0] ?? 'User',
          lastName: '',
          passwordHash: '',
          status: 'active',
        })
        .returning();

      if (!newUser) {
        throw Object.assign(new Error('Failed to create user'), {
          statusCode: 500,
          code: 'USER_CREATE_FAILED',
        });
      }
      userId = newUser.id;
    }

    // Check if membership already exists
    const [existingMembership] = await this.db
      .select()
      .from(tenantMemberships)
      .where(and(
        eq(tenantMemberships.tenantId, this.tenantId),
        eq(tenantMemberships.userId, userId),
      ))
      .limit(1);

    if (existingMembership) {
      throw Object.assign(new Error('User is already a member of this tenant'), {
        statusCode: 409,
        code: 'MEMBERSHIP_EXISTS',
      });
    }

    const [membership] = await this.db
      .insert(tenantMemberships)
      .values({
        tenantId: this.tenantId,
        userId,
        role,
        status: 'invited',
        invitedBy,
      })
      .returning();

    if (!membership) {
      throw Object.assign(new Error('Failed to create membership'), {
        statusCode: 500,
        code: 'MEMBERSHIP_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId: invitedBy,
      eventType: 'admin.member_invited',
      entityType: 'tenant_membership',
      entityId: membership.id,
      action: 'create',
      details: { email, role },
    });

    return {
      id: membership.id,
      tenantId: membership.tenantId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      invitedBy: membership.invitedBy,
      joinedAt: membership.joinedAt?.toISOString() ?? null,
      createdAt: membership.createdAt.toISOString(),
    };
  }

  async updateMember(userId: string, role: string, updatedBy: string) {
    const [membership] = await this.db
      .select()
      .from(tenantMemberships)
      .where(and(
        eq(tenantMemberships.tenantId, this.tenantId),
        eq(tenantMemberships.userId, userId),
      ))
      .limit(1);

    if (!membership) {
      throw Object.assign(new Error('Membership not found'), {
        statusCode: 404,
        code: 'MEMBERSHIP_NOT_FOUND',
      });
    }

    await this.db
      .update(tenantMemberships)
      .set({ role })
      .where(and(
        eq(tenantMemberships.tenantId, this.tenantId),
        eq(tenantMemberships.userId, userId),
      ));

    await this.createAuditEvent({
      userId: updatedBy,
      eventType: 'admin.member_updated',
      entityType: 'tenant_membership',
      entityId: membership.id,
      action: 'update',
      details: { userId, newRole: role },
    });
  }

  async removeMember(userId: string, removedBy: string) {
    await this.db
      .delete(tenantMemberships)
      .where(and(
        eq(tenantMemberships.tenantId, this.tenantId),
        eq(tenantMemberships.userId, userId),
      ));

    await this.createAuditEvent({
      userId: removedBy,
      eventType: 'admin.member_removed',
      entityType: 'tenant_membership',
      entityId: userId,
      action: 'delete',
      details: { removedUserId: userId },
    });
  }

  // ── Roles ───────────────────────────────────────────────────────────

  async listRoles() {
    const items = await this.db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, this.tenantId))
      .orderBy(desc(roles.createdAt));

    return items.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createRole(data: { name: string; description?: string; permissions: string[] }, userId: string) {
    const [newRole] = await this.db
      .insert(roles)
      .values({
        tenantId: this.tenantId,
        name: data.name,
        description: data.description ?? null,
        isSystem: false,
        permissions: data.permissions,
      })
      .returning();

    if (!newRole) {
      throw Object.assign(new Error('Failed to create role'), {
        statusCode: 500,
        code: 'ROLE_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'admin.role_created',
      entityType: 'role',
      entityId: newRole.id,
      action: 'create',
      details: { name: data.name },
    });

    return {
      id: newRole.id,
      tenantId: newRole.tenantId,
      name: newRole.name,
      description: newRole.description,
      isSystem: newRole.isSystem,
      permissions: newRole.permissions,
      createdAt: newRole.createdAt.toISOString(),
    };
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissions?: string[] }, userId: string) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.permissions !== undefined) updateData['permissions'] = data.permissions;

    await this.db
      .update(roles)
      .set(updateData)
      .where(and(eq(roles.id, id), eq(roles.tenantId, this.tenantId)));

    await this.createAuditEvent({
      userId,
      eventType: 'admin.role_updated',
      entityType: 'role',
      entityId: id,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });
  }

  async deleteRole(id: string, userId: string) {
    await this.db.delete(roles).where(and(eq(roles.id, id), eq(roles.tenantId, this.tenantId)));

    await this.createAuditEvent({
      userId,
      eventType: 'admin.role_deleted',
      entityType: 'role',
      entityId: id,
      action: 'delete',
      details: {},
    });
  }

  // ── API Keys ────────────────────────────────────────────────────────

  async listApiKeys() {
    const items = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, this.tenantId))
      .orderBy(desc(apiKeys.createdAt));

    return items.map((k) => ({
      id: k.id,
      tenantId: k.tenantId,
      userId: k.userId,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      expiresAt: k.expiresAt?.toISOString() ?? null,
      revokedAt: k.revokedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async createApiKey(data: { name: string; scopes?: string[]; expiresAt?: string }, userId: string) {
    const rawKey = `iec62443_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);

    const [newKey] = await this.db
      .insert(apiKeys)
      .values({
        tenantId: this.tenantId,
        userId,
        name: data.name,
        keyHash,
        keyPrefix,
        scopes: data.scopes ?? [],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning();

    if (!newKey) {
      throw Object.assign(new Error('Failed to create API key'), {
        statusCode: 500,
        code: 'API_KEY_CREATE_FAILED',
      });
    }

    await this.createAuditEvent({
      userId,
      eventType: 'admin.api_key_created',
      entityType: 'api_key',
      entityId: newKey.id,
      action: 'create',
      details: { name: data.name },
    });

    return {
      id: newKey.id,
      name: newKey.name,
      keyPrefix: newKey.keyPrefix,
      key: rawKey,
      scopes: newKey.scopes,
      expiresAt: newKey.expiresAt?.toISOString() ?? null,
      createdAt: newKey.createdAt.toISOString(),
    };
  }

  async revokeApiKey(id: string, userId: string) {
    await this.db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, this.tenantId)));

    await this.createAuditEvent({
      userId,
      eventType: 'admin.api_key_revoked',
      entityType: 'api_key',
      entityId: id,
      action: 'update',
      details: {},
    });
  }

  // ── Audit Log ───────────────────────────────────────────────────────

  async getAuditLog(filters: AuditLogFilters) {
    const page = filters.page ?? 1;
    const perPage = Math.min(filters.perPage ?? 25, 100);
    const offset = (page - 1) * perPage;
    const conditions = [eq(auditEvents.tenantId, this.tenantId)];

    if (filters.eventTypes && filters.eventTypes.length > 0) {
      conditions.push(sql`${auditEvents.eventType} IN (${sql.join(filters.eventTypes.map((t) => sql`${t}`), sql`, `)})`);
    }
    if (filters.entityTypes && filters.entityTypes.length > 0) {
      conditions.push(sql`${auditEvents.entityType} IN (${sql.join(filters.entityTypes.map((t) => sql`${t}`), sql`, `)})`);
    }
    if (filters.userIds && filters.userIds.length > 0) {
      conditions.push(sql`${auditEvents.userId} IN (${sql.join(filters.userIds.map((t) => sql`${t}`), sql`, `)})`);
    }
    if (filters.dateFrom) {
      conditions.push(sql`${auditEvents.createdAt} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${auditEvents.createdAt} <= ${filters.dateTo}`);
    }

    const whereClause = and(...conditions);

    const items = await this.db
        .select()
        .from(auditEvents)
        .where(whereClause)
        .orderBy(desc(auditEvents.id))
        .limit(perPage)
        .offset(offset);
    const totalResult = await this.db
        .select({ count: count() })
        .from(auditEvents)
        .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: items.map((e) => ({
        id: String(e.id),
        tenantId: e.tenantId,
        userId: e.userId,
        eventType: e.eventType,
        entityType: e.entityType,
        entityId: e.entityId,
        action: e.action,
        details: e.details,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        previousHash: e.previousHash,
        eventHash: e.eventHash,
        createdAt: e.createdAt.toISOString(),
      })),
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  // ── Tenant Settings ─────────────────────────────────────────────────

  async getTenantSettings() {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, this.tenantId))
      .limit(1);

    if (!tenant) {
      throw Object.assign(new Error('Tenant not found'), {
        statusCode: 404,
        code: 'TENANT_NOT_FOUND',
      });
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      settings: tenant.settings,
      storageQuota: tenant.storageQuota?.toString() ?? '0',
      storageUsed: tenant.storageUsed?.toString() ?? '0',
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }

  async updateTenantSettings(data: { name?: string; settings?: Record<string, unknown> }, userId: string) {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.settings !== undefined) updateData['settings'] = data.settings;

    await this.db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, this.tenantId));

    await this.createAuditEvent({
      userId,
      eventType: 'admin.tenant_settings_updated',
      entityType: 'tenant',
      entityId: this.tenantId,
      action: 'update',
      details: { updatedFields: Object.keys(data) },
    });

    return this.getTenantSettings();
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async createAuditEvent(params: {
    userId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    action: 'create' | 'update' | 'delete' | 'read';
    details: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      const [lastEvent] = await this.db
        .select({ eventHash: auditEvents.eventHash })
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, this.tenantId))
        .orderBy(desc(auditEvents.id))
        .limit(1);

      const previousHash = lastEvent?.eventHash ?? null;

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
        tenantId: this.tenantId,
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
      console.error('Failed to create audit event:', error);
    }
  }
}
