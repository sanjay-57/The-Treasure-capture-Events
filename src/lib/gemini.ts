import type { Lang } from './i18n'

/*
 * Gemini client used by the booking voice guide for three jobs:
 *   1. Text-to-speech in Tamil and English (the guide's voice and spoken replies).
 *   2. Understanding what the visitor said — Tamil, English or mixed — as page actions.
 *   3. Transcribing recorded audio on browsers without the Web Speech API.
 *
 * Calls go straight from the browser with VITE_GEMINI_API_KEY. That is fine for the
 * demo; before launch put these three functions behind a small proxy so the key is
 * never shipped to clients. The functions have no DOM dependency, so the same file
 * runs under Node for scripts/voice-clips.mjs.
 *
 * The current Interactions API is tried first; if the key/project only has the classic
 * generateContent endpoint, the client notices once and uses that from then on.
 */

export interface GeminiConfig {
  apiKey: string
  chatModel: string
  ttsModel: string
  /** Second TTS model with its own rate-limit bucket, used when the first answers 429. */
  ttsFallbackModel: string
  /** Prebuilt Gemini voice per language (Kore, Aoede, Leda, Zephyr, Puck, Charon…). */
  voices: Record<Lang, string>
  /** Delivery direction for the TTS model. Google recommends keeping this in English. */
  style: Record<Lang, string>
}

const env = (key: string): string | undefined => {
  try {
    return (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key]
  } catch {
    return undefined
  }
}

const config: GeminiConfig = {
  apiKey: env('VITE_GEMINI_API_KEY') ?? '',
  chatModel: env('VITE_GEMINI_CHAT_MODEL') ?? 'gemini-3.5-flash-lite',
  ttsModel: env('VITE_GEMINI_TTS_MODEL') ?? 'gemini-3.8-flash-tts',
  ttsFallbackModel: env('VITE_GEMINI_TTS_FALLBACK_MODEL') ?? 'gemini-3.8-flash-lite-tts',
  voices: { en: env('VITE_GEMINI_VOICE_EN') ?? 'Sulafat', ta: env('VITE_GEMINI_VOICE_TA') ?? 'Sulafat' },
  style: {
    en: 'Warm, gracious and unhurried, like a friendly host welcoming guests at a Tamil wedding. Clear Indian English at a relaxed pace, with a gentle smile in the voice.',
    ta: 'Warm, gracious and unhurried, like a friendly host welcoming guests at a Tamil wedding. Natural native spoken Tamil, clear and relaxed; say numbers and rupee amounts in Tamil.',
  },
}

export function configureGemini(patch: Partial<GeminiConfig>): void {
  Object.assign(config, patch)
}
export const geminiConfig = (): Readonly<GeminiConfig> => config
export const hasGemini = (): boolean => config.apiKey.length > 0

export class GeminiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'GeminiError'
    this.status = status
    this.body = body
  }
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function post(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': config.apiKey },
    body: JSON.stringify(body),
    signal,
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  if (!res.ok) {
    const first = (Array.isArray(json) ? json[0] : json) as { error?: { message?: string } } | null
    const msg = first?.error?.message ?? res.statusText ?? `HTTP ${res.status}`
    throw new GeminiError(msg, res.status, json)
  }
  return json
}

// ─── Endpoint fallback ───────────────────────────────────────────────────────

type Api = 'interactions' | 'generate'
let api: Api | null = null

/** True for errors that mean "this endpoint/shape does not exist here", not "bad request". */
function shouldFallback(e: unknown): boolean {
  if (!(e instanceof GeminiError)) return false
  if ([404, 405, 501].includes(e.status)) return true
  return e.status === 400 && /unknown name|invalid json payload|cannot find field|not supported/i.test(e.message)
}

async function withFallback<T>(viaInteractions: () => Promise<T>, viaGenerate: () => Promise<T>): Promise<T> {
  if (api === 'generate') return viaGenerate()
  try {
    const r = await viaInteractions()
    api = 'interactions'
    return r
  } catch (e) {
    if (api === 'interactions' || !shouldFallback(e)) throw e
    const r = await viaGenerate()
    api = 'generate'
    return r
  }
}

