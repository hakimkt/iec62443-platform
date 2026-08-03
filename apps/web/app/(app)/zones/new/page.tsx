'use client';

import type { ZoneType } from '@iec62443/shared-types';
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
import { useCreateZone } from '@/hooks/useZones';

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

export default function NewZonePage() {
  const router = useRouter();
  const createZone = useCreateZone();

  const [form, setForm] = useState({
    name: '',
    description: '',
    zoneType: '' as string,
    securityLevel: '' as string,
    purdueLevel: '' as string,
    color: '#3b82f6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    await createZone.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      zoneType: form.zoneType || undefined,
      securityLevel: form.securityLevel ? parseInt(form.securityLevel, 10) : undefined,
      purdueLevel: form.purdueLevel ? parseInt(form.purdueLevel, 10) : undefined,
      color: form.color || undefined,
    });

    router.push('/zones');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/zones')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Zones &amp; Conduits
        </button>
        <h1 className="text-xl font-semibold text-surface-900">New Zone</h1>
        <p className="mt-1 text-sm text-surface-500">
          Define a new security zone per IEC 62443-3-3
        </p>
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
              <Label>Zone Type</Label>
              <Select
                value={form.zoneType}
                onValueChange={(v) => setForm((f) => ({ ...f, zoneType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone type" />
                </SelectTrigger>
                <SelectContent>
                  {zoneTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Security Level</Label>
              <Select
                value={form.securityLevel}
                onValueChange={(v) => setForm((f) => ({ ...f, securityLevel: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SL" />
                </SelectTrigger>
                <SelectContent>
                  {['0', '1', '2', '3', '4'].map((l) => (
                    <SelectItem key={l} value={l}>
                      SL {l}
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
                    {purdueLevelLabels[parseInt(l, 10)]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-9 w-9 cursor-pointer rounded border border-surface-200"
              />
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/zones')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.name}
            loading={createZone.isPending}
          >
            Create Zone
          </Button>
        </div>
      </form>
    </div>
  );
}
