import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from './i18n'

/*
 * Browser speech APIs, used as the front-end stand-in for Gemini TTS / voice.
 * Swap `speak` for a call to the backend /voice/tts endpoint when it exists;
 * the hooks' shape stays the same.
 */

const LOCALE: Record<Lang, string> = { en: 'en-IN', ta: 'ta-IN' }

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const want = LOCALE[lang].toLowerCase()
  return voices.find(v => v.lang.toLowerCase() === want) ?? voices.find(v => v.lang.toLowerCase().startsWith(lang))
}

/** Text-to-speech with a speaking flag. */
export function useSpeaker(lang: Lang) {
  const [speaking, setSpeaking] = useState(false)

  const stop = useCallback(() => {
    if (!canSpeak()) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!canSpeak()) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = LOCALE[lang]
      const v = pickVoice(lang)
      if (v) u.voice = v
      u.rate = lang === 'ta' ? 0.92 : 1
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    },
    [lang],
  )

  useEffect(() => stop, [stop, lang])
  return { speak, stop, speaking, supported: canSpeak() }
}

// ─── Speech recognition ──────────────────────────────────────────────────────

interface RecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Speech-to-text. `supported` is false on browsers without the API (Firefox, some Safari). */
export function useListener(lang: Lang, onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const rec = useRef<RecognitionLike | null>(null)
  const cb = useRef(onFinal)
  cb.current = onFinal

  const stop = useCallback(() => {
    rec.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return false
    rec.current?.stop()
    const r = new Ctor()
    r.lang = LOCALE[lang]
    r.interimResults = true
    r.continuous = false
    r.onresult = e => {
      let text = ''
      let final = false
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
        if (e.results[i].isFinal) final = true
      }
      setInterim(text)
      if (final) {
        setInterim('')
        cb.current(text)
      }
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setInterim('')
    setListening(true)
    r.start()
    return true
  }, [lang])

  useEffect(() => () => rec.current?.stop(), [])
  return { start, stop, listening, interim, supported: getRecognitionCtor() !== null }
}
