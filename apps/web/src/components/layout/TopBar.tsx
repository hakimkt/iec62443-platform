'use client';

import { cn } from '@iec62443/ui';
import { Button } from '@iec62443/ui/primitives';
import { Separator } from '@iec62443/ui/primitives';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/providers/auth-provider';
import { useOfflineStore } from '@/stores/offline-store';

interface TopBarProps {
  children?: React.ReactNode;
  className?: string;
}

export function TopBar({ children, className }: TopBarProps) {
  const { toggleSidebar } = useUIStore();

  return (
    <header
      className={cn(
        'flex h-12 items-center gap-3 border-b border-surface-200 bg-surface-0 px-4',
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        {children}
      </div>

      <Separator layout="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <SyncStatusIndicator />
        <UserMenu />
      </div>
    </header>
  );
}

function SyncStatusIndicator() {
  const { isOnline } = useOfflineStore();

  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md',
        isOnline ? 'text-surface-400' : 'text-amber-500',
      )}
      title={isOnline ? 'Online' : 'Offline — changes will sync when reconnected'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        {isOnline ? (
          <>
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </>
        ) : (
          <>
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 7.5a15 15 0 0 1 3.5 2.3" />
            <path d="M5 12.55a11 11 0 0 1 5.17 2.35" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </>
        )}
      </svg>
    </div>
  );
}

function UserMenu() {
  const { user } = useAuth();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '?';

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
          {initials}
        </div>
        <span className="hidden text-sm text-surface-700 md:inline-block">
          {user ? `${user.firstName} ${user.lastName}` : ''}
        </span>
      </Button>
    </div>
  );
}
