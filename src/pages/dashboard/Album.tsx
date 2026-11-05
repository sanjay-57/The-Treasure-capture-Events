import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, Card, ChoiceCard, Field, Segmented } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { formatDateTime, formatINR, useLang, useT, type Bi } from '../../lib/i18n'
import { photoUrl, type ImgKey } from '../../lib/images'
import { PackageAlbumNote } from '../../components/PackageAlbumNote'
import { GRAIN, Surface, isLight } from '../../components/AlbumSurface'
import { ALBUM, type AlbumSpec } from '../../lib/data'
import { albumUpgradeCost, cartTierName } from '../../lib/catalogue'
import { useMyOrder, usePrices, useStore, type Order } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { FloatingBar, includedSheets, LockedPanel, PageIntro, TamilCorners, albumDefaults, albumEditable, albumPhotos, albumUnlocked, savedAlbum } from './shared'

const copy = {
  eyebrow: { en: 'Album studio', ta: 'ஆல்பம் ஸ்டுடியோ' },
  title: { en: 'Design the album you’ll keep for a lifetime.', ta: 'வாழ்நாள் முழுதும் போற்றும் ஆல்பத்தை வடிவமையுங்கள்.' },
  lead: {
    en: 'Every choice updates the preview instantly — it’s exactly what our binders will make by hand.',
    ta: 'ஒவ்வொரு தேர்வும் முன்னோட்டத்தில் உடனே தெரியும் — எங்கள் கைவினைஞர்கள் அப்படியே உருவாக்குவார்கள்.',
  },
  cover: { en: 'Cover', ta: 'அட்டை' },
  inside: { en: 'Inside', ta: 'உள்ளே' },
  tilt: { en: 'Move to tilt', ta: 'அசைத்துப் பாருங்கள்' },
  spread: { en: 'Spread', ta: 'பக்கம்' },
  prevSpread: { en: 'Previous spread', ta: 'முந்தைய பக்கம்' },
  nextSpread: { en: 'Next spread', ta: 'அடுத்த பக்கம்' },

  s1: { en: 'Cover material', ta: 'அட்டைப் பொருள்' },
  s2: { en: 'Colour', ta: 'நிறம்' },
  s2acrylic: { en: 'Used for the spine and back of the acrylic cover.', ta: 'அக்ரிலிக் அட்டையின் முதுகு, பின்பக்கத்திற்குப் பயன்படும்.' },
  s3: { en: 'Page size', ta: 'பக்க அளவு' },
  s4: { en: 'Paper finish', ta: 'தாள் தரம்' },
  s5: { en: 'Sheets', ta: 'தாள்கள்' },
  s5note: { en: 'Each sheet is a two-page lay-flat spread.', ta: 'ஒவ்வொரு தாளும் இரு பக்க லே-ஃப்ளாட் விரிப்பு.' },
  pages: { en: 'pages', ta: 'பக்கங்கள்' },
  included: { en: 'Included', ta: 'அடங்கும்' },
  inPkg: { en: 'sheets included in your package', ta: 'தாள்கள் உங்கள் தொகுப்பில் அடங்கும்' },
  noneInPkg: { en: 'No album in your package yet; pick a size to add one.', ta: 'உங்கள் தொகுப்பில் இன்னும் ஆல்பம் இல்லை; ஒரு அளவைத் தேர்ந்தெடுங்கள்.' },
  payDiff: { en: 'Move up and pay only the difference.', ta: 'பெரிய ஆல்பத்திற்கு மாறினால் வித்தியாசம் மட்டும் செலுத்துங்கள்.' },
  sLayout: { en: 'Page layout', ta: 'பக்க அமைப்பு' },
  sLayoutNote: { en: 'Sample layouts. The real ones from our album maker arrive soon.', ta: 'மாதிரி அமைப்புகள். ஆல்பம் தயாரிப்பாளரின் உண்மையான அமைப்புகள் விரைவில்.' },
  sample: { en: 'Sample', ta: 'மாதிரி' },
  s6: { en: 'Typography', ta: 'எழுத்துரு' },
  s7: { en: 'Cover text', ta: 'அட்டை வாசகம்' },
  titleLabel: { en: 'Title', ta: 'தலைப்பு' },
  subtitleLabel: { en: 'Subtitle', ta: 'துணைத் தலைப்பு' },
  subtitleHint: { en: 'A date, place or a line that matters to you.', ta: 'தேதி, இடம் அல்லது உங்களுக்குப் பிடித்த ஒரு வரி.' },

  upgrade: { en: 'Album upgrade', ta: 'ஆல்ப மேம்பாடு' },
  noExtra: { en: 'No extra cost', ta: 'கூடுதல் கட்டணம் இல்லை' },
  save: { en: 'Save design', ta: 'வடிவமைப்பைச் சேமி' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  savedToast: { en: 'Album design saved — our designers have it', ta: 'ஆல்பம் வடிவமைப்பு சேமிக்கப்பட்டது — வடிவமைப்பாளர்களுக்கு அனுப்பப்பட்டது' },
  lastSaved: { en: 'Last saved', ta: 'கடைசியாகச் சேமித்தது' },
  unsaved: { en: 'Unsaved changes', ta: 'சேமிக்கப்படாத மாற்றங்கள்' },

  lockedTitle: { en: 'Choose your photos first', ta: 'முதலில் படங்களைத் தேர்ந்தெடுங்கள்' },
  lockedBody: {
    en: 'The album studio opens as soon as you submit your photo selection — so the preview can use your own pictures.',
    ta: 'படத் தேர்வைச் சமர்ப்பித்தவுடன் ஆல்பம் ஸ்டுடியோ திறக்கும் — அப்போதுதான் முன்னோட்டத்தில் உங்கள் படங்களே தெரியும்.',
  },
  productionTitle: { en: 'Your album is in production', ta: 'உங்கள் ஆல்பம் தயாரிப்பில் உள்ளது' },
  productionBody: { en: 'The design is locked while our binders work on it. Need a change? Message the studio.', ta: 'கைவினைஞர்கள் வேலை செய்வதால் வடிவமைப்பு பூட்டப்பட்டுள்ளது. மாற்றம் வேண்டுமா? ஸ்டுடியோவுக்குச் செய்தி அனுப்புங்கள்.' },
  spec: { en: 'Specification', ta: 'விவரக்குறிப்பு' },
  watch: { en: 'Watch the e-album', ta: 'இ-ஆல்பத்தைப் பார்க்க' },
  watchNote: { en: 'Your photos as a page-turning album, with this cover and layout.', ta: 'இந்த அட்டை, அமைப்புடன் பக்கம் புரட்டும் ஆல்பமாக உங்கள் படங்கள்.' },
}

const COVER_NOTES: Record<string, Bi> = {
  leather: { en: 'Soft-touch grain, hand-stitched edge', ta: 'மென்மையான தோல் அமைப்பு, கைத் தையல் ஓரம்' },
  velvet: { en: 'Deep pile with a moving sheen', ta: 'அடர்த்தியான இழை, அசையும் பளபளப்பு' },
  acrylic: { en: 'Your photo under glass-clear acrylic', ta: 'கண்ணாடி போன்ற அக்ரிலிக்கின் கீழ் உங்கள் படம்' },
  linen: { en: 'Woven texture, quietly elegant', ta: 'நெய்த அமைப்பு, அமைதியான நேர்த்தி' },
  silk: { en: 'Handloom silk with a zari border', ta: 'ஜரிகை பார்டருடன் கைத்தறிப் பட்டு' },
}

// ─── Material helpers ────────────────────────────────────────────────────────

const colorOf = (key: string) => ALBUM.colors.find(c => c.key === key) ?? ALBUM.colors[0]
const fontOf = (key: string) => ALBUM.fonts.find(f => f.key === key) ?? ALBUM.fonts[0]

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`
}
// ─── Geometry ────────────────────────────────────────────────────────────────

/** Closed page dimensions (w/h ratio and height factor) for each album size. */
const SIZE_GEO: Record<string, { ratio: number; hf: number }> = {
  '12x36': { ratio: 1.5, hf: 1 },
  '12x30': { ratio: 1.25, hf: 1 },
  '10x24': { ratio: 1.2, hf: 10 / 12 },
  '12x12': { ratio: 1, hf: 1 },
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Album() {
  useTitle({ en: 'Design your album', ta: 'ஆல்பம் வடிவமைப்பு' })
  const t = useT(copy)
  const order = useMyOrder()
  if (!order) return null

  if (!albumUnlocked(order)) {
    return (
      <div>
        <PageIntro eyebrow={t.eyebrow} title={t.title} />
        <LockedPanel order={order} unlockAt="ALBUM_CUSTOMIZATION" title={t.lockedTitle} body={t.lockedBody} image={{ en: 'm_couple_white', ta: 't_couple_seated' }} icon="book" />
      </div>
    )
  }
  return <Studio order={order} />
}

function Studio({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const saveAlbum = useStore(s => s.saveAlbum)
  const editable = albumEditable(order)
  const savedSpec = savedAlbum(order.album)
  const [spec, setSpec] = useState<AlbumSpec>(() => savedSpec ?? albumDefaults(order))
  const [view, setView] = useState<'cover' | 'inside'>('cover')
  const set = <K extends keyof AlbumSpec>(k: K, v: AlbumSpec[K]) => setSpec(s => ({ ...s, [k]: v }))

  const dirty = !savedSpec || JSON.stringify(savedSpec) !== JSON.stringify(spec)
  const included = includedSheets(order)
  const prices = usePrices()
  const extra = albumUpgradeCost(order.cart, spec.sheets, prices)
  const pkgName = cartTierName(order.cart)[lang]

  // Client's own picks first, padded with proofs so the preview is never empty.
  const photos = useMemo(() => albumPhotos(order, lang), [order, lang])

  const save = () => {
    saveAlbum(order.id, spec)
    toast(t.savedToast, 'ruby')
  }

  const color = colorOf(spec.color)
  const summary = [
    ALBUM.covers.find(c => c.key === spec.cover)?.name[lang],
    color.name[lang],
    ALBUM.sizes.find(s => s.key === spec.size)?.name,
    ALBUM.papers.find(p => p.key === spec.paper)?.name[lang],
    `${spec.sheets} ${t.s5}`,
  ].filter(Boolean)

  return (
    <div>
      <PageIntro eyebrow={t.eyebrow} title={t.title} lead={editable ? t.lead : undefined} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12">
        {/* Preview */}
        <div className="lg:sticky lg:top-[168px] lg:self-start">
          <Reveal>
            <Preview spec={spec} photos={photos} view={view} onView={setView} />
          </Reveal>
          <PackageAlbumNote className="mt-5" />
          <Reveal delay={0.05}>
            <Link to="/dashboard/album/view" className="group mt-5 flex items-center gap-4 rounded-3xl bg-ink p-4 text-white transition-colors hover:bg-ink-2 sm:p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ruby text-white shadow-ruby transition-transform duration-500 group-hover:scale-105">
                <Icon name="play" size={18} className="translate-x-px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{t.watch}</span>
                <span className="mt-0.5 block text-[13px] text-white/55">{t.watchNote}</span>
              </span>
              <Icon name="arrowRight" size={18} className="shrink-0 text-white/60 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
          {!editable && (
            <Reveal delay={0.05}>
              <div className="glass-ruby-tint mt-5 flex items-start gap-3 rounded-3xl p-5">
                <Icon name="lock" size={18} className="mt-0.5 shrink-0 text-ruby" />
                <div>
                  <p className="font-semibold">{t.productionTitle}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink/60">{t.productionBody}</p>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Options */}
        {editable ? (
          <div className="space-y-9 pb-8 sm:space-y-10">
            <Group n={1} title={t.s1}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALBUM.covers.map(c => (
                  <ChoiceCard key={c.key} active={spec.cover === c.key} onClick={() => set('cover', c.key)}>
                    <div className="flex items-center gap-3.5 p-4 pr-11 sm:gap-4 sm:pr-12">
                      <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-[5px] shadow-[0_6px_14px_-6px_rgba(10,10,11,0.45)]">
                        <Surface cover={c.key} hex={color.hex} photo={photos[0]} mini />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold leading-snug">{c.name[lang]}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink/50">{COVER_NOTES[c.key]?.[lang]}</span>
                      </span>
                    </div>
                  </ChoiceCard>
                ))}
              </div>
            </Group>

            <Group n={2} title={t.s2} note={spec.cover === 'acrylic' ? t.s2acrylic : undefined}>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label={t.s2}>
                {ALBUM.colors.map(c => {
                  const active = spec.color === c.key
                  return (
                    <button key={c.key} type="button" role="radio" aria-checked={active} onClick={() => set('color', c.key)} className="group flex min-w-0 flex-col items-center gap-2 cursor-pointer sm:w-[68px]">
                      <span className="relative flex h-14 w-14 items-center justify-center">
                        {active && <motion.span layoutId="album-swatch" className="absolute inset-0 rounded-full border-2 border-ruby" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                        <span
                          className="h-11 w-11 rounded-full transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `radial-gradient(circle at 35% 30%, ${shade(c.hex, 0.18)}, ${c.hex} 60%, ${shade(c.hex, -0.25)})`, boxShadow: 'inset 0 0 0 1px rgba(10,10,11,0.1), 0 4px 10px -4px rgba(10,10,11,0.35)' }}
                        />
                        {active && (
                          <Icon name="check" size={16} strokeWidth={2.6} className="absolute" style={{ color: c.ink }} />
                        )}
                      </span>
                      <span className={`max-w-full break-words text-center text-[12px] leading-tight ${active ? 'font-semibold text-ink' : 'text-ink/55'}`}>{c.name[lang]}</span>
                    </button>
                  )
                })}
              </div>
            </Group>

            <Group n={3} title={t.s3}>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {ALBUM.sizes.map(s => {
                  const g = SIZE_GEO[s.key]
                  return (
                    <ChoiceCard key={s.key} active={spec.size === s.key} onClick={() => set('size', s.key)}>
                      <div className="p-3.5 pr-9 sm:p-4 sm:pr-10">
                        <span className="flex h-10 items-end">
                          <span className="flex border border-ink/25 bg-white" style={{ width: g.ratio * 2 * 18 * g.hf, height: 18 * g.hf * 1.6 }}>
                            <span className="flex-1 border-r border-dashed border-ink/20" />
                            <span className="flex-1" />
                          </span>
                        </span>
                        <span className="mt-3 block font-mono text-[15px] font-semibold">{s.name}</span>
                        <span className="mt-0.5 block text-[12.5px] text-ink/50">{s.note[lang]}</span>
                      </div>
                    </ChoiceCard>
                  )
                })}
              </div>
            </Group>

            <Group n={4} title={t.s4}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALBUM.papers.map(p => (
                  <ChoiceCard key={p.key} active={spec.paper === p.key} onClick={() => set('paper', p.key)}>
                    <div className="flex items-center gap-3.5 p-4 pr-11 sm:gap-4 sm:pr-12">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-ink/10 bg-mist">
                        <PaperFinish paper={p.key} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold leading-snug">{p.name[lang]}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink/50">{p.note[lang]}</span>
                      </span>
                    </div>
                  </ChoiceCard>
                ))}
              </div>
            </Group>

            <Group n={5} title={t.s5} note={t.s5note}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label={t.s5}>
                {ALBUM.sheetOptions.map(n => {
                  const active = spec.sheets === n
                  const delta = albumUpgradeCost(order.cart, n, prices)
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set('sheets', n)}
                      className={`relative rounded-2xl border px-3 py-3.5 text-left transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                        active ? 'border-ruby bg-ruby-soft/70 ring-4 ring-ruby/10' : 'border-ink/10 bg-white/70 hover:border-ink/25'
                      }`}
                    >
                      <span className="block font-display text-[24px] font-semibold leading-none sm:text-[26px]">{n}</span>
                      <span className="mt-1 block text-[11.5px] text-ink/45">
                        {n * 2} {t.pages}
                      </span>
                      <span className={`mt-2 block text-[12px] font-semibold ${delta === 0 ? 'text-ink/60' : 'text-ruby'}`}>{delta === 0 ? t.included : `+${formatINR(delta)}`}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[12.5px] text-ink/50">
                {included > 0 ? `${pkgName} · ${included} ${t.inPkg}` : t.noneInPkg} · {t.payDiff}
              </p>
            </Group>

            <Group n={6} title={t.sLayout} note={t.sLayoutNote}>
              <div className="grid grid-cols-2 gap-3">
                {ALBUM.layouts.map(l => (
                  <ChoiceCard key={l.key} active={(spec.layout ?? 'classic') === l.key} onClick={() => set('layout', l.key)}>
                    <div className="p-3 pr-10 sm:p-4 sm:pr-11">
                      <span className="relative block aspect-[2/1] overflow-hidden rounded-md bg-ink/[0.05]">
                        <span className="absolute inset-y-0 left-1/2 w-px bg-ink/10" />
                        {l.cells.map(([x, y, w, h], n) => (
                          <span key={n} className="absolute overflow-hidden rounded-[2px] bg-cover bg-center" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, backgroundImage: photos[n] ? `url(${photoUrl(photos[n], 240)})` : undefined }} />
                        ))}
                      </span>
                      <span className="mt-2 block text-[12.5px] font-medium leading-snug text-ink/70">{l.name[lang]}</span>
                      {l.sample && <span className="mt-1 inline-block rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11.5px] font-semibold text-ink/50 md:text-[10.5px]">{t.sample}</span>}
                    </div>
                  </ChoiceCard>
                ))}
              </div>
            </Group>

            <Group n={7} title={t.s6}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALBUM.fonts.map(f => (
                  <ChoiceCard key={f.key} active={spec.font === f.key} onClick={() => set('font', f.key)}>
                    <div className="p-4 pr-11 sm:p-5 sm:pr-12">
                      <span className="block truncate text-[24px] sm:text-[26px] leading-tight text-ink" style={{ fontFamily: f.family, fontStyle: f.italic ? 'italic' : 'normal' }}>
                        {spec.title.split(/\s*&\s*/)[0] || 'Aa'} {f.key.startsWith('tamil') ? 'அ' : '&'}
                      </span>
                      <span className="mt-2 block text-[12.5px] font-medium text-ink/55">{f.name[lang]}</span>
                    </div>
                  </ChoiceCard>
                ))}
              </div>
            </Group>

            <Group n={8} title={t.s7}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.titleLabel} value={spec.title} onChange={v => set('title', v)} maxLength={40} name="album-title" />
                <Field label={t.subtitleLabel} value={spec.subtitle} onChange={v => set('subtitle', v)} maxLength={48} hint={t.subtitleHint} name="album-subtitle" />
              </div>
            </Group>
          </div>
        ) : (
          <Reveal>
            <Card className="relative p-5 sm:p-6 md:p-8">
              <TamilCorners />
              <p className="t-label text-ink/50">{t.spec}</p>
              <dl className="mt-5 divide-y divide-ink/[0.06]">
                {[
                  [t.s1, ALBUM.covers.find(c => c.key === spec.cover)?.name[lang]],
                  [t.s2, color.name[lang]],
                  [t.s3, ALBUM.sizes.find(s => s.key === spec.size)?.name],
                  [t.s4, ALBUM.papers.find(p => p.key === spec.paper)?.name[lang]],
                  [t.s5, `${spec.sheets} · ${spec.sheets * 2} ${t.pages}`],
                  [t.sLayout, ALBUM.layouts.find(l => l.key === (spec.layout ?? 'classic'))?.name[lang]],
                  [t.s6, fontOf(spec.font).name[lang]],
                  [t.titleLabel, spec.title || '—'],
                  [t.subtitleLabel, spec.subtitle || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3 text-[14px]">
                    <dt className="shrink-0 text-ink/55">{k}</dt>
                    <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {order.album && (
                <p className="mt-4 text-[12.5px] text-ink/45">
                  {t.lastSaved} {formatDateTime(order.album.submittedAt, lang)}
                </p>
              )}
            </Card>
          </Reveal>
        )}
      </div>

      {editable && (
        <FloatingBar>
          <div className="glass-dark pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 sm:py-2 sm:pl-5 sm:pr-2 md:gap-5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] text-white/70 sm:text-[13px]">{summary.join(' · ')}</p>
              <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[12.5px]">
                <span className="hidden shrink-0 text-white/45 sm:inline">{t.upgrade}:</span>
                <span className={`truncate font-semibold tabular-nums ${extra > 0 ? 'text-ruby-bright' : 'text-white'}`}>{extra > 0 ? `+${formatINR(extra)}` : t.noExtra}</span>
                {order.album && dirty && <span className="hidden text-white/40 sm:inline">· {t.unsaved}</span>}
              </p>
            </div>
            <Button onClick={save} disabled={!dirty} icon={dirty ? 'arrowRight' : undefined} iconLeft={dirty ? undefined : 'check'} className="shrink-0 !px-4 sm:!px-5">
              {dirty ? t.save : t.saved}
            </Button>
          </div>
        </FloatingBar>
      )}
    </div>
  )
}

function Group({ n, title, note, children }: { n: number; title: string; note?: string; children: ReactNode }) {
  return (
    <Reveal y={20}>
      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-mono text-[12px] font-semibold text-ruby">{String(n).padStart(2, '0')}</span>
          <h3 className="text-[18px] font-semibold tracking-tight">{title}</h3>
        </div>
        {note && <p className="-mt-2 mb-4 text-[13px] text-ink/50">{note}</p>}
        {children}
      </section>
    </Reveal>
  )
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function Preview({ spec, photos, view, onView }: { spec: AlbumSpec; photos: ImgKey[]; view: 'cover' | 'inside'; onView: (v: 'cover' | 'inside') => void }) {
  const t = useT(copy)
  const lang = useLang()
  const [ref, width] = useWidth<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className="relative isolate overflow-hidden rounded-[28px] border hairline sm:rounded-[32px]"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #ffffff 0%, #f4f4f5 55%, #e9e9eb 100%)' }}
    >
      {lang === 'ta' && (
        <div
          className="kolam-bg pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
          style={{ maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)' }}
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 sm:p-4">
        <Segmented<'cover' | 'inside'>
          size="sm"
          value={view}
          onChange={onView}
          options={[
            { value: 'cover', label: t.cover },
            { value: 'inside', label: t.inside },
          ]}
          className="glass !bg-white/60"
        />
        {view === 'cover' && (
          <span className="hidden items-center gap-1.5 text-[11.5px] text-ink/40 sm:inline-flex">
            <Icon name="sparkle" size={12} />
            {t.tilt}
          </span>
        )}
      </div>

      <div className="relative h-[340px] min-[400px]:h-[380px] sm:h-[460px] lg:h-[520px]">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'cover' ? (
            <motion.div key="cover" className="absolute inset-0" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: EASE }}>
              <CoverStage spec={spec} photo={photos[0]} width={width} />
            </motion.div>
          ) : (
            <motion.div key="inside" className="absolute inset-0" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: EASE }}>
              <SpreadStage spec={spec} photos={photos} width={width} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function CoverStage({ spec, photo, width }: { spec: AlbumSpec; photo?: ImgKey; width: number }) {
  const stage = useRef<HTMLDivElement>(null)
  const rxRaw = useMotionValue(-12)
  const ryRaw = useMotionValue(26)
  const rx = useSpring(rxRaw, { stiffness: 90, damping: 18 })
  const ry = useSpring(ryRaw, { stiffness: 90, damping: 18 })

  const geo = SIZE_GEO[spec.size] ?? SIZE_GEO['12x30']
  const H = 290 * geo.hf
  const W = H * geo.ratio
  const T = 14 + spec.sheets * 0.55
  const scale = width ? Math.min(1, (width - 80) / (W + T + 60), 1) : 0.8

  const onMove = (e: PointerEvent) => {
    const r = stage.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ryRaw.set(26 + px * 34)
    rxRaw.set(-12 - py * 16)
    stage.current?.style.setProperty('--mx', `${50 + px * 70}%`)
    stage.current?.style.setProperty('--my', `${40 + py * 60}%`)
  }
  const onLeave = () => {
    ryRaw.set(26)
    rxRaw.set(-12)
  }

  return (
    <div ref={stage} onPointerMove={onMove} onPointerLeave={onLeave} className="absolute inset-0 flex items-center justify-center pt-8">
      {/* floor shadow */}
      <div className="pointer-events-none absolute left-1/2 top-[calc(50%+16px)] -translate-x-1/2" style={{ width: W * scale * 1.1, height: 60 * scale, transform: `translate(-50%, ${(H * scale) / 2 - 10}px)`, background: 'radial-gradient(ellipse at center, rgba(10,10,11,0.32), transparent 70%)', filter: 'blur(6px)' }} />
      <div style={{ transform: `scale(${scale})` }}>
        <div className="animate-float" style={{ perspective: 1600 }}>
          <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
            <Book spec={spec} photo={photo} W={W} H={H} T={T} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function Book({ spec, photo, W, H, T }: { spec: AlbumSpec; photo?: ImgKey; W: number; H: number; T: number }) {
  const color = colorOf(spec.color)
  const font = fontOf(spec.font)
  const light = isLight(color.hex)
  const acrylic = spec.cover === 'acrylic'
  const ink = acrylic ? '#ffffff' : color.ink
  const edge = shade(color.hex, light ? -0.12 : -0.3)
  const pageEdge = `repeating-linear-gradient(90deg, #ffffff 0 ${Math.max(1, T / spec.sheets - 0.4)}px, #dcdcdf ${Math.max(1, T / spec.sheets - 0.4)}px ${Math.max(1.4, T / spec.sheets)}px)`
  const pageEdgeH = pageEdge.replace('90deg', '0deg')
  const surfaceCover = spec.cover === 'acrylic' ? 'leather' : spec.cover

  const face: CSSProperties = { position: 'absolute', backfaceVisibility: 'hidden' }
  const titleStyle: CSSProperties = {
    fontFamily: font.family,
    fontStyle: font.italic ? 'italic' : 'normal',
    color: ink,
    textShadow: light && !acrylic ? '0 1px 0 rgba(255,255,255,0.7), 0 -1px 0 rgba(0,0,0,0.08)' : '0 1px 1px rgba(0,0,0,0.45), 0 -0.5px 0 rgba(255,255,255,0.15)',
  }

  return (
    <div style={{ width: W, height: H, position: 'relative', transformStyle: 'preserve-3d' }}>
      {/* front cover */}
      <div style={{ ...face, inset: 0, transform: `translateZ(${T / 2}px)`, borderRadius: '3px 7px 7px 3px', overflow: 'hidden', boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.25)' }}>
        <Surface cover={spec.cover} hex={color.hex} photo={photo}>
          <div className={`absolute inset-0 flex flex-col items-center px-[10%] text-center ${acrylic ? 'justify-end pb-[11%]' : 'justify-center'}`}>
            <motion.p key={spec.font + spec.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="max-w-full break-words leading-[1.1]" style={{ ...titleStyle, fontSize: Math.max(18, W * 0.085) }}>
              {spec.title || '—'}
            </motion.p>
            {spec.subtitle && (
              <p className="mt-3 max-w-full break-words" style={{ ...titleStyle, fontStyle: 'normal', fontFamily: font.key === 'modern' ? font.family : undefined, fontSize: Math.max(9, W * 0.03), letterSpacing: '0.22em', opacity: 0.85 }}>
                {spec.subtitle}
              </p>
            )}
            {!acrylic && spec.cover !== 'silk' && <span className="mt-4 h-px w-10" style={{ background: ink, opacity: 0.4 }} />}
          </div>
        </Surface>
        {/* spine hinge shading */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-5" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.06) 40%, transparent)' }} />
      </div>

      {/* back cover */}
      <div style={{ ...face, inset: 0, transform: `rotateY(180deg) translateZ(${T / 2}px)`, borderRadius: '7px 3px 3px 7px', background: edge }} />

      {/* spine */}
      <div style={{ ...face, top: 0, width: T, height: H, left: (W - T) / 2, transform: `rotateY(-90deg) translateZ(${W / 2}px)`, borderRadius: 3, overflow: 'hidden' }}>
        <Surface cover={surfaceCover} hex={color.hex} mini />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3))' }} />
        <span className="absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal', color: acrylic ? color.ink : ink, fontSize: Math.min(13, T * 0.42), opacity: 0.85 }}>
          {spec.title}
        </span>
      </div>

      {/* page block — fore-edge */}
      <div style={{ ...face, top: 5, width: T - 6, height: H - 10, left: (W - (T - 6)) / 2, transform: `rotateY(90deg) translateZ(${W / 2 - 5}px)`, background: pageEdge, boxShadow: 'inset 0 0 4px rgba(0,0,0,0.15)' }} />
      {/* top & bottom edges */}
      <div style={{ ...face, left: 3, width: W - 8, height: T - 6, top: (H - (T - 6)) / 2, transform: `rotateX(90deg) translateZ(${H / 2 - 5}px)`, background: pageEdgeH }} />
      <div style={{ ...face, left: 3, width: W - 8, height: T - 6, top: (H - (T - 6)) / 2, transform: `rotateX(-90deg) translateZ(${H / 2 - 5}px)`, background: pageEdgeH }} />
    </div>
  )
}

function PaperFinish({ paper, animate = true }: { paper: string; animate?: boolean }) {
  const layer = 'pointer-events-none absolute inset-0'
  if (paper === 'matte') return <div className={layer} style={{ backgroundImage: GRAIN, backgroundSize: '140px', opacity: 0.1, mixBlendMode: 'multiply' }} />
  if (paper === 'lustre')
    return (
      <>
        <div className={layer} style={{ backgroundImage: GRAIN, backgroundSize: '90px', opacity: 0.06, mixBlendMode: 'multiply' }} />
        <div className={layer} style={{ background: 'linear-gradient(125deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)' }} />
      </>
    )
  if (paper === 'metallic')
    return (
      <motion.div
        className={layer}
        style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,236,241,0.5) 38%, rgba(255,255,255,0.55) 50%, rgba(252,236,239,0.4) 62%, rgba(255,255,255,0) 80%)', backgroundSize: '220% 100%', mixBlendMode: 'screen' }}
        animate={animate ? { backgroundPosition: ['0% 0%', '100% 0%'] } : undefined}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />
    )
  return <div className={layer} style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 22%, transparent 34%, transparent 70%, rgba(255,255,255,0.18) 100%)' }} />
}

