import type { ZodSchema } from 'zod';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onAccessTokenRefreshed: (accessToken: string, refreshToken: string) => void;
  onAuthenticationFailure: () => void;
}

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  schema?: ZodSchema<unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
    last?: string;
  };
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
    last?: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; message: string }>;
  public readonly requestId: string;

  constructor(status: number, body: ApiError) {
    super(body.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.error.code;
    this.details = body.error.details;
    this.requestId = body.meta.requestId;
  }
}

export class ApiClient {
  private readonly config: ApiClientConfig;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  async request<T>(requestConfig: ApiRequestConfig): Promise<T> {
    const url = this.buildUrl(requestConfig.path, requestConfig.params);
    const accessToken = this.config.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...requestConfig.headers,
    };

    const response = await fetch(url, {
      method: requestConfig.method,
      headers,
      body: requestConfig.body ? JSON.stringify(requestConfig.body) : undefined,
      signal: requestConfig.signal,
    });

    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(requestConfig);
      }
      this.config.onAuthenticationFailure();
      throw new ApiClientError(401, {
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        meta: { requestId: '', timestamp: new Date().toISOString() },
      });
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        error: { code: 'UNKNOWN_ERROR', message: `HTTP ${response.status}` },
        meta: { requestId: '', timestamp: new Date().toISOString() },
      })) as ApiError;
      throw new ApiClientError(response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json();

    if (requestConfig.schema) {
      return requestConfig.schema.parse(json) as T;
    }

    return json as T;
  }

  async get<T>(path: string, params?: Record<string, string>, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>({ method: 'GET', path, params, schema });
  }

  async post<T>(path: string, body?: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, schema });
  }

  async put<T>(path: string, body?: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, schema });
  }

  async patch<T>(path: string, body?: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, schema });
  }

  async delete<T = void>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }

  async upload<T>(path: string, formData: FormData, schema?: ZodSchema<T>): Promise<T> {
    const url = this.buildUrl(path);
    const accessToken = this.config.getAccessToken();

    const headers: Record<string, string> = {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({
        error: { code: 'UNKNOWN_ERROR', message: `HTTP ${response.status}` },
        meta: { requestId: '', timestamp: new Date().toISOString() },
      })) as ApiError;
      throw new ApiClientError(response.status, errorBody);
    }

    const json = await response.json();
    if (schema) {
      return schema.parse(json) as T;
    }
    return json as T;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const base = this.config.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return true;
    }

    const refreshToken = this.config.getRefreshToken();
    if (!refreshToken) return false;

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      await this.refreshPromise;
      return true;
    } catch {
      return false;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<void> {
    const url = this.buildUrl('/auth/refresh');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.config.onAccessTokenRefreshed(data.data.accessToken, data.data.refreshToken);
  }
}
