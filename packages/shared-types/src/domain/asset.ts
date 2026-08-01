/**
 * IEC 62443 Asset Domain Types
 *
 * Covers industrial assets, their relationships, import jobs, and
 * aggregate statistics.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Asset
// ---------------------------------------------------------------------------

/** Classification of IACS asset types. */
export type AssetType =
  | 'plc'
  | 'hmi'
  | 'scada_server'
  | 'engineering_workstation'
  | 'switch'
  | 'router'
  | 'firewall'
  | 'historian'
  | 'mes'
  | 'erp'
  | 'server'
  | 'workstation'
  | 'sensor'
  | 'actuator'
  | 'vfd'
  | 'dcs_controller'
  | 'rtu'
  | 'safety_controller'
  | 'other';

/** Criticality classification of an asset. */
export type AssetCriticality =
  | 'safety_critical'
  | 'mission_critical'
  | 'business_critical'
  | 'operational'
  | 'non_critical';

/** Operational status of an asset. */
export type AssetOperationalStatus =
  | 'operational'
  | 'maintenance'
  | 'decommissioned'
  | 'standby';

/** Purdue Model level (0–5) — re-exported from zone for convenience. */
export type { PurdueLevel } from './zone';
import type { PurdueLevel } from './zone';

/**
 * A physical or logical asset within the IACS environment.
 */
export interface Asset {
  id: UUID;
  name: string;
  description: string;
  type: AssetType;
  criticality: AssetCriticality;
  vendor: string | null;
  model: string | null;
  firmwareVersion: string | null;
  serialNumber: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  networkSegment: string | null;
  purdueLevel: PurdueLevel;
  /** Zone to which this asset is assigned. */
  zoneId: UUID | null;
  /** Physical location description. */
  location: string | null;
  operationalStatus: AssetOperationalStatus;
  installDate: string | null;
  lastPatchDate: string | null;
  /** End-of-life date for the asset or its firmware. */
  eolDate: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Asset Relationship
// ---------------------------------------------------------------------------

/** Types of relationships between assets. */
export type AssetRelationshipType =
  | 'communicates_with'
  | 'depends_on'
  | 'controls'
  | 'monitored_by'
  | 'connected_to';

/**
 * A directional relationship between two assets.
 */
export interface AssetRelationship {
  id: UUID;
  sourceAssetId: UUID;
  targetAssetId: UUID;
  relationshipType: AssetRelationshipType;
  /** Protocol used in the relationship (e.g. "Modbus TCP", "OPC UA"). */
  protocol: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Asset Import
// ---------------------------------------------------------------------------

/** Status of an asset import job. */
export type AssetImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * An error that occurred during a bulk asset import.
 */
export interface ImportError {
  /** Row number in the import file (1-based). */
  row: number;
  /** Human-readable error message. */
  message: string;
  /** Raw data from the failed row. */
  data: string;
}

/**
 * A bulk import job for assets from a CSV or spreadsheet file.
 */
export interface AssetImportJob {
  id: UUID;
  status: AssetImportStatus;
  totalRecords: number;
  processedRecords: number;
  succeededCount: number;
  failedCount: number;
  errors: ImportError[];
  createdAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Asset Statistics
// ---------------------------------------------------------------------------

/**
 * Aggregate statistics about assets in a tenant's inventory.
 */
export interface AssetStats {
  /** Count of assets grouped by type. */
  byType: Record<string, number>;
  /** Count of assets grouped by criticality. */
  byCriticality: Record<string, number>;
  /** Total number of assets. */
  total: number;
}
