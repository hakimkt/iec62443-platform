import * as React from 'react';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Types ──────────────────────────── */

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
}

/* ──────────────────────── Column class map ────────────────────── */

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

/* ──────────────────────────── Component ───────────────────────── */

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  (
    {
      className,
      title,
      description,
      columns = 1,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-sm font-medium text-surface-700">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-surface-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}

        <div className={cn('grid gap-4', columnClasses[columns])}>
          {children}
        </div>
      </div>
    );
  },
);
FormGroup.displayName = 'FormGroup';

export { FormGroup };
