import * as React from 'react';
import { Badge } from '../primitives/Badge';
import type { BadgeVariantKey } from '../primitives/Badge';

/* ───────────────────────────── Props ──────────────────────────── */

export interface SecurityLevelBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  level: 0 | 1 | 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
}

/* ───────────────────────────── Component ──────────────────────── */

const SecurityLevelBadge = React.forwardRef<
  HTMLSpanElement,
  SecurityLevelBadgeProps
>(({ level, size = 'md', className, ...props }, ref) => {
  const variantKey = `SL${level}` as BadgeVariantKey;
  const securityLevelKey = `SL${level}` as
    | 'SL0'
    | 'SL1'
    | 'SL2'
    | 'SL3'
    | 'SL4';

  return (
    <Badge
      ref={ref}
      securityLevel={securityLevelKey}
      size={size}
      variant={variantKey}
      className={className}
      {...props}
    >
      {`SL ${level}`}
    </Badge>
  );
});
SecurityLevelBadge.displayName = 'SecurityLevelBadge';

export { SecurityLevelBadge };
