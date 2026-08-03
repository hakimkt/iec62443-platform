import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarExpanded: boolean;
  sidebarCollapsed: boolean;
  contextPanelOpen: boolean;
  contextPanelEntity: { type: string; id: string } | null;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark' | 'system';

  toggleSidebar: () => void;
  setSidebarExpanded: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  openContextPanel: (type: string, id: string) => void;
  closeContextPanel: () => void;
  setCommandPaletteOpen: (value: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarExpanded: true,
      sidebarCollapsed: false,
      contextPanelOpen: false,
      contextPanelEntity: null,
      commandPaletteOpen: false,
      theme: 'system',

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      setSidebarExpanded: (value) => set({ sidebarExpanded: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      openContextPanel: (type, id) =>
        set({ contextPanelOpen: true, contextPanelEntity: { type, id } }),
      closeContextPanel: () => set({ contextPanelOpen: false, contextPanelEntity: null }),
      setCommandPaletteOpen: (value) => set({ commandPaletteOpen: value }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);
