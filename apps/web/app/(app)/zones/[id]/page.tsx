'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@iec62443/ui/primitives';
import { Badge } from '@iec62443/ui/primitives';
import { Separator } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { SecurityLevelBadge } from '@iec62443/ui/components';
import { ArrowLeft, Save, Trash2, X, Network, Box } from 'lucide-react';
import {
  useZone,
  useUpdateZone,
  useDeleteZone,
  useConduits,
  useZoneMemberships,
  useRemoveZoneMembership,
} from '@/hooks/useZones';
import type { ZoneType } from '@iec62443/shared-types';

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

const zoneTypeOptions: { value: ZoneType; label: string }[] = [
  { value: 'process_control', label: 'Process Control' },
  { value: 'safety_instrumented', label: 'Safety Instrumented' },
  { value: 'manufacturing_ops', label: 'Manufacturing Ops' },
  { value: 'enterprise_it', label: 'Enterprise IT' },
  { value: 'idmz', label: 'IDMZ' },
  { value: 'remote_access', label: 'Remote Access' },
  { value: 'wireless', label: 'Wireless' },
  { value: 'custom', label: 'Custom' },
];

const purdueLevelLabels: Record<number, string> = {
  0: 'L0 — Process',
  1: 'L1 — Basic Control',
  2: 'L2 — Supervisory',
  3: 'L3 — Operations',
  4: 'L4 — Enterprise',
  5: 'L5 — External',
};

type TabKey = 'details' | 'memberships';

export default function ZoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: zoneId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isEditing, setIsEditing] = useState(false);

  const { data: zone, isLoading } = useZone(zoneId);
  const { data: conduitsResult } = useConduits({ zoneId });
  const { data: memberships } = useZoneMemberships(zoneId);
  const removeMembership = useRemoveZoneMembership();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const conduits = conduitsResult?.data ?? [];

  const handleEdit = () => {
    if (!zone) return;
    setFormState({
      name: zone.name,
      description: zone.description ?? '',
      zoneType: zone.zoneType,
      securityLevel: zone.securityLevel,
      purdueLevel: zone.purdueLevel,
      color: zone.color ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateZone.mutateAsync({ id: zoneId, ...formState });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteZone.mutateAsync(zoneId);
    router.push('/zones');
  };

  const handleRemoveMembership = async (assetId: string) => {
    await removeMembership.mutateAsync({ zoneId, assetId });
  };

  if (isLoading || !zone) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/zones"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Zones &amp; Conduits
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">{zone.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="completed" size="sm">
              {zoneTypeLabels[zone.zoneType as ZoneType] ?? zone.zoneType}
            </Badge>
            <SecurityLevelBadge level={zone.securityLevel} size="sm" />
            {zone.purdueLevel !== null && (
              <Badge variant="in_progress" size="sm">
                {purdueLevelLabels[zone.purdueLevel] ?? `L${zone.purdueLevel}`}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} loading={updateZone.isPending} icon={Save}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleEdit}>Edit</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteZone.isPending} icon={Trash2}>Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Zone sections">
          {([
            { key: 'details' as TabKey, label: 'Details' },
            { key: 'memberships' as TabKey, label: 'Memberships' },
          ]).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Zone Properties */}
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Zone Properties</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={String(formState['name'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={String(formState['description'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Zone Type</Label>
                    <Select value={String(formState['zoneType'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, zoneType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {zoneTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Security Level</Label>
                    <Select value={String(formState['securityLevel'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, securityLevel: parseInt(v, 10) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['0', '1', '2', '3', '4'].map((l) => (
                          <SelectItem key={l} value={l}>SL {l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Purdue Level</Label>
                    <Select value={String(formState['purdueLevel'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, purdueLevel: parseInt(v, 10) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['0', '1', '2', '3', '4', '5'].map((l) => (
                          <SelectItem key={l} value={l}>{purdueLevelLabels[parseInt(l, 10)]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={String(formState['color'] ?? '#3b82f6')}
                        onChange={(e) => setFormState((s) => ({ ...s, color: e.target.value }))}
                        className="h-9 w-9 cursor-pointer rounded border border-surface-200"
                      />
                      <Input
                        value={String(formState['color'] ?? '')}
                        onChange={(e) => setFormState((s) => ({ ...s, color: e.target.value }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Name</dt><dd className="text-sm text-surface-900">{zone.name}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Description</dt><dd className="text-sm text-surface-900">{zone.description || '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Zone Type</dt><dd className="text-sm text-surface-900">{zoneTypeLabels[zone.zoneType as ZoneType] ?? zone.zoneType}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Security Level</dt><dd className="text-sm text-surface-900"><SecurityLevelBadge level={zone.securityLevel} size="sm" /></dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Purdue Level</dt><dd className="text-sm text-surface-900">{zone.purdueLevel !== null ? purdueLevelLabels[zone.purdueLevel] ?? `L${zone.purdueLevel}` : '—'}</dd></div>
                <Separator />
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-surface-500">Color</dt>
                  <dd className="flex items-center gap-2">
                    {zone.color && (
                      <span className="h-4 w-4 rounded" style={{ backgroundColor: zone.color }} />
                    )}
                    <span className="text-sm text-surface-900">{zone.color || '—'}</span>
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Conduits */}
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Conduits</h3>
            <div className="mt-4 space-y-3">
              {conduits.length > 0 ? (
                conduits.map((conduit) => {
                  const isSource = conduit.sourceZoneId === zoneId;
                  const connectedZoneId = isSource ? conduit.targetZoneId : conduit.sourceZoneId;
                  return (
                    <div key={conduit.id} className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100">
                        <Network className="h-4 w-4 text-surface-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-surface-700">{conduit.name}</p>
                        <p className="text-xs text-surface-500">
                          {conduit.conduitType.replace(/_/g, ' ')}
                          {conduit.protocol && ` · ${conduit.protocol}`}
                          {' · '}{isSource ? 'Outbound' : 'Inbound'}
                        </p>
                      </div>
                      <SecurityLevelBadge level={conduit.securityLevel} size="sm" />
                      <Link
                        href={`/zones/${connectedZoneId}`}
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        View zone →
                      </Link>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-surface-500">No conduits connected to this zone.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Memberships tab */}
      {activeTab === 'memberships' && (
        <div className="space-y-3">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership) => (
              <div key={membership.id} className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100">
                  <Box className="h-4 w-4 text-surface-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-700">Asset {membership.assetId.slice(0, 8)}</p>
                  <p className="text-xs text-surface-500">
                    Assigned {new Date(membership.assignedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => handleRemoveMembership(membership.assetId)}
                  loading={removeMembership.isPending}
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-surface-500">No assets assigned to this zone.</p>
          )}
        </div>
      )}
    </div>
  );
}
