'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@iec62443/ui/primitives';
import { Badge } from '@iec62443/ui/primitives';
import { Separator } from '@iec62443/ui/primitives';
import { ProgressBar } from '@iec62443/ui/primitives';
import { ArrowLeft, Trash2, ClipboardCheck, BarChart3, ListChecks } from 'lucide-react';
import { useAssessment, useAssessmentProgress, useDeleteAssessment } from '@/hooks/useAssessments';
import type { AssessmentStatus } from '@iec62443/shared-types';

const statusBadgeVariant: Record<AssessmentStatus, 'draft' | 'in_progress' | 'review' | 'completed' | 'archived'> = {
  draft: 'draft',
  in_progress: 'in_progress',
  review: 'review',
  completed: 'completed',
  archived: 'archived',
};

type TabKey = 'summary' | 'questions' | 'scorecard' | 'findings' | 'export';

export default function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const { data: assessment, isLoading } = useAssessment(assessmentId || null);
  const { data: progress } = useAssessmentProgress(assessmentId || null);
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

  const completionPct = progress?.completionPct ?? 0;

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
          {([
            { key: 'summary' as TabKey, label: 'Summary', icon: ClipboardCheck },
            { key: 'questions' as TabKey, label: 'Questions', icon: ListChecks },
            { key: 'scorecard' as TabKey, label: 'Scorecard', icon: BarChart3 },
          ]).map((tab) => (
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
                  <dd className="text-sm text-surface-900">{new Date(assessment.createdAt).toLocaleDateString()}</dd>
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

        {activeTab === 'scorecard' && (
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Scorecard</h3>
            <p className="mt-4 text-sm text-surface-500">
              Scorecard data will be available once assessment questions have been answered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