// ─── Response readers (tolerant of either response shape) ────────────────────

type Obj = Record<string, unknown>

function* walk(node: unknown): Generator<Obj> {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const n of node) yield* walk(n)
    return
  }
  yield node as Obj
  for (const v of Object.values(node as Obj)) yield* walk(v)
}

function findAudio(json: unknown): { data: string; mime: string } | null {
  for (const o of walk(json)) {
    if (typeof o.data !== 'string' || o.data.length < 64) continue
    const mime = String(o.mime_type ?? o.mimeType ?? '')
    if (o.type === 'audio' || /^audio\//i.test(mime)) return { data: o.data, mime }
  }
  return null
}

function extractText(json: unknown): string {
  const root = (json ?? {}) as Obj
  if (typeof root.output_text === 'string') return root.output_text.trim()
  let pool: unknown = json
  if (Array.isArray(root.steps)) {
    const steps = root.steps as Obj[]
    const outs = steps.filter(s => s?.type === 'model_output')
    pool = outs.length ? outs : steps.filter(s => s?.type !== 'thought' && s?.type !== 'function_call')
  } else if (Array.isArray(root.candidates)) {
    pool = (root.candidates as Obj[])[0]?.content
  }
  const parts: string[] = []
  for (const o of walk(pool)) {
    if (typeof o.text !== 'string') continue
    if (o.thought === true) continue
    if (o.type !== undefined && o.type !== 'text') continue
    parts.push(o.text)
  }
  return parts.join('').trim()
}

// ─── Bytes helpers ───────────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array {
  const B = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => Uint8Array } }).Buffer
  if (B) return new Uint8Array(B.from(b64, 'base64'))
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64(bytes: Uint8Array): string {
  const B = (globalThis as unknown as { Buffer?: { from: (b: Uint8Array) => { toString: (enc: string) => string } } }).Buffer
  if (B) return B.from(bytes).toString('base64')
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** Wraps raw 16-bit mono PCM in a RIFF/WAV header so an <audio> element can play it. */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1, bits = 16): Uint8Array {
  const header = new ArrayBuffer(44)
  const v = new DataView(header)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  const byteRate = (sampleRate * channels * bits) / 8
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, byteRate, true); v.setUint16(32, (channels * bits) / 8, true); v.setUint16(34, bits, true)
  str(36, 'data'); v.setUint32(40, pcm.length, true)
  const out = new Uint8Array(44 + pcm.length)
  out.set(new Uint8Array(header), 0)
  out.set(pcm, 44)
  return out
}

// ─── Text-to-speech ──────────────────────────────────────────────────────────

export interface TtsResult {
  bytes: Uint8Array
  mime: 'audio/wav'
}

const ttsCache = new Map<string, TtsResult>()

function toWav(a: { data: string; mime: string } | null): TtsResult {
  if (!a) throw new GeminiError('The TTS response contained no audio', 0)
  const bytes = b64ToBytes(a.data)
  const mime = a.mime.toLowerCase()
  const riff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
  if (riff || mime.includes('wav')) return { bytes, mime: 'audio/wav' }
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000)
  return { bytes: pcmToWav(bytes, rate), mime: 'audio/wav' }
}

export const isRateLimited = (e: unknown): boolean => e instanceof GeminiError && e.status === 429

/** Seconds the API asked us to wait, when it said so ("retry in 29s", "retry in 15h41m55s"). */
export function retryAfterSeconds(e: unknown): number | null {
  if (!(e instanceof GeminiError)) return null
  const m = /retry in ((?:\d+h)?(?:\d+m)?(?:\d+(?:\.\d+)?s)?)/i.exec(e.message)
  if (!m || !m[1]) return null
  const h = /(\d+)h/.exec(m[1]), min = /(\d+)m/.exec(m[1]), sec = /(\d+(?:\.\d+)?)s/.exec(m[1])
  return Math.ceil((h ? Number(h[1]) * 3600 : 0) + (min ? Number(min[1]) * 60 : 0) + (sec ? Number(sec[1]) : 0))
}

