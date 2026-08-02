/**
 * Resolve the API base URL for the current environment.
 *
 * Priority:
 *  1. NEXT_PUBLIC_API_URL env var (explicit override)
 *  2. GitHub Codespaces — derived from CODESPACE_NAME + port
 *  3. Fallback — http://localhost:4000
 */
export function getApiBaseUrl(): string {
  if (process.env['NEXT_PUBLIC_API_URL']) {
    return process.env['NEXT_PUBLIC_API_URL'];
  }

  // GitHub Codespaces exposes CODESPACE_NAME; the proxied URL follows
  // the pattern https://{CODESPACE_NAME}-{PORT}.app.github.dev
  if (process.env['CODESPACE_NAME']) {
    return `https://${process.env['CODESPACE_NAME']}-4000.app.github.dev`;
  }

  return 'http://localhost:4000';
}

/**
 * Resolve the WebSocket URL for the current environment.
 */
export function getWsBaseUrl(): string | undefined {
  if (process.env['NEXT_PUBLIC_WS_URL']) {
    return process.env['NEXT_PUBLIC_WS_URL'];
  }

  if (process.env['CODESPACE_NAME']) {
    return `wss://${process.env['CODESPACE_NAME']}-4000.app.github.dev`;
  }

  return undefined;
}
