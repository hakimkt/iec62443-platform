'use client';

import type { HeatMapCell, RiskLevel } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import { PageHeader } from '@iec62443/ui/components';
import React, { useMemo } from 'react';
import { useRiskHeatMap, useRiskMatrixConfig, useRiskRegisters } from '@/hooks/useRisks';

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'bg-green-200 text-green-900',
  medium: 'bg-amber-200 text-amber-900',
  high: 'bg-orange-300 text-orange-900',
  critical: 'bg-red-300 text-red-900',
};

const riskLevelBorderColors: Record<RiskLevel, string> = {
  low: 'border-green-300',
  medium: 'border-amber-300',
  high: 'border-orange-400',
  critical: 'border-red-400',
};

const defaultLikelihoodLabels = [
  'Rare',
  'Unlikely',
  'Possible',
  'Likely',
  'Almost Certain',
] as const;
const defaultImpactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'] as const;

function getRiskLevel(score: number): RiskLevel {
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

export default function RiskMatrixPage() {
  const { data: registersResult } = useRiskRegisters({ perPage: 100 });
  const registers = registersResult?.data ?? [];
  const registerId = registers.length > 0 ? registers[0]!.id : null;

  const { data: heatMapData } = useRiskHeatMap(registerId);
  const { data: matrixConfig } = useRiskMatrixConfig(registerId);

  const likelihoodLabels = matrixConfig?.likelihoodLabels ?? defaultLikelihoodLabels;
  const impactLabels = matrixConfig?.impactLabels ?? defaultImpactLabels;

  // Build a lookup map from the heat map cells
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatMapCell>();
    if (heatMapData?.cells) {
      for (const cell of heatMapData.cells) {
        map.set(`${cell.likelihood}-${cell.impact}`, cell);
      }
    }
    return map;
  }, [heatMapData]);

  // Generate the 5×5 grid (likelihood 5→1 top to bottom, impact 1→5 left to right)
  const grid = useMemo(() => {
    const rows: {
      likelihood: number;
      label: string;
      cells: { impact: number; label: string; count: number; level: RiskLevel; score: number }[];
    }[] = [];
    for (let l = 5; l >= 1; l--) {
      const cells: {
        impact: number;
        label: string;
        count: number;
        level: RiskLevel;
        score: number;
      }[] = [];
      for (let i = 1; i <= 5; i++) {
        const cell = cellMap.get(`${l}-${i}`);
        const score = l * i;
        cells.push({
          impact: i,
          label: impactLabels[i - 1] ?? `I${i}`,
          count: cell?.count ?? 0,
          level: cell?.riskLevel ?? getRiskLevel(score),
          score,
        });
      }
      rows.push({
        likelihood: l,
        label: likelihoodLabels[l - 1] ?? `L${l}`,
        cells,
      });
    }
    return rows;
  }, [cellMap, likelihoodLabels, impactLabels]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Matrix"
        description="5×5 risk assessment matrix showing likelihood vs impact distribution"
      />

      {/* Matrix */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        <div className="flex items-start gap-6">
          {/* Y-axis label */}
          <div className="flex flex-col items-center justify-center pt-8">
            <span className="text-sm font-medium text-surface-600 -rotate-90 whitespace-nowrap origin-center">
              Likelihood →
            </span>
          </div>

          <div className="flex-1">
            {/* X-axis label */}
            <div className="mb-2 text-center">
              <span className="text-sm font-medium text-surface-600">Impact →</span>
            </div>

            {/* Grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
              {/* Header row */}
              <div />
              {impactLabels.map((label, i) => (
                <div key={i} className="text-center text-xs font-medium text-surface-600 pb-2">
                  {label}
                </div>
              ))}

              {/* Data rows */}
              {grid.map((row) => (
                <React.Fragment key={`row-${row.likelihood}`}>
                  <div className="flex items-center justify-end pr-2 text-xs font-medium text-surface-600">
                    {row.label}
                  </div>
                  {row.cells.map((cell) => (
                    <div
                      key={`${row.likelihood}-${cell.impact}`}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-md border-2 p-3 min-h-[80px] transition-colors',
                        riskLevelColors[cell.level],
                        riskLevelBorderColors[cell.level],
                        cell.count > 0 ? 'ring-2 ring-offset-1 ring-surface-300' : '',
                      )}
                    >
                      <span className="text-lg font-bold">{cell.score}</span>
                      {cell.count > 0 && (
                        <span className="mt-1 text-xs font-medium">
                          {cell.count} risk{cell.count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Impact numeric labels */}
            <div
              className="grid gap-1 mt-1"
              style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}
            >
              <div />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center text-xs text-surface-400">
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        <h3 className="text-sm font-medium text-surface-700 mb-3">Risk Level Thresholds</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              level: 'low' as RiskLevel,
              label: 'Low',
              range: '1–5',
              color: 'bg-green-200 border-green-300 text-green-900',
            },
            {
              level: 'medium' as RiskLevel,
              label: 'Medium',
              range: '6–11',
              color: 'bg-amber-200 border-amber-300 text-amber-900',
            },
            {
              level: 'high' as RiskLevel,
              label: 'High',
              range: '12–19',
              color: 'bg-orange-300 border-orange-400 text-orange-900',
            },
            {
              level: 'critical' as RiskLevel,
              label: 'Critical',
              range: '20–25',
              color: 'bg-red-300 border-red-400 text-red-900',
            },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-3">
              <div className={cn('h-8 w-8 rounded border-2', item.color)} />
              <div>
                <p className="text-sm font-medium text-surface-900">{item.label}</p>
                <p className="text-xs text-surface-500">Score {item.range}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Register selector info */}
      {registers.length > 0 && (
        <p className="text-xs text-surface-400 text-center">
          Showing matrix for: <span className="font-medium">{registers[0]!.name}</span>
        </p>
      )}
    </div>
  );
}
