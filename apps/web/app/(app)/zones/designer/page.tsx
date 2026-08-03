'use client';

import type { ZoneType } from '@iec62443/shared-types';
import { EmptyState, PageHeader } from '@iec62443/ui/components';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useZoneTopology } from '@/hooks/useZones';

const zoneTypeLabels: Partial<Record<ZoneType, string>> = {
  process_control: 'Process Control',
  safety_instrumented: 'Safety Instrumented',
  manufacturing_ops: 'Manufacturing Ops',
  enterprise_it: 'Enterprise IT',
  idmz: 'IDMZ',
  remote_access: 'Remote Access',
  wireless: 'Wireless',
  custom: 'Custom',
};

const defaultZoneColors: Record<string, string> = {
  process_control: '#3b82f6',
  safety_instrumented: '#ef4444',
  manufacturing_ops: '#f59e0b',
  enterprise_it: '#10b981',
  idmz: '#8b5cf6',
  remote_access: '#ec4899',
  wireless: '#06b6d4',
  custom: '#6b7280',
};

// Grid layout: arrange zones in a grid based on their index
function getGridLayout(count: number) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

export default function TopologyDesignerPage() {
  const { data: topology, isLoading } = useZoneTopology();

  const zones = topology?.zones ?? [];
  const conduits = topology?.conduits ?? [];
  const memberships = topology?.memberships ?? [];

  // Build a map of zone id -> asset count
  const zoneAssetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of memberships) {
      counts[m.zoneId] = (counts[m.zoneId] ?? 0) + 1;
    }
    return counts;
  }, [memberships]);

  // Assign grid positions for zones without diagram coordinates
  const zonePositions = useMemo(() => {
    const { cols } = getGridLayout(zones.length);
    return zones.map((zone, index) => {
      // Use diagram coordinates if available, otherwise use grid layout
      if (zone.diagramX !== null && zone.diagramY !== null) {
        return {
          ...zone,
          x: zone.diagramX,
          y: zone.diagramY,
          width: zone.diagramWidth ?? 200,
          height: zone.diagramHeight ?? 120,
        };
      }
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        ...zone,
        x: col * 280 + 40,
        y: row * 200 + 40,
        width: 240,
        height: 120,
      };
    });
  }, [zones]);

  // Compute SVG dimensions to fit all zones
  const svgDimensions = useMemo(() => {
    if (zonePositions.length === 0) return { width: 800, height: 400 };
    const maxX = Math.max(...zonePositions.map((z) => z.x + z.width)) + 60;
    const maxY = Math.max(...zonePositions.map((z) => z.y + z.height)) + 60;
    return { width: Math.max(maxX, 800), height: Math.max(maxY, 400) };
  }, [zonePositions]);

  // Build zone id -> position lookup for conduit line rendering
  const positionMap = useMemo(() => {
    const map: Record<string, { x: number; y: number; width: number; height: number }> = {};
    for (const z of zonePositions) {
      map[z.id] = { x: z.x, y: z.y, width: z.width, height: z.height };
    }
    return map;
  }, [zonePositions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Zone Topology Designer"
          description="Visualize zone and conduit relationships"
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
        </div>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Zone Topology Designer"
          description="Visualize zone and conduit relationships"
        />
        <EmptyState
          icon={LayoutGrid}
          title="No topology to display"
          description="Create zones first, then visualize their connections here."
          action={
            <Link
              href="/zones/new"
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Create Zone
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zone Topology Designer"
        description="Visualize zone and conduit relationships per IEC 62443-3-3"
      />

      {/* Legend */}
      <div className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 px-4 py-3">
        <span className="text-xs font-medium text-surface-500">Zone Types:</span>
        {Object.entries(defaultZoneColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-surface-600">
              {zoneTypeLabels[type as ZoneType] ?? type}
            </span>
          </div>
        ))}
        <span className="ml-4 text-xs text-surface-500">—</span>
        <span className="text-xs text-surface-500">Lines = Conduits</span>
      </div>

      {/* Topology canvas */}
      <div className="overflow-auto rounded-lg border border-surface-200 bg-surface-0">
        <svg width={svgDimensions.width} height={svgDimensions.height} className="min-w-full">
          {/* Conduit lines */}
          {conduits.map((conduit) => {
            const source = positionMap[conduit.sourceZoneId];
            const target = positionMap[conduit.targetZoneId];
            if (!source || !target) return null;

            const sx = source.x + source.width / 2;
            const sy = source.y + source.height / 2;
            const tx = target.x + target.width / 2;
            const ty = target.y + target.height / 2;

            return (
              <g key={conduit.id}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray={conduit.conduitType === 'wireless' ? '6 4' : 'none'}
                />
                {/* Conduit label at midpoint */}
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2 - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-surface-500"
                >
                  {conduit.name}
                </text>
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2 + 4}
                  textAnchor="middle"
                  className="text-[9px] fill-surface-400"
                >
                  {conduit.conduitType.replace(/_/g, ' ')}
                  {conduit.protocol && ` · ${conduit.protocol}`}
                </text>
              </g>
            );
          })}

          {/* Zone boxes */}
          {zonePositions.map((zone) => {
            const color = zone.color || defaultZoneColors[zone.zoneType] || '#3b82f6';
            const assetCount = zoneAssetCounts[zone.id] ?? 0;

            return (
              <g key={zone.id}>
                <Link href={`/zones/${zone.id}`} legacyBehavior>
                  <a>
                    {/* Zone box */}
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx={8}
                      fill="white"
                      stroke={color}
                      strokeWidth={2}
                      className="cursor-pointer transition-shadow hover:shadow-md"
                    />
                    {/* Color accent bar */}
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={4}
                      rx={8}
                      fill={color}
                      clipPath="inset(0 0 0 0 round 8px 8px 0 0)"
                    />
                    {/* Zone name */}
                    <text
                      x={zone.x + 12}
                      y={zone.y + 28}
                      className="text-xs font-semibold fill-surface-900"
                    >
                      {zone.name}
                    </text>
                    {/* Zone type */}
                    <text x={zone.x + 12} y={zone.y + 44} className="text-[10px] fill-surface-500">
                      {zoneTypeLabels[zone.zoneType as ZoneType] ?? zone.zoneType}
                    </text>
                    {/* SL badge */}
                    <text
                      x={zone.x + 12}
                      y={zone.y + 60}
                      className="text-[10px] font-medium fill-surface-700"
                    >
                      SL {zone.securityLevel}
                    </text>
                    {/* Asset count */}
                    <text
                      x={zone.x + zone.width - 12}
                      y={zone.y + zone.height - 12}
                      textAnchor="end"
                      className="text-[10px] fill-surface-400"
                    >
                      {assetCount} asset{assetCount !== 1 ? 's' : ''}
                    </text>
                  </a>
                </Link>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
