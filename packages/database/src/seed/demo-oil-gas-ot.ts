import crypto from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as platformSchema from '../schema/platform/index.js';
import * as tenantSchema from '../schema/tenant/index.js';

// ---------------------------------------------------------------------------
// Demo Tenant OT Architecture: Industrial Oil and Gas
// Seeds zones, assets, memberships, conduits, relationships,
// segmentation rules, and audit events into the tenant_iog schema.
// Prerequisite: demo-oil-gas.ts must have been run first.
// ---------------------------------------------------------------------------

const TENANT_ID = '11000000-0000-0000-0000-000000000001';
const TENANT_SCHEMA = 'tenant_iog';

// CISO user — acts as the author for all audit events in this seed
const SEED_USER_ID = '21000000-0000-0000-0000-000000000001';

// ── Zones ────────────────────────────────────────────────────────────────

const ZONES = [
  {
    id: '71000000-0000-0000-0000-000000000001',
    name: 'Enterprise IT Zone',
    description:
      'Corporate IT network and business systems. Includes ERP, email, document management, and enterprise applications. Located at Purdue Level 4-5.',
    zoneType: 'enterprise_it',
    securityLevel: 1,
    targetSl: 2,
    achievedSl: 1,
    purdueLevel: 4,
    diagramX: '400',
    diagramY: '20',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#3182ce',
  },
  {
    id: '71000000-0000-0000-0000-000000000002',
    name: 'Industrial DMZ',
    description:
      'Industrial Demilitarized Zone separating enterprise IT from OT networks. All cross-boundary traffic must traverse this zone. Hosts jump servers, patch management, and proxy services per IEC 62443-3-3 requirements.',
    zoneType: 'idmz',
    securityLevel: 2,
    targetSl: 3,
    achievedSl: 2,
    purdueLevel: 3, // 3.5 — using 3 as smallint
    diagramX: '400',
    diagramY: '120',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#d69e2e',
  },
  {
    id: '71000000-0000-0000-0000-000000000003',
    name: 'SCADA Control Zone',
    description:
      'Supervisory control and data acquisition systems. Includes SCADA servers, historian, and HMI stations that monitor and control the refining process. Purdue Level 2-3.',
    zoneType: 'manufacturing_ops',
    securityLevel: 2,
    targetSl: 3,
    achievedSl: 2,
    purdueLevel: 2,
    diagramX: '400',
    diagramY: '220',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#e53e3e',
  },
  {
    id: '71000000-0000-0000-0000-000000000004',
    name: 'Safety Instrumented System Zone',
    description:
      'Safety Instrumented Systems (SIS) that implement process safety functions. Independent from basic process control to maintain safety integrity per IEC 61511. Hardwired connections to field instruments only.',
    zoneType: 'safety_instrumented',
    securityLevel: 3,
    targetSl: 3,
    achievedSl: 3,
    purdueLevel: 1,
    diagramX: '100',
    diagramY: '320',
    diagramWidth: '250',
    diagramHeight: '80',
    color: '#c53030',
  },
  {
    id: '71000000-0000-0000-0000-000000000005',
    name: 'PLC Process Control Zone',
    description:
      'Programmable Logic Controllers executing basic process control loops. Directly connected to field instruments via hardwired I/O and industrial protocols (Modbus/TCP, PROFINET). Purdue Level 1.',
    zoneType: 'process_control',
    securityLevel: 2,
    targetSl: 2,
    achievedSl: 1,
    purdueLevel: 1,
    diagramX: '400',
    diagramY: '320',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#dd6b20',
  },
  {
    id: '71000000-0000-0000-0000-000000000006',
    name: 'Field Instrumentation Zone',
    description:
      'Field devices including transmitters, actuators, and valve positioners connected via 4-20mA, HART, and Foundation Fieldbus. Purdue Level 0.',
    zoneType: 'process_control',
    securityLevel: 1,
    targetSl: 1,
    achievedSl: 0,
    purdueLevel: 0,
    diagramX: '400',
    diagramY: '420',
    diagramWidth: '300',
    diagramHeight: '80',
    color: '#38a169',
  },
] as const;

// ── Assets ───────────────────────────────────────────────────────────────

