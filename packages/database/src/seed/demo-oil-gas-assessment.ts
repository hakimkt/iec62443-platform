import { drizzle } from 'drizzle-orm/node-postgres';
import { desc, sql } from 'drizzle-orm';
import { Pool } from 'pg';
import crypto from 'node:crypto';

import * as platformSchema from '../schema/platform/index.js';
import * as tenantSchema from '../schema/tenant/index.js';

// ---------------------------------------------------------------------------
// Demo Tenant Assessment Data: Industrial Oil and Gas
// Seeds assessment engagement, template, questions, responses, scorecard,
// findings, risk register, risk entries, evidence, and evidence links.
// Prerequisites: demo-oil-gas.ts + demo-oil-gas-ot.ts must be run first.
// ---------------------------------------------------------------------------

const TENANT_ID = '11000000-0000-0000-0000-000000000001';
const TENANT_SCHEMA = 'tenant_iog';

const SEED_USER_ID = '21000000-0000-0000-0000-000000000001'; // Sarah Chen (CISO)
const LEAD_ASSESSOR_ID = '21000000-0000-0000-0000-000000000003'; // Elena Volkov
const OT_MANAGER_ID = '21000000-0000-0000-0000-000000000002'; // Marcus Rivera
const COMPLIANCE_ID = '21000000-0000-0000-0000-000000000006'; // David Larsson

// Zone IDs from demo-oil-gas-ot.ts
const ZONE_IDMZ = '71000000-0000-0000-0000-000000000002';
const ZONE_SCADA = '71000000-0000-0000-0000-000000000003';
const ZONE_SIS = '71000000-0000-0000-0000-000000000004';
const ZONE_PLC = '71000000-0000-0000-0000-000000000005';

// Asset IDs from demo-oil-gas-ot.ts
const ASSET_SCADA = '81000000-0000-0000-0000-000000000001';
const ASSET_HISTORIAN = '81000000-0000-0000-0000-000000000002';
const ASSET_ENGWS = '81000000-0000-0000-0000-000000000003';
const ASSET_FW = '81000000-0000-0000-0000-000000000008';
const ASSET_PLC = '81000000-0000-0000-0000-000000000006';
const ASSET_SAFETY_PLC = '81000000-0000-0000-0000-000000000007';

// ── Assessment Template ──────────────────────────────────────────────────

const TEMPLATE_ID = 'a1000000-0000-0000-0000-000000000001';

const TEMPLATE = {
  id: TEMPLATE_ID,
  name: 'IEC 62443-3-3 System Security Assessment',
  description:
    'Comprehensive assessment template for evaluating IACS security against IEC 62443-3-3 system requirements. Covers all 7 Foundation Requirements (FR-1 through FR-7) and their System Requirements (SRs).',
  iecPart: '3-3',
  version: '1.0',
  isSystem: true,
  sections: [
    { title: 'FR-1: Identification and Authentication Control', srPrefix: 'SR 1' },
    { title: 'FR-2: Use Control', srPrefix: 'SR 2' },
    { title: 'FR-3: System Integrity', srPrefix: 'SR 3' },
    { title: 'FR-4: Data Confidentiality', srPrefix: 'SR 4' },
    { title: 'FR-5: Restricted Data Flow', srPrefix: 'SR 5' },
    { title: 'FR-6: Timely Response to Events', srPrefix: 'SR 6' },
    { title: 'FR-7: Resource Availability', srPrefix: 'SR 7' },
  ],
};

// ── Assessment Questions ─────────────────────────────────────────────────

