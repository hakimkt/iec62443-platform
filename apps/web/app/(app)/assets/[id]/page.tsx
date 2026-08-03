'use client';

import type { AssetCriticality, AssetType } from '@iec62443/shared-types';
import { cn } from '@iec62443/ui';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@iec62443/ui/primitives';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useAsset, useAssetRelationships, useDeleteAsset, useUpdateAsset } from '@/hooks/useAssets';

const typeOptions: { value: AssetType; label: string }[] = [
  { value: 'plc', label: 'PLC' },
  { value: 'hmi', label: 'HMI' },
  { value: 'scada_server', label: 'SCADA Server' },
  { value: 'engineering_workstation', label: 'Engineering Workstation' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Router' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'historian', label: 'Historian' },
  { value: 'server', label: 'Server' },
  { value: 'workstation', label: 'Workstation' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'actuator', label: 'Actuator' },
  { value: 'vfd', label: 'VFD' },
  { value: 'dcs_controller', label: 'DCS Controller' },
  { value: 'rtu', label: 'RTU' },
  { value: 'safety_controller', label: 'Safety Controller' },
  { value: 'other', label: 'Other' },
];

const criticalityOptions: { value: AssetCriticality; label: string }[] = [
  { value: 'safety_critical', label: 'Safety Critical' },
  { value: 'mission_critical', label: 'Mission Critical' },
  { value: 'business_critical', label: 'Business Critical' },
  { value: 'operational', label: 'Operational' },
  { value: 'non_critical', label: 'Non-Critical' },
];

const purdueLevelLabels: Record<number, string> = {
  0: 'L0 — Physical Process',
  1: 'L1 — Basic Control',
  2: 'L2 — Area Supervisory',
  3: 'L3 — Manufacturing Operations',
  4: 'L4 — Enterprise Network',
  5: 'L5 — External Network',
};

type TabKey = 'details' | 'relationships';

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isEditing, setIsEditing] = useState(false);

  const { data: asset, isLoading } = useAsset(assetId);
  const { data: relationships } = useAssetRelationships(assetId);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const handleEdit = () => {
    if (!asset) return;
    setFormState({
      name: asset.name,
      description: asset.description ?? '',
      type: asset.type,
      criticality: asset.criticality,
      vendor: asset.vendor ?? '',
      model: asset.model ?? '',
      firmwareVersion: asset.firmwareVersion ?? '',
      serialNumber: asset.serialNumber ?? '',
      ipAddress: asset.ipAddress ?? '',
      macAddress: asset.macAddress ?? '',
      networkSegment: asset.networkSegment ?? '',
      purdueLevel: asset.purdueLevel,
      location: asset.location ?? '',
      operationalStatus: asset.operationalStatus,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateAsset.mutateAsync({ id: assetId, ...formState });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteAsset.mutateAsync(assetId);
    router.push('/assets');
  };

  if (isLoading || !asset) {
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
            href="/assets"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Asset Inventory
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">{asset.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant="completed" size="sm">
              {asset.type.replace(/_/g, ' ')}
            </Badge>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                asset.criticality === 'safety_critical'
                  ? 'bg-red-100 text-red-700'
                  : asset.criticality === 'mission_critical'
                    ? 'bg-orange-100 text-orange-700'
                    : asset.criticality === 'business_critical'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700',
              )}
            >
              {asset.criticality.replace(/_/g, ' ')}
            </span>
            <Badge
              variant={asset.operationalStatus === 'operational' ? 'completed' : 'in_progress'}
              size="sm"
            >
              {asset.operationalStatus.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={updateAsset.isPending}
                icon={Save}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleteAsset.isPending}
                icon={Trash2}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Asset sections">
          {[
            { key: 'details' as TabKey, label: 'Details' },
            { key: 'relationships' as TabKey, label: 'Relationships' },
          ].map((tab) => (
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
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">General Information</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={String(formState['name'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={String(formState['description'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select
                    value={String(formState['type'] ?? '')}
                    onValueChange={(v) => setFormState((s) => ({ ...s, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Criticality</Label>
                  <Select
                    value={String(formState['criticality'] ?? '')}
                    onValueChange={(v) => setFormState((s) => ({ ...s, criticality: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {criticalityOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Name</dt>
                  <dd className="text-sm text-surface-900">{asset.name}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Description</dt>
                  <dd className="text-sm text-surface-900">{asset.description || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Type</dt>
                  <dd className="text-sm text-surface-900">{asset.type.replace(/_/g, ' ')}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Criticality</dt>
                  <dd className="text-sm text-surface-900">
                    {asset.criticality.replace(/_/g, ' ')}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Technical Details</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Vendor</Label>
                  <Input
                    value={String(formState['vendor'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, vendor: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Model</Label>
                  <Input
                    value={String(formState['model'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, model: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Firmware Version</Label>
                  <Input
                    value={String(formState['firmwareVersion'] ?? '')}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, firmwareVersion: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Serial Number</Label>
                  <Input
                    value={String(formState['serialNumber'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, serialNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>IP Address</Label>
                  <Input
                    value={String(formState['ipAddress'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, ipAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>MAC Address</Label>
                  <Input
                    value={String(formState['macAddress'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, macAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={String(formState['location'] ?? '')}
                    onChange={(e) => setFormState((s) => ({ ...s, location: e.target.value }))}
                  />
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Vendor</dt>
                  <dd className="text-sm text-surface-900">{asset.vendor || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Model</dt>
                  <dd className="text-sm text-surface-900">{asset.model || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Firmware</dt>
                  <dd className="text-sm text-surface-900">{asset.firmwareVersion || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Serial</dt>
                  <dd className="text-sm font-mono text-surface-900">
                    {asset.serialNumber || '—'}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">IP Address</dt>
                  <dd className="text-sm font-mono text-surface-900">{asset.ipAddress || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">MAC Address</dt>
                  <dd className="text-sm font-mono text-surface-900">{asset.macAddress || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Purdue Level</dt>
                  <dd className="text-sm text-surface-900">
                    {asset.purdueLevel !== null
                      ? (purdueLevelLabels[asset.purdueLevel] ?? `L${asset.purdueLevel}`)
                      : '—'}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Location</dt>
                  <dd className="text-sm text-surface-900">{asset.location || '—'}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Status</dt>
                  <dd className="text-sm text-surface-900">
                    {asset.operationalStatus.replace(/_/g, ' ')}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      )}

      {/* Relationships tab */}
      {activeTab === 'relationships' && (
        <div className="space-y-3">
          {relationships && relationships.length > 0 ? (
            relationships.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-700">
                    {rel.relationshipType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-surface-500">
                    {rel.protocol ? `Protocol: ${rel.protocol}` : 'No protocol specified'}
                  </p>
                </div>
                <span className="text-xs text-surface-400">
                  {new Date(rel.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-surface-500">
              No relationships configured for this asset.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
