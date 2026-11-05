import { useEffect, useRef, useState } from 'react'
import type { Pick as ProofPick } from '../types'
import { createSyncQueue, diffPicks, type SyncState } from './syncQueue'

export function useMinWidth(px: number) {
  const query = `(min-width: ${px}px)`
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/**
 * Watches the event's picks and feeds every change into the sync queue.
 * Swap point: give createSyncQueue a `send` that PUTs /s/:code/selection.
 */
export function useSelectionSync(eventId: string, picks: ProofPick[]): SyncState {
  const [state, setState] = useState<SyncState>('idle')
  const prev = useRef(picks)
  const queue = useRef<ReturnType<typeof createSyncQueue> | null>(null)
  useEffect(() => {
    const q = createSyncQueue({ onState: setState })
    queue.current = q
    const onOnline = () => void q.flush()
    window.addEventListener('online', onOnline)
    return () => {
      void q.flush()
      q.dispose()
      window.removeEventListener('online', onOnline)
    }
  }, [eventId])
  useEffect(() => {
    if (prev.current === picks) return
    queue.current?.push(diffPicks(prev.current, picks))
    prev.current = picks
  }, [picks])
  return state
}
