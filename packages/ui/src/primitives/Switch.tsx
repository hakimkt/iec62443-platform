import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const switchVariants = cva(
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-surface-300',
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
      },
    },
    compoundVariants: [
      {
        size: 'sm',
        class: '[&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4',
      },
      {
        size: 'md',
        class: '[&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5',
      },
    ],
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface SwitchProps
  extends
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {
  /** Label text displayed next to the switch */
  label?: string;
  /** Description text displayed below the label */
  description?: string;
}

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, size, label, description, id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;

    return (
      <div className="flex items-center justify-between gap-3">
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={inputId}
                className="cursor-pointer text-sm font-medium text-surface-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {label}
              </label>
            )}
            {description && <p className="text-xs text-surface-500">{description}</p>}
          </div>
        )}
        <SwitchPrimitive.Root
          ref={ref}
          id={inputId}
          className={cn(switchVariants({ size }), className)}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
            )}
          />
        </SwitchPrimitive.Root>
      </div>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch, switchVariants };
