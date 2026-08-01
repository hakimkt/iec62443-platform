import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as tenantSchema from '../schema/tenant/index.js';

// ---------------------------------------------------------------------------
// Demo Purdue Model: Gulf Coast Refinery — Industrial Oil and Gas
// Seeds Purdue model, levels, 165+ assets, asset mappings, communication
// rules, and additional zones into the tenant_iog schema.
// Prerequisite: demo-oil-gas-ot.ts must have been run first.
// ---------------------------------------------------------------------------

const TENANT_SCHEMA = 'tenant_iog';
const SEED_USER_ID = '21000000-0000-0000-0000-000000000001';

// ── Existing Asset IDs (from demo-oil-gas-ot.ts) ────────────────────────

const EXISTING = {
  scadaServer: '81000000-0000-0000-0000-000000000001',
  historian: '81000000-0000-0000-0000-000000000002',
  engineeringWs: '81000000-0000-0000-0000-000000000003',
  patchMgmt: '81000000-0000-0000-0000-000000000004',
  jumpServer: '81000000-0000-0000-0000-000000000005',
  siemensPlc: '81000000-0000-0000-0000-000000000006',
  safetyPlc: '81000000-0000-0000-0000-000000000007',
  firewall: '81000000-0000-0000-0000-000000000008',
  switch: '81000000-0000-0000-0000-000000000009',
  rtu: '81000000-0000-0000-0000-000000000010',
  remoteController: '81000000-0000-0000-0000-000000000011',
  // Existing zones
  zoneEnterpriseIT: '71000000-0000-0000-0000-000000000001',
  zoneIdmz: '71000000-0000-0000-0000-000000000002',
  zoneScada: '71000000-0000-0000-0000-000000000003',
  zoneSis: '71000000-0000-0000-0000-000000000004',
  zonePlc: '71000000-0000-0000-0000-000000000005',
  zoneField: '71000000-0000-0000-0000-000000000006',
} as const;

// ── Purdue Model ─────────────────────────────────────────────────────────

const PURDUE_MODEL = {
  id: '61000000-0000-0000-0000-000000000001',
  name: 'Gulf Coast Refinery — Purdue Architecture',
  description:
    'Purdue Enterprise Reference Architecture model for the Gulf Coast Refinery complex. Defines 7 hierarchical levels (L5–L0) with communication constraints per IEC 62443-3-3 SR 5.1 and ISA-95/ISA-99 segmentation requirements.',
  isDefault: true,
};

// ── Purdue Levels ────────────────────────────────────────────────────────

const LEVELS = [
  {
    id: '62000000-0000-0000-0000-000000000001',
    levelNumber: '5',
    name: 'Enterprise Network',
    description:
      'Corporate IT infrastructure including ERP, email, directory services, and business applications. Isolated from OT networks via the iDMZ per IEC 62443-3-3.',
    color: '#6366f1',
    sortOrder: 0,
  },
  {
    id: '62000000-0000-0000-0000-000000000002',
    levelNumber: '4',
    name: 'Business Planning & Logistics',
    description:
      'Manufacturing execution systems, production scheduling, laboratory information management, and logistics planning. Bridges business and operational data.',
    color: '#8b5cf6',
    sortOrder: 1,
  },
  {
    id: '62000000-0000-0000-0000-000000000003',
    levelNumber: '3.5',
    name: 'Industrial DMZ',
    description:
      'Industrial Demilitarized Zone (iDMZ) separating enterprise IT from OT networks. All cross-boundary traffic must traverse this zone. Hosts jump servers, patch management, proxy services, and data diodes per IEC 62443-3-3.',
    color: '#f59e0b',
    sortOrder: 2,
  },
  {
    id: '62000000-0000-0000-0000-000000000004',
    levelNumber: '3',
    name: 'Operations Management',
    description:
      'SCADA servers, historians, operator workstations, and HMI stations that monitor and control the refining process. Centralized supervisory control and data acquisition.',
    color: '#10b981',
    sortOrder: 3,
  },
  {
    id: '62000000-0000-0000-0000-000000000005',
    levelNumber: '2',
    name: 'Supervisory Control',
    description:
      'Area supervisory HMI stations, data concentrators, and local operator panels providing process oversight and local control for individual process units.',
    color: '#3b82f6',
    sortOrder: 4,
  },
  {
    id: '62000000-0000-0000-0000-000000000006',
    levelNumber: '1',
    name: 'Basic Control',
    description:
      'PLCs, RTUs, SIS controllers, and VFDs executing continuous and discrete control logic. Directly connected to field instruments via hardwired I/O and industrial protocols.',
    color: '#06b6d4',
    sortOrder: 5,
  },
  {
    id: '62000000-0000-0000-0000-000000000007',
    levelNumber: '0',
    name: 'Process',
    description:
      'Physical process devices including transmitters, actuators, valve positioners, analyzers, and sensors connected via 4-20mA, HART, and Foundation Fieldbus.',
    color: '#ef4444',
    sortOrder: 6,
  },
] as const;

// Level ID lookup for convenience
const L = {
  L5: '62000000-0000-0000-0000-000000000001',
  L4: '62000000-0000-0000-0000-000000000002',
  L3_5: '62000000-0000-0000-0000-000000000003',
  L3: '62000000-0000-0000-0000-000000000004',
  L2: '62000000-0000-0000-0000-000000000005',
  L1: '62000000-0000-0000-0000-000000000006',
  L0: '62000000-0000-0000-0000-000000000007',
} as const;

// ── Additional Zones ─────────────────────────────────────────────────────

const NEW_ZONES = [
  {
    id: '72000000-0000-0000-0000-000000000001',
    name: 'Corporate Business Zone',
    description:
      'Corporate IT network hosting ERP, email, directory services, and business applications. Purdue Level 5.',
    zoneType: 'enterprise_it',
    securityLevel: 1,
    targetSl: 2,
    achievedSl: 1,
    purdueLevel: 5,
    diagramX: '400',
    diagramY: '20',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#6366f1',
  },
  {
    id: '72000000-0000-0000-0000-000000000002',
    name: 'Business Planning Zone',
    description:
      'Manufacturing execution, laboratory systems, production scheduling, and logistics. Purdue Level 4.',
    zoneType: 'manufacturing_ops',
    securityLevel: 1,
    targetSl: 2,
    achievedSl: 1,
    purdueLevel: 4,
    diagramX: '400',
    diagramY: '120',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#8b5cf6',
  },
  {
    id: '72000000-0000-0000-0000-000000000003',
    name: 'Operations Management Zone',
    description:
      'SCADA servers, historians, and operator workstations. Purdue Level 3.',
    zoneType: 'manufacturing_ops',
    securityLevel: 2,
    targetSl: 3,
    achievedSl: 2,
    purdueLevel: 3,
    diagramX: '400',
    diagramY: '220',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#10b981',
  },
  {
    id: '72000000-0000-0000-0000-000000000004',
    name: 'Area Supervisory Zone',
    description:
      'Area HMI stations, data concentrators, and local operator panels. Purdue Level 2.',
    zoneType: 'manufacturing_ops',
    securityLevel: 2,
    targetSl: 2,
    achievedSl: 1,
    purdueLevel: 2,
    diagramX: '400',
    diagramY: '320',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#3b82f6',
  },
] as const;

// ── New Assets ───────────────────────────────────────────────────────────
// Assets are organized by Purdue level. IDs start from 82000000-...
// Existing assets (81000000-...) are mapped separately in the mappings section.

interface AssetDef {
  id: string;
  name: string;
  desc: string;
  type: string;
  crit: string;
  vendor: string;
  model: string;
  fw?: string;
  ip?: string;
  net?: string;
  purdueLevel: number;
  zoneId: string;
  loc: string;
  status?: string;
  meta?: Record<string, unknown>;
}

// ── Level 5 — Enterprise Network (15 assets) ─────────────────────────────

