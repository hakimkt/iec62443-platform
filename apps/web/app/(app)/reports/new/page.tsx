'use client';

import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useGenerateReport,
  useReportTemplates,
  type GenerateReportInput,
} from '@/hooks/useReports';

export default function GenerateReportPage() {
  const router = useRouter();
  const { data: templates, isLoading: templatesLoading } = useReportTemplates();
  const generateReport = useGenerateReport();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<'tenant' | 'engagement' | 'register'>('tenant');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'pptx'>('pdf');
  const [includeSections, setIncludeSections] = useState<string[]>([]);

  const template = templates?.find((t) => t.id === selectedTemplate);

  const handleToggleSection = (section: string) => {
    setIncludeSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !template) return;

    const input: GenerateReportInput = {
      type: template.type as GenerateReportInput['type'],
      title: title || undefined,
      config: {
        scope,
        includeSections,
        format,
      },
    };

    await generateReport.mutateAsync(input);
    router.push('/reports');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="rounded-md p-2 text-surface-400 hover:bg-surface-50 hover:text-surface-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Generate Report</h1>
          <p className="mt-1 text-sm text-surface-500">
            Select a template and configure your report
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
          <h2 className="text-lg font-medium text-surface-900 mb-4">Report Template</h2>
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates?.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setIncludeSections(t.sections);
                    if (!title) setTitle(t.name);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedTemplate === t.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-surface-400" />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{t.name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configuration */}
        {template && (
          <div className="rounded-lg border border-surface-200 bg-surface-0 p-6">
            <h2 className="text-lg font-medium text-surface-900 mb-4">Configuration</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={template.name}
                  className="w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'tenant' | 'engagement' | 'register')}
                  className="w-full rounded-md border border-surface-200 bg-surface-0 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:outline-none"
                >
                  <option value="tenant">Tenant-wide</option>
                  <option value="engagement">Engagement</option>
                  <option value="register">Risk Register</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Output Format
                </label>
                <div className="flex gap-3">
                  {(['pdf', 'xlsx', 'pptx'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        format === f
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Include Sections
                </label>
                <div className="flex flex-wrap gap-2">
                  {template.sections.map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => handleToggleSection(section)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        includeSections.includes(section)
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {section.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/reports"
            className="rounded-md border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!selectedTemplate || generateReport.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {generateReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Report
          </button>
        </div>
      </form>
    </div>
  );
}
