'use client';

import type { RemediationPlanStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import {
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  DollarSign,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useDeletePlan, useRemediationPlans } from '@/hooks/useRemediation';

const STATUS_CONFIG: Record<RemediationPlanStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-surface-100 text-surface-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function RemediationPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: plansData, isLoading } = useRemediationPlans({
    page,
    perPage: 25,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const deletePlan = useDeletePlan();

  const plans = plansData?.data ?? [];
  const pagination = plansData?.pagination;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this remediation plan?')) {
      await deletePlan.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Remediation</h1>
          <p className="mt-1 text-sm text-surface-500">
            Track and manage remediation plans and actions
          </p>
        </div>
        <Link
          href="/remediation/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-surface-200 bg-surface-0 py-2 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Plans List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const statusConfig = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG['planned'];

            return (
              <Link
                key={plan.id}
                href={`/remediation/${plan.id}`}
                className="block rounded-lg border border-surface-200 bg-surface-0 p-4 transition-colors hover:bg-surface-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-50">
                      <Wrench className="h-5 w-5 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{plan.name}</p>
                      {plan.description && (
                        <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusConfig.color,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(plan.id);
                      }}
                      className="rounded-md p-2 text-surface-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-6 text-xs text-surface-500">
                  {plan.ownerId && (
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3" />
                      {plan.ownerId}
                    </span>
                  )}
                  {plan.budgetEstimate != null && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {plan.budgetEstimate.toLocaleString()}
                    </span>
                  )}
                  {plan.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(plan.startDate)}
                      {plan.targetDate && ` – ${formatDate(plan.targetDate)}`}
                    </span>
                  )}
                  {plan.findingIds.length > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {plan.findingIds.length} findings
                    </span>
                  )}
                  {plan.riskIds.length > 0 && (
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3 w-3" />
                      {plan.riskIds.length} risks
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-surface-500">
                Showing {(pagination.page - 1) * pagination.perPage + 1}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total} plans
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-md border border-surface-200 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="rounded-md border border-surface-200 px-3 py-1.5 text-sm text-surface-700 hover:bg-surface-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Wrench className="h-12 w-12 text-surface-300" />
      <h3 className="mt-4 text-lg font-medium text-surface-700">No remediation plans yet</h3>
      <p className="mt-1 text-sm text-surface-500">
        Create your first remediation plan to start tracking actions.
      </p>
      <Link
        href="/remediation/new"
        className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Plan
      </Link>
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
