/**
 * IEC 62443 Finding Domain Types
 *
 * Covers findings identified during assessments, their lifecycle,
 * status history, and comments.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Finding Severity & Status
// ---------------------------------------------------------------------------

/** Severity classification of a finding. */
export type FindingSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

/** Lifecycle status of a finding. */
export type FindingStatus =
  | 'draft'
  | 'open'
  | 'acknowledged'
  | 'remediation_planned'
  | 'in_progress'
  | 'verification'
  | 'verified'
  | 'closed'
  | 'false_positive'
  | 'risk_accepted';

/** Origin of the finding. */
export type FindingSource = 'manual' | 'scanner' | 'import';

// ---------------------------------------------------------------------------
// Finding
// ---------------------------------------------------------------------------

/**
 * A finding represents a security deficiency, gap, or vulnerability
 * identified during an assessment or scan.
 */
export interface Finding {
  id: UUID;
  /** The engagement during which this finding was discovered. */
  engagementId: UUID | null;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  /** High-level category (e.g. "Network", "Access Control"). */
  category: string;
  /** More specific subcategory (e.g. "Firewall Rule", "Authentication"). */
  subcategory: string;
  /** IEC 62443 requirement reference (e.g. "SR 1.1"). */
  iecRequirement: string;
  /** Assets affected by this finding. */
  assetIds: UUID[];
  /** Zones affected by this finding. */
  zoneIds: UUID[];
  /** Associated risk entries. */
  riskIds: UUID[];
  /** User assigned to remediate this finding. */
  assignedTo: UUID | null;
  dueDate: string | null;
  discoveredAt: string;
  closedAt: string | null;
  closedBy: UUID | null;
  /** Note explaining the resolution or closure reason. */
  resolutionNote: string | null;
  source: FindingSource;
  /** Reference to an external system (e.g. vulnerability scanner ID). */
  externalRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Finding Status History
// ---------------------------------------------------------------------------

/**
 * A record of a status transition for a finding, forming an audit trail
 * of the finding's lifecycle.
 */
export interface FindingStatusHistory {
  id: UUID;
  findingId: UUID;
  fromStatus: FindingStatus;
  toStatus: FindingStatus;
  changedBy: UUID;
  /** Reason for the status change. */
  reason: string;
  changedAt: string;
}

// ---------------------------------------------------------------------------
// Finding Comment
// ---------------------------------------------------------------------------

/**
 * A comment attached to a finding for collaboration between assessors,
 * reviewers, and remediation teams.
 */
export interface FindingComment {
  id: UUID;
  findingId: UUID;
  authorId: UUID;
  body: string;
  /** Whether the comment is visible only to internal team members. */
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}
