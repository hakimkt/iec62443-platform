import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Badge variants ─────────────────── */

const badgeVariants = cva(
  'inline-flex items-center font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      size: {
        sm: 'h-5 px-2 text-xs rounded',
        md: 'h-6 px-2.5 text-xs rounded-md',
        lg: 'h-7 px-3 text-sm rounded-md',
      },
      /* Status variants */
      status: {
        draft:
          'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
        in_progress:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        review:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        completed:
          'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        archived:
          'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
        cancelled:
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      },
      /* Severity variants */
      severity: {
        critical:
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        high:
          'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        medium:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        low:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        informational:
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      },
      /* Security level variants */
      securityLevel: {
        SL0:
          'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        SL1:
          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        SL2:
          'bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        SL3:
          'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        SL4:
          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
      },
      outline: {
        true: 'border bg-transparent',
        false: '',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      /* Outline + status */
      { status: 'draft', outline: true, className: 'border-surface-300 text-surface-700 dark:border-surface-600 dark:text-surface-300' },
      { status: 'in_progress', outline: true, className: 'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300' },
      { status: 'review', outline: true, className: 'border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300' },
      { status: 'completed', outline: true, className: 'border-green-200 text-green-700 dark:border-green-700 dark:text-green-300' },
      { status: 'archived', outline: true, className: 'border-surface-200 text-surface-500 dark:border-surface-600 dark:text-surface-400' },
      { status: 'cancelled', outline: true, className: 'border-red-200 text-red-700 dark:border-red-700 dark:text-red-300' },

      /* Outline + severity */
      { severity: 'critical', outline: true, className: 'border-red-200 text-red-700 dark:border-red-700 dark:text-red-300' },
      { severity: 'high', outline: true, className: 'border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300' },
      { severity: 'medium', outline: true, className: 'border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300' },
      { severity: 'low', outline: true, className: 'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300' },
      { severity: 'informational', outline: true, className: 'border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-400' },

      /* Outline + securityLevel */
      { securityLevel: 'SL0', outline: true, className: 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300' },
      { securityLevel: 'SL1', outline: true, className: 'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300' },
      { securityLevel: 'SL2', outline: true, className: 'border-blue-300 text-blue-800 dark:border-blue-600 dark:text-blue-200' },
      { securityLevel: 'SL3', outline: true, className: 'border-violet-200 text-violet-700 dark:border-violet-700 dark:text-violet-300' },
      { securityLevel: 'SL4', outline: true, className: 'border-red-200 text-red-700 dark:border-red-700 dark:text-red-300' },

      /* Dot indicator spacing */
      { dot: true, size: 'sm', className: 'gap-1' },
      { dot: true, size: 'md', className: 'gap-1.5' },
      { dot: true, size: 'lg', className: 'gap-1.5' },
    ],
    defaultVariants: {
      size: 'md',
      outline: false,
      dot: false,
    },
  },
);

/* ───────────────────────────── Dot color map ──────────────────── */

const dotColorMap: Record<string, string> = {
  draft: 'bg-surface-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  completed: 'bg-green-500',
  archived: 'bg-surface-400',
  cancelled: 'bg-red-500',
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
  informational: 'bg-slate-500',
  SL0: 'bg-slate-400',
  SL1: 'bg-blue-500',
  SL2: 'bg-blue-600',
  SL3: 'bg-violet-500',
  SL4: 'bg-red-500',
};

const dotSizeMap = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2 w-2',
} as const;

/* ───────────────────────────── Badge component ────────────────── */

type BadgeVariantKey =
  | 'draft' | 'in_progress' | 'review' | 'completed' | 'archived' | 'cancelled'
  | 'critical' | 'high' | 'medium' | 'low' | 'informational'
  | 'SL0' | 'SL1' | 'SL2' | 'SL3' | 'SL4';

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Active category — used to resolve the dot color when dot=true */
  variant?: BadgeVariantKey;
  /** When true, merges props onto the child element instead of rendering a <span> */
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, size, status, severity, securityLevel, outline, dot, variant, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span';

    const dotColor =
      dot && variant
        ? dotColorMap[variant]
        : dot && (status ?? severity ?? securityLevel)
          ? dotColorMap[(status ?? severity ?? securityLevel) as string]
          : undefined;

    return (
      <Comp
        ref={ref}
        className={cn(badgeVariants({ size, status, severity, securityLevel, outline, dot }), className)}
        {...props}
      >
        {dot && dotColor && (
          <span
            className={cn(
              'shrink-0 rounded-full',
              dotSizeMap[size ?? 'md'],
              dotColor,
            )}
          />
        )}
        {children}
      </Comp>
    );
  },
);
Badge.displayName = 'Badge';

/* ────────────────────────── Exports ───────────────────────────── */

export { Badge, badgeVariants };

export type { BadgeProps, BadgeVariantKey };
