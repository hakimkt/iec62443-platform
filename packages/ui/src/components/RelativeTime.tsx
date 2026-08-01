import * as React from 'react';
import { cn } from '../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '../primitives/Tooltip';

/* ───────────────────────────── Types ──────────────────────────── */

export interface RelativeTimeProps extends React.HTMLAttributes<HTMLTimeElement> {
  date: Date | string;
  tooltip?: boolean;
}

/* ──────────────────────── Helpers ─────────────────────────────── */

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 0) return 'just now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

function formatFullDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

/* ──────────────────────────── Component ───────────────────────── */

const RelativeTime = React.forwardRef<HTMLTimeElement, RelativeTimeProps>(
  (
    {
      className,
      date: dateProp,
      tooltip = true,
      ...props
    },
    ref,
  ) => {
    const date = toDate(dateProp);
    const relativeText = formatRelative(date);
    const isoString = date.toISOString();
    const fullDate = formatFullDate(date);

    const timeElement = (
      <time
        ref={ref}
        dateTime={isoString}
        className={cn('text-sm text-surface-500', className)}
        {...props}
      >
        {relativeText}
      </time>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{timeElement}</TooltipTrigger>
            <TooltipContent>{fullDate}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return timeElement;
  },
);
RelativeTime.displayName = 'RelativeTime';

export { RelativeTime };
