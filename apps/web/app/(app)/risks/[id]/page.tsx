'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { Badge } from '@iec62443/ui/primitives';
import { Separator } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Textarea } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft, Save, Trash2, Plus, Shield } from 'lucide-react';
import { cn } from '@iec62443/ui';
import Link from 'next/link';
import {
  useRisk,
  useUpdateRisk,
  useDeleteRisk,
  useRiskTreatments,
  useCreateRiskTreatment,
  useRiskAcceptances,
} from '@/hooks/useRisks';
import type { RiskCategory, RiskLevel, RiskEntryStatus, RiskTreatmentStrategy } from '@iec62443/shared-types';

const categoryLabels: Record<RiskCategory, string> = {
  safety: 'Safety',
  operational: 'Operational',
  environmental: 'Environmental',
  financial: 'Financial',
  reputational: 'Reputational',
  regulatory: 'Regulatory',
};

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

const statusOptions: { value: RiskEntryStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'analyzed', label: 'Analyzed' },
  { value: 'treated', label: 'Treated' },
  { value: 'monitored', label: 'Monitored' },
  { value: 'closed', label: 'Closed' },
  { value: 'accepted', label: 'Accepted' },
];

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const treatmentStatusColors: Record<string, string> = {
  planned: 'bg-surface-100 text-surface-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-surface-100 text-surface-500',
};

