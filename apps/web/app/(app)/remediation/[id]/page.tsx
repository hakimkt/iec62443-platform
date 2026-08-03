'use client';

import type { RemediationActionStatus, RemediationPlanStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Button, Separator } from '@iec62443/ui/primitives';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  History,
  Loader2,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import {
  useDeleteAction,
  useRemediationActions,
  useRemediationPlan,
  useVerifications,
} from '@/hooks/useRemediation';

const PLAN_STATUS_CONFIG: Record<RemediationPlanStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-surface-100 text-surface-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const ACTION_STATUS_CONFIG: Record<RemediationActionStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-surface-100 text-surface-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
};

export default function RemediationPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: planId } = use(params);

  const { data: plan, isLoading } = useRemediationPlan(planId || null);
  const { data: actionsData, isLoading: actionsLoading } = useRemediationActions({
    planId: planId || undefined,
  });
  const deleteAction = useDeleteAction();

  const actions = actionsData?.data ?? [];

  const handleDeleteAction = async (actionId: string) => {
    if (confirm('Are you sure you want to delete this action?')) {
      await deleteAction.mutateAsync(actionId);
    }
  };

  if (isLoading || !plan) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const planStatusConfig = PLAN_STATUS_CONFIG[plan.status] ?? PLAN_STATUS_CONFIG['planned'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/remediation"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Remediation
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-surface-900">{plan.name}</h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                planStatusConfig.color,
              )}
            >
              {planStatusConfig.label}
            </span>
          </div>
        </div>
        <Link href={`/remediation/${planId}/edit`}>
          <Button variant="secondary" size="sm">
            Edit Plan
          </Button>
        </Link>
      </div>

      {/* Plan Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <h3 className="text-sm font-medium text-surface-700">Plan Details</h3>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Status</dt>
              <dd className={cn('text-sm font-medium px-2 py-0.5 rounded', planStatusConfig.color)}>
                {planStatusConfig.label}
              </dd>
            </div>
            <Separator />
            <div className="flex justify-between">
              <dt className="text-sm text-surface-500">Owner</dt>
              <dd className="text-sm text-surface-900">{plan.ownerId}</dd>
            </div>
            <Separator />
            {plan.startDate && (
              <>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Start Date</dt>
                  <dd className="text-sm text-surface-900">{formatDate(plan.startDate)}</dd>
                </div>
                <Separator />
              </>
            )}
            {plan.targetDate && (
              <>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Target Date</dt>
                  <dd className="text-sm text-surface-900">{formatDate(plan.targetDate)}</dd>
                </div>
                <Separator />
              </>
            )}
            {plan.budgetEstimate != null && (
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Budget Estimate</dt>
                <dd className="text-sm text-surface-900">
                  ${plan.budgetEstimate.toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <h3 className="text-sm font-medium text-surface-700">Description</h3>
          <p className="mt-4 text-sm text-surface-600">
            {plan.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Action Items */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-surface-700">Action Items</h3>
          <Link href={`/remediation/${planId}/actions/new`}>
            <Button variant="primary" size="sm" icon={Plus}>
              Add Action
            </Button>
          </Link>
        </div>

        {actionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Wrench className="h-8 w-8 text-surface-300" />
            <p className="mt-2 text-sm text-surface-500">No action items yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <ActionItem key={action.id} action={action} onDelete={handleDeleteAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({
  action,
  onDelete,
}: {
  action: {
    id: string;
    title: string;
    description: string;
    status: RemediationActionStatus;
    assigneeId: string;
    dueDate: string | null;
    milestone: boolean;
  };
  onDelete: (id: string) => void;
}) {
  const { data: verifications } = useVerifications(action.id);

  const actionStatusConfig = ACTION_STATUS_CONFIG[action.status] ?? ACTION_STATUS_CONFIG['planned'];

  return (
    <div className="rounded-lg border border-surface-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {action.milestone && <Flag className="h-4 w-4 text-amber-500" />}
          <div>
            <p className="text-sm font-medium text-surface-900">{action.title}</p>
            {action.description && (
              <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{action.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              actionStatusConfig.color,
            )}
          >
            {actionStatusConfig.label}
          </span>
          <button
            onClick={() => onDelete(action.id)}
            className="rounded-md p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600"
            title="Delete action"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <History className="h-3 w-3" />
          {action.assigneeId}
        </span>
        {action.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {formatDate(action.dueDate)}
          </span>
        )}
      </div>

      {/* Verification History */}
      {verifications && verifications.length > 0 && (
        <div className="mt-3 border-t border-surface-100 pt-3">
          <p className="text-xs font-medium text-surface-600 mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verification History
          </p>
          <div className="space-y-1.5">
            {verifications.map((v) => (
              <div key={v.id} className="flex items-center gap-2 text-xs text-surface-500">
                <CheckCircle2
                  className={cn(
                    'h-3 w-3',
                    v.result === 'passed'
                      ? 'text-green-500'
                      : v.result === 'failed'
                        ? 'text-red-500'
                        : 'text-amber-500',
                  )}
                />
                <span className="capitalize">{v.result}</span>
                <span>· {v.verifiedBy}</span>
                <span>· {formatDate(v.verificationDate)}</span>
                {v.notes && <span>· {v.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
