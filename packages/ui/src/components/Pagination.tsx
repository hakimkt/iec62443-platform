import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../primitives/Button';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  /** Current active page (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items per page */
  pageSize: number;
  /** Callback when the user navigates to a different page */
  onPageChange: (page: number) => void;
  /** Callback when the user changes the page size */
  onPageSizeChange?: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push('ellipsis');
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      onPageChange,
      onPageSizeChange,
      pageSizeOptions,
      ...props
    },
    ref,
  ) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const visiblePages = getVisiblePages(currentPage, totalPages);

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn('flex items-center justify-between py-2 text-sm', className)}
        {...props}
      >
        {/* Left: item count */}
        <div className="text-surface-500">
          Showing {startItem}–{endItem} of {totalItems}
        </div>

        {/* Center: page buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="h-8 min-w-8 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {visiblePages.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 min-w-8 items-center justify-center text-surface-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={cn(
                  'h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors',
                  page === currentPage
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-100',
                )}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            ),
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="h-8 min-w-8 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: page size selector */}
        {onPageSizeChange && pageSizeOptions && (
          <div className="flex items-center gap-2">
            <span className="text-surface-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-surface-200 bg-surface-0 px-2 text-sm text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </nav>
    );
  },
);
Pagination.displayName = 'Pagination';

export { Pagination };
