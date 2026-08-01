import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import type { PurdueModel, PurdueLevelDefinition, PurdueAssetMapping, CommunicationRule, PurdueComplianceResult } from '@iec62443/shared-types';

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

// ── Purdue Models CRUD ──────────────────────────────────────────────────

interface PurdueModelListParams {
  page?: number;
  perPage?: number;
  search?: string;
}

export function usePurdueModels(params: PurdueModelListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.search) queryParams['search'] = params.search;

      const result = await client.get<PaginatedResponse<PurdueModel>>(
        '/purdue-models',
        queryParams,
      );
      return result;
    },
  });
}

export function usePurdueModel(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<PurdueModel>>(
        `/purdue-models/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurdueModel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; facilityId?: string; description?: string; isDefault?: boolean }) => {
      const result = await client.post<SingleResponse<PurdueModel>>(
        '/purdue-models',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.lists() });
    },
  });
}

export function useUpdatePurdueModel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<PurdueModel>>(
        `/purdue-models/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.lists() });
    },
  });
}

export function useDeletePurdueModel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/purdue-models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.lists() });
    },
  });
}

// ── Purdue Levels ───────────────────────────────────────────────────────

export function usePurdueLevels(modelId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.levels(modelId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<PurdueLevelDefinition[]>>(
        `/purdue-models/${modelId}/levels`,
      );
      return result.data;
    },
    enabled: !!modelId,
  });
}

export function useCreatePurdueLevel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, ...data }: { modelId: string; levelNumber: number; name: string; description?: string; color?: string; sortOrder?: number }) => {
      const result = await client.post<SingleResponse<PurdueLevelDefinition>>(
        `/purdue-models/${modelId}/levels`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.levels(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.detail(variables.modelId) });
    },
  });
}

export function useUpdatePurdueLevel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, levelId, ...data }: { modelId: string; levelId: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<PurdueLevelDefinition>>(
        `/purdue-models/${modelId}/levels/${levelId}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.levels(variables.modelId) });
    },
  });
}

export function useDeletePurdueLevel() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, levelId }: { modelId: string; levelId: string }) => {
      await client.delete(`/purdue-models/${modelId}/levels/${levelId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.levels(variables.modelId) });
    },
  });
}

// ── Asset Mappings ──────────────────────────────────────────────────────

export function usePurdueAssetMappings(modelId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.mappings(modelId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<PurdueAssetMapping[]>>(
        `/purdue-models/${modelId}/mappings`,
      );
      return result.data;
    },
    enabled: !!modelId,
  });
}

export function useAddPurdueAssetMapping() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, ...data }: { modelId: string; assetId: string; levelId: string }) => {
      const result = await client.post<SingleResponse<PurdueAssetMapping>>(
        `/purdue-models/${modelId}/mappings`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.mappings(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.compliance(variables.modelId) });
    },
  });
}

export function useRemovePurdueAssetMapping() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, assetId }: { modelId: string; assetId: string }) => {
      await client.delete(`/purdue-models/${modelId}/mappings/${assetId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.mappings(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.compliance(variables.modelId) });
    },
  });
}

// ── Communication Rules ─────────────────────────────────────────────────

export function useCommunicationRules(modelId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.rules(modelId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<CommunicationRule[]>>(
        `/purdue-models/${modelId}/rules`,
      );
      return result.data;
    },
    enabled: !!modelId,
  });
}

export function useCreateCommunicationRule() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, ...data }: { modelId: string; sourceLevelId: string; targetLevelId: string; isAllowed?: boolean; condition?: string; protocol?: string }) => {
      const result = await client.post<SingleResponse<CommunicationRule>>(
        `/purdue-models/${modelId}/rules`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.rules(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.compliance(variables.modelId) });
    },
  });
}

export function useUpdateCommunicationRule() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, ruleId, ...data }: { modelId: string; ruleId: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<CommunicationRule>>(
        `/purdue-models/${modelId}/rules/${ruleId}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.rules(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.compliance(variables.modelId) });
    },
  });
}

export function useDeleteCommunicationRule() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modelId, ruleId }: { modelId: string; ruleId: string }) => {
      await client.delete(`/purdue-models/${modelId}/rules/${ruleId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.rules(variables.modelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purdue.compliance(variables.modelId) });
    },
  });
}

// ── Compliance ──────────────────────────────────────────────────────────

export function usePurdueCompliance(modelId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.purdue.compliance(modelId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<PurdueComplianceResult>>(
        `/purdue-models/${modelId}/compliance`,
      );
      return result.data;
    },
    enabled: !!modelId,
  });
}
