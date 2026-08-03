'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

export interface SparklineProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
  width?: string | number;
}

export function Sparkline({ data, color = '#3b82f6', height = 40 }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
