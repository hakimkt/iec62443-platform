/**
 * IEC 62443 CSMS Domain Types
 *
 * Covers the Cybersecurity Management System framework, elements,
 * policies, improvement plans, and gap analysis as defined in
 * IEC 62443-2-1.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// CSMS Framework
// ---------------------------------------------------------------------------

/** Lifecycle status of a CSMS framework. */
export type CSMSFrameworkStatus = 'draft' | 'active' | 'archived';

/**
 * The top-level CSMS framework container for an organisation.
 *
 * A framework groups all CSMS elements, policies, and improvement plans
 * that together constitute the organisation's cybersecurity management
 * system.
 */
export interface CSMSFramework {
  id: UUID;
  name: string;
  organizationId: UUID;
  version: string;
  status: CSMSFrameworkStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CSMS Element
// ---------------------------------------------------------------------------

/** Implementation status of a CSMS element. */
export type ImplementationStatus =
  | 'implemented'
  | 'partial'
  | 'planned'
  | 'not_started'
  | 'na';

/**
 * A single element within a CSMS framework, representing a distinct
 * cybersecurity requirement or control area.
 */
export interface CSMSElement {
  id: UUID;
  frameworkId: UUID;
  /** Category grouping (e.g. "Policy", "Procedure", "Organizational"). */
  category: string;
  title: string;
  description: string;
  /** IEC 62443 requirement reference (e.g. "62443-2-1 4.2.1"). */
  requirementRef: string;
  implementationStatus: ImplementationStatus;
  /** Maturity score (0–4) based on IEC 62443-2-1 maturity levels. */
  maturityScore: 0 | 1 | 2 | 3 | 4;
  ownerId: UUID | null;
  lastReviewed: string | null;
  nextReview: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CSMS Policy
// ---------------------------------------------------------------------------

/** Lifecycle status of a CSMS policy document. */
export type CSMSPolicyStatus = 'draft' | 'review' | 'approved' | 'deprecated';

/** Review cycle for a CSMS policy. */
export type CSMSReviewCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial';

/**
 * A formal policy document within the CSMS framework.
 */
export interface CSMS_POLICY {
  id: UUID;
  frameworkId: UUID;
  /** Optional link to the CSMS element this policy satisfies. */
  elementId: UUID | null;
  title: string;
  version: string;
  status: CSMSPolicyStatus;
  /** The policy body content (Markdown or rich text). */
  body: string;
  approvedBy: UUID | null;
  approvedAt: string | null;
  reviewCycle: CSMSReviewCycle;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CSMS Improvement Plan
// ---------------------------------------------------------------------------

/** Priority of a CSMS improvement action. */
export type CSMSImprovementPriority = 'low' | 'medium' | 'high' | 'critical';

/** Status of a CSMS improvement plan. */
export type CSMSImprovementStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * A planned improvement action to close a gap in a CSMS element.
 */
export interface CSMSImprovementPlan {
  id: UUID;
  frameworkId: UUID;
  /** The CSMS element this improvement plan addresses. */
  elementId: UUID;
  title: string;
  description: string;
  priority: CSMSImprovementPriority;
  targetDate: string | null;
  status: CSMSImprovementStatus;
  ownerId: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CSMS Gap Analysis
// ---------------------------------------------------------------------------

/**
 * A single gap item identifying the delta between current and target
 * implementation status for a CSMS element.
 */
export interface CSMSGapItem {
  elementId: UUID;
  category: string;
  title: string;
  currentStatus: ImplementationStatus;
  targetStatus: ImplementationStatus;
  /** Description of the gap between current and target. */
  gap: string;
  priority: CSMSImprovementPriority;
}

/**
 * Gap analysis result for an entire CSMS framework.
 */
export interface CSMSGapAnalysis {
  frameworkId: UUID;
  elements: CSMSGapItem[];
}
