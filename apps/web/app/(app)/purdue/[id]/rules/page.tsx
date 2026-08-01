'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  DataTable,
  EmptyState,
} from '@iec62443/ui/components';
import type { Column } from '@iec62443/ui/components';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft, Plus, Shield } from 'lucide-react';
import {
  useCommunicationRules,
  usePurdueLevels,
  useCreateCommunicationRule,
} from '@/hooks/usePurdue';
import type { CommunicationRule } from '@iec62443/shared-types';

export default function CommunicationRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: modelId } = use(params);
  const [showForm, setShowForm] = useState(false);

  const { data: rules, isLoading } = useCommunicationRules(modelId);
  const { data: levels } = usePurdueLevels(modelId);
  const createRule = useCreateCommunicationRule();

  // Build a lookup for level names
  const levelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (levels) {
      for (const lvl of levels) {
        map.set(lvl.id, `L${lvl.levelNumber} — ${lvl.name}`);
      }
    }
    return map;
  }, [levels]);

  // Form state
  const [form, setForm] = useState({
    sourceLevelId: '',
    targetLevelId: '',
    isAllowed: true,
    condition: '',
    protocol: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceLevelId || !form.targetLevelId) return;

    await createRule.mutateAsync({
      modelId,
      sourceLevelId: form.sourceLevelId,
      targetLevelId: form.targetLevelId,
      isAllowed: form.isAllowed,
      condition: form.condition || undefined,
      protocol: form.protocol || undefined,
    });

    setForm({
      sourceLevelId: '',
      targetLevelId: '',
      isAllowed: true,
      condition: '',
      protocol: '',
    });
    setShowForm(false);
  };

  const columns: Column<CommunicationRule>[] = [
    {
      key: 'sourceLevelId',
      header: 'Source Level',
      render: (_value: unknown, row: CommunicationRule) => (
        <span className="text-sm text-surface-700">
          {levelNameMap.get(row.sourceLevelId) ?? row.sourceLevelId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'targetLevelId',
      header: 'Target Level',
      render: (_value: unknown, row: CommunicationRule) => (
        <span className="text-sm text-surface-700">
          {levelNameMap.get(row.targetLevelId) ?? row.targetLevelId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'isAllowed',
      header: 'Allowed',
      render: (_value: unknown, row: CommunicationRule) => (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            row.isAllowed
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700',
          )}
        >
          {row.isAllowed ? 'Allowed' : 'Blocked'}
        </span>
      ),
    },
    {
      key: 'condition',
      header: 'Condition',
      render: (_value: unknown, row: CommunicationRule) => (
        <span className="text-sm text-surface-600">
          {row.condition || '—'}
        </span>
      ),
    },
    {
      key: 'protocol',
      header: 'Protocol',
      render: (_value: unknown, row: CommunicationRule) => (
        <span className="text-sm font-mono text-surface-600">
          {row.protocol || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/purdue/${modelId}`}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Purdue Model
        </Link>
        <PageHeader
          title="Communication Rules"
          description="Define allowed and blocked communication paths between Purdue levels"
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowForm(!showForm)}
            >
              New Rule
            </Button>
          }
        />
      </div>

      {/* Create rule form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4"
        >
          <h3 className="text-sm font-medium text-surface-700">
            Create Communication Rule
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Source Level *</Label>
              <Select
                value={form.sourceLevelId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sourceLevelId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source level" />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((lvl) => (
                    <SelectItem key={lvl.id} value={lvl.id}>
                      L{lvl.levelNumber} — {lvl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Target Level *</Label>
              <Select
                value={form.targetLevelId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, targetLevelId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target level" />
                </SelectTrigger>
                <SelectContent>
                  {levels?.map((lvl) => (
                    <SelectItem key={lvl.id} value={lvl.id}>
                      L{lvl.levelNumber} — {lvl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.isAllowed ? 'allowed' : 'blocked'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, isAllowed: v === 'allowed' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">Allowed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Protocol</Label>
              <Input
                value={form.protocol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, protocol: e.target.value }))
                }
                placeholder="e.g. OPC UA, HTTPS"
              />
            </div>

            <div className="space-y-1">
              <Label>Condition</Label>
              <Input
                value={form.condition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, condition: e.target.value }))
                }
                placeholder="e.g. via DMZ only"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!form.sourceLevelId || !form.targetLevelId}
              loading={createRule.isPending}
            >
              Create Rule
            </Button>
          </div>
        </form>
      )}

      {/* Rules table */}
      <DataTable<CommunicationRule>
        columns={columns}
        data={rules ?? []}
        keyExtractor={(row: CommunicationRule) => row.id}
        loading={isLoading}
        emptyMessage="No communication rules defined"
      />

      {/* Empty state when no rules */}
      {!isLoading && (!rules || rules.length === 0) && (
        <EmptyState
          icon={Shield}
          title="No communication rules"
          description="Define rules to control communication between Purdue levels."
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowForm(true)}
            >
              New Rule
            </Button>
          }
        />
      )}
    </div>
  );
}
