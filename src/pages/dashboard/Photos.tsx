import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../../components/Icon'
import { Button, Card, EmptyState, Img, Segmented } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { PROOF_CATEGORIES, districtName, eventByKey, type ProofCategory } from '../../lib/data'
import { formatDate, formatDateTime, useLang, useT } from '../../lib/i18n'
import { IMG, photoUrl, type ImgKey } from '../../lib/images'
import { useMyOrder, useStore, type Order } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { LightTable } from './PhotosLightTable'
import { AnimatedCount, SubmitSelectionModal, Watermark, pad2, ratioOf, useProofingVersion, useQuotaStatus } from './proofing'
import { FloatingBar, LockedPanel, PHOTO_QUOTA, PageIntro, TamilCorners, gcsPath, isProof, photosUnlocked, proofCategory, proofFile, resolveCover, selectionClosed, useProofs } from './shared'

const copy = {
  eyebrow: { en: 'Proofing gallery', ta: 'தேர்வு கேலரி' },
  title: { en: 'Choose the moments for your album.', ta: 'ஆல்பத்திற்கான தருணங்களைத் தேர்ந்தெடுங்கள்.' },
  lead: {
    en: 'Tap the heart on every photo you love. These are low-resolution, watermarked proofs — your album and final files are full quality.',
    ta: 'பிடித்த ஒவ்வொரு படத்திலும் இதயத்தைத் தொடுங்கள். இவை குறைந்த தெளிவுள்ள, நீர்க்குறியிட்ட மாதிரிகள் — ஆல்பமும் இறுதிக் கோப்புகளும் முழுத் தரத்தில் இருக்கும்.',
  },
  studio: { en: 'The Treasure Capture', ta: 'தி ட்ரெஷர் கேப்சர்' },
  edition: { en: 'Proofing edition', ta: 'தேர்வுப் பதிப்பு' },
  chapter: { en: 'Chapter', ta: 'அத்தியாயம்' },
  frames: { en: 'Frames', ta: 'படங்கள்' },
  chosen: { en: 'Chosen', ta: 'தேர்ந்தவை' },
  nextChapter: { en: 'Next chapter', ta: 'அடுத்த அத்தியாயம்' },
  contents: { en: 'Gallery chapters', ta: 'கேலரி அத்தியாயங்கள்' },
  all: { en: 'All', ta: 'அனைத்தும்' },
  selected: { en: 'Selected', ta: 'தேர்ந்தவை' },
  unselected: { en: 'Not selected', ta: 'தேர்வாகாதவை' },
  of: { en: 'of', ta: '/' },
  forAlbum: { en: 'for your album', ta: 'ஆல்பத்திற்கு' },
  submit: { en: 'Submit selection', ta: 'தேர்வைச் சமர்ப்பி' },
  source: { en: 'Streaming low-res proofs from', ta: 'குறைந்த தெளிவு மாதிரிகள் இங்கிருந்து:' },
  onlyIds: { en: 'Only your list of selected file names is saved.', ta: 'தேர்ந்த கோப்புப் பெயர்களின் பட்டியல் மட்டுமே சேமிக்கப்படும்.' },
  select: { en: 'Select', ta: 'தேர்ந்தெடு' },
  unselect: { en: 'Selected', ta: 'தேர்வானது' },
  view: { en: 'View larger', ta: 'பெரிதாகப் பார்க்க' },
  close: { en: 'Close', ta: 'மூடு' },
  prev: { en: 'Previous photo', ta: 'முந்தைய படம்' },
  next: { en: 'Next photo', ta: 'அடுத்த படம்' },
  keys: { en: '← → browse · S select · Esc close', ta: '← → உலாவ · S தேர்வு · Esc மூட' },
  noneSelected: { en: 'Nothing selected in this chapter yet', ta: 'இந்த அத்தியாயத்தில் இன்னும் எதுவும் தேர்வாகவில்லை' },
  noneSelectedBody: { en: 'Tap the heart on a photo to add it to your album.', ta: 'படத்திலுள்ள இதயத்தைத் தொட்டு ஆல்பத்தில் சேர்க்கவும்.' },
  allSelected: { en: 'You’ve selected every photo in this chapter', ta: 'இந்த அத்தியாயத்தின் எல்லாப் படங்களையும் தேர்ந்தெடுத்துவிட்டீர்கள்' },
  showAll: { en: 'Show all photos', ta: 'அனைத்தையும் காட்டு' },
  photos: { en: 'photos', ta: 'படங்கள்' },
  quotaToast: { en: 'You’ve reached the album quota', ta: 'ஆல்ப வரம்பை அடைந்துவிட்டீர்கள்' },

  lockedTitle: { en: 'Your proofs are being prepared', ta: 'உங்கள் மாதிரிப் படங்கள் தயாராகின்றன' },
  lockedBody: {
    en: 'We cull and colour-grade every frame before the gallery opens. You’ll get a WhatsApp the moment it’s ready.',
    ta: 'கேலரி திறக்கும் முன் ஒவ்வொரு படத்தையும் தேர்ந்து மெருகேற்றுகிறோம். தயாரானதும் வாட்ஸ்அப்பில் தெரிவிப்போம்.',
  },

  doneEyebrow: { en: 'Selection submitted', ta: 'தேர்வு சமர்ப்பிக்கப்பட்டது' },
  doneTitle: { en: 'Your favourites are with our designers.', ta: 'உங்களுக்குப் பிடித்தவை எங்கள் வடிவமைப்பாளர்களிடம்.' },
  doneLead: { en: 'The gallery is now read-only. Need a change? Message the studio and we’ll reopen it.', ta: 'கேலரி இப்போது பார்வைக்கு மட்டும். மாற்றம் வேண்டுமா? ஸ்டுடியோவுக்குச் செய்தி அனுப்புங்கள், மீண்டும் திறப்போம்.' },
  submittedOn: { en: 'Submitted', ta: 'சமர்ப்பித்தது' },
  designAlbum: { en: 'Design your album', ta: 'ஆல்பம் வடிவமை' },
  finalised: { en: 'Your selection was finalised with the studio in person.', ta: 'உங்கள் தேர்வு ஸ்டுடியோவில் நேரில் இறுதி செய்யப்பட்டது.' },
}

