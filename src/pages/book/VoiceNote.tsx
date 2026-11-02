import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'

/*
 * "Anything else? Say it": the customer records a short message for the
 * studio (rituals, family names, a must-have shot). It rides along in the
 * draft as a data URL and lands on the order for the admin to play.
 */

const copy = {
  record: { en: 'Tap to record', ta: 'பதிவு செய்யத் தொடுங்கள்' },
  recording: { en: 'Recording… tap to stop', ta: 'பதிவாகிறது… நிறுத்தத் தொடுங்கள்' },
  again: { en: 'Record again', ta: 'மீண்டும் பதிவு' },
  remove: { en: 'Delete', ta: 'நீக்கு' },
  saved: { en: 'Saved with your booking. We will listen before we call.', ta: 'உங்கள் பதிவுடன் சேமிக்கப்பட்டது. அழைக்கும் முன் கேட்போம்.' },
  limit: { en: 'Up to 2 minutes, in Tamil or English.', ta: '2 நிமிடம் வரை, தமிழிலோ ஆங்கிலத்திலோ.' },
  denied: { en: 'We could not use the microphone. Allow it in your browser’s site settings, or type a note on the next step.', ta: 'மைக்ரோஃபோனைப் பயன்படுத்த முடியவில்லை. உலாவி அமைப்பில் அனுமதி தாருங்கள், அல்லது அடுத்த படியில் குறிப்பை எழுதுங்கள்.' },
  unsupported: { en: 'This browser cannot record audio. Type a note on the next step instead.', ta: 'இந்த உலாவியில் குரல் பதிவு இயலாது. அடுத்த படியில் குறிப்பை எழுதுங்கள்.' },
}

const MAX_SECONDS = 120

const pickMime = () => ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ?? ''

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function VoiceNote() {
  const t = useT(copy)
  const note = useStore(s => s.draft.voiceNote)
  const updateDraft = useStore(s => s.updateDraft)
  const [state, setState] = useState<'idle' | 'recording'>('idle')
  const [error, setError] = useState<'denied' | 'unsupported' | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array(24).fill(0.1))
  const rec = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const raf = useRef(0)
  const started = useRef(0)

  const cleanup = () => {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach(tr => tr.stop())
    stream.current = null
    void audioCtx.current?.close().catch(() => {})
    audioCtx.current = null
  }
  useEffect(() => () => { rec.current?.state === 'recording' && rec.current.stop(); cleanup() }, [])

  const stop = () => {
    if (rec.current?.state === 'recording') rec.current.stop()
  }

  const start = async () => {
    setError(null)
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return setError('unsupported')
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      stream.current = s
      const mime = pickMime()
      const r = new MediaRecorder(s, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 })
      const chunks: Blob[] = []
      r.ondataavailable = e => e.data.size && chunks.push(e.data)
      r.onstop = () => {
        const seconds = Math.max(1, Math.round((performance.now() - started.current) / 1000))
        const blob = new Blob(chunks, { type: r.mimeType || mime || 'audio/webm' })
        cleanup()
        setState('idle')
        const fr = new FileReader()
        fr.onload = () => updateDraft({ voiceNote: { url: String(fr.result), mime: blob.type, seconds, at: new Date().toISOString() } })
        fr.readAsDataURL(blob)
      }
      // Live level bars while recording.
      const ctx = new AudioContext()
      audioCtx.current = ctx
      const an = ctx.createAnalyser()
      an.fftSize = 64
      ctx.createMediaStreamSource(s).connect(an)
      const buf = new Uint8Array(an.frequencyBinCount)
      const tick = () => {
        an.getByteFrequencyData(buf)
        setLevels(Array.from({ length: 24 }, (_, i) => Math.max(0.08, (buf[i + 2] ?? 0) / 255)))
        const secs = (performance.now() - started.current) / 1000
        setElapsed(secs)
        if (secs >= MAX_SECONDS) return stop()
        raf.current = requestAnimationFrame(tick)
      }
      rec.current = r
      started.current = performance.now()
      r.start()
      setState('recording')
      setElapsed(0)
      raf.current = requestAnimationFrame(tick)
    } catch {
      cleanup()
      setError('denied')
    }
  }

  const recording = state === 'recording'

  return (
    <div className="rounded-[26px] border border-ink/[0.08] bg-white/70 p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={recording ? stop : start}
          aria-pressed={recording}
          aria-label={recording ? t.recording : t.record}
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 cursor-pointer ${recording ? 'bg-ink' : 'bg-ruby shadow-ruby hover:bg-ruby-bright'}`}
        >
          {recording && <span className="absolute inset-0 animate-ping rounded-full bg-ruby/40" aria-hidden="true" />}
          <Icon name={recording ? 'x' : 'mic'} size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium text-ink">{recording ? t.recording : note ? t.again : t.record}</p>
          {recording ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-7 items-center gap-[3px]" aria-hidden="true">
                {levels.map((l, i) => <span key={i} className="w-[3px] rounded-full bg-ruby transition-[height] duration-75" style={{ height: `${Math.round(l * 28)}px` }} />)}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-ruby">{clock(elapsed)} / {clock(MAX_SECONDS)}</span>
            </div>
          ) : (
            <p className="mt-0.5 text-[12.5px] text-ink/50">{t.limit}</p>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {note && !recording && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t hairline pt-4">
              <audio controls src={note.url} className="h-10 min-w-0 flex-1" />
              <span className="text-[12px] tabular-nums text-ink/50">{clock(note.seconds)}</span>
              <button type="button" onClick={() => updateDraft({ voiceNote: undefined })} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink/55 transition hover:bg-ink/[0.05] hover:text-ruby cursor-pointer">
                <Icon name="trash" size={14} />
                {t.remove}
              </button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink/50">
              <Icon name="check" size={13} className="text-ruby" />
              {t.saved}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-ink/60">
          <Icon name="info" size={14} className="mt-px shrink-0 text-ruby" />
          {t[error]}
        </p>
      )}
    </div>
  )
}
