import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { TamilOnly, Vilakku } from '../../components/tamil'
import { formatDate, formatDateTime, useLang, useT, type Bi } from '../../lib/i18n'
import { ROLES, STATUS_META, STATUS_ORDER, eventByKey, statusName, type OrderStatus } from '../../lib/data'
import { useMyOrder, useStore, type Order } from '../../lib/store'
import { useTitle } from '../../lib/ui'
import { PageIntro, StageBar, stageIdx } from './shared'

const copy = {
  eyebrow: { en: 'Order tracker', ta: 'ஆர்டர் நிலை' },
  title: { en: 'Every stage, as it happens.', ta: 'ஒவ்வொரு கட்டமும், உடனுக்குடன்.' },
  lead: {
    en: 'From the first call to the album on your shelf. We update this the moment anything moves — and send you a WhatsApp too.',
    ta: 'முதல் அழைப்பிலிருந்து ஆல்பம் உங்கள் கைக்கு வரும் வரை. ஒவ்வொரு மாற்றமும் உடனே இங்கே தெரியும் — வாட்ஸ்அப்பிலும் அறிவிப்போம்.',
  },
  yourMove: { en: 'Your next step', ta: 'உங்கள் அடுத்த படி' },
  done: { en: 'Done', ta: 'முடிந்தது' },
  now: { en: 'In progress', ta: 'நடைபெறுகிறது' },
  upcoming: { en: 'Upcoming', ta: 'வரவிருக்கிறது' },
  team: { en: 'Team', ta: 'குழு' },
  eventOn: { en: 'Event day', ta: 'விழா நாள்' },
  picked: { en: 'photos selected', ta: 'படங்கள் தேர்வு' },
  albumSaved: { en: 'Album design saved', ta: 'ஆல்பம் வடிவமைப்பு சேமிக்கப்பட்டது' },
  invoice: { en: 'Invoice', ta: 'ரசீது' },
  courier: { en: 'Dispatched via', ta: 'அனுப்பியது' },
  tracking: { en: 'Tracking', ta: 'கண்காணிப்பு எண்' },
  jump: { en: 'Jump to stage', ta: 'நிலைக்குச் செல்' },
  stage: { en: 'Stage', ta: 'நிலை' },
  of: { en: 'of', ta: '/' },
  next: { en: 'Up next', ta: 'அடுத்து' },
}

/** What the client should do at each stage. */
const TODO: Record<OrderStatus, { body: Bi; cta?: { label: Bi; to: string } }> = {
  ENQUIRY: {
    body: { en: 'Nothing needed yet — we’ll call within a day to confirm your date. Keep your phone handy.', ta: 'இப்போது எதுவும் தேவையில்லை — தேதியை உறுதிசெய்ய ஒரு நாளுக்குள் அழைப்போம். கைபேசியை அருகில் வைத்திருங்கள்.' },
  },
  TEAM_MEETING: {
    body: { en: 'Send us any must-have shots, family members to feature, or ritual details on WhatsApp.', ta: 'கட்டாயம் வேண்டிய படங்கள், முக்கிய உறவினர்கள், சடங்கு விவரங்களை வாட்ஸ்அப்பில் அனுப்புங்கள்.' },
  },
  BRIDE_GROOM_MEETING: {
    body: { en: 'Meet us in person or on video to walk through rituals, timings and the shot list.', ta: 'சடங்குகள், நேரம், படப் பட்டியல் பற்றி நேரிலோ வீடியோவிலோ எங்களைச் சந்தியுங்கள்.' },
  },
  EVENT_PICTURES: {
    body: { en: 'Relax — we’re culling and colour-grading. Your proofing gallery opens in about two weeks.', ta: 'நிம்மதியாக இருங்கள் — படங்களைத் தேர்ந்து மெருகேற்றுகிறோம். சுமார் இரண்டு வாரங்களில் தேர்வு கேலரி திறக்கும்.' },
  },
  SELECT_PHOTOS: {
    body: { en: 'Heart your favourites in the proofing gallery, then submit your selection.', ta: 'தேர்வு கேலரியில் பிடித்த படங்களைக் குறித்து, உங்கள் தேர்வைச் சமர்ப்பியுங்கள்.' },
    cta: { label: { en: 'Select photos', ta: 'படங்களைத் தேர்ந்தெடு' }, to: '/dashboard/photos' },
  },
  ALBUM_CUSTOMIZATION: {
    body: { en: 'Choose the cover, paper, size and typography — the live preview shows exactly what we’ll print.', ta: 'அட்டை, தாள், அளவு, எழுத்துருவைத் தேர்ந்தெடுங்கள் — நாங்கள் அச்சிடப்போவதை நேரடி முன்னோட்டம் காட்டும்.' },
    cta: { label: { en: 'Design album', ta: 'ஆல்பம் வடிவமை' }, to: '/dashboard/album' },
  },
  BILLED: {
    body: { en: 'Settle the balance offline — UPI, bank transfer or at the studio. We dispatch as soon as it clears.', ta: 'நிலுவையை நேரடியாகச் செலுத்துங்கள் — UPI, வங்கி பரிமாற்றம் அல்லது ஸ்டுடியோவில். செலுத்தியதும் அனுப்புவோம்.' },
    cta: { label: { en: 'View invoice', ta: 'ரசீது பார்க்க' }, to: '/dashboard/billing' },
  },
  DELIVERED: {
    body: { en: 'Enjoy your album. If we did right by you, a Google review helps other families find us.', ta: 'உங்கள் ஆல்பத்தை ரசியுங்கள். எங்கள் சேவை பிடித்திருந்தால், கூகுள் மதிப்புரை மற்ற குடும்பங்களுக்கு உதவும்.' },
    cta: { label: { en: 'Leave a review', ta: 'கருத்து தெரிவி' }, to: '/dashboard/review' },
  },
}

