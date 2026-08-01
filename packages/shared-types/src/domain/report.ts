/**
 * IEC 62443 Report Domain Types
 *
 * Covers report generation, configuration, templates, and output
 * formats.
 */

type UUID = string & { readonly __brand: unique symbol };

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/** Available report types. */
export type ReportType =
  | 'assessment_summary'
  | 'risk_register'
  | 'csms_gap'
  | 'zone_topology'
  | 'purdue_compliance'
  | 'remediation_status'
  | 'executive'
  | 'audit_trail'
  | 'certification_evidence'
  | 'custom';

/** Lifecycle status of a report generation job. */
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * A generated report with its configuration and output file reference.
 */
export interface Report {
  id: UUID;
  type: ReportType;
  title: string;
  status: ReportStatus;
  config: ReportConfig;
  /** URL to the generated report file. */
  fileUrl: string | null;
  /** File size in bytes. */
  fileSize: number | null;
  generatedBy: UUID;
  createdAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// Report Configuration
// ---------------------------------------------------------------------------

/** Scope of a report. */
export type ReportScope = 'tenant' | 'engagement' | 'register';

/** Output format for the report. */
export type ReportFormat = 'pdf' | 'xlsx' | 'pptx';

/**
 * Configuration parameters for report generation.
 */
export interface ReportConfig {
  /** The scope of data included in the report. */
  scope: ReportScope;
  /** ID of the scoped entity (e.g. engagement ID, register ID). */
  scopeId: UUID | null;
  /** Date range for the report data. */
  dateRange: {
    from: string;
    to: string;
  } | null;
  /** Sections to include in the report. */
  includeSections: string[];
  format: ReportFormat;
}

// ---------------------------------------------------------------------------
// Report Template
// ---------------------------------------------------------------------------

/**
 * A reusable template for generating reports with predefined
 * configuration.
 */
export interface ReportTemplate {
  id: UUID;
  name: string;
  description: string;
  type: ReportType;
  /** Whether this is a system-provided template. */
  isSystem: boolean;
  /** Sections available in this template. */
  sections: string[];
  createdAt: string;
}
