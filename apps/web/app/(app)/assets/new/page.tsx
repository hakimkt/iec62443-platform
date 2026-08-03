'use client';

import type { AssetCriticality, AssetType } from '@iec62443/shared-types';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@iec62443/ui/primitives';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateAsset } from '@/hooks/useAssets';

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

export default function NewAssetPage() {
  const router = useRouter();
  const createAsset = useCreateAsset();

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: '' as string,
    criticality: '' as string,
    vendor: '',
    model: '',
    firmwareVersion: '',
    serialNumber: '',
    ipAddress: '',
    macAddress: '',
    networkSegment: '',
    location: '',
    purdueLevel: '' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type) return;

    await createAsset.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      criticality: form.criticality || undefined,
      vendor: form.vendor || undefined,
      model: form.model || undefined,
      firmwareVersion: form.firmwareVersion || undefined,
      serialNumber: form.serialNumber || undefined,
      ipAddress: form.ipAddress || undefined,
      macAddress: form.macAddress || undefined,
      networkSegment: form.networkSegment || undefined,
      location: form.location || undefined,
      purdueLevel: form.purdueLevel ? parseInt(form.purdueLevel, 10) : undefined,
    });

    router.push('/assets');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/assets')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Asset Inventory
        </button>
        <h1 className="text-xl font-semibold text-surface-900">New Asset</h1>
        <p className="mt-1 text-sm text-surface-500">Add a new asset to the inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">General Information</h3>
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
                value={form.criticality}
                onValueChange={(v) => setForm((f) => ({ ...f, criticality: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select criticality" />
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
          <div className="space-y-1">
            <Label>Purdue Level</Label>
            <Select
              value={form.purdueLevel}
              onValueChange={(v) => setForm((f) => ({ ...f, purdueLevel: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Purdue level" />
              </SelectTrigger>
              <SelectContent>
                {['0', '1', '2', '3', '4', '5'].map((l) => (
                  <SelectItem key={l} value={l}>
                    Level {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">Technical Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Vendor</Label>
              <Input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Firmware Version</Label>
              <Input
                value={form.firmwareVersion}
                onChange={(e) => setForm((f) => ({ ...f, firmwareVersion: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Serial Number</Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>IP Address</Label>
              <Input
                value={form.ipAddress}
                onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                placeholder="e.g. 192.168.1.10"
              />
            </div>
            <div className="space-y-1">
              <Label>MAC Address</Label>
              <Input
                value={form.macAddress}
                onChange={(e) => setForm((f) => ({ ...f, macAddress: e.target.value }))}
                placeholder="e.g. AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div className="space-y-1">
              <Label>Network Segment</Label>
              <Input
                value={form.networkSegment}
                onChange={(e) => setForm((f) => ({ ...f, networkSegment: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/assets')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.name || !form.type}
            loading={createAsset.isPending}
          >
            Create Asset
          </Button>
        </div>
      </form>
    </div>
  );
}
