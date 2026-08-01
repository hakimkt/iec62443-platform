import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

const emptyStateIconVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8 w-8 mb-3',
      md: 'h-12 w-12 mb-4',
      lg: 'h-16 w-16 mb-5',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateIconVariants> {
  /** Icon component rendered above the title */
  icon?: React.ElementType;
  /** Primary message */
  title: string;
  /** Secondary descriptive text */
  description?: string;
  /** Action button or link rendered below the description */
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon: Icon, title, description, action, size, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12',
        className,
      )}
      {...props}
    >
      {Icon && (
        <Icon
          className={cn('text-surface-300', emptyStateIconVariants({ size }))}
          aria-hidden
        />
      )}
      <h3 className="text-lg font-medium text-surface-700">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  ),
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateIconVariants };
