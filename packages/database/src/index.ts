// ── Platform Schema ──────────────────────────────────────────────────────
export { tenants } from './schema/platform/tenants.js';
export { users } from './schema/platform/users.js';
export {
  roles,
  userRoles,
  tenantMemberships,
  apiKeys,
} from './schema/platform/roles.js';
export { auditEvents } from './schema/platform/audit-events.js';

// ── Tenant Schema — Assessment ───────────────────────────────────────────
export {
  templates,
  questions,
  engagements,
  responses,
  scorecards,
} from './schema/tenant/assessment.js';

// ── Tenant Schema — Risk ─────────────────────────────────────────────────
export {
  registers,
  entries,
  treatments,
  acceptances,
  matrixConfig,
} from './schema/tenant/risk.js';

// ── Tenant Schema — Zone & Conduit ───────────────────────────────────────
export {
  zones,
  conduits,
  memberships,
  segmentationRules,
} from './schema/tenant/zone.js';

// ── Tenant Schema — Purdue Model ─────────────────────────────────────────
export {
  models as purdueModels,
  levels as purdueLevels,
  assetMappings,
  communicationRules,
} from './schema/tenant/purdue.js';

// ── Tenant Schema — CSMS ─────────────────────────────────────────────────
export {
  frameworks as csmsFrameworks,
  elements as csmsElements,
  policies as csmsPolicies,
  improvementPlans,
} from './schema/tenant/csms.js';

// ── Tenant Schema — Findings ─────────────────────────────────────────────
export {
  findings,
  statusHistory,
  comments as findingComments,
} from './schema/tenant/finding.js';

// ── Tenant Schema — Evidence ─────────────────────────────────────────────
export {
  files as evidenceFiles,
  items as evidenceItems,
  links as evidenceLinks,
  chainOfCustody,
} from './schema/tenant/evidence.js';

// ── Tenant Schema — Remediation ──────────────────────────────────────────
export {
  plans as remediationPlans,
  actions as remediationActions,
  verifications,
} from './schema/tenant/remediation.js';

// ── Tenant Schema — Asset ────────────────────────────────────────────────
export {
  assets,
  relationships as assetRelationships,
  importJobs,
} from './schema/tenant/asset.js';

// ── Tenant Schema — Reports ──────────────────────────────────────────────
export {
  reports,
} from './schema/tenant/report.js';

// ── Database Factory ─────────────────────────────────────────────────────
export { createDb, createTenantDb } from './db.js';

// ── Audit Service ────────────────────────────────────────────────────────
export { AuditService } from './audit-service.js';
export type { CreateAuditEventParams } from './audit-service.js';
