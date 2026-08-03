'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

export interface TrendArrowProps {
  value: number;
  label?: string;
  invert?: boolean;
}

export function TrendArrow({ value, label, invert = false }: TrendArrowProps) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNeutral = value === 0;

  const color = isNeutral ? 'text-surface-400' : isPositive ? 'text-green-600' : 'text-red-600';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{isNeutral ? '0%' : `${Math.abs(value)}%`}</span>
      {label && <span className="text-xs text-surface-400">{label}</span>}
    </div>
  );
}
