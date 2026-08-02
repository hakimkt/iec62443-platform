import { ApiClient } from '@iec62443/api-client';

import { getApiBaseUrl } from './codespace';

const API_BASE_URL = getApiBaseUrl();

let browserApiClient: ApiClient | undefined;

export function getApiClient(): ApiClient {
  if (typeof window === 'undefined') {
    return new ApiClient({
      baseUrl: `${API_BASE_URL}/api/v1`,
      getAccessToken: () => null,
      getRefreshToken: () => null,
      onAccessTokenRefreshed: () => {},
      onAuthenticationFailure: () => {},
    });
  }

  if (!browserApiClient) {
    browserApiClient = new ApiClient({
      baseUrl: `${API_BASE_URL}/api/v1`,
      getAccessToken: () => {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) return null;
        try {
          const parsed = JSON.parse(authStorage);
          return parsed?.state?.accessToken ?? null;
        } catch {
          return null;
        }
      },
      getRefreshToken: () => {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) return null;
        try {
          const parsed = JSON.parse(authStorage);
          return parsed?.state?.refreshToken ?? null;
        } catch {
          return null;
        }
      },
      onAccessTokenRefreshed: (accessToken: string, refreshToken: string) => {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) return;
        try {
          const parsed = JSON.parse(authStorage);
          localStorage.setItem(
            'auth-storage',
            JSON.stringify({
              ...parsed,
              state: {
                ...parsed.state,
                accessToken,
                refreshToken,
              },
            }),
          );
          // Sync updated token to cookie for middleware
          document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { isAuthenticated: true, accessToken, currentTenantId: parsed?.state?.currentTenantId } }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        } catch {
          // Silently ignore storage errors
        }
      },
      onAuthenticationFailure: () => {
        localStorage.removeItem('auth-storage');
        document.cookie = 'auth-storage=; path=/; max-age=0';
        window.location.href = '/login';
      },
    });
  }

  return browserApiClient;
}
