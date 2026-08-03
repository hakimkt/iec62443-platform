import crypto from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as platformSchema from '../schema/platform/index.js';
import * as tenantSchema from '../schema/tenant/index.js';

// ---------------------------------------------------------------------------
// Demo Tenant: Industrial Oil and Gas
// Environment: Large refinery and processing facility
// ---------------------------------------------------------------------------

const TENANT_ID = '11000000-0000-0000-0000-000000000001';
const TENANT_SLUG = 'industrial-oil-gas';
const TENANT_SCHEMA = 'tenant_iog';

// ── Demo Users ───────────────────────────────────────────────────────────

const DEMO_USERS = [
  {
    id: '21000000-0000-0000-0000-000000000001',
    email: 'ciso@industrial-oilgas.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    systemRole: 'tenant_owner',
    membershipRole: 'tenant_owner',
    roleId: '00000000-0000-0000-0000-000000000002',
  },
  {
    id: '21000000-0000-0000-0000-000000000002',
    email: 'ot.cybersecurity@industrial-oilgas.com',
    firstName: 'Marcus',
    lastName: 'Rivera',
    systemRole: 'tenant_admin',
    membershipRole: 'tenant_admin',
    roleId: '00000000-0000-0000-0000-000000000003',
  },
  {
    id: '21000000-0000-0000-0000-000000000003',
    email: 'lead.auditor@industrial-oilgas.com',
    firstName: 'Elena',
    lastName: 'Volkov',
    systemRole: 'lead_assessor',
    membershipRole: 'lead_assessor',
    roleId: '00000000-0000-0000-0000-000000000005',
  },
  {
    id: '21000000-0000-0000-0000-000000000004',
    email: 'control.engineer@industrial-oilgas.com',
    firstName: 'James',
    lastName: 'Okafor',
    systemRole: 'project_manager',
    membershipRole: 'project_manager',
    roleId: '00000000-0000-0000-0000-000000000004',
  },
  {
    id: '21000000-0000-0000-0000-000000000005',
    email: 'maintenance.engineer@industrial-oilgas.com',
    firstName: 'Priya',
    lastName: 'Sharma',
    systemRole: 'assessor',
    membershipRole: 'assessor',
    roleId: '00000000-0000-0000-0000-000000000006',
  },
  {
    id: '21000000-0000-0000-0000-000000000006',
    email: 'compliance.manager@industrial-oilgas.com',
    firstName: 'David',
    lastName: 'Larsson',
    systemRole: 'quality_manager',
    membershipRole: 'quality_manager',
    roleId: '00000000-0000-0000-0000-000000000007',
  },
] as const;

// ── Clients ──────────────────────────────────────────────────────────────

const DEMO_CLIENTS = [
  {
    id: '51000000-0000-0000-0000-000000000001',
    name: 'Gulf Coast Refining Corporation',
    industry: 'Oil & Gas',
    description:
      'Major petroleum refining and petrochemical company operating multiple refinery complexes along the Gulf Coast. Primary focus on crude oil processing, catalytic cracking, and hydrodesulfurization.',
    contactName: 'Robert Haines',
    contactEmail: 'r.haines@gulfcoastrefining.com',
    contactPhone: '+1-713-555-0100',
    website: 'https://www.gulfcoastrefining.com',
    address: '1200 Ship Channel Drive, Houston, TX 77029',
    status: 'active',
  },
  {
    id: '51000000-0000-0000-0000-000000000002',
    name: 'PetroChem Industries',
    industry: 'Petrochemical',
    description:
      'Integrated petrochemical manufacturer producing ethylene, propylene, and specialty chemicals. Operates continuous process plants with advanced DCS and SIS systems.',
    contactName: 'Amanda Torres',
    contactEmail: 'a.torres@petrochemind.com',
    contactPhone: '+1-504-555-0200',
    website: 'https://www.petrochemind.com',
    address: '850 Chemical Row, Baton Rouge, LA 70805',
    status: 'active',
  },
] as const;

// ── Projects ─────────────────────────────────────────────────────────────