export default function Track() {
  useTitle({ en: 'Track order', ta: 'ஆர்டர் நிலை' })
  const t = useT(copy)
  const order = useMyOrder()
  const lenis = useLenis()
  if (!order) return null

  const jump = (s: OrderStatus) => {
    const el = document.getElementById(`stage-${s}`)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: -200, duration: 1.2 })
    else el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div>
      <PageIntro eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <Stepper order={order} onJump={jump} />
      <NextStep order={order} />
      <Timeline order={order} />
    </div>
  )
}

function Stepper({ order, onJump }: { order: Order; onJump: (s: OrderStatus) => void }) {
  const t = useT(copy)
  const lang = useLang()
  const cur = stageIdx(order.status)
  const nextStage = STATUS_ORDER[cur + 1]
  return (
    <Reveal>
      {/* Phones get a compact progress card; the vertical timeline below carries the detail. */}
      <button
        type="button"
        onClick={() => onJump(order.status)}
        aria-label={`${t.jump}: ${statusName(order.status, order.eventType, lang)}`}
        className="glass block w-full rounded-[24px] p-4 text-left cursor-pointer md:hidden"
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="t-label block text-ink/45">
              {t.stage} {cur + 1} {t.of} {STATUS_ORDER.length}
            </span>
            <span className="mt-1 block text-[17px] font-semibold leading-snug text-ink">{statusName(order.status, order.eventType, lang)}</span>
          </span>
          <span className="shrink-0 pt-0.5 font-mono text-[13px] text-ink/45">{Math.round(((cur + 1) / STATUS_ORDER.length) * 100)}%</span>
        </span>
        <StageBar order={order} className="mt-3.5" />
        {nextStage && (
          <span className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ink/50">
            <Icon name="arrowRight" size={13} className="shrink-0 text-ruby" />
            <span className="min-w-0">
              {t.next}: <span className="font-medium text-ink/75">{statusName(nextStage, order.eventType, lang)}</span>
            </span>
          </span>
        )}
      </button>
      <div className="glass relative hidden overflow-hidden rounded-[28px] md:block">
        <div className="no-scrollbar overflow-x-auto" data-lenis-prevent>
          <ol className="relative flex min-w-[880px] px-6 pb-5 pt-6" aria-label={t.eyebrow}>
            {STATUS_ORDER.map((s, i) => {
              const done = i < cur
              const now = i === cur
              return (
                <li key={s} className="relative flex flex-1 flex-col items-center px-1 text-center">
                  {i < STATUS_ORDER.length - 1 && (
                    <span className="absolute left-1/2 top-[15px] h-[2px] w-full overflow-hidden bg-ink/10" aria-hidden="true">
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-ruby"
                        initial={{ width: '0%' }}
                        whileInView={{ width: i < cur ? '100%' : '0%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, ease: 'linear', delay: 0.3 + i * 0.12 }}
                      />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onJump(s)}
                    aria-label={`${t.jump}: ${statusName(s, order.eventType, lang)}`}
                    aria-current={now ? 'step' : undefined}
                    className="group flex flex-col items-center gap-2.5 cursor-pointer"
                  >
                    <motion.span
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        done ? 'border-ruby bg-ruby text-white' : now ? 'border-ruby bg-white text-ruby' : 'border-ink/15 bg-white text-ink/35'
                      }`}
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.08 }}
                    >
                      {now && <span className="absolute inset-0 rounded-full bg-ruby/30 animate-pulse-ring" />}
                      {done ? <Icon name="check" size={14} strokeWidth={2.6} /> : <span className="text-[11px] font-semibold">{i + 1}</span>}
                    </motion.span>
                    <span className={`max-w-[104px] text-[12px] leading-snug transition-colors group-hover:text-ink ${now ? 'font-semibold text-ink' : done ? 'text-ink/65' : 'text-ink/40'}`}>
                      {statusName(s, order.eventType, lang)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </Reveal>
  )
}

function NextStep({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const todo = TODO[order.status]
  // Family ceremonies meet the family rather than a couple.
  const body =
    order.status === 'BRIDE_GROOM_MEETING' && !eventByKey(order.eventType)?.couple
      ? { en: 'Meet us with the family to walk through rituals, timings and the people to capture.', ta: 'சடங்குகள், நேரம், படம்பிடிக்க வேண்டியவர்கள் பற்றி குடும்பத்துடன் எங்களைச் சந்தியுங்கள்.' }[lang]
      : todo.body[lang]
  return (
    <Reveal delay={0.05}>
      <div className="glass-ruby-tint relative mt-4 flex flex-col gap-5 overflow-hidden rounded-[24px] p-5 sm:rounded-[28px] sm:p-6 md:mt-5 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ruby text-white shadow-ruby">
            <Icon name="sparkle" size={20} />
          </span>
          <div className="min-w-0">
            <p className="t-label text-ruby">{t.yourMove}</p>
            <p className="mt-1.5 text-[16px] font-medium leading-relaxed text-ink md:text-[17px]">{body}</p>
          </div>
        </div>
        {todo.cta && (
          <Button to={todo.cta.to} icon="arrowRight" className="shrink-0 sm:self-start md:self-auto">
            {todo.cta.label[lang]}
          </Button>
        )}
        <TamilOnly>
          <Vilakku height={120} tone="ruby" className="pointer-events-none absolute -right-2 -top-3 hidden opacity-[0.12] md:block" />
        </TamilOnly>
      </div>
    </Reveal>
  )
}

function Timeline({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const cur = stageIdx(order.status)
  const railRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([])
  const dims = useRef({ height: 0, cap: 0 })

  // The ruby line follows a reading line at 60% of the viewport, but never passes the current stage.
  const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 60%', 'end 60%'] })
  const fillRaw = useMotionValue(0)
  const fill = useSpring(fillRaw, { stiffness: 120, damping: 26, mass: 0.6 })

  const update = (v: number) => fillRaw.set(Math.min(v * dims.current.height, dims.current.cap))
  useMotionValueEvent(scrollYProgress, 'change', update)

  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current
      const node = nodeRefs.current[cur]
      if (!rail || !node) return
      const r = rail.getBoundingClientRect()
      const n = node.getBoundingClientRect()
      dims.current = { height: r.height - 48, cap: n.top + n.height / 2 - r.top - 24 }
      update(scrollYProgress.get())
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (railRef.current) ro.observe(railRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, lang])

  const at = (s: OrderStatus) => [...order.history].reverse().find(h => h.status === s)?.at

  return (
    <div ref={railRef} className="relative mt-10 md:mt-16">
      {/* rail + animated fill */}
      <span className="absolute bottom-6 left-[19px] top-6 w-[2px] rounded-full bg-ink/[0.08] md:left-[27px]" aria-hidden="true" />
      <motion.span className="absolute left-[19px] top-6 w-[2px] origin-top rounded-full bg-gradient-to-b from-ruby-bright to-ruby md:left-[27px]" style={{ height: fill }} aria-hidden="true" />

      <ol className="relative space-y-3 md:space-y-4">
        {STATUS_ORDER.map((s, i) => {
          const done = i < cur
          const now = i === cur
          const when = at(s)
          return (
            <li key={s} id={`stage-${s}`} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 sm:gap-4 md:grid-cols-[56px_minmax(0,1fr)] md:gap-6">
              <div className="flex justify-center pt-6">
                <span
                  ref={el => {
                    nodeRefs.current[i] = el
                  }}
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors duration-500 md:h-12 md:w-12 ${
                    done ? 'border-ruby !bg-ruby text-white' : now ? 'border-ruby text-ruby shadow-ruby' : 'border-ink/10 text-ink/30'
                  }`}
                >
                  {now && <span className="absolute inset-0 rounded-full bg-ruby/25 animate-pulse-ring" />}
                  {done ? <Icon name="check" size={18} strokeWidth={2.4} /> : <span className="font-display text-[17px] font-semibold md:text-[19px]">{i + 1}</span>}
                </span>
              </div>

              <Reveal y={20} delay={0.03}>
                <div
                  className={`relative overflow-hidden rounded-[20px] p-4 transition-colors sm:rounded-[24px] sm:p-5 md:p-6 ${
                    now ? 'border border-ruby/20 bg-white shadow-soft' : done ? 'border hairline bg-white/70' : 'border border-dashed border-ink/10'
                  }`}
                >
                  {now && <span className="absolute inset-y-0 left-0 w-1 bg-ruby" aria-hidden="true" />}
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <h3 className={`min-w-0 text-[17px] font-semibold leading-snug sm:text-[18px] md:text-[20px] ${done || now ? 'text-ink' : 'text-ink/45'}`}>{statusName(s, order.eventType, lang)}</h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        now ? 'bg-ruby text-white' : done ? 'bg-ink/[0.06] text-ink/65' : 'text-ink/35'
                      }`}
                    >
                      {now ? t.now : done ? t.done : t.upcoming}
                    </span>
                  </div>
                  <p className={`mt-2 max-w-2xl text-[14px] leading-relaxed sm:text-[14.5px] ${done || now ? 'text-ink/60' : 'text-ink/40'}`}>{STATUS_META[s].desc[lang]}</p>
                  {when && (done || now) && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-ink/45">
                      <Icon name="clock" size={13} />
                      {formatDateTime(when, lang)}
                    </p>
                  )}
                  {(done || now) && <StageExtra order={order} status={s} />}
                </div>
              </Reveal>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Extra({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/[0.06] pt-4 text-[13px] text-ink/65">{children}</div>
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 break-words rounded-full bg-ink/[0.04] px-3 py-1.5">{children}</span>
}

/** Stage-specific facts: who's on the team, how many photos, courier details… */
function StageExtra({ order, status }: { order: Order; status: OrderStatus }) {
  const t = useT(copy)
  const lang = useLang()
  const workers = useStore(s => s.workers)

  switch (status) {
    case 'TEAM_MEETING': {
      const team = order.workerIds.map(id => workers.find(w => w.id === id)).filter(Boolean) as typeof workers
      if (!team.length) return null
      return (
        <Extra>
          <span className="t-label mr-1 text-ink/40">{t.team}</span>
          {team.map(w => (
            <Pill key={w.id}>
              <span className="font-medium text-ink">{w.name[lang]}</span>
              <span className="text-ink/45">· {ROLES[w.role][lang]}</span>
            </Pill>
          ))}
        </Extra>
      )
    }
    case 'EVENT_PICTURES':
      return order.date ? (
        <Extra>
          <Pill>
            <Icon name="calendar" size={13} className="text-ruby" />
            {t.eventOn}: <span className="font-medium text-ink">{formatDate(order.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </Pill>
        </Extra>
      ) : null
    case 'SELECT_PHOTOS':
      return order.selection.length ? (
        <Extra>
          <Pill>
            <Icon name="heart" size={13} className="fill-ruby text-ruby" />
            <span className="font-medium text-ink">{order.selection.length}</span> {t.picked}
          </Pill>
        </Extra>
      ) : null
    case 'ALBUM_CUSTOMIZATION':
      return order.album ? (
        <Extra>
          <Pill>
            <Icon name="book" size={13} className="text-ruby" />
            {t.albumSaved} · {formatDate(order.album.submittedAt, lang)}
          </Pill>
        </Extra>
      ) : null
    case 'BILLED':
      return (
        <Extra>
          <Pill>
            <Icon name="receipt" size={13} className="text-ruby" />
            {t.invoice}: <span className="font-mono text-ink">{order.invoiceId}</span>
          </Pill>
        </Extra>
      )
    case 'DELIVERED':
      return order.delivery ? (
        <Extra>
          <Pill>
            <Icon name="truck" size={13} className="text-ruby" />
            {t.courier} <span className="font-medium text-ink">{order.delivery.courier}</span>
          </Pill>
          <Pill>
            {t.tracking}: <span className="font-mono text-ink">{order.delivery.tracking}</span>
          </Pill>
        </Extra>
      ) : null
    default:
      return null
  }
}
