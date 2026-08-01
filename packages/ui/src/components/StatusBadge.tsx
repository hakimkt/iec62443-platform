import * as React from 'react';
import { Badge } from '../primitives/Badge';
import type { BadgeVariantKey } from '../primitives/Badge';

/* ───────────────────────────── Props ──────────────────────────── */

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'draft' | 'in_progress' | 'review' | 'completed' | 'archived' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

/* ───────────────────────────── Label map ──────────────────────── */

const statusLabelMap: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

/* ───────────────────────────── Component ──────────────────────── */

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, size = 'md', className, ...props }, ref) => (
    <Badge
      ref={ref}
      status={status}
      size={size}
      variant={status as BadgeVariantKey}
      className={className}
      {...props}
    >
      {statusLabelMap[status]}
    </Badge>
  ),
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
