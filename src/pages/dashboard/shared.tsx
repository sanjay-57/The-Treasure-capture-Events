import { createContext, useContext, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Icon, type IconName } from '../../components/Icon'
import { Button, Eyebrow, LangImg } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { formatDate, useLang, useT, type Bi, type Lang } from '../../lib/i18n'
import { IMG, type ImgKey } from '../../lib/images'
import { PROOF_CATEGORY, PROOF_EXTRAS, PROOF_SETS, STATUS_ORDER, statusName, type GalleryCover, type OrderStatus, type PackageKey, type ProofCategory } from '../../lib/data'
import type { Order } from '../../lib/store'

/*
 * Helpers shared by the client dashboard screens: stage gating, the proof
 * catalogue, and a few presentational pieces (page intro, locked panel,
 * progress ring) so every tab reads as one product.
 */

// ─── Stage gating ────────────────────────────────────────────────────────────

export const stageIdx = (s: OrderStatus) => STATUS_ORDER.indexOf(s)
export const reached = (o: Order, s: OrderStatus) => stageIdx(o.status) >= stageIdx(s)

/** Proofing gallery opens once the studio moves the order to SELECT_PHOTOS. */
export const photosUnlocked = (o: Order) => reached(o, 'SELECT_PHOTOS')
/** Selection becomes read-only after submit, or once the order has moved past proofing. */
export const selectionClosed = (o: Order) => !!o.selectionSubmittedAt || stageIdx(o.status) > stageIdx('SELECT_PHOTOS')
/** Album builder unlocks with the ALBUM_CUSTOMIZATION stage or as soon as a selection is submitted. */
export const albumUnlocked = (o: Order) => reached(o, 'ALBUM_CUSTOMIZATION') || !!o.selectionSubmittedAt
/** After billing the album is in production and the spec is frozen. */
export const albumEditable = (o: Order) => albumUnlocked(o) && stageIdx(o.status) <= stageIdx('ALBUM_CUSTOMIZATION')

export const firstName = (name: string) => name.split(/\s*&\s*|\s+/)[0] || name

/** Album sheets bundled into each package; anything above is charged per sheet. */
export const INCLUDED_SHEETS: Record<PackageKey, number> = { essential: 0, signature: 30, heirloom: 40 }
/** How many proofs each package's album is designed around. */
export const PHOTO_QUOTA: Record<PackageKey, number> = { essential: 24, signature: 30, heirloom: 40 }

// ─── Proof catalogue (mocked GCS listing) ────────────────────────────────────

/** Canonical order — fixes filenames so ids and names match in both languages. */
const CANON: ImgKey[] = [...PROOF_SETS.traditional, ...PROOF_SETS.modern, ...PROOF_EXTRAS]

export const isProof = (id: string): id is ImgKey => id in IMG
export const proofFile = (id: string) => {
  const i = CANON.indexOf(id as ImgKey)
  return `TTC_${String((i < 0 ? 900 : i) + 1).padStart(4, '0')}.JPG`
}

/** Traditional proofs lead in Tamil mode, modern ones in English. Same ids either way. */
export function useProofs(): ImgKey[] {
  const lang = useLang()
  return lang === 'ta' ? CANON : [...PROOF_SETS.modern, ...PROOF_SETS.traditional, ...PROOF_EXTRAS]
}

export const proofCategory = (id: string): ProofCategory => PROOF_CATEGORY[id as ImgKey] ?? 'candids'

const DEFAULT_BANNER: Record<Lang, ImgKey[]> = {
  en: ['m_couple_royal', 'm_bride_red', 'm_hands_rings', 'm_couple_walk', 'm_stage'],
  ta: ['t_couple_garland', 't_bride_silk', 't_ritual_fire', 't_jasmine_garland', 't_couple_seated'],
}
const DEFAULT_DP: Record<Lang, ImgKey> = { en: 'm_bride_smile', ta: 't_bride_silk' }

/** The studio's cover if set, otherwise a language-appropriate default built from the order. */
export function resolveCover(o: Order, lang: Lang): GalleryCover {
  return o.cover ?? { banner: DEFAULT_BANNER[lang], dp: DEFAULT_DP[lang], name: o.client.name, date: formatDate(o.date, lang, { day: 'numeric', month: 'long', year: 'numeric' }) }
}

export const gcsPath = (o: Order) => `gs://ttc-proofs-asia-south1/${o.id.toLowerCase()}/lowres-watermarked/`

// ─── Sticky offset that follows the site nav ─────────────────────────────────

/** Mirrors the nav's hide-on-scroll rule so sticky bars sit just under it. */
export function useNavHidden() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  useMotionValueEvent(scrollY, 'change', y => {
    const prev = scrollY.getPrevious() ?? 0
    setHidden(y > 240 && y > prev)
  })
  return hidden
}

