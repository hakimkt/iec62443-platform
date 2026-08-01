import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sync auth state to a cookie so Next.js middleware (server-side) can read it.
// zustand/persist writes to localStorage by default, which is client-only.
function syncAuthCookie(state: Partial<AuthState>) {
  if (typeof window === 'undefined') return;
  const payload = {
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    currentTenantId: state.currentTenantId,
  };
  document.cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: payload }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  mfaEnabled: boolean;
  status: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenants: AuthTenant[];
  currentTenantId: string | null;
  mfaChallenge: { requestId: string; userId: string } | null;

  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setTenants: (tenants: AuthTenant[]) => void;
  setCurrentTenant: (tenantId: string) => void;
  setMfaChallenge: (challenge: { requestId: string; userId: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      tenants: [],
      currentTenantId: null,
      mfaChallenge: null,

      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        syncAuthCookie({ accessToken });
      },
      setAuthenticated: (value) => {
        set({ isAuthenticated: value });
        syncAuthCookie({ isAuthenticated: value });
      },
      setLoading: (value) => set({ isLoading: value }),
      setTenants: (tenants) => set({ tenants }),
      setCurrentTenant: (tenantId) => {
        set({ currentTenantId: tenantId });
        syncAuthCookie({ currentTenantId: tenantId });
      },
      setMfaChallenge: (challenge) => set({ mfaChallenge: challenge }),
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          tenants: [],
          currentTenantId: null,
          mfaChallenge: null,
        });
        syncAuthCookie({ isAuthenticated: false, accessToken: null, currentTenantId: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tenants: state.tenants,
        currentTenantId: state.currentTenantId,
      }),
    },
  ),
);