/** True when the free tier's daily cap (not the per-minute one) was hit: waiting will not help. */
export const isDailyCap = (e: unknown): boolean => isRateLimited(e) && (/per day/i.test((e as GeminiError).message) || (retryAfterSeconds(e) ?? 0) > 300)

/**
 * Renders `text` with the configured voice for `lang`. Results are cached per text.
 * On a 429 from the main TTS model the fallback model is tried once (separate quota).
 */
export async function geminiTTS(text: string, lang: Lang, signal?: AbortSignal): Promise<TtsResult> {
  try {
    return await ttsWith(config.ttsModel, text, lang, signal)
  } catch (e) {
    if (!isRateLimited(e) || !config.ttsFallbackModel || config.ttsFallbackModel === config.ttsModel) throw e
    return ttsWith(config.ttsFallbackModel, text, lang, signal)
  }
}

async function ttsWith(model: string, text: string, lang: Lang, signal?: AbortSignal): Promise<TtsResult> {
  const voice = config.voices[lang]
  const key = `${model}|${lang}|${voice}|${text}`
  const hit = ttsCache.get(key)
  if (hit) return hit
  const result = await withFallback(
    async () =>
      toWav(findAudio(await post('interactions', {
        model,
        input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: config.style[lang] }] }] }],
        response_format: { type: 'audio' },
        generation_config: { speech_config: [{ voice }] },
        store: false,
      }, signal))),
    async () =>
      toWav(findAudio(await post(`models/${model}:generateContent`, {
        contents: [{ parts: [{ text: `${config.style[lang]}\n\n${text}` }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
      }, signal))),
  )
  ttsCache.set(key, result)
  return result
}

// ─── Text / understanding ────────────────────────────────────────────────────

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

export interface TextRequest {
  system: string
  input: string
  history?: ChatTurn[]
  temperature?: number
  /** Ask for a JSON object back (the Interactions path relies on the system prompt for this). */
  json?: boolean
  signal?: AbortSignal
}

/** One-shot text generation with the recent conversation folded into the prompt. */
export async function geminiText(req: TextRequest): Promise<string> {
  const lines = (req.history ?? []).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
  lines.push(`User: ${req.input}`)
  const transcript = lines.join('\n')
  const temperature = req.temperature ?? 0.2
  return withFallback(
    async () =>
      extractText(await post('interactions', {
        model: config.chatModel,
        system_instruction: req.system,
        input: transcript,
        generation_config: { temperature },
        store: false,
      }, req.signal)),
    async () =>
      extractText(await post(`models/${config.chatModel}:generateContent`, {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: transcript }] }],
        generationConfig: { temperature, ...(req.json ? { responseMimeType: 'application/json' } : {}) },
      }, req.signal)),
  )
}

/** Parses a JSON object out of a model reply, tolerating code fences and chatter around it. */
export function parseJsonLoose<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T
  } catch {
    return null
  }
}

// ─── Transcription (fallback for browsers without SpeechRecognition) ─────────

export async function geminiTranscribe(audio: Blob, lang: Lang, signal?: AbortSignal): Promise<string> {
  const bytes = new Uint8Array(await audio.arrayBuffer())
  const data = bytesToB64(bytes)
  const mime = (audio.type || 'audio/webm').split(';')[0]
  const prompt =
    `Transcribe this short voice command exactly as spoken. The speaker is using ${lang === 'ta' ? 'Tamil, possibly mixed with English' : 'English, possibly mixed with Tamil'}. ` +
    'Write Tamil words in Tamil script. Output only the transcript, nothing else.'
  return withFallback(
    async () =>
      extractText(await post('interactions', {
        model: config.chatModel,
        input: [{ type: 'text', text: prompt }, { type: 'audio', data, mime_type: mime }],
        store: false,
      }, signal)),
    async () =>
      extractText(await post(`models/${config.chatModel}:generateContent`, {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mime, data } }] }],
      }, signal)),
  )
}