// ─── Presentational pieces ───────────────────────────────────────────────────

export function PageIntro({ eyebrow, title, lead, aside }: { eyebrow: string; title: string; lead?: string; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 max-w-2xl">
        <Reveal y={16}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal y={20} delay={0.05}>
          <h2 className="t-2 mt-3 text-balance">{title}</h2>
        </Reveal>
        {lead && (
          <Reveal y={16} delay={0.1}>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">{lead}</p>
          </Reveal>
        )}
      </div>
      {aside && (
        <Reveal y={16} delay={0.12} className="shrink-0">
          {aside}
        </Reveal>
      )}
    </div>
  )
}

/** Kolam flourishes in two corners of a card, Tamil mode only. Parent must be `relative`. */
export function TamilCorners({ className = '' }: { className?: string }) {
  const lang = useLang()
  if (lang !== 'ta') return null
  return (
    <>
      <KolamCorner className={`pointer-events-none absolute left-3 top-3 opacity-70 ${className}`} />
      <KolamCorner className={`pointer-events-none absolute bottom-3 right-3 rotate-180 opacity-70 ${className}`} />
    </>
  )
}

export function ProgressRing({ value, size = 136, stroke = 10, children, className = '', track = 'text-ink/[0.07]' }: { value: number; size?: number; stroke?: number; children?: ReactNode; className?: string; track?: string }) {
  const gid = 'ring' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e2264f" />
            <stop offset="1" stopColor="#8c0d2b" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={track} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - v) }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** Eight-segment bar for the order pipeline. */
export function StageBar({ order, dark = false, className = '' }: { order: Order; dark?: boolean; className?: string }) {
  const cur = stageIdx(order.status)
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
      {STATUS_ORDER.map((s, i) => (
        <span key={s} className={`relative h-1.5 flex-1 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-ink/[0.08]'}`}>
          <motion.span
            className={`absolute inset-y-0 left-0 rounded-full ${i === cur ? 'bg-ruby-bright' : 'bg-ruby'}`}
            initial={{ width: '0%' }}
            whileInView={{ width: i <= cur ? '100%' : '0%' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.07, ease: EASE }}
          />
        </span>
      ))}
    </div>
  )
}

const lockedCopy = {
  locked: { en: 'Not open yet', ta: 'இன்னும் திறக்கப்படவில்லை' },
  opens: { en: 'Opens at', ta: 'திறக்கும் நிலை' },
  youAre: { en: 'You are at', ta: 'தற்போதைய நிலை' },
  track: { en: 'See your progress', ta: 'முன்னேற்றத்தைப் பார்க்க' },
  stage: { en: 'Stage', ta: 'நிலை' },
  of: { en: 'of', ta: '/' },
}

/** Full-width placeholder for a section that unlocks later in the pipeline. */
export function LockedPanel({ order, unlockAt, title, body, image, icon = 'lock' }: { order: Order; unlockAt: OrderStatus; title: string; body: string; image: Bi<ImgKey>; icon?: IconName }) {
  const t = useT(lockedCopy)
  const lang = useLang()
  const cur = stageIdx(order.status)
  return (
    <Reveal>
      <div className="relative isolate overflow-hidden rounded-[32px] bg-ink">
        <div className="absolute inset-0 -z-10 scale-110 opacity-60" style={{ filter: 'blur(22px) saturate(0.6)' }}>
          <LangImg pair={image} className="h-full w-full" w={900} dark />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/40 via-ink/60 to-ink/85" />
        <div className="grid place-items-center px-3 py-8 sm:px-5 sm:py-16 md:py-24">
          <div className="glass-dark relative w-full max-w-lg rounded-[24px] p-5 text-center sm:rounded-[28px] sm:p-7 md:p-10">
            <TamilCorners />
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <span className="absolute inset-0 rounded-full border border-white/15" />
              <Icon name={icon} size={26} className="text-ruby-bright" />
            </span>
            <p className="t-label mt-6 text-white/55">{t.locked}</p>
            <h3 className="t-3 mt-2 text-balance text-white">{title}</h3>
            <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-white/65">{body}</p>
            <div className="mt-7 rounded-2xl bg-white/[0.06] p-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12.5px]">
                <span className="text-white/55">
                  {t.youAre}: <span className="font-semibold text-white">{statusName(order.status, order.eventType, lang)}</span>
                </span>
                <span className="text-white/55">
                  {t.opens}: <span className="font-semibold text-ruby-bright">{statusName(unlockAt, order.eventType, lang)}</span>
                </span>
              </div>
              <StageBar order={order} dark className="mt-3" />
              <p className="mt-2 text-[11.5px] text-white/40">
                {t.stage} {cur + 1} {t.of} {STATUS_ORDER.length}
              </p>
            </div>
            <Button to="/dashboard/track" variant="white" size="md" icon="arrowRight" className="mt-7">
              {t.track}
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function Stars({ value, size = 16, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="star" size={size} className={i <= value ? 'fill-ruby text-ruby' : 'text-ink/20'} />
      ))}
    </span>
  )
}

