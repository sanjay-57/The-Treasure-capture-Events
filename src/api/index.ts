import { loadGate } from './auth'
import { startLive } from './live'
import { installPolyfills } from './polyfills'
import { bindRemote } from './remote'
import { STORES, fullSync } from './sync'

/** Customer links that need their gate info before the first render. */
const GATE_PATH = /^\/(?:gallery|poses|p|s)\/([a-z0-9]{4,32})(?:\/|$)/i

/**
 * Starts LAN mode: stop caching server data in localStorage, route store actions to
 * the server, load this device's data, then listen for live changes. Called from
 * main.tsx before the first render so screens never flash mock data.
 */
export async function startBackend(path: string) {
  installPolyfills()
  // Only device settings stay in localStorage; orders, galleries and studios come from the server.
  const keep: Record<string, string[]> = { ttc: ['lang', 'lead', 'leadPromptDone', 'draft', 'moodboard'], studio: [], os: [] }
  for (const [name, store] of Object.entries(STORES)) {
    const p = (store as any).persist
    p?.setOptions?.({ partialize: (s: Record<string, unknown>) => Object.fromEntries(keep[name].filter(k => k in s).map(k => [k, s[k]])) })
  }
  bindRemote()
  try {
    await fullSync()
    const m = GATE_PATH.exec(path)
    if (m && m[1]) await loadGate(m[1])
  } catch {
    // Server unreachable: the site still renders; actions will show "Cannot reach the studio server".
  }
  startLive()
}

export { isLan, BACKEND } from './mode'
