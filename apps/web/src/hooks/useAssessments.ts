import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import type {
  AssessmentEngagement,
  AssessmentTemplate,
  AssessmentQuestion,
  AssessmentResponse,
  AssessmentScorecard,
  AssessmentProgress,
} from '@iec62443/shared-types';

interface EngagementListParams {
  page?: number;
  perPage?: number;
  status?: string;
  type?: string;
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

// ── Templates ──────────────────────────────────────────────────────────

export function useAssessmentTemplates(filters?: { iecPart?: string }) {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.assessments.all, 'templates', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.iecPart) params['iecPart'] = filters.iecPart;
      const result = await client.get<SingleResponse<AssessmentTemplate[]>>(
        '/assessment-templates',
        Object.keys(params).length > 0 ? params : undefined,
      );
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useAssessmentTemplate(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.assessments.all, 'template', id],
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssessmentTemplate>>(
        `/assessment-templates/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      iecPart: string;
      version: string;
      sections?: unknown[];
    }) => {
      const result = await client.post<SingleResponse<AssessmentTemplate>>(
        '/assessment-templates',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.assessments.all, 'templates'] });
    },
  });
}

// ── Engagements (Assessments) ──────────────────────────────────────────

export function useAssessments(params: EngagementListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assessments.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.status) queryParams['status'] = params.status;
      if (params.type) queryParams['type'] = params.type;
      if (params.search) queryParams['search'] = params.search;
      if (params.sort) queryParams['sort'] = params.sort;

      const result = await client.get<PaginatedResponse<AssessmentEngagement>>(
        '/assessments',
        queryParams,
      );
      return result;
    },
  });
}

export function useAssessment(id: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assessments.detail(id ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssessmentEngagement>>(
        `/assessments/${id}`,
      );
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      type: string;
      templateId: string;
      iecPart?: string;
      targetSl?: number;
      leadAssessorId?: string;
      startDate?: string;
      targetDate?: string;
    }) => {
      const result = await client.post<SingleResponse<AssessmentEngagement>>(
        '/assessments',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
    },
  });
}

export function useUpdateAssessment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      [key: string]: unknown;
    }) => {
      const result = await client.patch<SingleResponse<AssessmentEngagement>>(
        `/assessments/${id}`,
        data,
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
    },
  });
}

export function useDeleteAssessment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/assessments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
    },
  });
}

// ── Questions & Responses ──────────────────────────────────────────────

export function useAssessmentQuestions(engagementId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assessments.questions(engagementId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<(AssessmentQuestion & { response?: AssessmentResponse })[]>>(
        `/assessments/${engagementId}/questions`,
      );
      return result.data;
    },
    enabled: !!engagementId,
  });
}

export function useSubmitResponse() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      engagementId,
      questionId,
      ...data
    }: {
      engagementId: string;
      questionId: string;
      score?: number;
      maturityLevel?: number;
      assessorNotes?: string;
      evidenceRefs?: string[];
      findingRefs?: string[];
    }) => {
      const result = await client.post<SingleResponse<AssessmentResponse>>(
        `/assessments/${engagementId}/responses`,
        { questionId, ...data },
      );
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.questions(variables.engagementId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.detail(variables.engagementId),
      });
    },
  });
}

// ── Scorecard ──────────────────────────────────────────────────────────

export function useAssessmentScorecard(engagementId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.assessments.scorecard(engagementId ?? ''),
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssessmentScorecard[]>>(
        `/assessments/${engagementId}/scorecard`,
      );
      return result.data;
    },
    enabled: !!engagementId,
  });
}

// ── Progress ───────────────────────────────────────────────────────────

export function useAssessmentProgress(engagementId: string | null) {
  const client = getApiClient();

  return useQuery({
    queryKey: [...queryKeys.assessments.detail(engagementId ?? ''), 'progress'],
    queryFn: async () => {
      const result = await client.get<SingleResponse<AssessmentProgress>>(
        `/assessments/${engagementId}/progress`,
      );
      return result.data;
    },
    enabled: !!engagementId,
  });
}

export function useCompleteAssessment() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (engagementId: string) => {
      const result = await client.patch<SingleResponse<AssessmentEngagement>>(
        `/assessments/${engagementId}`,
        { status: 'completed' },
      );
      return result.data;
    },
    onSuccess: (_data, engagementId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.detail(engagementId) });
    },
  });
}
