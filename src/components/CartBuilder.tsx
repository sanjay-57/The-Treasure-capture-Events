import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from './Icon'
import { AnimatedINR, Reveal, Stagger, StaggerItem, Sweep, EASE } from './motion'
import { flyToCart, pourIntoCart, Pluck } from './CartFlight'
import { Button, Chip, Img, Modal } from './ui'
import { Surface, isLight } from './AlbumSurface'
import { formatINR, useLang, useT, type Bi } from '../lib/i18n'
import { usePrices } from '../lib/store'
import { ITEM_PHOTO } from '../lib/images'
import { ALBUM_LINES, ALBUM_PHOTO_GUIDE, defaultAlbumChoice, type AlbumLine } from '../lib/data'
import {
  ALBUM_SHEETS, ALBUM_SHEET_TIERS, ALBUM_TIERS, BUNDLES, CATALOGUE, MAX_HOURS, MIN_HOURS, addable, albumDelta, albumIn, bundleItems, bundlePrice, cartHours, cartPackageItems, cartSpec,
  coverageFor, droneMultiplier, hasOutdoor, hoursMultiplier, presetName, presetSaving, setCartHours, setCartQty,
  type AlbumChoice, type BundleGroup, type Cart, type CatalogueId, type CatalogueItem, type PriceMap, type TierSpec,
} from '../lib/catalogue'

/*
 * The cart configurator: one scrolling list of options in the order the
 * studio talks a family through them — hours, traditional crew, candid photo
 * styles, candid video styles, add-ons, album, frames and prints, special
 * shoots, then what is included. Used by the booking flow (bound to the
 * draft) and by the admin billing screen (bound to an order re-quote).
 *
 * Any change that would end the cart's package (a main item removed, the
 * package album swapped) asks first, then switches the cart to custom.
 */

const copy = {
  hours: { en: 'Hours of coverage', ta: 'படப்பிடிப்பு நேரம்' },
  hoursNote: { en: 'From the first ritual to the last photo. A session is 4 hours; extra hours are charged as part of a session.', ta: 'முதல் சடங்கு முதல் கடைசிப் படம் வரை. ஒரு அமர்வு 4 மணி நேரம்; கூடுதல் மணி நேரம் அமர்வின் பகுதியாகக் கணக்கிடப்படும்.' },
  hoursUnit: { en: 'h', ta: 'மணி' },
  portraitHourNote: { en: 'The portrait hour before the event is its own item, so it is not counted here.', ta: 'விழாவுக்கு முந்தைய படப்பிடிப்பு நேரம் தனிப் பொருள், அதனால் இங்கே சேர்க்கப்படவில்லை.' },
  trad: { en: 'Traditional photo & video', ta: 'பாரம்பரிய படம் & வீடியோ' },
  tradNote: { en: 'How many of each you would like on the day. Soft copies of every photo are always included.', ta: 'அன்று ஒவ்வொன்றிலும் எத்தனை பேர் வேண்டும். அனைத்துப் படங்களின் சாஃப்ட் காப்பி எப்போதும் அடங்கும்.' },
  candidPhoto: { en: 'Candid photography styles', ta: 'கேண்டிட் புகைப்படப் பாணிகள்' },
  candidVideo: { en: 'Candid video styles', ta: 'கேண்டிட் வீடியோ பாணிகள்' },
  bundleSaving: { en: 'Bundle saving', ta: 'தொகுப்புச் சேமிப்பு' },
  crewSubtotal: { en: 'Crew subtotal', ta: 'குழு கூட்டுத்தொகை' },
  perSession: { en: 'per 4 h session', ta: 'ஒரு 4 மணி அமர்வுக்கு' },
  perShoot: { en: 'per shoot', ta: 'ஒரு படப்பிடிப்புக்கு' },
  each: { en: 'each', ta: 'ஒன்றுக்கு' },
  addons: { en: 'Add-ons for the day', ta: 'விழா நாள் கூடுதல்கள்' },
  addonsNote: { en: 'Optional. Toggle any on or off.', ta: 'விருப்பத்திற்கு ஏற்ப. இயக்கலாம் அல்லது நிறுத்தலாம்.' },
  askUs: { en: 'Ask us', ta: 'எங்களைக் கேளுங்கள்' },
  needsOutdoor: { en: 'Add an outdoor shoot first', ta: 'முதலில் வெளிப்புறப் படப்பிடிப்பைச் சேர்க்கவும்' },
  album: { en: 'Album', ta: 'ஆல்பம்' },
  albumNote: { en: 'Pick a line, then its size, sheets, colour and box. Moving up from your package album costs only the difference.', ta: 'ஒரு வகையைத் தேர்ந்து, அளவு, தாள், நிறம், பெட்டியைத் தேர்ந்தெடுங்கள். தொகுப்பு ஆல்பத்திலிருந்து பெரியதற்கு மாறினால் வித்தியாசம் மட்டும்.' },
  softOnly: { en: 'Soft copies only', ta: 'சாஃப்ட் காப்பி மட்டும்' },
  softOnlyNote: { en: 'No printed album', ta: 'அச்சிட்ட ஆல்பம் இல்லை' },
  packageAlbum: { en: 'Package album', ta: 'தொகுப்பு ஆல்பம்' },
  heirloom: { en: '10×28 heirloom', ta: '10×28 சிறப்பு ஆல்பம்' },
  heirloomNote: { en: 'Wooden box, personalised cover', ta: 'மரப் பெட்டி, உங்கள் பெயருடன் அட்டை' },
  selected: { en: 'Selected', ta: 'தேர்வு' },
  samePrice: { en: 'Same price', ta: 'அதே விலை' },
  toConfirm: { en: 'Details to confirm', ta: 'விவரம் உறுதி செய்ய' },
  size: { en: 'Size', ta: 'அளவு' },
  orientation: { en: 'Orientation', ta: 'திசை' },
  landscape: { en: 'Landscape', ta: 'கிடைமட்டம்' },
  portrait: { en: 'Portrait', ta: 'நெடுக்கு' },
  sheets: { en: 'sheets', ta: 'தாள்' },
  sheetsTitle: { en: 'Sheets', ta: 'தாள்கள்' },
  colour: { en: 'Colour', ta: 'நிறம்' },
  coloursPending: { en: 'Colours arrive with the catalogue.', ta: 'நிறங்கள் பட்டியல் வந்ததும் சேர்க்கப்படும்.' },
  sizesPending: { en: 'Sizes arrive with the catalogue.', ta: 'அளவுகள் பட்டியல் வந்ததும் சேர்க்கப்படும்.' },
  box: { en: 'Wooden box', ta: 'மரப் பெட்டி' },
  boxIncluded: { en: 'Matching box included', ta: 'பொருந்தும் பெட்டி அடங்கும்' },
  frames: { en: 'Frames & prints', ta: 'பிரேம்கள் & அச்சுகள்' },
  framesNote: { en: 'Any quantity.', ta: 'எத்தனை வேண்டுமானாலும்.' },
  special: { en: 'Special shoots', ta: 'சிறப்புப் படப்பிடிப்புகள்' },
  specialNote: { en: 'Separate sessions before or after the event.', ta: 'நிகழ்வுக்கு முன்னோ பின்னோ தனி அமர்வுகள்.' },
  included: { en: 'Included with your booking', ta: 'உங்கள் பதிவில் அடங்கியவை' },
  free: { en: 'Included', ta: 'அடங்கும்' },
  pending: { en: 'Price to be confirmed', ta: 'விலை உறுதி செய்யப்பட வேண்டும்' },
  less: { en: 'Fewer', ta: 'குறை' },
  more: { en: 'More', ta: 'கூட்டு' },
  endsTitle: { en: 'End the package?', ta: 'தொகுப்பை முடிக்கவா?' },
  keep: { en: 'Keep the package', ta: 'தொகுப்பை வைத்திரு' },
  goOn: { en: 'Continue', ta: 'தொடர்க' },
}

