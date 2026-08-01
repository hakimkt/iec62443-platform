import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Skeleton variants ──────────────── */

const skeletonVariants = cva(
  'animate-pulse bg-surface-200 dark:bg-surface-700',
  {
    variants: {
      variant: {
        text: 'rounded',
        circle: 'rounded-full',
        rectangle: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'rectangle',
    },
  },
);

/* ───────────────────────────── Skeleton component ─────────────── */

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width — accepts any CSS value (e.g. "100%", "12rem", 200) */
  width?: React.CSSProperties['width'];
  /** Height — accepts any CSS value (e.g. "1rem", "100%", 200) */
  height?: React.CSSProperties['height'];
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonVariants({ variant }), className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

/* ───────────────────────────── Preset helpers ─────────────────── */

/** Pre-built text skeleton rows */
function SkeletonText({
  rows = 3,
  gap = 2,
  className,
  ...props
}: {
  rows?: number;
  gap?: number;
} & Omit<SkeletonProps, 'variant' | 'width' | 'height'>) {
  return (
    <div className={cn('flex flex-col', className)} style={{ gap }} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="0.875rem"
          width={i === rows - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

/** Pre-built avatar skeleton */
function SkeletonAvatar({
  size = 'md',
  className,
  ...props
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
} & Omit<SkeletonProps, 'variant' | 'width' | 'height'>) {
  const sizeMap = { sm: '2rem', md: '2.5rem', lg: '3rem', xl: '4rem' };
  return (
    <Skeleton
      variant="circle"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
      {...props}
    />
  );
}

/* ────────────────────────── Exports ───────────────────────────── */

export { Skeleton, SkeletonText, SkeletonAvatar, skeletonVariants };

export type { SkeletonProps };