const ASSETS = [
  // ── Servers (SCADA Control Zone) ─────────────────────────────────────
  {
    id: '81000000-0000-0000-0000-000000000001',
    name: 'SCADA Application Server',
    description:
      'Primary SCADA server running the distributed control system application. Provides real-time process monitoring, alarm management, and operator interface for the entire refinery complex.',
    type: 'scada_server',
    criticality: 'safety_critical',
    vendor: 'Honeywell',
    model: 'Experion PKS C300',
    firmwareVersion: 'R510.6',
    serialNumber: 'HWX-R510-00421',
    ipAddress: '10.10.2.10',
    macAddress: '00:1A:2B:3C:4D:01',
    networkSegment: 'OT-SCADA-VLAN20',
    purdueLevel: 2,
    zoneId: '71000000-0000-0000-0000-000000000003',
    location: 'Control Room A, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'Windows Server 2019 LTSC',
      rackUnit: '2U',
      redundancy: 'hot_standby',
      patchLevel: '2026-Q1',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000002',
    name: 'Historian Server',
    description:
      'Process historian collecting and archiving real-time telemetry data from SCADA and PLC systems. Provides trend analysis, reporting, and regulatory compliance data retention.',
    type: 'historian',
    criticality: 'business_critical',
    vendor: 'OSIsoft',
    model: 'PI Server 2018 R2',
    firmwareVersion: '3.4.410.1181',
    serialNumber: 'OSI-PI-2018-0873',
    ipAddress: '10.10.2.20',
    macAddress: '00:1A:2B:3C:4D:02',
    networkSegment: 'OT-SCADA-VLAN20',
    purdueLevel: 2,
    zoneId: '71000000-0000-0000-0000-000000000003',
    location: 'Control Room A, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'Windows Server 2019 LTSC',
      rackUnit: '2U',
      dataRetention: '7 years',
      patchLevel: '2026-Q1',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000003',
    name: 'Engineering Workstation',
    description:
      'Engineering workstation for PLC programming, SCADA configuration, and system maintenance. Used for deploying control logic updates and troubleshooting field devices.',
    type: 'engineering_ws',
    criticality: 'operational',
    vendor: 'Dell',
    model: 'Precision 5820 Tower',
    firmwareVersion: 'BIOS 2.18.1',
    serialNumber: 'DL-5820-7B3KX2',
    ipAddress: '10.10.2.30',
    macAddress: '00:1A:2B:3C:4D:03',
    networkSegment: 'OT-SCADA-VLAN20',
    purdueLevel: 2,
    zoneId: '71000000-0000-0000-0000-000000000003',
    location: 'Engineering Office, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'Windows 10 Enterprise LTSC 2021',
      software: ['TIA Portal V18', 'Experion Builder', 'Wireshark'],
      patchLevel: '2026-Q1',
    },
  },
  // ── Servers (Industrial DMZ) ─────────────────────────────────────────
  {
    id: '81000000-0000-0000-0000-000000000004',
    name: 'Patch Management Server',
    description:
      'Centralized patch management server for OT assets. Stands in the iDMZ to stage and validate patches before deployment to control systems. Implements IEC 62443-2-4 SM-7 requirements.',
    type: 'server',
    criticality: 'business_critical',
    vendor: 'Ivanti',
    model: 'Patch for OT 2024.1',
    firmwareVersion: '2024.1.3',
    serialNumber: 'IV-PMOT-2024-0192',
    ipAddress: '10.10.3.10',
    macAddress: '00:1A:2B:3C:4D:04',
    networkSegment: 'OT-IDMZ-VLAN30',
    purdueLevel: 3,
    zoneId: '71000000-0000-0000-0000-000000000002',
    location: 'iDMZ Rack, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'Windows Server 2022',
      rackUnit: '1U',
      patchLevel: '2026-Q1',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000005',
    name: 'Jump Server',
    description:
      'Bastion host for secure remote access from enterprise IT to OT systems. Enforces MFA, session recording, and least-privilege access per IEC 62443-3-3 SR 1.1 RE 2.',
    type: 'server',
    criticality: 'business_critical',
    vendor: 'CyberArk',
    model: 'Privileged Access Security 12.2',
    firmwareVersion: '12.2.8',
    serialNumber: 'CA-PAS-12-00451',
    ipAddress: '10.10.3.20',
    macAddress: '00:1A:2B:3C:4D:05',
    networkSegment: 'OT-IDMZ-VLAN30',
    purdueLevel: 3,
    zoneId: '71000000-0000-0000-0000-000000000002',
    location: 'iDMZ Rack, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'RHEL 9.3',
      rackUnit: '1U',
      mfaEnabled: true,
      sessionRecording: true,
      patchLevel: '2026-Q1',
    },
  },
  // ── Controllers (PLC Process Control Zone) ───────────────────────────
  {
    id: '81000000-0000-0000-0000-000000000006',
    name: 'Siemens S7-1500 PLC',
    description:
      'Primary process control PLC executing continuous control loops for the crude distillation unit. Runs regulatory control, cascade control, and feedforward strategies for temperature, pressure, and flow.',
    type: 'plc',
    criticality: 'safety_critical',
    vendor: 'Siemens',
    model: 'SIMATIC S7-1500 CPU 1518-4',
    firmwareVersion: 'V2.9.2',
    serialNumber: 'S7-1518-4-S-CJ58012',
    ipAddress: '10.10.1.10',
    macAddress: '00:1C:06:1A:2B:06',
    networkSegment: 'OT-PLC-VLAN10',
    purdueLevel: 1,
    zoneId: '71000000-0000-0000-0000-000000000005',
    location: 'Motor Control Center, Area 4',
    operationalStatus: 'operational',
    metadata: {
      os: 'Siemens proprietary RTOS',
      protocol: 'PROFINET',
      iecProgram: 'CDU_Main_Control',
      scanCycle: '50ms',
      patchLevel: '2025-Q4',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000007',
    name: 'Safety PLC',
    description:
      'Safety Instrumented System controller implementing Safety Instrumented Functions (SIFs) per IEC 61511. Independent from basic process control with dedicated I/O and hardwired connections to final elements.',
    type: 'plc',
    criticality: 'safety_critical',
    vendor: 'Siemens',
    model: 'SIMATIC S7-1500F CPU 1517F-3',
    firmwareVersion: 'V2.9.2',
    serialNumber: 'S7-1517F-S-BK92034',
    ipAddress: '10.10.1.20',
    macAddress: '00:1C:06:1A:2B:07',
    networkSegment: 'OT-SIS-VLAN15',
    purdueLevel: 1,
    zoneId: '71000000-0000-0000-0000-000000000004',
    location: 'SIS Cabinet, Area 4',
    operationalStatus: 'operational',
    metadata: {
      os: 'Siemens F-Runtime (TÜV certified)',
      protocol: 'PROFIsafe',
      silLevel: 'SIL 3',
      safetyFunctions: 12,
      scanCycle: '25ms',
      patchLevel: '2025-Q4',
    },
  },
  // ── Network (Industrial DMZ) ─────────────────────────────────────────
  {
    id: '81000000-0000-0000-0000-000000000008',
    name: 'Industrial Firewall',
    description:
      'Industrial-grade firewall enforcing segmentation between the iDMZ, SCADA zone, and PLC zones. Implements deep packet inspection for industrial protocols (Modbus/TCP, PROFINET, OPC UA) per IEC 62443-3-3 SR 5.1.',
    type: 'firewall',
    criticality: 'safety_critical',
    vendor: 'Fortinet',
    model: 'FortiGate Rugged 70F',
    firmwareVersion: 'FortiOS 7.4.3',
    serialNumber: 'FGT70F-RG-004821',
    ipAddress: '10.10.3.1',
    macAddress: '00:1A:2B:3C:4D:08',
    networkSegment: 'OT-IDMZ-VLAN30',
    purdueLevel: 3,
    zoneId: '71000000-0000-0000-0000-000000000002',
    location: 'iDMZ Rack, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'FortiOS 7.4',
      dpiEnabled: true,
      rules: 247,
      industrialProtocolInspection: ['Modbus/TCP', 'OPC UA', 'PROFINET'],
      patchLevel: '2026-Q1',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000009',
    name: 'Industrial Switch',
    description:
      'Managed industrial Ethernet switch providing network connectivity for SCADA zone devices. Supports VLAN segmentation, QoS for industrial protocols, and network monitoring via SNMP v3.',
    type: 'switch',
    criticality: 'business_critical',
    vendor: 'Hirschmann',
    model: 'BOBCAT 9610G',
    firmwareVersion: '09.0.04',
    serialNumber: 'HBC-9610G-008723',
    ipAddress: '10.10.2.1',
    macAddress: '00:1A:2B:3C:4D:09',
    networkSegment: 'OT-SCADA-VLAN20',
    purdueLevel: 2,
    zoneId: '71000000-0000-0000-0000-000000000003',
    location: 'Control Room A, Building 12',
    operationalStatus: 'operational',
    metadata: {
      os: 'HiOS 9.0',
      portCount: 10,
      managedProtocol: 'SNMPv3',
      ringRedundancy: 'HIPER-Ring',
      patchLevel: '2025-Q4',
    },
  },
  // ── Remote (Field Instrumentation Zone) ──────────────────────────────
  {
    id: '81000000-0000-0000-0000-000000000010',
    name: 'RTU',
    description:
      'Remote Terminal Unit providing telemetry data acquisition and remote control for tank farm and pipeline metering stations. Communicates via Modbus/TCP to the SCADA server.',
    type: 'rtu',
    criticality: 'operational',
    vendor: 'ABB',
    model: 'RTU560',
    firmwareVersion: 'V12.3.1',
    serialNumber: 'ABB-RTU560-01294',
    ipAddress: '10.10.0.10',
    macAddress: '00:1A:2B:3C:4D:0A',
    networkSegment: 'OT-FIELD-VLAN05',
    purdueLevel: 0,
    zoneId: '71000000-0000-0000-0000-000000000006',
    location: 'Tank Farm, Area 7',
    operationalStatus: 'operational',
    metadata: {
      os: 'ABB proprietary RTOS',
      protocol: 'Modbus/TCP',
      ioPoints: 128,
      patchLevel: '2025-Q3',
    },
  },
  {
    id: '81000000-0000-0000-0000-000000000011',
    name: 'Remote Controller',
    description:
      'Remote process controller for the wellhead monitoring and control system. Provides local autonomous control with periodic data upload to the SCADA server via OPC UA.',
    type: 'gateway',
    criticality: 'operational',
    vendor: 'Emerson',
    model: 'DeltaV S-series PK Controller',
    firmwareVersion: 'DV14.3.1',
    serialNumber: 'EMR-DV-S-003847',
    ipAddress: '10.10.0.20',
    macAddress: '00:1A:2B:3C:4D:0B',
    networkSegment: 'OT-FIELD-VLAN05',
    purdueLevel: 0,
    zoneId: '71000000-0000-0000-0000-000000000006',
    location: 'Wellhead Station, Area 9',
    operationalStatus: 'operational',
    metadata: {
      os: 'DeltaV proprietary RTOS',
      protocol: 'OPC UA',
      controlLoops: 16,
      patchLevel: '2025-Q4',
    },
  },
] as const;

