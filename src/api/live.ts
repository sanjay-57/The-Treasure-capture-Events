import { applyChanges, fullSync, setSeq } from './sync'
import type { Change } from './collections'

let es: EventSource | undefined

/** A login code was made; admin screens listen for this. */
export const CODE_EVENT = 'ttc:login-code'

/**
 * Opens the live stream: changes other devices make show up here within a moment
 * (new photos for the couple, hearts for the studio, new enquiries for admin).
 * EventSource reconnects by itself and resumes from the last event id.
 */
export function startLive() {
  es?.close()
  es = new EventSource('/api/live', { withCredentials: true })
  es.addEventListener('changes', e => {
    const d = JSON.parse((e as MessageEvent).data) as { seq: number; changes: Change[] }
    setSeq(d.seq)
    applyChanges(d.changes)
  })
  es.addEventListener('resync', () => void fullSync().catch(() => {}))
  for (const name of ['code', 'code-used']) {
    es.addEventListener(name, e => window.dispatchEvent(new CustomEvent(CODE_EVENT, { detail: { type: name, ...JSON.parse((e as MessageEvent).data) } })))
  }
}

/** After a login the device has a new session; reconnect so the stream uses it. */
export const restartLive = () => {
  if (es) startLive()
}
