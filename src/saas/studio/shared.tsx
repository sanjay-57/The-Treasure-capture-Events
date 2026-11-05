import { useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import { Segmented } from '../../components/ui'
import { FormSelect, TextInput } from '../../pages/admin/kit'
import { useLang, useT, type Bi } from '../../lib/i18n'
import { requestLang, toast } from '../../lib/ui'
import { StudioMark, accentInk } from '../theme'
import type { EventStatus, Studio, StudioEvent } from '../types'

/** Shared bits of the photographer panel: status labels, small helpers, the branding form. */

/** TTC's own WhatsApp for studio support and payments. Placeholder number until TTC gives the real one. */
export const TTC_SUPPORT_WA = '+91 90000 00000'

export const STATUS_LABEL: Record<EventStatus, Bi> = {
  draft: { en: 'Draft', ta: 'வரைவு' },
  uploading: { en: 'Uploading', ta: 'பதிவேற்றம்' },
  open: { en: 'Open to client', ta: 'வாடிக்கையாளருக்குத் திறந்துள்ளது' },
  submitted: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  closed: { en: 'Closed', ta: 'மூடப்பட்டது' },
  archived: { en: 'Archived', ta: 'காப்பகம்' },
}

const STATUS_TONE: Record<EventStatus, string> = {
  draft: 'bg-ink/[0.06] text-ink/60',
  uploading: 'bg-amber-100 text-amber-900',
  open: 'bg-emerald-100 text-emerald-900',
  submitted: 'bg-sky-100 text-sky-900',
  closed: 'bg-ink text-white',
  archived: 'bg-ink/[0.04] text-ink/45',
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const lang = useLang()
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_TONE[status]}`}>{STATUS_LABEL[status][lang]}</span>
}

const DAY = 86_400_000
/** Whole days until an ISO deadline (negative once past). */
export const daysLeft = (iso: string, now = Date.now()) => Math.ceil((new Date(iso).getTime() - now) / DAY)
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const inDaysIso = (n: number) => new Date(Date.now() + n * DAY).toISOString()
/** End of the given yyyy-mm-dd day, local time, as ISO. */
export const endOfDayIso = (date: string) => new Date(`${date}T23:59:00`).toISOString()

export const galleryLink = (ev: Pick<StudioEvent, 'code'>) => `${window.location.origin}/s/${ev.code}`

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const fileSafe = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event'

export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useLang()
  return (
    <Segmented
      size="sm"
      className={className}
      value={lang}
      onChange={v => requestLang(v)}
      options={[
        { value: 'en', label: 'EN' },
        { value: 'ta', label: 'தமிழ்' },
      ]}
    />
  )
}

/** Small white card used across the panel. */
export function Box({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] border border-ink/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(10,10,11,0.04)] ${className}`}>{children}</div>
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="t-label text-ink/45">{label}</p>
      <p className="mt-1 truncate text-[20px] font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-ink/45">{hint}</p>}
    </div>
  )
}

// ─── Branding form (onboarding + account) ────────────────────────────────────

export type BrandingDraft = Pick<Studio, 'name' | 'logoUrl' | 'accent' | 'watermark' | 'whatsapp' | 'defaultQuota' | 'defaultWindowDays' | 'lang'>

export const brandingOf = (s: Studio): BrandingDraft => ({
  name: s.name, logoUrl: s.logoUrl, accent: s.accent, watermark: s.watermark, whatsapp: s.whatsapp, defaultQuota: s.defaultQuota, defaultWindowDays: s.defaultWindowDays, lang: s.lang,
})

export const ACCENT_PRESETS = ['#1f4e79', '#7a3e1d', '#2f5d50', '#6b2d5c', '#9a1b2f', '#1f1f22', '#b07d2b', '#3d5a80']

const LOGO_MAX = 200 * 1024

const bcopy = {
  name: { en: 'Studio name', ta: 'ஸ்டுடியோ பெயர்' },
  logo: { en: 'Logo', ta: 'லோகோ' },
  logoHint: { en: 'PNG, JPG or SVG. Resized to 256 px.', ta: 'PNG, JPG அல்லது SVG. 256 px-க்குச் சுருக்கப்படும்.' },
  upload: { en: 'Upload logo', ta: 'லோகோ பதிவேற்று' },
  tooBig: { en: 'That logo is too large even after shrinking. Try a simpler PNG.', ta: 'சுருக்கிய பிறகும் லோகோ பெரியதாக உள்ளது. எளிய PNG முயற்சிக்கவும்.' },
  accent: { en: 'Accent colour', ta: 'முதன்மை நிறம்' },
  accentHint: { en: 'Buttons and hearts in your client galleries.', ta: 'உங்கள் வாடிக்கையாளர் காட்சியகத்தில் பொத்தான்கள், இதயங்கள்.' },
  watermark: { en: 'Watermark text', ta: 'நீர்க்குறி உரை' },
  watermarkHint: { en: 'Burned into every proof, bottom-right.', ta: 'ஒவ்வொரு படத்திலும் கீழ்-வலதில் பதிக்கப்படும்.' },
  whatsapp: { en: 'WhatsApp number', ta: 'WhatsApp எண்' },
  quota: { en: 'Default photos to pick', ta: 'தேர்வு செய்ய வேண்டிய படங்கள் (இயல்பு)' },
  window: { en: 'Days to choose', ta: 'தேர்வுக்கான நாட்கள்' },
  lang: { en: 'Client language', ta: 'வாடிக்கையாளர் மொழி' },
  preview: { en: 'Preview', ta: 'முன்னோட்டம்' },
  sample: { en: 'Divya & Rahul · Wedding', ta: 'திவ்யா & ராகுல் · திருமணம்' },
  selected: { en: '24 of 40 chosen', ta: '40-ல் 24 தேர்வு' },
  submit: { en: 'Submit selection', ta: 'தேர்வைச் சமர்ப்பி' },
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(blob)
  })
}