type TabKey = 'details' | 'treatments';

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: riskId } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [isEditing, setIsEditing] = useState(false);

  const { data: risk, isLoading } = useRisk(riskId);
  const { data: treatments } = useRiskTreatments(riskId);
  const { data: acceptances } = useRiskAcceptances(riskId);
  const updateRisk = useUpdateRisk();
  const deleteRisk = useDeleteRisk();
  const createTreatment = useCreateRiskTreatment();

  const [formState, setFormState] = useState<Record<string, unknown>>({});

  const [showNewTreatment, setShowNewTreatment] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    type: '',
    description: '',
    targetDate: '',
    costEstimate: '',
  });

  const handleEdit = () => {
    if (!risk) return;
    setFormState({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      threatSource: risk.threatSource,
      vulnerability: risk.vulnerability,
      likelihood: risk.likelihood,
      impact: risk.impact,
      treatment: risk.treatment,
      iecRequirement: risk.iecRequirement,
      status: risk.status,
      reassessBy: risk.reassessBy ?? '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateRisk.mutateAsync({ id: riskId, ...formState });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteRisk.mutateAsync(riskId);
    router.push('/risks');
  };

  const handleCreateTreatment = async () => {
    if (!newTreatment.type || !newTreatment.description) return;
    await createTreatment.mutateAsync({
      riskId,
      type: newTreatment.type,
      description: newTreatment.description,
      targetDate: newTreatment.targetDate || undefined,
      costEstimate: newTreatment.costEstimate ? parseFloat(newTreatment.costEstimate) : undefined,
    });
    setNewTreatment({ type: '', description: '', targetDate: '', costEstimate: '' });
    setShowNewTreatment(false);
  };

  if (isLoading || !risk) {
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
            href="/risks"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Risk Register
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">{risk.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={risk.status === 'closed' ? 'archived' : risk.status === 'monitored' || risk.status === 'accepted' ? 'completed' : 'in_progress'} size="sm">
              {risk.status}
            </Badge>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded', riskLevelColors[risk.riskLevel])}>
              {risk.riskLevel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} loading={updateRisk.isPending} icon={Save}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleEdit}>Edit</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteRisk.isPending} icon={Trash2}>Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 text-center">
          <p className="text-xs text-surface-500">Inherent Score</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{risk.inherentScore}</p>
          <p className="text-xs text-surface-400">{risk.likelihood} × {risk.impact}</p>
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 text-center">
          <p className="text-xs text-surface-500">Residual Score</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{risk.residualScore ?? '—'}</p>
          {risk.residualScore !== null && (
            <p className="text-xs text-surface-400">{risk.residualLikelihood} × {risk.residualImpact}</p>
          )}
        </div>
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 text-center">
          <p className="text-xs text-surface-500">Risk Level</p>
          <p className="mt-2">
            <span className={cn('text-sm font-medium px-3 py-1 rounded', riskLevelColors[risk.riskLevel])}>
              {risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="Risk sections">
          {([
            { key: 'details' as TabKey, label: 'Details' },
            { key: 'treatments' as TabKey, label: 'Treatments' },
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
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Risk Assessment</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={String(formState['title'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={String(formState['description'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={String(formState['category'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={String(formState['status'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Threat Source</Label>
                  <Input value={String(formState['threatSource'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, threatSource: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Vulnerability</Label>
                  <Input value={String(formState['vulnerability'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, vulnerability: e.target.value }))} />
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Title</dt><dd className="text-sm text-surface-900">{risk.title}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Description</dt><dd className="text-sm text-surface-900 max-w-[60%] text-right">{risk.description || '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Category</dt><dd className="text-sm text-surface-900">{categoryLabels[risk.category] ?? risk.category}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Threat Source</dt><dd className="text-sm text-surface-900">{risk.threatSource || '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Vulnerability</dt><dd className="text-sm text-surface-900">{risk.vulnerability || '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Status</dt><dd className="text-sm text-surface-900 capitalize">{risk.status}</dd></div>
              </dl>
            )}
          </div>

          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h3 className="text-sm font-medium text-surface-700">Scoring & Compliance</h3>
            {isEditing ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Likelihood (1–5)</Label>
                    <Select value={String(formState['likelihood'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, likelihood: parseInt(v, 10) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '4', '5'].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Impact (1–5)</Label>
                    <Select value={String(formState['impact'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, impact: parseInt(v, 10) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['1', '2', '3', '4', '5'].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Treatment Strategy</Label>
                  <Select value={String(formState['treatment'] ?? '')} onValueChange={(v) => setFormState((s) => ({ ...s, treatment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {treatmentOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>IEC Requirement</Label>
                  <Input value={String(formState['iecRequirement'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, iecRequirement: e.target.value }))} placeholder="e.g. SR 5.1" />
                </div>
                <div className="space-y-1">
                  <Label>Reassess By</Label>
                  <Input type="date" value={String(formState['reassessBy'] ?? '')} onChange={(e) => setFormState((s) => ({ ...s, reassessBy: e.target.value }))} />
                </div>
              </div>
            ) : (
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Likelihood</dt><dd className="text-sm text-surface-900">{risk.likelihood}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Impact</dt><dd className="text-sm text-surface-900">{risk.impact}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Inherent Score</dt><dd className="text-sm font-semibold text-surface-900">{risk.inherentScore}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Residual Score</dt><dd className="text-sm text-surface-900">{risk.residualScore ?? '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Treatment</dt><dd className="text-sm text-surface-900 capitalize">{risk.treatment}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">IEC Requirement</dt><dd className="text-sm font-mono text-surface-900">{risk.iecRequirement || '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Reassess By</dt><dd className="text-sm text-surface-900">{risk.reassessBy ? new Date(risk.reassessBy).toLocaleDateString() : '—'}</dd></div>
                <Separator />
                <div className="flex justify-between"><dt className="text-sm text-surface-500">Identified At</dt><dd className="text-sm text-surface-900">{new Date(risk.identifiedAt).toLocaleDateString()}</dd></div>
              </dl>
            )}
          </div>
        </div>
      )}

      {/* Treatments tab */}
      {activeTab === 'treatments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-surface-700">Risk Treatments</h3>
            <Button variant="secondary" icon={Plus} onClick={() => setShowNewTreatment(true)}>
              Add Treatment
            </Button>
          </div>

          {showNewTreatment && (
            <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4 space-y-3">
              <h4 className="text-sm font-medium text-surface-700">New Treatment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Input value={newTreatment.type} onChange={(e) => setNewTreatment((t) => ({ ...t, type: e.target.value }))} placeholder="e.g. Safeguard implementation" />
                </div>
                <div className="space-y-1">
                  <Label>Target Date</Label>
                  <Input type="date" value={newTreatment.targetDate} onChange={(e) => setNewTreatment((t) => ({ ...t, targetDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={newTreatment.description} onChange={(e) => setNewTreatment((t) => ({ ...t, description: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Cost Estimate</Label>
                <Input type="number" value={newTreatment.costEstimate} onChange={(e) => setNewTreatment((t) => ({ ...t, costEstimate: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowNewTreatment(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleCreateTreatment} loading={createTreatment.isPending} disabled={!newTreatment.type || !newTreatment.description}>Create</Button>
              </div>
            </div>
          )}

          {treatments && treatments.length > 0 ? (
            treatments.map((treatment) => (
              <div key={treatment.id} className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-0 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Shield className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-700">{treatment.type}</p>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded', treatmentStatusColors[treatment.status] ?? 'bg-surface-100 text-surface-600')}>
                      {treatment.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{treatment.description}</p>
                </div>
                <div className="text-right">
                  {treatment.targetDate && (
                    <p className="text-xs text-surface-500">Target: {new Date(treatment.targetDate).toLocaleDateString()}</p>
                  )}
                  {treatment.costEstimate !== null && treatment.costEstimate !== undefined && (
                    <p className="text-xs text-surface-500">Cost: ${treatment.costEstimate.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            !showNewTreatment && (
              <p className="py-8 text-center text-sm text-surface-500">No treatments configured for this risk.</p>
            )
          )}

          {/* Acceptances */}
          {acceptances && acceptances.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-surface-700 mb-3">Acceptance Records</h3>
              {acceptances.map((acceptance) => (
                <div key={acceptance.id} className="rounded-lg border border-surface-200 bg-surface-0 p-4 mb-3">
                  <p className="text-sm text-surface-700">{acceptance.justification}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-surface-500">
                    {acceptance.expiresAt && (
                      <span>Expires: {new Date(acceptance.expiresAt).toLocaleDateString()}</span>
                    )}
                    {acceptance.reviewDate && (
                      <span>Review: {new Date(acceptance.reviewDate).toLocaleDateString()}</span>
                    )}
                    <span>Accepted: {new Date(acceptance.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
