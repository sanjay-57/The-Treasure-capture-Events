import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { useLenis } from 'lenis/react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, EmptyState, Modal, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import { ROLES } from '../../lib/data'
import { formatDate, useLang, useT, type Lang } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { normalizePhone, useStore, type OutboxMessage } from '../../lib/store'
import { AC, Avatar, FormSelect, PageHeader, SearchInput, WaBubble, relTime, telHref, useIsPhone } from './kit'

const copy = {
  eyebrow: { en: 'WhatsApp Business · Cloud API', ta: 'WhatsApp Business · Cloud API' },
  title: { en: 'Messages', ta: 'செய்திகள்' },
  sub: { en: 'Every template and message sent to clients and crew. Stage changes and dispatches post here automatically.', ta: 'வாடிக்கையாளர்களுக்கும் குழுவினருக்கும் அனுப்பிய அனைத்துச் செய்திகளும். நிலை மாற்றங்களும் பணி அனுப்புதலும் தானாகவே இங்கே பதிவாகும்.' },
  compose: { en: 'New message', ta: 'புதிய செய்தி' },
  search: { en: 'Search conversations', ta: 'உரையாடல்களைத் தேடு' },
  clients: { en: 'Clients', ta: 'வாடிக்கையாளர்' },
  crew: { en: 'Crew', ta: 'குழு' },
  noConvos: { en: 'The outbox is empty', ta: 'அவுட்பாக்ஸ் காலியாக உள்ளது' },
  noConvosBody: { en: 'Advance an order, record a payment or dispatch crew — the WhatsApp template will appear here. Or start a conversation yourself.', ta: 'ஆர்டர் நிலையை மாற்றுங்கள், கட்டணம் பதிவு செய்யுங்கள் அல்லது குழுவை அனுப்புங்கள் — WhatsApp செய்தி இங்கே தோன்றும். அல்லது நீங்களே உரையாடலைத் தொடங்குங்கள்.' },
  pick: { en: 'Select a conversation', ta: 'ஒரு உரையாடலைத் தேர்ந்தெடுக்கவும்' },
  pickBody: { en: 'Messages are sent from the studio’s verified WhatsApp Business number.', ta: 'ஸ்டுடியோவின் சரிபார்க்கப்பட்ட WhatsApp Business எண்ணிலிருந்து செய்திகள் அனுப்பப்படுகின்றன.' },
  placeholder: { en: 'Write a message…', ta: 'செய்தியை எழுதுங்கள்…' },
  send: { en: 'Send', ta: 'அனுப்பு' },
  sent: { en: 'Message sent on WhatsApp', ta: 'WhatsApp-ல் செய்தி அனுப்பப்பட்டது' },
  quick: { en: 'Quick replies', ta: 'விரைவுப் பதில்கள்' },
  back: { en: 'Conversations', ta: 'உரையாடல்கள்' },
  call: { en: 'Call', ta: 'அழை' },
  hint: { en: 'Enter to send · Shift + Enter for a new line', ta: 'அனுப்ப Enter · புதிய வரிக்கு Shift + Enter' },
  newTitle: { en: 'Start a conversation', ta: 'உரையாடலைத் தொடங்கு' },
  to: { en: 'Recipient', ta: 'பெறுநர்' },
  audience: { en: 'Send to', ta: 'அனுப்ப வேண்டியவர்' },
  open: { en: 'Open chat', ta: 'உரையாடலைத் திற' },
  session: { en: '24-hour session open', ta: '24 மணி நேர அமர்வு திறந்துள்ளது' },
  msgs: { en: 'messages', ta: 'செய்திகள்' },
  manual: { en: 'You', ta: 'நீங்கள்' },
}

const QUICK: Record<'client' | 'worker', { label: { en: string; ta: string }; body: string }[]> = {
  client: [
    { label: { en: 'Payment reminder', ta: 'கட்டண நினைவூட்டல்' }, body: 'வணக்கம்! A gentle reminder that the balance on your invoice is due. You can pay by UPI or at the studio. நன்றி — The Treasure Capture Events' },
    { label: { en: 'Confirm meeting', ta: 'சந்திப்பு உறுதி' }, body: 'வணக்கம்! Could you confirm a convenient time for our pre-event meeting this week? We will walk through rituals, shot list and timings.' },
    { label: { en: 'Photos ready', ta: 'படங்கள் தயார்' }, body: 'வணக்கம்! Your proofing gallery is ready. Please pick your favourites here: treasurecaptureevents.in/dashboard/photos' },
    { label: { en: 'Thank you', ta: 'நன்றி' }, body: 'மிக்க நன்றி! It was an honour to capture your celebration. We would love a Google review when you have a moment.' },
  ],
  worker: [
    { label: { en: 'Reporting time', ta: 'வருகை நேரம்' }, body: 'Please report 45 minutes before the muhurtham. Carry the second body and the 70–200.' },
    { label: { en: 'Upload reminder', ta: 'பதிவேற்ற நினைவூட்டல்' }, body: 'Reminder: please upload RAW files to the studio drive within 24 hours of the event.' },
    { label: { en: 'Availability check', ta: 'கிடைப்பு சரிபார்ப்பு' }, body: 'Are you available for a shoot next weekend? Reply YES / NO.' },
  ],
}

