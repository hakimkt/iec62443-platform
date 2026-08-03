/**
 * IEC 62443 Risk Domain Types
 *
 * Covers risk registers, risk entries, treatments, acceptance records,
 * matrix configuration, and heat-map data structures.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Risk Category
// ---------------------------------------------------------------------------

/** Standard risk categories used in IEC 62443 risk analysis. */
export type RiskCategory =
  'safety' | 'operational' | 'environmental' | 'financial' | 'reputational' | 'regulatory';

/** Overall risk level derived from the risk matrix. */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Risk treatment strategy. */
export type RiskTreatmentStrategy = 'mitigate' | 'transfer' | 'accept' | 'avoid' | 'pending';

/** Risk entry status. */
export type RiskEntryStatus =
  'identified' | 'analyzed' | 'treated' | 'monitored' | 'closed' | 'accepted';

// ---------------------------------------------------------------------------
// Risk Register
// ---------------------------------------------------------------------------

/**
 * A collection of risk entries scoped to a specific system, zone, or
 * organisational boundary.
 */
export interface RiskRegister {
  id: UUID;
  name: string;
  /** The type of entity this register is scoped to. */
  scopeType: 'system' | 'zone' | 'facility' | 'tenant';
  scopeId: UUID;
  ownerId: UUID;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Risk Entry
// ---------------------------------------------------------------------------

/**
 * A single identified risk within a register, including inherent and
 * residual scoring.
 */
export interface RiskEntry {
  id: UUID;
  registerId: UUID;
  title: string;
  description: string;
  category: RiskCategory;
  /** Threat source description (e.g. "Nation-state actor", "Malware"). */
  threatSource: string;
  /** Vulnerability description. */
  vulnerability: string;
  /** Assets affected by this risk. */
  assetIds: UUID[];
  /** Zones affected by this risk. */
  zoneIds: UUID[];
  /** Inherent likelihood (1–5). */
  likelihood: 1 | 2 | 3 | 4 | 5;
  /** Inherent impact (1–5). */
  impact: 1 | 2 | 3 | 4 | 5;
  /** Inherent risk score (likelihood × impact). */
  inherentScore: number;
  riskLevel: RiskLevel;
  treatment: RiskTreatmentStrategy;
  /** Residual likelihood after treatment (1–5). */
  residualLikelihood: 1 | 2 | 3 | 4 | 5 | null;
  /** Residual impact after treatment (1–5). */
  residualImpact: 1 | 2 | 3 | 4 | 5 | null;
  /** Residual risk score (residualLikelihood × residualImpact). */
  residualScore: number | null;
  riskOwnerId: UUID;
  /** IEC 62443 requirement reference (e.g. "SR 5.1"). */
  iecRequirement: string;
  status: RiskEntryStatus;
  identifiedAt: string;
  /** Date by which the risk should be reassessed. */
  reassessBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Risk Treatment
// ---------------------------------------------------------------------------

/** Status of a risk treatment action. */
export type RiskTreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

/**
 * A specific treatment action applied to a risk entry to reduce its
 * residual score.
 */
export interface RiskTreatment {
  id: UUID;
  riskId: UUID;
  /** Treatment type (e.g. "Safeguard implementation", "Insurance policy"). */
  type: string;
  description: string;
  responsibleId: UUID;
  targetDate: string;
  status: RiskTreatmentStatus;
  /** Effectiveness rating (0–100) after treatment is completed. */
  effectiveness: number | null;
  /** Estimated cost of the treatment. */
  costEstimate: number | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Risk Acceptance
// ---------------------------------------------------------------------------

/**
 * A formal acceptance of a risk by an authorised individual, with an
 * approval chain and expiry.
 */
export interface RiskAcceptance {
  id: UUID;
  riskId: UUID;
  acceptedBy: UUID;
  justification: string;
  /** Ordered list of user IDs forming the approval chain. */
  approvalChain: UUID[];
  /** When this acceptance expires and the risk must be re-evaluated. */
  expiresAt: string | null;
  /** Scheduled review date before expiry. */
  reviewDate: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Risk Matrix Configuration
// ---------------------------------------------------------------------------

/**
 * Configurable thresholds for the 5×5 risk matrix.
 */
export interface RiskMatrixThresholds {
  low: { max: number };
  medium: { min: number; max: number };
  high: { min: number; max: number };
  critical: { min: number };
}

/**
 * Colour scheme for the risk matrix cells.
 */
export interface RiskMatrixColorScheme {
  low: string;
  medium: string;
  high: string;
  critical: string;
}

/**
 * Configuration for a risk register's 5×5 matrix, including labels and
 * thresholds.
 */
export interface RiskMatrixConfig {
  id: UUID;
  registerId: UUID;
  /** Human-readable labels for the 5 likelihood levels. */
  likelihoodLabels: [string, string, string, string, string];
  /** Human-readable labels for the 5 impact levels. */
  impactLabels: [string, string, string, string, string];
  thresholds: RiskMatrixThresholds;
  colorScheme: RiskMatrixColorScheme;
}

// ---------------------------------------------------------------------------
// Heat Map Data
// ---------------------------------------------------------------------------

/**
 * A single cell in the risk heat map.
 */
export interface HeatMapCell {
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  /** Number of risk entries in this cell. */
  count: number;
  riskLevel: RiskLevel;
}

/**
 * Data structure for rendering the risk heat map visualisation.
 */
export interface HeatMapData {
  cells: HeatMapCell[];
}

/**
 * Distribution of risks by category.
 */
export interface RiskDistribution {
  category: string;
  count: number;
}

/**
 * Aggregate risk statistics for dashboard display.
 */
export interface RiskStats {
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}
