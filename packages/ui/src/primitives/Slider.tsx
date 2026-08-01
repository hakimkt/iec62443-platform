import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/* ───────────────────────────── Slider variants ────────────────── */

const sliderVariants = cva(
  'relative flex w-full touch-none select-none items-center',
  {
    variants: {
      size: {
        sm: 'h-4',
        md: 'h-5',
        lg: 'h-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const sliderTrackVariants = cva(
  'relative grow overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-2.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const sliderRangeVariants = cva('absolute h-full rounded-full bg-brand-600 dark:bg-brand-400');

const sliderThumbVariants = cva(
  'block rounded-full border-2 border-brand-600 bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:border-brand-700 dark:border-brand-400 dark:bg-surface-900 dark:focus-visible:ring-offset-surface-900',
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

/* ───────────────────────────── Mark type ──────────────────────── */

interface SliderMark {
  /** Value on the slider scale */
  value: number;
  /** Display label — defaults to the value */
  label?: string;
}

/* ───────────────────────────── Slider component ───────────────── */

interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'onValueCommit'>,
    VariantProps<typeof sliderVariants> {
  /** Tick marks to render below the track */
  marks?: SliderMark[];
  /** Show a tooltip with the current value on hover/drag */
  showTooltip?: boolean;
  /** Called when the user finishes dragging a thumb */
  onValueCommit?: (value: number[]) => void;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, size, marks, showTooltip, onValueCommit, min, max, value, defaultValue, ...props }, ref) => {
  const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null);
  const resolvedMin = min ?? 0;
  const resolvedMax = max ?? 100;

  const thumbValues = value ?? defaultValue ?? [resolvedMin];

  const handleValueCommit = React.useCallback(
    (committedValue: number[]) => {
      setHoveredThumb(null);
      onValueCommit?.(committedValue);
    },
    [onValueCommit],
  );

  return (
    <div className="w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(sliderVariants({ size }), className)}
        min={resolvedMin}
        max={resolvedMax}
        value={value}
        defaultValue={defaultValue}
        onValueCommit={handleValueCommit}
        {...props}
      >
        <SliderPrimitive.Track className={cn(sliderTrackVariants({ size }))}>
          <SliderPrimitive.Range className={cn(sliderRangeVariants())} />
        </SliderPrimitive.Track>

        {thumbValues.map((_val: number, index: number) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(sliderThumbVariants({ size }))}
            onPointerEnter={() => setHoveredThumb(index)}
            onPointerLeave={() => setHoveredThumb(null)}
          >
            {showTooltip && hoveredThumb === index && (
              <span
                className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-surface-900 px-1.5 py-0.5 text-xs text-white dark:bg-surface-100 dark:text-surface-900"
                role="status"
              >
                {(Array.isArray(value)
                  ? value[index]
                  : Array.isArray(defaultValue)
                    ? defaultValue[index]
                    : _val) ?? _val}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>

      {marks && marks.length > 0 && (
        <div className="relative mt-2 h-4 w-full">
          {marks.map((mark) => {
            const pct = ((mark.value - resolvedMin) / (resolvedMax - resolvedMin)) * 100;
            return (
              <span
                key={mark.value}
                className="absolute -translate-x-1/2 text-xs text-surface-500"
                style={{ left: `${pct}%` }}
              >
                {mark.label ?? mark.value}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});
Slider.displayName = 'Slider';

/* ────────────────────────── Exports ───────────────────────────── */

export {
  Slider,
  sliderVariants,
  sliderTrackVariants,
  sliderRangeVariants,
  sliderThumbVariants,
};

export type { SliderProps, SliderMark };
