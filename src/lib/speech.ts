import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { Lang } from './i18n'
import { geminiTTS, geminiTranscribe, hasGemini, isDailyCap, isRateLimited, pcmToWav } from './gemini'
import { toast } from './ui'

/*
 * Voice I/O for the whole site.
 *
 * Output goes through one shared player so only one thing ever speaks at a time
 * (the booking guide, a Listen button, the cart assistant…). For each utterance
 * the player tries, in order:
 *   1. a pre-rendered clip in public/voice/<clip>.<lang>.wav (made with Gemini TTS
 *      by scripts/voice-clips.mjs — instant, identical every time),
 *   2. live Gemini TTS when VITE_GEMINI_API_KEY is set,
 *   3. the device's own speech synthesis.
 *
 * Input uses the browser's SpeechRecognition (ta-IN / en-IN) and falls back to
 * recording a short clip and transcribing it with Gemini where that API is missing.
 */

const LOCALE: Record<Lang, string> = { en: 'en-IN', ta: 'ta-IN' }

export type VoiceEngine = 'clip' | 'gemini' | 'browser'

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

const forceBrowser = (): boolean => import.meta.env.VITE_VOICE_ENGINE === 'browser'

/** Which engine free text will use right now (clips are tried first regardless). */
export const voiceEngine = (): VoiceEngine => (hasGemini() && !forceBrowser() ? 'gemini' : 'browser')

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const want = LOCALE[lang].toLowerCase()
  return voices.find(v => v.lang.toLowerCase() === want) ?? voices.find(v => v.lang.toLowerCase().startsWith(lang))
}

// ─── The shared player ───────────────────────────────────────────────────────

export interface PlayerState {
  /** Audio is playing. */
  speaking: boolean
  /** Audio is being fetched or rendered. */
  loading: boolean
  /** Who asked for the current utterance (a useSpeaker id or 'app'). */
  owner: string | null
  engine: VoiceEngine | null
  /** The text being spoken, for live captions. */
  caption: string | null
  /** Playback position 0–1 (0 when unknown, e.g. the device voice). */
  progress: number
}

let state: PlayerState = { speaking: false, loading: false, owner: null, engine: null, caption: null, progress: 0 }
const subs = new Set<() => void>()
const setState = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch }
  subs.forEach(fn => fn())
}
const subscribe = (fn: () => void) => {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}
const getState = () => state

export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, getState, getState)
}

let audioEl: HTMLAudioElement | null = null
let turn = 0
let unlocked = false

/**
 * Call inside a tap/click handler before any async work. iOS Safari only lets an
 * <audio> element start inside a user gesture, so we start it once on silence and
 * reuse the same element for everything fetched later.
 */
export function unlockAudio(): void {
  if (unlocked || typeof Audio === 'undefined') return
  unlocked = true
  if (!audioEl) audioEl = new Audio()
  const silence = new Blob([pcmToWav(new Uint8Array(2400)) as BlobPart], { type: 'audio/wav' })
  const url = URL.createObjectURL(silence)
  audioEl.src = url
  audioEl.play().catch(() => undefined).finally(() => URL.revokeObjectURL(url))
  if (canSpeak()) window.speechSynthesis.getVoices()
}
const idle = { speaking: false, loading: false, owner: null, engine: null, caption: null, progress: 0 } as const

/** Stops whatever is playing or loading. */
export function stopSpeaking(): void {
  turn++
  if (audioEl) {
    audioEl.pause()
    audioEl.removeAttribute('src')
  }
  if (canSpeak()) window.speechSynthesis.cancel()
  setState(idle)
}

const clipCache = new Map<string, Blob | null>()
/** Compressed first (what ships), raw WAV as the local fallback right after rendering. */
const CLIP_FORMATS = ['mp3', 'm4a', 'wav'] as const

