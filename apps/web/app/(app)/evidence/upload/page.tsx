'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft } from 'lucide-react';
import { useCreateEvidence } from '@/hooks/useEvidence';
import type { EvidenceType } from '@iec62443/shared-types';

const typeOptions: { value: EvidenceType; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'config', label: 'Configuration' },
  { value: 'log', label: 'Log File' },
  { value: 'scan_result', label: 'Scan Result' },
  { value: 'network_capture', label: 'Network Capture' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'interview', label: 'Interview' },
  { value: 'other', label: 'Other' },
];

export default function UploadEvidencePage() {
  const router = useRouter();
  const createEvidence = useCreateEvidence();

  const [form, setForm] = useState({
    title: '',
    description: '',
    evidenceType: '' as string,
    retentionUntil: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.evidenceType) return;

    await createEvidence.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      evidenceType: form.evidenceType,
      retentionUntil: form.retentionUntil || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    });

    router.push('/evidence');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/evidence')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Evidence Repository
        </button>
        <h1 className="text-xl font-semibold text-surface-900">Upload Evidence</h1>
        <p className="mt-1 text-sm text-surface-500">Create a new evidence record</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">Evidence Details</h3>
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Evidence Type *</Label>
              <Select value={form.evidenceType} onValueChange={(v) => setForm((f) => ({ ...f, evidenceType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Retention Until</Label>
              <Input
                type="date"
                value={form.retentionUntil}
                onChange={(e) => setForm((f) => ({ ...f, retentionUntil: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. firewall, compliance, quarterly" />
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-8 text-center">
          <p className="text-sm text-surface-500">File upload will be available after storage backend configuration.</p>
          <p className="mt-1 text-xs text-surface-400">Evidence records can be created with metadata only for now.</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/evidence')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!form.title || !form.evidenceType} loading={createEvidence.isPending}>
            Create Evidence
          </Button>
        </div>
      </form>
    </div>
  );
}
