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
  SecurityLevelBadge,
} from '@iec62443/ui/components';
import type { Column } from '@iec62443/ui/components';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import { Plus, Network, Filter } from 'lucide-react';
import { useZones, useConduits } from '@/hooks/useZones';
import type { Zone, ZoneType } from '@iec62443/shared-types';

const zoneTypeLabels: Partial<Record<ZoneType, string>> = {
  process_control: 'Process Control',
  safety_instrumented: 'Safety Instrumented',
  manufacturing_ops: 'Manufacturing Ops',
  enterprise_it: 'Enterprise IT',
  idmz: 'IDMZ',
  remote_access: 'Remote Access',
  wireless: 'Wireless',
  custom: 'Custom',
};

const purdueLevelLabels: Record<number, string> = {
  0: 'L0 — Process',
  1: 'L1 — Basic Control',
  2: 'L2 — Supervisory',
  3: 'L3 — Operations',
  4: 'L4 — Enterprise',
  5: 'L5 — External',
};

const zoneTypeFilters = ['', 'process_control', 'safety_instrumented', 'manufacturing_ops', 'enterprise_it', 'idmz', 'remote_access', 'wireless'] as const;
const securityLevelFilters = ['', '0', '1', '2', '3', '4'] as const;

export default function ZonesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>('');
  const [securityLevelFilter, setSecurityLevelFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useZones({
    page,
    perPage: 25,
    zoneType: zoneTypeFilter || undefined,
    securityLevel: securityLevelFilter ? parseInt(securityLevelFilter, 10) : undefined,
    search: search || undefined,
  });

  const { data: conduitResult } = useConduits({ perPage: 1 });

  const zones = result?.data ?? [];
  const pagination = result?.pagination;
  const totalConduits = conduitResult?.pagination?.total ?? 0;

  // Count zones by type
  const zonesByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const z of zones) {
      counts[z.zoneType] = (counts[z.zoneType] ?? 0) + 1;
    }
    return counts;
  }, [zones]);

  const activeFilters = useMemo(
    () =>
      [
        zoneTypeFilter
          ? { key: 'zoneType', label: 'Zone Type', value: zoneTypeLabels[zoneTypeFilter as ZoneType] ?? zoneTypeFilter, onRemove: () => { setZoneTypeFilter(''); setPage(1); } }
          : null,
        securityLevelFilter
          ? { key: 'securityLevel', label: 'SL', value: `SL ${securityLevelFilter}`, onRemove: () => { setSecurityLevelFilter(''); setPage(1); } }
          : null,
      ].filter(Boolean) as { key: string; label: string; value: string; onRemove: () => void }[],
    [zoneTypeFilter, securityLevelFilter],
  );

  const clearAllFilters = () => {
    setZoneTypeFilter('');
    setSecurityLevelFilter('');
    setSearch('');
    setPage(1);
  };

  const columns: Column<Zone>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_value: unknown, row: Zone) => (
        <div>
          <p className="text-sm font-medium text-surface-900">{row.name}</p>
          {row.description && (
            <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'zoneType',
      header: 'Zone Type',
      sortable: true,
      render: (_value: unknown, row: Zone) => (
        <span className="text-sm text-surface-600">
          {zoneTypeLabels[row.zoneType as ZoneType] ?? row.zoneType}
        </span>
      ),
    },
    {
      key: 'securityLevel',
      header: 'Security Level',
      sortable: true,
      render: (_value: unknown, row: Zone) => (
        <SecurityLevelBadge level={row.securityLevel} size="sm" />
      ),
    },
    {
      key: 'purdueLevel',
      header: 'Purdue Level',
      render: (_value: unknown, row: Zone) => (
        <span className="text-sm text-surface-600">
          {row.purdueLevel !== null ? purdueLevelLabels[row.purdueLevel] ?? `L${row.purdueLevel}` : '—'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (_value: unknown, row: Zone) => (
        <span className="text-sm text-surface-600 line-clamp-2">{row.description || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zones & Conduits"
        description="Manage security zones and conduits per IEC 62443-3-3"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/zones/designer">
              <Button variant="secondary" icon={Network}>
                Topology Designer
              </Button>
            </Link>
            <Link href="/zones/new">
              <Button variant="primary" icon={Plus}>
                New Zone
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      {result && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <MetricCard label="Total Zones" value={pagination?.total ?? zones.length} color="brand" />
          <MetricCard label="Total Conduits" value={totalConduits} color="blue" />
          {Object.entries(zonesByType).map(([key, count]) => (
            <MetricCard
              key={key}
              label={zoneTypeLabels[key as ZoneType] ?? key}
              value={count}
              color="brand"
            />
          ))}
        </div>
      )}

      {/* Search + Filter bar */}
      <FilterBar
        searchSlot={
          <SearchInput
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search zones..."
          />
        }
        filters={activeFilters}
        onClearAll={clearAllFilters}
      />

      {/* Filter toggle buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Zone Type:</span>
          {zoneTypeFilters.map((t) => (
            <button
              key={t}
              onClick={() => { setZoneTypeFilter(t); setPage(1); }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                zoneTypeFilter === t
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {t === '' ? 'All' : zoneTypeLabels[t as ZoneType] ?? t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500">Security Level:</span>
          {securityLevelFilters.map((s) => (
            <button
              key={s}
              onClick={() => { setSecurityLevelFilter(s); setPage(1); }}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                securityLevelFilter === s
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
              )}
            >
              {s === '' ? 'All' : `SL ${s}`}
            </button>
          ))}
        </div>
      </div>

      {/* Zone table */}
      <DataTable<Zone>
        columns={columns}
        data={zones}
        keyExtractor={(row: Zone) => row.id}
        onRowClick={(row: Zone) => router.push(`/zones/${row.id}`)}
        loading={isLoading}
        emptyMessage="No zones found"
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

      {/* Empty state when no filters are active and no zones */}
      {!isLoading && zones.length === 0 && !search && !zoneTypeFilter && !securityLevelFilter && (
        <EmptyState
          icon={Filter}
          title="No zones found"
          description="Create your first security zone to get started."
          action={
            <Link href="/zones/new">
              <Button variant="primary" icon={Plus}>New Zone</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