const by = (section: CatalogueItem['section'], pred: (i: CatalogueItem) => boolean = () => true) => CATALOGUE.filter(i => i.section === section && pred(i))
const TRAD = by('crew', i => !i.bundle)
const CREW = by('crew')
const ADDONS = by('addon')
const PRINTS = by('deliverable', i => !i.group && i.unit !== 'included' && i.id !== 'wooden_box')
const INCLUDED = by('deliverable', i => i.unit === 'included')
const SPECIAL = by('special', i => i.unit !== 'month')
const STD_ALBUMS = new Set<CatalogueId>(ALBUM_TIERS.map(t => t.id))
const is1028 = (id?: CatalogueId) => !!id && id.startsWith('album_1028_') && id !== 'album_1028_pkg_25'

/** Cover material the preview draws for each line. */
const LINE_COVER: Record<AlbumLine['key'], string> = { pixel_passage: 'leather', aura: 'leather', acroluxe: 'linen', allura: 'velvet' }
/** Lines that ship with their own box; the others offer the wooden box for 12×36 and 12×15. */
const BOX_INCLUDED = new Set<AlbumLine['key']>(['pixel_passage', 'aura'])
const BOX_SIZES = ['12×36', '12×15']

const lineOf = (key: AlbumLine['key']) => ALBUM_LINES.find(l => l.key === key) ?? ALBUM_LINES[0]

const defaultChoice = defaultAlbumChoice

/** "Candid · couple portraits" → "couple portraits" for the chips. */
const shortName = (name: Bi): Bi => ({ en: name.en.split(' · ')[1] ?? name.en, ta: name.ta.split(' · ')[1] ?? name.ta })

/** Signed difference for upgrade cards: "+₹5,000", "−₹1,500". */
const signed = (n: number) => (n > 0 ? `+${formatINR(n)}` : formatINR(n))

