import type {
  Conduit,
  SegmentationRule,
  Zone,
  ZoneMembership,
  ZoneTopology,
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

// ── Zones CRUD ─────────────────────────────────────────────────────────

interface ZoneListParams {
  page?: number;
  perPage?: number;
  zoneType?: string;
  securityLevel?: number;
  purdueLevel?: number;
  search?: string;
  sort?: string;
}

export function useZones(params: ZoneListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.zoneType) queryParams['zoneType'] = params.zoneType;
      if (params.securityLevel !== undefined)
        queryParams['securityLevel'] = String(params.securityLevel);
      if (params.purdueLevel !== undefined) queryParams['purdueLevel'] = String(params.purdueLevel);
      if (params.search) queryParams['search'] = params.search;
      if (params.sort) queryParams['sort'] = params.sort;

      const result = await client.get<PaginatedResponse<Zone>>('/zones', queryParams);
      return result;
    },
  });
}

export function useZone(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Zone>>(`/zones/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateZone() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      zoneType?: string;
      securityLevel?: number;
      parentZoneId?: string;
      purdueLevel?: number;
      facilityId?: string;
      color?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await client.post<SingleResponse<Zone>>('/zones', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

export function useUpdateZone() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<Zone>>(`/zones/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

export function useDeleteZone() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

// ── Zone Memberships ────────────────────────────────────────────────────

export function useZoneMemberships(zoneId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.memberships(zoneId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<ZoneMembership[]>>(
        `/zones/${zoneId}/memberships`,
      );
      return result.data;
    },
    enabled: !!zoneId,
  });
}

export function useAddZoneMembership() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, assetId }: { zoneId: string; assetId: string }) => {
      const result = await client.post<SingleResponse<ZoneMembership>>(
        `/zones/${zoneId}/memberships`,
        { assetId },
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.memberships(variables.zoneId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

export function useRemoveZoneMembership() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, assetId }: { zoneId: string; assetId: string }) => {
      await client.delete(`/zones/${zoneId}/memberships/${assetId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.memberships(variables.zoneId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

// ── Segmentation Rules ──────────────────────────────────────────────────

export function useZoneRules(zoneId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.rules(zoneId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<SegmentationRule[]>>(`/zones/${zoneId}/rules`);
      return result.data;
    },
    enabled: !!zoneId,
  });
}

export function useCreateSegmentationRule() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      zoneId,
      ...data
    }: {
      zoneId: string;
      ruleType: string;
      description?: string;
      direction?: string;
      action?: string;
      isCompliant?: boolean;
    }) => {
      const result = await client.post<SingleResponse<SegmentationRule>>(
        `/zones/${zoneId}/rules`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.rules(variables.zoneId) });
    },
  });
}

export function useDeleteSegmentationRule() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, ruleId }: { zoneId: string; ruleId: string }) => {
      await client.delete(`/zones/${zoneId}/rules/${ruleId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.rules(variables.zoneId) });
    },
  });
}

// ── Conduits CRUD ───────────────────────────────────────────────────────

interface ConduitListParams {
  page?: number;
  perPage?: number;
  sourceZoneId?: string;
  targetZoneId?: string;
  conduitType?: string;
  search?: string;
}

export function useConduits(params: ConduitListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.conduits.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.sourceZoneId) queryParams['sourceZoneId'] = params.sourceZoneId;
      if (params.targetZoneId) queryParams['targetZoneId'] = params.targetZoneId;
      if (params.conduitType) queryParams['conduitType'] = params.conduitType;
      if (params.search) queryParams['search'] = params.search;

      const result = await client.get<PaginatedResponse<Conduit>>('/conduits', queryParams);
      return result;
    },
  });
}

export function useConduit(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.conduits.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Conduit>>(`/conduits/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateConduit() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      sourceZoneId: string;
      targetZoneId: string;
      conduitType: string;
      description?: string;
      protocol?: string;
      securityLevel?: number;
      encryption?: boolean;
      authentication?: boolean;
      monitoring?: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await client.post<SingleResponse<Conduit>>('/conduits', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.conduits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

export function useUpdateConduit() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<Conduit>>(`/conduits/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.conduits.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.conduits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

export function useDeleteConduit() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/conduits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.conduits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
    },
  });
}

// ── Topology ────────────────────────────────────────────────────────────

export function useZoneTopology() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.zones.topology(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<ZoneTopology>>('/zone-topology');
      return result.data;
    },
  });
}

export function useUpdateTopology() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      zones: Array<{
        id: string;
        diagramX?: number;
        diagramY?: number;
        diagramWidth?: number;
        diagramHeight?: number;
      }>;
    }) => {
      const result = await client.put<SingleResponse<void>>('/zone-topology', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.topology() });
      queryClient.invalidateQueries({ queryKey: queryKeys.zones.lists() });
    },
  });
}
