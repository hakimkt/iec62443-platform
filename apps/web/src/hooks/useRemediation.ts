import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import type { RemediationPlan, RemediationAction, RemediationVerification } from '@iec62443/shared-types';

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

// ── Remediation Plans ───────────────────────────────────────────────────

interface PlanListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}

export function useRemediationPlans(params: PlanListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.remediation.plans.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.search) queryParams['search'] = params.search;
      if (params.status) queryParams['status'] = params.status;

      const result = await client.get<PaginatedResponse<RemediationPlan>>(
        '/remediation/plans',
        queryParams,
      );
      return result;
    },
  });
}

export function useRemediationPlan(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.remediation.plans.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RemediationPlan>>(
        `/remediation/plans/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      findingIds?: string[];
      riskIds?: string[];
      ownerId?: string;
      budgetEstimate?: number;
      startDate?: string;
      targetDate?: string;
    }) => {
      const result = await client.post<SingleResponse<RemediationPlan>>(
        '/remediation/plans',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.plans.lists() });
    },
  });
}

export function useUpdatePlan() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<RemediationPlan>>(
        `/remediation/plans/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.plans.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.plans.lists() });
    },
  });
}

export function useDeletePlan() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/remediation/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.plans.lists() });
    },
  });
}

// ── Remediation Actions ─────────────────────────────────────────────────

interface ActionListParams {
  page?: number;
  perPage?: number;
  planId?: string;
  status?: string;
  assigneeId?: string;
}

export function useRemediationActions(params: ActionListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.remediation.actions.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.planId) queryParams['planId'] = params.planId;
      if (params.status) queryParams['status'] = params.status;
      if (params.assigneeId) queryParams['assigneeId'] = params.assigneeId;

      const result = await client.get<PaginatedResponse<RemediationAction>>(
        '/remediation/actions',
        queryParams,
      );
      return result;
    },
  });
}

export function useRemediationAction(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.remediation.actions.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RemediationAction>>(
        `/remediation/actions/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateAction() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, ...data }: {
      planId: string;
      title: string;
      description?: string;
      findingId?: string;
      riskId?: string;
      assigneeId?: string;
      startDate?: string;
      dueDate?: string;
      costEstimate?: number;
      milestone?: boolean;
    }) => {
      const result = await client.post<SingleResponse<RemediationAction>>(
        `/remediation/plans/${planId}/actions`,
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.plans.lists() });
    },
  });
}

export function useUpdateAction() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<RemediationAction>>(
        `/remediation/actions/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.lists() });
    },
  });
}

export function useDeleteAction() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/remediation/actions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.lists() });
    },
  });
}

// ── Verifications ───────────────────────────────────────────────────────

export function useVerifications(actionId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.remediation.actions.detail(actionId ?? ''), 'verifications'] as const,
    queryFn: async () => {
      const result = await client.get<SingleResponse<RemediationVerification[]>>(
        `/remediation/actions/${actionId}/verifications`,
      );
      return result.data;
    },
    enabled: !!actionId,
  });
}

export function useVerifyAction() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, ...data }: {
      actionId: string;
      result: string;
      notes?: string;
      verificationDate?: string;
    }) => {
      const res = await client.post<SingleResponse<RemediationVerification>>(
        `/remediation/actions/${actionId}/verifications`,
        data,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.remediation.actions.detail(variables.actionId), 'verifications'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.detail(variables.actionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.remediation.actions.lists() });
    },
  });
}
