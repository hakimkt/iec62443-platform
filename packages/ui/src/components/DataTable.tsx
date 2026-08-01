import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Checkbox } from '../primitives/Checkbox';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';

/* ───────────────────────────── Column type ────────────────────── */

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

/* ───────────────────────────── Props ──────────────────────────── */

export interface DataTableProps<T>
  extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortable?: boolean;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
  };
}

/* ───────────────────────────── Helpers ────────────────────────── */

function getCellValue(row: unknown, key: string): unknown {
  if (row == null || typeof row !== 'object') return undefined;
  return (row as Record<string, unknown>)[key];
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-surface-400" />;
  return direction === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-brand-600" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-brand-600" />
  );
}

/* ───────────────────────────── Component ──────────────────────── */

function DataTableInner<T>(
  props: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    columns,
    data,
    keyExtractor,
    sortable = false,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    onRowClick,
    onSort,
    sortKey,
    sortDirection,
    loading = false,
    emptyMessage = 'No data available',
    pagination,
    ...rest
  } = props;

  const allKeys = React.useMemo(
    () => new Set(data.map(keyExtractor)),
    [data, keyExtractor],
  );

  const allSelected =
    allKeys.size > 0 && [...allKeys].every((k) => selectedKeys?.has(k));
  const someSelected =
    !allSelected && [...allKeys].some((k) => selectedKeys?.has(k));

  const handleToggleAll = React.useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  }, [allSelected, allKeys, onSelectionChange]);

  const handleToggleRow = React.useCallback(
    (key: string) => {
      if (!onSelectionChange || !selectedKeys) return;
      const next = new Set(selectedKeys);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onSelectionChange(next);
    },
    [selectedKeys, onSelectionChange],
  );

  const handleSort = React.useCallback(
    (key: string) => {
      if (!onSort) return;
      const nextDirection =
        sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, nextDirection);
    },
    [onSort, sortKey, sortDirection],
  );

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.perPage))
    : 0;

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-surface-200 bg-surface-0 overflow-hidden',
        className,
      )}
      {...rest}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Head */}
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200 text-xs font-semibold uppercase tracking-wider text-surface-500">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={handleToggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left',
                    col.sortable && sortable && 'cursor-pointer select-none',
                    col.className,
                  )}
                  onClick={
                    col.sortable && sortable
                      ? () => handleSort(col.key)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && sortable && (
                      <SortIcon
                        active={sortKey === col.key}
                        direction={sortDirection ?? 'asc'}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12"
                >
                  <div className="flex items-center justify-center text-surface-400">
                    <span className="text-sm">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-0"
                >
                  <EmptyState
                    title={emptyMessage}
                    size="sm"
                    className="py-12"
                  />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = keyExtractor(row);
                const isSelected = selectedKeys?.has(key) ?? false;

                return (
                  <tr
                    key={key}
                    className={cn(
                      'h-12 border-b border-surface-100 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected
                        ? 'bg-brand-50 border-l-2 border-brand-500'
                        : 'hover:bg-surface-50',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td
                        className="w-12 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRow(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const value = getCellValue(row, col.key);
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3 text-sm text-surface-700',
                            col.className,
                          )}
                        >
                          {col.render
                            ? col.render(value, row)
                            : (value as React.ReactNode) ?? null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="border-t border-surface-200 px-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            totalItems={pagination.total}
            pageSize={pagination.perPage}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPerPageChange}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}

const DataTable = React.forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement | null;

(DataTable as React.FC<DataTableProps<unknown>>).displayName = 'DataTable';

export { DataTable };
