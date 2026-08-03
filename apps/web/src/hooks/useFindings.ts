import type { Finding, FindingComment, FindingStatusHistory } from '@iec62443/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

interface FindingListParams {
  page?: number;
  perPage?: number;
  status?: string;
  severity?: string;
  engagementId?: string;
  search?: string;
  sort?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

interface SingleResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ── Findings CRUD ──────────────────────────────────────────────────────

export function useFindings(params: FindingListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.findings.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.status) queryParams['status'] = params.status;
      if (params.severity) queryParams['severity'] = params.severity;
      if (params.engagementId) queryParams['engagementId'] = params.engagementId;
      if (params.search) queryParams['search'] = params.search;
      if (params.sort) queryParams['sort'] = params.sort;

      const result = await client.get<PaginatedResponse<Finding>>('/findings', queryParams);
      return result;
    },
  });
}

export function useFinding(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.findings.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Finding>>(`/findings/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateFinding() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      engagementId?: string;
      title: string;
      description?: string;
      severity: string;
      category?: string;
      subcategory?: string;
      iecRequirement?: string;
      assetIds?: string[];
      zoneIds?: string[];
      riskIds?: string[];
      assignedTo?: string;
      dueDate?: string;
      source?: string;
      externalRef?: string;
    }) => {
      const result = await client.post<SingleResponse<Finding>>('/findings', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.lists() });
    },
  });
}

export function useUpdateFinding() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<Finding>>(`/findings/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.lists() });
    },
  });
}

export function useDeleteFinding() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/findings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.lists() });
    },
  });
}

// ── Status Transitions ─────────────────────────────────────────────────

export function useTransitionFinding() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      toStatus,
      reason,
    }: {
      id: string;
      toStatus: string;
      reason?: string;
    }) => {
      const result = await client.post<SingleResponse<Finding>>(`/findings/${id}/transition`, {
        toStatus,
        reason,
      });
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.findings.history(variables.id) });
    },
  });
}

// ── History ────────────────────────────────────────────────────────────

export function useFindingHistory(findingId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.findings.history(findingId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<FindingStatusHistory[]>>(
        `/findings/${findingId}/history`,
      );
      return result.data;
    },
    enabled: !!findingId,
  });
}

// ── Comments ───────────────────────────────────────────────────────────

export function useFindingComments(findingId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.findings.comments(findingId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<FindingComment[]>>(
        `/findings/${findingId}/comments`,
      );
      return result.data;
    },
    enabled: !!findingId,
  });
}

export function useAddComment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      findingId,
      body,
      isInternal,
    }: {
      findingId: string;
      body: string;
      isInternal?: boolean;
    }) => {
      const result = await client.post<SingleResponse<FindingComment>>(
        `/findings/${findingId}/comments`,
        { body, isInternal: isInternal ?? false },
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.findings.comments(variables.findingId),
      });
    },
  });
}