// ── Conduits ─────────────────────────────────────────────────────────────

const CONDUITS = [
  {
    id: '91000000-0000-0000-0000-000000000001',
    name: 'Enterprise IT → Industrial DMZ',
    description:
      'Controlled conduit between enterprise IT and the iDMZ. All traffic is proxied and inspected. Only authorized administrative traffic (HTTPS, RDP via jump server) is permitted.',
    sourceZoneId: '71000000-0000-0000-0000-000000000001',
    targetZoneId: '71000000-0000-0000-0000-000000000002',
    conduitType: 'network',
    protocol: 'HTTPS, RDP',
    securityLevel: 2,
    targetSl: 3,
    achievedSl: 2,
    encryption: true,
    authentication: true,
    monitoring: true,
  },
  {
    id: '91000000-0000-0000-0000-000000000002',
    name: 'Industrial DMZ → SCADA Control',
    description:
      'Conduit from the iDMZ to the SCADA zone. Carries patch deployment, remote access sessions, and historian data replication. Enforced by the industrial firewall with DPI.',
    sourceZoneId: '71000000-0000-0000-0000-000000000002',
    targetZoneId: '71000000-0000-0000-0000-000000000003',
    conduitType: 'network',
    protocol: 'HTTPS, OPC UA, RDP',
    securityLevel: 2,
    targetSl: 3,
    achievedSl: 2,
    encryption: true,
    authentication: true,
    monitoring: true,
  },
  {
    id: '91000000-0000-0000-0000-000000000003',
    name: 'SCADA Control → PLC Process Control',
    description:
      'Supervisory control conduit from SCADA servers to PLCs. Carries PROFINET and Modbus/TCP for real-time process control and data acquisition.',
    sourceZoneId: '71000000-0000-0000-0000-000000000003',
    targetZoneId: '71000000-0000-0000-0000-000000000005',
    conduitType: 'network',
    protocol: 'PROFINET, Modbus/TCP',
    securityLevel: 2,
    targetSl: 2,
    achievedSl: 1,
    encryption: false,
    authentication: false,
    monitoring: true,
  },
  {
    id: '91000000-0000-0000-0000-000000000004',
    name: 'Engineering → PLC Process Control',
    description:
      'Engineering workstation to PLC conduit for control logic deployment and configuration changes. Restricted to maintenance windows and logged per IEC 62443-2-1 SM-7.',
    sourceZoneId: '71000000-0000-0000-0000-000000000003',
    targetZoneId: '71000000-0000-0000-0000-000000000005',
    conduitType: 'network',
    protocol: 'PROFINET, TIA Portal',
    securityLevel: 2,
    targetSl: 2,
    achievedSl: 1,
    encryption: false,
    authentication: true,
    monitoring: true,
  },
  {
    id: '91000000-0000-0000-0000-000000000005',
    name: 'PLC Process Control → Field Instrumentation',
    description:
      'I/O conduit from PLCs to field instruments. Carries 4-20mA, HART, and Foundation Fieldbus signals for process measurement and control.',
    sourceZoneId: '71000000-0000-0000-0000-000000000005',
    targetZoneId: '71000000-0000-0000-0000-000000000006',
    conduitType: 'hardwired',
    protocol: 'HART, Foundation Fieldbus, 4-20mA',
    securityLevel: 1,
    targetSl: 1,
    achievedSl: 0,
    encryption: false,
    authentication: false,
    monitoring: false,
  },
  {
    id: '91000000-0000-0000-0000-000000000006',
    name: 'Safety PLC → Field Instrumentation',
    description:
      'Hardwired conduit from the Safety PLC to final elements and field instruments. Dedicated safety I/O, physically separate from basic process control.',
    sourceZoneId: '71000000-0000-0000-0000-000000000004',
    targetZoneId: '71000000-0000-0000-0000-000000000006',
    conduitType: 'hardwired',
    protocol: '4-20mA, PROFIsafe',
    securityLevel: 3,
    targetSl: 3,
    achievedSl: 3,
    encryption: false,
    authentication: false,
    monitoring: true,
  },
] as const;

