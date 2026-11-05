import type { Change, Me, StoreName } from './collections'

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

/** JSON call to the server on the same origin (Vite proxies /api in dev). */
export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? (init.body !== undefined || init.form ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: init.form ? undefined : init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  }).catch(() => {
    throw new ApiError(0, 'offline', 'Cannot reach the studio server. Check the Wi-Fi.')
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'error', data?.message ?? data?.error ?? `Request failed (${res.status})`)
  return data as T
}

export interface ActResult {
  result: unknown
  seq: number
  changes: Change[]
  me: Me
}

/** Runs a store action on the server. */
export const act = (store: StoreName, action: string, args: unknown[]) => api<ActResult>('/api/act', { body: { store, action, args } })
