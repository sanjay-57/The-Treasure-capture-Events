import { AnimatePresence, motion } from 'motion/react'
import { Icon } from './Icon'
import { Stagger, StaggerItem, Reveal, EASE } from './motion'
import { formatINR, useLang, useT } from '../lib/i18n'
import { usePrices } from '../lib/store'
import { CATALOGUE, MAX_SESSIONS, MIN_SESSIONS, setCartQty, type Cart, type CatalogueId, type CatalogueItem } from '../lib/catalogue'

/*
 * The cart configurator: sessions, crew headcount, add-on toggles, album
 * tier, frames & prints, special shoots. Used by the booking flow (bound to
 * the draft) and by the admin billing screen (bound to an order re-quote).
 */

const copy = {
  cart: { en: 'Fine-tune your cart', ta: 'உங்கள் பட்டியலை மாற்றுங்கள்' },
  cartNote: { en: 'Prices shown are what each change adds to your total.', ta: 'காட்டப்படும் விலை ஒவ்வொரு மாற்றமும் மொத்தத்தில் சேர்ப்பது.' },
  sessions: { en: 'Sessions', ta: 'அமர்வுகள்' },
  sessionsNote: { en: 'One session is about five hours. A morning muhurtham and an evening reception are two sessions.', ta: 'ஒரு அமர்வு சுமார் ஐந்து மணி. காலை முகூர்த்தமும் மாலை வரவேற்பும் இரண்டு அமர்வுகள்.' },
  session: { en: 'session', ta: 'அமர்வு' },
  sessionsPl: { en: 'sessions', ta: 'அமர்வுகள்' },
  crew: { en: 'Crew per session', ta: 'ஒரு அமர்வுக்கான குழு' },
  crewNote: { en: 'How many of each you would like on the day. Soft copies of every photo are always included.', ta: 'அன்று ஒவ்வொன்றிலும் எத்தனை பேர் வேண்டும். அனைத்துப் படங்களின் சாஃப்ட் காப்பி எப்போதும் அடங்கும்.' },
  crewSubtotal: { en: 'Crew subtotal', ta: 'குழு கூட்டுத்தொகை' },
  perSession: { en: 'per session', ta: 'ஒரு அமர்வுக்கு' },
  addons: { en: 'Add-ons for the day', ta: 'விழா நாள் கூடுதல்கள்' },
  addonsNote: { en: 'Optional. Toggle any on or off.', ta: 'விருப்பத்திற்கு ஏற்ப. இயக்கலாம் அல்லது நிறுத்தலாம்.' },
  album: { en: 'Album', ta: 'ஆல்பம்' },
  albumNote: { en: 'One hard-copy album, by sheet count — or choose soft copies only.', ta: 'தாள் எண்ணிக்கைப்படி ஒரு ஆல்பம் — அல்லது சாஃப்ட் காப்பி மட்டும்.' },
  softOnly: { en: 'Soft copies only', ta: 'சாஃப்ட் காப்பி மட்டும்' },
  softOnlyNote: { en: 'No printed album', ta: 'அச்சிட்ட ஆல்பம் இல்லை' },
  sheets: { en: 'sheets', ta: 'தாள்கள்' },
  frames: { en: 'Frames & prints', ta: 'பிரேம்கள் & அச்சுகள்' },
  framesNote: { en: 'Any quantity. Premium frames have an acrylic or glass finish.', ta: 'எத்தனை வேண்டுமானாலும். பிரீமியம் பிரேம்கள் அக்ரிலிக் / கண்ணாடி.' },
  special: { en: 'Special shoots', ta: 'சிறப்புப் படப்பிடிப்புகள்' },
  specialNote: { en: 'Separate half-day sessions before or after the event.', ta: 'நிகழ்வுக்கு முன்னோ பின்னோ தனி அரை நாள் அமர்வுகள்.' },
  included: { en: 'Included with your booking', ta: 'உங்கள் பதிவில் அடங்கியவை' },
  free: { en: 'Included', ta: 'அடங்கும்' },
  pending: { en: 'Price to be confirmed', ta: 'விலை உறுதி செய்யப்பட வேண்டும்' },
  each: { en: 'each', ta: 'ஒன்றுக்கு' },
  less: { en: 'Fewer', ta: 'குறை' },
  more: { en: 'More', ta: 'கூட்டு' },
}

// ─── Cart builder ────────────────────────────────────────────────────────────

const by = (section: CatalogueItem['section'], pred: (i: CatalogueItem) => boolean = () => true) => CATALOGUE.filter(i => i.section === section && pred(i))
const CREW = by('crew')
const ADDONS = by('addon')
const ALBUMS = by('deliverable', i => i.group === 'album')
const PRINTS = by('deliverable', i => !i.group && i.unit !== 'included')
const INCLUDED = by('deliverable', i => i.unit === 'included')
const SPECIAL = by('special')

