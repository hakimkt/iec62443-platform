'use client';

import type { Finding, FindingSeverity } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Badge, Button } from '@iec62443/ui/primitives';
import { Filter, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useFindings } from '@/hooks/useFindings';

const severityColors: Record<FindingSeverity, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
  informational: 'bg-surface-100 text-surface-600',
};

const severityDotColors: Record<FindingSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  informational: 'bg-surface-400',
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

export default function FindingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useFindings({
    page,
    perPage: 25,
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    search: search || undefined,
  });

  const findings = result?.data ?? [];
  const pagination = result?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Findings</h1>
          <p className="mt-1 text-sm text-surface-500">Track and manage security findings</p>
        </div>
        <Link href="/findings/new">
          <Button variant="primary" icon={Plus}>
            New Finding
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search findings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-md border border-surface-200 bg-surface-0 pl-9 pr-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Severity:</span>
          {['', 'critical', 'high', 'medium', 'low', 'informational'].map((sev) => (
            <button
              key={sev}
              onClick={() => {
                setSeverityFilter(sev);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                severityFilter === sev
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {sev === '' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-500">Status:</span>
        {['', 'open', 'acknowledged', 'in_progress', 'verification', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              statusFilter === status
                ? 'bg-brand-50 text-brand-700'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
            )}
          >
            {status === '' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
        </div>
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-surface-200 bg-surface-0 py-12 text-center">
          <Filter className="h-12 w-12 text-surface-300" />
          <h3 className="mt-4 text-lg font-medium text-surface-700">No findings found</h3>
          <p className="mt-1 text-sm text-surface-500">
            {search || statusFilter || severityFilter
              ? 'Try adjusting your search or filters.'
              : 'Create your first finding to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-surface-200 bg-surface-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    IEC Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Discovered
                  </th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding) => (
                  <FindingRow key={finding.id} finding={finding} />
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

function FindingRow({ finding }: { finding: Finding }) {
  return (
    <Link
      href={`/findings/${finding.id}`}
      className="flex items-center border-b border-surface-100 transition-colors last:border-0 hover:bg-surface-50"
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', severityDotColors[finding.severity])} />
          <span className={cn('text-xs font-medium', severityColors[finding.severity])}>
            {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
          </span>
        </div>
      </div>
      <div className="flex-1 px-4 py-3">
        <p className="text-sm font-medium text-surface-900">{finding.title}</p>
        {finding.description && (
          <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{finding.description}</p>
        )}
      </div>
      <div className="px-4 py-3">
        <Badge variant={statusBadgeVariant[finding.status] ?? 'draft'} size="sm">
          {finding.status.replace(/_/g, ' ')}
        </Badge>
      </div>
      <div className="px-4 py-3">
        <span className="text-sm text-surface-600">{finding.category || '—'}</span>
      </div>
      <div className="px-4 py-3">
        <span className="text-sm font-mono text-surface-600">{finding.iecRequirement || '—'}</span>
      </div>
      <div className="px-4 py-3">
        <span className="text-sm text-surface-500">
          {new Date(finding.discoveredAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
