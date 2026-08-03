'use client';

import type { FindingSeverity } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Badge, Button, Input, Separator, Textarea } from '@iec62443/ui/primitives';
import { AlertTriangle, ArrowLeft, History, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import {
  useAddComment,
  useFinding,
  useFindingComments,
  useFindingHistory,
  useTransitionFinding,
} from '@/hooks/useFindings';

const severityColors: Record<FindingSeverity, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  informational: 'bg-surface-100 text-surface-600',
};

const statusBadgeVariant: Record<
  string,
  'draft' | 'in_progress' | 'review' | 'completed' | 'archived'
> = {
  draft: 'draft',
  open: 'in_progress',
  acknowledged: 'in_progress',
  remediation_planned: 'review',
  in_progress: 'in_progress',
  verification: 'review',
  verified: 'completed',
  closed: 'completed',
  false_positive: 'archived',
  risk_accepted: 'archived',
};

type TabKey = 'details' | 'comments' | 'history';

const NEXT_STATUS_OPTIONS: Record<string, { label: string; value: string }[]> = {
  draft: [{ label: 'Open', value: 'open' }],
  open: [{ label: 'Acknowledge', value: 'acknowledged' }],
  acknowledged: [{ label: 'Plan Remediation', value: 'remediation_planned' }],
  remediation_planned: [{ label: 'Start Work', value: 'in_progress' }],
  in_progress: [{ label: 'Submit for Verification', value: 'verification' }],
  verification: [{ label: 'Mark Verified', value: 'verified' }],
  verified: [{ label: 'Close', value: 'closed' }],
  closed: [],
  false_positive: [],
  risk_accepted: [],
};

export default function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: findingId } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [commentText, setCommentText] = useState('');
  const [transitionReason, setTransitionReason] = useState('');

  const { data: finding, isLoading } = useFinding(findingId);
  const transitionFinding = useTransitionFinding();
  const { data: comments } = useFindingComments(findingId);
  const { data: history } = useFindingHistory(findingId);
  const addComment = useAddComment();

  const handleTransition = async (toStatus: string) => {
    await transitionFinding.mutateAsync({
      id: findingId,
      toStatus,
      reason: transitionReason || undefined,
    });
    setTransitionReason('');
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({
      findingId,
      body: commentText,
    });
    setCommentText('');
  };

  if (isLoading || !finding) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  const nextStatuses = NEXT_STATUS_OPTIONS[finding.status] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/findings"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Findings
          </Link>
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={cn(
                'h-5 w-5',
                finding.severity === 'critical'
                  ? 'text-red-500'
                  : finding.severity === 'high'
                    ? 'text-orange-500'
                    : finding.severity === 'medium'
                      ? 'text-amber-500'
                      : 'text-blue-500',
              )}
            />
            <h1 className="text-xl font-semibold text-surface-900">{finding.title}</h1>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={statusBadgeVariant[finding.status] ?? 'draft'} size="sm">
              {finding.status.replace(/_/g, ' ')}
            </Badge>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                severityColors[finding.severity],
              )}
            >
              {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
            </span>
            {finding.iecRequirement && (
              <span className="text-xs font-mono text-surface-500">{finding.iecRequirement}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStatuses.length > 0 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Reason for transition..."
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                className="h-8 w-56 text-xs"
              />
              {nextStatuses.map((option) => (
                <Button
                  key={option.value}
                  variant="primary"
                  size="sm"
                  onClick={() => handleTransition(option.value)}
                  loading={transitionFinding.isPending}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Finding sections">
          {[
            { key: 'details' as TabKey, label: 'Details', icon: AlertTriangle },
            { key: 'comments' as TabKey, label: 'Comments', icon: MessageSquare },
            { key: 'history' as TabKey, label: 'History', icon: History },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
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
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Finding Details</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Severity</dt>
                <dd
                  className={cn(
                    'text-sm font-medium px-2 py-0.5 rounded',
                    severityColors[finding.severity],
                  )}
                >
                  {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Status</dt>
                <dd className="text-sm text-surface-900">{finding.status.replace(/_/g, ' ')}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Category</dt>
                <dd className="text-sm text-surface-900">{finding.category || '—'}</dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Discovered</dt>
                <dd className="text-sm text-surface-900">
                  {new Date(finding.discoveredAt).toLocaleDateString()}
                </dd>
              </div>
              <Separator />
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Source</dt>
                <dd className="text-sm text-surface-900 capitalize">{finding.source}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Description</h3>
            <p className="mt-4 text-sm text-surface-600">
              {finding.description || 'No description provided.'}
            </p>
            {finding.resolutionNote && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium text-surface-700">Resolution Note</h3>
                <p className="mt-2 text-sm text-surface-600">{finding.resolutionNote}</p>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <div className="flex items-start gap-3">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                loading={addComment.isPending}
                icon={Send}
              >
                Post
              </Button>
            </div>
          </div>
          {comments?.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-surface-200 bg-surface-0 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-surface-200 flex items-center justify-center text-2xs font-medium text-surface-600">
                    {comment.authorId.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs text-surface-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {comment.isInternal && (
                  <span className="text-2xs text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">
                    Internal
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-surface-700">{comment.body}</p>
            </div>
          ))}
          {(!comments || comments.length === 0) && (
            <p className="py-8 text-center text-sm text-surface-500">No comments yet.</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {history?.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100">
                <History className="h-4 w-4 text-surface-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-surface-700">
                  Status changed from{' '}
                  <span className="font-medium">{entry.fromStatus?.replace(/_/g, ' ') ?? '—'}</span>{' '}
                  to <span className="font-medium">{entry.toStatus.replace(/_/g, ' ')}</span>
                </p>
                {entry.reason && <p className="mt-1 text-xs text-surface-500">{entry.reason}</p>}
              </div>
              <span className="text-xs text-surface-400">
                {new Date(entry.changedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {(!history || history.length === 0) && (
            <p className="py-8 text-center text-sm text-surface-500">
              No status history available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
