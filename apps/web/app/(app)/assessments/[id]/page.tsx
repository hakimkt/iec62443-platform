'use client';

import type { AssessmentScorecard, AssessmentStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Badge, Button, ProgressBar, Separator } from '@iec62443/ui/primitives';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ListChecks,
  Shield,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import {
  useAssessment,
  useAssessmentProgress,
  useAssessmentScorecard,
  useDeleteAssessment,
} from '@/hooks/useAssessments';

const statusBadgeVariant: Record<
  AssessmentStatus,
  'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
> = {
  draft: 'draft',
  in_progress: 'in_progress',
  review: 'review',
  completed: 'completed',
  archived: 'archived',
};

const SL_LABELS: Record<number, string> = {
  0: 'SL 0 — None',
  1: 'SL 1 — Low',
  2: 'SL 2 — Medium',
  3: 'SL 3 — High',
  4: 'SL 4 — Very High',
};

type TabKey = 'summary' | 'questions' | 'scorecard' | 'findings' | 'export';

// ---------------------------------------------------------------------------
// Scorecard table
// ---------------------------------------------------------------------------

function ScorecardTable({ scorecard }: { scorecard: AssessmentScorecard[] }) {
  if (scorecard.length === 0) {
    return (
      <div className="py-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-surface-300" />
        <p className="mt-2 text-sm text-surface-500">No scorecard data available yet.</p>
        <p className="text-xs text-surface-400">
          Answer assessment questions to generate scorecard results.
        </p>
      </div>
    );
  }

  const totalAnswered = scorecard.reduce((sum, s) => sum + s.answeredCount, 0);
  const totalQuestions = scorecard.reduce((sum, s) => sum + s.totalQuestions, 0);
  const overallCompliance =
    totalQuestions > 0
      ? scorecard.reduce((sum, s) => sum + s.compliancePct * s.totalQuestions, 0) / totalQuestions
      : 0;

  // Weakest-link: overall SL-A is the minimum currentSl across all sections
  const overallSl = Math.min(...scorecard.map((s) => s.currentSl));
  const overallTargetSl = Math.max(...scorecard.map((s) => s.targetSl));
  const overallGap = Math.max(0, overallTargetSl - overallSl);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <p className="text-xs font-medium text-surface-500">Overall SL-A</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">{SL_LABELS[overallSl]}</p>
          <p className="mt-1 text-xs text-surface-400">Weakest-link model</p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <p className="text-xs font-medium text-surface-500">Target SL</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">
            {SL_LABELS[overallTargetSl]}
          </p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <p className="text-xs font-medium text-surface-500">SL Gap</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold',
              overallGap > 0 ? 'text-amber-600' : 'text-green-600',
            )}
          >
            {overallGap > 0
              ? `${overallGap} level${overallGap > 1 ? 's' : ''} below target`
              : 'Target met'}
          </p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <p className="text-xs font-medium text-surface-500">Compliance</p>
          <p className="mt-1 text-2xl font-semibold text-surface-900">
            {Math.round(overallCompliance)}%
          </p>
          <p className="mt-1 text-xs text-surface-400">
            {totalAnswered} / {totalQuestions} questions
          </p>
        </div>
      </div>

      {/* Per-section table */}
      <div className="overflow-x-auto rounded-lg border border-surface-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th className="px-4 py-3 text-left font-medium text-surface-600">Section</th>
              <th className="px-4 py-3 text-center font-medium text-surface-600">Current SL</th>
              <th className="px-4 py-3 text-center font-medium text-surface-600">Target SL</th>
              <th className="px-4 py-3 text-center font-medium text-surface-600">Gap</th>
              <th className="px-4 py-3 text-center font-medium text-surface-600">Compliance</th>
              <th className="px-4 py-3 text-center font-medium text-surface-600">Progress</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.map((row) => {
              const gap = row.targetSl - row.currentSl;
              const isMet = gap <= 0;
              return (
                <tr key={row.id} className="border-b border-surface-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-surface-900">{row.category}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                        row.currentSl >= 3
                          ? 'bg-green-100 text-green-700'
                          : row.currentSl >= 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700',
                      )}
                    >
                      SL {row.currentSl}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-surface-600">SL {row.targetSl}</td>
                  <td className="px-4 py-3 text-center">
                    {isMet ? (
                      <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-amber-600 font-medium">+{gap}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'font-medium',
                        row.compliancePct >= 80
                          ? 'text-green-600'
                          : row.compliancePct >= 50
                            ? 'text-amber-600'
                            : 'text-red-600',
                      )}
                    >
                      {row.compliancePct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-surface-500">
                    {row.answeredCount}/{row.totalQuestions}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-surface-400">
        SL-A is calculated using the IEC 62443 minimum-bar (weakest-link) model: the lowest-scoring
        requirement in each section caps the Security Level for that section. The overall SL-A is
        the minimum across all sections.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed assessment view
// ---------------------------------------------------------------------------

function CompletedAssessmentView({
  assessment,
  scorecard,
  progress,
}: {
  assessment: NonNullable<ReturnType<typeof useAssessment>['data']>;
  scorecard: AssessmentScorecard[];
  progress: ReturnType<typeof useAssessmentProgress>['data'];
}) {
  const totalAnswered = scorecard.reduce((sum, s) => sum + s.answeredCount, 0);
  const totalQuestions = scorecard.reduce((sum, s) => sum + s.totalQuestions, 0);
  const overallSl = scorecard.length > 0 ? Math.min(...scorecard.map((s) => s.currentSl)) : 0;
  const overallTargetSl =
    scorecard.length > 0
      ? Math.max(...scorecard.map((s) => s.targetSl))
      : (assessment.targetSl ?? 0);
  const overallGap = Math.max(0, overallTargetSl - overallSl);
  const overallCompliance =
    totalQuestions > 0
      ? scorecard.reduce((sum, s) => sum + s.compliancePct * s.totalQuestions, 0) / totalQuestions
      : 0;
  const sectionsWithGaps = scorecard.filter((s) => s.currentSl < s.targetSl);
  const completionPct =
    progress?.completionPct ?? (totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Completion banner */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-green-900">Assessment Completed</h2>
            <p className="mt-1 text-sm text-green-700">
              This assessment was completed on{' '}
              {assessment.completedAt
                ? new Date(assessment.completedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A'}
              .
              {overallGap === 0
                ? ' All sections meet their target Security Level.'
                : ` ${sectionsWithGaps.length} section${sectionsWithGaps.length !== 1 ? 's' : ''} below target SL.`}
            </p>
          </div>
          <Link href="/reports/new">
            <Button variant="primary" size="sm" icon={FileText}>
              Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-surface-400" />
            <p className="text-xs font-medium text-surface-500">Overall SL-A</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-surface-900">SL {overallSl}</p>
          <p className="mt-1 text-xs text-surface-400">Weakest-link model</p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-surface-400" />
            <p className="text-xs font-medium text-surface-500">Target SL</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-surface-900">SL {overallTargetSl}</p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <div className="flex items-center gap-2">
            {overallGap > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <p className="text-xs font-medium text-surface-500">SL Gap</p>
          </div>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold',
              overallGap > 0 ? 'text-amber-600' : 'text-green-600',
            )}
          >
            {overallGap > 0 ? `${overallGap} level${overallGap > 1 ? 's' : ''}` : 'Met'}
          </p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-surface-400" />
            <p className="text-xs font-medium text-surface-500">Compliance</p>
          </div>
          <p className="mt-1 text-2xl font-semibold text-surface-900">
            {Math.round(overallCompliance)}%
          </p>
          <p className="mt-1 text-xs text-surface-400">
            {totalAnswered} / {totalQuestions} questions
          </p>
        </div>
      </div>

      {/* Sections with gaps */}
      {sectionsWithGaps.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Sections Below Target Security Level
          </h3>
          <div className="mt-3 space-y-2">
            {sectionsWithGaps.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2"
              >
                <span className="text-sm text-amber-900">{s.category}</span>
                <span className="text-sm font-medium text-amber-700">
                  SL {s.currentSl} → SL {s.targetSl} (gap: +{s.targetSl - s.currentSl})
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-600">
            Remediation actions should target these sections to achieve the target Security Level.
          </p>
        </div>
      )}

      {/* Assessment details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <h3 className="text-sm font-medium text-surface-700">Assessment Details</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Name</dt>
              <dd className="text-sm text-surface-900">{assessment.name}</dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Type</dt>
              <dd className="text-sm text-surface-900 capitalize">{assessment.type}</dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">IEC Part</dt>
              <dd className="text-sm text-surface-900">62443-{assessment.iecPart}</dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Status</dt>
              <dd className="text-sm text-surface-900 capitalize">
                {assessment.status.replace('_', ' ')}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Completed</dt>
              <dd className="text-sm text-surface-900">
                {assessment.completedAt
                  ? new Date(assessment.completedAt).toLocaleDateString()
                  : '—'}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Completion</dt>
              <dd className="text-sm text-surface-900">{Math.round(completionPct)}%</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <h3 className="text-sm font-medium text-surface-700">Description</h3>
          <p className="mt-4 text-sm text-surface-600">
            {assessment.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Full scorecard */}
      <div>
        <h3 className="text-sm font-medium text-surface-700 mb-4">Scorecard</h3>
        <ScorecardTable scorecard={scorecard} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const { data: assessment, isLoading } = useAssessment(assessmentId || null);
  const { data: progress } = useAssessmentProgress(assessmentId || null);
  const { data: scorecard } = useAssessmentScorecard(assessmentId || null);
  const deleteAssessment = useDeleteAssessment();

  const handleDelete = async () => {
    if (!assessmentId) return;
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    await deleteAssessment.mutateAsync(assessmentId);
    router.push('/assessments');
  };

  if (isLoading || !assessment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  const isCompleted = assessment.status === 'completed';
  const isReview = assessment.status === 'review';
  const isReadOnly = isCompleted || isReview;
  const completionPct = progress?.completionPct ?? 0;

  // Completed/review assessments show the full report view
  if (isReadOnly) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/assessments"
              className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Assessments
            </Link>
            <h1 className="text-xl font-semibold text-surface-900">{assessment.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant={statusBadgeVariant[assessment.status]} size="sm">
                {assessment.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-surface-500 capitalize">{assessment.type}</span>
              <span className="text-sm text-surface-500">IEC 62443-{assessment.iecPart}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/reports/new">
              <Button variant="primary" size="sm" icon={FileText}>
                Generate Report
              </Button>
            </Link>
          </div>
        </div>

        <CompletedAssessmentView
          assessment={assessment}
          scorecard={scorecard ?? []}
          progress={progress}
        />
      </div>
    );
  }

  // Draft / in_progress — show the working view with tabs
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/assessments"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Assessments
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">{assessment.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={statusBadgeVariant[assessment.status]} size="sm">
              {assessment.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-surface-500 capitalize">{assessment.type}</span>
            <span className="text-sm text-surface-500">IEC 62443-{assessment.iecPart}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(assessment.status === 'draft' || assessment.status === 'in_progress') && (
            <Link href={`/assessments/${assessmentId}/questions`}>
              <Button variant="primary" size="sm" icon={ListChecks}>
                {assessment.status === 'draft' ? 'Start Assessment' : 'Continue Assessment'}
              </Button>
            </Link>
          )}
          {assessment.status === 'draft' && (
            <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500">Progress</span>
          <span className="font-medium text-surface-900">
            {progress?.answeredCount ?? 0} / {progress?.totalQuestions ?? 0} questions
          </span>
        </div>
        <ProgressBar value={completionPct} color="brand" className="mt-2" />
        <div className="mt-2 flex items-center justify-between text-xs text-surface-400">
          <span>Target SL {assessment.targetSl}</span>
          <span>{Math.round(completionPct)}% complete</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Assessment sections">
          {[
            { key: 'summary' as TabKey, label: 'Summary', icon: ClipboardCheck },
            { key: 'questions' as TabKey, label: 'Questions', icon: ListChecks },
            { key: 'scorecard' as TabKey, label: 'Scorecard', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => {
                if (tab.key === 'questions') {
                  router.push(`/assessments/${assessmentId}/questions`);
                } else {
                  setActiveTab(tab.key);
                }
              }}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
              <h3 className="text-sm font-medium text-surface-700">Assessment Details</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Name</dt>
                  <dd className="text-sm text-surface-900">{assessment.name}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Type</dt>
                  <dd className="text-sm text-surface-900 capitalize">{assessment.type}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">IEC Part</dt>
                  <dd className="text-sm text-surface-900">62443-{assessment.iecPart}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Target SL</dt>
                  <dd className="text-sm text-surface-900">SL {assessment.targetSl}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Current SL</dt>
                  <dd className="text-sm text-surface-900">SL {assessment.currentSl}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Target Date</dt>
                  <dd className="text-sm text-surface-900">{assessment.targetDate ?? '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Created</dt>
                  <dd className="text-sm text-surface-900">
                    {new Date(assessment.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
              <h3 className="text-sm font-medium text-surface-700">Description</h3>
              <p className="mt-4 text-sm text-surface-600">
                {assessment.description || 'No description provided.'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'scorecard' && <ScorecardTable scorecard={scorecard ?? []} />}
      </div>
    </div>
  );
}
