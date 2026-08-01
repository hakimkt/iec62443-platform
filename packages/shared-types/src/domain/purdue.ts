/**
 * IEC 62443 Purdue Model Domain Types
 *
 * Covers Purdue Model definitions, level mappings, communication rules,
 * and compliance verification results.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Purdue Model
// ---------------------------------------------------------------------------

/**
 * A Purdue Model instance scoped to a facility, defining the
 * hierarchical levels and their communication constraints.
 */
export interface PurdueModel {
  id: UUID;
  name: string;
  facilityId: UUID | null;
  description: string;
  /** Whether this is the default model for the tenant. */
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Purdue Level
// ---------------------------------------------------------------------------

/**
 * A single level within the Purdue Model (e.g. Level 0 – Physical
 * Process, Level 3.5 – DMZ).
 */
export interface PurdueLevelDefinition {
  id: UUID;
  modelId: UUID;
  /** Numeric level number (e.g. 0, 1, 2, 3, 3.5, 4, 5). */
  levelNumber: number;
  /** Human-readable name (e.g. "Enterprise Network"). */
  name: string;
  description: string;
  /** Hex colour for diagram rendering. */
  color: string;
  /** Sort order within the model. */
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Purdue Asset Mapping
// ---------------------------------------------------------------------------

/**
 * Assignment of an asset to a specific Purdue level within a model.
 */
export interface PurdueAssetMapping {
  id: UUID;
  modelId: UUID;
  assetId: UUID;
  levelId: UUID;
  assignedBy: UUID;
  assignedAt: string;
}

// ---------------------------------------------------------------------------
// Communication Rule
// ---------------------------------------------------------------------------

/**
 * A rule governing whether communication is allowed between two Purdue
 * levels.
 */
export interface CommunicationRule {
  id: UUID;
  modelId: UUID;
  sourceLevelId: UUID;
  targetLevelId: UUID;
  /** Whether communication between these levels is permitted. */
  isAllowed: boolean;
  /** Additional condition that must be met (e.g. "via DMZ only"). */
  condition: string | null;
  /** Allowed protocol (e.g. "OPC UA", "HTTPS"). */
  protocol: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Compliance Violation
// ---------------------------------------------------------------------------

/**
 * A single violation of a communication rule detected during compliance
 * verification.
 */
export interface ComplianceViolation {
  /** The communication rule that was violated. */
  ruleId: UUID;
  /** Source Purdue level name. */
  sourceLevel: string;
  /** Target Purdue level name. */
  targetLevel: string;
  /** Name of the asset involved in the violation. */
  assetName: string;
  /** Protocol used in the violation. */
  protocol: string | null;
  /** Condition that was not met. */
  condition: string | null;
}

// ---------------------------------------------------------------------------
// Purdue Compliance Result
// ---------------------------------------------------------------------------

/**
 * Aggregate result of a Purdue Model compliance verification check.
 */
export interface PurdueComplianceResult {
  modelId: UUID;
  violations: ComplianceViolation[];
  compliantCount: number;
  violationCount: number;
}
