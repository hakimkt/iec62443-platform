'use client';

import { AppShell } from '@/components/layout/AppShell';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <OfflineBanner />
      {children}
    </AppShell>
  );
}