/** Logo → data URL with the longest edge at most 256 px (PNG, WebP fallback), or null if it will not fit 200 KB. */
export async function logoDataUrl(file: File): Promise<string | null> {
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    // SVGs cannot always be decoded to a bitmap; small ones are fine as they are.
    return file.size <= LOGO_MAX ? readAsDataUrl(file) : null
  }
  try {
    const s = Math.min(1, 256 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(bmp.width * s))
    c.height = Math.max(1, Math.round(bmp.height * s))
    c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height)
    for (const type of ['image/png', 'image/webp'] as const) {
      const url = c.toDataURL(type, 0.9)
      if (url.length * 0.75 <= LOGO_MAX) return url
    }
    return null
  } finally {
    bmp.close()
  }
}

/** hideLogo: onboarding skips the logo, which is already set at signup. */
export function BrandingForm({ value, onChange, hideLogo = false }: { value: BrandingDraft; onChange: (v: BrandingDraft) => void; hideLogo?: boolean }) {
  const t = useT(bcopy)
  const set = <K extends keyof BrandingDraft>(k: K, v: BrandingDraft[K]) => onChange({ ...value, [k]: v })
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const num = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(v.replace(/\D/g, '')) || 0)))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput className="sm:col-span-2" label={t.name} value={value.name} onChange={v => set('name', v)} required />
        {!hideLogo && <div className="sm:col-span-2">
          <p className="t-label mb-1.5 text-ink/50">{t.logo}</p>
          <div className="flex flex-wrap items-center gap-3">
            <StudioMark studio={value} size={44} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="h-10 cursor-pointer rounded-full border border-ink/15 px-4 text-[13px] font-medium text-ink hover:border-ink/40 disabled:opacity-40">
              {t.upload}
            </button>
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={async e => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                setBusy(true)
                try {
                  const url = await logoDataUrl(f)
                  if (url) set('logoUrl', url)
                  else toast(t.tooBig, 'ruby')
                } catch {
                  toast(t.tooBig, 'ruby')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink/45">{t.logoHint}</p>
        </div>}
        <div className="sm:col-span-2">
          <p className="t-label mb-1.5 text-ink/50">{t.accent}</p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => set('accent', c)}
                style={{ background: c }}
                className={`h-9 w-9 cursor-pointer rounded-full ring-offset-2 transition ${value.accent.toLowerCase() === c ? 'ring-2 ring-ink' : 'hover:scale-105'}`}
              />
            ))}
            <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/15 pl-1 pr-3 text-[12.5px] text-ink/70">
              <input type="color" value={value.accent} onChange={e => set('accent', e.target.value)} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" />
              {value.accent}
            </label>
          </div>
          <p className="mt-1.5 text-xs text-ink/45">{t.accentHint}</p>
        </div>
        <div className="sm:col-span-2">
          <TextInput label={t.watermark} value={value.watermark} onChange={v => set('watermark', v)} />
          <p className="mt-1.5 text-xs text-ink/45">{t.watermarkHint}</p>
        </div>
        <TextInput label={t.whatsapp} type="tel" inputMode="tel" value={value.whatsapp} onChange={v => set('whatsapp', v)} />
        <FormSelect label={t.lang} value={value.lang} onChange={v => set('lang', v)} options={[{ value: 'en', label: 'English' }, { value: 'ta', label: 'தமிழ்' }]} />
        <TextInput label={t.quota} inputMode="numeric" value={String(value.defaultQuota)} onChange={v => set('defaultQuota', num(v, 1, 5000))} />
        <TextInput label={t.window} inputMode="numeric" value={String(value.defaultWindowDays)} onChange={v => set('defaultWindowDays', num(v, 1, 90))} />
      </div>

      <div>
        <p className="t-label mb-1.5 text-ink/50">{t.preview}</p>
        <div className="overflow-hidden rounded-[22px] border border-ink/[0.08] bg-[#faf9f7]">
          <div className="flex items-center gap-3 border-b border-ink/[0.06] px-4 py-3">
            <StudioMark studio={value} size={32} />
            <span className="truncate text-[14px] font-semibold text-ink">{value.name || '—'}</span>
          </div>
          <div className="p-4">
            <p className="text-[13px] font-medium text-ink">{t.sample}</p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="relative aspect-[4/5] rounded-lg bg-gradient-to-br from-ink/[0.10] to-ink/[0.04]">
                  {i % 2 === 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: value.accent, color: accentInk(value.accent) }}>
                      <Icon name="heart" size={12} />
                    </span>
                  )}
                  <span className="absolute bottom-1 right-1.5 max-w-[90%] truncate text-[7px] font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">{value.watermark}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-ink/55">{t.selected}</p>
            <div className="mt-2 flex h-10 items-center justify-center rounded-full text-[13px] font-medium" style={{ background: value.accent, color: accentInk(value.accent) }}>
              {t.submit}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
