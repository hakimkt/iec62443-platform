/**
 * IEC 62443 Zone & Conduit Domain Types
 *
 * Covers IACS zones, conduits, zone memberships, segmentation rules,
 * and zone topology as defined in IEC 62443-3-3.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Zone
// ---------------------------------------------------------------------------

/** Classification of IACS zone types. */
export type ZoneType =
  | 'process_control'
  | 'safety_instrumented'
  | 'manufacturing_ops'
  | 'enterprise_it'
  | 'idmz'
  | 'remote_access'
  | 'wireless'
  | 'custom';

/** Security Level (SL) as defined by IEC 62443. */
export type SecurityLevel = 0 | 1 | 2 | 3 | 4;

/** Purdue Model level (0–5). */
export type PurdueLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * A logical grouping of assets within a defined security perimeter.
 *
 * Zones are the fundamental isolation boundary in IEC 62443 architecture.
 */
export interface Zone {
  id: UUID;
  name: string;
  description: string;
  zoneType: ZoneType;
  securityLevel: SecurityLevel;
  /** Optional parent zone for nested zone hierarchies. */
  parentZoneId: UUID | null;
  purdueLevel: PurdueLevel;
  facilityId: UUID | null;
  /** X position on the network diagram canvas. */
  diagramX: number | null;
  /** Y position on the network diagram canvas. */
  diagramY: number | null;
  /** Width on the network diagram canvas. */
  diagramWidth: number | null;
  /** Height on the network diagram canvas. */
  diagramHeight: number | null;
  /** Hex colour for diagram rendering. */
  color: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Conduit
// ---------------------------------------------------------------------------

/** Classification of conduit communication types. */
export type ConduitType =
  | 'hardwired'
  | 'network'
  | 'wireless'
  | 'removable_media'
  | 'human'
  | 'other';

/**
 * A communication path between two zones, defining the allowed data
 * flow and security controls.
 */
export interface Conduit {
  id: UUID;
  name: string;
  description: string;
  sourceZoneId: UUID;
  targetZoneId: UUID;
  conduitType: ConduitType;
  /** Primary protocol used (e.g. "Modbus TCP", "OPC UA", "HTTPS"). */
  protocol: string | null;
  securityLevel: SecurityLevel;
  /** Whether encryption is required on this conduit. */
  encryption: boolean;
  /** Whether authentication is required on this conduit. */
  authentication: boolean;
  /** Whether monitoring is active on this conduit. */
  monitoring: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Zone Membership
// ---------------------------------------------------------------------------

/**
 * Represents the assignment of an asset to a zone.
 */
export interface ZoneMembership {
  id: UUID;
  zoneId: UUID;
  assetId: UUID;
  assignedBy: UUID;
  assignedAt: string;
}

// ---------------------------------------------------------------------------
// Segmentation Rule
// ---------------------------------------------------------------------------

/** Traffic direction for a segmentation rule. */
export type SegmentationDirection = 'inbound' | 'outbound' | 'bidirectional';

/** Action to take when traffic matches the rule. */
export type SegmentationAction = 'allow' | 'deny' | 'inspect' | 'proxy';

/**
 * A rule governing traffic flow through a conduit or zone boundary.
 */
export interface SegmentationRule {
  id: UUID;
  conduitId: UUID | null;
  zoneId: UUID;
  /** Rule type (e.g. "firewall", "acl", "policy"). */
  ruleType: string;
  description: string;
  direction: SegmentationDirection;
  action: SegmentationAction;
  /** Whether the rule complies with IEC 62443 requirements. */
  isCompliant: boolean;
  /** When the rule was last verified as compliant. */
  verifiedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Zone Topology
// ---------------------------------------------------------------------------

/**
 * Complete topology graph of zones, conduits, and memberships for a
 * given scope.
 */
export interface ZoneTopology {
  zones: Zone[];
  conduits: Conduit[];
  memberships: ZoneMembership[];
}
