import * as React from 'react';
import { cn } from '../lib/utils.js';
import { Label } from '../primitives/Label.js';

/* ───────────────────────────── Types ──────────────────────────── */

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

/* ──────────────────────────── Component ───────────────────────── */

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      required,
      error,
      hint,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        <Label htmlFor={htmlFor} required={required} error={!!error}>
          {label}
        </Label>

        {hint && !error && (
          <p className="text-xs text-surface-500">{hint}</p>
        )}

        {children}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = 'FormField';

export { FormField };