function SpreadStage({ spec, photos, width }: { spec: AlbumSpec; photos: ImgKey[]; width: number }) {
  const t = useT(copy)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const spreads = Math.max(1, Math.min(6, Math.floor(photos.length / 3)))
  const geo = SIZE_GEO[spec.size] ?? SIZE_GEO['12x30']
  const H = 300 * geo.hf
  const W = H * geo.ratio
  const scale = width ? Math.min(1, (width - 48) / (W * 2), 360 / H) : 0.5
  const idx = Math.min(i, spreads - 1)
  const p = (k: number) => photos[(idx * 3 + k) % photos.length]
  const font = fontOf(spec.font)
  const fontStyle: CSSProperties = { fontFamily: font.family, fontStyle: font.italic ? 'italic' : 'normal' }
  const go = (d: number) => {
    setDir(d)
    setI(v => (Math.min(v, spreads - 1) + d + spreads) % spreads)
  }
  const matte = spec.paper === 'matte'

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
      <div style={{ width: W * 2 * scale, height: H * scale }}>
        <div style={{ width: W * 2, height: H, transform: `scale(${scale})`, transformOrigin: 'top left', perspective: 2000 }}>
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              className="relative flex h-full w-full shadow-[0_30px_60px_-24px_rgba(10,10,11,0.45)]"
              style={{ transformStyle: 'preserve-3d' }}
              variants={{
                enter: (d: number) => ({ opacity: 0, rotateY: d * -14, x: d * 40 }),
                center: { opacity: 1, rotateY: 0, x: 0 },
                exit: (d: number) => ({ opacity: 0, rotateY: d * 14, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
            >
              {/* left page — full bleed */}
              <div className="relative h-full w-1/2 overflow-hidden rounded-l-[4px] bg-white">
                <img src={photoUrl(p(0), 800)} alt="" draggable={false} className="h-full w-full object-cover" style={{ filter: matte ? 'contrast(0.94) saturate(0.92)' : spec.paper === 'metallic' ? 'contrast(1.06) saturate(1.1)' : undefined }} />
                <PaperFinish paper={spec.paper} />
              </div>
              {/* right page — two frames and a caption */}
              <div className="relative h-full w-1/2 overflow-hidden rounded-r-[4px] bg-white p-[7%]">
                <div className="grid h-full grid-rows-[1.35fr_1fr] gap-[5%]">
                  <div className="overflow-hidden">
                    <img src={photoUrl(p(1), 700)} alt="" draggable={false} className="h-full w-full object-cover" style={{ filter: matte ? 'contrast(0.94) saturate(0.92)' : undefined }} />
                  </div>
                  <div className="grid grid-cols-2 gap-[5%]">
                    <div className="overflow-hidden">
                      <img src={photoUrl(p(2), 500)} alt="" draggable={false} className="h-full w-full object-cover" style={{ filter: matte ? 'contrast(0.94) saturate(0.92)' : undefined }} />
                    </div>
                    <div className="flex flex-col justify-end text-ink">
                      {idx === 0 ? (
                        <>
                          <p className="leading-tight" style={{ ...fontStyle, fontSize: W * 0.06 }}>
                            {spec.title}
                          </p>
                          <p className="mt-2 text-ink/50" style={{ fontSize: W * 0.026, letterSpacing: '0.16em' }}>
                            {spec.subtitle}
                          </p>
                        </>
                      ) : (
                        <p className="text-ink/40" style={{ ...fontStyle, fontSize: W * 0.05 }}>
                          — {String(idx * 2 + 1).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <PaperFinish paper={spec.paper} />
              </div>
              {/* gutter */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-24 -translate-x-1/2" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.16) 46%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.12) 54%, transparent)' }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} aria-label={t.prevSpread} className="glass flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white cursor-pointer md:h-10 md:w-10">
          <Icon name="chevronLeft" size={18} />
        </button>
        <span className="min-w-[88px] text-center text-[12.5px] tabular-nums text-ink/55">
          {t.spread} {idx + 1} / {spreads}
        </span>
        <button type="button" onClick={() => go(1)} aria-label={t.nextSpread} className="glass flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white cursor-pointer md:h-10 md:w-10">
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  )
}

