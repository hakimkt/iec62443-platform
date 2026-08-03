'use client';

import type { EvidenceItem, EvidenceType } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SearchInput,
  type FilterChip,
} from '@iec62443/ui/components';
import { Button } from '@iec62443/ui/primitives';
import { Filter, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useEvidence } from '@/hooks/useEvidence';

const typeLabels: Record<EvidenceType, string> = {
  document: 'Document',
  screenshot: 'Screenshot',
  config: 'Configuration',
  log: 'Log File',
  scan_result: 'Scan Result',
  network_capture: 'Network Capture',
  certificate: 'Certificate',
  interview: 'Interview',
  other: 'Other',
};

const typeColors: Record<EvidenceType, string> = {
  document: 'bg-blue-100 text-blue-700',
  screenshot: 'bg-purple-100 text-purple-700',
  config: 'bg-amber-100 text-amber-700',
  log: 'bg-green-100 text-green-700',
  scan_result: 'bg-red-100 text-red-700',
  network_capture: 'bg-cyan-100 text-cyan-700',
  certificate: 'bg-emerald-100 text-emerald-700',
  interview: 'bg-pink-100 text-pink-700',
  other: 'bg-surface-100 text-surface-600',
};

const typeFilterOptions: (string | EvidenceType)[] = [
  '',
  'document',
  'screenshot',
  'config',
  'log',
  'scan_result',
  'certificate',
  'other',
];

export default function EvidencePage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useEvidence({
    page,
    perPage: 25,
    evidenceType: typeFilter || undefined,
    search: search || undefined,
  });

  const items = result?.data ?? [];
  const pagination = result?.pagination;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleTypeFilter = useCallback((t: string) => {
    setTypeFilter(t);
    setPage(1);
  }, []);

  const activeFilters: FilterChip[] = [];
  if (typeFilter) {
    activeFilters.push({
      key: 'type',
      label: 'Type',
      value: typeLabels[typeFilter as EvidenceType] ?? typeFilter,
      onRemove: () => handleTypeFilter(''),
    });
  }
  if (search) {
    activeFilters.push({
      key: 'search',
      label: 'Search',
      value: search,
      onRemove: () => {
        setSearch('');
        setPage(1);
      },
    });
  }

  const clearAllFilters = useCallback(() => {
    setTypeFilter('');
    setSearch('');
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Repository"
        description="Upload, manage, and verify evidence artifacts"
        actions={
          <Link href="/evidence/upload">
            <Button variant="primary" icon={Upload}>
              Upload Evidence
            </Button>
          </Link>
        }
      />

      {/* Search + Filters */}
      <FilterBar
        searchSlot={
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search evidence..."
          />
        }
        filters={activeFilters}
        onClearAll={clearAllFilters}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">Type:</span>
            {typeFilterOptions.map((t) => (
              <button
                key={t}
                onClick={() => handleTypeFilter(t)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200',
                )}
              >
                {t === '' ? 'All' : (typeLabels[t as EvidenceType] ?? t)}
              </button>
            ))}
          </div>
        }
      />

      {/* Evidence grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-surface-200 bg-surface-0">
          <EmptyState
            icon={Filter}
            title="No evidence found"
            description={
              search || typeFilter
                ? 'Try adjusting your search or filters.'
                : 'Upload your first evidence to get started.'
            }
            action={
              !search && !typeFilter ? (
                <Link href="/evidence/upload">
                  <Button variant="primary" icon={Upload}>
                    Upload Evidence
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.perPage}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/evidence/${item.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/evidence/${item.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col rounded-lg border border-surface-200 bg-surface-0 p-4 transition-colors hover:border-surface-300 hover:bg-surface-50"
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            typeColors[item.evidenceType] ?? 'bg-surface-100 text-surface-600',
          )}
        >
          {typeLabels[item.evidenceType] ?? item.evidenceType}
        </span>
        {item.sha256Hash !== null && (
          <span className="text-2xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            Verified
          </span>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium text-surface-900 line-clamp-1">{item.title}</h3>
      {item.description && (
        <p className="mt-1 text-xs text-surface-500 line-clamp-2">{item.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {item.fileName && (
            <span className="text-2xs text-surface-400 truncate max-w-32">{item.fileName}</span>
          )}
        </div>
        <span className="text-2xs text-surface-400">
          {new Date(item.collectedAt).toLocaleDateString()}
        </span>
      </div>
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-2xs bg-surface-100 text-surface-500 px-1.5 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-2xs text-surface-400">+{item.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
