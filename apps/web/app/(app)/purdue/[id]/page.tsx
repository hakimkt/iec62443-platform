'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  MetricCard,
  EmptyState,
} from '@iec62443/ui/components';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import {
  ArrowLeft,
  Edit,
  ShieldCheck,
  Network,
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  usePurdueModel,
  usePurdueLevels,
  usePurdueAssetMappings,
  usePurdueCompliance,
} from '@/hooks/usePurdue';
import { useAssets } from '@/hooks/useAssets';
import type {
  PurdueAssetMapping,
  Asset,
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

const CRITICALITY_COLORS: Record<string, string> = {
  safety_critical: 'bg-red-100 text-red-800 border-red-200',
  mission_critical: 'bg-orange-100 text-orange-800 border-orange-200',
  business_critical: 'bg-amber-100 text-amber-800 border-amber-200',
  operational: 'bg-blue-100 text-blue-800 border-blue-200',
  non_critical: 'bg-surface-100 text-surface-600 border-surface-200',
};

const CRITICALITY_LABELS: Record<string, string> = {
  safety_critical: 'Safety',
  mission_critical: 'Mission',
  business_critical: 'Business',
  operational: 'Operational',
  non_critical: 'Non-Critical',
};

const VENDOR_COLORS: Record<string, string> = {
  Siemens: '#009999',
  Honeywell: '#FF0000',
  Emerson: '#0033A0',
  Schneider: '#3CD52E',
  ABB: '#FF000F',
  Rockwell: '#E31937',
  Yokogawa: '#003366',
  'Fortinet': '#EE3124',
  'Palo Alto': '#FA582D',
  Cisco: '#049FD9',
  Microsoft: '#00A4EF',
  'CrowdStrike': '#FF0000',
};

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

  // Fetch all assets to get names/details (not just UUIDs)
  const { data: assetsResult } = useAssets({ perPage: 500 });

  // Use custom levels if available, otherwise fall back to standard levels
  const levels = useMemo(() => {
    if (customLevels && customLevels.length > 0) {
      return [...customLevels].sort((a, b) => b.levelNumber - a.levelNumber);
    }
    return STANDARD_LEVELS;
  }, [customLevels]);

  // Build asset lookup map
  const assetMap = useMemo(() => {
    const map = new Map<string, Asset>();
    if (assetsResult?.data) {
      for (const asset of assetsResult.data) {
        map.set(asset.id, asset);
      }
    }
    return map;
  }, [assetsResult]);

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

  // Get assets for a level
  const getAssetsForLevel = (levelId: string): Asset[] => {
    const levelMappings = mappingsByLevel.get(levelId) ?? [];
    return levelMappings
      .map((m) => assetMap.get(m.assetId))
      .filter((a): a is Asset => !!a);
  };

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
          <MetricCard
            label="Total Assets"
            value={mappings?.length ?? 0}
            color="blue"
          />
          <MetricCard
            label="Levels"
            value={levels.length}
            color="brand"
          />
        </div>
      )}

      {/* Compliance violations */}
      {compliance && compliance.violations.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Compliance Violations Detected</h3>
          </div>
          <ul className="mt-2 space-y-1">
            {compliance.violations.map((v, i) => (
              <li key={i} className="text-xs text-amber-700">
                <span className="font-medium">{v.sourceLevel}</span>
                {' → '}
                <span className="font-medium">{v.targetLevel}</span>
                {v.protocol && (
                  <span className="ml-1 text-amber-600">({v.protocol})</span>
                )}
                {v.condition && (
                  <span className="ml-1">— {v.condition}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Purdue Model Diagram */}
      <PurdueDiagram
        levels={levels}
        getAssetsForLevel={getAssetsForLevel}
      />

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

// ── Purdue Diagram Component ─────────────────────────────────────────────

interface PurdueDiagramProps {
  levels: Array<{
    id: string;
    modelId: string;
    levelNumber: number;
    name: string;
    description: string;
    color: string;
    sortOrder: number;
  }>;
  getAssetsForLevel: (levelId: string) => Asset[];
}

function PurdueDiagram({
  levels,
  getAssetsForLevel,
}: PurdueDiagramProps) {
  const [search, setSearch] = useState('');
  const [filterCriticality, setFilterCriticality] = useState<string>('');
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [filterVendor, setFilterVendor] = useState<string>('');

  // Collect all unique vendors and criticalities for filters
  const allVendors = useMemo(() => {
    const vendors = new Set<string>();
    for (const level of levels) {
      for (const asset of getAssetsForLevel(level.id)) {
        if (asset.vendor) vendors.add(asset.vendor);
      }
    }
    return [...vendors].sort();
  }, [levels, getAssetsForLevel]);

  const allCriticalities = useMemo(() => {
    const crits = new Set<string>();
    for (const level of levels) {
      for (const asset of getAssetsForLevel(level.id)) {
        if (asset.criticality) crits.add(asset.criticality);
      }
    }
    return [...crits].sort();
  }, [levels, getAssetsForLevel]);

  // Filter assets for a level
  const getFilteredAssets = (levelId: string): Asset[] => {
    let assets = getAssetsForLevel(levelId);
    if (search) {
      const s = search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          (a.vendor && a.vendor.toLowerCase().includes(s)) ||
          (a.model && a.model.toLowerCase().includes(s)) ||
          (a.type && a.type.toLowerCase().includes(s)),
      );
    }
    if (filterCriticality) {
      assets = assets.filter((a) => a.criticality === filterCriticality);
    }
    if (filterVendor) {
      assets = assets.filter((a) => a.vendor === filterVendor);
    }
    return assets;
  };

  // Total filtered count across all levels
  const totalFiltered = useMemo(() => {
    return levels.reduce((sum, level) => sum + getFilteredAssets(level.id).length, 0);
  }, [levels, search, filterCriticality, filterVendor, getFilteredAssets]);

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) {
        next.delete(levelId);
      } else {
        next.add(levelId);
      }
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 overflow-hidden">
      <div className="border-b border-surface-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-surface-700">
              Purdue Model Diagram
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Network segmentation levels — L5 at top, L0 at bottom
            </p>
          </div>
          <span className="text-xs text-surface-500">
            {totalFiltered} asset{totalFiltered !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-surface-200 bg-surface-0 pl-8 pr-3 text-xs text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="h-8 rounded-md border border-surface-200 bg-surface-0 px-2 text-xs text-surface-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Criticality</option>
            {allCriticalities.map((c) => (
              <option key={c} value={c}>
                {CRITICALITY_LABELS[c] ?? c.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            className="h-8 rounded-md border border-surface-200 bg-surface-0 px-2 text-xs text-surface-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Vendors</option>
            {allVendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-surface-200">
        {levels.map((level) => {
          const allAssets = getAssetsForLevel(level.id);
          const filteredAssets = getFilteredAssets(level.id);
          const isExpanded = expandedLevels.has(level.id);
          const hasAssets = allAssets.length > 0;
          const hasFilteredAssets = filteredAssets.length > 0;

          return (
            <div
              key={level.id}
              className={cn(
                'transition-colors',
                hasFilteredAssets ? 'bg-surface-0' : 'bg-surface-50/50',
              )}
              style={{
                borderLeft: level.color
                  ? `4px solid ${level.color}`
                  : undefined,
              }}
            >
              {/* Level header — always visible */}
              <button
                type="button"
                onClick={() => toggleLevel(level.id)}
                className="flex w-full items-start gap-4 px-6 py-3 text-left hover:bg-surface-50/80 transition-colors"
              >
                {/* Level label */}
                <div className="flex flex-col items-center w-16 shrink-0">
                  <span
                    className="text-lg font-bold"
                    style={level.color ? { color: level.color } : undefined}
                  >
                    L{level.levelNumber}
                  </span>
                  <span className="text-[10px] text-surface-500 text-center leading-tight mt-0.5">
                    {level.name}
                  </span>
                </div>

                {/* Level description and asset count */}
                <div className="flex-1 min-w-0">
                  {level.description && (
                    <p className="text-xs text-surface-500 mb-1">
                      {level.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {hasAssets && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={
                          level.color
                            ? {
                                backgroundColor: `${level.color}15`,
                                color: level.color,
                              }
                            : undefined
                        }
                      >
                        {allAssets.length} asset{allAssets.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {hasAssets && (
                      <VendorBadges assets={allAssets} levelColor={level.color} />
                    )}
                  </div>
                </div>

                {/* Expand/collapse indicator */}
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
                  {hasFilteredAssets ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-surface-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-surface-400" />
                    )
                  ) : (
                    <span className="text-xs text-surface-400 italic">
                      No assets
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded asset list */}
              {isExpanded && hasFilteredAssets && (
                <div className="px-6 pb-4 pl-[5.5rem]">
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                      />
                    ))}
                  </div>
                  {filteredAssets.length < allAssets.length && (
                    <p className="mt-2 text-xs text-surface-400">
                      Showing {filteredAssets.length} of {allAssets.length} assets
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Vendor Badges (compact summary) ──────────────────────────────────────

function VendorBadges({ assets, levelColor }: { assets: Asset[]; levelColor?: string }) {
  const vendorCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of assets) {
      if (a.vendor) {
        map.set(a.vendor, (map.get(a.vendor) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Show top 5 vendors
  }, [assets]);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {vendorCounts.map(([vendor, count]) => (
        <span
          key={vendor}
          className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border"
          style={{
            backgroundColor: levelColor ? `${levelColor}08` : undefined,
            borderColor: levelColor ? `${levelColor}20` : undefined,
            color: VENDOR_COLORS[vendor] ?? (levelColor || '#64748b'),
          }}
          title={`${vendor}: ${count} asset${count !== 1 ? 's' : ''}`}
        >
          {vendor}
          {count > 1 && <span className="ml-0.5 opacity-70">×{count}</span>}
        </span>
      ))}
    </div>
  );
}

// ── Asset Card (individual asset in expanded view) ────────────────────────

function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-surface-200 bg-surface-0 px-2.5 py-2"
    >
      {/* Criticality indicator */}
      <div
        className={cn(
          'mt-0.5 h-2 w-2 rounded-full shrink-0',
          asset.criticality === 'safety_critical' && 'bg-red-500',
          asset.criticality === 'mission_critical' && 'bg-orange-500',
          asset.criticality === 'business_critical' && 'bg-amber-500',
          asset.criticality === 'operational' && 'bg-blue-400',
          asset.criticality === 'non_critical' && 'bg-surface-300',
        )}
        title={asset.criticality ?? ''}
      />

      <div className="flex-1 min-w-0">
        {/* Asset name */}
        <p className="text-xs font-medium text-surface-900 truncate">
          {asset.name}
        </p>

        {/* Vendor / Model */}
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {asset.vendor && (
            <span
              className="text-[10px] font-medium"
              style={{ color: VENDOR_COLORS[asset.vendor] ?? '#64748b' }}
            >
              {asset.vendor}
            </span>
          )}
          {asset.model && (
            <span className="text-[10px] text-surface-400 truncate">
              {asset.vendor ? '· ' : ''}{asset.model}
            </span>
          )}
        </div>

        {/* Status / Type badges */}
        <div className="flex items-center gap-1 mt-1">
          <span className={cn(
            'inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium border',
            CRITICALITY_COLORS[asset.criticality ?? ''] ?? 'bg-surface-100 text-surface-600 border-surface-200',
          )}>
            {CRITICALITY_LABELS[asset.criticality ?? ''] ?? asset.criticality}
          </span>
          {asset.operationalStatus !== 'operational' && (
            <span className="inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {asset.operationalStatus}
            </span>
          )}
          {asset.ipAddress && (
            <span className="text-[9px] text-surface-400 font-mono">
              {asset.ipAddress}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
