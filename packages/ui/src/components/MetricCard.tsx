import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Color variants ─────────────────── */

const metricCardColorVariants = cva('', {
  variants: {
    color: {
      brand: 'bg-brand-50 text-brand-600',
      green: 'bg-green-50 text-green-600',
      red: 'bg-red-50 text-red-600',
      amber: 'bg-amber-50 text-amber-600',
      blue: 'bg-blue-50 text-blue-600',
    },
  },
  defaultVariants: {
    color: 'brand',
  },
});

/* ───────────────────────────── Props ──────────────────────────── */

type MetricCardColor = 'brand' | 'green' | 'red' | 'amber' | 'blue';

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'> {
  icon?: React.ElementType;
  label: string;
  value: string | number;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  color?: MetricCardColor;
  onClick?: () => void;
}

/* ───────────────────────────── Trend icon ─────────────────────── */

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-3 w-3" />;
    case 'down':
      return <TrendingDown className="h-3 w-3" />;
    case 'neutral':
      return <Minus className="h-3 w-3" />;
  }
}

const trendColorMap: Record<string, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-surface-500',
};

/* ───────────────────────────── Component ──────────────────────── */

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      icon: Icon,
      label,
      value,
      trend,
      color,
      onClick,
      ...props
    },
    ref,
  ) => {
    const clickable = !!onClick;

    return (
      <div
        ref={ref}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          'rounded-lg border border-surface-200 bg-surface-0 p-4 h-32 flex flex-col',
          clickable &&
            'cursor-pointer hover:shadow-card-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                metricCardColorVariants({ color: color as VariantProps<typeof metricCardColorVariants>['color'] }),
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
          )}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs mt-1',
                trendColorMap[trend.direction],
              )}
            >
              <TrendIcon direction={trend.direction} />
              {trend.value}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-sm text-surface-500">{label}</p>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
        </div>
      </div>
    );
  },
);
MetricCard.displayName = 'MetricCard';

export { MetricCard, metricCardColorVariants };