const QUESTIONS = [
  // FR-1: Identification and Authentication Control
  {
    id: 'a2000000-0000-0000-0000-000000000001',
    section: 'FR-1: Identification and Authentication Control',
    clauseRef: '4.3.1.1',
    questionText: 'Are all human users identified and authenticated before accessing the IACS?',
    requirementId: 'SR 1.1',
    foundationRequirement: 'FR-1',
    maxScore: 4,
    guidanceText: 'Verify that all users — operators, engineers, administrators — must authenticate before accessing any component within the IACS. This includes both local and remote access.',
    sortOrder: 1,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000002',
    section: 'FR-1: Identification and Authentication Control',
    clauseRef: '4.3.1.2',
    questionText: 'Is multi-factor authentication required for all remote access to the IACS?',
    requirementId: 'SR 1.1 RE 2',
    foundationRequirement: 'FR-1',
    maxScore: 4,
    guidanceText: 'Verify that remote access requires at least two authentication factors (e.g., password + token, certificate + biometric). Applies to all personnel accessing OT systems remotely.',
    sortOrder: 2,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000003',
    section: 'FR-1: Identification and Authentication Control',
    clauseRef: '4.3.1.3',
    questionText: 'Are all software processes and devices identified and authenticated before communicating on the IACS network?',
    requirementId: 'SR 1.2',
    foundationRequirement: 'FR-1',
    maxScore: 4,
    guidanceText: 'Verify that software processes and devices authenticate before communicating on the IACS network. This includes mutual authentication between devices.',
    sortOrder: 3,
  },
  // FR-2: Use Control
  {
    id: 'a2000000-0000-0000-0000-000000000004',
    section: 'FR-2: Use Control',
    clauseRef: '4.3.2.1',
    questionText: 'Is access to the IACS authorized per the defined access control policy?',
    requirementId: 'SR 2.1',
    foundationRequirement: 'FR-2',
    maxScore: 4,
    guidanceText: 'Verify that access control policies are defined and enforced for all users and processes accessing the IACS. Confirm role-based access control is implemented.',
    sortOrder: 4,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000005',
    section: 'FR-2: Use Control',
    clauseRef: '4.3.2.2',
    questionText: 'Are role-based access controls implemented to enforce least privilege?',
    requirementId: 'SR 2.1 RE 1',
    foundationRequirement: 'FR-2',
    maxScore: 4,
    guidanceText: 'Verify that users are assigned roles with the minimum permissions necessary for their job function. Confirm that no users have excessive privileges.',
    sortOrder: 5,
  },
  // FR-3: System Integrity
  {
    id: 'a2000000-0000-0000-0000-000000000006',
    section: 'FR-3: System Integrity',
    clauseRef: '4.3.3.1',
    questionText: 'Is the integrity of the IACS verified at startup and during operation?',
    requirementId: 'SR 3.1',
    foundationRequirement: 'FR-3',
    maxScore: 4,
    guidanceText: 'Verify that integrity checks are performed on critical system files and configurations at startup and periodically during operation.',
    sortOrder: 6,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000007',
    section: 'FR-3: System Integrity',
    clauseRef: '4.3.3.2',
    questionText: 'Is malicious code protection implemented on all IACS components?',
    requirementId: 'SR 3.2',
    foundationRequirement: 'FR-3',
    maxScore: 4,
    guidanceText: 'Verify that malware protection is deployed and updated regularly on all applicable IACS components. Confirm whitelisting or signature-based approaches.',
    sortOrder: 7,
  },
  // FR-4: Data Confidentiality
  {
    id: 'a2000000-0000-0000-0000-000000000008',
    section: 'FR-4: Data Confidentiality',
    clauseRef: '4.3.4.1',
    questionText: 'Is information at rest protected from unauthorized disclosure?',
    requirementId: 'SR 4.1',
    foundationRequirement: 'FR-4',
    maxScore: 4,
    guidanceText: 'Verify that sensitive data stored in the IACS is encrypted or otherwise protected from unauthorized access.',
    sortOrder: 8,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000009',
    section: 'FR-4: Data Confidentiality',
    clauseRef: '4.3.4.2',
    questionText: 'Is information in transit protected from unauthorized disclosure?',
    requirementId: 'SR 4.2',
    foundationRequirement: 'FR-4',
    maxScore: 4,
    guidanceText: 'Verify that network communications are encrypted using appropriate protocols (e.g., TLS 1.2+). Confirm that plaintext protocols are not used for sensitive data.',
    sortOrder: 9,
  },
  // FR-5: Restricted Data Flow
  {
    id: 'a2000000-0000-0000-0000-000000000010',
    section: 'FR-5: Restricted Data Flow',
    clauseRef: '4.3.5.1',
    questionText: 'Are zone boundaries defined and enforced with appropriate security measures?',
    requirementId: 'SR 5.1',
    foundationRequirement: 'FR-5',
    maxScore: 4,
    guidanceText: 'Verify that the IACS is partitioned into zones and conduits per the IEC 62443-3-2 model, with appropriate boundary controls.',
    sortOrder: 10,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000011',
    section: 'FR-5: Restricted Data Flow',
    clauseRef: '4.3.5.2',
    questionText: 'Are communication flows between zones controlled and monitored?',
    requirementId: 'SR 5.2',
    foundationRequirement: 'FR-5',
    maxScore: 4,
    guidanceText: 'Verify that all inter-zone communications pass through defined conduits with appropriate security controls. Confirm DPI is enabled for industrial protocols.',
    sortOrder: 11,
  },
  // FR-6: Timely Response to Events
  {
    id: 'a2000000-0000-0000-0000-000000000012',
    section: 'FR-6: Timely Response to Events',
    clauseRef: '4.3.6.1',
    questionText: 'Is audit logging enabled and are audit logs accessible for review?',
    requirementId: 'SR 6.1',
    foundationRequirement: 'FR-6',
    maxScore: 4,
    guidanceText: 'Verify that audit logging is enabled for all security-relevant events and logs are accessible for review. Confirm log retention and tamper protection.',
    sortOrder: 12,
  },
  // FR-7: Resource Availability
  {
    id: 'a2000000-0000-0000-0000-000000000013',
    section: 'FR-7: Resource Availability',
    clauseRef: '4.3.7.1',
    questionText: 'Is the IACS protected against denial of service attacks?',
    requirementId: 'SR 7.1',
    foundationRequirement: 'FR-7',
    maxScore: 4,
    guidanceText: 'Verify that DoS protection mechanisms are in place, including network segmentation and rate limiting.',
    sortOrder: 13,
  },
  {
    id: 'a2000000-0000-0000-0000-000000000014',
    section: 'FR-7: Resource Availability',
    clauseRef: '4.3.7.2',
    questionText: 'Are backup and recovery procedures in place and tested?',
    requirementId: 'SR 7.3',
    foundationRequirement: 'FR-7',
    maxScore: 4,
    guidanceText: 'Verify that regular backups are performed and recovery procedures are tested. Confirm backup integrity verification and off-site storage.',
    sortOrder: 14,
  },
] as const;

// ── Engagement ───────────────────────────────────────────────────────────

const ENGAGEMENT_ID = 'a3000000-0000-0000-0000-000000000001';

const ENGAGEMENT = {
  id: ENGAGEMENT_ID,
  name: 'Refinery IEC 62443-3-3 Assessment',
  description:
    'Comprehensive IEC 62443-3-3 system security assessment for the Gulf Coast Refinery. Evaluates all 7 Foundation Requirements against SL-3 target. Covers SCADA control zone, PLC process control zone, SIS zone, and the Industrial DMZ. Includes gap analysis, findings documentation, and risk evaluation.',
  type: 'system',
  iecPart: '3-3',
  targetSl: 3,
  currentSl: 1,
  status: 'in_progress',
  leadAssessorId: LEAD_ASSESSOR_ID,
  startDate: '2026-01-15',
  targetDate: '2026-08-31',
  templateId: TEMPLATE_ID,
  metadata: {
    facility: 'Gulf Coast Refinery',
    assessmentScope: 'Full OT network',
    clientContact: 'Robert Haines',
  },
};

// ── Responses (scored assessment questions) ──────────────────────────────

// SR 1 — Partial (score 2/4)
// SR 2 — Compliant (score 4/4)
// SR 5 — Partial (score 2/4)
// SR 7 — Failed (score 1/4)

