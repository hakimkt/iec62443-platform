'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { AuthProvider } from './auth-provider';
import { ToasterProvider } from './toaster-provider';
import { WebSocketProvider } from './websocket-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
          <ToasterProvider />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
