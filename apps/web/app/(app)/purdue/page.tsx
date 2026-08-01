'use client';

import { useState } from 'react';
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
import { Button } from '@iec62443/ui/primitives';
import { Plus, Network } from 'lucide-react';
import { usePurdueModels } from '@/hooks/usePurdue';
import type { PurdueModel } from '@iec62443/shared-types';

export default function PurdueModelsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = usePurdueModels({
    page,
    perPage: 25,
    search: search || undefined,
  });

  const models = result?.data ?? [];
  const pagination = result?.pagination;

  const activeFilters = search
    ? [
        {
          key: 'search',
          label: 'Search',
          value: search,
          onRemove: () => {
            setSearch('');
            setPage(1);
          },
        },
      ]
    : [];

  const clearAllFilters = () => {
    setSearch('');
    setPage(1);
  };

  const columns: Column<PurdueModel>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (_value: unknown, row: PurdueModel) => (
        <div>
          <p className="text-sm font-medium text-surface-900">{row.name}</p>
          {row.description && (
            <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (_value: unknown, row: PurdueModel) => (
        <span className="text-sm text-surface-600">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'isDefault',
      header: 'Default',
      render: (_value: unknown, row: PurdueModel) =>
        row.isDefault ? (
          <StatusBadge status="completed" size="sm" />
        ) : (
          <span className="text-sm text-surface-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (_value: unknown, row: PurdueModel) => (
        <span className="text-sm text-surface-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purdue Models"
        description="Define and visualize network segmentation models"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/purdue/new">
              <Button variant="primary" icon={Plus}>
                New Model
              </Button>
            </Link>
          </div>
        }
      />

      {/* Metrics row */}
      {pagination && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Total Models"
            value={pagination.total}
            color="brand"
          />
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
            placeholder="Search Purdue models..."
          />
        }
        filters={activeFilters}
        onClearAll={clearAllFilters}
      />

      {/* Models table */}
      <DataTable<PurdueModel>
        columns={columns}
        data={models}
        keyExtractor={(row: PurdueModel) => row.id}
        onRowClick={(row: PurdueModel) => router.push(`/purdue/${row.id}`)}
        loading={isLoading}
        emptyMessage="No Purdue models found"
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

      {/* Empty state when no filters are active and no models */}
      {!isLoading && models.length === 0 && !search && (
        <EmptyState
          icon={Network}
          title="No Purdue models"
          description="Create your first Purdue Model to define network segmentation."
          action={
            <Link href="/purdue/new">
              <Button variant="primary" icon={Plus}>
                New Model
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