type Filter = 'all' | 'selected' | 'unselected'


function useMinWidth(px: number) {
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
 * Justified rows: each row fills the width at one shared height, so every
 * proof keeps its natural crop. Row targets alternate for an editorial rhythm;
 * a short last row is padded instead of blown up.
 */
function justify(ids: ImgKey[], targets: number[]) {
  const rows: { ids: ImgKey[]; fill: number }[] = []
  let cur: ImgKey[] = []
  let sum = 0
  for (const id of ids) {
    cur.push(id)
    sum += ratioOf(id)
    if (sum >= targets[rows.length % targets.length]) {
      rows.push({ ids: cur, fill: 0 })
      cur = []
      sum = 0
    }
  }
  if (cur.length) rows.push({ ids: cur, fill: Math.max(0, targets[rows.length % targets.length] - sum) })
  return rows
}

// ─── Cover ───────────────────────────────────────────────────────────────────

/** Banner placements on a 12 × 2 grid, by image count: side pairs flank a centre frame the DP sits under. */
const BANNER_LAYOUT: Record<number, CSSProperties[]> = {
  5: [
    { gridColumn: '1 / 4', gridRow: '1' },
    { gridColumn: '1 / 4', gridRow: '2' },
    { gridColumn: '4 / 10', gridRow: '1 / 3' },
    { gridColumn: '10 / 13', gridRow: '1' },
    { gridColumn: '10 / 13', gridRow: '2' },
  ],
  4: [
    { gridColumn: '1 / 4', gridRow: '1 / 3' },
    { gridColumn: '4 / 10', gridRow: '1 / 3' },
    { gridColumn: '10 / 13', gridRow: '1' },
    { gridColumn: '10 / 13', gridRow: '2' },
  ],
}
const bannerLayout = (n: number): CSSProperties[] => BANNER_LAYOUT[n] ?? Array.from({ length: n }, (_, i) => ({ gridColumn: `${Math.floor((i * 12) / n) + 1} / ${Math.floor(((i + 1) * 12) / n) + 1}`, gridRow: '1 / 3' }))

/** Magazine-style masthead: collage banner, display picture, client name and event date. */
export function CoverMasthead({ order, compact = false }: { order: Order; compact?: boolean }) {
  const t = useT(copy)
  const lang = useLang()
  const cover = resolveCover(order, lang)
  const banner = cover.banner.filter(isProof).slice(0, 5)
  const layout = bannerLayout(banner.length)
  const ev = eventByKey(order.eventType)
  const Name = compact ? 'p' : 'h2'

  return (
    <header className="relative">
      <Reveal y={16}>
        <div className={`relative overflow-hidden bg-ink ${compact ? 'rounded-2xl' : 'rounded-[28px]'}`}>
          <div className={`grid grid-cols-12 grid-rows-2 gap-1 ${compact ? 'h-[180px]' : 'h-[260px] sm:h-[360px] md:h-[460px]'}`}>
            {banner.map((id, i) => (
              <motion.div
                key={`${id}-${i}`}
                style={layout[i]}
                className="relative min-h-0 overflow-hidden"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.08 * i }}
              >
                <Img k={id} w={i === 2 || (banner.length === 4 && i === 1) ? 1200 : 600} sizes={compact ? '30vw' : '(min-width:768px) 50vw, 60vw'} className="h-full w-full" dark priority={!compact} />
              </motion.div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-transparent to-ink/35" />
          <div className={`absolute inset-x-0 top-0 flex items-start justify-between gap-4 text-white ${compact ? 'p-3' : 'p-4 md:p-6'}`}>
            <p className={`font-display font-medium leading-none ${compact ? 'text-[15px]' : 'text-[18px] md:text-[26px]'}`}>{t.studio}</p>
            <p className={`t-label text-right text-white/75 ${compact ? '!text-[9px]' : ''}`}>
              {t.edition}
              <span className="mt-1 block font-mono normal-case tracking-normal text-white/55">{order.id}</span>
            </p>
          </div>
        </div>
      </Reveal>

      <div className={`relative z-10 flex flex-col items-center text-center ${compact ? '-mt-12' : '-mt-16 md:-mt-24'}`}>
        <motion.div
          className={`rounded-full bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(10,10,11,0.5)] ring-1 ring-ruby/25 ${compact ? 'h-24 w-24' : 'h-32 w-32 md:h-48 md:w-48'}`}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        >
          <Img k={cover.dp} w={480} ratio={1} sizes="200px" className="h-full w-full rounded-full" />
        </motion.div>
        {ev && <p className={`t-label text-ruby ${compact ? 'mt-3' : 'mt-5'}`}>{ev.name[lang]}</p>}
        <Name className={`${compact ? 'mt-1 font-display text-[28px] font-medium leading-tight' : 't-1 mt-2'} max-w-4xl text-balance px-2`}>{cover.name}</Name>
        <div className={`flex items-center justify-center gap-4 text-ink/60 ${compact ? 'mt-2' : 'mt-4'}`}>
          <span className="h-px w-8 bg-ink/20 md:w-14" />
          <p className={`font-display italic ${compact ? 'text-[15px]' : 'text-[18px] md:text-[22px]'}`}>{cover.date}</p>
          <span className="h-px w-8 bg-ink/20 md:w-14" />
        </div>
        {!compact && (
          <p className="mt-2 text-[12.5px] text-ink/45">
            {[order.venueName, districtName(order.district, lang)].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </header>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Photos() {
  useTitle({ en: 'Select photos', ta: 'படத் தேர்வு' })
  const t = useT(copy)
  const order = useMyOrder()
  const version = useProofingVersion(s => s.version)
  if (!order) return null

  if (!photosUnlocked(order)) {
    return (
      <div>
        <PageIntro eyebrow={t.eyebrow} title={t.title} />
        <LockedPanel order={order} unlockAt="SELECT_PHOTOS" title={t.lockedTitle} body={t.lockedBody} image={{ en: 'm_bride_red', ta: 't_bride_silk' }} icon="image" />
      </div>
    )
  }
  if (selectionClosed(order)) return <Submitted order={order} />
  return version === 2 ? <LightTable order={order} /> : <Proofing order={order} />
}

function Proofing({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const lenis = useLenis()
  const toggleSelection = useStore(s => s.toggleSelection)
  const proofs = useProofs()
  const [cat, setCat] = useState<ProofCategory>('individuals')
  const [filter, setFilter] = useState<Filter>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => new Set(order.selection.filter(isProof)), [order.selection])
  const count = selected.size
  const quota = PHOTO_QUOTA[order.packageId]

  const byCat = useMemo(() => {
    const m = Object.fromEntries(PROOF_CATEGORIES.map(c => [c.key, [] as ImgKey[]])) as Record<ProofCategory, ImgKey[]>
    for (const id of proofs) m[proofCategory(id)].push(id)
    return m
  }, [proofs])

  const catIds = byCat[cat]
  const catSelected = catIds.filter(id => selected.has(id)).length
  const visible = useMemo(
    () => catIds.filter(id => (filter === 'all' ? true : filter === 'selected' ? selected.has(id) : !selected.has(id))),
    [catIds, filter, selected],
  )
  // The chapter opens on its first landscape frame; the rest follow in justified rows.
  const feature = visible.find(id => ratioOf(id) >= 1.2) ?? visible[0]
  const ordered = useMemo(() => (feature ? [feature, ...visible.filter(id => id !== feature)] : []), [feature, visible])

  const idx = PROOF_CATEGORIES.findIndex(c => c.key === cat)
  const meta = PROOF_CATEGORIES[idx]
  const nextCat = PROOF_CATEGORIES[idx + 1]

  const toggle = useCallback(
    (id: ImgKey) => {
      if (!selected.has(id) && count + 1 === quota) toast(t.quotaToast)
      toggleSelection(order.id, id)
    },
    [selected, count, quota, toggleSelection, order.id, t.quotaToast],
  )

  const goTo = (key: ProofCategory) => {
    setCat(key)
    setLightbox(null)
    const el = navRef.current
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -96 })
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const status = useQuotaStatus(count, quota)

  return (
    <div>
      <CoverMasthead order={order} />

      <Reveal y={12}>
        <p className="mx-auto mt-6 max-w-xl text-center text-[14.5px] leading-relaxed text-ink/55">{t.lead}</p>
      </Reveal>

      {/* Contents — chapter tabs + selection filter */}
      <div ref={navRef} className="mt-12 flex flex-col gap-3 border-y border-ink/10 md:mt-16 md:flex-row md:items-center md:justify-between">
        <nav aria-label={t.contents} className="no-scrollbar -mx-1 flex overflow-x-auto" data-lenis-prevent>
          {PROOF_CATEGORIES.map((c, i) => {
            const on = c.key === cat
            const n = byCat[c.key].length
            const s = byCat[c.key].filter(id => selected.has(id)).length
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                aria-current={on ? 'page' : undefined}
                className="group relative flex shrink-0 items-baseline gap-2 px-3 py-4 cursor-pointer md:px-5 md:py-5"
              >
                <span className="font-display text-[13px] italic text-ruby">{pad2(i + 1)}</span>
                <span className={`font-display text-[19px] leading-none transition-colors md:text-[23px] ${on ? 'text-ink' : 'text-ink/40 group-hover:text-ink/70'}`}>{c.name[lang]}</span>
                <span className={`text-[11px] tabular-nums ${s ? 'text-ruby' : 'text-ink/35'}`}>
                  {s}/{n}
                </span>
                {on && <motion.span layoutId="proof-chapter" className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-ruby md:inset-x-5" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              </button>
            )
          })}
        </nav>
        <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-3 md:pb-0" data-lenis-prevent>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            size="sm"
            options={[
              { value: 'all', label: t.all },
              { value: 'selected', label: t.selected },
              { value: 'unselected', label: t.unselected },
            ]}
          />
        </div>
      </div>

      {/* Chapter */}
      <AnimatePresence mode="wait">
        <motion.section key={cat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EASE }} className="pt-10 md:pt-14">
          <div className="grid gap-8 md:grid-cols-12 md:items-end md:gap-10">
            <div className={feature ? 'md:col-span-5' : 'md:col-span-12'}>
              <p className="font-display text-[17px] italic text-ruby">
                {t.chapter} {pad2(idx + 1)}
              </p>
              <h2 className="t-1 mt-2">{meta.name[lang]}</h2>
              <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-ink/60">{meta.blurb[lang]}</p>
              <dl className="mt-8 flex gap-10 border-t border-ink/10 pt-5">
                <div>
                  <dt className="t-label text-ink/40">{t.frames}</dt>
                  <dd className="mt-1 font-display text-[30px] font-medium leading-none tabular-nums">{catIds.length}</dd>
                </div>
                <div>
                  <dt className="t-label text-ink/40">{t.chosen}</dt>
                  <dd className="mt-1 font-display text-[30px] font-medium leading-none tabular-nums text-ruby">
                    <AnimatedCount value={catSelected} />
                  </dd>
                </div>
              </dl>
            </div>
            {feature && (
              <div className="md:col-span-7">
                <ProofTile id={feature} index={0} selected={selected.has(feature)} onToggle={() => toggle(feature)} onOpen={() => setLightbox(0)} feature className={ratioOf(feature) < 1 ? 'mx-auto max-w-[440px]' : ''} />
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                icon="heart"
                title={filter === 'selected' ? t.noneSelected : t.allSelected}
                body={filter === 'selected' ? t.noneSelectedBody : undefined}
                action={
                  <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                    {t.showAll}
                  </Button>
                }
              />
            </div>
          ) : (
            <JustifiedGrid ids={ordered.slice(1)} selected={selected} onToggle={toggle} onOpen={i => setLightbox(i + 1)} />
          )}

          {nextCat && (
            <button type="button" onClick={() => goTo(nextCat.key)} className="group mt-16 flex w-full items-end justify-between gap-6 border-t border-ink/10 pt-8 text-left cursor-pointer md:mt-24">
              <span>
                <span className="t-label block text-ink/40">
                  {t.nextChapter} · {pad2(idx + 2)}
                </span>
                <span className="t-2 mt-2 block transition-colors group-hover:text-ruby">{nextCat.name[lang]}</span>
              </span>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors group-hover:border-ruby group-hover:bg-ruby group-hover:text-white">
                <Icon name="arrowRight" size={20} />
              </span>
            </button>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="mt-12 flex flex-col items-center gap-1.5 text-center text-[11.5px] text-ink/40">
        <p>{t.onlyIds}</p>
        <p className="flex min-w-0 max-w-full items-center gap-1.5">
          <Icon name="lock" size={12} className="shrink-0" />
          <span className="shrink-0">{t.source}</span>
          <code className="truncate font-mono text-ink/55">{gcsPath(order)}</code>
        </p>
      </div>

      {/* Sticky action bar */}
      <FloatingBar>
        <div className="glass-dark pointer-events-auto flex w-full max-w-2xl items-center gap-3 rounded-full py-2 pl-5 pr-2 md:gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <Icon name="heart" size={15} className="shrink-0 translate-y-[2px] fill-ruby-bright text-ruby-bright" />
              <span className="text-[15px] font-semibold tabular-nums text-white">
                <AnimatedCount value={count} /> <span className="font-normal text-white/50">/ {quota}</span>
              </span>
              <span className="hidden truncate text-[12.5px] text-white/55 sm:inline">{status}</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/12">
              <motion.div className="h-full rounded-full bg-ruby-bright" animate={{ width: `${Math.min(100, (count / quota) * 100)}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
            </div>
          </div>
          <Button onClick={() => setConfirm(true)} disabled={count === 0} icon="arrowRight" className="shrink-0 !px-4 sm:!px-5">
            {t.submit}
          </Button>
        </div>
      </FloatingBar>

      <Lightbox ids={ordered} index={lightbox} onIndex={setLightbox} selected={selected} onToggle={toggle} />

      <SubmitSelectionModal order={order} selected={selected} open={confirm} onClose={() => setConfirm(false)} />
    </div>
  )
}

function JustifiedGrid({ ids, selected, onToggle, onOpen }: { ids: ImgKey[]; selected: Set<string>; onToggle: (id: ImgKey) => void; onOpen: (i: number) => void }) {
  const wide = useMinWidth(768)
  const rows = useMemo(() => justify(ids, wide ? [3.4, 2.4, 4.2] : [1.4, 2]), [ids, wide])
  let n = 0
  return (
    <div className="mt-3 flex flex-col gap-3 md:mt-4 md:gap-4">
      {rows.map((row, r) => (
        <div key={r} className="flex items-start gap-3 md:gap-4">
          {row.ids.map(id => {
            const i = n++
            return <ProofTile key={id} id={id} index={i} selected={selected.has(id)} onToggle={() => onToggle(id)} onOpen={() => onOpen(i)} style={{ flex: `${ratioOf(id)} 1 0%` }} />
          })}
          {row.fill > 0 && <div aria-hidden="true" style={{ flex: `${row.fill} 1 0%` }} />}
        </div>
      ))}
    </div>
  )
}

function Heart({ selected, onToggle, label, size = 40, dark = false }: { selected: boolean; onToggle: () => void; label: string; size?: number; dark?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onToggle()
      }}
      whileTap={{ scale: 0.82 }}
      aria-pressed={selected}
      aria-label={label}
      className={`relative flex items-center justify-center rounded-full transition-colors duration-300 cursor-pointer before:absolute before:-inset-1.5 before:content-[''] ${
        selected ? 'bg-ruby text-white shadow-ruby' : dark ? 'glass-dark text-white' : 'glass text-ink hover:bg-white'
      }`}
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {selected && (
          <motion.span
            key="burst"
            className="absolute inset-0 rounded-full border-2 border-ruby-bright"
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        )}
      </AnimatePresence>
      <motion.span key={String(selected)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }} className="flex">
        <Icon name="heart" size={Math.round(size * 0.45)} strokeWidth={1.8} className={selected ? 'fill-white' : ''} />
      </motion.span>
    </motion.button>
  )
}

function ProofTile({ id, index, selected, onToggle, onOpen, feature = false, className = '', style }: { id: ImgKey; index: number; selected: boolean; onToggle: () => void; onOpen: () => void; feature?: boolean; className?: string; style?: CSSProperties }) {
  const t = useT(copy)
  return (
    <motion.figure
      className={`group relative min-w-0 ${className}`}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -5% 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay: Math.min(index % 6, 5) * 0.05 }}
    >
      <div
        className={`relative overflow-hidden rounded-md bg-mist transition-[box-shadow] duration-500 ${selected ? 'ring-[3px] ring-ruby ring-offset-2 ring-offset-white' : ''}`}
        style={{ aspectRatio: `${IMG[id].w} / ${IMG[id].h}` }}
      >
        <button type="button" onClick={onOpen} aria-label={`${t.view}: ${proofFile(id)}`} className="absolute inset-0 block h-full w-full cursor-zoom-in">
          <motion.div className="relative h-full w-full" animate={{ scale: selected ? 0.95 : 1 }} transition={{ duration: 0.5, ease: EASE }}>
            <Img
              k={id}
              w={feature ? 1200 : 720}
              sizes={feature ? '(min-width:768px) 60vw, 100vw' : '(min-width:768px) 40vw, 60vw'}
              className="h-full w-full rounded-[4px]"
              imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <Watermark size={feature ? 'md' : 'sm'} />
          </motion.div>
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="pointer-events-none absolute left-2.5 top-2.5 font-mono text-[10.5px] text-white/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100">{proofFile(id)}</span>
        <div className="absolute right-2 top-2">
          <Heart selected={selected} onToggle={onToggle} label={`${selected ? t.unselect : t.select}: ${proofFile(id)}`} size={feature ? 42 : 34} />
        </div>
      </div>
    </motion.figure>
  )
}

function Lightbox({ ids, index, onIndex, selected, onToggle, readOnly = false }: { ids: ImgKey[]; index: number | null; onIndex: (i: number | null) => void; selected: Set<string>; onToggle: (id: ImgKey) => void; readOnly?: boolean }) {
  const t = useT(copy)
  const lenis = useLenis()
  const [dir, setDir] = useState(0)
  const open = index !== null && ids.length > 0
  const i = open ? Math.min(index, ids.length - 1) : 0
  const id = ids[i]

  const go = useCallback(
    (d: number) => {
      if (index === null || !ids.length) return
      setDir(d)
      onIndex((index + d + ids.length) % ids.length)
    },
    [index, ids.length, onIndex],
  )

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onIndex(null)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (!readOnly && (e.key.toLowerCase() === 's' || e.key === ' ')) {
        e.preventDefault()
        onToggle(ids[i])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, lenis, go, onIndex, onToggle, ids, i, readOnly])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 80 || info.velocity.x > 400) go(-1)
  }

  const isSel = open && selected.has(id)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex flex-col bg-ink/95 text-white backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label={proofFile(id)}
        >
          {/* top bar */}
          <div className="relative z-10 flex items-center justify-between gap-3 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:p-5">
            <span className="glass-dark inline-flex min-w-0 items-center gap-3 rounded-full px-4 py-2 text-[13px]">
              <span className="truncate font-mono text-white/90">{proofFile(id)}</span>
              <span className="text-white/40 tabular-nums">
                {i + 1} / {ids.length}
              </span>
            </span>
            <button type="button" onClick={() => onIndex(null)} aria-label={t.close} className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition hover:bg-white/15 cursor-pointer">
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* image */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 md:px-24">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.div
                key={id}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 80, scale: 0.98 }),
                  center: { opacity: 1, x: 0, scale: 1 },
                  exit: (d: number) => ({ opacity: 0, x: d * -80, scale: 0.98 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: EASE }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={onDragEnd}
                className="relative flex h-full max-h-full w-full items-center justify-center touch-pan-y"
              >
                <div className="relative" style={{ aspectRatio: `${IMG[id].w} / ${IMG[id].h}`, width: `min(100%, calc(72vh * ${(IMG[id].w / IMG[id].h).toFixed(4)}))` }}>
                  <img
                    src={photoUrl(id, 1400)}
                    alt={IMG[id].alt}
                    draggable={false}
                    className={`h-full w-full rounded-xl object-contain transition-shadow duration-500 ${isSel ? 'shadow-[0_0_0_3px_#e2264f]' : ''}`}
                  />
                  <Watermark size="md" />
                </div>
              </motion.div>
            </AnimatePresence>

            <button type="button" onClick={() => go(-1)} aria-label={t.prev} className="glass-dark absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-white/15 md:flex cursor-pointer">
              <Icon name="chevronLeft" size={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t.next} className="glass-dark absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition hover:bg-white/15 md:flex cursor-pointer">
              <Icon name="chevronRight" size={20} />
            </button>
          </div>

          {/* bottom bar */}
          <div className="relative z-10 flex items-center justify-center gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-6">
            <button type="button" onClick={() => go(-1)} aria-label={t.prev} className="glass-dark flex h-12 w-12 items-center justify-center rounded-full md:hidden cursor-pointer">
              <Icon name="chevronLeft" size={20} />
            </button>
            {readOnly ? (
              <span className="inline-flex h-12 items-center gap-2.5 rounded-full bg-ruby px-6 text-[14px] font-semibold text-white shadow-ruby">
                <Icon name="heart" size={18} className="fill-white" />
                {t.unselect}
              </span>
            ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(id)}
              aria-pressed={isSel}
              className={`inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[14px] font-semibold transition-colors duration-300 cursor-pointer ${isSel ? 'bg-ruby text-white shadow-ruby' : 'glass-dark text-white hover:bg-white/15'}`}
            >
              <Icon name="heart" size={18} className={isSel ? 'fill-white' : ''} />
              {isSel ? t.unselect : t.select}
              <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${isSel ? 'bg-white/20' : 'bg-white/10'}`}>{selected.size}</span>
            </motion.button>
            )}
            <button type="button" onClick={() => go(1)} aria-label={t.next} className="glass-dark flex h-12 w-12 items-center justify-center rounded-full md:hidden cursor-pointer">
              <Icon name="chevronRight" size={20} />
            </button>
            {!readOnly && <span className="absolute bottom-7 right-6 hidden text-[12px] text-white/35 lg:block">{t.keys}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Submitted({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const chapters = useMemo(() => {
    const own = order.selection.filter(isProof)
    return PROOF_CATEGORIES.map(c => ({ ...c, ids: own.filter(id => proofCategory(id) === c.key) })).filter(c => c.ids.length)
  }, [order.selection])
  const ids = useMemo(() => chapters.flatMap(c => c.ids), [chapters])
  const selected = useMemo(() => new Set<string>(ids), [ids])
  let n = 0

  return (
    <div>
      <CoverMasthead order={order} />

      <Reveal>
        <Card className="relative mb-12 mt-12 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:mt-16 md:p-7">
          <TamilCorners />
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ruby text-white shadow-ruby">
              <Icon name="check" size={24} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="t-label text-ruby">{t.doneEyebrow}</p>
              <p className="mt-1 font-display text-[24px] font-medium leading-tight">{t.doneTitle}</p>
              <p className="mt-1 text-[13px] text-ink/50">
                {ids.length} {t.photos} · {order.selectionSubmittedAt ? `${t.submittedOn} ${formatDateTime(order.selectionSubmittedAt, lang)}` : formatDate(order.createdAt, lang)}
              </p>
              <p className="mt-1 text-[13px] text-ink/50">{t.doneLead}</p>
            </div>
          </div>
          <Button to="/dashboard/album" icon="arrowRight" className="shrink-0">
            {t.designAlbum}
          </Button>
        </Card>
      </Reveal>

      {ids.length === 0 ? (
        <EmptyState icon="image" title={t.finalised} />
      ) : (
        <div className="space-y-12">
          {chapters.map(c => (
            <section key={c.key}>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
                <h3 className="font-display text-[26px] font-medium leading-none md:text-[32px]">
                  <span className="mr-3 text-[15px] italic text-ruby">{pad2(PROOF_CATEGORIES.findIndex(x => x.key === c.key) + 1)}</span>
                  {c.name[lang]}
                </h3>
                <span className="text-[12.5px] tabular-nums text-ink/45">
                  {c.ids.length} {t.photos}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-6">
                {c.ids.map(id => {
                  const i = n++
                  return (
                    <motion.button
                      type="button"
                      key={id}
                      onClick={() => setLightbox(i)}
                      aria-label={`${t.view}: ${proofFile(id)}`}
                      className="group relative aspect-square overflow-hidden rounded-md cursor-zoom-in"
                      initial={{ opacity: 0, scale: 0.94 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: EASE, delay: (i % 12) * 0.03 }}
                    >
                      <Img k={id} w={320} ratio={1} sizes="(min-width:1024px) 16vw, 33vw" className="h-full w-full" imgClassName="transition-transform duration-700 group-hover:scale-105" />
                      <Watermark size="xs" />
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ruby text-white">
                        <Icon name="heart" size={12} className="fill-white" />
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 flex flex-wrap items-center justify-center gap-1.5 text-[11.5px] text-ink/40">
        <Icon name="lock" size={12} />
        <code className="font-mono">{gcsPath(order)}</code>
      </p>

      <Lightbox ids={ids} index={lightbox} onIndex={setLightbox} selected={selected} onToggle={() => {}} readOnly />
    </div>
  )
}
