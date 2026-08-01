'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft } from 'lucide-react';
import { useCreateRisk, useRiskRegisters } from '@/hooks/useRisks';
import type { RiskCategory, RiskTreatmentStrategy } from '@iec62443/shared-types';

const categoryOptions: { value: RiskCategory; label: string }[] = [
  { value: 'safety', label: 'Safety' },
  { value: 'operational', label: 'Operational' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'financial', label: 'Financial' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'regulatory', label: 'Regulatory' },
];

const treatmentOptions: { value: RiskTreatmentStrategy; label: string }[] = [
  { value: 'mitigate', label: 'Mitigate' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'accept', label: 'Accept' },
  { value: 'avoid', label: 'Avoid' },
  { value: 'pending', label: 'Pending' },
];

export default function NewRiskPage() {
  const router = useRouter();
  const createRisk = useCreateRisk();
  const { data: registersResult } = useRiskRegisters({ perPage: 100 });

  const registers = registersResult?.data ?? [];

  const [form, setForm] = useState({
    registerId: '',
    title: '',
    description: '',
    category: '' as string,
    threatSource: '',
    vulnerability: '',
    likelihood: '' as string,
    impact: '' as string,
    treatment: '' as string,
    iecRequirement: '',
    reassessBy: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.registerId) return;

    await createRisk.mutateAsync({
      registerId: form.registerId,
      title: form.title,
      description: form.description || undefined,
      category: form.category || undefined,
      threatSource: form.threatSource || undefined,
      vulnerability: form.vulnerability || undefined,
      likelihood: form.likelihood ? parseInt(form.likelihood, 10) : undefined,
      impact: form.impact ? parseInt(form.impact, 10) : undefined,
      treatment: form.treatment || undefined,
      iecRequirement: form.iecRequirement || undefined,
      reassessBy: form.reassessBy || undefined,
    });

    router.push('/risks');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/risks')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Risk Register
        </button>
        <h1 className="text-xl font-semibold text-surface-900">New Risk</h1>
        <p className="mt-1 text-sm text-surface-500">Identify a new cybersecurity risk</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">General Information</h3>
          <div className="space-y-1">
            <Label>Register *</Label>
            <Select value={form.registerId} onValueChange={(v) => setForm((f) => ({ ...f, registerId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select risk register" /></SelectTrigger>
              <SelectContent>
                {registers.map((reg) => (
                  <SelectItem key={reg.id} value={reg.id}>{reg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Unauthorized access to PLC" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Treatment Strategy</Label>
              <Select value={form.treatment} onValueChange={(v) => setForm((f) => ({ ...f, treatment: v }))}>
                <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                <SelectContent>
                  {treatmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">Threat Analysis</h3>
          <div className="space-y-1">
            <Label>Threat Source</Label>
            <Input value={form.threatSource} onChange={(e) => setForm((f) => ({ ...f, threatSource: e.target.value }))} placeholder="e.g. Nation-state actor, Malware" />
          </div>
          <div className="space-y-1">
            <Label>Vulnerability</Label>
            <Input value={form.vulnerability} onChange={(e) => setForm((f) => ({ ...f, vulnerability: e.target.value }))} placeholder="e.g. Unpatched firmware, Default credentials" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Likelihood (1–5)</Label>
              <Select value={form.likelihood} onValueChange={(v) => setForm((f) => ({ ...f, likelihood: v }))}>
                <SelectTrigger><SelectValue placeholder="Select likelihood" /></SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5'].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Impact (1–5)</Label>
              <Select value={form.impact} onValueChange={(v) => setForm((f) => ({ ...f, impact: v }))}>
                <SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                <SelectContent>
                  {['1', '2', '3', '4', '5'].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">Compliance & Review</h3>
          <div className="space-y-1">
            <Label>IEC Requirement</Label>
            <Input value={form.iecRequirement} onChange={(e) => setForm((f) => ({ ...f, iecRequirement: e.target.value }))} placeholder="e.g. SR 5.1" />
          </div>
          <div className="space-y-1">
            <Label>Reassess By</Label>
            <Input type="date" value={form.reassessBy} onChange={(e) => setForm((f) => ({ ...f, reassessBy: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/risks')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!form.title || !form.registerId} loading={createRisk.isPending}>
            Create Risk
          </Button>
        </div>
      </form>
    </div>
  );
}