const DEMO_PROJECTS = [
  {
    id: '61000000-0000-0000-0000-000000000001',
    name: 'Refinery IEC 62443 Security Assessment 2026',
    description:
      'Comprehensive IEC 62443-3-2 risk assessment for the Gulf Coast Refinery complex. Covers all process control zones, safety instrumented systems, and the iDMZ. Includes gap analysis against IEC 62443-3-3 requirements for SL-2 target.',
    type: 'risk_assessment',
    status: 'in_progress',
    clientId: '51000000-0000-0000-0000-000000000001',
    ownerId: '21000000-0000-0000-0000-000000000003',
    startDate: '2026-01-15',
    targetDate: '2026-08-31',
    metadata: {
      iecPart: '3-2',
      targetSl: 2,
      currentSl: 0,
      assessmentType: 'gap',
    },
  },
  {
    id: '61000000-0000-0000-0000-000000000002',
    name: 'OT Network Segmentation Improvement Program',
    description:
      'Multi-phase program to improve network segmentation between Purdue levels 0-3 and the enterprise IT network (Level 4-5). Includes deployment of iDMZ infrastructure, firewall rule remediation, and conduit hardening per IEC 62443-3-3 requirements.',
    type: 'network_segmentation',
    status: 'active',
    clientId: '51000000-0000-0000-0000-000000000001',
    ownerId: '21000000-0000-0000-0000-000000000002',
    startDate: '2026-03-01',
    targetDate: '2026-12-31',
    metadata: {
      phases: [
        'iDMZ deployment',
        'Firewall rule audit',
        'Conduit hardening',
        'Monitoring deployment',
      ],
      currentPhase: 'Firewall rule audit',
      purdueLevels: [0, 1, 2, 3, 3.5, 4, 5],
    },
  },
  {
    id: '61000000-0000-0000-0000-000000000003',
    name: 'Industrial CSMS Maturity Assessment',
    description:
      'Assessment of the current Cybersecurity Management System maturity against IEC 62443-2-1 requirements. Evaluates all 12 SM categories (SM-1 through SM-12) and produces an improvement roadmap for achieving SL-2 maturity.',
    type: 'csms_assessment',
    status: 'planning',
    clientId: '51000000-0000-0000-0000-000000000002',
    ownerId: '21000000-0000-0000-0000-000000000006',
    startDate: '2026-09-01',
    targetDate: '2027-03-31',
    metadata: {
      iecPart: '2-1',
      targetMaturity: 2,
      smCategories: [
        'SM-1',
        'SM-2',
        'SM-3',
        'SM-4',
        'SM-5',
        'SM-6',
        'SM-7',
        'SM-8',
        'SM-9',
        'SM-10',
        'SM-11',
        'SM-12',
      ],
    },
  },
] as const;

// ── Audit Event Helpers ──────────────────────────────────────────────────

const AUDIT_CHAIN_LOCK_ID = 20260801;

