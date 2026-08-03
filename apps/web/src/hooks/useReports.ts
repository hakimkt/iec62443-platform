import type {
  Report,
  ReportFormat,
  ReportScope,
  ReportTemplate,
  ReportType,
} from '@iec62443/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  meta: { requestId: string; timestamp: string };
}

interface SingleResponse<T> {
  data: T;
  meta: { requestId: string; timestamp: string };
}

// ── Report Templates ──────────────────────────────────────────────────

export function useReportTemplates() {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.reports.all, 'templates'] as const,
    queryFn: async () => {
      const result = await client.get<SingleResponse<ReportTemplate[]>>('/reports/templates');
      return result.data;
    },
  });
}

// ── List Reports ──────────────────────────────────────────────────────

export function useReports(
  params: { page?: number; perPage?: number; type?: string; status?: string; search?: string } = {},
) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.reports.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.type) queryParams['type'] = params.type;
      if (params.status) queryParams['status'] = params.status;
      if (params.search) queryParams['search'] = params.search;

      const result = await client.get<PaginatedResponse<Report>>('/reports', queryParams);
      return result;
    },
  });
}

// ── Get Report ────────────────────────────────────────────────────────

export function useReport(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.reports.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Report>>(`/reports/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

// ── Generate Report ───────────────────────────────────────────────────

export interface GenerateReportInput {
  type: ReportType;
  title?: string;
  config: {
    scope: ReportScope;
    scopeId?: string;
    dateRange?: { from?: string; to?: string };
    includeSections?: string[];
    format?: ReportFormat;
  };
}

export function useGenerateReport() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateReportInput) => {
      const result = await client.post<SingleResponse<Report>>('/reports', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
    },
  });
}

// ── Delete Report ─────────────────────────────────────────────────────

export function useDeleteReport() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
    },
  });
}

// ── Download Report ───────────────────────────────────────────────────

export function useDownloadReport() {
  const client = getApiClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await client.get<SingleResponse<{ downloadUrl: string }>>(
        `/reports/${id}/download`,
      );
      return result.data;
    },
  });
}