interface Convo { key: string; name: string; phone: string; audience: 'client' | 'worker'; msgs: OutboxMessage[]; orderIds: string[] }

export default function Messages() {
  const t = useT(copy)
  const lang = useLang()
  const outbox = useStore(s => s.outbox)
  const [filter, setFilter] = useState<'all' | 'client' | 'worker'>('all')
  const [q, setQ] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [draftConvo, setDraftConvo] = useState<Convo | null>(null)
  const [composing, setComposing] = useState(false)
  const phone = useIsPhone()
  const lenis = useLenis()
  useTitle({ en: 'Messages', ta: 'செய்திகள்' })

  const convos = useMemo(() => {
    const map = new Map<string, Convo>()
    for (const m of [...outbox].reverse()) {
      const key = normalizePhone(m.to) || m.to
      const c = map.get(key) ?? { key, name: m.toName, phone: m.to, audience: m.audience, msgs: [], orderIds: [] }
      c.msgs.push(m)
      if (m.orderId && !c.orderIds.includes(m.orderId)) c.orderIds.push(m.orderId)
      map.set(key, c)
    }
    return [...map.values()].sort((a, b) => b.msgs[b.msgs.length - 1].at.localeCompare(a.msgs[a.msgs.length - 1].at))
  }, [outbox])

  const list = convos.filter(c => (filter === 'all' || c.audience === filter) && (!q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.phone.includes(q.trim())))
  const current = convos.find(c => c.key === active) ?? (draftConvo && draftConvo.key === active ? draftConvo : null)

  // Desktop opens the most recent conversation by default.
  useEffect(() => {
    if (!active && convos.length && window.matchMedia('(min-width: 1024px)').matches) setActive(convos[0].key)
  }, [active, convos])

  // Phones open the thread as a full-screen sheet, so park the page scroll underneath it.
  const sheet = phone && !!current
  useEffect(() => {
    if (!sheet) return
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
    }
  }, [sheet, lenis])

  const counts = { client: convos.filter(c => c.audience === 'client').length, worker: convos.filter(c => c.audience === 'worker').length }

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} actions={<Button size="sm" iconLeft="edit" onClick={() => setComposing(true)} className="max-md:!h-10 max-md:w-full">{t.compose}</Button>} />

      {convos.length === 0 && !current ? (
        <EmptyState icon="whatsapp" title={t.noConvos} body={t.noConvosBody} action={<Button variant="ink" size="sm" iconLeft="edit" onClick={() => setComposing(true)}>{t.compose}</Button>} />
      ) : (
        <div className="flex overflow-hidden rounded-[22px] border hairline bg-white shadow-[0_1px_2px_rgba(10,10,11,0.04),0_18px_40px_-28px_rgba(10,10,11,0.3)] md:h-[calc(100svh-150px)] md:min-h-[540px] md:rounded-[26px] lg:h-[calc(100svh-290px)]">
          {/* List */}
          <aside className={`w-full shrink-0 flex-col border-r hairline lg:flex lg:w-[340px] ${current && !phone ? 'hidden' : 'flex'}`}>
            <div className="space-y-2.5 border-b hairline p-3">
              <SearchInput value={q} onChange={setQ} placeholder={t.search} />
              <Segmented size="sm" value={filter} onChange={setFilter} className="w-full [&>button]:h-9 [&>button]:flex-1 [&>button]:px-2 md:[&>button]:h-7 md:[&>button]:px-3" options={[{ value: 'all', label: `${AC.all[lang]} · ${convos.length}` }, { value: 'client', label: `${t.clients} · ${counts.client}` }, { value: 'worker', label: `${t.crew} · ${counts.worker}` }]} />
            </div>
            <ul className="flex-1 p-1.5 md:overflow-y-auto" data-lenis-prevent>
              {list.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-ink/40">{AC.noResults[lang]}</li>}
              {list.map(c => {
                const last = c.msgs[c.msgs.length - 1]
                const on = c.key === active
                return (
                  <li key={c.key}>
                    <button type="button" onClick={() => setActive(c.key)} className={`relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition cursor-pointer ${on ? '' : 'hover:bg-ink/[0.03]'}`}>
                      {on && <motion.span layoutId="msg-active" className="absolute inset-0 rounded-2xl bg-ink/[0.05]" transition={{ type: 'spring', stiffness: 420, damping: 38 }} />}
                      <span className="relative">
                        <Avatar name={c.name} size={44} tone={c.audience === 'client' ? 'ink' : 'soft'} />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-white text-ink/60"><Icon name={c.audience === 'client' ? 'heart' : 'camera'} size={10} /></span>
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate text-[14px] font-semibold text-ink">{c.name}</span>
                          <span className="ml-auto shrink-0 text-[11px] text-ink/40">{relTime(last.at, lang)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span className="shrink-0 rounded bg-ink/[0.05] px-1 font-mono text-[9.5px] text-ink/50">{last.template}</span>
                          <span className="truncate text-[12.5px] text-ink/50">{last.body.replace(/\n/g, ' ')}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Thread */}
          <section className={`min-w-0 flex-1 flex-col ${current && !phone ? 'flex' : 'hidden lg:flex'}`}>
            {current && !phone ? <Thread key={current.key} c={current} onBack={() => setActive(null)} /> : (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-ink/[0.04] text-ink/35"><Icon name="whatsapp" size={24} /></span>
                <p className="text-[16px] font-semibold text-ink">{t.pick}</p>
                <p className="mt-1.5 max-w-xs text-[13px] text-ink/50">{t.pickBody}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {sheet && current && (
              <motion.div
                key="thread-sheet"
                role="dialog"
                aria-modal="true"
                aria-label={current.name}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.45, ease: EASE }}
                className="fixed inset-0 z-[75] flex flex-col bg-white pt-[env(safe-area-inset-top)]"
              >
                <Thread key={current.key} c={current} onBack={() => setActive(null)} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <ComposeModal
        open={composing}
        onClose={() => setComposing(false)}
        onPick={c => {
          const existing = convos.find(x => x.key === c.key)
          if (!existing) setDraftConvo(c)
          setActive(c.key)
          setComposing(false)
        }}
      />
    </div>
  )
}

function Thread({ c, onBack }: { c: Convo; onBack: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const send = useStore(s => s.sendMessage)
  const workers = useStore(s => s.workers)
  const [text, setText] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const worker = c.audience === 'worker' ? workers.find(w => normalizePhone(w.phone) === c.key) : undefined

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [c.msgs.length])

  const submit = () => {
    const body = text.trim()
    if (!body) return
    send({ audience: c.audience, to: c.phone, toName: c.name, template: 'manual_text', body, orderId: c.orderIds[c.orderIds.length - 1] })
    setText('')
    toast(t.sent)
  }

  const groups = useMemo(() => {
    const out: { day: string; items: OutboxMessage[] }[] = []
    for (const m of c.msgs) {
      const day = m.at.slice(0, 10)
      const g = out[out.length - 1]
      if (g && g.day === day) g.items.push(m)
      else out.push({ day, items: [m] })
    }
    return out
  }, [c.msgs])

  return (
    <>
      <header className="flex items-center gap-2.5 border-b hairline px-2 py-2.5 md:gap-3 md:px-5 md:py-3">
        <button type="button" onClick={onBack} aria-label={t.back} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/60 transition hover:bg-ink/[0.05] md:h-9 md:w-9 lg:hidden cursor-pointer"><Icon name="arrowLeft" size={18} /></button>
        <Avatar name={c.name} size={40} tone={c.audience === 'client' ? 'ink' : 'soft'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
          <p className="truncate text-[12px] text-ink/45">
            {c.phone} · {c.audience === 'client' ? AC.client[lang] : worker ? ROLES[worker.role][lang] : AC.crew[lang]}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          {c.orderIds.slice(-2).map(id => (
            <Link key={id} to={`/admin/orders/${id}`} className="rounded-full border border-ink/10 px-2.5 py-1 font-mono text-[11px] text-ink/60 transition hover:border-ruby/40 hover:text-ruby">{id}</Link>
          ))}
        </div>
        <a href={telHref(c.phone)} aria-label={t.call} title={t.call} className="flex h-10 w-10 shrink-0 items-center md:h-9 md:w-9 justify-center rounded-full text-ink/55 transition hover:bg-ink/[0.05] hover:text-ink"><Icon name="phone" size={16} /></a>
      </header>

      <div ref={scroller} className="relative flex-1 overscroll-contain overflow-y-auto bg-mist px-3 py-5 md:px-8" data-lenis-prevent>
        <div className={`pointer-events-none absolute inset-0 opacity-[0.045] ${lang === 'ta' ? 'kolam-bg' : ''}`} style={lang === 'ta' ? undefined : { backgroundImage: 'radial-gradient(rgba(10,10,11,0.9) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <p className="mx-auto w-fit rounded-full bg-white/80 px-3 py-1 text-center text-[11px] text-ink/45 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"><Icon name="lock" size={11} className="-mt-px mr-1 inline" />{t.session}</p>
          {groups.map(g => (
            <div key={g.day} className="space-y-2.5">
              <p className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">{formatDate(g.day, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              <AnimatePresence initial={false}>
                {g.items.map(m => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }} className="origin-bottom-right">
                    <WaBubble body={m.body} template={m.template} at={m.at} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t hairline bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-5 md:pb-3">
        <div className="no-scrollbar -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1" data-lenis-prevent>
          <span className="t-label flex shrink-0 items-center pr-1 text-ink/35">{t.quick}</span>
          {QUICK[c.audience].map(qr => (
            <button key={qr.body} type="button" onClick={() => setText(qr.body)} className="shrink-0 rounded-full border border-ink/10 px-3 py-2 text-[12px] font-medium text-ink/60 md:py-1 transition hover:border-ruby/40 hover:text-ruby cursor-pointer">
              {qr.label[lang]}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="msg-composer">{t.placeholder}</label>
          <textarea
            id="msg-composer"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            rows={Math.min(5, Math.max(1, text.split('\n').length + Math.floor(text.length / 70)))}
            placeholder={t.placeholder}
            className="max-h-40 min-h-[44px] min-w-0 flex-1 resize-none rounded-[22px] border border-ink/10 bg-mist/60 px-4 py-2.5 text-[16px] md:text-[14px] leading-relaxed text-ink outline-none transition placeholder:text-ink/35 focus:border-ruby focus:bg-white focus:ring-4 focus:ring-ruby/10"
          />
          <button type="button" onClick={submit} disabled={!text.trim()} aria-label={t.send} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ruby text-white shadow-ruby transition hover:bg-ruby-bright active:scale-95 disabled:bg-ink/15 disabled:shadow-none cursor-pointer disabled:cursor-default">
            <Icon name="send" size={18} />
          </button>
        </div>
        <p className="mt-1.5 hidden text-[11px] text-ink/35 md:block">{t.hint}</p>
      </div>
    </>
  )
}

function ComposeModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (c: Convo) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const orders = useStore(s => s.orders)
  const workers = useStore(s => s.workers)
  const [aud, setAud] = useState<'client' | 'worker'>('client')
  const options = useMemo(() => recipients(aud, orders, workers, lang), [aud, orders, workers, lang])
  const [sel, setSel] = useState('')
  const chosen = options.find(o => o.value === sel) ?? options[0]

  return (
    <Modal open={open} onClose={onClose} label={t.newTitle}>
      <div className="p-6 pt-7 md:p-8">
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"><Icon name="whatsapp" size={20} /></span>
        <h2 className="pr-10 text-[20px] font-semibold tracking-tight text-ink">{t.newTitle}</h2>
        <div className="mt-5 space-y-4">
          <div>
            <p className="t-label mb-1.5 text-ink/50">{t.audience}</p>
            <Segmented size="sm" value={aud} onChange={v => { setAud(v); setSel('') }} options={[{ value: 'client', label: t.clients }, { value: 'worker', label: t.crew }]} />
          </div>
          {chosen && <FormSelect label={t.to} value={chosen.value} onChange={setSel} options={options.map(o => ({ value: o.value, label: o.label }))} />}
        </div>
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{AC.cancel[lang]}</Button>
          <Button variant="ink" icon="arrowRight" disabled={!chosen} onClick={() => chosen && onPick(chosen.convo)}>{t.open}</Button>
        </div>
      </div>
    </Modal>
  )
}

function recipients(aud: 'client' | 'worker', orders: ReturnType<typeof useStore.getState>['orders'], workers: ReturnType<typeof useStore.getState>['workers'], lang: Lang) {
  if (aud === 'worker') {
    return workers.map(w => ({ value: w.id, label: `${w.name[lang]} · ${ROLES[w.role][lang]}`, convo: { key: normalizePhone(w.phone), name: w.name.en, phone: w.phone, audience: 'worker' as const, msgs: [], orderIds: [] } }))
  }
  return orders.map(o => ({ value: o.id, label: `${o.client.name} · ${o.id}`, convo: { key: normalizePhone(o.client.contact), name: o.client.name, phone: o.client.contact, audience: 'client' as const, msgs: [], orderIds: [o.id] } }))
}
