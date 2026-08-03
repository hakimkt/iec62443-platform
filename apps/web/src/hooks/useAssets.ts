import type { Asset, AssetRelationship, AssetStats } from '@iec62443/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

interface AssetListParams {
  page?: number;
  perPage?: number;
  type?: string;
  criticality?: string;
  operationalStatus?: string;
  purdueLevel?: number;
  zoneId?: string;
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

// ── Assets CRUD ──────────────────────────────────────────────────────

export function useAssets(params: AssetListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assets.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.type) queryParams['type'] = params.type;
      if (params.criticality) queryParams['criticality'] = params.criticality;
      if (params.operationalStatus) queryParams['operationalStatus'] = params.operationalStatus;
      if (params.purdueLevel !== undefined) queryParams['purdueLevel'] = String(params.purdueLevel);
      if (params.zoneId) queryParams['zoneId'] = params.zoneId;
      if (params.search) queryParams['search'] = params.search;
      if (params.sort) queryParams['sort'] = params.sort;

      const result = await client.get<PaginatedResponse<Asset>>('/assets', queryParams);
      return result;
    },
  });
}

export function useAsset(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assets.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Asset>>(`/assets/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useAssetStats() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assets.stats(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssetStats>>('/assets/stats');
      return result.data;
    },
  });
}

export function useCreateAsset() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      description?: string;
      criticality?: string;
      vendor?: string;
      model?: string;
      firmwareVersion?: string;
      serialNumber?: string;
      ipAddress?: string;
      macAddress?: string;
      networkSegment?: string;
      purdueLevel?: number;
      zoneId?: string;
      location?: string;
      operationalStatus?: string;
      installDate?: string;
      lastPatchDate?: string;
      eolDate?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await client.post<SingleResponse<Asset>>('/assets', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.stats() });
    },
  });
}

export function useUpdateAsset() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<Asset>>(`/assets/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.stats() });
    },
  });
}

export function useDeleteAsset() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.stats() });
    },
  });
}

// ── Asset Relationships ──────────────────────────────────────────────

export function useAssetRelationships(assetId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assets.relationships(assetId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssetRelationship[]>>(
        `/assets/${assetId}/relationships`,
      );
      return result.data;
    },
    enabled: !!assetId,
  });
}

export function useCreateRelationship() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      ...data
    }: {
      assetId: string;
      targetAssetId: string;
      relationshipType: string;
      protocol?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await client.post<SingleResponse<AssetRelationship>>(
        `/assets/${assetId}/relationships`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.relationships(variables.assetId),
      });
    },
  });
}

export function useDeleteRelationship() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, relId }: { assetId: string; relId: string }) => {
      await client.delete(`/assets/${assetId}/relationships/${relId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assets.relationships(variables.assetId),
      });
    },
  });
}

// ── Asset Export ─────────────────────────────────────────────────────

export function useExportAssets() {
  const client = getApiClient();

  return useMutation({
    mutationFn: async (params?: AssetListParams) => {
      const queryParams: Record<string, string> = {};
      if (params?.type) queryParams['type'] = params.type;
      if (params?.criticality) queryParams['criticality'] = params.criticality;
      if (params?.operationalStatus) queryParams['operationalStatus'] = params.operationalStatus;

      const result = await client.get<SingleResponse<Asset[]>>('/assets/export', queryParams);
      return result.data;
    },
  });
}