/** Small label/value pair used in fact grids. */
export function Fact({ icon, label, value, sub }: { icon: IconName; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.04] text-ink/55">
        <Icon name={icon} size={17} />
      </span>
      <div className="min-w-0">
        <p className="t-label text-ink/45">{label}</p>
        <p className="mt-1 break-words text-[15px] font-medium leading-snug text-ink">{value}</p>
        {sub && <p className="mt-0.5 break-words text-[13px] text-ink/50">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

export type SectionKey = 'overview' | 'track' | 'photos' | 'album' | 'billing' | 'review'

export const SECTIONS: { key: SectionKey; to: string; icon: IconName; label: Bi; desc: Bi }[] = [
  { key: 'overview', to: '/dashboard', icon: 'dashboard', label: { en: 'Overview', ta: 'மேலோட்டம்' }, desc: { en: 'Everything at a glance', ta: 'அனைத்தும் ஒரே பார்வையில்' } },
  { key: 'track', to: '/dashboard/track', icon: 'clock', label: { en: 'Track', ta: 'நிலை' }, desc: { en: 'Every stage, as it happens', ta: 'ஒவ்வொரு கட்டமும் உடனுக்குடன்' } },
  { key: 'photos', to: '/dashboard/photos', icon: 'heart', label: { en: 'Photos', ta: 'படங்கள்' }, desc: { en: 'Choose favourites for the album', ta: 'ஆல்பத்திற்குப் பிடித்தவற்றைத் தேர்வு' } },
  { key: 'album', to: '/dashboard/album', icon: 'book', label: { en: 'Album', ta: 'ஆல்பம்' }, desc: { en: 'Cover, paper, size & type', ta: 'அட்டை, தாள், அளவு, எழுத்துரு' } },
  { key: 'billing', to: '/dashboard/billing', icon: 'receipt', label: { en: 'Billing', ta: 'கட்டணம்' }, desc: { en: 'Invoice & offline payments', ta: 'ரசீது & நேரடிக் கட்டணம்' } },
  { key: 'review', to: '/dashboard/review', icon: 'star', label: { en: 'Review', ta: 'கருத்து' }, desc: { en: 'Tell others about us', ta: 'மற்றவர்களுக்குச் சொல்லுங்கள்' } },
]

export type SectionState = 'locked' | 'action' | 'done' | 'open'

/** What each tab should signal: locked, needs the client's action, done, or simply open. */
export function sectionState(o: Order, key: SectionKey): SectionState {
  switch (key) {
    case 'photos':
      if (!photosUnlocked(o)) return 'locked'
      return selectionClosed(o) ? 'done' : 'action'
    case 'album':
      if (!albumUnlocked(o)) return 'locked'
      if (o.album) return 'done'
      return albumEditable(o) ? 'action' : 'open'
    case 'billing':
      return o.status === 'BILLED' ? 'action' : 'open'
    case 'review':
      if (o.review) return 'done'
      return o.status === 'DELIVERED' ? 'action' : 'open'
    default:
      return 'open'
  }
}

export function formatTime(hhmm: string | undefined, lang: 'en' | 'ta'): string {
  if (!hhmm) return '—'
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h)) return hhmm
  const d = new Date(2000, 0, 1, h, m || 0)
  return d.toLocaleTimeString(lang === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })
}

/** When the order entered its current stage. */
export const stageSince = (o: Order) => [...o.history].reverse().find(h => h.status === o.status)?.at ?? o.createdAt

/** Whether the phone bottom tab bar is on screen, so floating bars can sit above it. */
export const TabBarShown = createContext(false)

/**
 * Floating bottom bar rendered under <body>. Page transitions leave a filter on
 * ancestor elements, which would otherwise trap `position: fixed` inside them.
 */
export function FloatingBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  const tabBar = useContext(TabBarShown)
  return createPortal(
    <motion.div
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 transition-[bottom] duration-500 md:bottom-6 print:hidden ${
        tabBar ? 'bottom-[calc(5rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1rem+env(safe-area-inset-bottom))]'
      } ${className}`}
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
    >
      {children}
    </motion.div>,
    document.body,
  )
}
