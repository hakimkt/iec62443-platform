import type { AuditEvent, Role, Tenant, TenantMember } from '@iec62443/shared-types';
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

// ── Members ─────────────────────────────────────────────────────────────

interface MemberListParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  status?: string;
}

export function useMembers(params: MemberListParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.admin.members.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.search) queryParams['search'] = params.search;
      if (params.role) queryParams['role'] = params.role;
      if (params.status) queryParams['status'] = params.status;

      const result = await client.get<PaginatedResponse<TenantMember>>(
        '/admin/members',
        queryParams,
      );
      return result;
    },
  });
}

export function useInviteMember() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      const result = await client.post<SingleResponse<TenantMember>>('/admin/members/invite', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members.lists() });
    },
  });
}

export function useUpdateMember() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, ...data }: { userId: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<TenantMember>>(
        `/admin/members/${userId}`,
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members.lists() });
    },
  });
}

export function useRemoveMember() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await client.delete(`/admin/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members.lists() });
    },
  });
}

// ── Roles ───────────────────────────────────────────────────────────────

export function useRoles() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.admin.roles.lists(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Role[]>>('/admin/roles');
      return result.data;
    },
  });
}

export function useCreateRole() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions?: string[] }) => {
      const result = await client.post<SingleResponse<Role>>('/admin/roles', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.lists() });
    },
  });
}

export function useUpdateRole() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const result = await client.patch<SingleResponse<Role>>(`/admin/roles/${id}`, data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.lists() });
    },
  });
}

export function useDeleteRole() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/admin/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.lists() });
    },
  });
}

// ── API Keys ────────────────────────────────────────────────────────────

interface ApiKeyShape {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export function useApiKeys() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.admin.apiKeys.lists(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<ApiKeyShape[]>>('/admin/api-keys');
      return result.data;
    },
  });
}

export function useCreateApiKey() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; expiresAt?: string }) => {
      const result = await client.post<SingleResponse<{ id: string; key: string }>>(
        '/admin/api-keys',
        data,
      );
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.apiKeys.lists() });
    },
  });
}

export function useRevokeApiKey() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.post(`/admin/api-keys/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.apiKeys.lists() });
    },
  });
}

// ── Audit Log ───────────────────────────────────────────────────────────

interface AuditLogParams {
  page?: number;
  perPage?: number;
  eventTypes?: string[];
  entityTypes?: string[];
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useAuditLog(params: AuditLogParams = {}) {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.admin.auditLog.list(params as Record<string, unknown>),
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params.page) queryParams['page'] = String(params.page);
      if (params.perPage) queryParams['perPage'] = String(params.perPage);
      if (params.eventTypes?.length) queryParams['eventTypes'] = params.eventTypes.join(',');
      if (params.entityTypes?.length) queryParams['entityTypes'] = params.entityTypes.join(',');
      if (params.userIds?.length) queryParams['userIds'] = params.userIds.join(',');
      if (params.dateFrom) queryParams['dateFrom'] = params.dateFrom;
      if (params.dateTo) queryParams['dateTo'] = params.dateTo;
      if (params.search) queryParams['search'] = params.search;

      const result = await client.get<PaginatedResponse<AuditEvent>>(
        '/admin/audit-log',
        queryParams,
      );
      return result;
    },
  });
}

// ── Tenant Settings ─────────────────────────────────────────────────────

export function useTenantSettings() {
  const client = getApiClient();

  return useQuery({
    queryKey: queryKeys.admin.settings.detail(),
    queryFn: async () => {
      const result = await client.get<SingleResponse<Tenant>>('/admin/settings');
      return result.data;
    },
  });
}

export function useUpdateTenantSettings() {
  const client = getApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await client.patch<SingleResponse<Tenant>>('/admin/settings', data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings.detail() });
    },
  });
}