const RESPONSES = [
  // SR 1.1 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000001', score: 2, maturityLevel: 2, assessorNotes: 'Local authentication is implemented on SCADA servers and HMI stations. However, some legacy field devices still use shared credentials. No centralized identity management for OT assets.' },
  // SR 1.1 RE 2 — Failed (no MFA for remote)
  { questionId: 'a2000000-0000-0000-0000-000000000002', score: 1, maturityLevel: 1, assessorNotes: 'MFA is enforced on the jump server (CyberArk) but not on the engineering workstation direct access path. Engineers can bypass the jump server and connect directly to PLCs via PROFINET without MFA.' },
  // SR 1.2 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000003', score: 2, maturityLevel: 2, assessorNotes: 'SCADA servers and historian authenticate via Active Directory. PLCs and RTUs do not support device-level authentication. PROFINET device identification is not enforced.' },
  // SR 2.1 — Compliant
  { questionId: 'a2000000-0000-0000-0000-000000000004', score: 4, maturityLevel: 3, assessorNotes: 'Role-based access control is well implemented. Operator, engineer, and administrator roles are defined with appropriate permissions. Access is enforced at the SCADA application and OS level.' },
  // SR 2.1 RE 1 — Compliant
  { questionId: 'a2000000-0000-0000-0000-000000000005', score: 4, maturityLevel: 3, assessorNotes: 'Least privilege is enforced. Engineers have read-only access to production SCADA; write access requires change management approval. Operators cannot modify control logic.' },
  // SR 3.1 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000006', score: 2, maturityLevel: 2, assessorNotes: 'Integrity verification is performed on SCADA servers during startup. PLC firmware integrity is not verified at runtime. No automated integrity monitoring for configuration files.' },
  // SR 3.2 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000007', score: 2, maturityLevel: 2, assessorNotes: 'Application whitelisting is deployed on SCADA servers and engineering workstation. No malware protection on PLCs or RTUs (not supported by vendor). Signature updates are quarterly, not real-time.' },
  // SR 4.1 — Compliant
  { questionId: 'a2000000-0000-0000-0000-000000000008', score: 4, maturityLevel: 3, assessorNotes: 'Data at rest is encrypted on SCADA servers (BitLocker) and historian database (TDE). Backup tapes are encrypted. SIS controller has no data-at-rest encryption capability (not applicable).' },
  // SR 4.2 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000009', score: 2, maturityLevel: 2, assessorNotes: 'OPC UA traffic is encrypted. However, PROFINET and Modbus/TCP traffic between SCADA and PLCs is unencrypted (protocol limitation). iDMZ proxy traffic is encrypted.' },
  // SR 5.1 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000010', score: 2, maturityLevel: 2, assessorNotes: 'Zones are defined per IEC 62443-3-2. iDMZ is implemented with FortiGate firewall. However, the engineering workstation has direct PROFINET access to the PLC zone without traversing the iDMZ, bypassing the zone boundary.' },
  // SR 5.2 — Partial
  { questionId: 'a2000000-0000-0000-0000-000000000011', score: 2, maturityLevel: 2, assessorNotes: 'Inter-zone traffic is partially controlled. iDMZ firewall enforces DPI for Modbus/TCP and OPC UA. However, PROFINET traffic between SCADA and PLC zones is not inspected. No traffic monitoring for SIS zone.' },
  // SR 6.1 — Compliant
  { questionId: 'a2000000-0000-0000-0000-000000000012', score: 4, maturityLevel: 3, assessorNotes: 'Audit logging is comprehensive. SCADA application logs, Windows Event Logs, and firewall logs are all collected centrally. Log retention is 1 year with tamper-evident hash chain.' },
  // SR 7.1 — Failed
  { questionId: 'a2000000-0000-0000-0000-000000000013', score: 1, maturityLevel: 1, assessorNotes: 'No DoS protection on the OT network. Industrial switch has no rate limiting. PROFINET and Modbus/TCP traffic is not rate-limited. PLCs are vulnerable to network flood attacks.' },
  // SR 7.3 — Failed
  { questionId: 'a2000000-0000-0000-0000-000000000014', score: 1, maturityLevel: 1, assessorNotes: 'Backup procedures exist for SCADA servers and historian. However, PLC program backups are not automated and are not regularly tested. SIS configuration backup is manual. No documented recovery time objectives.' },
] as const;

// ── Scorecards ───────────────────────────────────────────────────────────

const SCORECARDS = [
  { category: 'FR-1: Identification and Authentication Control', currentSl: 1, targetSl: 3, totalQuestions: 3, answeredCount: 3, compliancePct: '50.00' },
  { category: 'FR-2: Use Control', currentSl: 3, targetSl: 3, totalQuestions: 2, answeredCount: 2, compliancePct: '100.00' },
  { category: 'FR-3: System Integrity', currentSl: 2, targetSl: 3, totalQuestions: 2, answeredCount: 2, compliancePct: '50.00' },
  { category: 'FR-4: Data Confidentiality', currentSl: 2, targetSl: 3, totalQuestions: 2, answeredCount: 2, compliancePct: '75.00' },
  { category: 'FR-5: Restricted Data Flow', currentSl: 2, targetSl: 3, totalQuestions: 2, answeredCount: 2, compliancePct: '50.00' },
  { category: 'FR-6: Timely Response to Events', currentSl: 3, targetSl: 3, totalQuestions: 1, answeredCount: 1, compliancePct: '100.00' },
  { category: 'FR-7: Resource Availability', currentSl: 1, targetSl: 3, totalQuestions: 2, answeredCount: 2, compliancePct: '25.00' },
] as const;

// ── Findings ─────────────────────────────────────────────────────────────