export function CartBuilder({ cart, spec, onChange }: { cart: Cart; spec?: TierSpec; onChange: (cart: Cart) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const prices = usePrices()
  const [confirm, setConfirm] = useState<{ next: Cart; item: CatalogueItem; removing: boolean } | null>(null)

  const pspec = cartSpec(cart, spec)
  const pkgItems = cartPackageItems(cart, spec)
  const pkgName = cart.tier === 'custom' ? undefined : presetName(pspec, cart.tier)
  const qty = (id: CatalogueId) => cart.items[id] ?? 0
  const inPkg = (id: CatalogueId) => (pkgItems[id] ?? 0) > 0

  /** Sets a quantity, asking first when the change would end the package. */
  const apply = (id: CatalogueId, n: number, album?: AlbumChoice | null) => {
    let next = setCartQty(cart, id, n)
    if (next === cart) return
    if (album !== undefined) next = { ...next, album: album ?? undefined }
    const item = CATALOGUE.find(i => i.id === id)!
    if (cart.tier !== 'custom' && next.tier === 'custom') setConfirm({ next, item, removing: n === 0 })
    else onChange(next)
  }

  const hours = cartHours(cart)
  const mult = hoursMultiplier(hours)
  // Same maths as the engine: per-session items × the hours multiplier, bundles saved before the multiplier.
  const crewLine = (i: CatalogueItem) => (i.unit === 'session' ? Math.round(prices[i.id] * qty(i.id) * (i.noMini ? droneMultiplier(hours) : mult)) : prices[i.id] * qty(i.id))
  const bundleSaving = (g: BundleGroup) => {
    const ids = bundleItems(g).filter(i => qty(i.id) > 0).map(i => i.id)
    return ids.length < 2 ? 0 : Math.round(bundlePrice(g, ids, prices).saving * mult)
  }
  // What one more of an item adds, as the quote counts it, for the phone chip.
  const unitAmount = (id: CatalogueId) => {
    const i = CATALOGUE.find(c => c.id === id)
    if (!i || i.onRequest) return 0
    return i.unit === 'session' ? Math.round(prices[id] * (i.noMini ? droneMultiplier(hours) : mult)) : prices[id]
  }
  useCartFlights(cart, id => CATALOGUE.find(c => c.id === id)?.name[lang] ?? '', unitAmount, cart.tier === 'custom' ? undefined : presetName(cartSpec(cart, spec), cart.tier)?.[lang])
  const crewSubtotal = CREW.reduce((s, i) => s + crewLine(i), 0) - bundleSaving('candid_photo') - bundleSaving('candid_video')

  // Customers toggle what they may add on their own; package items stay visible so a removed one can come back.
  const shown = (i: CatalogueItem) => addable(i) || qty(i.id) > 0 || inPkg(i.id)
  const included = INCLUDED.filter(i => qty(i.id) > 0)
  // Special-shoot events lead with their own shoot; other events offer the shoots as extras.
  const specials = (spec?.shootItem ? [...SPECIAL.filter(i => i.id === spec.shootItem), ...SPECIAL.filter(i => i.id !== spec.shootItem)] : SPECIAL).filter(shown)
  const outdoor = hasOutdoor(cart.items)

  const card = (item: CatalogueItem, opts: { note?: string; disabled?: boolean } = {}) => (
    <OptionCard
      key={item.id}
      item={item}
      n={qty(item.id)}
      price={prices[item.id]}
      pkgName={inPkg(item.id) ? pkgName : undefined}
      note={opts.note}
      disabled={opts.disabled}
      onChange={v => apply(item.id, v)}
    />
  )

  const saving = cart.tier === 'custom' ? 0 : -presetSaving(pspec, cart.tier, prices, cart.variant)
  const endsMsg: Bi | null = confirm && pkgName
    ? {
        en: `${confirm.removing ? 'Removing' : 'Switching to'} ${confirm.item.name.en} ends the ${pkgName.en} package${saving > 0 ? ` and its ${formatINR(saving)} saving` : ''}. Continue?`,
        ta: `${confirm.item.name.ta} ${confirm.removing ? 'நீக்கினால்' : 'என மாற்றினால்'} ${pkgName.ta} தொகுப்பு${saving > 0 ? `ம் அதன் ${formatINR(saving)} சேமிப்பும்` : ''} முடிவடையும். தொடரலாமா?`,
      }
    : null

  return (
    <div className="space-y-8">
      {/* Coverage hours */}
      <Reveal>
        <section className="rounded-[28px] border hairline bg-white/70 p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-display text-[1.15rem] font-semibold text-ink">{t.hours}</h3>
              <p className="mt-1 max-w-md text-[13px] leading-snug text-ink/55">{t.hoursNote}</p>
            </div>
            <Stepper value={hours} min={MIN_HOURS} max={MAX_HOURS} onChange={h => onChange(setCartHours(cart, h))} label={t.hours} big unit={t.hoursUnit} />
          </div>
          <p className="mt-4 rounded-2xl bg-ruby-soft/60 px-4 py-3 text-[13.5px] font-medium leading-snug text-ruby-deep">{coverageFor(hours).label[lang]}</p>
          {inPkg('portrait_hour') && <p className="mt-2 text-[12px] leading-snug text-ink/50">{t.portraitHourNote}</p>}
        </section>
      </Reveal>

      {/* Traditional crew */}
      <section>
        <SectionHead title={t.trad} note={t.tradNote} />
        <Stagger className="grid gap-3" gap={0.05}>{TRAD.filter(shown).map(i => <StaggerItem key={i.id} y={14}>{card(i)}</StaggerItem>)}</Stagger>
      </section>

      {/* Candid styles */}
      <CandidGroup group="candid_photo" title={t.candidPhoto} cart={cart} prices={prices} mult={mult} saving={bundleSaving('candid_photo')} pkgName={pkgName} inPkg={inPkg} onToggle={(id, on) => apply(id, on ? 1 : 0)} />
      <CandidGroup group="candid_video" title={t.candidVideo} cart={cart} prices={prices} mult={mult} saving={bundleSaving('candid_video')} pkgName={pkgName} inPkg={inPkg} onToggle={(id, on) => apply(id, on ? 1 : 0)} />

      <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-ink px-4 py-3.5 text-white">
        <Sweep trigger={crewSubtotal} tone="rgba(255,255,255,0.16)" />
        <span className="min-w-0 text-[13px] font-medium text-white/70">
          {t.crewSubtotal} · × {mult.toFixed(2)} ({hours} {t.hoursUnit})
        </span>
        <AnimatedINR value={crewSubtotal} flash={false} live={false} className="shrink-0 font-display text-[1.4rem] font-semibold" />
      </div>

      {/* Add-ons */}
      <section>
        <SectionHead title={t.addons} note={t.addonsNote} />
        <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.05}>
          {ADDONS.filter(i => shown(i) || i.onRequest).map(i => <StaggerItem key={i.id} y={14}>{card(i, i.requiresOutdoor && !outdoor ? { note: t.needsOutdoor, disabled: qty(i.id) === 0 } : {})}</StaggerItem>)}
        </Stagger>
      </section>

      {/* Album */}
      <section>
        <SectionHead title={t.album} note={t.albumNote} />
        <AlbumPicker cart={cart} prices={prices} pkgItems={pkgItems} pkgName={pkgName} apply={apply} onSpec={album => onChange({ ...cart, album })} />
      </section>

      {/* Frames & prints */}
      <section>
        <SectionHead title={t.frames} note={t.framesNote} />
        <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.05}>{PRINTS.filter(shown).map(i => <StaggerItem key={i.id} y={14}>{card(i)}</StaggerItem>)}</Stagger>
      </section>

      {/* Special shoots */}
      {specials.length > 0 && (
        <section>
          <SectionHead title={t.special} note={t.specialNote} />
          <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.05}>{specials.map(i => <StaggerItem key={i.id} y={14}>{card(i)}</StaggerItem>)}</Stagger>
        </section>
      )}

      {/* Included */}
      <AnimatePresence initial={false}>
        {included.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="rounded-[26px] bg-ruby-soft/60 p-5 sm:p-6">
            <p className="t-label text-ruby">{t.included}</p>
            <Stagger className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2" gap={0.05}>
              {included.map(item => (
                <StaggerItem key={item.id} y={10} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink/80">
                  <motion.span className="mt-0.5 shrink-0 text-ruby" initial={{ rotate: -90, scale: 0 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.15 }}>
                    <Icon name="check" size={15} strokeWidth={2.4} />
                  </motion.span>
                  <span>
                    {item.name[lang]}
                    {item.note && <span className="block text-[12px] text-ink/50">{item.note[lang]}</span>}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </motion.section>
        )}
      </AnimatePresence>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} label={t.endsTitle}>
        <div className="p-6 pt-9 sm:p-7">
          <p className="t-3 text-ink">{t.endsTitle}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink/70">{endsMsg?.[lang]}</p>
          {/* Stacked, thumb-sized actions on phones; the safe choice sits nearest the thumb */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={() => setConfirm(null)} className="w-full sm:w-auto">{t.keep}</Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (confirm) onChange(confirm.next)
                setConfirm(null)
              }}
            >
              {t.goOn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/**
 * Watches the cart and sends each change flying: one option lifts off its card,
 * a package pours several in, a removal flies back out. Works for taps, package
 * picks and the voice assistant alike, since all of them land in the cart.
 */
function useCartFlights(cart: Cart, labelOf: (id: CatalogueId) => string, amountOf: (id: CatalogueId) => number, pkgLabel?: string) {
  const prev = useRef(cart.items)
  const fns = useRef({ labelOf, amountOf, pkgLabel })
  fns.current = { labelOf, amountOf, pkgLabel }
  useEffect(() => {
    const { labelOf, amountOf, pkgLabel } = fns.current
    const was = prev.current
    prev.current = cart.items
    if (was === cart.items) return
    const ids = new Set([...Object.keys(was), ...Object.keys(cart.items)]) as Set<CatalogueId>
    const added: CatalogueId[] = []
    const removed: CatalogueId[] = []
    ids.forEach(id => {
      const a = was[id] ?? 0
      const b = cart.items[id] ?? 0
      const item = CATALOGUE.find(i => i.id === id)
      // Bundled freebies (soft copies, prints included) ride along silently.
      if (!item || item.unit === 'included') return
      if (b > a) added.push(id)
      else if (b < a) removed.push(id)
    })
    if (import.meta.env.DEV && (added.length || removed.length)) console.info('[cart-flight] cart changed', { added, removed })
    const icon = (id: CatalogueId) => CATALOGUE.find(c => c.id === id)?.icon
    if (added.length > 2) pourIntoCart(added, 6, pkgLabel ?? `${added.length} ×`)
    else added.forEach((id, i) => flyToCart({ id, icon: icon(id), delay: i * 0.12, label: labelOf(id), amount: amountOf(id) }))
    if (added.length <= 2) removed.slice(0, 2).forEach((id, i) => flyToCart({ id, direction: 'out', icon: icon(id), label: added.length ? undefined : i === 0 ? labelOf(id) : undefined }))
  }, [cart.items])
}

function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <Reveal y={16} className="mb-3">
      <h3 className="font-display text-[1.15rem] font-semibold text-ink">{title}</h3>
      {note && <p className="mt-1 max-w-xl text-[13px] leading-snug text-ink/55">{note}</p>}
    </Reveal>
  )
}

