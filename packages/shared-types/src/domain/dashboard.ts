/**
 * IEC 62443 Dashboard Domain Types
 *
 * Covers executive dashboard summaries, widgets, and metrics.
 */

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

/** Top-level dashboard summary with key metrics. */
export interface DashboardSummary {
  securityScore: number;
  securityScoreTrend: number;
  totalFindings: number;
  openFindings: number;
  criticalFindings: number;
  findingsTrend: number;
  totalRisks: number;
  highRisks: number;
  risksTrend: number;
  remediationActions: number;
  overdueActions: number;
  remediationTrend: number;
  activeAssessments: number;
  completedAssessments: number;
  assessmentProgress: number;
  assetCount: number;
  zoneCount: number;
}

/** Risk heat-map cell for the dashboard widget. */
export interface RiskHeatMapCell {
  likelihood: number;
  impact: number;
  count: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

/** Risk heat-map data for the dashboard. */
export interface RiskHeatMapData {
  cells: RiskHeatMapCell[];
  labels: {
    likelihood: string[];
    impact: string[];
  };
}

/** Assessment progress item for the dashboard list. */
export interface AssessmentProgressItem {
  id: string;
  name: string;
  framework: string;
  progress: number;
  status: string;
  dueDate: string | null;
}

/** Recent finding item for the dashboard list. */
export interface RecentFindingItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  assetName: string | null;
  createdAt: string;
}

/** Remediation status summary for the dashboard. */
export interface RemediationStatus {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: Record<string, number>;
  timeline: RemediationTimelinePoint[];
}

/** Single point on the remediation timeline. */
export interface RemediationTimelinePoint {
  date: string;
  open: number;
  completed: number;
}
