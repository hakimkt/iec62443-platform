'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  MetricCard,
  EmptyState,
} from '@iec62443/ui/components';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import { ArrowLeft, Edit, ShieldCheck, Network } from 'lucide-react';
import {
  usePurdueModel,
  usePurdueLevels,
  usePurdueAssetMappings,
  usePurdueCompliance,
} from '@/hooks/usePurdue';
import type {
  PurdueAssetMapping,
} from '@iec62443/shared-types';

/** Standard Purdue levels used when no custom levels are defined. */
const STANDARD_LEVELS = [
  { id: 'L5', modelId: '', levelNumber: 5, name: 'Enterprise', description: 'Corporate IT network', color: '#6366f1', sortOrder: 0 },
  { id: 'L4', modelId: '', levelNumber: 4, name: 'Business', description: 'Business planning & logistics', color: '#8b5cf6', sortOrder: 1 },
  { id: 'L3.5', modelId: '', levelNumber: 3.5, name: 'DMZ', description: 'Demilitarized zone / iDMZ', color: '#f59e0b', sortOrder: 2 },
  { id: 'L3', modelId: '', levelNumber: 3, name: 'Operations', description: 'Manufacturing operations', color: '#10b981', sortOrder: 3 },
  { id: 'L2', modelId: '', levelNumber: 2, name: 'Supervisory', description: 'Area supervisory control', color: '#3b82f6', sortOrder: 4 },
  { id: 'L1', modelId: '', levelNumber: 1, name: 'Basic Control', description: 'Basic control loops', color: '#06b6d4', sortOrder: 5 },
  { id: 'L0', modelId: '', levelNumber: 0, name: 'Process', description: 'Physical process', color: '#ef4444', sortOrder: 6 },
];

export default function PurdueModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: modelId } = use(params);

  const { data: model, isLoading: modelLoading } = usePurdueModel(modelId);
  const { data: customLevels } = usePurdueLevels(modelId);
  const { data: mappings } = usePurdueAssetMappings(modelId);
  const { data: compliance } = usePurdueCompliance(modelId);

  // Use custom levels if available, otherwise fall back to standard levels
  const levels = useMemo(() => {
    if (customLevels && customLevels.length > 0) {
      return [...customLevels].sort((a, b) => b.levelNumber - a.levelNumber);
    }
    return STANDARD_LEVELS;
  }, [customLevels]);

  // Group asset mappings by level
  const mappingsByLevel = useMemo(() => {
    const map = new Map<string, PurdueAssetMapping[]>();
    if (!mappings) return map;
    for (const m of mappings) {
      const existing = map.get(m.levelId) ?? [];
      existing.push(m);
      map.set(m.levelId, existing);
    }
    return map;
  }, [mappings]);

  if (modelLoading || !model) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/purdue"
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Purdue Models
        </Link>
        <PageHeader
          title={model.name}
          description={model.description || 'Purdue Model visualization'}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/purdue/${modelId}/rules`}>
                <Button variant="secondary" icon={ShieldCheck}>
                  Compliance
                </Button>
              </Link>
              <Button variant="secondary" icon={Edit}>
                Edit
              </Button>
            </div>
          }
        />
      </div>

      {/* Compliance metrics */}
      {compliance && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Compliant"
            value={compliance.compliantCount}
            color="green"
          />
          <MetricCard
            label="Violations"
            value={compliance.violationCount}
            color="red"
          />
        </div>
      )}

      {/* Purdue Model Diagram */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 overflow-hidden">
        <div className="border-b border-surface-200 px-6 py-3">
          <h3 className="text-sm font-medium text-surface-700">
            Purdue Model Diagram
          </h3>
          <p className="text-xs text-surface-500 mt-0.5">
            Network segmentation levels — L5 at top, L0 at bottom
          </p>
        </div>

        <div className="divide-y divide-surface-200">
          {levels.map((level) => {
            const levelMappings = mappingsByLevel.get(level.id) ?? [];

            return (
              <div
                key={level.id}
                className={cn(
                  'flex items-start gap-4 px-6 py-4 transition-colors',
                  levelMappings.length > 0
                    ? 'bg-surface-0'
                    : 'bg-surface-50/50',
                )}
                style={{
                  borderLeft: level.color
                    ? `4px solid ${level.color}`
                    : undefined,
                }}
              >
                {/* Level label */}
                <div className="flex flex-col items-center w-20 shrink-0">
                  <span
                    className={cn(
                      'text-lg font-bold',
                      level.color ? '' : 'text-surface-700',
                    )}
                    style={level.color ? { color: level.color } : undefined}
                  >
                    L{level.levelNumber}
                  </span>
                  <span className="text-xs text-surface-500 text-center leading-tight mt-0.5">
                    {level.name}
                  </span>
                </div>

                {/* Level description and assets */}
                <div className="flex-1 min-w-0">
                  {level.description && (
                    <p className="text-xs text-surface-500 mb-2">
                      {level.description}
                    </p>
                  )}

                  {/* Asset chips */}
                  {levelMappings.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {levelMappings.map((mapping) => (
                        <span
                          key={mapping.id}
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-surface-100 text-surface-700 border border-surface-200"
                          style={
                            level.color
                              ? {
                                  backgroundColor: `${level.color}15`,
                                  borderColor: `${level.color}30`,
                                  color: level.color,
                                }
                              : undefined
                          }
                        >
                          {mapping.assetId.slice(0, 8)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-surface-400 italic">
                      No assets mapped
                    </p>
                  )}
                </div>

                {/* Level color indicator */}
                {level.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: level.color }}
                    title={level.name}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state when no levels */}
      {levels.length === 0 && (
        <EmptyState
          icon={Network}
          title="No levels defined"
          description="This Purdue Model has no levels defined yet."
        />
      )}
    </div>
  );
}
