'use client';

import type { CSMSFrameworkStatus } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { Layers, Loader2, Plus, Search, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useCSMSFrameworks } from '@/hooks/useCSMS';

const STATUS_CONFIG: Record<CSMSFrameworkStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-surface-100 text-surface-600' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-amber-100 text-amber-700' },
};

export default function CSMSPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: frameworksData, isLoading } = useCSMSFrameworks({
    page,
    perPage: 25,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const frameworks = frameworksData?.data ?? [];
  const pagination = frameworksData?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">CSMS Management</h1>
          <p className="mt-1 text-sm text-surface-500">
            Cybersecurity Management System framework and compliance
          </p>
        </div>
        <Link
          href="/csms/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Framework
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search frameworks..."
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
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Frameworks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : frameworks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {frameworks.map((framework) => {
            const statusConfig = STATUS_CONFIG[framework.status] ?? STATUS_CONFIG['draft'];

            return (
              <Link
                key={framework.id}
                href={`/csms/${framework.id}`}
                className="block rounded-lg border border-surface-200 bg-surface-0 p-4 transition-colors hover:bg-surface-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-50">
                      <Shield className="h-5 w-5 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{framework.name}</p>
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
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-6 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />v{framework.version}
                  </span>
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
                {pagination.total} frameworks
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
      <Shield className="h-12 w-12 text-surface-300" />
      <h3 className="mt-4 text-lg font-medium text-surface-700">No CSMS frameworks yet</h3>
      <p className="mt-1 text-sm text-surface-500">
        Create your first CSMS framework to start managing compliance.
      </p>
      <Link
        href="/csms/new"
        className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Framework
      </Link>
    </div>
  );
}
