import { api } from './client'
import type { Change, Me } from './collections'
import { restartLive } from './live'
import { isLan } from './mode'
import { applyChanges, currentMe, fullSync, hasDoc, preferRole, STORES } from './sync'

async function after<T>(p: Promise<T>, role?: 'admin' | 'client'): Promise<T> {
  const r = await p
  if (role) preferRole(role)
  await fullSync()
  restartLive()
  return r
}

export const adminLogin = (name: string, password: string) => after(api<Me>('/api/auth/admin/login', { body: { name, password } }), 'admin')

/** Asks for a login code. On the LAN it appears on the admin screen for staff to read out. */
export const requestCode = (phone: string, purpose: 'customer' | 'studio') => api<{ ok: true; expiresAt: string }>('/api/auth/code/request', { body: { phone, purpose } })
export const verifyCode = (phone: string, purpose: 'customer' | 'studio', code: string) => after(api<Me>('/api/auth/code/verify', { body: { phone, purpose, code } }), purpose === 'customer' ? 'client' : undefined)

/** Customer link + PIN (gallery, poses, portal). */
export const openGate = (code: string, pin: string | undefined) => after(api<{ me: Me; kind: 'project' | 'event'; id: string }>('/api/auth/gate', { body: { code, pin } }))

export const logout = (realm?: 'admin' | 'customer' | 'studio' | 'gate') => after(api<Me>('/api/auth/logout', { body: { realm } }))

/** True when this device already opened the project or gallery with its PIN. */
export function gateOpen(kind: 'project' | 'event', id: string | undefined): boolean {
  if (!id) return false
  const me = currentMe()
  if (me.admin) return true
  return kind === 'project' ? me.gates.projects.includes(id) : me.gates.events.includes(id)
}

/**
 * Loads what a customer link shows before the PIN: the studio's brand, the title, the cover.
 * The preview is a trimmed copy (no quote lines, payments or contract), so it only fills
 * records the snapshot didn't already bring; a device that opened the PIN keeps the full ones.
 */
export async function loadGate(code: string) {
  const r = await api<{ changes: Change[] }>(`/api/gate/${encodeURIComponent(code.toLowerCase())}`).catch(() => undefined)
  if (r) applyChanges(r.changes.filter(c => !hasDoc(c.coll, c.id)))
}

/** True when this device may open the gallery (its own PIN, or the PIN of the project it belongs to). */
export function eventGateOpen(eventId: string | undefined): boolean {
  if (!eventId) return false
  const me = currentMe()
  if (me.admin || me.gates.events.includes(eventId)) return true
  const projects = STORES.os.getState().projects as { id: string; galleryEventId?: string }[]
  return projects.some(p => p.galleryEventId === eventId && me.gates.projects.includes(p.id))
}

/** Checks a customer PIN: on the server in LAN mode, against the record otherwise. */
export async function checkPin(code: string, pin: string | undefined, expected: string | undefined): Promise<boolean> {
  if (!isLan()) return !expected || pin?.trim() === expected
  try {
    await openGate(code, pin?.trim())
    return true
  } catch {
    return false
  }
}