const FINDINGS = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    title: 'Legacy PLC firmware without security updates',
    description:
      'Siemens S7-1500 PLCs (firmware V2.9.2) and Safety PLC (firmware V2.9.2) are running outdated firmware versions with known vulnerabilities. CVE-2024-XXXXX and CVE-2025-XXXXX have been published affecting the PROFINET stack. Siemens has released patches (V2.9.4) but they have not been applied due to change management constraints and operational continuity requirements. The patch management server in the iDMZ is configured but no patch deployment has been executed for these controllers.',
    severity: 'critical',
    status: 'open',
    category: 'Vulnerability Management',
    subcategory: 'Unpatched Systems',
    iecRequirement: 'SR 3.1 RE 1 — Software and information integrity verification',
    assetIds: [ASSET_PLC, ASSET_SAFETY_PLC],
    zoneIds: [ZONE_PLC, ZONE_SIS],
    assignedTo: OT_MANAGER_ID,
    dueDate: '2026-06-30',
    source: 'manual',
    metadata: { cveRefs: ['CVE-2024-XXXXX', 'CVE-2025-XXXXX'], vendorAdvisory: 'SSA-XXXXX', patchAvailable: true, patchVersion: 'V2.9.4' },
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    title: 'Insufficient IT/OT network segmentation',
    description:
      'The engineering workstation (Purdue Level 2) has direct PROFINET access to the PLC process control zone (Purdue Level 1) without traversing the iDMZ. This violates the IEC 62443-3-3 zone boundary model and creates a lateral movement path from the SCADA zone directly to PLCs. The FortiGate firewall in the iDMZ only inspects traffic crossing the iDMZ boundary, not SCADA-to-PLC traffic. Additionally, the engineering workstation can deploy control logic changes to PLCs without time-window enforcement, which is a gap against SR 2.1 RE 1.',
    severity: 'high',
    status: 'in_progress',
    category: 'Network Security',
    subcategory: 'Segmentation',
    iecRequirement: 'SR 5.1 — Network segmentation',
    assetIds: [ASSET_ENGWS, ASSET_FW, ASSET_PLC],
    zoneIds: [ZONE_SCADA, ZONE_PLC, ZONE_IDMZ],
    assignedTo: OT_MANAGER_ID,
    dueDate: '2026-09-30',
    source: 'manual',
    metadata: { segmentationGap: 'SCADA-to-PLC direct path', bypassPath: 'Engineering WS → PROFINET → PLC' },
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    title: 'Missing MFA for remote engineering access',
    description:
      'Multi-factor authentication is enforced on the CyberArk jump server for remote access from the enterprise IT network. However, the engineering workstation on the SCADA zone LAN can access PLCs directly without MFA. An attacker who compromises the engineering workstation gains unrestricted access to all PLCs. This is a gap against IEC 62443-3-3 SR 1.1 RE 2 which requires MFA for all human access to the IACS from outside the zone.',
    severity: 'high',
    status: 'acknowledged',
    category: 'Access Control',
    subcategory: 'Authentication',
    iecRequirement: 'SR 1.1 RE 2 — Multi-factor authentication for remote access',
    assetIds: [ASSET_ENGWS, ASSET_PLC],
    zoneIds: [ZONE_SCADA, ZONE_PLC],
    assignedTo: LEAD_ASSESSOR_ID,
    dueDate: '2026-07-31',
    source: 'manual',
    metadata: { authGap: 'Engineering WS direct PROFINET without MFA', currentControl: 'Jump server MFA only' },
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    title: 'Incomplete OT asset inventory',
    description:
      'The current asset inventory does not include all field instruments (Purdue Level 0), RTUs at remote tank farm locations, and the wellhead remote controller. The inventory management process relies on manual spreadsheet updates and is not synchronized with the CMDB. IEC 62443-2-1 SM-6 requires a comprehensive asset inventory as a prerequisite for risk assessment and security management.',
    severity: 'medium',
    status: 'remediation_planned',
    category: 'Asset Management',
    subcategory: 'Inventory',
    iecRequirement: 'SM-6 — IACS asset inventory',
    assetIds: [],
    zoneIds: [ZONE_SCADA, ZONE_PLC],
    assignedTo: COMPLIANCE_ID,
    dueDate: '2026-10-31',
    source: 'manual',
    metadata: { missingAssets: ['RTU at Tank Farm Area 7', 'Remote Controller at Wellhead Area 9', '~40 field instruments'], currentProcess: 'Manual spreadsheet' },
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    title: 'Unsupported Windows systems on OT network',
    description:
      'The SCADA application server and historian server are running Windows Server 2019 LTSC, which is currently supported. However, the engineering workstation runs Windows 10 Enterprise LTSC 2021. While LTSC versions have extended support, the organization has no documented patching SLA for OT Windows systems. The patch management server in the iDMZ is configured but has not been used to deploy patches to any OT asset in the last 6 months.',
    severity: 'medium',
    status: 'open',
    category: 'Vulnerability Management',
    subcategory: 'Patch Management',
    iecRequirement: 'SR 3.2 — Malicious code protection',
    assetIds: [ASSET_SCADA, ASSET_HISTORIAN, ASSET_ENGWS],
    zoneIds: [ZONE_SCADA],
    assignedTo: OT_MANAGER_ID,
    dueDate: '2026-08-31',
    source: 'manual',
    metadata: { lastPatchCycle: '2025-Q4', patchSlaExists: false, patchServerDeployed: true },
  },
  {
    id: 'b1000000-0000-0000-0000-000000000006',
    title: 'Missing security documentation',
    description:
      'Several IEC 62443-2-1 required security policies and procedures are missing or incomplete: (1) No formal IACS security policy document, (2) No incident response plan specific to OT, (3) No security awareness training program for OT personnel, (4) No change management procedure for control logic modifications. These are required by SM-1 through SM-4 of the CSMS framework.',
    severity: 'low',
    status: 'open',
    category: 'Governance',
    subcategory: 'Documentation',
    iecRequirement: 'SM-1 through SM-4 — CSMS policies and procedures',
    assetIds: [],
    zoneIds: [],
    assignedTo: COMPLIANCE_ID,
    dueDate: '2026-12-31',
    source: 'manual',
    metadata: { missingDocuments: ['IACS Security Policy', 'OT Incident Response Plan', 'Security Awareness Training Program', 'Control Logic Change Management Procedure'] },
  },
] as const;

// ── Risk Register & Entries ──────────────────────────────────────────────

const REGISTER_ID = 'c1000000-0000-0000-0000-000000000001';

const RISK_REGISTER = {
  id: REGISTER_ID,
  name: 'Gulf Coast Refinery — OT Cybersecurity Risk Register',
  scopeType: 'facility',
  scopeId: '51000000-0000-0000-0000-000000000001', // Gulf Coast Refining client
  ownerId: OT_MANAGER_ID,
  status: 'active',
};

