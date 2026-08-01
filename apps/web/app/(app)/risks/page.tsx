'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  MetricCard,
  SearchInput,
  FilterBar,
  DataTable,
  EmptyState,
  StatusBadge,
} from '@iec62443/ui/components';
import type { Column } from '@iec62443/ui/components';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import { Plus, Filter } from 'lucide-react';
import { useRisks, useRiskStats } from '@/hooks/useRisks';
import type { RiskEntry, RiskCategory, RiskLevel, RiskEntryStatus } from '@iec62443/shared-types';

const categoryLabels: Record<RiskCategory, string> = {
  safety: 'Safety',
  operational: 'Operational',
  environmental: 'Environmental',
  financial: 'Financial',
  reputational: 'Reputational',
  regulatory: 'Regulatory',
};

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const riskLevelMetricColors: Record<RiskLevel, 'green' | 'amber' | 'red' | 'brand'> = {
  low: 'green',
  medium: 'amber',
  high: 'amber',
  critical: 'red',
};

const statusToBadge: Record<RiskEntryStatus, 'completed' | 'in_progress' | 'archived' | 'draft'> = {
  identified: 'draft',
  analyzed: 'in_progress',
  treated: 'in_progress',
  monitored: 'completed',
  closed: 'archived',
  accepted: 'completed',
};

const categoryFilters = ['', 'safety', 'operational', 'environmental', 'financial', 'reputational', 'regulatory'] as const;
const levelFilters = ['', 'low', 'medium', 'high', 'critical'] as const;
const statusFilters = ['', 'identified', 'analyzed', 'treated', 'monitored', 'closed', 'accepted'] as const;

export default function RisksPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useRisks({
    page,
    perPage: 25,
    category: categoryFilter || undefined,
    riskLevel: levelFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const { data: stats } = useRiskStats();

  const risks = result?.data ?? [];
  const pagination = result?.pagination;

  const activeFilters = useMemo(
    () =>
      [
        categoryFilter
          ? { key: 'category', label: 'Category', value: categoryLabels[categoryFilter as RiskCategory] ?? categoryFilter, onRemove: () => { setCategoryFilter(''); setPage(1); } }
          : null,
        levelFilter
          ? { key: 'level', label: 'Level', value: levelFilter, onRemove: () => { setLevelFilter(''); setPage(1); } }
          : null,
        statusFilter
          ? { key: 'status', label: 'Status', value: statusFilter.replace(/_/g, ' '), onRemove: () => { setStatusFilter(''); setPage(1); } }
          : null,
      ].filter(Boolean) as { key: string; label: string; value: string; onRemove: () => void }[],
    [categoryFilter, levelFilter, statusFilter],
  );

  const clearAllFilters = () => {
    setCategoryFilter('');
    setLevelFilter('');
    setStatusFilter('');
    setSearch('');
    setPage(1);
  };

  const columns: Column<RiskEntry>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (_value: unknown, row: RiskEntry) => (
        <div>
          <p className="text-sm font-medium text-surface-900">{row.title}</p>
          {row.description && (
            <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (_value: unknown, row: RiskEntry) => (
        <span className="text-sm text-surface-600">
          {categoryLabels[row.category] ?? row.category}
        </span>
      ),
    },
    {
      key: 'inherentScore',
      header: 'Inherent Score',
      sortable: true,
      render: (_value: unknown, row: RiskEntry) => (
        <span className="text-sm font-mono text-surface-700">
          {row.likelihood}×{row.impact} = {row.inherentScore}
        </span>
      ),
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      sortable: true,
      render: (_value: unknown, row: RiskEntry) => (
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', riskLevelColors[row.riskLevel])}>
          {row.riskLevel}
        </span>
      ),
    },
    {
      key: 'treatment',
      header: 'Treatment',
      render: (_value: unknown, row: RiskEntry) => (
        <span className="text-sm text-surface-600 capitalize">{row.treatment}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_value: unknown, row: RiskEntry) => (
        <StatusBadge status={statusToBadge[row.status] ?? 'draft'} size="sm" />
      ),
    },
    {
      key: 'iecRequirement',
      header: 'IEC Ref',
      render: (_value: unknown, row: RiskEntry) => (
        <span className="text-sm font-mono text-surface-600">{row.iecRequirement || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Register"
        description="Identify, assess, and manage industrial cybersecurity risks"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/risks/matrix">
              <Button variant="secondary">
                Risk Matrix
              </Button>
            </Link>
            <Link href="/risks/new">
              <Button variant="primary" icon={Plus}>
                New Risk
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <MetricCard label="Total" value={stats.total} color="brand" />
          {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((level) => (
            <MetricCard
              key={level}
              label={level.charAt(0).toUpperCase() + level.slice(1)}
              value={stats.byLevel[level] ?? 0}
              color={riskLevelMetricColors[level]}
            />
          ))}
          <MetricCard
            label="Open"
            value={stats.byStatus['open'] ?? 0}
            color="blue"
          />
        </div>
      )}

      {/* Search + Filter bar */}
      <FilterBar
        searchSlot={
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search risks..."
          />
        }
        filters={activeFilters}
        onClearAll={clearAllFilters}
      />

      {/* Filter toggle buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Category:</span>
          {categoryFilters.map((c) => (
            <button
              key={c}
              onClick={() => { setCategoryFilter(c); setPage(1); }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                categoryFilter === c
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {c === '' ? 'All' : categoryLabels[c as RiskCategory] ?? c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Level:</span>
          {levelFilters.map((l) => (
            <button
              key={l}
              onClick={() => { setLevelFilter(l); setPage(1); }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                levelFilter === l
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {l === '' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Status:</span>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Risk table */}
      <DataTable<RiskEntry>
        columns={columns}
        data={risks}
        keyExtractor={(row: RiskEntry) => row.id}
        onRowClick={(row: RiskEntry) => router.push(`/risks/${row.id}`)}
        loading={isLoading}
        emptyMessage="No risks found"
        pagination={
          pagination
            ? {
                page,
                perPage: 25,
                total: pagination.total,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {/* Empty state when no filters are active and no risks */}
      {!isLoading && risks.length === 0 && !search && !categoryFilter && !levelFilter && !statusFilter && (
        <EmptyState
          icon={Filter}
          title="No risks found"
          description="Identify your first risk to get started."
          action={
            <Link href="/risks/new">
              <Button variant="primary" icon={Plus}>Add Risk</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
