import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/utils';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Whether the checkbox is in an error state */
  error?: boolean;
  /** Error message displayed below the checkbox */
  errorText?: string;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, error, errorText, indeterminate, id: providedId, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;

    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <CheckboxPrimitive.Root
            ref={ref}
            id={inputId}
            className={cn(
              'peer h-4 w-4 shrink-0 rounded-sm border border-surface-300 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-brand-600 data-[state=checked]:border-brand-600 data-[state=checked]:text-white data-[state=indeterminate]:bg-brand-600 data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:text-white',
              error && 'border-red-500 focus-visible:ring-red-500',
              className,
            )}
            data-state={indeterminate ? 'indeterminate' : undefined}
            aria-invalid={error || undefined}
            aria-describedby={errorText ? `${inputId}-error` : undefined}
            {...props}
          >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
              {indeterminate ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>
          {label && (
            <label
              htmlFor={inputId}
              className="cursor-pointer text-sm font-medium text-surface-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {label}
            </label>
          )}
        </div>
        {errorText && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {errorText}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