const RISK_ENTRIES = [
  {
    id: 'c2000000-0000-0000-0000-000000000001',
    title: 'Unauthorized OT network access',
    description:
      'An external threat actor gains unauthorized access to the OT network through insufficient segmentation between the enterprise IT and OT environments. The engineering workstation direct path to PLCs bypasses the iDMZ, creating a lateral movement vector. If exploited, the attacker could manipulate process control, cause safety system failures, or disrupt production operations.',
    category: 'safety',
    threatSource: 'External threat actor',
    vulnerability: 'Insufficient network segmentation between IT and OT; engineering workstation bypasses iDMZ',
    threatCategory: 'deliberate',
    threatCapability: 'high',
    attackVector: 'network',
    vulnerabilityClass: 'configuration',
    threatScenario: 'Attacker compromises enterprise IT network via phishing, pivots through engineering workstation to PLC zone, modifies control logic or safety instrumented functions.',
    assetIds: [ASSET_ENGWS, ASSET_FW, ASSET_PLC, ASSET_SAFETY_PLC],
    zoneIds: [ZONE_IDMZ, ZONE_SCADA, ZONE_PLC, ZONE_SIS],
    likelihood: 4,
    impact: 5,
    treatment: 'mitigate',
    residualLikelihood: 2,
    residualImpact: 5,
    riskOwnerId: OT_MANAGER_ID,
    iecRequirement: 'SR 5.1 — Network segmentation',
    status: 'identified',
    reassessBy: '2026-09-01',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000002',
    title: 'PLC compromise due to outdated firmware',
    description:
      'Known vulnerabilities in the Siemens S7-1500 PLC firmware (V2.9.2) could be exploited to gain unauthorized control of process controllers. CVEs affecting the PROFINET stack have been published with patches available. The Safety PLC is also affected, which could compromise safety instrumented functions. The risk is compounded by the lack of firmware integrity verification and the direct PROFINET access from the engineering workstation.',
    category: 'safety',
    threatSource: 'External threat actor or malware',
    vulnerability: 'Unpatched PLC firmware with known CVEs; no firmware integrity verification',
    threatCategory: 'deliberate',
    threatCapability: 'moderate',
    attackVector: 'network',
    vulnerabilityClass: 'implementation',
    threatScenario: 'Attacker exploits PROFINET vulnerability to gain code execution on PLC, modifies control logic or safety functions, causes process upset or safety incident.',
    cveRefs: ['CVE-2024-XXXXX', 'CVE-2025-XXXXX'],
    assetIds: [ASSET_PLC, ASSET_SAFETY_PLC],
    zoneIds: [ZONE_PLC, ZONE_SIS],
    likelihood: 3,
    impact: 4,
    treatment: 'mitigate',
    residualLikelihood: 1,
    residualImpact: 4,
    riskOwnerId: OT_MANAGER_ID,
    iecRequirement: 'SR 3.1 RE 1 — Software and information integrity',
    status: 'identified',
    reassessBy: '2026-06-30',
  },
  {
    id: 'c2000000-0000-0000-0000-000000000003',
    title: 'Loss of process visibility',
    description:
      'Denial-of-service attack against the SCADA application server or historian server could cause loss of operator visibility into the refining process. Without real-time process monitoring, operators cannot detect abnormal conditions, respond to alarms, or take corrective action. This could lead to process upsets, environmental releases, or safety incidents. The OT network currently has no DoS protection mechanisms.',
    category: 'operational',
    threatSource: 'External threat actor',
    vulnerability: 'No DoS protection on OT network; no rate limiting on industrial switches; no traffic monitoring on PLC zone',
    threatCategory: 'deliberate',
    threatCapability: 'moderate',
    attackVector: 'network',
    vulnerabilityClass: 'design',
    threatScenario: 'Attacker floods the SCADA network with PROFINET or Modbus/TCP traffic, overwhelming the SCADA server and historian. Operators lose visibility for extended period.',
    assetIds: [ASSET_SCADA, ASSET_HISTORIAN],
    zoneIds: [ZONE_SCADA],
    likelihood: 3,
    impact: 5,
    treatment: 'mitigate',
    residualLikelihood: 2,
    residualImpact: 4,
    riskOwnerId: OT_MANAGER_ID,
    iecRequirement: 'SR 7.1 — DoS protection',
    status: 'identified',
    reassessBy: '2026-09-01',
  },
] as const;

// ── Risk Treatments ──────────────────────────────────────────────────────

const TREATMENTS = [
  {
    riskId: 'c2000000-0000-0000-0000-000000000001',
    type: 'mitigate',
    description: 'Implement network segmentation hardening: remove direct PROFINET path from engineering workstation to PLC zone, enforce all engineering traffic through iDMZ jump server with MFA and session recording. Deploy micro-segmentation rules on the industrial firewall.',
    responsibleId: OT_MANAGER_ID,
    targetDate: '2026-09-30',
    status: 'in_progress',
    costEstimate: '85000.00',
  },
  {
    riskId: 'c2000000-0000-0000-0000-000000000002',
    type: 'mitigate',
    description: 'Deploy PLC firmware patches (V2.9.4) via the patch management server during next scheduled maintenance window. Implement firmware integrity verification at startup. Establish quarterly firmware review cycle.',
    responsibleId: OT_MANAGER_ID,
    targetDate: '2026-06-30',
    status: 'planned',
    costEstimate: '25000.00',
  },
  {
    riskId: 'c2000000-0000-0000-0000-000000000003',
    type: 'mitigate',
    description: 'Deploy DoS protection on the industrial firewall and industrial switch. Implement rate limiting for PROFINET and Modbus/TCP traffic. Deploy network monitoring with anomaly detection for the SCADA zone. Establish network baseline and alert thresholds.',
    responsibleId: OT_MANAGER_ID,
    targetDate: '2026-12-31',
    status: 'planned',
    costEstimate: '120000.00',
  },
] as const;

// ── Risk Matrix Config ───────────────────────────────────────────────────

const MATRIX_CONFIG = {
  registerId: REGISTER_ID,
  likelihoodLabels: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'],
  impactLabels: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
  thresholds: { low: [1, 4], medium: [5, 9], high: [10, 15], critical: [16, 25] },
  colorScheme: { low: '#38a169', medium: '#d69e2e', high: '#dd6b20', critical: '#e53e3e' },
};

// ── Evidence Items ───────────────────────────────────────────────────────

