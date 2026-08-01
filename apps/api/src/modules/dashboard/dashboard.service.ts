import { eq, and, desc, count, sql } from 'drizzle-orm';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DbOrTx = NodePgDatabase | Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

import {
  findings,
  entries,
  scorecards,
  engagements,
  assets,
  zones,
  remediationActions,
} from '@iec62443/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface RiskHeatMapCell {
  likelihood: number;
  impact: number;
  count: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskHeatMapData {
  cells: RiskHeatMapCell[];
  labels: {
    likelihood: string[];
    impact: string[];
  };
}

export interface AssessmentProgressItem {
  id: string;
  name: string;
  framework: string;
  progress: number;
  status: string;
  dueDate: string | null;
}

export interface RecentFindingItem {
  id: string;
  title: string;
  severity: string;
  status: string;
  assetName: string | null;
  createdAt: string;
}

export interface RemediationStatus {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byPriority: Record<string, number>;
  timeline: RemediationTimelinePoint[];
}

export interface RemediationTimelinePoint {
  date: string;
  open: number;
  completed: number;
}

// ---------------------------------------------------------------------------
// Dashboard Service
// ---------------------------------------------------------------------------

export class DashboardService {
  constructor(
    private db: NodePgDatabase,
    readonly tenantId: string,
    private tenantSchema?: string,
  ) {}

  // Note: tenantId is used by the route handler for tenant context validation.
  // Actual tenant isolation is handled by PostgreSQL search_path set by the tenant middleware,
  // which scopes all queries to the tenant's schema automatically.

  async getSummary(): Promise<DashboardSummary> {
    return this.db.transaction(async (tx) => {
      // Set search_path inside the transaction so all queries use the tenant schema
      if (this.tenantSchema) {
        await tx.execute(sql`SET LOCAL search_path TO ${sql.identifier(this.tenantSchema)}, public`);
      }

      const [
        findingCounts,
        riskCounts,
        assessmentCounts,
        remediationCounts,
        assetCount,
        zoneCount,
        avgScore,
      ] = await Promise.all([
        this.getFindingCounts(tx),
        this.getRiskCounts(tx),
        this.getAssessmentCounts(tx),
        this.getRemediationCounts(tx),
        this.getAssetCount(tx),
        this.getZoneCount(tx),
        this.getAverageSecurityScore(tx),
      ]);

      return {
        securityScore: avgScore,
        securityScoreTrend: 0,
        totalFindings: findingCounts.total,
        openFindings: findingCounts.open,
        criticalFindings: findingCounts.critical,
        findingsTrend: 0,
        totalRisks: riskCounts.total,
        highRisks: riskCounts.high,
        risksTrend: 0,
        remediationActions: remediationCounts.total,
        overdueActions: remediationCounts.overdue,
        remediationTrend: 0,
        activeAssessments: assessmentCounts.active,
        completedAssessments: assessmentCounts.completed,
        assessmentProgress: assessmentCounts.avgProgress,
        assetCount,
        zoneCount,
      };
    });
  }

  async getRiskHeatMap(registerId?: string): Promise<RiskHeatMapData> {
    const conditions = [];

    if (registerId) {
      conditions.push(eq(entries.registerId, registerId));
    }

    const riskEntries = await this.db
      .select({
        likelihood: entries.likelihood,
        impact: entries.impact,
      })
      .from(entries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(1000);

    const cells: RiskHeatMapCell[] = [];
    const matrix: Record<string, number> = {};

    for (const entry of riskEntries) {
      const l = entry.likelihood ?? 1;
      const i = entry.impact ?? 1;
      const key = `${l}-${i}`;
      matrix[key] = (matrix[key] ?? 0) + 1;
    }

    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        const key = `${l}-${i}`;
        const c = matrix[key] ?? 0;
        const score = l * i;
        cells.push({
          likelihood: l,
          impact: i,
          count: c,
          level: score >= 15 ? 'critical' : score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low',
        });
      }
    }