const L5_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000001', name: 'SAP ERP Server',
    desc: 'Primary SAP ERP server hosting finance, procurement, and supply chain modules for the refinery complex.',
    type: 'erp', crit: 'business_critical', vendor: 'SAP', model: 'S/4HANA 2023',
    fw: 'S4H-2023-FPS01', ip: '10.1.5.10', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'SUSE Linux Enterprise 15 SP5', rackUnit: '4U', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000002', name: 'Microsoft Exchange Server',
    desc: 'Corporate email server providing messaging and collaboration services for all refinery personnel.',
    type: 'server', crit: 'business_critical', vendor: 'Microsoft', model: 'Exchange Server 2019',
    fw: 'CU14', ip: '10.1.5.11', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000003', name: 'SharePoint Server',
    desc: 'Document management and collaboration platform for engineering documents, procedures, and training records.',
    type: 'server', crit: 'business_critical', vendor: 'Microsoft', model: 'SharePoint Server 2019',
    fw: 'KB5034441', ip: '10.1.5.12', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000004', name: 'Active Directory Server',
    desc: 'Primary domain controller providing authentication, authorization, and directory services for all IT and OT user accounts.',
    type: 'server', crit: 'safety_critical', vendor: 'Microsoft', model: 'Windows Server 2022 DC',
    fw: 'KB5034441', ip: '10.1.5.13', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Windows Server 2022', role: 'Primary DC', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000005', name: 'Enterprise SIEM',
    desc: 'Security Information and Event Management platform aggregating logs from IT and OT networks for threat detection and compliance monitoring.',
    type: 'server', crit: 'business_critical', vendor: 'Splunk', model: 'Enterprise 9.2',
    fw: '9.2.1', ip: '10.1.5.14', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'RHEL 9.3', eps: '25000', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000006', name: 'Corporate Firewall',
    desc: 'Next-generation firewall at the corporate network perimeter enforcing internet and WAN access policies.',
    type: 'firewall', crit: 'business_critical', vendor: 'Palo Alto', model: 'PA-5260',
    fw: 'PAN-OS 11.1.3', ip: '10.1.5.1', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'PAN-OS 11.1', rules: 1200, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000007', name: 'VPN Gateway',
    desc: 'IPsec VPN concentrator for secure remote access by corporate users and third-party vendors.',
    type: 'gateway', crit: 'business_critical', vendor: 'Cisco', model: 'ASA 5585-X',
    fw: '9.18.3', ip: '10.1.5.2', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Cisco ASA 9.18', concurrentVpn: 5000, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000008', name: 'Email Gateway',
    desc: 'Email security gateway providing anti-spam, anti-phishing, and DLP filtering for all inbound and outbound email.',
    type: 'server', crit: 'operational', vendor: 'Proofpoint', model: 'Email Protection 9.4',
    fw: '9.4.2', ip: '10.1.5.15', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000009', name: 'Corporate Backup Server',
    desc: 'Enterprise backup server providing data protection for all corporate IT systems. Uses deduplication and encrypted storage.',
    type: 'server', crit: 'business_critical', vendor: 'Veeam', model: 'Backup & Replication 12.1',
    fw: '12.1.0.3711', ip: '10.1.5.16', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Windows Server 2022', backupCapacity: '50TB', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000010', name: 'Corporate DNS Server',
    desc: 'Primary DNS server providing name resolution for all corporate and OT network segments.',
    type: 'server', crit: 'business_critical', vendor: 'Microsoft', model: 'Windows Server 2022 DNS',
    fw: 'KB5034441', ip: '10.1.5.17', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000011', name: 'Enterprise Antivirus Server',
    desc: 'Centralized antivirus and endpoint protection management server for all corporate workstations and servers.',
    type: 'server', crit: 'business_critical', vendor: 'CrowdStrike', model: 'Falcon Platform 7.12',
    fw: '7.12.16203', ip: '10.1.5.18', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'RHEL 9.3', managedEndpoints: 3500, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000012', name: 'Network Time Server',
    desc: 'Stratum-2 NTP server providing time synchronization for all IT and OT network devices. Synchronized to GPS reference.',
    type: 'server', crit: 'business_critical', vendor: 'Meinberg', model: 'SyncServer S600',
    fw: 'V6.2.2', ip: '10.1.5.19', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { stratum: 2, gpsReference: true, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000013', name: 'Corporate Proxy Server',
    desc: 'Web proxy server providing internet access control, content filtering, and SSL inspection for corporate users.',
    type: 'server', crit: 'operational', vendor: 'Zscaler', model: 'ZIA Cloud Proxy',
    fw: '2026.1', ip: '10.1.5.20', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Cloud-hosted',
    meta: { patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000014', name: 'IT Asset Management Server',
    desc: 'IT asset inventory and configuration management database tracking all IT hardware and software assets.',
    type: 'server', crit: 'operational', vendor: 'ServiceNow', model: 'ITOM 2024.Q1',
    fw: '2024.Q1-P3', ip: '10.1.5.21', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000015', name: 'Corporate Network Switch',
    desc: 'Core network switch providing Layer 2/3 connectivity for the corporate data center. Supports VLAN segmentation and QoS.',
    type: 'switch', crit: 'business_critical', vendor: 'Cisco', model: 'Catalyst 9500-48Y4C',
    fw: '17.9.4a', ip: '10.1.5.1', net: 'IT-CORP-VLAN50',
    purdueLevel: 5, zoneId: '72000000-0000-0000-0000-000000000001',
    loc: 'Corporate Data Center, Building 1',
    meta: { os: 'IOS-XE 17.9', portCount: 48, patchLevel: '2026-Q1' },
  },
];

// ── Level 4 — Business Planning & Logistics (20 assets) ──────────────────

const L4_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000016', name: 'MES Server',
    desc: 'Manufacturing Execution System server providing real-time production tracking, OEE calculation, and work order management per ISA-95 Level 3.',
    type: 'mes', crit: 'business_critical', vendor: 'Honeywell', model: 'Forge MES 4.0',
    fw: '4.0.2', ip: '10.1.4.10', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000017', name: 'LIMS Server',
    desc: 'Laboratory Information Management System managing sample tracking, quality analysis, and regulatory compliance data for product certification.',
    type: 'server', crit: 'business_critical', vendor: 'Thermo Fisher', model: 'SampleManager LIMS 12.2',
    fw: '12.2.3', ip: '10.1.4.11', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000018', name: 'Production Scheduling Server',
    desc: 'Production planning and scheduling system optimizing crude oil processing, unit operations, and product blending.',
    type: 'server', crit: 'business_critical', vendor: 'AspenTech', model: 'Aspen Plant Scheduler 15.1',
    fw: 'V15.1.1', ip: '10.1.4.12', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000019', name: 'Tank Farm Management Server',
    desc: 'Tank farm inventory management system tracking crude oil and product storage levels, movements, and custody transfers.',
    type: 'server', crit: 'business_critical', vendor: 'Emerson', model: 'DeltaV Tank Farm Manager 14.3',
    fw: '14.3.1', ip: '10.1.4.13', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000020', name: 'Pipeline Scheduling Server',
    desc: 'Pipeline scheduling and nomination system for crude supply and product distribution logistics.',
    type: 'server', crit: 'business_critical', vendor: 'Solarc', model: 'RightAngle 6.5',
    fw: '6.5.2', ip: '10.1.4.14', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000021', name: 'Document Management Server',
    desc: 'Engineering document management system storing P&IDs, PFDs, and operating procedures with version control.',
    type: 'server', crit: 'operational', vendor: 'AVEVA', model: 'Engineering Document Management 14.1',
    fw: '14.1.2', ip: '10.1.4.15', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000022', name: 'Business Analytics Server',
    desc: 'Business intelligence and analytics platform providing dashboards, KPIs, and trend analysis for refinery operations.',
    type: 'server', crit: 'operational', vendor: 'AspenTech', model: 'Aspen Mtell 22.1',
    fw: 'V22.1', ip: '10.1.4.16', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'RHEL 9.3', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000023', name: 'Regulatory Reporting Server',
    desc: 'Environmental compliance and regulatory reporting system managing emissions data, waste tracking, and permit compliance.',
    type: 'server', crit: 'business_critical', vendor: 'Enablon', model: 'EHS Platform 2024.1',
    fw: '2024.1.3', ip: '10.1.4.17', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000024', name: 'Maintenance Management Server',
    desc: 'Computerized maintenance management system (CMMS) for work order management, preventive maintenance scheduling, and spare parts inventory.',
    type: 'server', crit: 'business_critical', vendor: 'SAP', model: 'SAP PM (S/4HANA)',
    fw: 'S4H-2023-FPS01', ip: '10.1.4.18', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'SUSE Linux Enterprise 15 SP5', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000025', name: 'Environmental Monitoring Server',
    desc: 'Environmental monitoring system tracking air quality, water discharge, and soil contamination data for regulatory compliance.',
    type: 'server', crit: 'business_critical', vendor: 'ABB', model: 'Ability Environmental Monitoring 2.1',
    fw: '2.1.4', ip: '10.1.4.19', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000026', name: 'OT Historian Replica',
    desc: 'Replicated historian node at Level 4 providing read-only access to process data for business users. Data flows from Level 3 historian via the iDMZ.',
    type: 'historian', crit: 'business_critical', vendor: 'OSIsoft', model: 'PI Server 2018 R2',
    fw: '3.4.410.1181', ip: '10.1.4.20', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', role: 'read_replica', dataRetention: '7 years', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000027', name: 'Workstation — Plant Manager',
    desc: 'Plant manager workstation with access to production dashboards, KPIs, and business reports.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'OptiPlex 7010',
    fw: 'BIOS 1.18.1', ip: '10.1.4.30', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Plant Manager Office, Building 1',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000028', name: 'Workstation — Production Planner',
    desc: 'Production planner workstation with access to scheduling, blending, and optimization tools.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'OptiPlex 7010',
    fw: 'BIOS 1.18.1', ip: '10.1.4.31', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Planning Office, Building 1',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000029', name: 'Workstation — Lab Manager',
    desc: 'Laboratory manager workstation with access to LIMS and quality management systems.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'OptiPlex 7010',
    fw: 'BIOS 1.18.1', ip: '10.1.4.32', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Laboratory, Building 5',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000030', name: 'Workstation — Scheduler',
    desc: 'Pipeline scheduling workstation with access to nomination and scheduling systems.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'OptiPlex 7010',
    fw: 'BIOS 1.18.1', ip: '10.1.4.33', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Scheduling Office, Building 1',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000031', name: 'Supply Chain Management Server',
    desc: 'Supply chain management system tracking crude oil procurement, product distribution, and logistics coordination.',
    type: 'server', crit: 'business_critical', vendor: 'SAP', model: 'SAP IBP 2402',
    fw: '2402.1', ip: '10.1.4.21', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'SUSE Linux Enterprise 15 SP5', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000032', name: 'Business Planning Switch',
    desc: 'Managed network switch providing connectivity for the Business Planning zone. Supports VLAN segmentation and QoS.',
    type: 'switch', crit: 'business_critical', vendor: 'Cisco', model: 'Catalyst 9300-48U',
    fw: '17.9.4a', ip: '10.1.4.1', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'IOS-XE 17.9', portCount: 48, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000033', name: 'Workstation — Reliability Engineer',
    desc: 'Reliability engineer workstation with access to predictive maintenance and equipment health monitoring tools.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'Precision 3660',
    fw: 'BIOS 1.12.0', ip: '10.1.4.34', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Reliability Office, Building 12',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000034', name: 'Blending Optimization Server',
    desc: 'Online blending optimization system calculating optimal product recipes based on crude assays, product specs, and market prices.',
    type: 'server', crit: 'business_critical', vendor: 'Honeywell', model: 'Blend 4.0',
    fw: '4.0.1', ip: '10.1.4.22', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'IT Server Room, Building 12',
    meta: { os: 'Windows Server 2022', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000035', name: 'Workstation — Turnaround Planner',
    desc: 'Turnaround planning workstation with access to maintenance scheduling and project management tools.',
    type: 'workstation', crit: 'operational', vendor: 'Dell', model: 'OptiPlex 7010',
    fw: 'BIOS 1.18.1', ip: '10.1.4.35', net: 'IT-BUS-VLAN40',
    purdueLevel: 4, zoneId: '72000000-0000-0000-0000-000000000002',
    loc: 'Turnaround Office, Building 1',
    meta: { os: 'Windows 11 Enterprise', patchLevel: '2026-Q1' },
  },
];

// ── Level 3.5 — Industrial DMZ (9 new assets) ────────────────────────────

