'use client';

import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/providers/auth-provider';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { filterNavByPermissions, navSections } from '@/config/nav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuth();

  const userRole: string = user ? 'admin' : 'viewer';
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const permissions = new Set([
    'assessment:read',
    'asset:read',
    'purdue:read',
    'zone:read',
    'finding:read',
    'risk:read',
    'evidence:read',
    'remediation:read',
    'csms:read',
    'report:read',
    'admin:read',
  ]);

  const filteredSections = filterNavByPermissions(
    navSections,
    permissions,
    isAdmin,
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar
        sections={filteredSections}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        className="hidden lg:flex"
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] p-6">
            {children}
          </div>
        </main>
      </div>

      {sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          onKeyDown={(e) => {
            if (e.key === 'Escape') toggleSidebar();
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}
