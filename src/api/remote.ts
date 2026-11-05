import { EMPTY_DRAFT, type BookingDraft } from '../lib/store'
import { toast } from '../lib/ui'
import { act, api, ApiError } from './client'
import { DEVICE_ONLY, type StoreName } from './collections'
import { applyChanges, applyMe, currentMe, fullSync, STORES } from './sync'
import { logout as serverLogout } from './auth'

/** Taps that must feel instant (hearts, yes/no): run here first, then the server's answer replaces them. */
const OPTIMISTIC: Record<StoreName, string[]> = {
  ttc: ['toggleSelection', 'ratePose'],
  studio: ['togglePick', 'setPickNote'],
  os: ['setPosePick'],
}

/** Arguments the store action reads from state instead of taking them. */
const ARGS: Record<string, () => unknown[]> = {
  'ttc.submitEnquiry': () => [structuredClone(STORES.ttc.getState().draft)],
}

/** Device-side follow-ups the local action used to do. */
const AFTER: Record<string, (result: unknown, args: unknown[]) => void> = {
  'ttc.submitEnquiry': (id, [d]) => {
    const draft = d as BookingDraft
    if (typeof id === 'string') STORES.ttc.setState({ draft: { ...EMPTY_DRAFT, name: draft.name, contact: draft.contact } })
  },
}

/** Device-only actions that must also tell the server (sign out, demo reset). */
const DEVICE_HOOKS: Record<string, (local: (...a: unknown[]) => unknown, args: unknown[]) => unknown> = {
  'ttc.logout': (local, args) => {
    const role = STORES.ttc.getState().session?.role
    local(...args)
    void serverLogout(role === 'admin' ? 'admin' : 'customer').catch(() => {})
  },
  'studio.logoutStudio': (local, args) => {
    const viewAs = STORES.studio.getState().session?.viewAsAdmin
    local(...args)
    if (!viewAs) void serverLogout('studio').catch(() => {})
  },
  // One server reset covers all three stores; the other two are no-ops.
  'ttc.resetDemo': () => {
    if (!currentMe().admin) return toast('Only the studio admin can reset the demo.', 'ruby')
    void api('/api/admin/reset', { body: { mode: 'demo' } }).then(fullSync, (e: Error) => toast(e.message, 'ruby'))
  },
  'studio.resetStudioDemo': () => {},
  'os.resetOsDemo': () => {},
}

/**
 * Swaps every server-owned store action for one that runs on the server. The stores'
 * files stay unchanged; mock mode never calls this. Actions that return a value
 * (submitEnquiry, createProject, createEvent, signupStudio, addDrive, ensureGallery,
 * saveShowroomQuote) return a Promise here, so their call sites `await` them.
 */
export function bindRemote() {
  for (const store of Object.keys(STORES) as StoreName[]) {
    const state = STORES[store].getState()
    const patch: Record<string, unknown> = {}
    for (const [name, fn] of Object.entries(state)) {
      if (typeof fn !== 'function') continue
      const local = fn as (...a: unknown[]) => unknown
      const hook = DEVICE_HOOKS[`${store}.${name}`]
      if (hook) patch[name] = (...args: unknown[]) => hook(local, args)
      else if (!DEVICE_ONLY[store].includes(name)) patch[name] = remote(store, name, local)
    }
    STORES[store].setState(patch)
  }
}

function remote(store: StoreName, name: string, local: (...a: unknown[]) => unknown) {
  const key = `${store}.${name}`
  const optimistic = OPTIMISTIC[store].includes(name)
  return (...args: unknown[]) => {
    const localResult = optimistic ? local(...args) : undefined
    const sent = ARGS[key]?.() ?? args
    const p = act(store, name, sent).then(
      r => {
        applyChanges(r.changes)
        applyMe(r.me)
        AFTER[key]?.(r.result, sent)
        return r.result ?? undefined
      },
      (err: unknown) => {
        const msg = err instanceof ApiError ? (err.status === 403 ? 'Not allowed for this login.' : err.message) : 'Could not save. Try again.'
        toast(msg, 'ruby')
        if (optimistic) void fullSync().catch(() => {})
        return undefined
      },
    )
    return optimistic ? localResult : p
  }
}
