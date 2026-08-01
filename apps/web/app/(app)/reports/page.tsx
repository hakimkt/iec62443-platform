'use client';

import { cn } from '@iec62443/ui';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useReports, useDeleteReport } from '@/hooks/useReports';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-surface-100 text-surface-600', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  assessment_summary: 'Assessment Summary',
  risk_register: 'Risk Register',
  csms_gap: 'CSMS Gap Analysis',
  zone_topology: 'Zone Topology',
  purdue_compliance: 'Purdue Compliance',
  remediation_status: 'Remediation Status',
  executive: 'Executive Summary',
  audit_trail: 'Audit Trail',
  certification_evidence: 'Certification Evidence',
  custom: 'Custom Report',
};

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: reportsData, isLoading } = useReports({
    page,
    perPage: 25,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const deleteReport = useDeleteReport();

  const reports = reportsData?.data ?? [];
  const pagination = reportsData?.pagination;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteReport.mutateAsync(id);
    }
  };

  const handleDownload = async (id: string) => {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
    const token = localStorage.getItem('auth-storage');
    let authToken = '';
    try {
      const parsed = JSON.parse(token ?? '{}');
      authToken = parsed?.state?.accessToken ?? '';
    } catch { /* ignore */ }

    const response = await fetch(`${apiUrl}/api/v1/reports/${id}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!response.ok) return;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">
            Reports
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Generate and download compliance reports
          </p>
        </div>
        <Link
          href="/reports/new"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-surface-200 bg-surface-0 py-2 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const statusConfig = STATUS_CONFIG[report.status] ?? STATUS_CONFIG['pending']!;
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={report.id}
                className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-50">
                  <FileText className="h-5 w-5 text-surface-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">
                    {report.title}
                  </p>
                  <p className="text-xs text-surface-500">
                    {TYPE_LABELS[report.type] ?? report.type} · {formatDate(report.createdAt)}
                  </p>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.color)}>
                  <StatusIcon className={cn('h-3 w-3', report.status === 'processing' && 'animate-spin')} />
                  {statusConfig.label}
                </span>
                <div className="flex items-center gap-2">
                  {report.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(report.id)}
                      className="rounded-md p-2 text-surface-400 hover:bg-surface-50 hover:text-surface-600"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="rounded-md p-2 text-surface-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-surface-500">
                Showing {(pagination.page - 1) * pagination.perPage + 1}–
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
                {pagination.total} reports
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
      <FileText className="h-12 w-12 text-surface-300" />
      <h3 className="mt-4 text-lg font-medium text-surface-700">No reports yet</h3>
      <p className="mt-1 text-sm text-surface-500">
        Generate your first report to get started.
      </p>
      <Link
        href="/reports/new"
        className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Generate Report
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
