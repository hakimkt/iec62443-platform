'use client';

import type { AssessmentEngagement, AssessmentStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Badge, Button } from '@iec62443/ui/primitives';
import { Filter, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAssessments } from '@/hooks/useAssessments';

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

export default function AssessmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useAssessments({
    page,
    perPage: 25,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const assessments = result?.data ?? [];
  const pagination = result?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Assessments</h1>
          <p className="mt-1 text-sm text-surface-500">Manage IEC 62443 assessment engagements</p>
        </div>
        <Link href="/assessments/new">
          <Button variant="primary" icon={Plus}>
            New Assessment
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-md border border-surface-200 bg-surface-0 pl-9 pr-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'draft', 'in_progress', 'review', 'completed', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === status
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {status === ''
                ? 'All'
                : status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
        </div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-surface-200 bg-surface-0 py-12 text-center">
          <Filter className="h-12 w-12 text-surface-300" />
          <h3 className="mt-4 text-lg font-medium text-surface-700">No assessments found</h3>
          <p className="mt-1 text-sm text-surface-500">
            {search || statusFilter
              ? 'Try adjusting your search or filters.'
              : 'Create your first assessment to get started.'}
          </p>
          {!search && !statusFilter && (
            <Link
              href="/assessments/new"
              className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-surface-200 bg-surface-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Target SL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Target Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <AssessmentRow key={assessment.id} assessment={assessment} />
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-surface-500">
              <span>
                Showing {(pagination.page - 1) * pagination.perPage + 1}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1,
                  )
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'h-8 min-w-8 rounded-md px-2 text-sm transition-colors',
                          p === pagination.page
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-surface-600 hover:bg-surface-100',
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AssessmentRow({ assessment }: { assessment: AssessmentEngagement }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/assessments/${assessment.id}`)}
      className="cursor-pointer border-b border-surface-100 transition-colors last:border-0 hover:bg-surface-50"
    >
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-surface-900">{assessment.name}</p>
        <p className="text-xs text-surface-500">{assessment.iecPart}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-surface-600 capitalize">{assessment.type}</span>
      </td>
      <td className="px-4 py-3">
        <Badge variant={statusBadgeVariant[assessment.status]} size="sm">
          {assessment.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-surface-900">SL {assessment.targetSl}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-surface-600">{assessment.targetDate ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-surface-500">
          {new Date(assessment.updatedAt).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
}
