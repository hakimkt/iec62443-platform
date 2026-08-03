import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

/* ───────────────────────────── Separator variants ─────────────── */

const separatorVariants = cva('shrink-0 bg-surface-200 dark:bg-surface-700', {
  variants: {
    layout: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
    spacing: {
      none: '',
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { layout: 'horizontal', spacing: 'sm', className: 'my-2' },
    { layout: 'horizontal', spacing: 'md', className: 'my-4' },
    { layout: 'horizontal', spacing: 'lg', className: 'my-8' },
    { layout: 'vertical', spacing: 'sm', className: 'mx-2' },
    { layout: 'vertical', spacing: 'md', className: 'mx-4' },
    { layout: 'vertical', spacing: 'lg', className: 'mx-8' },
  ],
  defaultVariants: {
    layout: 'horizontal',
    spacing: 'none',
  },
});

/* ───────────────────────────── Separator component ────────────── */

interface SeparatorProps
  extends
    Omit<React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>, 'orientation'>,
    VariantProps<typeof separatorVariants> {
  /** Orientation of the separator — maps to both Radix and visual variant */
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', spacing, decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(separatorVariants({ layout: orientation, spacing }), className)}
    {...props}
  />
));
Separator.displayName = 'Separator';

/* ────────────────────────── Exports ───────────────────────────── */

export { Separator, separatorVariants };

export type { SeparatorProps };
