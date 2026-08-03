'use client';

import { CloudOff, WifiOff } from 'lucide-react';
import { useEffect } from 'react';
import { useOfflineStore } from '@/stores/offline-store';

export function OfflineBanner() {
  const { isOnline, pendingMutations, setOnline } = useOfflineStore();

  useEffect(() => {
    // Sync the real navigator.onLine value on mount (store initializes to true
    // to avoid hydration mismatch, so we need to correct it if actually offline).
    setOnline(navigator.onLine);

    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800 border-b border-amber-200">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        You are offline. Changes will be saved locally and synced when you reconnect.
      </span>
      {pendingMutations.length > 0 && (
        <span className="flex items-center gap-1 text-amber-700">
          <CloudOff className="h-3.5 w-3.5" />
          {pendingMutations.length} pending
        </span>
      )}
    </div>
  );
}
