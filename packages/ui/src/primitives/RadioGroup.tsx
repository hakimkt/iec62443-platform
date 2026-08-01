import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

const radioGroupItemVariants = cva(
  'aspect-square rounded-full border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'h-4 w-4 border-surface-300 text-brand-600 data-[state=checked]:border-brand-600',
        card: 'h-5 w-5 border-surface-300 text-brand-600 data-[state=checked]:border-brand-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const radioCardVariants = cva(
  'relative flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
  {
    variants: {
      selected: {
        true: 'border-brand-500 bg-brand-50 ring-1 ring-brand-500',
        false: 'border-surface-200 bg-surface-0 hover:bg-surface-50',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  },
);

/* ─── RadioGroup ──────────────────────────────────────────────────── */

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  variant?: 'default' | 'card';
}

const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, variant = 'default', ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(
      variant === 'card' ? 'grid gap-3' : 'grid gap-2',
      className,
    )}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

/* ─── RadioGroupItem ──────────────────────────────────────────────── */

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  variant?: 'default' | 'card';
  /** Label text for the radio item */
  label?: string;
  /** Description text shown below the label (card variant only) */
  description?: string;
}

const RadioGroupItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant = 'default', label, description, ...props }, ref) => {
  if (variant === 'card') {
    return (
      <label
        htmlFor={props.id}
        className={cn(
          radioCardVariants({
            selected: false,
            disabled: props.disabled,
          }),
          className,
        )}
      >
        <RadioGroupPrimitive.Item
          ref={ref}
          className={radioGroupItemVariants({ variant })}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-surface-700">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-surface-500">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(radioGroupItemVariants({ variant }), className)}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-current text-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {label && (
        <label
          htmlFor={props.id}
          className="cursor-pointer text-sm font-medium text-surface-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {label}
        </label>
      )}
    </div>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem, radioGroupItemVariants };
