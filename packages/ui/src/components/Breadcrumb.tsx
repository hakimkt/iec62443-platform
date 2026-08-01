import * as React from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils.js';

export interface BreadcrumbItem {
  /** Display label for the breadcrumb item */
  label: string;
  /** Optional link destination; if omitted the item is treated as the current page */
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Ordered list of breadcrumb items from root to current page */
  items: BreadcrumbItem[];
  /** Custom separator between items; defaults to a chevron icon */
  separator?: React.ReactNode;
  /** Maximum number of items to display before truncating with an ellipsis */
  maxItems?: number;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  (
    { className, items, separator, maxItems, ...props },
    ref,
  ) => {
    const [expanded, setExpanded] = React.useState(false);

    const shouldTruncate =
      maxItems !== undefined && items.length > maxItems && !expanded;

    const visibleItems = shouldTruncate
      ? [
          items[0],
          null, // sentinel for ellipsis
          ...items.slice(maxItems - 1),
        ]
      : items;

    const lastIndex = visibleItems.length - 1;

    const defaultSeparator = (
      <ChevronRight className="h-3.5 w-3.5 text-surface-400" aria-hidden />
    );

    const resolvedSeparator = separator ?? defaultSeparator;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn('flex items-center gap-1.5 text-sm', className)}
        {...props}
      >
        <ol className="flex items-center gap-1.5">
          {visibleItems.map((item, index) => {
            const isLast = index === lastIndex;
            const isEllipsis = item === null;

            return (
              <React.Fragment key={isEllipsis ? 'ellipsis' : item!.label}>
                <li className="flex items-center gap-1.5">
                  {isEllipsis ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                      aria-label="Show all breadcrumb items"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  ) : isLast || !item!.href ? (
                    <span
                      className={cn(
                        isLast
                          ? 'text-surface-900 font-medium'
                          : 'text-surface-500',
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item!.label}
                    </span>
                  ) : (
                    <a
                      href={item!.href}
                      className="text-surface-500 hover:text-surface-700 transition-colors"
                    >
                      {item!.label}
                    </a>
                  )}
                </li>
                {!isLast && (
                  <li
                    role="presentation"
                    aria-hidden
                    className="flex items-center"
                  >
                    {resolvedSeparator}
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    );
  },
);
Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
