import { useState } from 'react'
import { Link } from 'react-router'
import { Button, EmptyState } from '../../../components/ui'
import { formatDateTime, useLang, useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { PRODUCT } from '../../../saas/brand'
import { useStudioStore } from '../../../saas/store'
import { StudioMark } from '../../../saas/theme'
import { planTotal, type PlanKey, type Studio } from '../../../saas/types'
import { GRACE_DAYS, deriveStatus, expiredOn, graceLeftDays, planOf } from '../../../saas/usage'
import { ConfirmModal, FormSelect, Meta, PageHeader, Panel, relTime, telHref } from '../kit'
import { MarkPaidModal, PH, PlanPrice } from './shared'

const copy = {
  title: { en: 'Approvals', ta: 'ஒப்புதல்கள்' },
  sub: { en: `New photographers wait here until their payment is confirmed. Mark Paid to let them sign in to ${PRODUCT.name}, or decline.`, ta: `கட்டணம் உறுதியாகும் வரை புதிய பதிவுகள் இங்கே காத்திருக்கும். ${PRODUCT.name}-ல் உள்நுழைய "செலுத்தப்பட்டது" அழுத்தவும்.` },
  waiting: { en: 'Waiting for payment', ta: 'கட்டணத்திற்குக் காத்திருப்பவை' },
  none: { en: 'No payments waiting', ta: 'காத்திருக்கும் கட்டணம் இல்லை' },
  noneBody: { en: 'New photographer sign-ups appear here.', ta: 'புதிய பதிவுகள் இங்கே தோன்றும்.' },
  owner: { en: 'Owner', ta: 'உரிமையாளர்' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  city: { en: 'City', ta: 'ஊர்' },
  signedUp: { en: 'Signed up', ta: 'பதிவு' },
  setup: { en: 'Setup', ta: 'அமைப்பு' },
  setupDone: { en: 'Onboarding finished', ta: 'முடிந்தது' },
  setupNot: { en: 'Not finished yet', ta: 'இன்னும் முடியவில்லை' },
  plan: { en: 'Plan chosen', ta: 'தேர்ந்த திட்டம்' },
  paid: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  decline: { en: 'Decline', ta: 'நிராகரி' },
  declineTitle: { en: 'Decline this sign-up?', ta: 'இந்தப் பதிவை நிராகரிக்கவா?' },
  declineBody: { en: 'The account is cancelled and they cannot sign in. It stays in the Studios list as cancelled.', ta: 'கணக்கு ரத்து செய்யப்படும்.' },
  declined: { en: 'Sign-up declined', ta: 'நிராகரிக்கப்பட்டது' },
  details: { en: 'Open details', ta: 'விவரம்' },
  paused: { en: 'Revoked or expired', ta: 'ரத்து அல்லது காலாவதி' },
  pausedSub: { en: `Client links keep working for ${GRACE_DAYS} days after a revoke or expiry`, ta: `ரத்து/காலாவதிக்குப் பின் ${GRACE_DAYS} நாள் இணைப்புகள் வேலை செய்யும்` },
  revoked: { en: 'Revoked', ta: 'ரத்து' },
  expired: { en: 'Expired', ta: 'காலாவதி' },
  daysLeft: { en: 'days of grace left', ta: 'நாள் மீதம்' },
  graceOver: { en: 'Grace over, links off', ta: 'சலுகை முடிந்தது' },
}

export default function Approvals() {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: 'Studio approvals', ta: 'ஸ்டுடியோ ஒப்புதல்கள்' })
  const studios = useStudioStore(s => s.studios)
  const pending = studios.filter(s => deriveStatus(s) === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const paused = studios.filter(s => deriveStatus(s) === 'paused')

  return (
    <div>
      <PageHeader eyebrow={PH.wing[lang]} title={t.title} subtitle={t.sub} />
      <p className="t-label mb-3 text-ink/45">{t.waiting} · {pending.length}</p>
      {!pending.length ? (
        <EmptyState icon="check" title={t.none} body={t.noneBody} />
      ) : (
        <div className="grid gap-4 md:gap-5 xl:grid-cols-2">
          {pending.map(s => <PendingCard key={s.id} studio={s} />)}
        </div>
      )}

      {paused.length > 0 && (
        <Panel title={t.paused} subtitle={t.pausedSub} icon="clock" className="mt-6 md:mt-8" bodyClass="p-0">
          <ul className="divide-y divide-ink/[0.06]">
            {paused.map(s => {
              const left = graceLeftDays(s)
              const exp = expiredOn(s)
              return (
                <li key={s.id}>
                  <Link to={`/admin/photographers/${s.id}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-ink/[0.02] md:px-6">
                    <StudioMark studio={s} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{s.name}</span>
                      <span className="block truncate text-[12px] text-ink/45">{s.ownerName} · {exp ? `${t.expired} ${relTime(exp, lang)}` : `${t.revoked} ${relTime(s.sub.changedAt, lang)}`}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums ${left > 0 ? 'bg-ruby-soft text-ruby-deep' : 'bg-ink/[0.06] text-ink/55'}`}>
                      {left > 0 ? `${left} ${t.daysLeft}` : t.graceOver}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function PendingCard({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const plans = useStudioStore(s => s.plans)
  const [paying, setPaying] = useState(false)
  const [declining, setDeclining] = useState(false)
  const chosen = planOf(plans, studio.sub.plan)

  return (
    <Panel>
      <div className="flex items-start gap-3">
        <StudioMark studio={studio} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-tight text-ink">{studio.name}</h2>
          <p className="text-[12.5px] text-ink/45">{t.signedUp} {relTime(studio.createdAt, lang)} · {formatDateTime(studio.createdAt, lang)}</p>
        </div>
        <Link to={`/admin/photographers/${studio.id}`} className="shrink-0 text-[12.5px] font-medium text-ink/50 transition hover:text-ruby">{t.details}</Link>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <Meta label={t.owner}>{studio.ownerName}</Meta>
        <Meta label={t.phone}><a href={telHref(studio.phone)} className="tabular-nums hover:text-ruby">{studio.phone}</a></Meta>
        <Meta label={t.city}>{studio.city}</Meta>
        <Meta label={t.email}>{studio.email ? <span className="break-all">{studio.email}</span> : '—'}</Meta>
        <Meta label={t.setup} className="col-span-2">{studio.onboarded ? t.setupDone : t.setupNot}</Meta>
      </dl>
      <div className="mt-5 space-y-3 border-t hairline pt-5">
        <FormSelect<PlanKey> label={t.plan} value={studio.sub.plan} onChange={k => useStudioStore.getState().changePlan(studio.id, k)} options={plans.map(p => ({ value: p.key, label: `${p.name} · ₹${planTotal(p).toLocaleString('en-IN')}` }))} />
        <p className="text-[13px] font-medium text-ink"><PlanPrice plan={chosen} /></p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" iconLeft="check" onClick={() => setPaying(true)}>👍 {t.paid}</Button>
          <Button size="sm" variant="ghost" iconLeft="x" onClick={() => setDeclining(true)}>{t.decline}</Button>
        </div>
      </div>
      <MarkPaidModal studio={studio} open={paying} onClose={() => setPaying(false)} />
      <ConfirmModal
        open={declining}
        onClose={() => setDeclining(false)}
        onConfirm={() => {
          useStudioStore.getState().declineStudio(studio.id)
          toast(t.declined)
        }}
        title={t.declineTitle}
        body={t.declineBody}
        confirmLabel={t.decline}
        icon="x"
      />
    </Panel>
  )
}
