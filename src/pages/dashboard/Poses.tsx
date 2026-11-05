import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, Card, Modal } from '../../components/ui'
import { EASE, Reveal } from '../../components/motion'
import { HowToPose, PoseImage } from '../../components/poses'
import { eventByKey } from '../../lib/data'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { poseById, posesFor, type PoseDef } from '../../lib/poses'
import { paidTotal, useMyOrder, useStore, type Order, type PosePlan } from '../../lib/store'
import { toast, useTitle } from '../../lib/ui'
import { FloatingBar, PageIntro, TamilCorners } from './shared'

/*
 * The client's pose guide — step one once the advance is paid. One pose at a
 * time: the illustration, how to pose it, and "Not for me" / "I like it".
 * When every pose is rated the client sends the picks to the studio, and the
 * assigned crew get the shot list.
 */

const copy = {
  eyebrow: { en: 'Step 1 · Pose guide', ta: 'படி 1 · போஸ் வழிகாட்டி' },
  title: { en: 'Choose the poses you love', ta: 'உங்களுக்குப் பிடித்த போஸ்களைத் தேர்ந்தெடுங்கள்' },
  lead: { en: 'Your photographers picked these for your {event}. Tap “I like it” or “Not for me” on each, and we’ll plan the shoot around your favourites.', ta: 'உங்கள் {event}-க்காக எங்கள் கலைஞர்கள் தேர்ந்தெடுத்தவை இவை. ஒவ்வொன்றிலும் “பிடித்திருக்கிறது” அல்லது “வேண்டாம்” என்று தொடுங்கள் — உங்களுக்குப் பிடித்தவற்றைச் சுற்றியே படப்பிடிப்பைத் திட்டமிடுவோம்.' },
  rated: { en: 'rated', ta: 'மதிப்பிடப்பட்டது' },
  of: { en: 'of', ta: '/' },
  pose: { en: 'Pose', ta: 'போஸ்' },
  no: { en: 'Not for me', ta: 'வேண்டாம்' },
  yes: { en: 'I like it', ta: 'பிடித்திருக்கிறது' },
  liked: { en: 'Liked', ta: 'பிடித்தது' },
  skipped: { en: 'Not for me', ta: 'வேண்டாம்' },
  prev: { en: 'Previous pose', ta: 'முந்தைய போஸ்' },
  next: { en: 'Next pose', ta: 'அடுத்த போஸ்' },
  keys: { en: 'Tip: use ← and → on your keyboard', ta: 'குறிப்பு: விசைப்பலகையில் ← → பயன்படுத்தலாம்' },
  all: { en: 'All poses', ta: 'அனைத்து போஸ்களும்' },
  progress: { en: '{r} of {n} rated · {l} liked', ta: '{n}-ல் {r} மதிப்பிடப்பட்டது · {l} பிடித்தவை' },
  rateAll: { en: 'Rate every pose to send', ta: 'அனுப்ப அனைத்தையும் மதிப்பிடுங்கள்' },
  send: { en: 'Send to the studio', ta: 'ஸ்டுடியோவுக்கு அனுப்பு' },
  confirmTitle: { en: 'Send your picks?', ta: 'உங்கள் தேர்வை அனுப்பலாமா?' },
  confirmBody: { en: '{l} poses go to your photographers as the shot list. To change them later, just WhatsApp the studio.', ta: '{l} போஸ்கள் படப் பட்டியலாக உங்கள் கலைஞர்களுக்குச் செல்லும். பின்னர் மாற்ற, ஸ்டுடியோவுக்கு வாட்ஸ்அப் செய்யுங்கள்.' },
  noLikes: { en: 'You haven’t liked any pose yet. We’ll still plan natural candids, or go back and pick a few.', ta: 'இன்னும் எந்த போஸும் பிடித்ததாகக் குறிக்கவில்லை. இயல்பான படங்களைத் திட்டமிடுவோம், அல்லது சிலவற்றைத் தேர்ந்தெடுங்கள்.' },
  cancel: { en: 'Keep choosing', ta: 'தொடர்ந்து தேர்வு செய்' },
  sentToast: { en: 'Sent! Your photographers have the shot list.', ta: 'அனுப்பப்பட்டது! கலைஞர்களிடம் படப் பட்டியல் உள்ளது.' },

  doneEyebrow: { en: 'Pose guide · sent', ta: 'போஸ் வழிகாட்டி · அனுப்பப்பட்டது' },
  doneTitle: { en: 'Your shot list is with the team', ta: 'உங்கள் படப் பட்டியல் குழுவிடம் உள்ளது' },
  doneLead: { en: 'Sent on {date}. Your photographers will study these poses before the day. Need a change? WhatsApp us and we’ll reopen it.', ta: '{date} அன்று அனுப்பப்பட்டது. விழாவுக்கு முன் கலைஞர்கள் இவற்றைப் படிப்பார்கள். மாற்றம் வேண்டுமா? வாட்ஸ்அப் செய்யுங்கள், மீண்டும் திறப்போம்.' },
  yourPicks: { en: 'Your picks', ta: 'உங்கள் தேர்வுகள்' },
  passed: { en: 'You passed on', ta: 'வேண்டாம் என்றவை' },
  whatsapp: { en: 'WhatsApp the studio', ta: 'ஸ்டுடியோவுக்கு வாட்ஸ்அப்' },

  lockedEyebrow: { en: 'Step 1 · Pose guide', ta: 'படி 1 · போஸ் வழிகாட்டி' },
  lockedTitle: { en: 'Your pose guide opens after the advance', ta: 'முன்பணம் செலுத்தியதும் போஸ் வழிகாட்டி திறக்கும்' },
  lockedBody: { en: 'Once your advance is in, your photographers hand-pick poses for your {event}. You’ll choose the ones you love here, before the day.', ta: 'முன்பணம் வந்ததும், உங்கள் {event}-க்கான போஸ்களை எங்கள் கலைஞர்கள் தேர்ந்தெடுப்பார்கள். விழாவுக்கு முன் பிடித்தவற்றை இங்கே தேர்வு செய்யலாம்.' },
  preparingTitle: { en: 'Your photographers are picking poses', ta: 'உங்கள் கலைஞர்கள் போஸ்களைத் தேர்வு செய்கிறார்கள்' },
  preparingBody: { en: 'Thank you for the advance. We’ll WhatsApp you as soon as your pose guide is ready.', ta: 'முன்பணத்திற்கு நன்றி. போஸ் வழிகாட்டி தயாரானதும் வாட்ஸ்அப்பில் தெரிவிப்போம்.' },
  billing: { en: 'View billing', ta: 'கட்டணம் பார்க்க' },
}

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

