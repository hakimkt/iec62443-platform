'use client';

import type { Asset, AssetType } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import {
  DataTable,
  EmptyState,
  FilterBar,
  MetricCard,
  PageHeader,
  SearchInput,
  StatusBadge,
  type Column,
} from '@iec62443/ui/components';
import { Button } from '@iec62443/ui/primitives';
import { Filter, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAssets, useAssetStats } from '@/hooks/useAssets';

const typeLabels: Partial<Record<AssetType, string>> = {
  plc: 'PLC',
  hmi: 'HMI',
  scada_server: 'SCADA Server',
  engineering_workstation: 'Eng. Workstation',
  switch: 'Switch',
  router: 'Router',
  firewall: 'Firewall',
  historian: 'Historian',
  server: 'Server',
  workstation: 'Workstation',
  sensor: 'Sensor',
  actuator: 'Actuator',
  vfd: 'VFD',
  dcs_controller: 'DCS Controller',
  rtu: 'RTU',
  safety_controller: 'Safety Controller',
  other: 'Other',
};

const criticalityColors: Record<string, string> = {
  safety_critical: 'bg-red-100 text-red-700',
  mission_critical: 'bg-orange-100 text-orange-700',
  business_critical: 'bg-amber-100 text-amber-700',
  operational: 'bg-blue-100 text-blue-700',
  non_critical: 'bg-surface-100 text-surface-600',
};

const purdueLevelLabels: Record<number, string> = {
  0: 'L0 — Process',
  1: 'L1 — Basic Control',
  2: 'L2 — Supervisory',
  3: 'L3 — Operations',
  4: 'L4 — Enterprise',
  5: 'L5 — External',
};

const statusToBadge: Record<string, 'completed' | 'in_progress' | 'archived' | 'draft'> = {
  operational: 'completed',
  maintenance: 'in_progress',
  decommissioned: 'archived',
  standby: 'draft',
};

const criticalityMetricColors: Record<string, 'brand' | 'green' | 'red' | 'amber' | 'blue'> = {
  safety_critical: 'red',
  mission_critical: 'amber',
  business_critical: 'amber',
  operational: 'blue',
  non_critical: 'green',
};

const typeFilters = [
  '',
  'plc',
  'hmi',
  'scada_server',
  'switch',
  'router',
  'firewall',
  'server',
] as const;
const criticalityFilters = [
  '',
  'safety_critical',
  'mission_critical',
  'business_critical',
  'operational',
  'non_critical',
] as const;
const statusFilters = ['', 'operational', 'maintenance', 'decommissioned', 'standby'] as const;

export default function AssetsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useAssets({
    page,
    perPage: 25,
    type: typeFilter || undefined,
    criticality: criticalityFilter || undefined,
    operationalStatus: statusFilter || undefined,
    search: search || undefined,
  });

  const { data: stats } = useAssetStats();

  const assets = result?.data ?? [];
  const pagination = result?.pagination;

  const activeFilters = useMemo(
    () =>
      [
        typeFilter
          ? {
              key: 'type',
              label: 'Type',
              value: typeLabels[typeFilter as AssetType] ?? typeFilter,
              onRemove: () => {
                setTypeFilter('');
                setPage(1);
              },
            }
          : null,
        criticalityFilter
          ? {
              key: 'criticality',
              label: 'Criticality',
              value: criticalityFilter.replace(/_/g, ' '),
              onRemove: () => {
                setCriticalityFilter('');
                setPage(1);
              },
            }
          : null,
        statusFilter
          ? {
              key: 'status',
              label: 'Status',
              value: statusFilter.replace(/_/g, ' '),
              onRemove: () => {
                setStatusFilter('');
                setPage(1);
              },
            }
          : null,
      ].filter(Boolean) as { key: string; label: string; value: string; onRemove: () => void }[],
    [typeFilter, criticalityFilter, statusFilter],
  );

  const clearAllFilters = () => {
    setTypeFilter('');
    setCriticalityFilter('');
    setStatusFilter('');
    setSearch('');
    setPage(1);
  };

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_value: unknown, row: Asset) => (
        <div>
          <p className="text-sm font-medium text-surface-900">{row.name}</p>
          {row.description && (
            <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (_value: unknown, row: Asset) => (
        <span className="text-sm text-surface-600">
          {typeLabels[row.type as AssetType] ?? row.type}
        </span>
      ),
    },
    {
      key: 'criticality',
      header: 'Criticality',
      sortable: true,
      render: (_value: unknown, row: Asset) => (
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            criticalityColors[row.criticality] ?? 'bg-surface-100 text-surface-600',
          )}
        >
          {row.criticality.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'purdueLevel',
      header: 'Purdue Level',
      render: (_value: unknown, row: Asset) => (
        <span className="text-sm text-surface-600">
          {row.purdueLevel !== null
            ? (purdueLevelLabels[row.purdueLevel] ?? `L${row.purdueLevel}`)
            : '—'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (_value: unknown, row: Asset) => (
        <span className="text-sm font-mono text-surface-600">{row.ipAddress ?? '—'}</span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (_value: unknown, row: Asset) => (
        <span className="text-sm text-surface-600">{row.vendor ?? '—'}</span>
      ),
    },
    {
      key: 'operationalStatus',
      header: 'Status',
      render: (_value: unknown, row: Asset) => (
        <StatusBadge status={statusToBadge[row.operationalStatus] ?? 'draft'} size="sm" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Inventory"
        description="Manage and classify industrial assets"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/assets/import">
              <Button variant="secondary" icon={Upload}>
                Import
              </Button>
            </Link>
            <Link href="/assets/new">
              <Button variant="primary" icon={Plus}>
                New Asset
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <MetricCard label="Total" value={stats.total} color="brand" />
          {Object.entries(stats.byCriticality).map(([key, count]) => (
            <MetricCard
              key={key}
              label={key.replace(/_/g, ' ')}
              value={count}
              color={criticalityMetricColors[key] ?? 'brand'}
            />
          ))}
        </div>
      )}

      {/* Search + Filter bar */}
      <FilterBar
        searchSlot={
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search assets..."
          />
        }
        filters={activeFilters}
        onClearAll={clearAllFilters}
      />

      {/* Filter toggle buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Type:</span>
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                typeFilter === t
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {t === '' ? 'All' : (typeLabels[t as AssetType] ?? t)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Criticality:</span>
          {criticalityFilters.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCriticalityFilter(c);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                criticalityFilter === c
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {c === '' ? 'All' : c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Status:</span>
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {s === '' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Asset table */}
      <DataTable<Asset>
        columns={columns}
        data={assets}
        keyExtractor={(row: Asset) => row.id}
        onRowClick={(row: Asset) => router.push(`/assets/${row.id}`)}
        loading={isLoading}
        emptyMessage="No assets found"
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

      {/* Empty state when no filters are active and no assets */}
      {!isLoading &&
        assets.length === 0 &&
        !search &&
        !typeFilter &&
        !criticalityFilter &&
        !statusFilter && (
          <EmptyState
            icon={Filter}
            title="No assets found"
            description="Add your first asset to get started."
            action={
              <Link href="/assets/new">
                <Button variant="primary" icon={Plus}>
                  Add Asset
                </Button>
              </Link>
            }
          />
        )}
    </div>
  );
}
