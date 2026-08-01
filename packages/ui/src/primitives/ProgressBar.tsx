import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/* ───────────────────────────── Color variants ─────────────────── */

const progressBarColorMap = {
  brand: 'bg-brand-600 dark:bg-brand-400',
  green: 'bg-green-600 dark:bg-green-400',
  red: 'bg-red-600 dark:bg-red-400',
  amber: 'bg-amber-600 dark:bg-amber-400',
} as const;

type ProgressBarColor = keyof typeof progressBarColorMap;

/* ───────────────────────────── ProgressBar variants ───────────── */

const progressBarVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

/* ───────────────────────────── ProgressBar component ──────────── */

interface ProgressBarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'color'>,
    VariantProps<typeof progressBarVariants> {
  /** Progress bar color variant */
  color?: ProgressBarColor;
  /** Current value (0–100). If omitted, the bar is in indeterminate mode. */
  value?: number;
  /** Show a label above the bar */
  label?: string;
  /** Show the percentage text alongside the label */
  showPercentage?: boolean;
}

const ProgressBar = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressBarProps
>(({ className, size, color = 'brand', value, label, showPercentage, ...props }, ref) => {
  const clampedValue = Math.min(100, Math.max(0, value ?? 0));
  const isIndeterminate = value === undefined;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {label}
            </span>
          )}
          {showPercentage && !isIndeterminate && (
            <span className="text-xs tabular-nums text-surface-500 dark:text-surface-400">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        value={clampedValue}
        className={cn(progressBarVariants({ size }), className)}
        {...props}
      >
        {isIndeterminate ? (
          <div
            className={cn(
              'h-full w-1/3 rounded-full',
              progressBarColorMap[color],
              'animate-indeterminate',
            )}
          />
        ) : (
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full rounded-full transition-transform duration-300 ease-in-out',
              progressBarColorMap[color],
            )}
            style={{ transform: `translateX(-${100 - clampedValue}%)` }}
          />
        )}
      </ProgressPrimitive.Root>
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

/* ────────────────────────── Exports ───────────────────────────── */

export { ProgressBar, progressBarVariants };

export type { ProgressBarProps };