export default function Poses() {
  useTitle({ en: 'Pose guide', ta: 'போஸ் வழிகாட்டி' })
  const order = useMyOrder()
  if (!order) return null
  const plan = order.poses
  if (!plan) return <NotYet order={order} />
  if (plan.submittedAt) return <Chosen order={order} plan={plan} />
  return <Rater key={plan.sentAt} order={order} plan={plan} />
}

const resolve = (plan: PosePlan) => plan.ids.map(poseById).filter((p): p is PoseDef => !!p)

// ─── Rating ──────────────────────────────────────────────────────────────────

function Rater({ order, plan }: { order: Order; plan: PosePlan }) {
  const t = useT(copy)
  const lang = useLang()
  const rate = useStore(s => s.ratePose)
  const submit = useStore(s => s.submitPoses)
  const poses = useMemo(() => resolve(plan), [plan])
  const firstOpen = poses.findIndex(p => !plan.picks[p.id])
  const [i, setI] = useState(firstOpen < 0 ? 0 : firstOpen)
  const [flash, setFlash] = useState<'yes' | 'no' | null>(null)
  const [confirm, setConfirm] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const pose = poses[Math.min(i, poses.length - 1)]
  const rated = poses.filter(p => plan.picks[p.id]).length
  const liked = poses.filter(p => plan.picks[p.id] === 'yes').length
  const done = rated === poses.length
  const ev = eventByKey(order.eventType)

  const go = (n: number) => {
    window.clearTimeout(timer.current)
    setFlash(null)
    setI((n + poses.length) % poses.length)
  }

  const verdict = (v: 'yes' | 'no') => {
    if (!pose || flash) return
    const same = plan.picks[pose.id] === v
    rate(order.id, pose.id, same ? null : v)
    if (same) return
    setFlash(v)
    const picks = { ...plan.picks, [pose.id]: v }
    const ahead = poses.findIndex((p, k) => k > i && !picks[p.id])
    const any = poses.findIndex(p => !picks[p.id])
    const target = ahead >= 0 ? ahead : any >= 0 ? any : i
    timer.current = window.setTimeout(() => {
      setFlash(null)
      setI(target)
    }, 560)
  }

  const keyRef = useRef({ verdict, go, i })
  keyRef.current = { verdict, go, i }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowRight') keyRef.current.verdict('yes')
      else if (e.key === 'ArrowLeft') keyRef.current.verdict('no')
      else if (e.key === 'ArrowDown') keyRef.current.go(keyRef.current.i + 1)
      else if (e.key === 'ArrowUp') keyRef.current.go(keyRef.current.i - 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!pose) return null
  const pick = plan.picks[pose.id]

  const send = () => {
    submit(order.id, poses.filter(p => plan.picks[p.id] === 'yes').map(p => p.title.en))
    setConfirm(false)
    toast(t.sentToast)
  }

  return (
    <div className="pb-28 md:pb-24">
      <PageIntro
        eyebrow={t.eyebrow}
        title={t.title}
        lead={fill(t.lead, { event: ev?.name[lang] ?? '' })}
        aside={<RatedRing rated={rated} total={poses.length} label={t.rated} />}
      />

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
        {/* Card */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="relative overflow-hidden rounded-[28px] bg-mist shadow-[0_2px_4px_rgba(10,10,11,0.04),0_24px_60px_-30px_rgba(10,10,11,0.45)]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={pose.id}
                  initial={{ opacity: 0, x: 48, rotate: 2.5 }}
                  animate={{ opacity: 1, x: 0, rotate: 0 }}
                  exit={{ opacity: 0, x: flash === 'no' ? -90 : 90, rotate: flash === 'no' ? -5 : 5 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <PoseImage pose={pose} eager />
                </motion.div>
              </AnimatePresence>

              <span className="glass absolute left-3.5 top-3.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-ink/80">
                {t.pose} {i + 1} {t.of} {poses.length}
              </span>
              {pick && !flash && (
                <span className={`absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold ${pick === 'yes' ? 'bg-ruby text-white' : 'bg-ink/80 text-white'}`}>
                  <Icon name={pick === 'yes' ? 'heart' : 'x'} size={13} className={pick === 'yes' ? 'fill-white' : ''} />
                  {pick === 'yes' ? t.liked : t.skipped}
                </span>
              )}

              <AnimatePresence>
                {flash && (
                  <motion.div key={flash} className="pointer-events-none absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <motion.span
                      className={`grid h-24 w-24 place-items-center rounded-full text-white shadow-2xl ${flash === 'yes' ? 'btn-ruby' : 'bg-ink/85'}`}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    >
                      <Icon name={flash === 'yes' ? 'plus' : 'minus'} size={44} strokeWidth={2.2} />
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <VerdictButton active={pick === 'no'} tone="no" onClick={() => verdict('no')} label={t.no} />
              <VerdictButton active={pick === 'yes'} tone="yes" onClick={() => verdict('yes')} label={t.yes} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button type="button" onClick={() => go(i - 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink/55 transition hover:bg-ink/[0.04] hover:text-ink cursor-pointer">
                <Icon name="chevronLeft" size={16} />
                {t.prev}
              </button>
              <p className="hidden text-[11.5px] text-ink/35 md:block">{t.keys}</p>
              <button type="button" onClick={() => go(i + 1)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink/55 transition hover:bg-ink/[0.04] hover:text-ink cursor-pointer">
                {t.next}
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="min-w-0 lg:col-span-7">
          <Card className="relative p-5 md:p-8">
            <TamilCorners />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={pose.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
                <p className="t-label text-ink/40">
                  {t.pose} {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="t-3 mt-2 text-balance">{pose.title[lang]}</h3>
                <div className="mt-6 border-t hairline pt-6">
                  <HowToPose pose={pose} />
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>

          <div className="mt-6">
            <p className="t-label mb-3 text-ink/45">{t.all}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:gap-2.5">
              {poses.map((p, k) => {
                const v = plan.picks[p.id]
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(k)}
                    aria-label={`${t.pose} ${k + 1}: ${p.title[lang]}${v ? ` (${v === 'yes' ? t.liked : t.skipped})` : ''}`}
                    aria-current={k === i ? 'true' : undefined}
                    className={`relative overflow-hidden rounded-xl transition duration-300 cursor-pointer ${k === i ? 'ring-2 ring-ruby ring-offset-2' : 'opacity-85 hover:opacity-100'} ${v === 'no' ? 'grayscale-[0.7]' : ''}`}
                  >
                    <PoseImage pose={p} />
                    {v && (
                      <span className={`absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full text-white ${v === 'yes' ? 'bg-ruby' : 'bg-ink/75'}`}>
                        <Icon name={v === 'yes' ? 'check' : 'x'} size={11} strokeWidth={2.6} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <FloatingBar>
        <div className="glass-strong pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-full py-2 pl-5 pr-2 shadow-[0_18px_50px_-20px_rgba(10,10,11,0.45)]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-ink">{fill(t.progress, { r: rated, n: poses.length, l: liked })}</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/[0.08]">
              <motion.div className="h-full rounded-full bg-ruby" animate={{ width: `${(rated / poses.length) * 100}%` }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
          </div>
          <Button size="md" icon="send" disabled={!done} onClick={() => setConfirm(true)} ariaLabel={done ? t.send : t.rateAll} className="shrink-0">
            <span className="hidden sm:inline">{done ? t.send : t.rateAll}</span>
            <span className="sm:hidden">{t.send}</span>
          </Button>
        </div>
      </FloatingBar>

      <Modal open={confirm} onClose={() => setConfirm(false)} label={t.confirmTitle}>
        <div className="p-6 pt-7 md:p-8">
          <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-ruby text-white shadow-ruby">
            <Icon name="send" size={19} />
          </span>
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">{t.confirmTitle}</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink/55">{liked ? fill(t.confirmBody, { l: liked }) : t.noLikes}</p>
          {liked > 0 && (
            <div className="mt-5 flex -space-x-3">
              {poses.filter(p => plan.picks[p.id] === 'yes').slice(0, 7).map(p => (
                <span key={p.id} className="w-12 overflow-hidden rounded-lg ring-2 ring-white">
                  <PoseImage pose={p} />
                </span>
              ))}
            </div>
          )}
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setConfirm(false)}>{t.cancel}</Button>
            <Button icon="send" onClick={send}>{t.send}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function VerdictButton({ tone, active, onClick, label }: { tone: 'yes' | 'no'; active: boolean; onClick: () => void; label: string }) {
  const yes = tone === 'yes'
  const base = 'flex h-14 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition duration-300 active:scale-[0.97] cursor-pointer'
  const look = yes
    ? active ? 'btn-ruby text-white ring-2 ring-ruby/40 ring-offset-2' : 'btn-ruby text-white'
    : active ? 'bg-ink text-white' : 'border border-ink/15 bg-white text-ink hover:border-ink/40'
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${base} ${look}`}>
      <span className={`grid h-7 w-7 place-items-center rounded-full ${yes ? 'bg-white/20' : active ? 'bg-white/15' : 'bg-ink/[0.06]'}`}>
        <Icon name={yes ? 'plus' : 'minus'} size={16} strokeWidth={2.4} />
      </span>
      {label}
    </button>
  )
}

function RatedRing({ rated, total, label }: { rated: number; total: number; label: string }) {
  return (
    <div className="glass inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
        {rated}
      </span>
      <span className="text-[13px] text-ink/60">
        / {total} {label}
      </span>
    </div>
  )
}

// ─── Submitted ───────────────────────────────────────────────────────────────

function Chosen({ order, plan }: { order: Order; plan: PosePlan }) {
  const t = useT(copy)
  const lang = useLang()
  const wa = useStore(s => s.cms.studio.whatsapp).replace(/\D/g, '')
  const poses = useMemo(() => resolve(plan), [plan])
  const liked = poses.filter(p => plan.picks[p.id] === 'yes')
  const passed = poses.filter(p => plan.picks[p.id] !== 'yes')
  const [open, setOpen] = useState<PoseDef | null>(null)

  return (
    <div>
      <PageIntro
        eyebrow={t.doneEyebrow}
        title={t.doneTitle}
        lead={fill(t.doneLead, { date: formatDate(plan.submittedAt, lang, { day: 'numeric', month: 'long' }) })}
        aside={<Button href={`https://wa.me/${wa}?text=${encodeURIComponent(`Pose guide · ${order.id}`)}`} variant="outline" iconLeft="whatsapp">{t.whatsapp}</Button>}
      />

      <p className="t-label mb-3 text-ink/45">{t.yourPicks} · {liked.length}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {liked.map((p, k) => (
          <Reveal key={p.id} delay={Math.min(k, 8) * 0.04} y={14}>
            <button type="button" onClick={() => setOpen(p)} className="group block w-full text-left cursor-pointer">
              <span className="relative block overflow-hidden rounded-2xl">
                <PoseImage pose={p} className="transition duration-700 group-hover:scale-[1.03]" />
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ruby text-white">
                  <Icon name="heart" size={12} className="fill-white" />
                </span>
              </span>
              <span className="mt-2 block text-[14px] font-medium leading-snug text-ink">{p.title[lang]}</span>
            </button>
          </Reveal>
        ))}
      </div>

      {passed.length > 0 && (
        <div className="mt-10">
          <p className="t-label mb-3 text-ink/45">{t.passed} · {passed.length}</p>
          <div className="flex flex-wrap gap-2">
            {passed.map(p => (
              <span key={p.id} className="rounded-full border border-ink/10 px-3 py-1.5 text-[12.5px] text-ink/50">{p.title[lang]}</span>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} label={open?.title[lang] ?? ''} className="max-w-3xl">
        {open && (
          <div className="grid gap-0 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <PoseImage pose={open} eager className="md:h-full" />
            <div className="p-6 md:p-8">
              <h3 className="t-3 pr-8">{open.title[lang]}</h3>
              <div className="mt-5">
                <HowToPose pose={open} compact />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Not sent yet ────────────────────────────────────────────────────────────

function NotYet({ order }: { order: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const paid = paidTotal(order) > 0
  const ev = eventByKey(order.eventType)
  const teaser = posesFor(order.eventType, []).slice(0, 3)

  return (
    <Reveal>
      <div className="relative isolate overflow-hidden rounded-[32px] bg-ink px-5 py-12 text-white sm:px-8 md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative mx-auto h-[260px] w-[260px] sm:h-[300px] sm:w-[300px]" aria-hidden="true">
            {teaser.map((p, k) => (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 w-[46%] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
                initial={{ opacity: 0, x: '-50%', y: '-50%', rotate: 0 }}
                whileInView={{ opacity: k === 1 ? 1 : 0.75, x: `${-50 + (k - 1) * 58}%`, y: `${-50 + Math.abs(k - 1) * 8}%`, rotate: (k - 1) * 9 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE, delay: 0.15 + k * 0.08 }}
                style={{ zIndex: k === 1 ? 2 : 1, filter: k === 1 ? 'none' : 'blur(1.5px) saturate(0.7)' }}
              >
                <PoseImage pose={p} />
              </motion.div>
            ))}
            <span className="absolute bottom-0 left-1/2 z-10 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Icon name={paid ? 'clock' : 'lock'} size={20} className="text-ruby-bright" />
            </span>
          </div>
          <div className="relative text-center md:text-left">
            <TamilCorners />
            <p className="t-label text-white/50">{t.lockedEyebrow}</p>
            <h2 className="t-2 mt-3 text-balance text-white">{paid ? t.preparingTitle : t.lockedTitle}</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/65 md:mx-0">
              {paid ? t.preparingBody : fill(t.lockedBody, { event: ev?.name[lang] ?? '' })}
            </p>
            {!paid && (
              <Button to="/dashboard/billing" variant="white" icon="arrowRight" className="mt-7">
                {t.billing}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}
