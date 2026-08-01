import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Types ──────────────────────────── */

export interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchSlot?: React.ReactNode;
  filters?: FilterChip[];
  onClearAll?: () => void;
  actions?: React.ReactNode;
}

/* ──────────────────────────── Component ───────────────────────── */

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      searchSlot,
      filters,
      onClearAll,
      actions,
      children,
      ...props
    },
    ref,
  ) => {
    const hasFilters = filters && filters.length > 0;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 py-3 px-4 border-b border-surface-200',
          className,
        )}
        {...props}
      >
        {searchSlot && <div className="flex-1">{searchSlot}</div>}

        {hasFilters && (
          <div className="inline-flex items-center gap-1.5">
            {filters.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 bg-surface-100 text-surface-700 text-xs px-2 py-1 rounded-full"
              >
                <span className="font-medium">{chip.label}:</span>
                <span>{chip.value}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center justify-center rounded-full hover:bg-surface-200 transition-colors"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-4 w-4 text-surface-400 hover:text-surface-600" />
                </button>
              </span>
            ))}

            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}

        {children}
      </div>
    );
  },
);
FilterBar.displayName = 'FilterBar';

export { FilterBar };
