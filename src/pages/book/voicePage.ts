import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import type { Bi } from '../../lib/i18n'

/*
 * A booking step tells the voice guide what it can do here by registering a
 * VoicePage. The guide turns the actions into the tool list it gives Gemini and
 * into the local fallback parser, and runs whichever actions come back.
 */

export type ActionArgs = Record<string, string | number | boolean | undefined>

/** What an action says back. Strings are spoken as-is; a clip id prefers the pre-rendered audio. */
export type VoiceReply = Bi | string | { text: Bi | string; clip?: string } | void

export interface VoiceAction {
  /** snake_case, stable: it is the function name the model calls. */
  name: string
  /** One line for the model: what it does and when to use it. */
  description: string
  /** Argument name → what to put in it. */
  params?: Record<string, string>
  run: (args: ActionArgs) => VoiceReply | Promise<VoiceReply>
}

export interface VoicePage {
  id: string
  /** What is on screen right now, in plain English, so the model can answer questions about it. */
  context: () => string
  actions: VoiceAction[]
  /** Example things to say, shown as chips in the guide. */
  examples: Bi[]
}

export const useVoicePage = create<{ page: VoicePage | null }>(() => ({ page: null }))

/** Registers the page for as long as the component is mounted. Pass a fresh object each render; it is read through a ref. */
export function useRegisterVoicePage(page: VoicePage): void {
  const ref = useRef(page)
  ref.current = page
  const id = page.id
  useEffect(() => {
    const proxy: VoicePage = {
      id,
      context: () => ref.current.context(),
      get examples() {
        return ref.current.examples
      },
      get actions() {
        return ref.current.actions
      },
    }
    useVoicePage.setState({ page: proxy })
    return () => {
      if (useVoicePage.getState().page === proxy) useVoicePage.setState({ page: null })
    }
  }, [id])
}