const EVIDENCE_ITEMS = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    title: 'OT Network Architecture Diagram',
    description: 'Comprehensive network architecture diagram showing all IEC 62443 zones, conduits, and asset placements. Includes Purdue model mapping, VLAN assignments, and firewall placement. Updated 2026-01-20.',
    evidenceType: 'document',
    status: 'active',
    fileName: 'OT_Network_Architecture_v3.2.pdf',
    fileSize: 2457600n,
    mimeType: 'application/pdf',
    sha256Hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    collectedBy: LEAD_ASSESSOR_ID,
    retentionUntil: '2029-01-20',
    tags: ['architecture', 'network', 'purdue-model', 'zones'],
    metadata: { version: '3.2', classification: 'Confidential', author: 'Marcus Rivera' },
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Industrial Firewall Configuration Export',
    description: 'FortiGate Rugged 70F firewall rule configuration export showing all ACL rules, DPI policies, NAT rules, and zone-to-zone traffic policies. Includes both iDMZ and SCADA zone firewall rules.',
    evidenceType: 'config',
    status: 'active',
    fileName: 'FortiGate_Rugged70F_config_2026-01-22.conf',
    fileSize: 184320n,
    mimeType: 'text/plain',
    sha256Hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    collectedBy: LEAD_ASSESSOR_ID,
    retentionUntil: '2029-01-22',
    tags: ['firewall', 'configuration', 'fortigate', 'acl'],
    metadata: { device: 'FortiGate Rugged 70F', firmwareVersion: 'FortiOS 7.4.3', ruleCount: 247 },
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    title: 'PLC Inventory and Firmware Status',
    description: 'Complete inventory of all PLCs and controllers in the refinery, including firmware versions, patch status, CVE exposure, and last maintenance dates. Includes both Siemens S7-1500 and S7-1500F controllers.',
    evidenceType: 'document',
    status: 'active',
    fileName: 'PLC_Inventory_Firmware_Status_2026-01.xlsx',
    fileSize: 524288n,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sha256Hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    collectedBy: LEAD_ASSESSOR_ID,
    retentionUntil: '2029-01-22',
    tags: ['inventory', 'plc', 'firmware', 'cve'],
    metadata: { totalControllers: 2, patchedCount: 0, vulnerableCount: 2 },
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    title: 'OT Vulnerability Assessment Report',
    description: 'Tenable.ot vulnerability scan report for the refinery OT network. Covers all discovered assets, identified vulnerabilities with CVSS scores, and recommended remediation actions. Scan performed 2026-01-18.',
    evidenceType: 'scan_result',
    status: 'active',
    fileName: 'Tenable_OT_VulnScan_2026-01-18.pdf',
    fileSize: 3145728n,
    mimeType: 'application/pdf',
    sha256Hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    collectedBy: LEAD_ASSESSOR_ID,
    retentionUntil: '2029-01-18',
    tags: ['vulnerability', 'scan', 'tenable', 'cvss'],
    metadata: { scanner: 'Tenable.ot', scanDate: '2026-01-18', totalVulns: 47, critical: 2, high: 8, medium: 22, low: 15 },
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    title: 'OT Security Policies and Procedures',
    description: 'Collection of existing security policies and procedures applicable to the OT environment. Includes network access policy, acceptable use policy, and change management procedure. Note: Several IEC 62443-2-1 required policies are missing (see finding F-006).',
    evidenceType: 'document',
    status: 'active',
    fileName: 'OT_Security_Policies_Collection.pdf',
    fileSize: 1572864n,
    mimeType: 'application/pdf',
    sha256Hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    collectedBy: COMPLIANCE_ID,
    retentionUntil: '2029-01-22',
    tags: ['policy', 'security', 'governance', 'csms'],
    metadata: { existingPolicies: ['Network Access Policy', 'Acceptable Use Policy', 'Change Management Procedure'], missingPolicies: ['IACS Security Policy', 'OT Incident Response Plan', 'Security Awareness Training Program', 'Control Logic Change Management Procedure'] },
  },
  {
    id: 'd1000000-0000-0000-0000-000000000006',
    title: 'Backup and Recovery Procedures',
    description: 'Backup and recovery procedures for the SCADA server and historian. Includes backup schedule, retention policy, and restore procedures. Note: Does not cover PLC program backups or SIS configuration backups.',
    evidenceType: 'document',
    status: 'active',
    fileName: 'Backup_Recovery_Procedures_v2.1.pdf',
    fileSize: 819200n,
    mimeType: 'application/pdf',
    sha256Hash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
    collectedBy: OT_MANAGER_ID,
    retentionUntil: '2029-01-22',
    tags: ['backup', 'recovery', 'procedures', 'bcp'],
    metadata: { coverage: 'SCADA servers and historian only', missing: 'PLC program backups, SIS configuration backups', lastTestDate: '2025-06-15' },
  },
] as const;

// ── Evidence Links ───────────────────────────────────────────────────────

