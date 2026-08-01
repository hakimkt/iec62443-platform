'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthUser, type AuthTenant } from '@/stores/auth-store';
import { getApiClient } from '@/lib/api';
import { ApiClientError } from '@iec62443/api-client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenants: AuthTenant[];
  currentTenantId: string | null;
  mfaChallenge: { requestId: string; userId: string } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const store = useAuthStore();
  const client = useMemo(() => getApiClient(), []);

  useEffect(() => {
    if (store.isAuthenticated && !store.user) {
      client.get('/auth/me').then((response: unknown) => {
        const res = response as { data?: { user?: AuthUser; tenants?: AuthTenant[] } };
        if (!res?.data) return;
        store.setUser(res.data.user ?? null);
        store.setTenants(res.data.tenants ?? []);
        if (!store.currentTenantId && res.data.tenants?.length) {
          store.setCurrentTenant(res.data.tenants[0]?.id ?? '');
        }
      }).catch((err: unknown) => {
        // Only log out on 401 (token expired/invalid), not on network errors
        if (err instanceof ApiClientError && err.status === 401) {
          store.logout();
        }
      });
    }
  }, [store.isAuthenticated]);

  const login = useCallback(
    async (email: string, password: string) => {
      store.setLoading(true);
      try {
        const result = await client.post('/auth/login', { email, password }) as Record<string, unknown>;
        const data = result as { data?: Record<string, unknown> };
        const responseData = data?.data;

        if (responseData?.['mfaRequired'] && responseData?.['mfaRequestId']) {
          store.setMfaChallenge({
            requestId: responseData['mfaRequestId'] as string,
            userId: (responseData?.['user'] as Record<string, unknown>)?.['id'] as string ?? '',
          });
          router.push('/mfa');
          return;
        }

        store.setTokens(responseData?.['accessToken'] as string, responseData?.['refreshToken'] as string);
        store.setUser(responseData?.['user'] as AuthUser);
        store.setTenants((responseData?.['tenants'] ?? []) as AuthTenant[]);
        store.setAuthenticated(true);
        store.setMfaChallenge(null);

        const tenants = (responseData?.['tenants'] ?? []) as AuthTenant[];
        if (!store.currentTenantId && tenants.length > 0) {
          store.setCurrentTenant(tenants[0]?.id ?? '');
        }

        router.push('/dashboard');
      } finally {
        store.setLoading(false);
      }
    },
    [client, router, store],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      store.setLoading(true);
      try {
        const result = await client.post('/auth/register', { email, password, firstName, lastName }) as Record<string, unknown>;
        const data = result as { data?: Record<string, unknown> };
        const responseData = data?.data;

        store.setTokens(responseData?.['accessToken'] as string, responseData?.['refreshToken'] as string);
        store.setUser(responseData?.['user'] as AuthUser);
        store.setTenants((responseData?.['tenants'] ?? []) as AuthTenant[]);
        store.setAuthenticated(true);

        const tenants = (responseData?.['tenants'] ?? []) as AuthTenant[];
        if (tenants.length > 0) {
          store.setCurrentTenant(tenants[0]?.id ?? '');
        }

        router.push('/dashboard');
      } finally {
        store.setLoading(false);
      }
    },
    [client, router, store],
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await client.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Logout endpoint failure should not prevent local logout
    }
    store.logout();
    router.push('/login');
  }, [client, router, store]);

  const verifyMfa = useCallback(
    async (code: string) => {
      const challenge = store.mfaChallenge;
      if (!challenge) {
        throw new Error('No MFA challenge in progress');
      }

      store.setLoading(true);
      try {
        const result = await client.post('/auth/mfa/challenge', {
          code,
          requestId: challenge.requestId,
        }) as Record<string, unknown>;
        const data = result as { data?: Record<string, unknown> };
        const responseData = data?.data;

        store.setTokens(responseData?.['accessToken'] as string, responseData?.['refreshToken'] as string);
        store.setUser(responseData?.['user'] as AuthUser);
        store.setTenants((responseData?.['tenants'] ?? []) as AuthTenant[]);
        store.setAuthenticated(true);
        store.setMfaChallenge(null);

        const tenants = (responseData?.['tenants'] ?? []) as AuthTenant[];
        if (!store.currentTenantId && tenants.length > 0) {
          store.setCurrentTenant(tenants[0]?.id ?? '');
        }

        router.push('/dashboard');
      } finally {
        store.setLoading(false);
      }
    },
    [client, router, store],
  );

  const forgotPassword = useCallback(
    async (email: string) => {
      await client.post('/auth/forgot-password', { email });
    },
    [client],
  );

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      await client.post('/auth/reset-password', { token, password });
      router.push('/login');
    },
    [client, router],
  );

  const switchTenant = useCallback(
    (tenantId: string) => {
      store.setCurrentTenant(tenantId);
    },
    [store],
  );

  const value = useMemo(
    () => ({
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      isLoading: store.isLoading,
      tenants: store.tenants,
      currentTenantId: store.currentTenantId,
      mfaChallenge: store.mfaChallenge,
      login,
      register,
      logout,
      verifyMfa,
      forgotPassword,
      resetPassword,
      switchTenant,
    }),
    [store, login, register, logout, verifyMfa, forgotPassword, resetPassword, switchTenant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
