import { ApiClient } from '@iec62443/api-client';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

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
        } catch {
          // Silently ignore storage errors
        }
      },
      onAuthenticationFailure: () => {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      },
    });
  }

  return browserApiClient;
}
