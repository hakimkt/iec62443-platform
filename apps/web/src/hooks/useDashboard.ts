import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import type { DashboardSummary, RiskHeatMapData, AssessmentProgressItem, RecentFindingItem, RemediationStatus } from '@iec62443/shared-types';

interface SingleResponse<T> {
  data: T;
  meta: { requestId: string; timestamp: string };
}

// ── Dashboard Summary ─────────────────────────────────────────────────

export function useDashboardSummary() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<DashboardSummary>>(
        '/dashboard/summary',
      );
      return result.data;
    },
  });
}

// ── Risk Heat Map ─────────────────────────────────────────────────────

export function useDashboardRiskHeatMap(registerId?: string) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.dashboard.riskHeatMap(),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (registerId) params['registerId'] = registerId;

      const result = await client.get<SingleResponse<RiskHeatMapData>>(
        '/dashboard/risk-heatmap',
        params,
      );
      return result.data;
    },
  });
}

// ── Assessment Progress ───────────────────────────────────────────────

export function useDashboardAssessmentProgress() {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'assessment-progress'] as const,
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssessmentProgressItem[]>>(
        '/dashboard/assessment-progress',
      );
      return result.data;
    },
  });
}

// ── Recent Findings ───────────────────────────────────────────────────

export function useDashboardRecentFindings() {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'recent-findings'] as const,
    queryFn: async () => {
      const result = await client.get<SingleResponse<RecentFindingItem[]>>(
        '/dashboard/recent-findings',
      );
      return result.data;
    },
  });
}

// ── Remediation Status ────────────────────────────────────────────────

export function useDashboardRemediationStatus() {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'remediation-status'] as const,
    queryFn: async () => {
      const result = await client.get<SingleResponse<RemediationStatus>>(
        '/dashboard/remediation-status',
      );
      return result.data;
    },
  });
}
