'use client';

import { cn } from '@iec62443/ui';
import { GaugeChart, TrendArrow } from '@iec62443/ui/charts';
import {
  Shield,
  AlertTriangle,
  Target,
  Wrench,
  ClipboardCheck,
  FileText,
  BarChart3,
  Server,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { useDashboardSummary, useDashboardAssessmentProgress, useDashboardRecentFindings, useDashboardRemediationStatus } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();
  const { data: assessments, isLoading: assessmentsLoading } = useDashboardAssessmentProgress();
  const { data: recentFindings, isLoading: findingsLoading } = useDashboardRecentFindings();
  const { data: remediationStatus } = useDashboardRemediationStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Security posture overview and key metrics
          </p>
        </div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </Link>
      </div>

      {/* Top-level KPI Cards */}
      {summaryError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Failed to load dashboard data. Please refresh the page.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          icon={Shield}
          label="Security Score"
          value={summaryLoading ? '—' : String(summary?.securityScore ?? 0)}
          trend={<TrendArrow value={summary?.securityScoreTrend ?? 0} />}
          color="brand"
        >
          <GaugeChart
            value={summary?.securityScore ?? 0}
            max={100}
            size={120}
            strokeWidth={10}
          />
        </DashboardCard>

        <DashboardCard
          icon={AlertTriangle}
          label="Open Findings"
          value={summaryLoading ? '—' : String(summary?.openFindings ?? 0)}
          trend={<TrendArrow value={summary?.findingsTrend ?? 0} invert />}
          color="amber"
        >
          <div className="text-xs text-surface-500">
            {summary?.criticalFindings ?? 0} critical
          </div>
        </DashboardCard>

        <DashboardCard
          icon={Target}
          label="Active Risks"
          value={summaryLoading ? '—' : String(summary?.totalRisks ?? 0)}
          trend={<TrendArrow value={summary?.risksTrend ?? 0} invert />}
          color="red"
        >
          <div className="text-xs text-surface-500">
            {summary?.highRisks ?? 0} high
          </div>
        </DashboardCard>

        <DashboardCard
          icon={Wrench}
          label="Remediation Actions"
          value={summaryLoading ? '—' : String(summary?.remediationActions ?? 0)}
          trend={<TrendArrow value={summary?.remediationTrend ?? 0} />}
          color="green"
        >
          <div className="text-xs text-surface-500">
            {summary?.overdueActions ?? 0} overdue
          </div>
        </DashboardCard>
      </div>
      )}

      {/* Second Row: Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Active Assessments"
          value={summary?.activeAssessments ?? 0}
          subtitle={`${summary?.completedAssessments ?? 0} completed`}
        />
        <MetricCard
          icon={BarChart3}
          label="Assessment Progress"
          value={`${Math.round(summary?.assessmentProgress ?? 0)}%`}
        />
        <MetricCard
          icon={Server}
          label="Total Assets"
          value={summary?.assetCount ?? 0}
        />
        <MetricCard
          icon={Shield}
          label="Zones & Conduits"
          value={summary?.zoneCount ?? 0}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assessment Progress */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-surface-900">
                Assessment Progress
              </h2>
              <Link
                href="/assessments"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            {assessmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : assessments && assessments.length > 0 ? (
              <div className="space-y-3">
                {assessments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 rounded-md border border-surface-100 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {a.framework}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="h-2 rounded-full bg-surface-100">
                          <div
                            className="h-2 rounded-full bg-brand-600"
                            style={{ width: `${a.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-surface-600 w-10 text-right">
                        {a.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No active assessments"
                description="Create your first assessment to start tracking compliance progress."
                actionLabel="New Assessment"
                actionHref="/assessments/new"
              />
            )}
          </div>
        </div>

        {/* Recent Findings */}
        <div>
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-surface-900">
                Recent Findings
              </h2>
              <Link
                href="/findings"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            {findingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : recentFindings && recentFindings.length > 0 ? (
              <div className="space-y-3">
                {recentFindings.slice(0, 5).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 rounded-md border border-surface-100 p-3"
                  >
                    <SeverityBadge severity={f.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {f.title}
                      </p>
                      <p className="text-xs text-surface-500">
                        {f.assetName ?? 'No asset'} · {formatDate(f.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="No findings yet"
                description="Findings will appear here as assessments are completed."
                actionLabel="View Findings"
                actionHref="/findings"
              />
            )}
          </div>
        </div>
      </div>

      {/* Remediation Status */}
      {remediationStatus && (
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-surface-900">
              Remediation Status
            </h2>
            <Link
              href="/remediation"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <RemediationStat label="Open" value={remediationStatus.open} color="amber" />
            <RemediationStat label="In Progress" value={remediationStatus.inProgress} color="blue" />
            <RemediationStat label="Completed" value={remediationStatus.completed} color="green" />
            <RemediationStat label="Overdue" value={remediationStatus.overdue} color="red" />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DashboardCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: React.ReactNode;
  color: 'brand' | 'amber' | 'red' | 'green';
  children?: React.ReactNode;
}

function DashboardCard({ icon: Icon, label, value, trend, color, children }: DashboardCardProps) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-surface-500">{label}</p>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {trend}
        {children}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
}

function MetricCard({ icon: Icon, label, value, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-surface-400" />
        <p className="text-sm text-surface-500">{label}</p>
      </div>
      <p className="mt-1 text-xl font-semibold text-surface-900">{value}</p>
      {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-surface-300" />
      <h3 className="mt-4 text-lg font-medium text-surface-700">{title}</h3>
      <p className="mt-1 text-sm text-surface-500">{description}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', colorMap[severity] ?? 'bg-surface-100 text-surface-600')}>
      {severity}
    </span>
  );
}

function RemediationStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
  };

  return (
    <div className="text-center">
      <p className={cn('text-2xl font-bold', colorMap[color])}>{value}</p>
      <p className="text-xs text-surface-500">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
