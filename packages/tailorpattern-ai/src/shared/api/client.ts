/// <reference types="vite/client" />
// API client layer — no-op in Phase 1 (offline-first / IndexedDB only)
// Activated when cloud sync is introduced in Phase 3
// All service files route through this client so the switch is seamless

const BASE_URL = import.meta.env['VITE_API_URL'] ?? ''
const API_TIMEOUT = 15_000

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export class ApiClient {
  private readonly baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setAuthToken(token: string | null): void {
    this.authToken = token
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : null,
        signal: controller.signal,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error((error as { message: string }).message ?? 'API request failed')
      }

      return res.json() as Promise<T>
    } finally {
      clearTimeout(timeout)
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path)
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(BASE_URL)
