import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const inputVariants = cva(
  'flex h-9 w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-500',
  {
    variants: {
      error: {
        true: 'border-red-500 focus-visible:ring-red-500',
        false: '',
      },
    },
    defaultVariants: {
      error: false,
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'>,
    VariantProps<typeof inputVariants> {
  /** Icon element rendered before the input text */
  prefix?: React.ReactNode;
  /** Icon element rendered after the input text */
  suffix?: React.ReactNode;
  /** Whether to show a clear button when the input has a value */
  onClear?: () => void;
  /** Error message displayed below the input */
  errorText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      error,
      prefix,
      suffix,
      onClear,
      errorText,
      type = 'text',
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    const hasValue = value !== undefined && value !== '';
    const hasClear = onClear && hasValue && !disabled;

    return (
      <div className="w-full">
        <div
          className={cn(
            'relative flex items-center',
            prefix && 'gap-0',
          )}
        >
          {prefix && (
            <span className="pointer-events-none absolute left-3 flex items-center text-surface-400">
              {prefix}
            </span>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ error }),
              prefix && 'pl-9',
              (suffix || hasClear) && 'pr-9',
              className,
            )}
            ref={ref}
            disabled={disabled}
            value={value}
            aria-invalid={error || undefined}
            aria-describedby={errorText ? `${props.id}-error` : undefined}
            {...props}
          />
          {hasClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 flex items-center text-surface-400 hover:text-surface-600"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!hasClear && suffix && (
            <span className="pointer-events-none absolute right-3 flex items-center text-surface-400">
              {suffix}
            </span>
          )}
        </div>
        {errorText && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {errorText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input, inputVariants };
