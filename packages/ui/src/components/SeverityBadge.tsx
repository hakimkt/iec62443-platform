import * as React from 'react';
import { Badge } from '../primitives/Badge';
import type { BadgeVariantKey } from '../primitives/Badge';

/* ───────────────────────────── Props ──────────────────────────── */

export interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

/* ───────────────────────────── Label map ──────────────────────── */

const severityLabelMap: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  informational: 'Informational',
};

/* ───────────────────────────── Component ──────────────────────── */

const SeverityBadge = React.forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, size = 'md', dot = false, className, ...props }, ref) => (
    <Badge
      ref={ref}
      severity={severity}
      size={size}
      variant={severity as BadgeVariantKey}
      dot={dot}
      className={className}
      {...props}
    >
      {severityLabelMap[severity]}
    </Badge>
  ),
);
SeverityBadge.displayName = 'SeverityBadge';

export { SeverityBadge };
