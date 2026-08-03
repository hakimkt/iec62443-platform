import type {
  HeatMapData,
  RiskAcceptance,
  RiskEntry,
  RiskMatrixConfig,
  RiskRegister,
  RiskStats,
  RiskTreatment,
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

// ── Risk Registers ─────────────────────────────────────────────────────

export function useRiskRegisters(
  params: { page?: number; perPage?: number; search?: string; status?: string } = {},
) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.registers.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.search) queryParams['search'] = params.search;
      if (params.status) queryParams['status'] = params.status;

      const result = await client.get<PaginatedResponse<RiskRegister>>(
        '/risk-registers',
        queryParams,
      );
      return result;
    },
  });
}

export function useRiskRegister(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.registers.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RiskRegister>>(`/risk-registers/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateRiskRegister() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      scopeType?: string;
      scopeId?: string;
      ownerId?: string;
    }) => {
      const result = await client.post<SingleResponse<RiskRegister>>('/risk-registers', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.registers.lists() });
    },
  });
}

export function useUpdateRiskRegister() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<RiskRegister>>(
        `/risk-registers/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.registers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.registers.lists() });
    },
  });
}

export function useDeleteRiskRegister() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/risk-registers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.registers.lists() });
    },
  });
}

// ── Risk Entries ────────────────────────────────────────────────────────

interface RiskListParams {
  page?: number;
  perPage?: number;
  registerId?: string;
  category?: string;
  riskLevel?: string;
  treatment?: string;
  status?: string;
  search?: string;
  sort?: string;
}

export function useRisks(params: RiskListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.registerId) queryParams['registerId'] = params.registerId;
      if (params.category) queryParams['category'] = params.category;
      if (params.riskLevel) queryParams['riskLevel'] = params.riskLevel;
      if (params.treatment) queryParams['treatment'] = params.treatment;
      if (params.status) queryParams['status'] = params.status;
      if (params.search) queryParams['search'] = params.search;
      if (params.sort) queryParams['sort'] = params.sort;

      const result = await client.get<PaginatedResponse<RiskEntry>>('/risks', queryParams);
      return result;
    },
  });
}

export function useRisk(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RiskEntry>>(`/risks/${id}`);
      return result.data;
    },
    enabled: !!id,
  });
}

export function useRiskStats(registerId?: string) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.stats(),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (registerId) queryParams['registerId'] = registerId;

      const result = await client.get<SingleResponse<RiskStats>>('/risks/stats', queryParams);
      return result.data;
    },
  });
}

export function useCreateRisk() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      registerId: string;
      title: string;
      description?: string;
      category?: string;
      threatSource?: string;
      vulnerability?: string;
      assetIds?: string[];
      zoneIds?: string[];
      likelihood?: number;
      impact?: number;
      treatment?: string;
      residualLikelihood?: number;
      residualImpact?: number;
      riskOwnerId?: string;
      iecRequirement?: string;
      reassessBy?: string;
    }) => {
      const result = await client.post<SingleResponse<RiskEntry>>('/risks', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.stats() });
    },
  });
}

export function useUpdateRisk() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<RiskEntry>>(`/risks/${id}`, data);
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.stats() });
    },
  });
}

export function useDeleteRisk() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/risks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.stats() });
    },
  });
}

// ── Heat Map ────────────────────────────────────────────────────────────

export function useRiskHeatMap(registerId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.heatmap(registerId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<HeatMapData>>(
        `/risk-registers/${registerId}/heatmap`,
      );
      return result.data;
    },
    enabled: !!registerId,
  });
}

// ── Matrix Config ───────────────────────────────────────────────────────

export function useRiskMatrixConfig(registerId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.matrix(registerId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RiskMatrixConfig>>(
        `/risk-registers/${registerId}/matrix`,
      );
      return result.data;
    },
    enabled: !!registerId,
  });
}

export function useUpdateRiskMatrixConfig() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registerId, ...data }: { registerId: string; [key: string]: unknown }) => {
      const result = await client.put<SingleResponse<RiskMatrixConfig>>(
        `/risk-registers/${registerId}/matrix`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.matrix(variables.registerId) });
    },
  });
}

// ── Treatments ──────────────────────────────────────────────────────────

export function useRiskTreatments(riskId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.treatments(riskId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RiskTreatment[]>>(
        `/risks/${riskId}/treatments`,
      );
      return result.data;
    },
    enabled: !!riskId,
  });
}

export function useCreateRiskTreatment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      riskId,
      ...data
    }: {
      riskId: string;
      type: string;
      description: string;
      responsibleId?: string;
      targetDate?: string;
      costEstimate?: number;
    }) => {
      const result = await client.post<SingleResponse<RiskTreatment>>(
        `/risks/${riskId}/treatments`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.treatments(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.lists() });
    },
  });
}

export function useUpdateRiskTreatment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      riskId,
      treatmentId,
      ...data
    }: {
      riskId: string;
      treatmentId: string;
      [key: string]: unknown;
    }) => {
      const result = await client.patch<SingleResponse<RiskTreatment>>(
        `/risks/${riskId}/treatments/${treatmentId}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.treatments(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(variables.riskId) });
    },
  });
}

export function useDeleteRiskTreatment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ riskId, treatmentId }: { riskId: string; treatmentId: string }) => {
      await client.delete(`/risks/${riskId}/treatments/${treatmentId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.treatments(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(variables.riskId) });
    },
  });
}

// ── Acceptances ─────────────────────────────────────────────────────────

export function useRiskAcceptances(riskId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.risks.acceptances(riskId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<RiskAcceptance[]>>(
        `/risks/${riskId}/acceptances`,
      );
      return result.data;
    },
    enabled: !!riskId,
  });
}

export function useCreateRiskAcceptance() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      riskId,
      ...data
    }: {
      riskId: string;
      justification: string;
      expiresAt?: string;
      reviewDate?: string;
    }) => {
      const result = await client.post<SingleResponse<RiskAcceptance>>(
        `/risks/${riskId}/acceptances`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.acceptances(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.detail(variables.riskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.risks.lists() });
    },
  });
}
