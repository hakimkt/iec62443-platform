import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

/* ───────────────────────────── Label variants ─────────────────── */

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      error: {
        true: 'text-red-600 dark:text-red-400',
        false: 'text-surface-900 dark:text-surface-100',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      error: false,
      disabled: false,
    },
  },
);

/* ───────────────────────────── Label component ────────────────── */

interface LabelProps
  extends
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  /** Show a required indicator asterisk */
  required?: boolean;
  /** When true, merges props onto the child element instead of rendering a <label> */
  asChild?: boolean;
}

const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, error, disabled, required, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : LabelPrimitive.Root;
    return (
      <Comp ref={ref} className={cn(labelVariants({ error, disabled }), className)} {...props}>
        {children}
        {required && (
          <span className="ml-0.5 text-red-500 dark:text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </Comp>
    );
  },
);
Label.displayName = LabelPrimitive.Root.displayName;

/* ────────────────────────── Exports ───────────────────────────── */

export { Label, labelVariants };

export type { LabelProps };