/** "In Gold" while a package item is in the cart, "Taken out of Gold" once removed. */
function PackageBadge({ name, on, delay = 0 }: { name: Bi; on: boolean; delay?: number }) {
  const lang = useLang()
  const label = on ? { en: `In ${name.en}`, ta: `${name.ta}-ல் உள்ளது` } : { en: `Taken out of ${name.en}`, ta: `${name.ta}-லிருந்து நீக்கப்பட்டது` }
  return (
    <motion.span
      key={`${name.en}-${on}`}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 460, damping: 20, delay }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${on ? 'bg-gold text-white' : 'bg-ink/[0.06] text-ink/55'}`}>
      <Icon name={on ? 'gem' : 'minus'} size={10} strokeWidth={2.4} />
      {label[lang]}
    </motion.span>
  )
}

/** One option: stock photo, name, one-line note, price, and a toggle or stepper. */
function OptionCard({ item, n, price, pkgName, note, disabled, onChange }: { item: CatalogueItem; n: number; price: number; pkgName?: Bi; note?: string; disabled?: boolean; onChange: (v: number) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const photo = ITEM_PHOTO[item.id]
  const max = item.max ?? 10
  // Gold while it is part of the package; ruby when the customer added it on top.
  const gold = !!pkgName && n > 0
  const priceText = item.onRequest ? t.askUs : price === 0 ? t.free : item.unit === 'session' ? `${formatINR(price)} ${t.perSession}` : item.unit === 'shoot' ? `${formatINR(price)} ${t.perShoot}` : max > 1 ? `+${formatINR(price)} ${t.each}` : `+${formatINR(price)}`
  return (
    <div
      id={`opt-${item.id}`}
      data-in-package={pkgName && n > 0 ? 'true' : undefined}
      className={`flex scroll-mt-40 items-center gap-3.5 rounded-[22px] border p-3 transition-colors duration-300 sm:p-3.5 ${gold ? 'border-gold/50 bg-gold-soft' : n ? 'border-ruby/40 bg-ruby-soft/50' : 'border-ink/[0.08] bg-white/70'} ${disabled ? 'opacity-60' : ''}`}
    >
      <Pluck n={n} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-ink/[0.05] sm:h-16 sm:w-16">
        {photo ? <Img k={photo} w={160} ratio={1} sizes="64px" className="absolute inset-0" /> : <Icon name={item.icon} size={22} className="absolute inset-0 m-auto text-ink/40" />}
      </Pluck>
      <span className="min-w-0 flex-1">
        {pkgName && (
          <span className="mb-1 block">
            <PackageBadge name={pkgName} on={n > 0} delay={(CATALOGUE.indexOf(item) % 14) * 0.035} />
          </span>
        )}
        <span className="block text-[14.5px] font-medium leading-snug text-ink [overflow-wrap:anywhere]">{item.name[lang]}</span>
        {(note ?? item.note?.[lang]) && <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">{note ?? item.note?.[lang]}</span>}
        <span className={`mt-1 block text-[12.5px] font-semibold tabular-nums ${gold ? 'text-gold-deep' : n ? 'text-ruby' : 'text-ink/70'}`}>
          {priceText}
          {item.pending && !item.onRequest && <Pending label={t.pending} />}
        </span>
      </span>
      {item.onRequest ? null : max > 1 ? (
        <Stepper value={n} min={0} max={max} onChange={onChange} label={item.name[lang]} />
      ) : (
        <Toggle on={n > 0} disabled={disabled} onToggle={() => onChange(n ? 0 : 1)} label={item.name[lang]} />
      )}
    </div>
  )
}

function CandidGroup({ group, title, cart, prices, mult, saving, pkgName, inPkg, onToggle }: {
  group: BundleGroup; title: string; cart: Cart; prices: PriceMap; mult: number; saving: number; pkgName?: Bi; inPkg: (id: CatalogueId) => boolean; onToggle: (id: CatalogueId, on: boolean) => void
}) {
  const lang = useLang()
  const t = useT(copy)
  const rule = BUNDLES[group]
  const hint: Bi = 'pctOff' in rule.two
    ? { en: `Pick any 2 and save ${rule.two.pctOff} %. All 3 for ${formatINR(rule.three)}.`, ta: `ஏதேனும் 2 தேர்ந்தால் ${rule.two.pctOff} % சேமிப்பு. மூன்றும் ${formatINR(rule.three)}.` }
    : { en: `Any 2 for ${formatINR(rule.two.flat)}. All 3 for ${formatINR(rule.three)}.`, ta: `ஏதேனும் 2: ${formatINR(rule.two.flat)}. மூன்றும் ${formatINR(rule.three)}.` }
  return (
    <section>
      <SectionHead title={title} note={`${hint[lang]} ${lang === 'ta' ? 'விலை' : 'Prices are'} ${t.perSession}${mult !== 1 ? ` × ${mult.toFixed(2)}` : ''}.`} />
      {/* Phones: a swipeable row with snap so all three styles sit side by side; a grid from sm up */}
      <div className="no-scrollbar -my-1 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain py-1 sm:grid sm:grid-cols-3 sm:overflow-visible" data-lenis-prevent-wheel>
        {bundleItems(group).map(item => {
          const on = (cart.items[item.id] ?? 0) > 0
          const gold = on && !!pkgName && inPkg(item.id)
          const photo = ITEM_PHOTO[item.id]
          return (
            <button
              key={item.id}
              id={`opt-${item.id}`}
              type="button"
              aria-pressed={on}
              data-in-package={pkgName && on && inPkg(item.id) ? 'true' : undefined}
              onClick={() => onToggle(item.id, !on)}
              className={`group relative flex w-[72%] shrink-0 snap-start scroll-mt-40 flex-col overflow-hidden rounded-[22px] border text-left sm:w-auto transition-all duration-300 cursor-pointer active:scale-[0.99] ${gold ? 'border-gold bg-gold-soft' : on ? 'border-ruby bg-ruby-soft/60 shadow-ruby' : 'border-ink/[0.08] bg-white/70 hover:border-ink/20'}`}
            >
              <Pluck n={on ? 1 : 0} depth={0.92} className="relative block aspect-[16/10] w-full overflow-hidden bg-ink/[0.05]">
                {photo && <Img k={photo} w={400} ratio={1.6} sizes="(min-width: 640px) 30vw, 100vw" className="absolute inset-0" />}
                <span className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 ${gold ? 'border-gold bg-gold text-white' : on ? 'border-ruby bg-ruby text-white' : 'border-white/70 bg-white/80 text-transparent'}`} aria-hidden="true">
                  <Icon name="check" size={15} strokeWidth={2.4} />
                </span>
              </Pluck>
              <span className="block p-3.5">
                {pkgName && inPkg(item.id) && (
                  <span className="mb-1 block">
                    <PackageBadge name={pkgName} on={on} delay={(CATALOGUE.indexOf(item) % 14) * 0.035} />
                  </span>
                )}
                <span className="block text-[14px] font-semibold capitalize leading-snug text-ink [overflow-wrap:anywhere]">{shortName(item.name)[lang]}</span>
                {item.note && <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">{item.note[lang]}</span>}
                <span className={`mt-1.5 block text-[12.5px] font-semibold tabular-nums ${gold ? 'text-gold-deep' : on ? 'text-ruby' : 'text-ink/70'}`}>{formatINR(prices[item.id])}</span>
              </span>
            </button>
          )
        })}
      </div>
      <AnimatePresence initial={false}>
        {saving > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            <motion.p
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="relative mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-ruby/25 bg-white/80 px-4 py-3 text-[13.5px] font-medium text-ruby"
            >
              <Sweep trigger={saving} tone="rgba(155,17,30,0.16)" />
              <span className="flex items-center gap-2">
                <motion.span key={saving} className="inline-flex" initial={{ rotate: -180, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
                  <Icon name="sparkle" size={15} />
                </motion.span>
                {t.bundleSaving} · {rule.name[lang]}
              </span>
              <span className="font-semibold tabular-nums">{formatINR(-saving)}</span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// ─── Album configurator ──────────────────────────────────────────────────────

function AlbumPicker({ cart, prices, pkgItems, pkgName, apply, onSpec }: {
  cart: Cart; prices: PriceMap; pkgItems: Cart['items']; pkgName?: Bi
  apply: (id: CatalogueId, n: number, album?: AlbumChoice | null) => void
  onSpec: (album: AlbumChoice) => void
}) {
  const lang = useLang()
  const t = useT(copy)
  const current = albumIn(cart)
  const isStd = !!current && STD_ALBUMS.has(current.id)
  const heirloom = is1028(current?.id)
  // The package's own album (A4, 10×28 paperback) stays offered so the customer can go back to it.
  const pkgAlbum = CATALOGUE.find(i => i.group === 'album' && i.packageOnly && ((pkgItems[i.id] ?? 0) > 0 || (cart.items[i.id] ?? 0) > 0))
  const choice: AlbumChoice | undefined = isStd ? (cart.album ?? defaultChoice('pixel_passage')) : undefined
  const line = choice ? lineOf(choice.line) : undefined
  const colour = line?.colours.find(c => c.name === choice?.colour) ?? line?.colours[0]

  /** Price text for a card that would put `id` in the cart. */
  const upgrade = (id: CatalogueId) => (current ? (current.id === id ? t.selected : albumDelta(cart, id, prices) === 0 ? t.samePrice : signed(albumDelta(cart, id, prices))) : formatINR(prices[id]))
  const sheetsId = (n: number): CatalogueId => (heirloom ? `album_1028_${n}` : `album_${n}`) as CatalogueId
  const boxOn = (cart.items.wooden_box ?? 0) > 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AlbumCard active={!current} title={t.softOnly} sub={t.softOnlyNote} price={t.free} onClick={() => current && apply(current.id, 0, null)} />
        {pkgAlbum && (
          <AlbumCard
            active={current?.id === pkgAlbum.id}
            gold={!!pkgName && (pkgItems[pkgAlbum.id] ?? 0) > 0}
            title={pkgAlbum.name[lang]}
            sub={pkgName ? `${t.packageAlbum} · ${pkgName[lang]}` : t.packageAlbum}
            price={upgrade(pkgAlbum.id)}
            onClick={() => apply(pkgAlbum.id, 1, null)}
          />
        )}
        {ALBUM_LINES.map(l => (
          <AlbumCard
            key={l.key}
            active={isStd && choice?.line === l.key}
            title={l.name[lang]}
            sub={l.pending ? t.toConfirm : l.sizes.join(' · ')}
            price={isStd ? (choice?.line === l.key ? t.selected : t.samePrice) : upgrade('album_25')}
            cover={<Surface cover={LINE_COVER[l.key]} hex={l.colours[0]?.hex ?? '#7d6450'} mini />}
            onClick={() => apply(isStd ? current!.id : 'album_25', 1, { ...defaultChoice(l.key), ...(choice?.line === l.key ? choice : {}) })}
          />
        ))}
        <AlbumCard
          active={heirloom}
          title={t.heirloom}
          sub={t.heirloomNote}
          price={heirloom ? t.selected : upgrade('album_1028_25')}
          cover={<Surface cover="velvet" hex="#5a0a1c" mini />}
          onClick={() => !heirloom && apply('album_1028_25', 1, null)}
        />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {(isStd || heirloom) && current && (
          <motion.div
            key={heirloom ? 'heirloom' : 'line'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="grid gap-6 rounded-[26px] border hairline bg-white/70 p-5 shadow-soft sm:p-6 md:grid-cols-[180px_minmax(0,1fr)]"
          >
            <CoverPreview
              cover={line ? LINE_COVER[line.key] : 'velvet'}
              hex={colour?.hex ?? (heirloom ? '#5a0a1c' : '#7d6450')}
              title={line ? line.name[lang] : '10×28'}
              size={choice?.size || '10×28'}
              orientation={choice?.orientation ?? 'landscape'}
            />
            <div className="min-w-0 space-y-5">
              {line && choice && (
                <>
                  <Field label={t.size}>
                    {line.sizes.length ? line.sizes.map(s => <Chip key={s} active={choice.size === s} onClick={() => onSpec({ ...choice, size: s })}>{s}</Chip>) : <p className="text-[13px] text-ink/55">{t.sizesPending}</p>}
                  </Field>
                  {line.orientations.length > 1 && (
                    <Field label={t.orientation}>
                      {line.orientations.map(o => <Chip key={o} active={choice.orientation === o} onClick={() => onSpec({ ...choice, orientation: o })}>{t[o]}</Chip>)}
                    </Field>
                  )}
                </>
              )}
              <div>
                <p className="t-label text-ink/55">{t.sheetsTitle}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ALBUM_SHEET_TIERS.map(n => {
                    const id = sheetsId(n)
                    const on = current.id === id
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        onClick={() => !on && apply(id, 1, choice ?? null)}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 cursor-pointer ${on ? 'border-ruby bg-ruby-soft/60' : 'border-ink/[0.08] bg-white hover:border-ink/20'}`}
                      >
                        <span className="block text-[14px] font-semibold text-ink">{n} {t.sheets}</span>
                        <span className={`block text-[12px] font-semibold tabular-nums ${on ? 'text-ruby' : 'text-ink/60'}`}>{on ? t.selected : signed(albumDelta(cart, id, prices))}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[12px] leading-snug text-ink/55">
                  {ALBUM_PHOTO_GUIDE[(ALBUM_SHEETS[current.id] ?? 25) as 25 | 35 | 45]?.[choice?.orientation ?? 'landscape'][lang]}
                </p>
              </div>
              {line && choice && (
                <>
                  <Field label={t.colour}>
                    {line.colours.length ? (
                      line.colours.map(c => (
                        <button
                          key={c.name}
                          type="button"
                          aria-pressed={choice.colour === c.name}
                          aria-label={c.name}
                          title={c.name}
                          onClick={() => onSpec({ ...choice, colour: c.name })}
                          className={`h-11 w-11 rounded-full border-2 transition cursor-pointer sm:h-10 sm:w-10 ${choice.colour === c.name ? 'border-ruby ring-2 ring-ruby/25 ring-offset-2' : 'border-white shadow-[0_1px_4px_rgba(10,10,11,0.2)]'}`}
                          style={{ background: c.hex }}
                        />
                      ))
                    ) : (
                      <p className="text-[13px] text-ink/55">{t.coloursPending}</p>
                    )}
                  </Field>
                  {colour && <p className="-mt-3 text-[12px] text-ink/50">{colour.name}</p>}
                  {BOX_INCLUDED.has(line.key) ? (
                    <p className="flex items-center gap-2 text-[13px] text-ink/70">
                      <Icon name="check" size={14} strokeWidth={2.4} className="text-ruby" />
                      {t.boxIncluded}
                    </p>
                  ) : (
                    BOX_SIZES.includes(choice.size) && (
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink/[0.03] px-4 py-3">
                        <span className="text-[13.5px] font-medium text-ink">
                          {t.box} <span className="font-semibold tabular-nums text-ink/60">+{formatINR(prices.wooden_box)}</span>
                          <Pending label={t.pending} />
                        </span>
                        <Toggle on={boxOn} onToggle={() => apply('wooden_box', boxOn ? 0 : 1, { ...choice, box: !boxOn })} label={t.box} />
                      </div>
                    )
                  )}
                  {line.includes.length > 0 && (
                    <ul className="space-y-1">
                      {line.includes.map(inc => (
                        <li key={inc.en} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink/60">
                          <Icon name="check" size={13} strokeWidth={2.4} className="mt-0.5 text-ruby" />
                          {inc[lang]}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="t-label text-ink/55">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

/** Mini 3D cover, drawn with the album studio's material surfaces. */
function CoverPreview({ cover, hex, title, size, orientation }: { cover: string; hex: string; title: string; size: string; orientation: 'landscape' | 'portrait' }) {
  const [a, b] = size.split('×').map(Number)
  const long = Math.max(a || 12, b || 15)
  const short = Math.min(a || 12, b || 15)
  const ratio = orientation === 'portrait' ? short / long : long / short
  const light = isLight(hex)
  return (
    <div className="flex items-center justify-center py-2 [perspective:900px]">
      <motion.div
        key={`${size}-${orientation}-${hex}-${cover}`}
        initial={{ rotateY: -8, opacity: 0.6 }}
        animate={{ rotateY: -22, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative w-full max-w-[180px] overflow-hidden rounded-[6px] shadow-[18px_22px_40px_-18px_rgba(10,10,11,0.55)] [transform-style:preserve-3d]"
        style={{ aspectRatio: ratio, rotateX: 8 }}
      >
        <Surface cover={cover} hex={hex} mini>
          <span className={`absolute inset-x-3 bottom-3 text-center font-display text-[13px] font-semibold tracking-wide ${light ? 'text-ink/70' : 'text-white/85'}`}>{title}</span>
        </Surface>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 to-transparent" aria-hidden="true" />
      </motion.div>
    </div>
  )
}

function AlbumCard({ active, gold = false, title, sub, price, onClick, cover }: { active: boolean; gold?: boolean; title: string; sub: string; price: string; onClick: () => void; cover?: ReactNode }) {
  const g = active && gold
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex flex-col items-start overflow-hidden rounded-[20px] border text-left transition-all duration-300 cursor-pointer ${g ? 'border-gold bg-gold-soft' : active ? 'border-ruby bg-ruby-soft/60 shadow-ruby' : 'border-ink/[0.08] bg-white/70 hover:border-ink/20'}`}
    >
      <span className="relative block h-16 w-full overflow-hidden bg-ink/[0.04]">
        {cover ?? <Icon name="book" size={20} className="absolute inset-0 m-auto text-ink/35" />}
      </span>
      <span className="block w-full p-3">
        <span className="block text-[13.5px] font-semibold leading-tight text-ink [overflow-wrap:anywhere]">{title}</span>
        <span className="mt-0.5 block min-h-[1rem] text-[11px] leading-snug text-ink/45">{sub}</span>
        <span className={`mt-1.5 block text-[12.5px] font-semibold tabular-nums ${g ? 'text-gold-deep' : active ? 'text-ruby' : 'text-ink/70'}`}>{price}</span>
      </span>
    </button>
  )
}

// ─── Controls ────────────────────────────────────────────────────────────────

function Stepper({ value, min, max, onChange, label, big = false, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; big?: boolean; unit?: string }) {
  const t = useT(copy)
  // Small buttons stay 36px to the eye but reach 44px for the thumb.
  const btn = `${big ? 'h-11 w-11' : "h-9 w-9 before:absolute before:-inset-1 before:content-['']"} relative flex items-center justify-center rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-25`
  const active = value > min
  return (
    <div className={`inline-flex shrink-0 items-center rounded-full p-1 transition-colors duration-300 ${active ? 'bg-ruby-soft ring-1 ring-ruby/25' : 'bg-ink/[0.05]'}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${t.less} · ${label}`} className={`${btn} bg-white text-ink shadow-[0_1px_2px_rgba(10,10,11,0.08)] hover:text-ruby`}>
        <Icon name="minus" size={15} strokeWidth={2.4} />
      </button>
      <span className={`relative inline-flex items-center justify-center overflow-hidden text-center font-sans font-semibold tabular-nums ${active ? 'text-ruby' : 'text-ink/70'} ${big ? 'h-8 min-w-[2.2ch] text-[1.2rem]' : 'h-7 min-w-[2ch] text-[15px]'}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: '60%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-60%', opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      {unit && <span className="pr-1 text-[12.5px] text-ink/55">{unit}</span>}
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${t.more} · ${label}`} className={`${btn} ${active ? 'bg-ruby text-white shadow-ruby hover:bg-ruby-bright' : 'bg-ink text-white hover:bg-ruby'}`}>
        <Icon name="plus" size={15} strokeWidth={2.4} />
      </button>
    </div>
  )
}

function Toggle({ on, onToggle, label, disabled }: { on: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] disabled:cursor-not-allowed ${on ? 'justify-end bg-ruby' : 'justify-start bg-ink/15'}`}
    >
      {/* A tick in the knob so "on" reads without relying on colour */}
      <motion.span layout transition={{ type: 'spring', stiffness: 520, damping: 34 }} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ruby shadow-[0_2px_6px_rgba(10,10,11,0.25)]">
        {on && <Icon name="check" size={13} strokeWidth={2.8} />}
      </motion.span>
    </button>
  )
}

function Pending({ label }: { label: string }) {
  return (
    <span title={label} className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-px align-middle text-[10px] font-semibold text-amber-800">
      <Icon name="info" size={10} strokeWidth={2.4} />
      {label}
    </span>
  )
}
