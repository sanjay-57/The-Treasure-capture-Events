import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../../lib/store'
import { useStudioStore } from '../store'
import type { StudioEvent } from '../types'
import { isLan } from '../../api/mode'
import { checkPin, eventGateOpen } from '../../api/auth'

/**
 * Per-browser state for one share code:
 * - PIN success and "entered" live in sessionStorage (ask again in a new tab session).
 * - The "who is choosing" name lives in localStorage (same phone, same person).
 * - First visit switches the language to the event's language once.
 * - 'opened' is logged once per browser session.
 */

const ss = typeof window !== 'undefined' ? window.sessionStorage : undefined
const ls = typeof window !== 'undefined' ? window.localStorage : undefined
const get = (s: Storage | undefined, k: string) => {
  try {
    return s?.getItem(k) ?? null
  } catch {
    return null
  }
}
const put = (s: Storage | undefined, k: string, v: string | null) => {
  try {
    if (v === null) s?.removeItem(k)
    else s?.setItem(k, v)
  } catch {
    /* private mode: fine, just not remembered */
  }
}

export function useClientSession(code: string, event: StudioEvent | undefined) {
  const k = (x: string) => `tcs:${x}:${code}`
  // In LAN mode the server must also know this device opened the gallery.
  const [entered, setEntered] = useState(() => get(ss, k('entered')) === '1' && (!isLan() || eventGateOpen(event?.id)))
  const [name, setNameState] = useState(() => get(ls, k('name')) ?? '')

  // First visit to this code: use the event's language.
  useEffect(() => {
    if (!event || get(ls, k('lang'))) return
    put(ls, k('lang'), event.lang)
    useStore.getState().setLang(event.lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  // Log the open once per browser session.
  useEffect(() => {
    if (!event || !entered || get(ss, k('opened'))) return
    put(ss, k('opened'), '1')
    useStudioStore.getState().logActivity(event.id, 'opened', name || undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, entered])

  const enter = useCallback(
    (pin: string | undefined, who: string): boolean | Promise<boolean> => {
      if (isLan()) return checkPin(code, pin, undefined).then(ok => ok && finish(who))
      if (event?.pin && pin?.trim() !== event.pin) return false
      return finish(who)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event?.pin, code],
  )

  function finish(who: string) {
    const n = who.trim().slice(0, 40)
    put(ls, k('name'), n || null)
    setNameState(n)
    put(ss, k('entered'), '1')
    setEntered(true)
    return true
  }

  const rememberLang = useCallback((l: string) => put(ls, k('lang'), l), [code]) // eslint-disable-line react-hooks/exhaustive-deps

  return { entered, name, enter, rememberLang }
}