export function CartBuilder({ cart, shootItem, onChange }: { cart: Cart; shootItem?: CatalogueItem['id']; onChange: (cart: Cart) => void }) {
  const lang = useLang()
  const t = useT(copy)
  const prices = usePrices()
  const setCartItem = (id: CatalogueId, n: number) => onChange(setCartQty(cart, id, n))
  const setSessions = (n: number) => onChange({ ...cart, sessions: Math.min(MAX_SESSIONS, Math.max(MIN_SESSIONS, Math.round(n))) })
  const qty = (id: CatalogueItem['id']) => cart.items[id] ?? 0
  const crewSubtotal = CREW.reduce((s, i) => s + prices[i.id] * qty(i.id) * cart.sessions, 0)
  const included = INCLUDED.filter(i => qty(i.id) > 0)
  // Special-shoot events lead with their own shoot; other events offer the shoots as extras.
  const specials = shootItem ? [...SPECIAL.filter(i => i.id === shootItem), ...SPECIAL.filter(i => i.id !== shootItem)] : SPECIAL

  return (
    <div className="space-y-5">
      {/* Sessions + crew */}
      <Reveal>
        <section className="rounded-[28px] border hairline bg-white/70 p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-display text-[1.15rem] font-semibold text-ink">{t.sessions}</h3>
              <p className="mt-1 max-w-md text-[13px] leading-snug text-ink/55">{t.sessionsNote}</p>
            </div>
            <Stepper value={cart.sessions} min={MIN_SESSIONS} max={MAX_SESSIONS} onChange={setSessions} label={t.sessions} big unit={cart.sessions > 1 ? t.sessionsPl : t.session} />
          </div>

          <div className="mt-6 border-t hairline pt-5">
            <h3 className="font-display text-[1.15rem] font-semibold text-ink">{t.crew}</h3>
            <p className="mt-1 max-w-md text-[13px] leading-snug text-ink/55">{t.crewNote}</p>
            <ul className="mt-4 space-y-1.5">
              {CREW.map(item => {
                const n = qty(item.id)
                const unit = prices[item.id]
                return (
                  <li key={item.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 rounded-2xl px-3 py-3 transition-colors duration-300 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] ${n ? 'bg-ruby-soft/45' : 'hover:bg-ink/[0.025]'}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${n ? 'bg-ruby text-white shadow-ruby' : 'bg-ink/[0.05] text-ink/60'}`}>
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-medium leading-snug text-ink">{item.name[lang]}</span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">{item.note?.[lang]}</span>
                    </span>
                    <span className="col-start-2 text-[13px] leading-tight tabular-nums sm:col-start-3 sm:text-right">
                      <span className={`font-semibold ${n ? 'text-ruby' : 'text-ink/70'}`}>{n > 1 ? `${formatINR(unit * n)}` : formatINR(unit)}</span>
                      <span className="block text-[11px] text-ink/45">{n > 1 ? `${formatINR(unit)} ${t.each} · ${t.perSession}` : t.perSession}</span>
                    </span>
                    <span className="col-start-3 row-start-1 sm:col-start-4">
                      <Stepper value={n} min={0} max={item.max ?? 4} onChange={v => setCartItem(item.id, v)} label={item.name[lang]} />
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-ink px-4 py-3.5 text-white">
              <span className="text-[13px] font-medium text-white/70">
                {t.crewSubtotal} · {cart.sessions} {cart.sessions > 1 ? t.sessionsPl : t.session}
              </span>
              <span className="font-display text-[1.4rem] font-semibold tabular-nums">{formatINR(crewSubtotal)}</span>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Add-ons */}
      <Reveal>
        <section>
          <SectionHead title={t.addons} note={t.addonsNote} />
          <Stagger className="grid gap-3 sm:grid-cols-2" gap={0.05}>
            {ADDONS.map(item => (
              <StaggerItem key={item.id}>
                <ToggleRow item={item} on={qty(item.id) > 0} price={prices[item.id]} onToggle={() => setCartItem(item.id, qty(item.id) ? 0 : 1)} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Reveal>

      {/* Album */}
      <Reveal>
        <section>
          <SectionHead title={t.album} note={t.albumNote} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <AlbumCard active={!ALBUMS.some(a => qty(a.id) > 0)} title={t.softOnly} sub={t.softOnlyNote} price={t.free} onClick={() => ALBUMS.forEach(a => qty(a.id) && setCartItem(a.id, 0))} />
            {ALBUMS.map(a => (
              <AlbumCard
                key={a.id}
                active={qty(a.id) > 0}
                title={`${a.name.en.match(/\d+/)?.[0]} ${t.sheets}`}
                sub={a.id === 'album_25' ? (lang === 'ta' ? 'வரை' : 'up to') : ''}
                price={formatINR(prices[a.id])}
                onClick={() => setCartItem(a.id, 1)}
              />
            ))}
          </div>
        </section>
      </Reveal>

      {/* Frames & prints */}
      <Reveal>
        <section>
          <SectionHead title={t.frames} note={t.framesNote} />
          <ul className="divide-y divide-ink/[0.06] rounded-[26px] border hairline bg-white/70 px-4 shadow-soft sm:px-5">
            {PRINTS.map(item => (
              <QtyRow key={item.id} item={item} qty={qty(item.id)} price={prices[item.id]} onChange={v => setCartItem(item.id, v)} />
            ))}
          </ul>
        </section>
      </Reveal>

      {/* Special shoots */}
      <Reveal>
        <section>
          <SectionHead title={t.special} note={t.specialNote} />
          <ul className="divide-y divide-ink/[0.06] rounded-[26px] border hairline bg-white/70 px-4 shadow-soft sm:px-5">
            {specials.map(item => (
              <QtyRow key={item.id} item={item} qty={qty(item.id)} price={prices[item.id]} onChange={v => setCartItem(item.id, v)} />
            ))}
          </ul>
        </section>
      </Reveal>

      {/* Included */}
      <AnimatePresence initial={false}>
        {included.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="rounded-[26px] bg-ruby-soft/60 p-5 sm:p-6">
            <p className="t-label text-ruby">{t.included}</p>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {included.map(item => (
                <li key={item.id} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink/80">
                  <Icon name="check" size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-ruby" />
                  <span>
                    {item.name[lang]}
                    {item.note && <span className="block text-[12px] text-ink/50">{item.note[lang]}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-3 mt-2">
      <h3 className="font-display text-[1.15rem] font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-xl text-[13px] leading-snug text-ink/55">{note}</p>
    </div>
  )
}

function Stepper({ value, min, max, onChange, label, big = false, unit }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string; big?: boolean; unit?: string }) {
  const t = useT(copy)
  const btn = `${big ? 'h-11 w-11' : 'h-9 w-9'} flex items-center justify-center rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-25`
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

function ToggleRow({ item, on, price, onToggle }: { item: CatalogueItem; on: boolean; price: number; onToggle: () => void }) {
  const lang = useLang()
  const t = useT(copy)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`group flex w-full items-center gap-3.5 rounded-[22px] border p-4 text-left transition-all duration-300 cursor-pointer md:gap-4 ${
        on ? 'border-ruby/40 bg-ruby-soft/60' : 'border-ink/[0.08] bg-white/70 hover:border-ink/20 hover:bg-white'
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${on ? 'bg-ruby text-white' : 'bg-ink/[0.05] text-ink/60'}`}>
        <Icon name={item.icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium leading-snug text-ink">{item.name[lang]}</span>
        {item.note && <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">{item.note[lang]}</span>}
        <span className={`mt-1 block text-[12.5px] font-semibold tabular-nums ${on ? 'text-ruby' : 'text-ink/70'}`}>+{formatINR(price)}{item.pending && <Pending label={t.pending} />}</span>
      </span>
      <span className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${on ? 'justify-end bg-ruby' : 'justify-start bg-ink/15'}`} aria-hidden="true">
        <motion.span layout transition={{ type: 'spring', stiffness: 520, damping: 34 }} className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,11,0.25)]" />
      </span>
    </button>
  )
}

function AlbumCard({ active, title, sub, price, onClick }: { active: boolean; title: string; sub: string; price: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex flex-col items-start rounded-[20px] border p-3.5 text-left transition-all duration-300 cursor-pointer ${active ? 'border-ruby bg-ruby-soft/60 shadow-ruby' : 'border-ink/[0.08] bg-white/70 hover:border-ink/20'}`}
    >
      <Icon name="book" size={18} className={active ? 'text-ruby' : 'text-ink/40'} />
      <span className="mt-3 text-[13.5px] font-semibold leading-tight text-ink">{title}</span>
      <span className="mt-0.5 min-h-[1rem] text-[11px] text-ink/45">{sub}</span>
      <span className={`mt-2 text-[12.5px] font-semibold tabular-nums ${active ? 'text-ruby' : 'text-ink/70'}`}>{price}</span>
    </button>
  )
}

function QtyRow({ item, qty, price, onChange }: { item: CatalogueItem; qty: number; price: number; onChange: (v: number) => void }) {
  const lang = useLang()
  const t = useT(copy)
  return (
    <li className="flex items-center gap-3.5 py-3.5">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${qty ? 'bg-ruby text-white' : 'bg-ink/[0.05] text-ink/60'}`}>
        <Icon name={item.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium leading-snug text-ink">{item.name[lang]}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-ink/50">
          <span className={`font-semibold tabular-nums ${qty ? 'text-ruby' : 'text-ink/60'}`}>+{formatINR(price)}</span> {t.each}
          {item.note && <span className="hidden sm:inline"> · {item.note[lang]}</span>}
          {item.pending && <Pending label={t.pending} />}
        </span>
      </span>
      <Stepper value={qty} min={0} max={item.max ?? 10} onChange={onChange} label={item.name[lang]} />
    </li>
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
