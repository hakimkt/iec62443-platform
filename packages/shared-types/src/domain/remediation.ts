/**
 * IEC 62443 Remediation Domain Types
 *
 * Covers remediation plans, actions, and verification of remediation
 * effectiveness.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Remediation Plan
// ---------------------------------------------------------------------------

/** Lifecycle status of a remediation plan. */
export type RemediationPlanStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * A coordinated remediation plan addressing one or more findings and/or
 * risks.
 */
export interface RemediationPlan {
  id: UUID;
  name: string;
  description: string;
  /** Findings addressed by this plan. */
  findingIds: UUID[];
  /** Risks addressed by this plan. */
  riskIds: UUID[];
  ownerId: UUID;
  status: RemediationPlanStatus;
  /** Estimated budget for the entire plan. */
  budgetEstimate: number | null;
  /** Actual cost incurred. */
  budgetActual: number | null;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Remediation Action
// ---------------------------------------------------------------------------

/** Lifecycle status of a remediation action. */
export type RemediationActionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';

/**
 * A single actionable task within a remediation plan, typically
 * assigned to an individual.
 */
export interface RemediationAction {
  id: UUID;
  planId: UUID;
  title: string;
  description: string;
  /** The finding this action addresses. */
  findingId: UUID | null;
  /** The risk this action addresses. */
  riskId: UUID | null;
  assigneeId: UUID;
  status: RemediationActionStatus;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  /** Estimated cost of this action. */
  costEstimate: number | null;
  /** Actual cost of this action. */
  costActual: number | null;
  /** Whether this action represents a milestone in the plan. */
  milestone: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Remediation Verification
// ---------------------------------------------------------------------------

/** Possible outcomes of a remediation verification. */
export type VerificationResult = 'passed' | 'failed' | 'partial';

/**
 * A verification record confirming whether a remediation action was
 * effective.
 */
export interface RemediationVerification {
  id: UUID;
  actionId: UUID;
  verifiedBy: UUID;
  verificationDate: string;
  result: VerificationResult;
  notes: string | null;
  createdAt: string;
}
