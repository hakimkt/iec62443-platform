import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

/* ─── Content variants ────────────────────────────────────────────── */

const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-surface-800 text-white',
        rich: 'bg-surface-800 text-white max-w-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {
  /** Delay in ms before the tooltip appears. Defaults to 300. */
  delayDuration?: number;
}

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, variant, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ variant }), className)}
    {...props}
  >
    {children}
    <TooltipPrimitive.Arrow className="fill-surface-800" />
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = 'TooltipContent';

/* ─── Rich Tooltip composition ────────────────────────────────────── */

export interface RichTooltipHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const RichTooltipHeader = React.forwardRef<HTMLDivElement, RichTooltipHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-medium text-white', className)}
      {...props}
    />
  ),
);
RichTooltipHeader.displayName = 'RichTooltipHeader';

export interface RichTooltipBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const RichTooltipBody = React.forwardRef<HTMLDivElement, RichTooltipBodyProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-1.5 space-y-1 border-t border-white/20 pt-1.5 text-sm text-surface-200',
        className,
      )}
      {...props}
    />
  ),
);
RichTooltipBody.displayName = 'RichTooltipBody';

export interface RichTooltipFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const RichTooltipFooter = React.forwardRef<HTMLDivElement, RichTooltipFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mt-1.5 border-t border-white/20 pt-1.5 text-xs text-surface-300',
        className,
      )}
      {...props}
    />
  ),
);
RichTooltipFooter.displayName = 'RichTooltipFooter';

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  RichTooltipHeader,
  RichTooltipBody,
  RichTooltipFooter,
  tooltipContentVariants,
};