function computeHash(data: string, previousHash: string | null): string {
  const input = `${previousHash ?? ''}|${data}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

interface AuditEventSeed {
  tenantId: string;
  userId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'read';
  details: Record<string, unknown>;
}

async function insertAuditEvents(
  db: ReturnType<typeof drizzle>,
  events: AuditEventSeed[],
): Promise<void> {
  // Acquire advisory lock and fetch the last event hash
  await db.execute(sql`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_ID})`);

  const [lastEvent] = await db
    .select({ eventHash: platformSchema.auditEvents.eventHash })
    .from(platformSchema.auditEvents)
    .orderBy(desc(platformSchema.auditEvents.id))
    .limit(1);

  let previousHash: string | null = lastEvent?.eventHash ?? null;

  for (const event of events) {
    const dataToHash = JSON.stringify({
      userId: event.userId,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      details: event.details,
      timestamp: new Date().toISOString(),
    });
    const eventHash = computeHash(dataToHash, previousHash);

    await db.insert(platformSchema.auditEvents).values({
      tenantId: event.tenantId,
      userId: event.userId,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      details: event.details,
      previousHash,
      eventHash,
    });

    previousHash = eventHash;
  }
}

// ── Tenant Schema DDL ────────────────────────────────────────────────────

const TENANT_SCHEMA_DDL = `
CREATE SCHEMA IF NOT EXISTS ${TENANT_SCHEMA};
`;

// ── Full tenant schema from migration file ──────────────────────────────

async function loadFullTenantSchema(pool: Pool): Promise<void> {
  const fs = await import('node:fs');
  const path = new URL('../../../../infrastructure/migrations/001_tenant_schema.sql', import.meta.url)
    .pathname.replace(/^\/+/, '/');
  const ddl = fs.readFileSync(path, 'utf-8').replace(/\{SCHEMA\}/g, TENANT_SCHEMA);
  await pool.query(ddl);
}

// ── Seed ─────────────────────────────────────────────────────────────────

async function seed() {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://iec62443:iec62443_dev@localhost:5432/iec62443_platform';

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema: platformSchema });

  // Idempotency guard: skip if tenant already exists
  const [existing] = await db
    .select({ id: platformSchema.tenants.id })
    .from(platformSchema.tenants)
    .where(eq(platformSchema.tenants.id, TENANT_ID))
    .limit(1);
  if (existing) {
    console.log('Demo tenant already seeded. Skipping.');
    await pool.end();
    return;
  }

  console.log('Seeding Industrial Oil and Gas demo tenant...');
  console.log('='.repeat(60));

  // ── 1. Tenant ────────────────────────────────────────────────────────
  console.log('\n[1/7] Creating tenant...');

  await db
    .insert(platformSchema.tenants)
    .values({
      id: TENANT_ID,
      name: 'Industrial Oil and Gas',
      slug: TENANT_SLUG,
      schemaName: TENANT_SCHEMA,
      status: 'active',
      plan: 'enterprise',
      settings: {
        locale: 'en',
        timezone: 'America/Chicago',
        mfaRequired: false,
        passwordExpiryDays: 90,
        sessionTimeoutMinutes: 30,
        maxConcurrentSessions: 5,
        branding: {
          primaryColor: '#1a365d',
          logoUrl: null,
          companyName: 'Industrial Oil and Gas',
        },
      },
      storageQuota: 53687091200n, // 50 GB
      storageUsed: 0n,
    })
    .onConflictDoNothing();

  // ── 2. Users ─────────────────────────────────────────────────────────
  console.log('[2/7] Creating demo users...');

  for (const user of DEMO_USERS) {
    await db
      .insert(platformSchema.users)
      .values({
        id: user.id,
        email: user.email,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dNtwf7mfTaKAowUaYrkIpQ$7Iti5LIGiRJcI97NV2pATzMQMgs2/SMFFAqcVIlyMC8',
        firstName: user.firstName,
        lastName: user.lastName,
        mfaEnabled: false,
        status: 'active',
        failedAttempts: 0,
      })
      .onConflictDoNothing();
  }

  // ── 3. Tenant Memberships ────────────────────────────────────────────
  console.log('[3/7] Creating tenant memberships...');

  for (let i = 0; i < DEMO_USERS.length; i++) {
    const user = DEMO_USERS[i]!;
    await db
      .insert(platformSchema.tenantMemberships)
      .values({
        id: `31000000-0000-0000-0000-00000000000${i + 1}`,
        tenantId: TENANT_ID,
        userId: user.id,
        role: user.membershipRole,
        status: 'active',
        joinedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  // ── 4. User Roles ────────────────────────────────────────────────────
  console.log('[4/7] Assigning system roles...');

  for (let i = 0; i < DEMO_USERS.length; i++) {
    const user = DEMO_USERS[i]!;
    await db
      .insert(platformSchema.userRoles)
      .values({
        id: `41000000-0000-0000-0000-00000000000${i + 1}`,
        userId: user.id,
        roleId: user.roleId,
        tenantId: TENANT_ID,
        grantedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  // ── 5. Tenant Schema & Tables ────────────────────────────────────────
  console.log('[5/7] Creating tenant schema and tables...');

  await pool.query(TENANT_SCHEMA_DDL);
  await loadFullTenantSchema(pool);

  // ── 6. Tenant-scoped Data (Clients, Projects) ────────────────────────
  console.log('[6/7] Seeding tenant data (clients, projects)...');

  const tenantPool = new Pool({
    connectionString,
    options: `-c search_path=${TENANT_SCHEMA},public`,
  });
  const tenantDb = drizzle(tenantPool, { schema: tenantSchema });

  for (const client of DEMO_CLIENTS) {
    await tenantDb
      .insert(tenantSchema.clients)
      .values({
        id: client.id,
        name: client.name,
        industry: client.industry,
        description: client.description,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        website: client.website,
        address: client.address,
        status: client.status,
      })
      .onConflictDoNothing();
  }

  for (const project of DEMO_PROJECTS) {
    await tenantDb
      .insert(tenantSchema.projects)
      .values({
        id: project.id,
        name: project.name,
        description: project.description,
        type: project.type,
        status: project.status,
        clientId: project.clientId,
        ownerId: project.ownerId,
        startDate: project.startDate,
        targetDate: project.targetDate,
        metadata: project.metadata,
      })
      .onConflictDoNothing();
  }

  await tenantPool.end();

  // ── 7. Audit Events ──────────────────────────────────────────────────
  console.log('[7/7] Creating audit events...');

  const auditEvents: AuditEventSeed[] = [];

  // Tenant creation
  auditEvents.push({
    tenantId: TENANT_ID,
    userId: '21000000-0000-0000-0000-000000000001',
    eventType: 'tenant.created',
    entityType: 'tenant',
    entityId: TENANT_ID,
    action: 'create',
    details: {
      name: 'Industrial Oil and Gas',
      slug: TENANT_SLUG,
      plan: 'enterprise',
      status: 'active',
    },
  });

  // User creations
  for (const user of DEMO_USERS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: '21000000-0000-0000-0000-000000000001',
      eventType: 'user.created',
      entityType: 'user',
      entityId: user.id,
      action: 'create',
      details: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.systemRole,
      },
    });
  }

  // Membership assignments
  for (const user of DEMO_USERS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: '21000000-0000-0000-0000-000000000001',
      eventType: 'membership.created',
      entityType: 'tenant_membership',
      entityId: user.id,
      action: 'create',
      details: {
        userId: user.id,
        tenantId: TENANT_ID,
        role: user.membershipRole,
      },
    });
  }

  // Client creations
  for (const client of DEMO_CLIENTS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: '21000000-0000-0000-0000-000000000001',
      eventType: 'client.created',
      entityType: 'client',
      entityId: client.id,
      action: 'create',
      details: {
        name: client.name,
        industry: client.industry,
      },
    });
  }

  // Project creations
  for (const project of DEMO_PROJECTS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: project.ownerId,
      eventType: 'project.created',
      entityType: 'project',
      entityId: project.id,
      action: 'create',
      details: {
        name: project.name,
        type: project.type,
        status: project.status,
        clientId: project.clientId,
      },
    });
  }

  await insertAuditEvents(db, auditEvents);

  // ── Done ──────────────────────────────────────────────────────────────
  await pool.end();

  console.log('\n' + '='.repeat(60));
  console.log('Industrial Oil and Gas demo tenant seeded successfully.');
  console.log('');
  console.log('Summary:');
  console.log(`  Tenant:      Industrial Oil and Gas (${TENANT_ID})`);
  console.log(`  Schema:      ${TENANT_SCHEMA}`);
  console.log(`  Users:       ${DEMO_USERS.length}`);
  console.log(`  Clients:     ${DEMO_CLIENTS.length}`);
  console.log(`  Projects:    ${DEMO_PROJECTS.length}`);
  console.log(`  Audit events: ${auditEvents.length}`);
  console.log('');
  console.log('Users:');
  for (const user of DEMO_USERS) {
    console.log(`  ${user.email.padEnd(42)} ${user.systemRole}`);
  }
  console.log('');
  console.log('Projects:');
  for (const project of DEMO_PROJECTS) {
    console.log(`  ${project.name}`);
    console.log(`    Type: ${project.type}  Status: ${project.status}`);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