    return {
      cells,
      labels: {
        likelihood: ['1 - Rare', '2 - Unlikely', '3 - Possible', '4 - Likely', '5 - Almost Certain'],
        impact: ['1 - Negligible', '2 - Minor', '3 - Moderate', '4 - Major', '5 - Catastrophic'],
      },
    };
  }

  async getAssessmentProgress(): Promise<AssessmentProgressItem[]> {
    const rows = await this.db
      .select({
        id: engagements.id,
        name: engagements.name,
        status: engagements.status,
        createdAt: engagements.createdAt,
      })
      .from(engagements)
      .where(eq(engagements.status, 'in_progress'))
      .orderBy(desc(engagements.createdAt))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      framework: 'IEC 62443',
      progress: 0,
      status: r.status,
      dueDate: null,
    }));
  }

  async getRecentFindings(): Promise<RecentFindingItem[]> {
    const rows = await this.db
      .select({
        id: findings.id,
        title: findings.title,
        severity: findings.severity,
        status: findings.status,
        createdAt: findings.createdAt,
      })
      .from(findings)
      .orderBy(desc(findings.createdAt))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      status: r.status,
      assetName: null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getRemediationStatus(): Promise<RemediationStatus> {
    const statusCounts = await this.db
      .select({
        status: remediationActions.status,
        count: count(),
      })
      .from(remediationActions)
      .groupBy(remediationActions.status);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status ?? 'unknown'] = row.count;
    }

    const total = statusCounts.reduce((sum, r) => sum + r.count, 0);

    return {
      total,
      open: byStatus['open'] ?? 0,
      inProgress: byStatus['in_progress'] ?? 0,
      completed: byStatus['completed'] ?? 0,
      overdue: byStatus['overdue'] ?? 0,
      byPriority: {},
      timeline: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getFindingCounts(db: DbOrTx = this.db) {
    const [totalResult, openResult, criticalResult] = await Promise.all([
      db.select({ count: count() }).from(findings),
      db.select({ count: count() }).from(findings).where(eq(findings.status, 'open')),
      db.select({ count: count() }).from(findings).where(eq(findings.severity, 'critical')),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      open: openResult[0]?.count ?? 0,
      critical: criticalResult[0]?.count ?? 0,
    };
  }

  private async getRiskCounts(db: DbOrTx = this.db) {
    const [totalResult, highResult] = await Promise.all([
      db.select({ count: count() }).from(entries),
      db.select({ count: count() }).from(entries).where(eq(entries.riskLevel, 'high')),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      high: highResult[0]?.count ?? 0,
    };
  }

  private async getAssessmentCounts(db: DbOrTx = this.db) {
    const [activeResult, completedResult] = await Promise.all([
      db.select({ count: count() }).from(engagements).where(eq(engagements.status, 'in_progress')),
      db.select({ count: count() }).from(engagements).where(eq(engagements.status, 'completed')),
    ]);

    return {
      active: activeResult[0]?.count ?? 0,
      completed: completedResult[0]?.count ?? 0,
      avgProgress: 0,
    };
  }

  private async getRemediationCounts(db: DbOrTx = this.db) {
    const [totalResult, overdueResult] = await Promise.all([
      db.select({ count: count() }).from(remediationActions),
      db.select({ count: count() }).from(remediationActions).where(eq(remediationActions.status, 'overdue')),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      overdue: overdueResult[0]?.count ?? 0,
    };
  }

  private async getAssetCount(db: DbOrTx = this.db): Promise<number> {
    const result = await db.select({ count: count() }).from(assets);
    return result[0]?.count ?? 0;
  }

  private async getZoneCount(db: DbOrTx = this.db): Promise<number> {
    const result = await db.select({ count: count() }).from(zones);
    return result[0]?.count ?? 0;
  }

  private async getAverageSecurityScore(db: DbOrTx = this.db): Promise<number> {
    const result = await db
      .select({ avg: sql<number>`coalesce(avg(${scorecards.compliancePct}), 0)` })
      .from(scorecards);

    return Math.round((result[0]?.avg ?? 0) * 10) / 10;
  }
}