const L3_5_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000036', name: 'Data Diode',
    desc: 'Unidirectional security gateway allowing data flow from OT to IT only. Prevents any inbound connection from enterprise to control systems per IEC 62443-3-3 SR 5.1 RE 1.',
    type: 'gateway', crit: 'safety_critical', vendor: 'Owl Cyber Defense', model: 'OPDS-1000',
    fw: '4.5.2', ip: '10.10.3.30', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { direction: 'OT→IT only', throughput: '1Gbps', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000037', name: 'Reverse Proxy Server',
    desc: 'Reverse proxy providing authenticated access to OT web applications (HMI, historian) from the iDMZ. Enforces TLS 1.2+ and certificate-based authentication.',
    type: 'server', crit: 'business_critical', vendor: 'F5', model: 'BIG-IP i2600',
    fw: '17.1.1.2', ip: '10.10.3.40', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { os: 'TMOS 17.1', tlsVersion: '1.2+', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000038', name: 'AV Update Server',
    desc: 'Antivirus definition update server in the iDMZ staging updates from the internet before pushing to OT endpoints. Implements IEC 62443-2-4 SM-7.',
    type: 'server', crit: 'business_critical', vendor: 'CrowdStrike', model: 'Falcon Sensor 7.12',
    fw: '7.12.16203', ip: '10.10.3.50', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { os: 'RHEL 9.3', role: 'distribution_point', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000039', name: 'WSUS Server',
    desc: 'Windows Server Update Services server in the iDMZ staging and validating Windows updates before deployment to OT systems.',
    type: 'server', crit: 'business_critical', vendor: 'Microsoft', model: 'WSUS 2022',
    fw: 'KB5034441', ip: '10.10.3.60', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { os: 'Windows Server 2022', role: 'update_staging', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000040', name: 'IDS/IPS Sensor',
    desc: 'Intrusion detection and prevention sensor monitoring all traffic crossing the iDMZ boundary. Uses industrial protocol aware signatures for Modbus, PROFINET, and OPC UA.',
    type: 'server', crit: 'safety_critical', vendor: 'Claroty', model: 'Platform 23.2',
    fw: '23.2.4', ip: '10.10.3.70', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { mode: 'inline_ips', industrialProtocols: true, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000041', name: 'OPC UA Gateway',
    desc: 'OPC UA gateway in the iDMZ providing secure data access between OT and IT systems. Implements certificate-based authentication and role-based access control.',
    type: 'gateway', crit: 'business_critical', vendor: 'Matrikon', model: 'OPC UA Tunneller 6.3',
    fw: '6.3.2.412', ip: '10.10.3.80', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { securityPolicy: 'Basic256Sha256', authentication: 'certificate', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000042', name: 'Log Forwarder',
    desc: 'Syslog relay and log forwarder in the iDMZ collecting OT security logs and forwarding them to the enterprise SIEM. Ensures no direct OT-to-IT network path.',
    type: 'server', crit: 'business_critical', vendor: 'Rsyslog', model: '8.2402.0',
    fw: '8.2402.0', ip: '10.10.3.90', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { os: 'RHEL 9.3', protocol: 'TLS-encrypted syslog', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000043', name: 'Time Sync Server (iDMZ)',
    desc: 'Stratum-3 NTP server in the iDMZ providing time synchronization for OT devices. Synchronized from the corporate NTP server via the data diode.',
    type: 'server', crit: 'business_critical', vendor: 'Meinberg', model: 'M1000',
    fw: 'V6.2.2', ip: '10.10.3.100', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { stratum: 3, upstream: 'Corporate NTP Server', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000044', name: 'Network Tap',
    desc: 'Passive network tap providing mirror traffic to the IDS/IPS sensor for inline monitoring without introducing network latency.',
    type: 'other', crit: 'business_critical', vendor: 'Garland', model: 'PT1G-1000',
    fw: 'N/A', net: 'OT-IDMZ-VLAN30',
    purdueLevel: 3, zoneId: '71000000-0000-0000-0000-000000000002',
    loc: 'iDMZ Rack, Building 12',
    meta: { type: 'passive_tap', speed: '1Gbps' },
  },
];

// ── Level 3 — Operations Management (21 new assets) ──────────────────────

const L3_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000045', name: 'Operator Workstation — CDU',
    desc: 'Primary operator workstation for the Crude Distillation Unit. Provides real-time process monitoring, alarm management, and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.40', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 4, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000046', name: 'Operator Workstation — VDU',
    desc: 'Primary operator workstation for the Vacuum Distillation Unit. Provides real-time process monitoring and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.41', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 4, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000047', name: 'Operator Workstation — HDS',
    desc: 'Primary operator workstation for the Hydrodesulfurization Unit. Provides real-time process monitoring and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.42', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 4, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000048', name: 'Operator Workstation — Sulfur Unit',
    desc: 'Primary operator workstation for the Sulfur Recovery Unit. Provides real-time process monitoring and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.43', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 2, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000049', name: 'DCS Controller — Main',
    desc: 'Primary distributed control system controller managing the crude distillation and vacuum distillation units. Provides regulatory and advanced control strategies.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion PKS C300',
    fw: 'R510.6', ip: '10.10.2.50', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Honeywell proprietary RTOS', redundancy: 'hot_standby', controlLoops: 240, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000050', name: 'DCS Controller — Backup',
    desc: 'Secondary DCS controller providing hot standby redundancy for the primary controller. Automatic failover within 500ms.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion PKS C300',
    fw: 'R510.6', ip: '10.10.2.51', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Honeywell proprietary RTOS', redundancy: 'hot_standby_primary', controlLoops: 240, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000051', name: 'Alarm Management Server',
    desc: 'Alarm management and rationalization server implementing ISA-18.2 alarm management standards. Provides alarm shelving, state-based alarming, and analytics.',
    type: 'server', crit: 'safety_critical', vendor: 'Honeywell', model: 'Dynamic Alarm Manager R510',
    fw: 'R510.6', ip: '10.10.2.52', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows Server 2019 LTSC', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000052', name: 'OPC UA Server',
    desc: 'OPC UA server providing standardized data access to real-time process data from the DCS and PLC systems. Supports OPC UA Part 14 (Pub/Sub) for event distribution.',
    type: 'server', crit: 'business_critical', vendor: 'Matrikon', model: 'OPC Server 6.3',
    fw: '6.3.2.412', ip: '10.10.2.53', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows Server 2019 LTSC', protocol: 'OPC UA', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000053', name: 'RTDB Server',
    desc: 'Real-time database server providing high-speed data caching and event processing for the SCADA system. Supports 100K+ tags per second.',
    type: 'server', crit: 'business_critical', vendor: 'Honeywell', model: 'PHD Server R510',
    fw: 'R510.6', ip: '10.10.2.54', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows Server 2019 LTSC', tagCapacity: '500K', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000054', name: 'Anti-Surge Controller',
    desc: 'Dedicated anti-surge controller for the refinery compressors. Implements compressor map monitoring and recycle valve control to prevent surge conditions.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Compressor Controls', model: 'Series 4',
    fw: 'V4.3.1', ip: '10.10.2.55', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Compressor Building, Area 3',
    meta: { os: 'CCC proprietary RTOS', controlLoops: 6, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000055', name: 'Data Historian Gateway',
    desc: 'Gateway server providing secure data replication from the OT historian to the iDMZ historian replica. Uses OPC UA over TLS.',
    type: 'server', crit: 'business_critical', vendor: 'OSIsoft', model: 'PI API Node 2018 R2',
    fw: '3.4.410.1181', ip: '10.10.2.56', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows Server 2019 LTSC', protocol: 'OPC UA/TLS', patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000056', name: 'Operations Firewall',
    desc: 'Internal firewall segmenting the SCADA zone from the PLC and supervisory zones. Enforces industrial protocol filtering.',
    type: 'firewall', crit: 'safety_critical', vendor: 'Fortinet', model: 'FortiGate Rugged 60F',
    fw: 'FortiOS 7.4.3', ip: '10.10.2.2', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'FortiOS 7.4', dpiEnabled: true, industrialProtocolInspection: ['Modbus/TCP', 'PROFINET'], patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000057', name: 'Network Monitor',
    desc: 'Network monitoring and traffic analysis system for the OT network. Provides passive monitoring via SPAN ports and protocol analysis.',
    type: 'server', crit: 'business_critical', vendor: 'Nozomi', model: 'Guardian 22.3',
    fw: '22.3.2', ip: '10.10.2.57', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { mode: 'passive_monitoring', industrialProtocols: true, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000058', name: 'Control Room Display — CDU',
    desc: 'Large format display in the control room showing the CDU process overview, alarm summary, and key performance indicators.',
    type: 'other', crit: 'operational', vendor: 'Samsung', model: 'QM85B 85"',
    fw: 'T-QM85BAAKX-1100.1', ip: '10.10.2.58', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { type: 'display', resolution: '3840x2160', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000059', name: 'Control Room Display — VDU',
    desc: 'Large format display in the control room showing the VDU process overview and alarm summary.',
    type: 'other', crit: 'operational', vendor: 'Samsung', model: 'QM85B 85"',
    fw: 'T-QM85BAAKX-1100.1', ip: '10.10.2.59', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { type: 'display', resolution: '3840x2160', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000060', name: 'Operator Workstation — Tank Farm',
    desc: 'Operator workstation for the tank farm area. Provides tank level monitoring, custody transfer tracking, and alarm management.',
    type: 'hmi', crit: 'business_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.60', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 3, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000061', name: 'Operator Workstation — Utilities',
    desc: 'Operator workstation for the utilities area including boiler house, cooling water, and flare systems.',
    type: 'hmi', crit: 'business_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.61', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 2, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000062', name: 'Surge Vessel Monitor',
    desc: 'Dedicated monitoring system for surge vessels and knock-out drums. Provides high-integrity pressure protection system (HIPPS) monitoring.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV SIS 14.3',
    fw: 'DV14.3.1', ip: '10.10.2.62', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Compressor Building, Area 3',
    meta: { os: 'DeltaV proprietary RTOS', silLevel: 'SIL 3', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000063', name: 'Control Room Display — Utilities',
    desc: 'Large format display in the control room showing utilities overview including boiler, cooling water, and flare system status.',
    type: 'other', crit: 'operational', vendor: 'Samsung', model: 'QM75B 75"',
    fw: 'T-QM75BAAKX-1100.1', ip: '10.10.2.63', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { type: 'display', resolution: '3840x2160', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000064', name: 'Operator Workstation — Hydrocracker',
    desc: 'Operator workstation for the Hydrocracker Unit. Provides real-time process monitoring, alarm management, and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.44', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 4, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000065', name: 'Operator Workstation — Reformer',
    desc: 'Operator workstation for the Catalytic Reformer Unit. Provides real-time process monitoring and control adjustments.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion Station R510',
    fw: 'R510.6', ip: '10.10.2.45', net: 'OT-SCADA-VLAN20',
    purdueLevel: 2, zoneId: '71000000-0000-0000-0000-000000000003',
    loc: 'Control Room A, Building 12',
    meta: { os: 'Windows 10 Enterprise LTSC 2021', displays: 4, patchLevel: '2026-Q1' },
  },
];

// ── Level 2 — Supervisory Control (30 assets) ────────────────────────────

const L2_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000066', name: 'Area HMI — CDU',
    desc: 'Area HMI panel for the Crude Distillation Unit providing local monitoring and control interface for field operators.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.100', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'CDU Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000067', name: 'Area HMI — VDU',
    desc: 'Area HMI panel for the Vacuum Distillation Unit.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.101', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VDU Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000068', name: 'Area HMI — Hydrocracker',
    desc: 'Area HMI panel for the Hydrocracker Unit.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.102', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Hydrocracker Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000069', name: 'Area HMI — Reformer',
    desc: 'Area HMI panel for the Catalytic Reformer Unit.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.103', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Reformer Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000070', name: 'Area HMI — Alkylation',
    desc: 'Area HMI panel for the Alkylation Unit.',
    type: 'hmi', crit: 'business_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.104', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Alkylation Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000071', name: 'Area HMI — Tank Farm',
    desc: 'Area HMI panel for the Tank Farm area.',
    type: 'hmi', crit: 'business_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.105', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Tank Farm, Area 7',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000072', name: 'Area HMI — Utilities',
    desc: 'Area HMI panel for the Utilities area including boiler house and cooling water.',
    type: 'hmi', crit: 'business_critical', vendor: 'Siemens', model: 'SIMATIC IPC427E',
    fw: 'V2.5.2', ip: '10.10.2.106', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Utilities Area, Field Shelter',
    meta: { os: 'Windows 10 IoT Enterprise', display: '15" touch', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000073', name: 'Local Operator Panel — CDU',
    desc: 'Local operator panel near the CDU providing basic monitoring and emergency shutdown capability.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.107', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'CDU Area, Motor Control Center',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000074', name: 'Local Operator Panel — VDU',
    desc: 'Local operator panel near the VDU providing basic monitoring and emergency shutdown capability.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.108', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VDU Area, Motor Control Center',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000075', name: 'Local Operator Panel — Hydrocracker',
    desc: 'Local operator panel near the Hydrocracker Unit.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.109', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Hydrocracker Area, Motor Control Center',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000076', name: 'Data Concentrator — North',
    desc: 'Data concentrator aggregating process data from CDU, VDU, and Hydrocracker area PLCs. Provides OPC UA interface to the SCADA layer.',
    type: 'gateway', crit: 'business_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.110', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'North I/O Building, Area 4',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'OPC UA', connectedPlcs: 12, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000077', name: 'Data Concentrator — South',
    desc: 'Data concentrator aggregating process data from Reformer, Alkylation, and Sulfur area PLCs.',
    type: 'gateway', crit: 'business_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.111', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'South I/O Building, Area 6',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'OPC UA', connectedPlcs: 10, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000078', name: 'Data Concentrator — Tank Farm',
    desc: 'Data concentrator aggregating tank level and custody transfer data from the tank farm RTUs.',
    type: 'gateway', crit: 'business_critical', vendor: 'ABB', model: 'AC500-S CPU PM592-S',
    fw: 'V3.4.1', ip: '10.10.2.112', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Tank Farm Control Room, Area 7',
    meta: { os: 'ABB proprietary RTOS', protocol: 'Modbus/TCP', connectedRtus: 8, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000079', name: 'Motor Control Center — Area 1',
    desc: 'Intelligent motor control center for CDU and VDU area motors. Provides motor protection, starting, and monitoring.',
    type: 'other', crit: 'business_critical', vendor: 'Schneider', model: 'EcoStruxure MCC',
    fw: 'V3.1.2', ip: '10.10.2.113', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Motor Control Center, Area 1',
    meta: { protocol: 'Modbus/TCP', motorCount: 45, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000080', name: 'Motor Control Center — Area 2',
    desc: 'Intelligent motor control center for Hydrocracker and Reformer area motors.',
    type: 'other', crit: 'business_critical', vendor: 'Schneider', model: 'EcoStruxure MCC',
    fw: 'V3.1.2', ip: '10.10.2.114', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Motor Control Center, Area 2',
    meta: { protocol: 'Modbus/TCP', motorCount: 38, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000081', name: 'Motor Control Center — Area 3',
    desc: 'Intelligent motor control center for Alkylation and Sulfur area motors.',
    type: 'other', crit: 'business_critical', vendor: 'ABB', model: 'MCC ABB MNS',
    fw: 'V2.8.1', ip: '10.10.2.115', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Motor Control Center, Area 3',
    meta: { protocol: 'Modbus/TCP', motorCount: 32, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000082', name: 'VFD — Group A',
    desc: 'Variable frequency drive group for CDU and VDU pumps. Provides speed control and energy optimization.',
    type: 'vfd', crit: 'business_critical', vendor: 'ABB', model: 'ACS880-01-060A-3',
    fw: '2.10.4', ip: '10.10.2.116', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VFD Room, Area 1',
    meta: { protocol: 'Modbus/TCP', driveCount: 8, patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000083', name: 'VFD — Group B',
    desc: 'Variable frequency drive group for Hydrocracker and Reformer pumps.',
    type: 'vfd', crit: 'business_critical', vendor: 'ABB', model: 'ACS880-01-060A-3',
    fw: '2.10.4', ip: '10.10.2.117', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VFD Room, Area 2',
    meta: { protocol: 'Modbus/TCP', driveCount: 6, patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000084', name: 'VFD — Group C',
    desc: 'Variable frequency drive group for compressors and cooling water pumps.',
    type: 'vfd', crit: 'business_critical', vendor: 'Siemens', model: 'SINAMICS G120',
    fw: 'V4.8.2', ip: '10.10.2.118', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VFD Room, Area 3',
    meta: { protocol: 'PROFINET', driveCount: 4, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000085', name: 'Area Network Switch — North',
    desc: 'Managed industrial Ethernet switch for the northern area supervisory network. Supports VLAN segmentation and ring redundancy.',
    type: 'switch', crit: 'business_critical', vendor: 'Hirschmann', model: 'BOBCAT 9610G',
    fw: '09.0.04', ip: '10.10.2.3', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'North I/O Building, Area 4',
    meta: { os: 'HiOS 9.0', portCount: 10, ringRedundancy: 'HIPER-Ring', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000086', name: 'Area Network Switch — South',
    desc: 'Managed industrial Ethernet switch for the southern area supervisory network.',
    type: 'switch', crit: 'business_critical', vendor: 'Hirschmann', model: 'BOBCAT 9610G',
    fw: '09.0.04', ip: '10.10.2.4', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'South I/O Building, Area 6',
    meta: { os: 'HiOS 9.0', portCount: 10, ringRedundancy: 'HIPER-Ring', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000087', name: 'Local Operator Panel — Reformer',
    desc: 'Local operator panel near the Catalytic Reformer Unit.',
    type: 'hmi', crit: 'safety_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.119', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Reformer Area, Motor Control Center',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000088', name: 'Local Operator Panel — Alkylation',
    desc: 'Local operator panel near the Alkylation Unit.',
    type: 'hmi', crit: 'business_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.120', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Alkylation Area, Motor Control Center',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000089', name: 'Local Operator Panel — Tank Farm',
    desc: 'Local operator panel near the Tank Farm area.',
    type: 'hmi', crit: 'business_critical', vendor: 'Schneider', model: 'Magelis XBTGC4430',
    fw: 'V6.2.11', ip: '10.10.2.121', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Tank Farm Control Room, Area 7',
    meta: { display: '12" touch', protocol: 'Modbus/TCP', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000090', name: 'Supervisory PLC — CDU',
    desc: 'Supervisory PLC providing sequence control and interlock logic for the CDU startup and shutdown procedures.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.122', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'CDU Area, Motor Control Center',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000091', name: 'Supervisory PLC — VDU',
    desc: 'Supervisory PLC providing sequence control and interlock logic for the VDU.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.123', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'VDU Area, Motor Control Center',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000092', name: 'Supervisory PLC — Hydrocracker',
    desc: 'Supervisory PLC providing sequence control and interlock logic for the Hydrocracker Unit.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.124', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Hydrocracker Area, Motor Control Center',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000093', name: 'Supervisory PLC — Reformer',
    desc: 'Supervisory PLC providing sequence control and interlock logic for the Catalytic Reformer.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1516-3',
    fw: 'V2.9.2', ip: '10.10.2.125', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Reformer Area, Motor Control Center',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000094', name: 'Supervisory PLC — Alkylation',
    desc: 'Supervisory PLC providing sequence control and interlock logic for the Alkylation Unit.',
    type: 'plc', crit: 'business_critical', vendor: 'Schneider', model: 'Modicon M580 CPU P580204',
    fw: 'V3.60', ip: '10.10.2.126', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Alkylation Area, Motor Control Center',
    meta: { os: 'Schneider proprietary RTOS', protocol: 'Ethernet/IP', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000095', name: 'Supervisory PLC — Utilities',
    desc: 'Supervisory PLC providing sequence control for the utilities area including boiler management and flare system.',
    type: 'plc', crit: 'business_critical', vendor: 'Schneider', model: 'Modicon M580 CPU P580204',
    fw: 'V3.60', ip: '10.10.2.127', net: 'OT-SUP-VLAN25',
    purdueLevel: 2, zoneId: '72000000-0000-0000-0000-000000000004',
    loc: 'Utilities Area, Motor Control Center',
    meta: { os: 'Schneider proprietary RTOS', protocol: 'Ethernet/IP', scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
];

// ── Level 1 — Basic Control (32 new assets) ──────────────────────────────

const L1_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000096', name: 'Allen-Bradley ControlLogix PLC — CDU',
    desc: 'ControlLogix PLC executing continuous control loops for the crude distillation unit. Handles temperature, pressure, and flow regulation.',
    type: 'plc', crit: 'safety_critical', vendor: 'Rockwell', model: 'ControlLogix 5580 L85E',
    fw: 'V35.017', ip: '10.10.1.30', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'CDU Area, I/O Cabinet',
    meta: { os: 'Rockwell proprietary RTOS', protocol: 'EtherNet/IP', controlLoops: 48, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000097', name: 'Allen-Bradley ControlLogix PLC — VDU',
    desc: 'ControlLogix PLC executing continuous control loops for the vacuum distillation unit.',
    type: 'plc', crit: 'safety_critical', vendor: 'Rockwell', model: 'ControlLogix 5580 L85E',
    fw: 'V35.017', ip: '10.10.1.31', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'VDU Area, I/O Cabinet',
    meta: { os: 'Rockwell proprietary RTOS', protocol: 'EtherNet/IP', controlLoops: 36, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000098', name: 'Siemens S7-1500 PLC — Hydrocracker',
    desc: 'Siemens S7-1500 PLC executing advanced control strategies for the hydrocracker unit including reactor temperature profiling and product fractionation.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1518-4',
    fw: 'V2.9.2', ip: '10.10.1.32', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Hydrocracker Area, I/O Cabinet',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', controlLoops: 64, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000099', name: 'Siemens S7-1500 PLC — Reformer',
    desc: 'Siemens S7-1500 PLC executing control strategies for the catalytic reformer including catalyst regeneration sequencing.',
    type: 'plc', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500 CPU 1517-3',
    fw: 'V2.9.2', ip: '10.10.1.33', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Reformer Area, I/O Cabinet',
    meta: { os: 'Siemens proprietary RTOS', protocol: 'PROFINET', controlLoops: 52, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000100', name: 'Schneider Modicon M580 PLC — Alkylation',
    desc: 'Modicon M580 PLC executing control logic for the alkylation unit including acid catalyst management and product quality control.',
    type: 'plc', crit: 'safety_critical', vendor: 'Schneider', model: 'Modicon M580 CPU P580204',
    fw: 'V3.60', ip: '10.10.1.34', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Alkylation Area, I/O Cabinet',
    meta: { os: 'Schneider proprietary RTOS', protocol: 'Ethernet/IP', controlLoops: 40, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000101', name: 'Schneider Modicon M580 PLC — Tank Farm',
    desc: 'Modicon M580 PLC managing tank farm operations including level monitoring, custody transfer, and blending sequences.',
    type: 'plc', crit: 'business_critical', vendor: 'Schneider', model: 'Modicon M580 CPU P580204',
    fw: 'V3.60', ip: '10.10.1.35', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Tank Farm, Area 7',
    meta: { os: 'Schneider proprietary RTOS', protocol: 'Ethernet/IP', controlLoops: 24, scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000102', name: 'ABB AC500 PLC — Utilities',
    desc: 'ABB AC500 PLC managing utility systems including boiler control, cooling water, and instrument air.',
    type: 'plc', crit: 'business_critical', vendor: 'ABB', model: 'AC500-S CPU PM592-S',
    fw: 'V3.4.1', ip: '10.10.1.36', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Utilities Area, I/O Cabinet',
    meta: { os: 'ABB proprietary RTOS', protocol: 'Modbus/TCP', controlLoops: 32, scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000103', name: 'ABB AC500 PLC — Sulfur Unit',
    desc: 'ABB AC500 PLC managing the sulfur recovery unit including Claus reactor control and tail gas treatment.',
    type: 'plc', crit: 'business_critical', vendor: 'ABB', model: 'AC500-S CPU PM592-S',
    fw: 'V3.4.1', ip: '10.10.1.37', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Sulfur Area, I/O Cabinet',
    meta: { os: 'ABB proprietary RTOS', protocol: 'Modbus/TCP', controlLoops: 28, scanCycle: '100ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000104', name: 'Safety PLC — Burner Management',
    desc: 'Safety PLC implementing the Burner Management System (BMS) for all fired heaters. SIL 2 rated per IEC 61511.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500F CPU 1517F-3',
    fw: 'V2.9.2', ip: '10.10.1.40', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'Siemens F-Runtime', protocol: 'PROFIsafe', silLevel: 'SIL 2', safetyFunctions: 8, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000105', name: 'Safety PLC — Emergency Shutdown',
    desc: 'Safety PLC implementing the Emergency Shutdown System (ESD) for the entire refinery. SIL 3 rated per IEC 61511. Independent from basic process control.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500F CPU 1518-4',
    fw: 'V2.9.2', ip: '10.10.1.41', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'Siemens F-Runtime', protocol: 'PROFIsafe', silLevel: 'SIL 3', safetyFunctions: 24, scanCycle: '25ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000106', name: 'Safety PLC — Fire & Gas',
    desc: 'Safety PLC implementing the Fire and Gas Detection System (FGS) for the entire refinery. SIL 2 rated per IEC 61511.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV SIS 14.3',
    fw: 'DV14.3.1', ip: '10.10.1.42', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'DeltaV proprietary RTOS', protocol: 'PROFIsafe', silLevel: 'SIL 2', safetyFunctions: 16, scanCycle: '50ms', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000107', name: 'Emerson DeltaV Controller — CDU',
    desc: 'DeltaV controller providing advanced regulatory control for the CDU. Implements model predictive control (MPC) for column optimization.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV S-series PK Controller',
    fw: 'DV14.3.1', ip: '10.10.1.43', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'CDU Area, I/O Cabinet',
    meta: { os: 'DeltaV proprietary RTOS', protocol: 'PROFINET', controlLoops: 32, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000108', name: 'Emerson DeltaV Controller — VDU',
    desc: 'DeltaV controller providing advanced regulatory control for the VDU.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV S-series PK Controller',
    fw: 'DV14.3.1', ip: '10.10.1.44', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'VDU Area, I/O Cabinet',
    meta: { os: 'DeltaV proprietary RTOS', protocol: 'PROFINET', controlLoops: 24, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000109', name: 'Honeywell C300 Controller — Hydrocracker',
    desc: 'Honeywell C300 controller providing advanced regulatory control for the hydrocracker unit.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion PKS C300',
    fw: 'R510.6', ip: '10.10.1.45', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Hydrocracker Area, I/O Cabinet',
    meta: { os: 'Honeywell proprietary RTOS', protocol: 'ControlNet', controlLoops: 40, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000110', name: 'Honeywell C300 Controller — Reformer',
    desc: 'Honeywell C300 controller providing advanced regulatory control for the catalytic reformer.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Honeywell', model: 'Experion PKS C300',
    fw: 'R510.6', ip: '10.10.1.46', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Reformer Area, I/O Cabinet',
    meta: { os: 'Honeywell proprietary RTOS', protocol: 'ControlNet', controlLoops: 36, patchLevel: '2026-Q1' },
  },
  {
    id: '82000000-0000-0000-0000-000000000111', name: 'Yokogawa CENTUM Controller — Alkylation',
    desc: 'Yokogawa CENTUM VP controller providing advanced regulatory control for the alkylation unit.',
    type: 'dcs_controller', crit: 'safety_critical', vendor: 'Yokogawa', model: 'CENTUM VP R6.09',
    fw: 'R6.09.10', ip: '10.10.1.47', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Alkylation Area, I/O Cabinet',
    meta: { os: 'Yokogawa proprietary RTOS', protocol: 'Vnet/IP', controlLoops: 30, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000112', name: 'Yokogawa CENTUM Controller — Tank Farm',
    desc: 'Yokogawa CENTUM VP controller providing tank farm monitoring and control.',
    type: 'dcs_controller', crit: 'business_critical', vendor: 'Yokogawa', model: 'CENTUM VP R6.09',
    fw: 'R6.09.10', ip: '10.10.1.48', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Tank Farm, Area 7',
    meta: { os: 'Yokogawa proprietary RTOS', protocol: 'Vnet/IP', controlLoops: 18, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000113', name: 'VFD — Crude Charge Pump',
    desc: 'Variable frequency drive controlling the crude oil charge pump motor. Provides soft start and speed control for energy optimization.',
    type: 'vfd', crit: 'safety_critical', vendor: 'ABB', model: 'ACS880-01-180A-3',
    fw: '2.10.4', ip: '10.10.1.50', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'CDU Area, Motor Room',
    meta: { protocol: 'Modbus/TCP', ratedPower: '132kW', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000114', name: 'VFD — Vacuum Heater Feed',
    desc: 'Variable frequency drive controlling the vacuum heater feed pump.',
    type: 'vfd', crit: 'safety_critical', vendor: 'ABB', model: 'ACS880-01-120A-3',
    fw: '2.10.4', ip: '10.10.1.51', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'VDU Area, Motor Room',
    meta: { protocol: 'Modbus/TCP', ratedPower: '90kW', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000115', name: 'VFD — Hydrocracker Charge',
    desc: 'Variable frequency drive controlling the hydrocracker charge pump.',
    type: 'vfd', crit: 'safety_critical', vendor: 'Siemens', model: 'SINAMICS G150',
    fw: 'V4.8.2', ip: '10.10.1.52', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Hydrocracker Area, Motor Room',
    meta: { protocol: 'PROFINET', ratedPower: '200kW', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000116', name: 'VFD — Reformer Feed',
    desc: 'Variable frequency drive controlling the reformer feed pump.',
    type: 'vfd', crit: 'safety_critical', vendor: 'Siemens', model: 'SINAMICS G150',
    fw: 'V4.8.2', ip: '10.10.1.53', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Reformer Area, Motor Room',
    meta: { protocol: 'PROFINET', ratedPower: '160kW', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000117', name: 'VFD — Recycle Compressor',
    desc: 'Variable frequency drive controlling the recycle gas compressor motor. Critical for process safety and product quality.',
    type: 'vfd', crit: 'safety_critical', vendor: 'Siemens', model: 'SINAMICS GM150',
    fw: 'V4.8.2', ip: '10.10.1.54', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Compressor Building, Area 3',
    meta: { protocol: 'PROFINET', ratedPower: '500kW', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000118', name: 'Motor Protection Relay — Group A',
    desc: 'Intelligent motor protection relay group for CDU and VDU area motors. Provides overload, earth fault, and stall protection.',
    type: 'other', crit: 'business_critical', vendor: 'Siemens', model: 'SIMOCODE pro V',
    fw: 'V4.2', ip: '10.10.1.55', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Motor Control Center, Area 1',
    meta: { protocol: 'PROFINET', motorCount: 24, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000119', name: 'Motor Protection Relay — Group B',
    desc: 'Intelligent motor protection relay group for Hydrocracker and Reformer area motors.',
    type: 'other', crit: 'business_critical', vendor: 'Siemens', model: 'SIMOCODE pro V',
    fw: 'V4.2', ip: '10.10.1.56', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Motor Control Center, Area 2',
    meta: { protocol: 'PROFINET', motorCount: 20, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000120', name: 'Motor Protection Relay — Group C',
    desc: 'Intelligent motor protection relay group for Alkylation and Utilities area motors.',
    type: 'other', crit: 'business_critical', vendor: 'ABB', model: 'REF615 Protection Relay',
    fw: 'V2.1.3', ip: '10.10.1.57', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Motor Control Center, Area 3',
    meta: { protocol: 'Modbus/TCP', motorCount: 18, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000121', name: 'SIL 2 Logic Solver — Flare',
    desc: 'SIL 2 rated logic solver for the flare system. Implements high-integrity pressure protection and flare tip monitoring.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV SIS 14.3',
    fw: 'DV14.3.1', ip: '10.10.1.60', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'DeltaV proprietary RTOS', protocol: 'PROFIsafe', silLevel: 'SIL 2', safetyFunctions: 6, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000122', name: 'SIL 2 Logic Solver — Blowdown',
    desc: 'SIL 2 rated logic solver for the blowdown system. Implements blowdown valve sequencing and pressure relief monitoring.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Emerson', model: 'DeltaV SIS 14.3',
    fw: 'DV14.3.1', ip: '10.10.1.61', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'DeltaV proprietary RTOS', protocol: 'PROFIsafe', silLevel: 'SIL 2', safetyFunctions: 8, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000123', name: 'SIL 3 Logic Solver — ESD',
    desc: 'SIL 3 rated logic solver for the Emergency Shutdown System. Implements process shutdown, fire and gas, and emergency depressurization.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500F CPU 1518-4',
    fw: 'V2.9.2', ip: '10.10.1.62', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'Siemens F-Runtime', protocol: 'PROFIsafe', silLevel: 'SIL 3', safetyFunctions: 18, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000124', name: 'SIL 3 Logic Solver — F&G',
    desc: 'SIL 3 rated logic solver for the Fire and Gas Detection System. Implements gas detection, fire detection, and alarm management.',
    type: 'safety_controller', crit: 'safety_critical', vendor: 'Siemens', model: 'SIMATIC S7-1500F CPU 1517F-3',
    fw: 'V2.9.2', ip: '10.10.1.63', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'Siemens F-Runtime', protocol: 'PROFIsafe', silLevel: 'SIL 3', safetyFunctions: 14, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000125', name: 'PLC Network Switch — VLAN 10',
    desc: 'Managed industrial Ethernet switch for the PLC network. Supports VLAN segmentation and rapid spanning tree for the basic control layer.',
    type: 'switch', crit: 'business_critical', vendor: 'Hirschmann', model: 'BOBCAT 9610G',
    fw: '09.0.04', ip: '10.10.1.1', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Motor Control Center, Area 4',
    meta: { os: 'HiOS 9.0', portCount: 10, ringRedundancy: 'HIPER-Ring', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000126', name: 'PLC Network Switch — VLAN 15',
    desc: 'Managed industrial Ethernet switch for the SIS network. Physically separate from the basic control network.',
    type: 'switch', crit: 'safety_critical', vendor: 'Hirschmann', model: 'BOBCAT 9610G',
    fw: '09.0.04', ip: '10.10.1.2', net: 'OT-SIS-VLAN15',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000004',
    loc: 'SIS Cabinet, Area 4',
    meta: { os: 'HiOS 9.0', portCount: 10, ringRedundancy: 'HIPER-Ring', patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000127', name: 'Remote I/O — CDU',
    desc: 'Remote I/O drop providing distributed I/O for the CDU. Connected to the main PLC via PROFINET.',
    type: 'other', crit: 'safety_critical', vendor: 'Siemens', model: 'ET 200MP IM 155-6',
    fw: 'V4.3', ip: '10.10.1.70', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'CDU Area, Field Cabinet',
    meta: { protocol: 'PROFINET', ioModules: 12, patchLevel: '2025-Q4' },
  },
  {
    id: '82000000-0000-0000-0000-000000000128', name: 'Remote I/O — Hydrocracker',
    desc: 'Remote I/O drop providing distributed I/O for the Hydrocracker.',
    type: 'other', crit: 'safety_critical', vendor: 'Siemens', model: 'ET 200MP IM 155-6',
    fw: 'V4.3', ip: '10.10.1.71', net: 'OT-PLC-VLAN10',
    purdueLevel: 1, zoneId: '71000000-0000-0000-0000-000000000005',
    loc: 'Hydrocracker Area, Field Cabinet',
    meta: { protocol: 'PROFINET', ioModules: 10, patchLevel: '2025-Q4' },
  },
];

// ── Level 0 — Process (34 new assets) ────────────────────────────────────

const L0_ASSETS: AssetDef[] = [
  {
    id: '82000000-0000-0000-0000-000000000129', name: 'Temperature Transmitter — CDU',
    desc: 'Temperature transmitter measuring crude column overhead temperature. HART protocol enabled for diagnostics.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Rosemount 644',
    fw: 'V2.4.1', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Column 1',
    meta: { protocol: 'HART', range: '-50 to 400°C', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000130', name: 'Pressure Transmitter — CDU',
    desc: 'Pressure transmitter measuring crude column operating pressure.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Rosemount 3051S',
    fw: 'V1.8.3', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Column 1',
    meta: { protocol: 'HART', range: '0-10 bar', accuracy: '±0.04%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000131', name: 'Flow Transmitter — CDU',
    desc: 'Coriolis mass flow transmitter measuring crude oil feed rate.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Micro Motion 5700',
    fw: 'V3.2.1', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Feed Line',
    meta: { protocol: 'HART', measurement: 'mass_flow', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000132', name: 'Level Transmitter — CDU',
    desc: 'Radar level transmitter measuring column bottoms level.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Rosemount 5300',
    fw: 'V2.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Column 1',
    meta: { protocol: 'HART', measurement: 'radar_level', accuracy: '±1mm', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000133', name: 'Temperature Transmitter — VDU',
    desc: 'Temperature transmitter measuring vacuum column temperature.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Yokogawa', model: 'YTA710',
    fw: 'V1.2.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Column 2',
    meta: { protocol: 'HART', range: '-50 to 400°C', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000134', name: 'Pressure Transmitter — VDU',
    desc: 'Pressure transmitter measuring vacuum column pressure.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Yokogawa', model: 'EJA530A',
    fw: 'V1.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Column 2',
    meta: { protocol: 'HART', range: '0-1 bar', accuracy: '±0.04%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000135', name: 'Flow Transmitter — VDU',
    desc: 'Flow transmitter measuring vacuum heater feed rate.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Yokogawa', model: 'Rotamass 3',
    fw: 'V2.0.1', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Feed Line',
    meta: { protocol: 'HART', measurement: 'mass_flow', accuracy: '±0.15%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000136', name: 'Level Transmitter — VDU',
    desc: 'Differential pressure level transmitter measuring vacuum column bottoms.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Yokogawa', model: 'EJA310A',
    fw: 'V1.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Column 2',
    meta: { protocol: 'HART', measurement: 'dp_level', accuracy: '±0.04%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000137', name: 'Temperature Transmitter — Hydrocracker',
    desc: 'Temperature transmitter measuring hydrocracker reactor temperature.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Rosemount 644',
    fw: 'V2.4.1', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Hydrocracker Area, Reactor',
    meta: { protocol: 'HART', range: '0-600°C', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000138', name: 'Pressure Transmitter — Hydrocracker',
    desc: 'Pressure transmitter measuring hydrocracker reactor pressure.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Rosemount 3051S',
    fw: 'V1.8.3', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Hydrocracker Area, Reactor',
    meta: { protocol: 'HART', range: '0-200 bar', accuracy: '±0.04%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000139', name: 'Flow Transmitter — Hydrocracker',
    desc: 'Coriolis flow transmitter measuring hydrocracker feed rate.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Emerson', model: 'Micro Motion 5700',
    fw: 'V3.2.1', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Hydrocracker Area, Feed Line',
    meta: { protocol: 'HART', measurement: 'mass_flow', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000140', name: 'Temperature Transmitter — Reformer',
    desc: 'Temperature transmitter measuring reformer reactor temperature.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Honeywell', model: 'STT850',
    fw: 'V1.5.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Reformer Area, Reactor',
    meta: { protocol: 'HART', range: '0-600°C', accuracy: '±0.1%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000141', name: 'Pressure Transmitter — Reformer',
    desc: 'Pressure transmitter measuring reformer reactor pressure.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Honeywell', model: 'STG800',
    fw: 'V1.5.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Reformer Area, Reactor',
    meta: { protocol: 'HART', range: '0-50 bar', accuracy: '±0.04%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000142', name: 'Flow Transmitter — Reformer',
    desc: 'Flow transmitter measuring reformer feed rate.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Honeywell', model: 'SMV800',
    fw: 'V1.5.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Reformer Area, Feed Line',
    meta: { protocol: 'HART', measurement: 'volumetric_flow', accuracy: '±0.5%', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000143', name: 'Control Valve — CDU',
    desc: 'Control valve regulating crude column overhead temperature via reflux flow control.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher ET',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Reflux Line',
    meta: { protocol: '4-20mA', size: '4"', actuator: 'pneumatic', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000144', name: 'Control Valve — VDU',
    desc: 'Control valve regulating vacuum column overhead temperature.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher ET',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Reflux Line',
    meta: { protocol: '4-20mA', size: '3"', actuator: 'pneumatic', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000145', name: 'Control Valve — Hydrocracker',
    desc: 'Control valve regulating hydrocracker reactor temperature via quench flow control.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher ED',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Hydrocracker Area, Quench Line',
    meta: { protocol: '4-20mA', size: '6"', actuator: 'pneumatic', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000146', name: 'Control Valve — Reformer',
    desc: 'Control valve regulating reformer reactor temperature via feed flow control.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher ED',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Reformer Area, Feed Line',
    meta: { protocol: '4-20mA', size: '4"', actuator: 'pneumatic', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000147', name: 'Control Valve — Alkylation',
    desc: 'Control valve regulating alkylation reactor temperature.',
    type: 'actuator', crit: 'business_critical', vendor: 'Flowserve', model: 'Logix 3200IQ',
    fw: 'V1.3.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Alkylation Area, Reactor Line',
    meta: { protocol: '4-20mA', size: '3"', actuator: 'electric', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000148', name: 'On/Off Valve — ESD',
    desc: 'Emergency shutdown valve for process isolation. Fail-closed with spring return actuator.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher V-Ball ESD',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Multiple locations',
    meta: { protocol: 'Solenoid', failPosition: 'closed', silLevel: 'SIL 3', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000149', name: 'On/Off Valve — BDV',
    desc: 'Blowdown valve for emergency depressurization. Fail-open with spring return actuator.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Emerson', model: 'Fisher V-Ball BDV',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Multiple locations',
    meta: { protocol: 'Solenoid', failPosition: 'open', silLevel: 'SIL 3', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000150', name: 'On/Off Valve — SIS',
    desc: 'Safety instrumented system valve for process isolation. Part of the SIS final element.',
    type: 'actuator', crit: 'safety_critical', vendor: 'Flowserve', model: 'Logix 3200IQ SIS',
    fw: 'V1.3.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Multiple locations',
    meta: { protocol: 'Solenoid', failPosition: 'closed', silLevel: 'SIL 2', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000151', name: 'Analyzer — Crude Assay',
    desc: 'Online crude oil analyzer providing real-time crude assay data including API gravity, sulfur content, and distillation curves.',
    type: 'sensor', crit: 'business_critical', vendor: 'Siemens', model: 'XRA 5100',
    fw: 'V3.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Sample Point',
    meta: { protocol: 'Modbus/RTU', measurement: 'crude_assay', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000152', name: 'Analyzer — Product Quality',
    desc: 'Online product quality analyzer measuring flash point, pour point, and viscosity for product certification.',
    type: 'sensor', crit: 'business_critical', vendor: 'ABB', model: 'AO2000',
    fw: 'V2.4.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Product Blending Area',
    meta: { protocol: 'Modbus/RTU', measurement: 'product_quality', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000153', name: 'Analyzer — Sulfur Content',
    desc: 'Online sulfur analyzer measuring total sulfur content in refined products per ASTM D4239.',
    type: 'sensor', crit: 'business_critical', vendor: 'Horiba', model: 'SLFA-2800',
    fw: 'V1.8.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Product Blending Area',
    meta: { protocol: 'Modbus/RTU', measurement: 'sulfur_content', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000154', name: 'Positioner — CDU',
    desc: 'Smart valve positioner for CDU control valves. Provides HART diagnostics and position feedback.',
    type: 'actuator', crit: 'business_critical', vendor: 'Emerson', model: 'DVC6200',
    fw: 'V2.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'CDU Area, Multiple',
    meta: { protocol: 'HART', type: 'pneumatic_positioner', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000155', name: 'Positioner — VDU',
    desc: 'Smart valve positioner for VDU control valves.',
    type: 'actuator', crit: 'business_critical', vendor: 'Emerson', model: 'DVC6200',
    fw: 'V2.1.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'VDU Area, Multiple',
    meta: { protocol: 'HART', type: 'pneumatic_positioner', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000156', name: 'Positioner — Hydrocracker',
    desc: 'Smart valve positioner for Hydrocracker control valves.',
    type: 'actuator', crit: 'business_critical', vendor: 'Siemens', model: 'SIPART PS2',
    fw: 'V3.2.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Hydrocracker Area, Multiple',
    meta: { protocol: 'HART', type: 'pneumatic_positioner', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000157', name: 'Positioner — Reformer',
    desc: 'Smart valve positioner for Reformer control valves.',
    type: 'actuator', crit: 'business_critical', vendor: 'Siemens', model: 'SIPART PS2',
    fw: 'V3.2.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Reformer Area, Multiple',
    meta: { protocol: 'HART', type: 'pneumatic_positioner', patchLevel: '2025-Q2' },
  },
  {
    id: '82000000-0000-0000-0000-000000000158', name: 'Vibration Sensor — Compressor',
    desc: 'Vibration monitoring sensor for the recycle gas compressor. Provides continuous vibration and thrust position monitoring.',
    type: 'sensor', crit: 'safety_critical', vendor: 'Bently Nevada', model: '3500/42M',
    fw: 'V1.8.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Compressor Building, Area 3',
    meta: { protocol: 'Modbus/RTU', measurement: 'vibration', channels: 4, patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000159', name: 'Vibration Sensor — Pump',
    desc: 'Vibration monitoring sensor for critical process pumps.',
    type: 'sensor', crit: 'business_critical', vendor: 'SKF', model: 'CMSS 2200',
    fw: 'V1.2.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Multiple locations',
    meta: { protocol: 'HART', measurement: 'vibration', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000160', name: 'Vibration Sensor — Motor',
    desc: 'Vibration monitoring sensor for large motor drives.',
    type: 'sensor', crit: 'business_critical', vendor: 'SKF', model: 'CMSS 2200',
    fw: 'V1.2.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Multiple locations',
    meta: { protocol: 'HART', measurement: 'vibration', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000161', name: 'Current Transformer — Motor',
    desc: 'Current transformer for motor current monitoring and protection.',
    type: 'sensor', crit: 'business_critical', vendor: 'ABB', model: 'CT 200/5A',
    fw: 'N/A', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Motor Control Center, Area 4',
    meta: { protocol: '4-20mA', measurement: 'current', patchLevel: 'N/A' },
  },
  {
    id: '82000000-0000-0000-0000-000000000162', name: 'pH Meter — Wastewater',
    desc: 'pH analyzer for wastewater treatment monitoring and compliance.',
    type: 'sensor', crit: 'business_critical', vendor: 'Endress+Hauser', model: 'Ceragel CPI181',
    fw: 'V2.0.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Wastewater Treatment, Area 8',
    meta: { protocol: 'HART', measurement: 'pH', range: '0-14', patchLevel: '2025-Q3' },
  },
  {
    id: '82000000-0000-0000-0000-000000000163', name: 'Flame Detector — Furnace',
    desc: 'UV/IR flame detector for fired heater flame monitoring. SIL 2 rated per IEC 61511.',
    type: 'sensor', crit: 'safety_critical', vendor: 'MSA', model: 'FlameGard 5',
    fw: 'V1.4.0', net: 'OT-FIELD-VLAN05',
    purdueLevel: 0, zoneId: '71000000-0000-0000-0000-000000000006',
    loc: 'Fired Heaters, Area 1-3',
    meta: { protocol: '4-20mA', measurement: 'flame_detection', type: 'UV/IR', silLevel: 'SIL 2', patchLevel: '2025-Q3' },
  },
];

// ── All New Assets ───────────────────────────────────────────────────────

const ALL_NEW_ASSETS = [...L5_ASSETS, ...L4_ASSETS, ...L3_5_ASSETS, ...L3_ASSETS, ...L2_ASSETS, ...L1_ASSETS, ...L0_ASSETS];

// ── Asset Mappings (existing + new) ──────────────────────────────────────

const ASSET_MAPPINGS: Array<{ assetId: string; levelId: string }> = [
  // Existing assets mapped to Purdue levels
  { assetId: EXISTING.scadaServer, levelId: L.L3 },
  { assetId: EXISTING.historian, levelId: L.L3 },
  { assetId: EXISTING.engineeringWs, levelId: L.L3 },
  { assetId: EXISTING.patchMgmt, levelId: L.L3_5 },
  { assetId: EXISTING.jumpServer, levelId: L.L3_5 },
  { assetId: EXISTING.siemensPlc, levelId: L.L1 },
  { assetId: EXISTING.safetyPlc, levelId: L.L1 },
  { assetId: EXISTING.firewall, levelId: L.L3_5 },
  { assetId: EXISTING.switch, levelId: L.L3 },
  { assetId: EXISTING.rtu, levelId: L.L0 },
  { assetId: EXISTING.remoteController, levelId: L.L1 },
  // New L5 assets
  ...L5_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L5 })),
  // New L4 assets
  ...L4_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L4 })),
  // New L3.5 assets
  ...L3_5_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L3_5 })),
  // New L3 assets
  ...L3_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L3 })),
  // New L2 assets
  ...L2_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L2 })),
  // New L1 assets
  ...L1_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L1 })),
  // New L0 assets
  ...L0_ASSETS.map((a) => ({ assetId: a.id, levelId: L.L0 })),
];

// ── Communication Rules ──────────────────────────────────────────────────

const COMMUNICATION_RULES = [
  // L5 ↔ L4: Enterprise to Business Planning
  { sourceLevelId: L.L5, targetLevelId: L.L4, isAllowed: true, protocol: 'HTTPS, SMB', condition: 'Authenticated via AD, no direct OT data access' },
  { sourceLevelId: L.L4, targetLevelId: L.L5, isAllowed: true, protocol: 'HTTPS', condition: 'Business data only, no OT real-time data' },

  // L5 ↔ L3.5: Enterprise to iDMZ (strictly controlled)
  { sourceLevelId: L.L5, targetLevelId: L.L3_5, isAllowed: true, protocol: 'HTTPS, RDP', condition: 'Via jump server only, MFA required, session recorded' },
  { sourceLevelId: L.L5, targetLevelId: L.L3_5, isAllowed: false, protocol: 'Any', condition: 'Direct access from enterprise to iDMZ without jump server — prohibited' },

  // L4 ↔ L3.5: Business Planning to iDMZ
  { sourceLevelId: L.L4, targetLevelId: L.L3_5, isAllowed: true, protocol: 'HTTPS, OPC UA', condition: 'Historian data replication via data diode (OT→IT only)' },
  { sourceLevelId: L.L4, targetLevelId: L.L3_5, isAllowed: false, protocol: 'Any', condition: 'IT systems must not initiate connections to OT — only via data diode' },

  // L3.5 ↔ L3: iDMZ to Operations (controlled)
  { sourceLevelId: L.L3_5, targetLevelId: L.L3, isAllowed: true, protocol: 'HTTPS, OPC UA, RDP', condition: 'Via jump server, patch management, or OPC UA gateway only' },
  { sourceLevelId: L.L3, targetLevelId: L.L3_5, isAllowed: true, protocol: 'HTTPS, OPC UA, Syslog', condition: 'Historian replication, log forwarding, and AV updates' },
  { sourceLevelId: L.L3_5, targetLevelId: L.L3, isAllowed: false, protocol: 'Any', condition: 'Unauthenticated access from iDMZ to OT — prohibited' },

  // L3 ↔ L2: Operations to Supervisory
  { sourceLevelId: L.L3, targetLevelId: L.L2, isAllowed: true, protocol: 'OPC UA, PROFINET, Modbus/TCP', condition: 'Supervisory control and data acquisition' },
  { sourceLevelId: L.L2, targetLevelId: L.L3, isAllowed: true, protocol: 'OPC UA, PROFINET', condition: 'Process data aggregation and reporting' },

  // L2 ↔ L1: Supervisory to Basic Control
  { sourceLevelId: L.L2, targetLevelId: L.L1, isAllowed: true, protocol: 'PROFINET, Modbus/TCP, EtherNet/IP', condition: 'Control commands and I/O data' },
  { sourceLevelId: L.L1, targetLevelId: L.L2, isAllowed: true, protocol: 'PROFINET, Modbus/TCP', condition: 'Process variable and status data' },

  // L1 ↔ L0: Basic Control to Process
  { sourceLevelId: L.L1, targetLevelId: L.L0, isAllowed: true, protocol: '4-20mA, HART, Foundation Fieldbus', condition: 'Hardwired I/O and fieldbus communication' },
  { sourceLevelId: L.L0, targetLevelId: L.L1, isAllowed: true, protocol: '4-20mA, HART', condition: 'Sensor data and actuator feedback' },

  // Cross-boundary restrictions (prohibited)
  { sourceLevelId: L.L5, targetLevelId: L.L3, isAllowed: false, protocol: 'Any', condition: 'Direct enterprise-to-OT communication — must traverse iDMZ per IEC 62443-3-3 SR 5.1' },
  { sourceLevelId: L.L5, targetLevelId: L.L2, isAllowed: false, protocol: 'Any', condition: 'Enterprise must not access supervisory layer directly' },
  { sourceLevelId: L.L5, targetLevelId: L.L1, isAllowed: false, protocol: 'Any', condition: 'Enterprise must not access control layer directly' },
  { sourceLevelId: L.L5, targetLevelId: L.L0, isAllowed: false, protocol: 'Any', condition: 'Enterprise must not access field devices directly' },
  { sourceLevelId: L.L4, targetLevelId: L.L3, isAllowed: false, protocol: 'Any', condition: 'Business planning must not access OT directly — must traverse iDMZ' },
  { sourceLevelId: L.L4, targetLevelId: L.L1, isAllowed: false, protocol: 'Any', condition: 'Business planning must not access control layer directly' },
  { sourceLevelId: L.L3, targetLevelId: L.L5, isAllowed: false, protocol: 'Any', condition: 'OT must not initiate connections to enterprise — data flows via iDMZ only' },
  { sourceLevelId: L.L3, targetLevelId: L.L4, isAllowed: false, protocol: 'Any', condition: 'OT must not initiate connections to business planning — data flows via iDMZ only' },
  { sourceLevelId: L.L1, targetLevelId: L.L3, isAllowed: false, protocol: 'Any', condition: 'PLC must not bypass supervisory layer to reach operations' },
  { sourceLevelId: L.L0, targetLevelId: L.L3, isAllowed: false, protocol: 'Any', condition: 'Field devices must not communicate beyond their assigned PLC' },
];

// ── Seed ─────────────────────────────────────────────────────────────────

async function seed() {
  const connectionString =
    process.env['DATABASE_URL'] ??
    'postgresql://iec62443:iec62443_dev@localhost:5432/iec62443_platform';

  const pool = new Pool({ connectionString });
  const tenantPool = new Pool({
    connectionString,
    options: `-c search_path=${TENANT_SCHEMA},public`,
  });
  const tenantDb = drizzle(tenantPool, { schema: tenantSchema });

  console.log('Seeding Industrial Oil and Gas — Purdue Model...');
  console.log('='.repeat(60));

  // ── 1. Additional Zones ──────────────────────────────────────────────
  console.log('\n[1/6] Creating additional zones...');

  for (const zone of NEW_ZONES) {
    await tenantDb.insert(tenantSchema.zones).values({
      id: zone.id,
      name: zone.name,
      description: zone.description,
      zoneType: zone.zoneType,
      securityLevel: zone.securityLevel,
      targetSl: zone.targetSl,
      achievedSl: zone.achievedSl,
      purdueLevel: zone.purdueLevel,
      diagramX: zone.diagramX,
      diagramY: zone.diagramY,
      diagramWidth: zone.diagramWidth,
      diagramHeight: zone.diagramHeight,
      color: zone.color,
    }).onConflictDoNothing();
  }

  // ── 2. New Assets ────────────────────────────────────────────────────
  console.log('[2/6] Creating assets...');

  for (const asset of ALL_NEW_ASSETS) {
    await tenantDb.insert(tenantSchema.assets).values({
      id: asset.id,
      name: asset.name,
      description: asset.desc,
      type: asset.type,
      criticality: asset.crit,
      vendor: asset.vendor,
      model: asset.model,
      firmwareVersion: asset.fw ?? null,
      ipAddress: asset.ip ?? null,
      networkSegment: asset.net ?? null,
      purdueLevel: asset.purdueLevel,
      zoneId: asset.zoneId,
      location: asset.loc,
      operationalStatus: asset.status ?? 'operational',
      metadata: asset.meta ?? {},
    }).onConflictDoNothing();
  }

  // ── 3. Zone Memberships for New Assets ───────────────────────────────
  console.log('[3/6] Creating zone memberships...');

  for (const asset of ALL_NEW_ASSETS) {
    await tenantDb.insert(tenantSchema.memberships).values({
      zoneId: asset.zoneId,
      assetId: asset.id,
      assignedBy: SEED_USER_ID,
    }).onConflictDoNothing();
  }

  // ── 4. Purdue Model and Levels ───────────────────────────────────────
  console.log('[4/6] Creating Purdue model and levels...');

  await tenantDb.insert(tenantSchema.models).values({
    id: PURDUE_MODEL.id,
    name: PURDUE_MODEL.name,
    description: PURDUE_MODEL.description,
    isDefault: PURDUE_MODEL.isDefault,
  }).onConflictDoNothing();

  for (const level of LEVELS) {
    await tenantDb.insert(tenantSchema.levels).values({
      id: level.id,
      modelId: PURDUE_MODEL.id,
      levelNumber: level.levelNumber,
      name: level.name,
      description: level.description,
      color: level.color,
      sortOrder: level.sortOrder,
    }).onConflictDoNothing();
  }

  // ── 5. Asset Mappings ────────────────────────────────────────────────
  console.log('[5/6] Creating asset mappings...');

  for (const mapping of ASSET_MAPPINGS) {
    await tenantDb.insert(tenantSchema.assetMappings).values({
      modelId: PURDUE_MODEL.id,
      assetId: mapping.assetId,
      levelId: mapping.levelId,
      assignedBy: SEED_USER_ID,
    }).onConflictDoNothing();
  }

  // ── 6. Communication Rules ───────────────────────────────────────────
  console.log('[6/6] Creating communication rules...');

  for (const rule of COMMUNICATION_RULES) {
    await tenantDb.insert(tenantSchema.communicationRules).values({
      modelId: PURDUE_MODEL.id,
      sourceLevelId: rule.sourceLevelId,
      targetLevelId: rule.targetLevelId,
      isAllowed: rule.isAllowed,
      condition: rule.condition,
      protocol: rule.protocol,
    }).onConflictDoNothing();
  }

  await tenantPool.end();
  await pool.end();

  // ── Summary ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('Industrial Oil and Gas — Purdue Model seeded successfully.');
  console.log('');
  console.log('Summary:');
  console.log(`  Purdue Model:           ${PURDUE_MODEL.name}`);
  console.log(`  Levels:                 ${LEVELS.length}`);
  console.log(`  New Zones:              ${NEW_ZONES.length}`);
  console.log(`  New Assets:             ${ALL_NEW_ASSETS.length}`);
  console.log(`  Total Assets (incl. existing): ${ALL_NEW_ASSETS.length + 11}`);
  console.log(`  Asset Mappings:         ${ASSET_MAPPINGS.length}`);
  console.log(`  Communication Rules:    ${COMMUNICATION_RULES.length}`);
  console.log('');
  console.log('Assets by Purdue Level:');
  console.log(`  L5  Enterprise Network:      ${L5_ASSETS.length} new + 0 existing = ${L5_ASSETS.length}`);
  console.log(`  L4  Business Planning:        ${L4_ASSETS.length} new + 0 existing = ${L4_ASSETS.length}`);
  console.log(`  L3.5 Industrial DMZ:          ${L3_5_ASSETS.length} new + 3 existing = ${L3_5_ASSETS.length + 3}`);
  console.log(`  L3  Operations:               ${L3_ASSETS.length} new + 4 existing = ${L3_ASSETS.length + 4}`);
  console.log(`  L2  Supervisory:              ${L2_ASSETS.length} new + 0 existing = ${L2_ASSETS.length}`);
  console.log(`  L1  Basic Control:            ${L1_ASSETS.length} new + 3 existing = ${L1_ASSETS.length + 3}`);
  console.log(`  L0  Process:                  ${L0_ASSETS.length} new + 1 existing = ${L0_ASSETS.length + 1}`);
  console.log('');
  console.log('Communication Rules:');
  const allowed = COMMUNICATION_RULES.filter((r) => r.isAllowed).length;
  const denied = COMMUNICATION_RULES.filter((r) => !r.isAllowed).length;
  console.log(`  Allowed:   ${allowed}`);
  console.log(`  Denied:    ${denied}`);
  console.log('');
  console.log('Vendor Distribution:');
  const vendorCounts = new Map<string, number>();
  for (const a of ALL_NEW_ASSETS) {
    vendorCounts.set(a.vendor, (vendorCounts.get(a.vendor) ?? 0) + 1);
  }
  // Add existing asset vendors
  const existingVendors = ['Honeywell', 'OSIsoft', 'Dell', 'Ivanti', 'CyberArk', 'Siemens', 'Fortinet', 'Hirschmann', 'ABB', 'Emerson'];
  for (const v of existingVendors) {
    vendorCounts.set(v, (vendorCounts.get(v) ?? 0) + 1);
  }
  const sorted = [...vendorCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [vendor, count] of sorted) {
    console.log(`  ${vendor.padEnd(20)} ${count}`);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
