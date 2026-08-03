import type {
  ChainOfCustodyEvent,
  EvidenceItem,
  EvidenceLink,
  StorageQuota,
} from '@iec62443/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

interface EvidenceListParams {
  page?: number;
  perPage?: number;
  evidenceType?: string;
  search?: string;
  tags?: string[];
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

// ── Evidence CRUD ────────────────────────────────────────────────────

export function useEvidence(params: EvidenceListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.evidenceType) queryParams['evidenceType'] = params.evidenceType;
      if (params.search) queryParams['search'] = params.search;
      if (params.tags?.length) queryParams['tags'] = params.tags.join(',');

      const result = await client.get<PaginatedResponse<EvidenceItem>>('/evidence', queryParams);
      return result;
    },
  });
}

export function useEvidenceItem(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<EvidenceItem>>(`/evidence/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateEvidence() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      evidenceType: string;
      retentionUntil?: string;
      tags?: string[];
    }) => {
      const result = await client.post<SingleResponse<EvidenceItem>>('/evidence', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.lists() });
    },
  });
}

export function useUpdateEvidence() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string;
      tags?: string[];
    }) => {
      const result = await client.patch<SingleResponse<EvidenceItem>>(`/evidence/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.lists() });
    },
  });
}

export function useDeleteEvidence() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/evidence/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.lists() });
    },
  });
}

// ── Evidence Links ───────────────────────────────────────────────────

export function useEvidenceLinks(evidenceId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.links(evidenceId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<EvidenceLink[]>>(
        `/evidence/${evidenceId}/links`,
      );
      return result.data;
    },
    enabled: !!evidenceId,
  });
}

export function useLinkEvidence() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      evidenceId,
      entityType,
      entityId,
    }: {
      evidenceId: string;
      entityType: string;
      entityId: string;
    }) => {
      const result = await client.post<SingleResponse<EvidenceLink>>(
        `/evidence/${evidenceId}/links`,
        { entityType, entityId },
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.evidence.links(variables.evidenceId),
      });
    },
  });
}

export function useUnlinkEvidence() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ evidenceId, linkId }: { evidenceId: string; linkId: string }) => {
      await client.delete(`/evidence/${evidenceId}/links/${linkId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.evidence.links(variables.evidenceId),
      });
    },
  });
}

// ── Chain of Custody ─────────────────────────────────────────────────

export function useChainOfCustody(evidenceId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.custody(evidenceId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<ChainOfCustodyEvent[]>>(
        `/evidence/${evidenceId}/chain-of-custody`,
      );
      return result.data;
    },
    enabled: !!evidenceId,
  });
}

// ── Evidence Verification ────────────────────────────────────────────

export function useVerifyEvidence(evidenceId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.verify(evidenceId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<{ verified: boolean; hash: string }>>(
        `/evidence/${evidenceId}/verify`,
      );
      return result.data;
    },
    enabled: !!evidenceId,
  });
}

// ── Storage Quota ────────────────────────────────────────────────────

export function useStorageQuota() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.evidence.storage(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<StorageQuota>>('/tenant/storage');
      return result.data;
    },
  });
}
