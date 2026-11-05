import { useMemo, useState } from 'react'
import { Icon } from '../../../components/Icon'
import { Button } from '../../../components/ui'
import { useLang, useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { PRODUCT } from '../../../saas/brand'
import { useStudioStore } from '../../../saas/store'
import { planTotal, type Plan } from '../../../saas/types'
import { PageHeader, Panel, TextInput } from '../kit'
import { studiosPerPlan } from './helpers'
import { PH, PlanPrice } from './shared'

const copy = {
  title: { en: 'Plans', ta: 'திட்டங்கள்' },
  sub: { en: `Prepaid terms photographers choose from on ${PRODUCT.name}. The term starts when you mark the studio Paid.`, ta: `${PRODUCT.name} முன்கட்டணத் திட்டங்கள். கட்டணம் உறுதிசெய்ததும் காலம் தொடங்கும்.` },
  name: { en: 'Name', ta: 'பெயர்' },
  months: { en: 'months', ta: 'மாதங்கள்' },
  price: { en: 'Price per month', ta: 'மாத விலை' },
  total: { en: 'Total for the term', ta: 'காலத்திற்கான மொத்தம்' },
  studios: { en: 'studios on this plan', ta: 'ஸ்டுடியோக்கள்' },
  save: { en: 'Save plan', ta: 'சேமி' },
  saved: { en: 'Plan saved', ta: 'சேமிக்கப்பட்டது' },
  invalid: { en: 'Name and price are both needed', ta: 'பெயர், விலை இரண்டும் தேவை' },
  rulesTitle: { en: 'How plans work', ta: 'திட்டங்கள் எப்படி வேலை செய்கின்றன' },
  rule1: { en: 'A studio picks a term at signup and stays “Payment pending” until you mark it Paid. Only then can it sign in.', ta: 'பதிவின்போது காலத்தைத் தேர்வு செய்கிறார்கள்; நீங்கள் கட்டணம் உறுதிசெய்யும் வரை உள்நுழைய முடியாது.' },
  rule2: { en: 'Paid starts the term today, or extends it from the current end date if the studio renews early.', ta: 'கட்டணம் இன்று முதல் காலத்தைத் தொடங்கும்; முன்கூட்டியே புதுப்பித்தால் முடிவுத் தேதியிலிருந்து நீட்டிக்கும்.' },
  rule3: { en: 'There is no limit on clients or galleries. Revoke or expiry stops studio sign-in; client links keep working for 7 days.', ta: 'வாடிக்கையாளர் வரம்பு இல்லை. ரத்து அல்லது காலாவதி ஆனால் 7 நாட்கள் வரை இணைப்புகள் செயல்படும்.' },
  rule4: { en: 'A price change applies to the next payment. Past terms keep the amount they were paid at.', ta: 'விலை மாற்றம் அடுத்த கட்டணத்திற்கு மட்டும்; பழைய காலங்கள் மாறாது.' },
}

export default function Plans() {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: 'Studio plans', ta: 'ஸ்டுடியோ திட்டங்கள்' })
  const plans = useStudioStore(s => s.plans)
  const studios = useStudioStore(s => s.studios)
  const counts = useMemo(() => studiosPerPlan(studios), [studios])

  return (
    <div>
      <PageHeader eyebrow={PH.wing[lang]} title={t.title} subtitle={t.sub} />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {plans.map(p => <PlanCard key={p.key} plan={p} count={counts[p.key] ?? 0} />)}
      </div>
      <Panel title={t.rulesTitle} icon="info" className="mt-6 md:mt-8">
        <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-ink/65">
          {[t.rule1, t.rule2, t.rule3, t.rule4].map((r, i) => (
            <li key={i} className="flex gap-2.5">
              <Icon name="check" size={15} className="mt-0.5 shrink-0 text-ruby" />
              {r}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function PlanCard({ plan, count }: { plan: Plan; count: number }) {
  const t = useT(copy)
  const [name, setName] = useState(plan.name)
  const [price, setPrice] = useState(String(plan.pricePerMonth))
  const dirty = name !== plan.name || price !== String(plan.pricePerMonth)
  const [err, setErr] = useState('')
  const pr = Math.round(Number(price)) || 0

  const save = () => {
    if (!name.trim() || pr <= 0) return setErr(t.invalid)
    useStudioStore.getState().updatePlan(plan.key, { name: name.trim(), pricePerMonth: pr })
    setErr('')
    toast(t.saved)
  }

  return (
    <Panel title={plan.name} subtitle={<PlanPrice plan={plan} />} icon="grid">
      <p className="mb-4 text-[12.5px] text-ink/50"><span className="font-semibold tabular-nums text-ink">{plan.months}</span> {t.months} · <span className="font-semibold tabular-nums text-ink">{count}</span> {t.studios}</p>
      <div className="space-y-3">
        <TextInput label={t.name} value={name} onChange={v => { setName(v); setErr('') }} />
        <TextInput label={t.price} value={price} onChange={v => { setPrice(v.replace(/[^\d]/g, '')); setErr('') }} inputMode="numeric" prefix="₹" />
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink/[0.03] p-3 text-[13.5px]">
          <span className="text-ink/60">{t.total}</span>
          <span className="font-semibold tabular-nums text-ink">₹{planTotal({ ...plan, pricePerMonth: pr }).toLocaleString('en-IN')}</span>
        </div>
        {err && <p className="text-[12.5px] text-ruby">{err}</p>}
        <Button size="sm" variant={dirty ? 'ruby' : 'outline'} disabled={!dirty} onClick={save} full>{t.save}</Button>
      </div>
    </Panel>
  )
}
