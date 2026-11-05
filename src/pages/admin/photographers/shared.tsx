import { useMemo, useState } from 'react'
import { Icon } from '../../../components/Icon'
import { Segmented } from '../../../components/ui'
import { formatDate, useLang, useT, type Bi } from '../../../lib/i18n'
import { toast } from '../../../lib/ui'
import { PRODUCT } from '../../../saas/brand'
import { useStudioStore } from '../../../saas/store'
import { planTotal, type Plan, type Studio, type StudioMessage, type StudioStatus, type StudioTerm } from '../../../saas/types'
import { termFor, planOf } from '../../../saas/usage'
import { ConfirmModal, MODE_LABEL, Switch, TextInput, waHref } from '../kit'
import { paidText, type WingData } from './helpers'

/** Shared bits for the Photographers wing pages. */

export const PH = {
  wing: { en: 'Photographers', ta: 'புகைப்படக் கலைஞர்கள்' },
  studios: { en: 'Studios', ta: 'ஸ்டுடியோக்கள்' },
  approvals: { en: 'Approvals', ta: 'ஒப்புதல்கள்' },
  plans: { en: 'Plans', ta: 'திட்டங்கள்' },
  perMonth: { en: '/month', ta: '/மாதம்' },
  total: { en: 'total', ta: 'மொத்தம்' },
} satisfies Record<string, Bi>

export const STUDIO_STATUS: Record<StudioStatus, Bi> = {
  pending: { en: 'Payment pending', ta: 'கட்டணம் நிலுவையில்' },
  active: { en: 'Active', ta: 'செயலில்' },
  paused: { en: 'Paused', ta: 'இடைநிறுத்தம்' },
  cancelled: { en: 'Cancelled', ta: 'ரத்து' },
}

const TONE: Record<StudioStatus, string> = {
  pending: 'bg-ruby text-white',
  active: 'bg-ink/[0.06] text-ink',
  paused: 'bg-ruby-soft text-ruby-deep',
  cancelled: 'border border-ink/15 text-ink/50',
}

export function StudioStatusPill({ status, className = '' }: { status: StudioStatus; className?: string }) {
  const lang = useLang()
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[5px] text-[11.5px] font-semibold leading-none ${TONE[status]} ${className}`}>
      {status === 'active' ? <Icon name="check" size={12} strokeWidth={2.4} /> : <span className={`h-1.5 w-1.5 rounded-full ${status === 'pending' ? 'bg-white' : status === 'paused' ? 'bg-ruby' : 'bg-ink/30'}`} />}
      {STUDIO_STATUS[status][lang]}
    </span>
  )
}

/** "₹999/month · ₹5,994 total" */
export function PlanPrice({ plan, className = '' }: { plan: Plan; className?: string }) {
  const lang = useLang()
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 tabular-nums ${className}`}>
      <span>₹{plan.pricePerMonth.toLocaleString('en-IN')}{PH.perMonth[lang]}</span>
      <span className="text-ink/45">· ₹{planTotal(plan).toLocaleString('en-IN')} {PH.total[lang]}</span>
    </span>
  )
}

/** Everything the wing's helpers need, from the studio store. */
export function useWingData(): WingData {
  const studios = useStudioStore(s => s.studios)
  const events = useStudioStore(s => s.events)
  const proofs = useStudioStore(s => s.proofs)
  const activity = useStudioStore(s => s.activity)
  const terms = useStudioStore(s => s.terms)
  const plans = useStudioStore(s => s.plans)
  return useMemo(() => ({ studios, events, proofs, activity, terms, plans }), [studios, events, proofs, activity, terms, plans])
}

/** Opens WhatsApp with the text prefilled and records it in the studio's message log. */
export function notifyWa(studio: Studio, body: string, template: StudioMessage['template']) {
  window.open(waHref(studio.whatsapp || studio.phone, body), '_blank', 'noopener')
  useStudioStore.getState().logStudioMessage({ studioId: studio.id, to: studio.whatsapp || studio.phone, body, template })
}

const PAY = {
  title: { en: 'Mark payment received', ta: 'கட்டணம் பெறப்பட்டது' },
  body: { en: 'Starts the term and lets the studio sign in.', ta: 'காலம் தொடங்கும்; ஸ்டுடியோ உள்நுழையலாம்.' },
  until: { en: 'Active until', ta: 'வரை செயலில்' },
  mode: { en: 'Paid by', ta: 'செலுத்திய முறை' },
  note: { en: 'Note (UTR, receipt no.)', ta: 'குறிப்பு (UTR, ரசீது எண்)' },
  notify: { en: 'Tell them on WhatsApp', ta: 'WhatsApp-ல் தெரிவி' },
  paid: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  done: { en: 'Marked paid', ta: 'கட்டணம் உறுதிசெய்யப்பட்டது' },
} satisfies Record<string, Bi>

/** 👍 Paid: mode + note, then markPaid() and an optional WhatsApp. Used by Approvals and StudioDetail. */
export function MarkPaidModal({ studio, open, onClose }: { studio: Studio; open: boolean; onClose: () => void }) {
  const t = useT(PAY)
  const lang = useLang()
  const plans = useStudioStore(s => s.plans)
  const [mode, setMode] = useState<StudioTerm['mode']>('upi')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const plan = planOf(plans, studio.sub.plan)
  const running = studio.sub.payment === 'paid' && !!studio.sub.endsAt && new Date(studio.sub.endsAt) > new Date()
  const term = termFor(studio, plans, running ? studio.sub.endsAt! : new Date().toISOString())
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      icon="check"
      title={t.title}
      body={<><span className="font-medium text-ink">{studio.name}</span> · {plan.name} · ₹{term.amount.toLocaleString('en-IN')}<br />{t.body} {t.until} {formatDate(term.to, lang)}.</>}
      confirmLabel={`👍 ${t.paid}`}
      onConfirm={() => {
        useStudioStore.getState().markPaid(studio.id, mode, note)
        if (notify) notifyWa(studio, paidText(studio, plan, term.to, PRODUCT.name), 'paid')
        setNote('')
        toast(`${t.done} · ${studio.name}`)
      }}
    >
      <div className="space-y-3">
        <div>
          <p className="t-label mb-1.5 text-ink/50">{t.mode}</p>
          <Segmented<StudioTerm['mode']> value={mode} onChange={setMode} size="sm" options={(['upi', 'bank', 'cash'] as const).map(m => ({ value: m, label: MODE_LABEL[m][lang] }))} />
        </div>
        <TextInput label={t.note} value={note} onChange={setNote} />
        <label className="flex items-center justify-between gap-3 text-[13.5px] text-ink/70">
          {t.notify}
          <Switch checked={notify} onChange={setNotify} label={t.notify} size="sm" />
        </label>
      </div>
    </ConfirmModal>
  )
}