async function fetchClip(id: string, lang: Lang): Promise<Blob | null> {
  const key = `${id}.${lang}`
  const cached = clipCache.get(key)
  if (cached !== undefined) return cached
  for (const ext of CLIP_FORMATS) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}voice/${key}.${ext}`)
      // The dev server answers missing public files with index.html, so check the type.
      if (!res.ok || !/audio|octet-stream|mp4/.test(res.headers.get('content-type') ?? '')) continue
      const blob = await res.blob()
      clipCache.set(key, blob)
      return blob
    } catch {
      /* try the next format */
    }
  }
  clipCache.set(key, null)
  return null
}

function playBlob(blob: Blob, my: number, owner: string, engine: VoiceEngine): Promise<void> {
  return new Promise(resolve => {
    if (my !== turn || typeof Audio === 'undefined') return resolve()
    if (!audioEl) audioEl = new Audio()
    const url = URL.createObjectURL(blob)
    const done = () => {
      URL.revokeObjectURL(url)
      if (my === turn) setState(idle)
      resolve()
    }
    audioEl.onended = done
    audioEl.onerror = done
    audioEl.onpause = () => {
      if (my !== turn) done()
    }
    audioEl.ontimeupdate = () => {
      if (my === turn && audioEl && audioEl.duration > 0) setState({ progress: Math.min(1, audioEl.currentTime / audioEl.duration) })
    }
    audioEl.src = url
    setState({ speaking: true, loading: false, owner, engine, progress: 0 })
    audioEl.play().catch(done)
  })
}

/** Chrome fills the voice list asynchronously; wait briefly so a Tamil voice can be picked. */
function voicesReady(): Promise<void> {
  if (!canSpeak() || window.speechSynthesis.getVoices().length) return Promise.resolve()
  return new Promise(resolve => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done)
      resolve()
    }
    window.speechSynthesis.addEventListener('voiceschanged', done)
    window.setTimeout(done, 800)
  })
}

/** Sentence-sized pieces: Chrome stops long utterances after ~15 s, short ones play to the end. */
const sentences = (text: string): string[] => text.match(/[^.!?।]+[.!?।]*\s*/g)?.map(s => s.trim()).filter(Boolean) ?? [text]

async function speakBrowser(text: string, lang: Lang, my: number, owner: string): Promise<void> {
  if (my !== turn || !canSpeak()) return
  await voicesReady()
  if (my !== turn) return
  const voice = pickVoice(lang)
  const parts = sentences(text)
  setState({ speaking: true, loading: false, owner, engine: 'browser' })
  for (let i = 0; i < parts.length; i++) {
    if (my !== turn) return
    await new Promise<void>(resolve => {
      const u = new SpeechSynthesisUtterance(parts[i])
      u.lang = LOCALE[lang]
      if (voice) u.voice = voice
      u.rate = lang === 'ta' ? 0.92 : 1
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })
    if (my === turn) setState({ progress: (i + 1) / parts.length })
  }
  if (my === turn) setState(idle)
}

let warnedFallback = false
function explainFallback(e: unknown, lang: Lang) {
  if (warnedFallback) return
  warnedFallback = true
  const quota = isDailyCap(e)
  const limited = isRateLimited(e)
  const msg = quota
    ? { en: 'Gemini voice has used today’s free quota — using the device voice for now.', ta: 'Gemini குரலின் இன்றைய இலவச வரம்பு முடிந்தது — இப்போது சாதனக் குரல் பேசும்.' }
    : limited
      ? { en: 'Gemini voice is busy (3 requests/minute on the free tier) — using the device voice.', ta: 'Gemini குரல் பிஸியாக உள்ளது — இப்போது சாதனக் குரல் பேசும்.' }
      : { en: 'Gemini voice is unavailable — using the device voice.', ta: 'Gemini குரல் கிடைக்கவில்லை — சாதனக் குரல் பேசும்.' }
  toast(msg[lang])
}

export interface SayOptions {
  /** Id of a pre-rendered clip in public/voice to prefer over live synthesis. */
  clip?: string
  owner?: string
}

/** Speaks `text`, interrupting anything already playing. Resolves when playback ends or is interrupted. */
export async function say(text: string, lang: Lang, opts: SayOptions = {}): Promise<void> {
  stopSpeaking()
  const my = turn
  const owner = opts.owner ?? 'app'
  if (!text.trim()) return
  setState({ loading: true, speaking: false, owner, engine: null, caption: text, progress: 0 })

  if (opts.clip) {
    const blob = await fetchClip(opts.clip, lang)
    if (my !== turn) return
    if (blob) return playBlob(blob, my, owner, 'clip')
  }
  if (voiceEngine() === 'gemini') {
    try {
      const { bytes, mime } = await geminiTTS(text, lang)
      if (my !== turn) return
      return playBlob(new Blob([bytes as BlobPart], { type: mime }), my, owner, 'gemini')
    } catch (e) {
      console.warn('[voice] Gemini TTS failed, using the device voice instead:', e)
      explainFallback(e, lang)
      if (my !== turn) return
    }
  }
  if (canSpeak()) return speakBrowser(text, lang, my, owner)
  setState(idle)
}

/** Text-to-speech with a per-caller speaking flag. */
export function useSpeaker(lang: Lang) {
  const id = useId()
  const p = usePlayer()
  const speak = useCallback(
    (text: string, clip?: string) => {
      void say(text, lang, { owner: id, clip })
    },
    [lang, id],
  )
  const stop = useCallback(() => {
    if (state.owner === id) stopSpeaking()
  }, [id])
  useEffect(() => stop, [stop, lang])
  const mine = p.owner === id
  return { speak, stop, speaking: p.speaking && mine, loading: p.loading && mine, supported: canSpeak() || hasGemini(), engine: voiceEngine() }
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

const canRecord = (): boolean =>
  hasGemini() && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

const MAX_RECORDING_MS = 8000

/** Speech-to-text. `supported` is false only when neither the browser API nor the Gemini fallback is available. */
export function useListener(lang: Lang, onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [interim, setInterim] = useState('')
  const rec = useRef<RecognitionLike | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const cb = useRef(onFinal)
  cb.current = onFinal

  const stop = useCallback(() => {
    rec.current?.stop()
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setListening(false)
  }, [])

  const startRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(m => MediaRecorder.isTypeSupported(m))
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks: Blob[] = []
      r.ondataavailable = e => {
        if (e.data.size) chunks.push(e.data)
      }
      r.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setListening(false)
        const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' })
        if (blob.size < 1000) return
        setTranscribing(true)
        try {
          const text = await geminiTranscribe(blob, lang)
          if (text) cb.current(text)
        } catch (e) {
          console.warn('[voice] transcription failed:', e)
        } finally {
          setTranscribing(false)
        }
      }
      recorder.current = r
      setInterim('')
      setListening(true)
      r.start()
      window.setTimeout(() => {
        if (recorder.current === r && r.state === 'recording') r.stop()
      }, MAX_RECORDING_MS)
    } catch {
      setListening(false)
    }
  }, [lang])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      if (!canRecord()) return false
      void startRecorder()
      return true
    }
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
  }, [lang, startRecorder])

  useEffect(
    () => () => {
      rec.current?.stop()
      if (recorder.current?.state === 'recording') recorder.current.stop()
    },
    [],
  )
  return { start, stop, listening, transcribing, interim, supported: getRecognitionCtor() !== null || canRecord() }
}
