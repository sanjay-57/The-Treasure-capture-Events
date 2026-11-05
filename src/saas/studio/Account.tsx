import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/ui'
import { MODE_LABEL, PageHeader, Panel, Progress, TextInput, waHref } from '../../pages/admin/kit'
import { formatDate, formatINR, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { PRODUCT } from '../brand'
import { useCurrentStudio, useStudioStore } from '../store'
import { planTotal } from '../types'
import { daysLeft, formatBytes, planOf, storageBytes } from '../usage'
import { BrandingForm, Stat, TTC_SUPPORT_WA, brandingOf, type BrandingDraft } from './shared'
import { termsOf } from '../scope'

const copy = {
  title: { en: 'Account', ta: 'கணக்கு' },
  eyebrow: { en: PRODUCT.name, ta: PRODUCT.name },
  plan: { en: 'Subscription', ta: 'சந்தா' },
  current: { en: 'Current plan', ta: 'தற்போதைய திட்டம்' },
  paidUntil: { en: 'Paid until', ta: 'வரை செலுத்தப்பட்டது' },
  daysLeft: { en: 'Days left', ta: 'மீதமுள்ள நாட்கள்' },
  daysHint: { en: 'in this term', ta: 'இந்தக் காலத்தில்' },
  storage: { en: 'Proof storage', ta: 'படச் சேமிப்பு' },
  storageHint: { en: 'previews only; RAWs stay on your disks', ta: 'முன்னோட்டங்கள் மட்டும்; RAW உங்கள் வட்டுகளில்' },
  perMonth: { en: '/ month', ta: '/ மாதம்' },
  total: { en: 'total', ta: 'மொத்தம்' },
  tiers: { en: 'Plans', ta: 'திட்டங்கள்' },
  next: { en: 'Next renewal', ta: 'அடுத்த புதுப்பிப்பு' },
  pick: { en: 'Pick the plan for your next payment. The current term is not changed.', ta: 'அடுத்த கட்டணத்திற்கான திட்டத்தைத் தேர்வு செய்யுங்கள். தற்போதைய காலம் மாறாது.' },
  history: { en: 'Payments', ta: 'கட்டணங்கள்' },
  period: { en: 'Period', ta: 'காலம்' },
  amount: { en: 'Amount', ta: 'தொகை' },
  noTerms: { en: 'No payments yet.', ta: 'இன்னும் கட்டணம் இல்லை.' },
  howPay: { en: 'Pay by UPI or bank transfer, then send us the reference on WhatsApp. Our team confirms it, usually the same day, and your term is extended from its end date.', ta: 'UPI அல்லது வங்கிப் பரிமாற்றம் மூலம் செலுத்தி, குறிப்பு எண்ணை WhatsApp-ல் அனுப்புங்கள். பொதுவாக அதே நாளில் உறுதிசெய்வோம்; உங்கள் காலம் முடிவுத் தேதியிலிருந்து நீட்டிக்கப்படும்.' },
  renew: { en: 'Ask to renew on WhatsApp', ta: 'புதுப்பிக்க WhatsApp-ல் கேளுங்கள்' },
  profile: { en: 'Studio profile and branding', ta: 'ஸ்டுடியோ விவரமும் பிராண்டிங்கும்' },
  owner: { en: 'Owner name', ta: 'உரிமையாளர் பெயர்' },
  city: { en: 'City', ta: 'நகரம்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  phone: { en: 'Login phone', ta: 'உள்நுழைவு எண்' },
  save: { en: 'Save changes', ta: 'மாற்றங்களைச் சேமி' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  needName: { en: 'Add your studio name', ta: 'ஸ்டுடியோ பெயரைச் சேர்க்கவும்' },
}

export default function Account() {
  const t = useT(copy)
  const lang = useLang()
  useTitle(copy.title)
  const studio = useCurrentStudio()!
  const plans = useStudioStore(s => s.plans)
  const events = useStudioStore(s => s.events)
  const proofs = useStudioStore(s => s.proofs)
  const terms = useStudioStore(s => s.terms)
  const changePlan = useStudioStore(s => s.changePlan)
  const updateStudio = useStudioStore(s => s.updateStudio)
  const [draft, setDraft] = useState<BrandingDraft>(() => brandingOf(studio))
  const [extra, setExtra] = useState(() => ({ ownerName: studio.ownerName, city: studio.city, email: studio.email ?? '' }))

  const plan = planOf(plans, studio.sub.plan)
  const bytes = storageBytes(studio.id, events, proofs)
  const left = daysLeft(studio)
  const mine = useMemo(() => termsOf(terms, studio.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt)), [terms, studio.id])

  const save = () => {
    if (!draft.name.trim()) return toast(t.needName, 'ruby')
    updateStudio(studio.id, { ...draft, name: draft.name.trim(), ownerName: extra.ownerName.trim(), city: extra.city.trim(), email: extra.email.trim() || undefined })
    toast(t.saved)
  }

  const payMsg = `${studio.name} (${studio.phone}): I would like to renew ${PRODUCT.name} for ${plan.name} (${formatINR(planTotal(plan))}).`

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <div className="grid gap-6">
        <Panel title={t.plan} icon="dashboard">
          <div className="grid gap-5 sm:grid-cols-3">
            <Stat label={t.paidUntil} value={studio.sub.endsAt ? formatDate(studio.sub.endsAt, lang) : '—'} hint={`${t.current}: ${plan.name}`} />
            <div>
              <Stat label={t.daysLeft} value={String(left)} hint={t.daysHint} />
              <Progress value={Math.min(1, left / (plan.months * 30.4))} className="mt-2" />
            </div>
            <Stat label={t.storage} value={formatBytes(bytes)} hint={t.storageHint} />
          </div>
          <p className="t-label mb-1 mt-6 text-ink/45">{t.next}</p>
          <p className="mb-3 text-[12.5px] text-ink/50">{t.pick}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {plans.map(p => (
              <button key={p.key} type="button" aria-pressed={p.key === plan.key} onClick={() => changePlan(studio.id, p.key)} className={`cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${p.key === plan.key ? 'border-ink bg-ink/[0.03]' : 'border-ink/[0.08] hover:border-ink/30'}`}>
                <p className="text-[14px] font-semibold text-ink">{p.name}</p>
                <p className="mt-1 text-[12.5px] tabular-nums text-ink/60">{formatINR(p.pricePerMonth)} {t.perMonth}</p>
                <p className="mt-0.5 text-[12.5px] font-medium tabular-nums text-ink">{formatINR(planTotal(p))} {t.total}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-ink/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-[12.5px] leading-relaxed text-ink/55">{t.howPay}</p>
            <a href={waHref(TTC_SUPPORT_WA, payMsg)} target="_blank" rel="noreferrer" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink-3">
              <Icon name="whatsapp" size={17} />{t.renew}
            </a>
          </div>
        </Panel>

        <Panel title={t.history} icon="receipt">
          {mine.length === 0 ? (
            <p className="text-[13.5px] text-ink/50">{t.noTerms}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-[13.5px]">
                <thead className="text-[11.5px] uppercase tracking-wide text-ink/45">
                  <tr><th className="py-2 font-medium">{t.tiers}</th><th className="py-2 font-medium">{t.period}</th><th className="py-2 text-right font-medium">{t.amount}</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.06]">
                  {mine.map(x => (
                    <tr key={x.id}>
                      <td className="py-2.5 text-ink">{planOf(plans, x.plan).name} <span className="text-ink/45">· {MODE_LABEL[x.mode][lang]}</span></td>
                      <td className="py-2.5 text-ink/70">{formatDate(x.from, lang)} → {formatDate(x.to, lang)}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums text-ink">{formatINR(x.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title={t.profile} icon="edit">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <TextInput label={t.owner} value={extra.ownerName} onChange={v => setExtra({ ...extra, ownerName: v })} />
            <TextInput label={t.city} value={extra.city} onChange={v => setExtra({ ...extra, city: v })} />
            <TextInput label={t.email} type="email" inputMode="email" value={extra.email} onChange={v => setExtra({ ...extra, email: v })} />
          </div>
          <p className="mb-6 text-[12.5px] text-ink/50">{t.phone}: {studio.phone}</p>
          <BrandingForm value={draft} onChange={setDraft} />
          <div className="mt-6 flex justify-end"><Button onClick={save}>{t.save}</Button></div>
        </Panel>
      </div>
    </div>
  )
}
