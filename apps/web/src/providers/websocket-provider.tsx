'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getWsBaseUrl } from '@/lib/codespace';

interface WebSocketContextValue {
  connected: boolean;
  subscribe: (event: string, handler: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 3000;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const accessToken = useAuthStore((s) => s.accessToken);

  const connect = useCallback(() => {
    const wsUrl = getWsBaseUrl();
    if (!wsUrl) return;

    const token = accessToken ?? '';

    try {
      const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);

      ws.onopen = () => {
        setConnected(true);
        attemptsRef.current = 0;
      };

      ws.onclose = () => {
        setConnected(false);
        if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          attemptsRef.current++;
          const delay = RECONNECT_BASE_DELAY_MS * attemptsRef.current;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type: string;
            data: unknown;
          };
          const handlers = handlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data));
          }
        } catch {
          // Ignore malformed messages
        }
      };

      wsRef.current = ws;
    } catch {
      // WebSocket constructor may throw in environments that don't support it
      setConnected(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [accessToken, connect]);

  const subscribe = useCallback(
    (event: string, handler: (data: unknown) => void) => {
      if (!handlersRef.current.has(event)) {
        handlersRef.current.set(event, new Set());
      }
      handlersRef.current.get(event)!.add(handler);

      return () => {
        handlersRef.current.get(event)?.delete(handler);
      };
    },
    [],
  );

  const value = { connected, subscribe };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
