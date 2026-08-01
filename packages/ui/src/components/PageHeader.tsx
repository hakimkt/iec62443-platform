import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

const pageHeaderVariants = cva('flex items-start justify-between py-4 px-6', {
  variants: {
    size: {
      sm: '',
      lg: '',
    },
    bordered: {
      true: 'border-b border-surface-200',
      false: '',
    },
  },
  defaultVariants: {
    size: 'sm',
    bordered: false,
  },
});

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  /** Page title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Action buttons or controls rendered on the right */
  actions?: React.ReactNode;
  /** Breadcrumb navigation above the title */
  breadcrumb?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      description,
      actions,
      breadcrumb,
      size,
      bordered,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(pageHeaderVariants({ size, bordered }), className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
        <h1
          className={cn(
            'font-semibold text-surface-900',
            size === 'lg' ? 'text-2xl' : 'text-xl',
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-surface-500 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 ml-4">{actions}</div>
      )}
    </div>
  ),
);
PageHeader.displayName = 'PageHeader';

export { PageHeader, pageHeaderVariants };
