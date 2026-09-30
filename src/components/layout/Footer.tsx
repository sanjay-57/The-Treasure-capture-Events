import { Link } from 'react-router'
import { Icon } from '../Icon'
import { Button, Container } from '../ui'
import { Reveal, RevealText } from '../motion'
import { GopuramSkyline, TamilOnly, TempleBorder } from '../tamil'
import { Logo, LangToggle } from './Nav'
import { COMMON, useLang, useT } from '../../lib/i18n'
import { DISTRICTS, EVENTS } from '../../lib/data'
import { useStore } from '../../lib/store'

const copy = {
  cta: { en: 'Let’s make something\nworth treasuring.', ta: 'போற்றிப் பாதுகாக்கும்\nநினைவுகளை உருவாக்குவோம்.' },
  ctaLead: { en: 'Share your auspicious date with us. We’ll call your family within the day — to listen first, then plan together.', ta: 'உங்கள் சுபதினத்தை எங்களுடன் பகிருங்கள். அன்றே உங்கள் குடும்பத்தை அழைத்து, முதலில் கேட்டு, பின் இணைந்து திட்டமிடுவோம்.' },
  whatsapp: { en: 'WhatsApp us', ta: 'வாட்ஸ்அப்' },
  explore: { en: 'Explore', ta: 'பார்வையிட' },
  events: { en: 'Events', ta: 'நிகழ்வுகள்' },
  districts: { en: 'Districts', ta: 'மாவட்டங்கள்' },
  studio: { en: 'Studio', ta: 'ஸ்டுடியோ' },
  staff: { en: 'Staff login', ta: 'பணியாளர் நுழைவு' },
  hours: { en: 'Mon–Sat · 9:30 am – 8 pm', ta: 'திங்கள்–சனி · காலை 9:30 – இரவு 8' },
}

export function Footer() {
  const lang = useLang()
  const t = useT(copy)
  const c = useT(COMMON)
  const studio = useStore(s => s.cms.studio)
  const wa = studio.whatsapp.replace(/\D/g, '')

  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-white">
      <TamilOnly>
        <TempleBorder flip />
        <GopuramSkyline className="pointer-events-none absolute inset-x-0 top-3" color="#c0163c" opacity={0.16} />
      </TamilOnly>
      <div className="ambient-dark grain absolute inset-0 opacity-80" />

      <Container className="relative pb-[calc(2rem+env(safe-area-inset-bottom))] pt-20 md:pb-10 md:pt-32">
        <div className="grid gap-8 border-b border-white/10 pb-12 md:gap-10 md:pb-16 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <RevealText text={t.cta} className="t-1 text-white" />
            <Reveal delay={0.2}>
              <p className="t-lead mt-6 max-w-md text-white/55">{t.ctaLead}</p>
            </Reveal>
          </div>
          <Reveal delay={0.3} className="grid gap-3 sm:flex sm:flex-wrap md:justify-end">
            <Button to="/book" size="lg" icon="arrowRight" className="w-full sm:w-auto">{c.getQuote}</Button>
            <Button href={`https://wa.me/${wa}`} size="lg" variant="glass-dark" iconLeft="whatsapp" className="w-full sm:w-auto">{t.whatsapp}</Button>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 md:gap-10 md:py-14">
          <div className="col-span-2 md:col-span-1">
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/50">{c.tagline}</p>
            <div className="mt-6 flex gap-2">
              {(['instagram', 'youtube', 'whatsapp'] as const).map(n => (
                <a key={n} href={n === 'whatsapp' ? `https://wa.me/${wa}` : '#'} aria-label={n} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/60 transition hover:border-white/40 hover:text-white">
                  <Icon name={n} size={17} />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title={t.explore} links={[
            { to: '/gallery', label: c.gallery },
            { to: '/services', label: c.services },
            { to: '/about', label: c.about },
            { to: '/contact', label: c.contact },
            { to: '/login', label: c.login },
          ]} />
          <FooterCol title={t.events} links={EVENTS.slice(0, 6).map(e => ({ to: `/book?event=${e.key}`, label: e.name[lang] }))} />
          <div className="col-span-2 md:col-span-1">
            <p className="t-label mb-5 text-white/40">{t.studio}</p>
            <ul className="space-y-3 text-sm text-white/65">
              <li className="flex gap-2.5"><Icon name="mapPin" size={16} className="mt-0.5 shrink-0 text-ruby-bright" /><span className="min-w-0">{lang === 'ta' ? studio.addressTa : studio.addressEn}</span></li>
              <li><a href={`tel:${studio.phone}`} className="flex gap-2.5 py-1 hover:text-white md:py-0"><Icon name="phone" size={16} className="shrink-0 text-ruby-bright" />{studio.phone}</a></li>
              <li><a href={`mailto:${studio.email}`} className="flex gap-2.5 py-1 hover:text-white md:py-0"><Icon name="mail" size={16} className="shrink-0 text-ruby-bright" /><span className="min-w-0 break-all">{studio.email}</span></a></li>
              <li className="flex gap-2.5"><Icon name="clock" size={16} className="shrink-0 text-ruby-bright" /><span className="min-w-0">{t.hours}</span></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 py-6 text-[13px] text-white/40 md:items-start md:gap-y-2">
          <span className="t-label w-full py-1 text-white/30 md:w-auto md:py-0">{t.districts}</span>
          {DISTRICTS.map(d => <Link key={d.key} to={`/book?district=${d.key}`} className="py-1.5 transition hover:text-white md:py-0">{d.name[lang]}</Link>)}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-[13px] text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {c.brand}. {c.copyright}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link to="/terms" className="hover:text-white">{c.terms}</Link>
            <Link to="/privacy" className="hover:text-white">{c.privacy}</Link>
            <Link to="/admin/login" className="flex items-center gap-1.5 hover:text-white"><Icon name="lock" size={13} />{t.staff}</Link>
            <LangToggle dark />
          </div>
        </div>
      </Container>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="t-label mb-5 text-white/40">{title}</p>
      <ul className="space-y-1 text-sm md:space-y-3">
        {links.map(l => (
          <li key={l.to}>
            <Link to={l.to} className="group inline-flex items-center gap-1 py-1.5 text-white/65 transition hover:text-white md:py-0">
              {l.label}
              <Icon name="arrowUpRight" size={13} className="opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
