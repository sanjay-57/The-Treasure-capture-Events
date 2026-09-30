import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, EmptyState } from '../../components/ui'
import { EASE } from '../../components/motion'
import { formatDateTime, useLang, useT, type Bi } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { normalizePhone, useStore, type Lead } from '../../lib/store'
import { AC, Avatar, CopyButton, PageHeader, SearchInput, relTime, telHref, waHref } from './kit'

const copy = {
  eyebrow: { en: 'Lead capture', ta: 'வாய்ப்புச் சேகரிப்பு' },
  title: { en: 'Leads', ta: 'வாய்ப்புகள்' },
  sub: { en: 'Names and numbers from the first-visit popup and contact form. Call them while the interest is warm.', ta: 'முதல் வருகை பாப்-அப் மற்றும் தொடர்புப் படிவத்திலிருந்து வந்த பெயர்கள், எண்கள். ஆர்வம் இருக்கும்போதே அழையுங்கள்.' },
  export: { en: 'Export CSV', ta: 'CSV பதிவிறக்கு' },
  exported: { en: 'Leads exported', ta: 'வாய்ப்புகள் பதிவிறக்கப்பட்டன' },
  total: { en: 'Total leads', ta: 'மொத்த வாய்ப்புகள்' },
  week: { en: 'This week', ta: 'இந்த வாரம்' },
  converted: { en: 'Became bookings', ta: 'பதிவாக மாறியவை' },
  search: { en: 'Search name or phone', ta: 'பெயர் அல்லது தொலைபேசி' },
  all: { en: 'All sources', ta: 'அனைத்து மூலங்கள்' },
  name: { en: 'Name', ta: 'பெயர்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  source: { en: 'Source', ta: 'மூலம்' },
  when: { en: 'Captured', ta: 'பெறப்பட்டது' },
  actions: { en: 'Follow up', ta: 'தொடர் நடவடிக்கை' },
  call: { en: 'Call', ta: 'அழை' },
  wa: { en: 'WhatsApp', ta: 'WhatsApp' },
  book: { en: 'Start booking', ta: 'பதிவைத் தொடங்கு' },
  booked: { en: 'Booked', ta: 'பதிவானது' },
  prefilled: { en: 'Booking started with their details', ta: 'அவர்களின் விவரங்களுடன் பதிவு தொடங்கியது' },
  copy: { en: 'Copy number', ta: 'எண்ணை நகலெடு' },
  emptyTitle: { en: 'No leads yet', ta: 'இன்னும் வாய்ப்புகள் இல்லை' },
  emptyBody: { en: 'When a first-time visitor leaves their name and number in the welcome popup or contact form, they appear here.', ta: 'முதல் முறை வருபவர் வரவேற்பு பாப்-அப் அல்லது தொடர்புப் படிவத்தில் பெயரும் எண்ணும் அளித்தால், அவை இங்கே தோன்றும்.' },
  seeSite: { en: 'Open website', ta: 'இணையதளம் திற' },
  greeting: { en: 'Vanakkam {name}! Thank you for visiting The Treasure Capture Events. When is your celebration? We would love to share a quote.', ta: 'வணக்கம் {name}! The Treasure Capture Events தளத்திற்கு வந்ததற்கு நன்றி. உங்கள் விழா எப்போது? கட்டண மதிப்பீட்டைப் பகிர விரும்புகிறோம்.' },
}

const SOURCES: Record<string, Bi> = {
  popup: { en: 'Welcome popup', ta: 'வரவேற்பு பாப்-அப்' },
  contact: { en: 'Contact form', ta: 'தொடர்புப் படிவம்' },
  voice: { en: 'Voice assistant', ta: 'குரல் உதவியாளர்' },
  book: { en: 'Booking flow', ta: 'முன்பதிவு' },
}
const sourceLabel = (s: string, lang: 'en' | 'ta') => SOURCES[s]?.[lang] ?? s

export default function Leads() {
  const t = useT(copy)
  const lang = useLang()
  const leads = useStore(s => s.leads)
  const orders = useStore(s => s.orders)
  const updateDraft = useStore(s => s.updateDraft)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [src, setSrc] = useState('all')
  useTitle({ en: 'Leads', ta: 'வாய்ப்புகள்' })

  const orderByPhone = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of orders) m.set(normalizePhone(o.client.contact), o.id)
    return m
  }, [orders])
  const sources = useMemo(() => [...new Set(leads.map(l => l.source))], [leads])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const d = s.replace(/\D/g, '')
    return [...leads]
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter(l => (src === 'all' || l.source === src) && (!s || l.name.toLowerCase().includes(s) || (d.length > 0 && normalizePhone(l.contact).includes(d))))
  }, [leads, q, src])

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const stats = [
    { l: t.total, v: leads.length },
    { l: t.week, v: leads.filter(l => l.at >= weekAgo).length },
    { l: t.converted, v: leads.filter(l => orderByPhone.has(normalizePhone(l.contact))).length },
  ]

  const start = (l: Lead) => {
    updateDraft({ name: l.name, contact: l.contact })
    toast(t.prefilled)
    navigate('/book')
  }

  const exportCsv = () => {
    const rows = [['Name', 'Phone', 'Language', 'Source', 'Captured at', 'Order'], ...list.map(l => [l.name, l.contact, l.lang === 'ta' ? 'Tamil' : l.lang === 'en' ? 'English' : '', l.source, l.at, orderByPhone.get(normalizePhone(l.contact)) ?? ''])]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `treasure-captures-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast(t.exported)
  }

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} actions={leads.length > 0 && <Button variant="outline" size="sm" iconLeft="share" onClick={exportCsv} className="max-md:!h-10">{t.export}</Button>} />

      {leads.length === 0 ? (
        <EmptyState icon="inbox" title={t.emptyTitle} body={t.emptyBody} action={<Button href="/" variant="outline" size="sm" iconLeft="external">{t.seeSite}</Button>} />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3 md:mb-6">
            {stats.map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6, ease: EASE }} className={`min-w-0 rounded-[20px] px-3 py-3.5 sm:rounded-[22px] sm:px-4 sm:py-4 ${i === 0 ? 'bg-ink text-white' : 'border hairline bg-white'}`}>
                <p className="font-display text-[26px] font-medium leading-none sm:text-[30px]">{s.v}</p>
                <p className={`mt-1.5 text-[11.5px] leading-snug sm:truncate sm:text-[12px] ${i === 0 ? 'text-white/55' : 'text-ink/50'}`}>{s.l}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
            <SearchInput value={q} onChange={setQ} placeholder={t.search} className="md:w-[300px]" />
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:ml-auto md:px-0" data-lenis-prevent>
              {['all', ...sources].map(s => {
                const on = src === s
                return (
                  <button key={s} type="button" onClick={() => setSrc(s)} aria-pressed={on} className={`relative h-10 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors md:h-9 cursor-pointer ${on ? 'text-white' : 'text-ink/60 hover:text-ink'}`}>
                    {on ? <motion.span layoutId="lead-src" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 36 }} /> : <span className="absolute inset-0 rounded-full border border-ink/[0.08] bg-white" />}
                    <span className="relative whitespace-nowrap">{s === 'all' ? t.all : sourceLabel(s, lang)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState icon="search" title={AC.noResults[lang]} action={<Button variant="outline" size="sm" onClick={() => { setQ(''); setSrc('all') }}>{AC.clearFilters[lang]}</Button>} />
          ) : (
            <div className="overflow-hidden rounded-[22px] border hairline bg-white shadow-[0_1px_2px_rgba(10,10,11,0.04)] sm:rounded-[26px]">
              <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b hairline bg-ink/[0.015] px-6 py-3 md:grid">
                {[t.name, t.phone, t.source, t.when, t.actions].map((h, i) => <span key={i} className={`t-label text-ink/40 ${i === 4 ? 'text-right' : ''}`}>{h}</span>)}
              </div>
              <ul>
                <AnimatePresence initial={false}>
                  {list.map((l, i) => {
                    const orderId = orderByPhone.get(normalizePhone(l.contact))
                    const greeting = t.greeting.replace('{name}', l.name.split(' ')[0])
                    return (
                      <motion.li key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03, duration: 0.45, ease: EASE } }} exit={{ opacity: 0 }} className="border-b hairline last:border-0">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-4 md:px-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={l.name} size={38} tone={orderId ? 'muted' : 'soft'} />
                            <div className="min-w-0">
                              <p className="truncate text-[14.5px] font-semibold text-ink">{l.name}</p>
                              {orderId ? (
                                <Link to={`/admin/orders/${orderId}`} className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11.5px] font-medium text-ink/55 hover:text-ruby"><Icon name="check" size={12} />{t.booked} · <span className="font-mono">{orderId}</span></Link>
                              ) : (
                                <p className="truncate text-[12px] text-ink/45 md:hidden">{l.contact}</p>
                              )}
                            </div>
                          </div>
                          <p className="hidden items-center gap-0.5 text-[13.5px] tabular-nums text-ink md:flex">{l.contact}<CopyButton text={l.contact} label={t.copy} /></p>
                          <span className="hidden md:block"><span className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11.5px] font-medium text-ink/65">{sourceLabel(l.source, lang)}</span></span>
                          <div className="hidden md:block">
                            <p className="text-[13px] font-medium text-ink">{relTime(l.at, lang)}</p>
                            <p className="text-[11.5px] text-ink/40">{formatDateTime(l.at, lang)}</p>
                          </div>
                          <p className="shrink-0 whitespace-nowrap text-right text-[11.5px] leading-relaxed text-ink/45 md:hidden">{relTime(l.at, lang)}<br />{sourceLabel(l.source, lang)}</p>
                          <div className="col-span-2 flex items-center gap-2 pl-[50px] md:col-span-1 md:justify-end md:gap-1.5 md:pl-0">
                            <a href={telHref(l.contact)} aria-label={`${t.call} ${l.name}`} title={t.call} className="flex h-10 w-10 shrink-0 items-center md:h-9 md:w-9 justify-center rounded-full border border-ink/10 text-ink/60 transition hover:border-ink/30 hover:text-ink"><Icon name="phone" size={15} /></a>
                            <a href={waHref(l.contact, greeting)} target="_blank" rel="noreferrer" aria-label={`${t.wa} ${l.name}`} title={t.wa} className="flex h-10 w-10 shrink-0 items-center md:h-9 md:w-9 justify-center rounded-full border border-ink/10 text-ink/60 transition hover:border-ink/30 hover:text-ink"><Icon name="whatsapp" size={15} /></a>
                            <Button size="sm" variant={orderId ? 'outline' : 'ink'} icon="arrowRight" onClick={() => start(l)} className="flex-1 max-md:!h-10 md:flex-none">{t.book}</Button>
                          </div>
                        </div>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
