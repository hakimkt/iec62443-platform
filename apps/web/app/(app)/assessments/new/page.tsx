'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@iec62443/ui/primitives';
import { Input } from '@iec62443/ui/primitives';
import { Label } from '@iec62443/ui/primitives';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@iec62443/ui/primitives';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCreateAssessment, useAssessmentTemplates } from '@/hooks/useAssessments';

const STEPS = [
  { title: 'Basic Info', description: 'Name and description' },
  { title: 'Template', description: 'Select assessment template' },
  { title: 'Scope', description: 'Target SL and dates' },
  { title: 'Review', description: 'Confirm and create' },
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const createAssessment = useCreateAssessment();
  const { data: templates } = useAssessmentTemplates();

  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('gap');
  const [templateId, setTemplateId] = useState('');
  const [targetSl, setTargetSl] = useState('2');
  const [targetDate, setTargetDate] = useState('');

  const canProceed = () => {
    switch (currentStep) {
      case 0: return name.trim().length > 0;
      case 1: return templateId.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleCreate = async () => {
    try {
      const result = await createAssessment.mutateAsync({
        name,
        description: description || undefined,
        type,
        templateId,
        targetSl: targetSl ? parseInt(targetSl, 10) : undefined,
        targetDate: targetDate || undefined,
      });
      router.push(`/assessments/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-surface-900">New Assessment</h1>
        <p className="mt-1 text-sm text-surface-500">
          Create a new IEC 62443 assessment engagement
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-green-600 text-white'
                    : index === currentStep
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-200 text-surface-400'
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-xs font-medium ${index === currentStep ? 'text-surface-900' : 'text-surface-500'}`}>
                  {step.title}
                </p>
                <p className="text-2xs text-surface-400">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 ${index < currentStep ? 'bg-green-600' : 'bg-surface-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assessment Name</Label>
              <Input
                id="name"
                placeholder="e.g., Plant Alpha Gap Assessment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Brief description of the assessment scope and objectives"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Assessment Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gap">Gap Assessment</SelectItem>
                  <SelectItem value="system">System Assessment</SelectItem>
                  <SelectItem value="component">Component Assessment</SelectItem>
                  <SelectItem value="csms">CSMS Assessment</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <p className="text-sm text-surface-500">
                Choose an assessment template to define the questions and structure.
              </p>
            </div>
            <div className="space-y-2">
              {templates?.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    templateId === template.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-surface-900">{template.name}</p>
                    <span className="text-xs text-surface-500">{template.iecPart}</span>
                  </div>
                  {template.description && (
                    <p className="mt-1 text-xs text-surface-500">{template.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xs text-surface-400">v{template.version}</span>
                    {template.isSystem && (
                      <span className="text-2xs text-brand-600">System Template</span>
                    )}
                  </div>
                </button>
              ))}
              {(!templates || templates.length === 0) && (
                <p className="py-8 text-center text-sm text-surface-500">
                  No templates available. Contact your administrator.
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetSl">Target Security Level</Label>
              <Select value={targetSl} onValueChange={setTargetSl}>
                <SelectTrigger id="targetSl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">SL 0 — No specific security</SelectItem>
                  <SelectItem value="1">SL 1 — Protection against casual violation</SelectItem>
                  <SelectItem value="2">SL 2 — Protection against simple means</SelectItem>
                  <SelectItem value="3">SL 3 — Protection against sophisticated means</SelectItem>
                  <SelectItem value="4">SL 4 — Protection against intentional violation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Completion Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-700">Review Assessment Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Name</dt>
                <dd className="text-sm font-medium text-surface-900">{name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Type</dt>
                <dd className="text-sm text-surface-900 capitalize">{type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Template</dt>
                <dd className="text-sm text-surface-900">
                  {templates?.find((t) => t.id === templateId)?.name ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-surface-500">Target SL</dt>
                <dd className="text-sm text-surface-900">SL {targetSl}</dd>
              </div>
              {targetDate && (
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Target Date</dt>
                  <dd className="text-sm text-surface-900">{new Date(targetDate).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => currentStep > 0 ? setCurrentStep((s) => s - 1) : router.push('/assessments')}
          icon={ArrowLeft}
        >
          {currentStep > 0 ? 'Back' : 'Cancel'}
        </Button>
        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              icon={ArrowRight}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={createAssessment.isPending}
              icon={Check}
            >
              Create Assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
