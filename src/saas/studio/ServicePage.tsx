import { Link, Navigate, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { Badge, Button, Container, Eyebrow, SectionHeading } from '../../components/ui'
import { Reveal, Stagger, StaggerItem } from '../../components/motion'
import { formatINR, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { PRODUCT } from '../brand'
import { useStudioStore } from '../store'
import { planTotal } from '../types'
import { STUDIO_SERVICES, studioServiceBySlug, studioServicePath, type StudioService } from './services'

const copy = {
  back: { en: 'For photographers', ta: 'புகைப்படக் கலைஞர்களுக்கு' },
  planned: { en: 'Coming soon', ta: 'விரைவில்' },
  start: { en: 'Sign in or sign up', ta: 'உள்நுழை அல்லது பதிவு செய்' },
  how: { en: 'How it works', ta: 'எப்படி செயல்படுகிறது' },
  sees: { en: 'What your customer sees', ta: 'உங்கள் வாடிக்கையாளர் பார்ப்பது' },
  seesLead: { en: 'Every customer page carries your logo and name only. The Treasure Capture Events does not appear on it.', ta: 'ஒவ்வொரு வாடிக்கையாளர் பக்கத்திலும் உங்கள் லோகோவும் பெயரும் மட்டுமே. The Treasure Capture Events அதில் இருக்காது.' },
  link: { en: 'Customer link', ta: 'வாடிக்கையாளர் இணைப்பு' },
  inStudio: { en: 'In your studio panel', ta: 'உங்கள் ஸ்டுடியோ பலகத்தில்' },
  limits: { en: 'Good to know', ta: 'அறிந்து கொள்ள' },
  others: { en: 'The other services', ta: 'மற்ற சேவைகள்' },
  plans: { en: 'One plan covers all three', ta: 'ஒரு திட்டம், மூன்று சேவைகள்' },
  perMonth: { en: 'per month', ta: 'மாதத்திற்கு' },
  months: { en: 'months', ta: 'மாதங்கள்' },
  total: { en: 'total', ta: 'மொத்தம்' },
  gate: { en: 'Pay by UPI or bank transfer. Your login opens as soon as our team confirms the payment.', ta: 'UPI அல்லது வங்கிப் பரிமாற்றம் மூலம் செலுத்துங்கள். எங்கள் குழு கட்டணத்தை உறுதிசெய்தவுடன் உங்கள் உள்நுழைவு திறக்கும்.' },
}

export default function ServicePage() {
  const { service } = useParams()
  const s = studioServiceBySlug(service)
  if (!s) return <Navigate to="/for-photographers" replace />
  return <Body key={s.slug} s={s} />
}

function Body({ s }: { s: StudioService }) {
  const lang = useLang()
  const t = useT(copy)
  const plans = useStudioStore(x => x.plans)
  useTitle({ en: `${s.name.en} · ${copy.back.en}`, ta: `${s.name.ta} · ${copy.back.ta}` })
  const others = STUDIO_SERVICES.filter(x => x.slug !== s.slug)

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <Container>
        <Reveal>
          <Link to="/for-photographers" className="inline-flex items-center gap-2 text-[13px] text-ink/55 transition hover:text-ink">
            <Icon name="arrowLeft" size={14} />{t.back}
          </Link>
        </Reveal>
        <div className="mt-6 max-w-3xl">
          <Reveal delay={0.05}>
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>{PRODUCT.name}</Eyebrow>
              {s.planned && <Badge tone="outline">{t.planned}</Badge>}
            </div>
          </Reveal>
          <Reveal delay={0.1}><h1 className="t-1 mt-5 text-ink">{s.name[lang]}</h1></Reveal>
          <Reveal delay={0.15}><p className="t-lead mt-5 max-w-2xl text-ink/70">{s.tagline[lang]}</p></Reveal>
          <Reveal delay={0.2}><p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink/60">{s.intro[lang]}</p></Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/studio/login" icon="arrowRight" size="lg">{t.start}</Button>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-ink/[0.08] bg-white px-5 py-4">
                <dt className="t-label text-ink/45">{t.inStudio}</dt>
                <dd className="mt-1.5 font-mono text-[14px] text-ink">{s.studioPath}</dd>
              </div>
              {s.customerLink && (
                <div className="rounded-2xl border border-ink/[0.08] bg-white px-5 py-4">
                  <dt className="t-label text-ink/45">{t.link}</dt>
                  <dd className="mt-1.5 font-mono text-[14px] text-ink">{s.customerLink}</dd>
                </div>
              )}
            </dl>
          </Reveal>
        </div>

        <section className="mt-24">
          <SectionHeading eyebrow={s.name[lang]} title={t.how} size="t-3" />
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.steps.map((st, i) => (
              <StaggerItem key={i}>
                <div className="h-full rounded-[26px] border border-ink/[0.08] bg-white p-6">
                  <span className="font-display text-[34px] leading-none text-ink/20">{i + 1}</span>
                  <h3 className="mt-5 text-[16px] font-semibold text-ink">{st.title[lang]}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink/60">{st.body[lang]}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-24 rounded-[30px] bg-ink p-7 text-white md:p-12">
          <SectionHeading eyebrow={t.sees} title={t.sees} lead={t.seesLead} dark size="t-3" />
          <ul className="mt-8 grid gap-3 md:grid-cols-3">
            {s.customerSees.map((c, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-5 text-[15px] leading-relaxed text-white/80">
                <Icon name="check" size={16} className="mt-1 shrink-0 text-ruby-bright" />{c[lang]}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24">
          <SectionHeading eyebrow={t.limits} title={t.limits} size="t-3" />
          <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {s.limits.map((l, i) => (
              <li key={i} className="flex items-start gap-3 py-5 text-[15px] leading-relaxed text-ink/70">
                <Icon name="info" size={16} className="mt-1 shrink-0 text-ink/40" />{l[lang]}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24">
          <SectionHeading eyebrow={t.plans} title={t.plans} lead={t.gate} size="t-3" />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {plans.map(p => (
              <div key={p.key} className="rounded-[26px] border border-ink/[0.08] bg-white p-6">
                <p className="text-[15px] font-semibold text-ink">{p.name}</p>
                <p className="mt-4 text-[32px] font-semibold tabular-nums tracking-tight text-ink">{formatINR(p.pricePerMonth)}</p>
                <p className="text-[13px] text-ink/50">{t.perMonth}</p>
                <p className="mt-4 border-t border-ink/[0.06] pt-4 text-[14px] text-ink/60"><span className="font-semibold text-ink">{formatINR(planTotal(p))}</span> {t.total} · {p.months} {t.months}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <SectionHeading eyebrow={t.others} title={t.others} size="t-3" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {others.map(o => (
              <Link key={o.slug} to={studioServicePath(o.slug)} className="group flex items-start gap-4 rounded-[26px] border border-ink/[0.08] bg-white p-6 transition hover:-translate-y-0.5 hover:border-ink/20">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink"><Icon name={o.icon} size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[18px] font-semibold tracking-tight text-ink">{o.name[lang]}</span>
                  <span className="mt-1.5 block text-[14px] leading-relaxed text-ink/60">{o.tagline[lang]}</span>
                </span>
                <Icon name="arrowUpRight" size={20} className="shrink-0 text-ink/30 transition-all duration-300 group-hover:rotate-45 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </div>
  )
}
