/**
 * IEC 62443 Assessment Domain Types
 *
 * Covers gap assessments, system assessments, component assessments,
 * CSMS assessments, and custom engagement workflows.
 */

/** Branded UUID type for type-safe identifier usage. */
type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Assessment Engagement
// ---------------------------------------------------------------------------

/** The type of assessment being performed. */
export type AssessmentType = 'gap' | 'system' | 'component' | 'csms' | 'custom';

/** Lifecycle status of an assessment engagement. */
export type AssessmentStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';

/** IEC 62443 part number being assessed. */
export type IecPart = '62443-1' | '62443-2' | '62443-3' | '62443-4';

/**
 * Represents a single assessment engagement against an IEC 62443 scope.
 *
 * An engagement is the top-level container for questions, responses,
 * scorecards, and findings produced during an assessment cycle.
 */
export interface AssessmentEngagement {
  id: UUID;
  name: string;
  description: string;
  type: AssessmentType;
  iecPart: IecPart;
  /** The system (or zone) this engagement is scoped to. */
  scopeSystemId: UUID | null;
  /** Security Level the system is targeting. */
  targetSl: 0 | 1 | 2 | 3 | 4;
  /** Security Level currently achieved. */
  currentSl: 0 | 1 | 2 | 3 | 4;
  status: AssessmentStatus;
  leadAssessorId: UUID | null;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  templateId: UUID | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Assessment Template
// ---------------------------------------------------------------------------

/**
 * A reusable template that defines the structure and questions for an
 * assessment engagement.
 */
export interface AssessmentTemplate {
  id: UUID;
  name: string;
  description: string;
  iecPart: IecPart;
  version: string;
  /** Whether this template is scoped to a system-level assessment. */
  isSystem: boolean;
  /** Top-level section names in the template. */
  sections: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Assessment Question
// ---------------------------------------------------------------------------

/**
 * A single question within an assessment template, mapped to an IEC 62443
 * clause and requirement.
 */
export interface AssessmentQuestion {
  id: UUID;
  templateId: UUID;
  section: string;
  /** IEC 62443 clause reference (e.g. "SR 1.1"). */
  clauseRef: string;
  questionText: string;
  requirementId: string;
  maxScore: number;
  guidanceText: string;
  /** Sort order within the template section. */
  sortOrder: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Assessment Response
// ---------------------------------------------------------------------------

/** Maturity level of an individual response (ML 0–4 per IEC 62443-2-1). */
export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * An assessor's response to a single assessment question within an
 * engagement.
 */
export interface AssessmentResponse {
  id: UUID;
  engagementId: UUID;
  questionId: UUID;
  score: number;
  maturityLevel: MaturityLevel;
  assessorNotes: string;
  /** References to evidence items supporting this response. */
  evidenceRefs: UUID[];
  /** References to findings linked to this response. */
  findingRefs: UUID[];
  answeredBy: UUID;
  answeredAt: string;
  reviewedBy: UUID | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Assessment Scorecard
// ---------------------------------------------------------------------------

/**
 * A snapshot of compliance scores for a specific category within an
 * engagement.
 */
export interface AssessmentScorecard {
  id: UUID;
  engagementId: UUID;
  category: string;
  currentSl: 0 | 1 | 2 | 3 | 4;
  targetSl: 0 | 1 | 2 | 3 | 4;
  /** Gap between target and current SL. */
  gap: number;
  totalQuestions: number;
  answeredCount: number;
  /** Compliance percentage (0–100). */
  compliancePct: number;
  snapshotAt: string;
}

// ---------------------------------------------------------------------------
// Assessment Progress
// ---------------------------------------------------------------------------

/**
 * Aggregated progress metrics for an assessment engagement.
 */
export interface AssessmentProgress {
  engagementId: UUID;
  totalQuestions: number;
  answeredCount: number;
  /** Completion percentage (0–100). */
  completionPct: number;
  lastAnsweredAt: string | null;
}
