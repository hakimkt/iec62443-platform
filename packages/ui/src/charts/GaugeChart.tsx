'use client';

export interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
}

export function GaugeChart({
  value,
  max = 100,
  label,
  size = 200,
  strokeWidth = 16,
}: GaugeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = normalizedValue / max;
  const filledLength = circumference * percentage;

  const getColor = (pct: number) => {
    if (pct >= 0.8) return '#22c55e';
    if (pct >= 0.6) return '#3b82f6';
    if (pct >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        role="img"
        aria-label={`Gauge: ${Math.round(normalizedValue)} out of ${max}${label ? ` - ${label}` : ''}`}
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
        />
        {/* Value text */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="#1e293b"
          style={{ fontSize: '24px', fontWeight: 700 }}
        >
          {Math.round(normalizedValue)}
        </text>
      </svg>
      {label && (
        <span className="text-sm text-surface-500">{label}</span>
      )}
    </div>
  );
}