// Links evidence to findings, engagements, and assessment requirements
const EVIDENCE_LINKS = [
  // Network architecture diagram → engagement, findings
  { evidenceId: 'd1000000-0000-0000-0000-000000000001', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  { evidenceId: 'd1000000-0000-0000-0000-000000000001', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000002' }, // segmentation finding
  // Firewall config → engagement, segmentation finding
  { evidenceId: 'd1000000-0000-0000-0000-000000000002', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  { evidenceId: 'd1000000-0000-0000-0000-000000000002', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000002' }, // segmentation finding
  // PLC inventory → firmware finding, engagement
  { evidenceId: 'd1000000-0000-0000-0000-000000000003', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  { evidenceId: 'd1000000-0000-0000-0000-000000000003', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000001' }, // firmware finding
  { evidenceId: 'd1000000-0000-0000-0000-000000000003', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000004' }, // asset inventory finding
  // Vulnerability report → firmware finding, unsupported Windows finding, engagement
  { evidenceId: 'd1000000-0000-0000-0000-000000000004', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  { evidenceId: 'd1000000-0000-0000-0000-000000000004', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000001' }, // firmware finding
  { evidenceId: 'd1000000-0000-0000-0000-000000000004', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000005' }, // unsupported Windows finding
  // Security policies → documentation finding, engagement
  { evidenceId: 'd1000000-0000-0000-0000-000000000005', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  { evidenceId: 'd1000000-0000-0000-0000-000000000005', entityType: 'finding', entityId: 'b1000000-0000-0000-0000-000000000006' }, // documentation finding
  // Backup procedures → engagement, DoS finding (SR 7)
  { evidenceId: 'd1000000-0000-0000-0000-000000000006', entityType: 'engagement', entityId: ENGAGEMENT_ID },
  // Link evidence to specific assessment requirements (using question IDs as entity proxies)
  { evidenceId: 'd1000000-0000-0000-0000-000000000001', entityType: 'requirement', entityId: 'a2000000-0000-0000-0000-000000000010' }, // SR 5.1
  { evidenceId: 'd1000000-0000-0000-0000-000000000002', entityType: 'requirement', entityId: 'a2000000-0000-0000-0000-000000000011' }, // SR 5.2
  { evidenceId: 'd1000000-0000-0000-0000-000000000003', entityType: 'requirement', entityId: 'a2000000-0000-0000-0000-000000000006' }, // SR 3.1
  { evidenceId: 'd1000000-0000-0000-0000-000000000004', entityType: 'requirement', entityId: 'a2000000-0000-0000-0000-000000000007' }, // SR 3.2
  { evidenceId: 'd1000000-0000-0000-0000-000000000006', entityType: 'requirement', entityId: 'a2000000-0000-0000-0000-000000000014' }, // SR 7.3
] as const;

// ── Chain of Custody ─────────────────────────────────────────────────────

const CUSTODY_EVENTS = [
  { evidenceId: 'd1000000-0000-0000-0000-000000000001', eventType: 'created', userId: LEAD_ASSESSOR_ID, details: { action: 'Document collected during site assessment' } },
  { evidenceId: 'd1000000-0000-0000-0000-000000000002', eventType: 'created', userId: LEAD_ASSESSOR_ID, details: { action: 'Configuration export from FortiGate management interface' } },
  { evidenceId: 'd1000000-0000-0000-0000-000000000003', eventType: 'created', userId: LEAD_ASSESSOR_ID, details: { action: 'Inventory spreadsheet provided by OT team' } },
  { evidenceId: 'd1000000-0000-0000-0000-000000000004', eventType: 'created', userId: LEAD_ASSESSOR_ID, details: { action: 'Scan report generated from Tenable.ot console' } },
  { evidenceId: 'd1000000-0000-0000-0000-000000000005', eventType: 'created', userId: COMPLIANCE_ID, details: { action: 'Policy documents provided by compliance team' } },
  { evidenceId: 'd1000000-0000-0000-0000-000000000006', eventType: 'created', userId: OT_MANAGER_ID, details: { action: 'Procedures document provided by OT operations' } },
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

// ── Seed ─────────────────────────────────────────────────────────────────

async function seed() {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://iec62443:iec62443_dev@localhost:5432/iec62443_platform';

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema: platformSchema });

  console.log('Seeding Industrial Oil and Gas — Assessment & Security Data...');
  console.log('='.repeat(60));

  const tenantPool = new Pool({
    connectionString,
    options: `-c search_path=${TENANT_SCHEMA},public`,
  });
  const tenantDb = drizzle(tenantPool, { schema: tenantSchema });

  // ── 1. Assessment Template ───────────────────────────────────────────
  console.log('\n[1/9] Creating assessment template...');

  await tenantDb.insert(tenantSchema.templates).values({
    id: TEMPLATE.id,
    name: TEMPLATE.name,
    description: TEMPLATE.description,
    iecPart: TEMPLATE.iecPart,
    version: TEMPLATE.version,
    isSystem: TEMPLATE.isSystem,
    sections: TEMPLATE.sections,
  }).onConflictDoNothing();

  // ── 2. Assessment Questions ──────────────────────────────────────────
  console.log('[2/9] Creating assessment questions...');

  for (const q of QUESTIONS) {
    await tenantDb.insert(tenantSchema.questions).values({
      id: q.id,
      templateId: TEMPLATE_ID,
      section: q.section,
      clauseRef: q.clauseRef,
      questionText: q.questionText,
      requirementId: q.requirementId,
      foundationRequirement: q.foundationRequirement,
      maxScore: q.maxScore,
      guidanceText: q.guidanceText,
      sortOrder: q.sortOrder,
    }).onConflictDoNothing();
  }

  // ── 3. Engagement ───────────────────────────────────────────────────
  console.log('[3/9] Creating assessment engagement...');

  await tenantDb.insert(tenantSchema.engagements).values(ENGAGEMENT).onConflictDoNothing();

  // ── 4. Responses ────────────────────────────────────────────────────
  console.log('[4/9] Creating assessment responses...');

  for (const r of RESPONSES) {
    await tenantDb.insert(tenantSchema.responses).values({
      engagementId: ENGAGEMENT_ID,
      questionId: r.questionId,
      score: r.score,
      maturityLevel: r.maturityLevel,
      assessorNotes: r.assessorNotes,
      answeredBy: LEAD_ASSESSOR_ID,
      answeredAt: new Date(),
    }).onConflictDoNothing();
  }

  // ── 5. Scorecards ───────────────────────────────────────────────────
  console.log('[5/9] Creating scorecards...');

  for (const sc of SCORECARDS) {
    await tenantDb.insert(tenantSchema.scorecards).values({
      engagementId: ENGAGEMENT_ID,
      category: sc.category,
      currentSl: sc.currentSl,
      targetSl: sc.targetSl,
      totalQuestions: sc.totalQuestions,
      answeredCount: sc.answeredCount,
      compliancePct: sc.compliancePct,
    }).onConflictDoNothing();
  }

  // ── 6. Findings ─────────────────────────────────────────────────────
  console.log('[6/9] Creating findings...');

  for (const f of FINDINGS) {
    await tenantDb.insert(tenantSchema.findings).values({
      id: f.id,
      engagementId: ENGAGEMENT_ID,
      title: f.title,
      description: f.description,
      severity: f.severity,
      status: f.status,
      category: f.category,
      subcategory: f.subcategory,
      iecRequirement: f.iecRequirement,
      assetIds: [...f.assetIds],
      zoneIds: [...f.zoneIds],
      assignedTo: f.assignedTo,
      dueDate: new Date(f.dueDate),
      source: f.source,
      metadata: f.metadata,
    }).onConflictDoNothing();
  }

  // ── 7. Risk Register & Entries ──────────────────────────────────────
  console.log('[7/9] Creating risk register and entries...');

  await tenantDb.insert(tenantSchema.registers).values(RISK_REGISTER).onConflictDoNothing();

  await tenantDb.insert(tenantSchema.matrixConfig).values({
    id: 'c3000000-0000-0000-0000-000000000001',
    registerId: MATRIX_CONFIG.registerId,
    likelihoodLabels: MATRIX_CONFIG.likelihoodLabels,
    impactLabels: MATRIX_CONFIG.impactLabels,
    thresholds: MATRIX_CONFIG.thresholds,
    colorScheme: MATRIX_CONFIG.colorScheme,
  }).onConflictDoNothing();

  for (const r of RISK_ENTRIES) {
    await tenantDb.insert(tenantSchema.entries).values({
      id: r.id,
      registerId: REGISTER_ID,
      title: r.title,
      description: r.description,
      category: r.category,
      threatSource: r.threatSource,
      vulnerability: r.vulnerability,
      threatCategory: r.threatCategory,
      threatCapability: r.threatCapability,
      attackVector: r.attackVector,
      vulnerabilityClass: r.vulnerabilityClass,
      threatScenario: r.threatScenario,
      cveRefs: [...((r as { cveRefs?: string[] }).cveRefs ?? [])],
      assetIds: [...r.assetIds],
      zoneIds: [...r.zoneIds],
      likelihood: r.likelihood,
      impact: r.impact,
      treatment: r.treatment,
      residualLikelihood: r.residualLikelihood,
      residualImpact: r.residualImpact,
      riskOwnerId: r.riskOwnerId,
      iecRequirement: r.iecRequirement,
      status: r.status,
      reassessBy: r.reassessBy,
    }).onConflictDoNothing();
  }

  for (const t of TREATMENTS) {
    await tenantDb.insert(tenantSchema.treatments).values({
      riskId: t.riskId,
      type: t.type,
      description: t.description,
      responsibleId: t.responsibleId,
      targetDate: t.targetDate,
      status: t.status,
      costEstimate: t.costEstimate,
    }).onConflictDoNothing();
  }

  // ── 8. Evidence & Links ─────────────────────────────────────────────
  console.log('[8/9] Creating evidence items and links...');

  for (const e of EVIDENCE_ITEMS) {
    await tenantDb.insert(tenantSchema.items).values({
      id: e.id,
      title: e.title,
      description: e.description,
      evidenceType: e.evidenceType,
      status: e.status,
      fileName: e.fileName,
      fileSize: e.fileSize,
      mimeType: e.mimeType,
      sha256Hash: e.sha256Hash,
      collectedBy: e.collectedBy,
      retentionUntil: new Date(e.retentionUntil),
      tags: [...e.tags],
      metadata: e.metadata,
    }).onConflictDoNothing();
  }

  for (const l of EVIDENCE_LINKS) {
    await tenantDb.insert(tenantSchema.links).values({
      evidenceId: l.evidenceId,
      entityType: l.entityType,
      entityId: l.entityId,
    }).onConflictDoNothing();
  }

  for (const c of CUSTODY_EVENTS) {
    await tenantDb.insert(tenantSchema.chainOfCustody).values({
      evidenceId: c.evidenceId,
      eventType: c.eventType,
      userId: c.userId,
      details: c.details,
    }).onConflictDoNothing();
  }

  await tenantPool.end();

  // ── 9. Audit Events ─────────────────────────────────────────────────
  console.log('[9/9] Creating audit events...');

  const auditEvents: AuditEventSeed[] = [];

  auditEvents.push({
    tenantId: TENANT_ID, userId: SEED_USER_ID,
    eventType: 'assessment.template.created', entityType: 'template', entityId: TEMPLATE_ID,
    action: 'create', details: { name: TEMPLATE.name, iecPart: TEMPLATE.iecPart },
  });

  for (const q of QUESTIONS) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: SEED_USER_ID,
      eventType: 'assessment.question.created', entityType: 'question', entityId: q.id,
      action: 'create', details: { requirementId: q.requirementId, foundationRequirement: q.foundationRequirement },
    });
  }

  auditEvents.push({
    tenantId: TENANT_ID, userId: SEED_USER_ID,
    eventType: 'assessment.engagement.created', entityType: 'engagement', entityId: ENGAGEMENT_ID,
    action: 'create', details: { name: ENGAGEMENT.name, type: ENGAGEMENT.type, targetSl: ENGAGEMENT.targetSl },
  });

  for (const r of RESPONSES) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: LEAD_ASSESSOR_ID,
      eventType: 'assessment.response.created', entityType: 'response', entityId: r.questionId,
      action: 'create', details: { score: r.score, maturityLevel: r.maturityLevel },
    });
  }

  for (const f of FINDINGS) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: LEAD_ASSESSOR_ID,
      eventType: 'finding.created', entityType: 'finding', entityId: f.id,
      action: 'create', details: { title: f.title, severity: f.severity, status: f.status },
    });
  }

  auditEvents.push({
    tenantId: TENANT_ID, userId: SEED_USER_ID,
    eventType: 'risk.register.created', entityType: 'risk_register', entityId: REGISTER_ID,
    action: 'create', details: { name: RISK_REGISTER.name },
  });

  for (const r of RISK_ENTRIES) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: OT_MANAGER_ID,
      eventType: 'risk.entry.created', entityType: 'risk_entry', entityId: r.id,
      action: 'create', details: { title: r.title, likelihood: r.likelihood, impact: r.impact },
    });
  }

  for (const e of EVIDENCE_ITEMS) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: e.collectedBy,
      eventType: 'evidence.created', entityType: 'evidence', entityId: e.id,
      action: 'create', details: { title: e.title, evidenceType: e.evidenceType },
    });
  }

  for (const l of EVIDENCE_LINKS) {
    auditEvents.push({
      tenantId: TENANT_ID, userId: SEED_USER_ID,
      eventType: 'evidence.linked', entityType: 'evidence_link', entityId: l.evidenceId,
      action: 'create', details: { entityType: l.entityType, entityId: l.entityId },
    });
  }

  await insertAuditEvents(db, auditEvents);

  await pool.end();

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('Industrial Oil and Gas — Assessment & Security Data seeded.');
  console.log('');
  console.log('Summary:');
  console.log(`  Template:        1 (IEC 62443-3-3, ${QUESTIONS.length} questions)`);
  console.log(`  Engagement:      1 (SL${ENGAGEMENT.currentSl}→SL${ENGAGEMENT.targetSl}, ${ENGAGEMENT.status})`);
  console.log(`  Responses:       ${RESPONSES.length}`);
  console.log(`  Scorecards:      ${SCORECARDS.length}`);
  console.log(`  Findings:        ${FINDINGS.length}`);
  console.log(`  Risk register:   1 (${RISK_ENTRIES.length} entries, ${TREATMENTS.length} treatments)`);
  console.log(`  Evidence:        ${EVIDENCE_ITEMS.length} items, ${EVIDENCE_LINKS.length} links`);
  console.log(`  Audit events:    ${auditEvents.length}`);
  console.log('');
  console.log('Scorecard Summary:');
  for (const sc of SCORECARDS) {
    const gap = sc.targetSl - sc.currentSl;
    const status = gap === 0 ? 'COMPLIANT' : gap === 1 ? 'PARTIAL' : 'GAP';
    console.log(`  ${sc.category.padEnd(50)} SL${sc.currentSl}→SL${sc.targetSl}  ${sc.compliancePct}%  ${status}`);
  }
  console.log('');
  console.log('Findings by Severity:');
  const severities = ['critical', 'high', 'medium', 'low'];
  for (const sev of severities) {
    const count = FINDINGS.filter((f) => f.severity === sev).length;
    if (count > 0) console.log(`  ${sev.padEnd(12)} ${count}`);
  }
  console.log('');
  console.log('Risk Register:');
  for (const r of RISK_ENTRIES) {
    const score = r.likelihood * r.impact;
    const resScore = r.residualLikelihood * r.residualImpact;
    console.log(`  ${r.title.padEnd(45)} L${r.likelihood}×I${r.impact}=${score}  Residual: L${r.residualLikelihood}×I${r.residualImpact}=${resScore}`);
  }
  console.log('');
  console.log('Evidence Linked:');
  for (const e of EVIDENCE_ITEMS) {
    const linkCount = EVIDENCE_LINKS.filter((l) => l.evidenceId === e.id).length;
    console.log(`  ${e.title.padEnd(50)} ${linkCount} links`);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
