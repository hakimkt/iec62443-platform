'use client';

import { PageHeader } from '@iec62443/ui/components';
import { Button, Input, Label, Textarea } from '@iec62443/ui/primitives';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreatePurdueModel } from '@/hooks/usePurdue';

export default function NewPurdueModelPage() {
  const router = useRouter();
  const createModel = useCreatePurdueModel();

  const [form, setForm] = useState({
    name: '',
    description: '',
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    await createModel.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      isDefault: form.isDefault,
    });

    router.push('/purdue');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/purdue')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Purdue Models
        </button>
        <PageHeader
          title="New Purdue Model"
          description="Create a new network segmentation model"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
          <h3 className="text-sm font-medium text-surface-700">General Information</h3>

          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Plant A Purdue Model"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe the scope and purpose of this Purdue Model"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            <Label htmlFor="isDefault">Set as default model</Label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.push('/purdue')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!form.name}
            loading={createModel.isPending}
          >
            Create Model
          </Button>
        </div>
      </form>
    </div>
  );
}
