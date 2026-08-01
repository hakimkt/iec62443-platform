'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import {
  ArrowLeft,
  Loader2,
  Layers,
  FileCheck,
  BarChart3,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  useCSMSFramework,
  useCSMSElements,
  useCSMSPolicies,
  useGapAnalysis,
  useImprovementPlans,
  useApprovePolicy,
} from '@/hooks/useCSMS';
import type {
  CSMSFrameworkStatus,
  ImplementationStatus,
  CSMSPolicyStatus,
  CSMSImprovementPriority,
  CSMSImprovementStatus,
} from '@iec62443/shared-types';

const FRAMEWORK_STATUS_CONFIG: Record<CSMSFrameworkStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-surface-100 text-surface-600' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-amber-100 text-amber-700' },
};

const IMPLEMENTATION_STATUS_CONFIG: Record<ImplementationStatus, { label: string; color: string }> = {
  implemented: { label: 'Implemented', color: 'bg-green-100 text-green-700' },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700' },
  planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700' },
  not_started: { label: 'Not Started', color: 'bg-surface-100 text-surface-600' },
  na: { label: 'N/A', color: 'bg-surface-50 text-surface-400' },
};

const POLICY_STATUS_CONFIG: Record<CSMSPolicyStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-surface-100 text-surface-600' },
  review: { label: 'Review', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  deprecated: { label: 'Deprecated', color: 'bg-amber-100 text-amber-700' },
};

const PRIORITY_CONFIG: Record<CSMSImprovementPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-surface-100 text-surface-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

const IMPROVEMENT_STATUS_CONFIG: Record<CSMSImprovementStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-surface-100 text-surface-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

type TabKey = 'elements' | 'policies' | 'gaps' | 'improvements';

export default function CSMSFrameworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: frameworkId } = use(params);
  const [activeTab, setActiveTab] = useState<TabKey>('elements');

  const { data: framework, isLoading } = useCSMSFramework(frameworkId || null);
  const { data: elementsData, isLoading: elementsLoading } = useCSMSElements({
    frameworkId: frameworkId || undefined,
  });
  const { data: policiesData, isLoading: policiesLoading } = useCSMSPolicies({
    frameworkId: frameworkId || undefined,
  });
  const { data: gapAnalysis, isLoading: gapsLoading } = useGapAnalysis(frameworkId || null);
  const { data: improvements, isLoading: improvementsLoading } = useImprovementPlans(frameworkId || null);
  const approvePolicy = useApprovePolicy();

  const handleApprovePolicy = async (policyId: string) => {
    await approvePolicy.mutateAsync({ id: policyId });
  };

  if (isLoading || !framework) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const statusConfig = FRAMEWORK_STATUS_CONFIG[framework.status] ?? FRAMEWORK_STATUS_CONFIG['draft'];
  const elements = elementsData?.data ?? [];
  const policies = policiesData?.data ?? [];
  const gaps = gapAnalysis?.elements ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/csms"
            className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            CSMS Management
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-surface-900">{framework.name}</h1>
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-surface-500">v{framework.version}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-6" role="tablist" aria-label="CSMS sections">
          {([
            { key: 'elements' as TabKey, label: 'Elements', icon: Layers },
            { key: 'policies' as TabKey, label: 'Policies', icon: FileCheck },
            { key: 'gaps' as TabKey, label: 'Gap Analysis', icon: BarChart3 },
            { key: 'improvements' as TabKey, label: 'Improvement Plans', icon: TrendingUp },
          ]).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'elements' && (
        <div className="space-y-3">
          {elementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : elements.length > 0 ? (
            elements.map((element) => {
              const implConfig = IMPLEMENTATION_STATUS_CONFIG[element.implementationStatus] ?? IMPLEMENTATION_STATUS_CONFIG['not_started'];

              return (
                <div
                  key={element.id}
                  className="rounded-lg border border-surface-200 bg-surface-0 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{element.title}</p>
                      <p className="mt-0.5 text-xs text-surface-500">{element.category}</p>
                      {element.description && (
                        <p className="mt-1 text-xs text-surface-500 line-clamp-2">{element.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', implConfig.color)}>
                        {implConfig.label}
                      </span>
                      <span className="text-xs text-surface-500">
                        Maturity: {element.maturityScore}/5
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Layers className="h-8 w-8 text-surface-300" />
              <p className="mt-2 text-sm text-surface-500">No elements defined yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-3">
          {policiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : policies.length > 0 ? (
            policies.map((policy) => {
              const policyConfig = POLICY_STATUS_CONFIG[policy.status] ?? POLICY_STATUS_CONFIG['draft'];

              return (
                <div
                  key={policy.id}
                  className="rounded-lg border border-surface-200 bg-surface-0 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{policy.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-surface-500">v{policy.version}</span>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', policyConfig.color)}>
                        {policyConfig.label}
                      </span>
                      {policy.status === 'review' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprovePolicy(policy.id)}
                          loading={approvePolicy.isPending}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileCheck className="h-8 w-8 text-surface-300" />
              <p className="mt-2 text-sm text-surface-500">No policies defined yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="space-y-3">
          {gapsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : gaps.length > 0 ? (
            gaps.map((gap) => {
              const currentConfig = IMPLEMENTATION_STATUS_CONFIG[gap.currentStatus] ?? IMPLEMENTATION_STATUS_CONFIG['not_started'];
              const targetConfig = IMPLEMENTATION_STATUS_CONFIG[gap.targetStatus] ?? IMPLEMENTATION_STATUS_CONFIG['not_started'];
              const priorityConfig = PRIORITY_CONFIG[gap.priority] ?? PRIORITY_CONFIG['medium'];

              return (
                <div
                  key={gap.elementId}
                  className="rounded-lg border border-surface-200 bg-surface-0 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{gap.title}</p>
                      {gap.gap && (
                        <p className="mt-1 text-xs text-surface-500 line-clamp-2">{gap.gap}</p>
                      )}
                    </div>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', priorityConfig.color)}>
                      {priorityConfig.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="text-surface-500">Current:</span>
                      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 font-medium', currentConfig.color)}>
                        {currentConfig.label}
                      </span>
                    </span>
                    <span className="text-surface-300">→</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-surface-500">Target:</span>
                      <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 font-medium', targetConfig.color)}>
                        {targetConfig.label}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-8 w-8 text-surface-300" />
              <p className="mt-2 text-sm text-surface-500">No gap analysis entries yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'improvements' && (
        <div className="space-y-3">
          {improvementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : improvements && improvements.length > 0 ? (
            improvements.map((plan) => {
              const priorityConfig = PRIORITY_CONFIG[plan.priority] ?? PRIORITY_CONFIG['medium'];
              const statusConfig = IMPROVEMENT_STATUS_CONFIG[plan.status] ?? IMPROVEMENT_STATUS_CONFIG['planned'];

              return (
                <div
                  key={plan.id}
                  className="rounded-lg border border-surface-200 bg-surface-0 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-900">{plan.title}</p>
                      {plan.description && (
                        <p className="mt-0.5 text-xs text-surface-500 line-clamp-1">{plan.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', priorityConfig.color)}>
                        {priorityConfig.label}
                      </span>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  {plan.targetDate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-surface-500">
                      <Clock className="h-3 w-3" />
                      Target: {formatDate(plan.targetDate)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="h-8 w-8 text-surface-300" />
              <p className="mt-2 text-sm text-surface-500">No improvement plans yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
