'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface RadarChartProps {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  nameKey?: string;
  fill?: string;
  stroke?: string;
  height?: number;
}

export function RadarChart({
  data,
  dataKey,
  nameKey = 'subject',
  fill = 'rgba(59, 130, 246, 0.3)',
  stroke = '#3b82f6',
  height = 300,
}: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey={nameKey} tick={{ fontSize: 12, fill: '#64748b' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <Radar name={dataKey} dataKey={dataKey} stroke={stroke} fill={fill} strokeWidth={2} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
