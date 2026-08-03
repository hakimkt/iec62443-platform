'use client';

import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToasterProvider } from './toaster-provider';
import { WebSocketProvider } from './websocket-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>{children}</WebSocketProvider>
          <ToasterProvider />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
