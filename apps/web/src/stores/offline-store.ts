import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PendingMutation {
  id: string;
  url: string;
  method: string;
  body: unknown;
  createdAt: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingMutations: PendingMutation[];
  syncInProgress: boolean;
  lastSyncAt: string | null;

  setOnline: (online: boolean) => void;
  enqueueMutation: (mutation: Omit<PendingMutation, 'id' | 'createdAt'>) => void;
  removeMutation: (id: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setLastSyncAt: (date: string) => void;
  clearQueue: () => void;
}

// Initialize to true to avoid hydration mismatch — OfflineBanner syncs
// the real value via window online/offline events in a useEffect.
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: true,
      pendingMutations: [],
      syncInProgress: false,
      lastSyncAt: null,

      setOnline: (online) => set({ isOnline: online }),

      enqueueMutation: (mutation) =>
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            {
              ...mutation,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      removeMutation: (id) =>
        set((state) => ({
          pendingMutations: state.pendingMutations.filter((m) => m.id !== id),
        })),

      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      clearQueue: () => set({ pendingMutations: [] }),
    }),
    {
      name: 'offline-storage',
      partialize: (state) => ({
        pendingMutations: state.pendingMutations,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);