// ── Asset Relationships ──────────────────────────────────────────────────

const RELATIONSHIPS = [
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000001',
    targetAssetId: '81000000-0000-0000-0000-000000000002',
    relationshipType: 'communicates_with',
    protocol: 'OPC UA',
    metadata: { direction: 'bidirectional', dataFlow: 'real-time telemetry' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000003',
    targetAssetId: '81000000-0000-0000-0000-000000000006',
    relationshipType: 'manages',
    protocol: 'PROFINET',
    metadata: { direction: 'bidirectional', purpose: 'PLC programming and configuration' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000003',
    targetAssetId: '81000000-0000-0000-0000-000000000007',
    relationshipType: 'manages',
    protocol: 'PROFINET',
    metadata: { direction: 'bidirectional', purpose: 'Safety PLC configuration' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000008',
    targetAssetId: '81000000-0000-0000-0000-000000000005',
    relationshipType: 'protects',
    protocol: 'Multiple',
    metadata: { direction: 'inbound', role: 'iDMZ boundary enforcement — protects jump server' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000001',
    targetAssetId: '81000000-0000-0000-0000-000000000006',
    relationshipType: 'controls',
    protocol: 'PROFINET',
    metadata: { direction: 'bidirectional', dataFlow: 'supervisory control and status' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000001',
    targetAssetId: '81000000-0000-0000-0000-000000000010',
    relationshipType: 'controls',
    protocol: 'Modbus/TCP',
    metadata: { direction: 'bidirectional', dataFlow: 'telemetry and remote control' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000006',
    targetAssetId: '81000000-0000-0000-0000-000000000010',
    relationshipType: 'communicates_with',
    protocol: 'Modbus/TCP',
    metadata: { direction: 'bidirectional', dataFlow: 'field I/O relay' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000005',
    targetAssetId: '81000000-0000-0000-0000-000000000001',
    relationshipType: 'connected_to',
    protocol: 'RDP',
    metadata: { direction: 'outbound', purpose: 'remote access via jump server' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000004',
    targetAssetId: '81000000-0000-0000-0000-000000000006',
    relationshipType: 'connected_to',
    protocol: 'HTTPS',
    metadata: { direction: 'outbound', purpose: 'patch deployment' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000001',
    targetAssetId: '81000000-0000-0000-0000-000000000011',
    relationshipType: 'controls',
    protocol: 'OPC UA',
    metadata: { direction: 'bidirectional', dataFlow: 'wellhead monitoring' },
  },
  {
    sourceAssetId: '81000000-0000-0000-0000-000000000009',
    targetAssetId: '81000000-0000-0000-0000-000000000001',
    relationshipType: 'connected_to',
    protocol: 'Ethernet',
    metadata: { direction: 'bidirectional', purpose: 'network connectivity' },
  },
] as const;

// ── Segmentation Rules ───────────────────────────────────────────────────

const SEGMENTATION_RULES = [
  {
    conduitId: '91000000-0000-0000-0000-000000000001',
    zoneId: '71000000-0000-0000-0000-000000000002',
    ruleType: 'firewall',
    description: 'Allow HTTPS from Enterprise IT to iDMZ jump server only',
    direction: 'inbound',
    action: 'allow',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000001',
    zoneId: '71000000-0000-0000-0000-000000000002',
    ruleType: 'firewall',
    description: 'Deny all direct traffic from Enterprise IT to OT zones',
    direction: 'inbound',
    action: 'deny',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000002',
    zoneId: '71000000-0000-0000-0000-000000000003',
    ruleType: 'firewall',
    description: 'Allow RDP from iDMZ jump server to SCADA zone (authenticated, MFA)',
    direction: 'outbound',
    action: 'proxy',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000002',
    zoneId: '71000000-0000-0000-0000-000000000003',
    ruleType: 'firewall',
    description: 'Allow HTTPS for patch management deployment from iDMZ to SCADA',
    direction: 'outbound',
    action: 'allow',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000002',
    zoneId: '71000000-0000-0000-0000-000000000003',
    ruleType: 'firewall',
    description: 'Allow OPC UA historian data replication from SCADA to iDMZ',
    direction: 'inbound',
    action: 'allow',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000003',
    zoneId: '71000000-0000-0000-0000-000000000005',
    ruleType: 'acl',
    description: 'Allow PROFINET from SCADA to PLC zone (process control)',
    direction: 'outbound',
    action: 'allow',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000003',
    zoneId: '71000000-0000-0000-0000-000000000005',
    ruleType: 'acl',
    description: 'Allow Modbus/TCP from SCADA to PLC zone (RTU polling)',
    direction: 'outbound',
    action: 'allow',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000003',
    zoneId: '71000000-0000-0000-0000-000000000005',
    ruleType: 'firewall',
    description: 'Deny all non-industrial protocol traffic from SCADA to PLC zone',
    direction: 'outbound',
    action: 'deny',
    isCompliant: true,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000004',
    zoneId: '71000000-0000-0000-0000-000000000005',
    ruleType: 'acl',
    description: 'Allow PROFINET from engineering workstation to PLCs (maintenance window only)',
    direction: 'outbound',
    action: 'inspect',
    isCompliant: false,
  },
  {
    conduitId: '91000000-0000-0000-0000-000000000004',
    zoneId: '71000000-0000-0000-0000-000000000005',
    ruleType: 'firewall',
    description:
      'Engineering access to PLCs lacks time-window enforcement — gap against IEC 62443-3-3 SR 2.1 RE 1',
    direction: 'outbound',
    action: 'allow',
    isCompliant: false,
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

  console.log('Seeding Industrial Oil and Gas — OT Architecture...');
  console.log('='.repeat(60));

  // Connect to tenant schema
  const tenantPool = new Pool({
    connectionString,
    options: `-c search_path=${TENANT_SCHEMA},public`,
  });
  const tenantDb = drizzle(tenantPool, { schema: tenantSchema });

  // Idempotency guard: skip if first zone already exists
  const [existing] = await tenantDb
    .select({ id: tenantSchema.zones.id })
    .from(tenantSchema.zones)
    .where(eq(tenantSchema.zones.id, ZONES[0].id))
    .limit(1);
  if (existing) {
    console.log('OT architecture data already seeded. Skipping.');
    await tenantPool.end();
    await pool.end();
    return;
  }

  // ── 1. Zones ─────────────────────────────────────────────────────────
  console.log('\n[1/6] Creating zones...');

  for (const zone of ZONES) {
    await tenantDb
      .insert(tenantSchema.zones)
      .values({
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
      })
      .onConflictDoNothing();
  }

  // ── 2. Assets ────────────────────────────────────────────────────────
  console.log('[2/6] Creating assets...');

  for (const asset of ASSETS) {
    await tenantDb
      .insert(tenantSchema.assets)
      .values({
        id: asset.id,
        name: asset.name,
        description: asset.description,
        type: asset.type,
        criticality: asset.criticality,
        vendor: asset.vendor,
        model: asset.model,
        firmwareVersion: asset.firmwareVersion,
        serialNumber: asset.serialNumber,
        ipAddress: asset.ipAddress,
        macAddress: asset.macAddress,
        networkSegment: asset.networkSegment,
        purdueLevel: asset.purdueLevel,
        zoneId: asset.zoneId,
        location: asset.location,
        operationalStatus: asset.operationalStatus,
        metadata: asset.metadata,
      })
      .onConflictDoNothing();
  }

  // ── 3. Zone Memberships ──────────────────────────────────────────────
  console.log('[3/6] Creating zone memberships...');

  for (const asset of ASSETS) {
    await tenantDb
      .insert(tenantSchema.memberships)
      .values({
        zoneId: asset.zoneId,
        assetId: asset.id,
        assignedBy: SEED_USER_ID,
      })
      .onConflictDoNothing();
  }

  // ── 4. Conduits ──────────────────────────────────────────────────────
  console.log('[4/6] Creating conduits...');

  for (const conduit of CONDUITS) {
    await tenantDb
      .insert(tenantSchema.conduits)
      .values({
        id: conduit.id,
        name: conduit.name,
        description: conduit.description,
        sourceZoneId: conduit.sourceZoneId,
        targetZoneId: conduit.targetZoneId,
        conduitType: conduit.conduitType,
        protocol: conduit.protocol,
        securityLevel: conduit.securityLevel,
        targetSl: conduit.targetSl,
        achievedSl: conduit.achievedSl,
        encryption: conduit.encryption,
        authentication: conduit.authentication,
        monitoring: conduit.monitoring,
      })
      .onConflictDoNothing();
  }

  // ── 5. Asset Relationships & Segmentation Rules ──────────────────────
  console.log('[5/6] Creating asset relationships and segmentation rules...');

  for (const rel of RELATIONSHIPS) {
    await tenantDb
      .insert(tenantSchema.relationships)
      .values({
        sourceAssetId: rel.sourceAssetId,
        targetAssetId: rel.targetAssetId,
        relationshipType: rel.relationshipType,
        protocol: rel.protocol,
        metadata: rel.metadata,
      })
      .onConflictDoNothing();
  }

  for (const rule of SEGMENTATION_RULES) {
    await tenantDb
      .insert(tenantSchema.segmentationRules)
      .values({
        conduitId: rule.conduitId,
        zoneId: rule.zoneId,
        ruleType: rule.ruleType,
        description: rule.description,
        direction: rule.direction,
        action: rule.action,
        isCompliant: rule.isCompliant,
      })
      .onConflictDoNothing();
  }

  await tenantPool.end();

  // ── 6. Audit Events ──────────────────────────────────────────────────
  console.log('[6/6] Creating audit events...');

  const auditEvents: AuditEventSeed[] = [];

  for (const zone of ZONES) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'zone.created',
      entityType: 'zone',
      entityId: zone.id,
      action: 'create',
      details: { name: zone.name, zoneType: zone.zoneType, targetSl: zone.targetSl },
    });
  }

  for (const asset of ASSETS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'asset.created',
      entityType: 'asset',
      entityId: asset.id,
      action: 'create',
      details: {
        name: asset.name,
        type: asset.type,
        criticality: asset.criticality,
        zoneId: asset.zoneId,
      },
    });
  }

  for (const asset of ASSETS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'zone.membership.created',
      entityType: 'zone_membership',
      entityId: asset.id,
      action: 'create',
      details: { assetId: asset.id, zoneId: asset.zoneId },
    });
  }

  for (const conduit of CONDUITS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'conduit.created',
      entityType: 'conduit',
      entityId: conduit.id,
      action: 'create',
      details: {
        name: conduit.name,
        sourceZoneId: conduit.sourceZoneId,
        targetZoneId: conduit.targetZoneId,
        encryption: conduit.encryption,
        authentication: conduit.authentication,
      },
    });
  }

  for (const rel of RELATIONSHIPS) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'asset.relationship.created',
      entityType: 'asset_relationship',
      entityId: rel.sourceAssetId,
      action: 'create',
      details: {
        sourceAssetId: rel.sourceAssetId,
        targetAssetId: rel.targetAssetId,
        relationshipType: rel.relationshipType,
        protocol: rel.protocol,
      },
    });
  }

  for (const rule of SEGMENTATION_RULES) {
    auditEvents.push({
      tenantId: TENANT_ID,
      userId: SEED_USER_ID,
      eventType: 'segmentation_rule.created',
      entityType: 'segmentation_rule',
      entityId: rule.conduitId,
      action: 'create',
      details: {
        ruleType: rule.ruleType,
        direction: rule.direction,
        action: rule.action,
        isCompliant: rule.isCompliant,
      },
    });
  }

  await insertAuditEvents(db, auditEvents);

  // ── Done ──────────────────────────────────────────────────────────────
  await pool.end();

  console.log('\n' + '='.repeat(60));
  console.log('Industrial Oil and Gas — OT Architecture seeded successfully.');
  console.log('');
  console.log('Summary:');
  console.log(`  Zones:               ${ZONES.length}`);
  console.log(`  Assets:              ${ASSETS.length}`);
  console.log(`  Zone memberships:    ${ASSETS.length}`);
  console.log(`  Conduits:            ${CONDUITS.length}`);
  console.log(`  Asset relationships: ${RELATIONSHIPS.length}`);
  console.log(`  Segmentation rules:  ${SEGMENTATION_RULES.length}`);
  console.log(`  Audit events:        ${auditEvents.length}`);
  console.log('');
  console.log('Zones:');
  for (const zone of ZONES) {
    console.log(
      `  ${zone.name.padEnd(40)} SL${zone.achievedSl}→SL${zone.targetSl}  Purdue L${zone.purdueLevel}`,
    );
  }
  console.log('');
  console.log('Assets:');
  for (const asset of ASSETS) {
    console.log(
      `  ${asset.name.padEnd(40)} ${asset.criticality.padEnd(20)} Purdue L${asset.purdueLevel}`,
    );
  }
  console.log('');
  console.log('Conduits:');
  for (const conduit of CONDUITS) {
    const enc = conduit.encryption ? 'E' : '-';
    const auth = conduit.authentication ? 'A' : '-';
    const mon = conduit.monitoring ? 'M' : '-';
    console.log(`  ${conduit.name.padEnd(42)} ${enc}${auth}${mon}  ${conduit.protocol}`);
  }
  console.log('');
  console.log('Segmentation rule compliance:');
  const compliant = SEGMENTATION_RULES.filter((r) => r.isCompliant).length;
  const nonCompliant = SEGMENTATION_RULES.filter((r) => !r.isCompliant).length;
  console.log(`  Compliant:     ${compliant}`);
  console.log(`  Non-compliant: ${nonCompliant}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
