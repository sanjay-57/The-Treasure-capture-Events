import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useLenis } from 'lenis/react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { Button, Field, Modal, Select } from '../../components/ui'
import { CartBuilder } from '../../components/CartBuilder'
import { PackageAlbumNote } from '../../components/PackageAlbumNote'
import { InviteBuilder } from '../../components/InviteBuilder'
import { LangToggle } from '../../components/layout/Nav'
import { formatINR, useLang, useT, type Lang } from '../../lib/i18n'
import { useTitle, toast } from '../../lib/ui'
import { DISTRICTS, EVENTS, eventByKey, type DistrictKey, type EventKey } from '../../lib/data'
import { TIER_META, cartHours, cartTierName, presetName, setCartQty, tierCart, type Cart, type FixedTier } from '../../lib/catalogue'
import { PREMIUM_INVITE_ITEM, premiumUnlocked, splitCouple } from '../../lib/invite'
import { computeQuote } from '../../lib/pricing'
import { EMPTY_DRAFT, normalizePhone, usePrices, useStore, type Order } from '../../lib/store'
import { PageHeader, Panel, relTime, waHref } from './kit'

const copy = {
  eyebrow: { en: 'Studio', ta: 'ஸ்டுடியோ' },
  title: { en: 'Showroom', ta: 'ஷோரூம்' },
  subtitle: { en: 'Build a quote with the family at the desk, then send it on WhatsApp or print it.', ta: 'குடும்பத்துடன் அமர்ந்து விலைப்பட்டியல் அமைத்து, WhatsApp-ல் அனுப்பலாம் அல்லது அச்சிடலாம்.' },
  recent: { en: 'Recent showroom quotes', ta: 'சமீபத்திய ஷோரூம் விலைப்பட்டியல்கள்' },
  customer: { en: 'Customer', ta: 'வாடிக்கையாளர்' },
  name: { en: 'Name', ta: 'பெயர்' },
  mobile: { en: 'Mobile', ta: 'கைபேசி' },
  email: { en: 'Email (optional)', ta: 'மின்னஞ்சல் (விருப்பம்)' },
  event: { en: 'Event', ta: 'நிகழ்வு' },
  date: { en: 'Date', ta: 'தேதி' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  venue: { en: 'Venue name', ta: 'இடத்தின் பெயர்' },
  known: { en: 'This number already has', ta: 'இந்த எண்ணுக்கு ஏற்கனவே உள்ளது:' },
  knownLead: { en: 'This number is a lead:', ta: 'இந்த எண் ஒரு வாய்ப்பு:' },
  load: { en: 'Load', ta: 'ஏற்று' },
  packages: { en: 'Packages', ta: 'தொகுப்புகள்' },
  options: { en: 'Options', ta: 'தேர்வுகள்' },
  present: { en: 'Present', ta: 'காட்சி முறை' },
  exitPresent: { en: 'Exit present mode', ta: 'காட்சி முறையிலிருந்து வெளியேறு' },
  total: { en: 'Estimated total', ta: 'மொத்த விலை (தோராயமாக)' },
  save: { en: 'Save as quote', ta: 'விலைப்பட்டியலாகச் சேமி' },
  saved: { en: 'Quote saved', ta: 'விலைப்பட்டியல் சேமிக்கப்பட்டது' },
  need: { en: 'Name, a 10-digit mobile, event and district are needed to save.', ta: 'சேமிக்க பெயர், 10 இலக்கக் கைபேசி எண், நிகழ்வு, மாவட்டம் தேவை.' },
  sendWa: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  print: { en: 'Print / PDF', ta: 'அச்சிடு / PDF' },
  newQuote: { en: 'New customer', ta: 'புதிய வாடிக்கையாளர்' },
  invite: { en: 'E-invite builder', ta: 'மின் அழைப்பிதழ்' },
  invitePremium: { en: 'Premium unlocked (in the cart)', ta: 'பிரீமியம் திறந்துள்ளது (பட்டியலில் உள்ளது)' },
  inviteFree: { en: 'Free designs; add the premium e-invite to unlock the rest', ta: 'இலவச வடிவங்கள்; மற்றவற்றுக்குப் பிரீமியம் மின் அழைப்பிதழைச் சேருங்கள்' },
  addPremium: { en: 'Add premium e-invite to the cart', ta: 'பிரீமியம் மின் அழைப்பிதழைப் பட்டியலில் சேருங்கள்' },
}

const TIERS: FixedTier[] = ['basic', 'standard', 'premium']
const BOOKABLE = EVENTS.filter(e => e.bookable !== false)

interface Customer {
  name: string
  contact: string
  email: string
  eventType: EventKey
  date: string
  district: DistrictKey
  venueName: string
}

const BLANK: Customer = { name: '', contact: '', email: '', eventType: 'wedding', date: '', district: 'madurai', venueName: '' }

const packageCart = (eventType: EventKey, tier: FixedTier = 'standard', hours?: number) => tierCart(eventByKey(eventType)!.tiers, tier, 1, hours)

/** The itemised quote in the customer's language, for the wa.me link. */
function quoteText(o: Order, lang: Lang): string {
  const ev = eventByKey(o.eventType)
  const first = o.client.name.split(/[ &]/)[0]
  const lines = o.quote.sections.filter(s => s.amount !== 0).map(s => `• ${s.name[lang]}: ${formatINR(s.amount)}`).join('\n')
  const label = o.quote.package?.label[lang] ?? cartTierName(o.cart)[lang]
  return lang === 'ta'
    ? `வணக்கம் ${first}! உங்கள் ${ev?.name.ta ?? ''}${o.date ? ` (${o.date})` : ''} விலைப்பட்டியல்:\n${label}\n${lines}\nமொத்தம்: ${formatINR(o.quote.total)}\nவிலைப்பட்டியல் ${o.invoiceId} · ${o.id}\n— The Treasure Capture Events`
    : `Vanakkam ${first}! Your quote for the ${ev?.name.en ?? ''}${o.date ? ` on ${o.date}` : ''}:\n${label}\n${lines}\nTotal: ${formatINR(o.quote.total)}\nQuote ${o.invoiceId} · Ref ${o.id}\n— The Treasure Capture Events`
}

export default function Showroom() {
  const lang = useLang()
  const t = useT(copy)
  useTitle({ en: 'Admin · Showroom', ta: 'நிர்வாகம் · ஷோரூம்' })
  const prices = usePrices()
  const orders = useStore(s => s.orders)
  const leads = useStore(s => s.leads)
  const saveShowroomQuote = useStore(s => s.saveShowroomQuote)
  const [c, setC] = useState<Customer>(BLANK)
  const [cart, setCart] = useState<Cart>(() => packageCart(BLANK.eventType))
  const [present, setPresent] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const lenis = useLenis()
  // Present mode is a full-screen layer on the tablet: lock the page behind it, Esc exits.
  useEffect(() => {
    if (!present) return
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPresent(false)
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [present, lenis])
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => {
    setC(x => ({ ...x, [k]: v }))
    setSavedId(null)
  }

  const ev = eventByKey(c.eventType)!
  const quote = computeQuote({ eventType: c.eventType, cart, distanceKm: 0 }, prices)
  const label = quote.package?.label ?? cartTierName(cart)
  const phone = normalizePhone(c.contact)
  const ready = !!c.name.trim() && phone.length === 10
  const saved = savedId ? orders.find(o => o.id === savedId) : undefined
  const recent = useMemo(() => orders.filter(o => o.source === 'showroom').slice(0, 8), [orders])

  // Mobile is the key: an existing order or lead with this number can be loaded.
  const match = useMemo(() => {
    if (phone.length !== 10) return undefined
    const order = orders.find(o => normalizePhone(o.client.contact) === phone)
    if (order) return { order }
    const lead = leads.find(l => normalizePhone(l.contact) === phone)
    return lead ? { lead } : undefined
  }, [phone, orders, leads])
  const alreadyLoaded = match?.order ? match.order.client.name === c.name && match.order.eventType === c.eventType : match?.lead ? match.lead.name === c.name : true

  const loadMatch = () => {
    if (match?.order) {
      const o = match.order
      setC({ name: o.client.name, contact: o.client.contact, email: o.client.email ?? '', eventType: o.eventType, date: o.date, district: o.district, venueName: o.venueName })
      setCart(o.cart)
    } else if (match?.lead) {
      setC(x => ({ ...x, name: match.lead!.name }))
    }
  }

  const changeEvent = (key: EventKey) => {
    set('eventType', key)
    setCart(packageCart(key, 'standard', cartHours(cart)))
  }

  const changeCart = (next: Cart) => {
    setCart(next)
    setSavedId(null)
  }

  const pick = (tier: FixedTier) =>
    changeCart(cart.tier === tier ? { ...cart, tier: 'custom', variant: undefined, album: undefined, items: {} } : packageCart(c.eventType, tier, cartHours(cart)))

  const save = () => {
    if (!ready) return toast(t.need, 'ruby')
    const id = saveShowroomQuote({
      ...EMPTY_DRAFT,
      name: c.name.trim(),
      contact: c.contact,
      email: c.email,
      eventType: c.eventType,
      district: c.district,
      date: c.date,
      venueName: c.venueName,
      cart,
      durationHours: cartHours(cart),
    })
    if (!id) return toast(t.need, 'ruby')
    setSavedId(id)
    toast(`${t.saved} · ${id}`, 'ruby')
  }

  const reset = () => {
    setC(BLANK)
    setCart(packageCart(BLANK.eventType))
    setSavedId(null)
  }

  const packagesRow = (
    <div className="grid gap-3 sm:grid-cols-3">
      {TIERS.map(tier => {
        const active = cart.tier === tier
        const total = computeQuote({ eventType: c.eventType, cart: packageCart(c.eventType, tier), distanceKm: 0 }, prices).total
        return (
          <button
            key={tier}
            type="button"
            aria-pressed={active}
            onClick={() => pick(tier)}
            className={`flex items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left ${present ? 'min-h-[72px]' : 'min-h-14'} transition-colors duration-300 cursor-pointer ${active ? 'border-ruby bg-ruby text-white shadow-ruby' : 'border-ink/10 bg-white hover:border-ink/25'}`}
          >
            <span className="min-w-0">
              <span className={`block font-semibold ${present ? 'text-[18px]' : 'text-[15px]'}`}>{presetName(ev.tiers, tier)[lang]}</span>
              <span className={`block tabular-nums ${present ? 'text-[15px]' : 'text-[13px]'} ${active ? 'text-white/80' : 'text-ink/55'}`}>{formatINR(total)}</span>
            </span>
            {TIER_META[tier].popular && !active && <Icon name="star" size={16} className="shrink-0 text-ruby" />}
            {active && <Icon name="check" size={18} strokeWidth={2.4} className="shrink-0" />}
          </button>
        )
      })}
    </div>
  )

  const builder = (
    <>
      {packagesRow}
      <PackageAlbumNote className="mt-4" />
      <div className="mt-6">
        <CartBuilder cart={cart} spec={ev.tiers} onChange={changeCart} />
      </div>
    </>
  )

  const totalBar = (
    <div className={`sticky z-20 mt-6 flex ${present ? 'bottom-[calc(12px+env(safe-area-inset-bottom))]' : 'bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-4'} flex-wrap items-center justify-between gap-3 rounded-[22px] bg-ink px-5 py-4 text-white shadow-[0_20px_40px_-20px_rgba(10,10,11,0.6)]`}>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-white/60">{label[lang]}</p>
        <p className={`font-display tabular-nums ${present ? 'text-[34px]' : 'text-[26px]'} leading-tight`}>{formatINR(quote.total)}</p>
      </div>
      {!present && <Button onClick={save} iconLeft="receipt" disabled={!!savedId}>{t.save}</Button>}
    </div>
  )

  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        actions={<Button variant="outline" size="sm" iconLeft="maximize" onClick={() => setPresent(true)}>{t.present}</Button>}
      />

      {recent.length > 0 && (
        <div className="mb-6">
          <p className="t-label mb-2 text-ink/45">{t.recent}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {recent.map(o => (
              <Link key={o.id} to={`/admin/billing/${o.id}`} className="shrink-0 rounded-2xl border hairline bg-white px-4 py-2.5 text-[13px] hover:border-ink/25">
                <span className="block font-semibold text-ink">{o.client.name}</span>
                <span className="block text-ink/50 tabular-nums">{formatINR(o.quote.total)} · {relTime(o.createdAt, lang)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <Panel title={t.customer} icon="users" className="lg:sticky lg:top-24">
          <div className="space-y-4">
            <Field label={t.mobile} value={c.contact} onChange={v => set('contact', v)} type="tel" inputMode="tel" icon="phone" required />
            <AnimatePresence initial={false}>
              {match && !alreadyLoaded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-ruby-soft px-4 py-3 text-[13px] text-ruby-deep">
                    <span className="min-w-0">
                      {match.order ? `${t.known} ${match.order.id} (${match.order.client.name})` : `${t.knownLead} ${match.lead!.name}`}
                    </span>
                    <Button size="sm" variant="ruby" onClick={loadMatch}>{t.load}</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Field label={t.name} value={c.name} onChange={v => set('name', v)} required />
            <Field label={t.email} value={c.email} onChange={v => set('email', v)} type="email" inputMode="email" />
            <Select label={t.event} value={c.eventType} onChange={v => changeEvent(v as EventKey)} options={BOOKABLE.map(e => ({ value: e.key, label: e.name[lang] }))} required />
            <Field label={t.date} value={c.date} onChange={v => set('date', v)} type="date" />
            <Select label={t.district} value={c.district} onChange={v => set('district', v as DistrictKey)} options={DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] }))} required />
            <Field label={t.venue} value={c.venueName} onChange={v => set('venueName', v)} />
          </div>
          {/* E-invite (roadmap 6.4): the same builder the couple gets, prefilled from this card */}
          <div className="mt-5 border-t hairline pt-5">
            <Button variant="outline" full iconLeft="mail" onClick={() => setInviteOpen(true)}>{t.invite}</Button>
            <p className="mt-2 text-center text-[12px] text-ink/50">{premiumUnlocked(cart.items) ? t.invitePremium : t.inviteFree}</p>
          </div>
          {saved && (
            <div className="mt-5 space-y-2 border-t hairline pt-5">
              <p className="text-[13px] font-semibold text-ink">{t.saved} · {saved.id}</p>
              <Button href={waHref(saved.client.contact, quoteText(saved, lang))} variant="ruby" full iconLeft="whatsapp">{t.sendWa}</Button>
              <Button to={`/admin/billing/${saved.id}`} variant="outline" full iconLeft="receipt">{t.print}</Button>
              <Button variant="ghost" full iconLeft="plus" onClick={reset}>{t.newQuote}</Button>
            </div>
          )}
        </Panel>

        <div className="min-w-0">
          {builder}
          {totalBar}
        </div>
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} label={t.invite} className="p-5 sm:max-w-6xl sm:p-8">
        <h2 className="mb-6 pr-12 font-display text-[26px] leading-tight text-ink">{t.invite}{c.name ? ` · ${c.name}` : ''}</h2>
        <InviteBuilder
          key={phone}
          initial={{ brideEn: splitCouple(c.name)[0], groomEn: splitCouple(c.name)[1], date: c.date, venue: c.venueName, phone: c.contact, theme: premiumUnlocked(cart.items) ? 'lantern' : 'ivory' }}
          premium={premiumUnlocked(cart.items)}
          storageKey={phone.length === 10 ? `showroom:${phone}` : undefined}
          unlock={{ label: t.addPremium, onClick: () => changeCart(setCartQty(cart, PREMIUM_INVITE_ITEM, 1)) }}
        />
      </Modal>

      {/* Present mode: no admin chrome, bigger type and targets, the total always in view */}
      <AnimatePresence>
        {present && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            data-lenis-prevent
            className="fixed inset-0 z-[80] h-[100dvh] overflow-y-auto overscroll-contain bg-mist text-[17px]"
            role="dialog"
            aria-modal="true"
            aria-label={t.present}
          >
            <div className="mx-auto max-w-5xl pb-[calc(env(safe-area-inset-bottom)+24px)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(env(safe-area-inset-top)+16px)] sm:px-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[28px] leading-tight text-ink sm:text-[34px]">{c.name || ev.name[lang]}</p>
                  <p className="text-[15px] text-ink/55">{ev.name[lang]}{c.date ? ` · ${c.date}` : ''}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <LangToggle />
                  <button type="button" onClick={() => setPresent(false)} aria-label={t.exitPresent} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft cursor-pointer">
                    <Icon name="x" size={20} />
                  </button>
                </div>
              </div>
              {builder}
              {totalBar}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
