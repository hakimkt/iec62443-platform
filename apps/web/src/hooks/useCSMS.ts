import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import type { CSMSFramework, CSMSElement, CSMS_POLICY, CSMSImprovementPlan, CSMSGapAnalysis } from '@iec62443/shared-types';

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

// ── CSMS Frameworks ─────────────────────────────────────────────────────

interface FrameworkListParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}

export function useCSMSFrameworks(params: FrameworkListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.frameworks.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.search) queryParams['search'] = params.search;
      if (params.status) queryParams['status'] = params.status;

      const result = await client.get<PaginatedResponse<CSMSFramework>>(
        '/csms/frameworks',
        queryParams,
      );
      return result;
    },
  });
}

export function useCSMSFramework(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.frameworks.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CSMSFramework>>(
        `/csms/frameworks/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateFramework() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      version?: string;
    }) => {
      const result = await client.post<SingleResponse<CSMSFramework>>(
        '/csms/frameworks',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

export function useUpdateFramework() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<CSMSFramework>>(
        `/csms/frameworks/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

export function useDeleteFramework() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/csms/frameworks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

// ── CSMS Elements ───────────────────────────────────────────────────────

interface ElementListParams {
  page?: number;
  perPage?: number;
  frameworkId?: string;
  category?: string;
  implementationStatus?: string;
}

export function useCSMSElements(params: ElementListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.elements.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.frameworkId) queryParams['frameworkId'] = params.frameworkId;
      if (params.category) queryParams['category'] = params.category;
      if (params.implementationStatus) queryParams['implementationStatus'] = params.implementationStatus;

      const result = await client.get<PaginatedResponse<CSMSElement>>(
        '/csms/elements',
        queryParams,
      );
      return result;
    },
  });
}

export function useCSMSElement(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.elements.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CSMSElement>>(
        `/csms/elements/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateElement() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frameworkId, ...data }: {
      frameworkId: string;
      category: string;
      title: string;
      description?: string;
      requirementRef?: string;
      implementationStatus?: string;
      maturityScore?: number;
      ownerId?: string;
    }) => {
      const result = await client.post<SingleResponse<CSMSElement>>(
        `/csms/frameworks/${frameworkId}/elements`,
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.elements.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

export function useUpdateElement() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<CSMSElement>>(
        `/csms/elements/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.elements.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.elements.lists() });
    },
  });
}

export function useDeleteElement() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/csms/elements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.elements.lists() });
    },
  });
}

// ── CSMS Policies ───────────────────────────────────────────────────────

interface PolicyListParams {
  page?: number;
  perPage?: number;
  frameworkId?: string;
  status?: string;
}

export function useCSMSPolicies(params: PolicyListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.policies.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.frameworkId) queryParams['frameworkId'] = params.frameworkId;
      if (params.status) queryParams['status'] = params.status;

      const result = await client.get<PaginatedResponse<CSMS_POLICY>>(
        '/csms/policies',
        queryParams,
      );
      return result;
    },
  });
}

export function useCSMSPolicy(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.policies.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CSMS_POLICY>>(
        `/csms/policies/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frameworkId, ...data }: {
      frameworkId: string;
      title: string;
      version?: string;
      body?: string;
      elementId?: string;
      reviewCycle?: string;
    }) => {
      const result = await client.post<SingleResponse<CSMS_POLICY>>(
        `/csms/frameworks/${frameworkId}/policies`,
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

export function useUpdatePolicy() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<CSMS_POLICY>>(
        `/csms/policies/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.lists() });
    },
  });
}

export function useApprovePolicy() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.post<SingleResponse<CSMS_POLICY>>(
        `/csms/policies/${id}/approve`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.lists() });
    },
  });
}

export function useDeletePolicy() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/csms/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.policies.lists() });
    },
  });
}

// ── Improvement Plans ───────────────────────────────────────────────────

export function useImprovementPlans(frameworkId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.frameworks.improvementPlans(frameworkId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CSMSImprovementPlan[]>>(
        `/csms/frameworks/${frameworkId}/improvement-plans`,
      );
      return result.data;
    },
    enabled: !!frameworkId,
  });
}

export function useCreateImprovementPlan() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frameworkId, ...data }: {
      frameworkId: string;
      elementId: string;
      title: string;
      description?: string;
      priority?: string;
      targetDate?: string;
      ownerId?: string;
    }) => {
      const result = await client.post<SingleResponse<CSMSImprovementPlan>>(
        `/csms/frameworks/${frameworkId}/improvement-plans`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.csms.frameworks.improvementPlans(variables.frameworkId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.csms.frameworks.lists() });
    },
  });
}

// ── Gap Analysis ────────────────────────────────────────────────────────

export function useGapAnalysis(frameworkId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.csms.frameworks.gapAnalysis(frameworkId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CSMSGapAnalysis>>(
        `/csms/frameworks/${frameworkId}/gap-analysis`,
      );
      return result.data;
    },
    enabled: !!frameworkId,
  });
}
