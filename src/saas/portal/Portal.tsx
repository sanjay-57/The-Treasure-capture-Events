import { Component, lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { isLan } from '../../api/mode'
import { checkPin, gateOpen } from '../../api/auth'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router'
import { Icon, type IconName } from '../../components/Icon'
import { Modal } from '../../components/ui'
import { useLang, useT, type Bi } from '../../lib/i18n'
import { AccentButton, LangToggle, Notice } from '../client/ui'
import { useOsStore } from '../os/store'
import type { Project } from '../os/types'
import { useStudioStore } from '../store'
import { StudioMark, StudioTheme, useBrandHead } from '../theme'
import type { Studio } from '../types'
import { linksLive } from '../usage'
import { bannerKey, PIN_RE, pinKey } from './helpers'
import { PortalProvider, usePortal } from './ui'
import Dashboard from './sections/Dashboard'

const ClientGallery = lazy(() => import('../client/ClientGallery'))

/**
 * Client portal at /p/:code/* (outside the TTC layout). White-labelled to the
 * photographer's studio; gated by the project's 4-digit PIN, remembered for
 * the browser session.
 */

const copy = {
  notFound: { en: 'Portal not found', ta: 'பக்கம் கிடைக்கவில்லை' },
  notFoundBody: { en: 'Check the link your studio sent you. It may have been changed.', ta: 'உங்கள் ஸ்டுடியோ அனுப்பிய இணைப்பைச் சரிபார்க்கவும். அது மாற்றப்பட்டிருக்கலாம்.' },
  paused: { en: 'This portal is paused', ta: 'இந்தப் பக்கம் இடைநிறுத்தப்பட்டுள்ளது' },
  pausedBody: { en: 'Please contact the studio to get access again.', ta: 'மீண்டும் அணுக ஸ்டுடியோவைத் தொடர்பு கொள்ளவும்.' },
  contactStudio: { en: 'Contact the studio', ta: 'ஸ்டுடியோவைத் தொடர்பு கொள்ள' },
  yourPortal: { en: 'Your event portal', ta: 'உங்கள் நிகழ்வுப் பக்கம்' },
  enterPin: { en: 'Enter the 4-digit PIN from your studio', ta: 'ஸ்டுடியோ அனுப்பிய 4 இலக்க PIN-ஐ உள்ளிடவும்' },
  pin: { en: 'PIN', ta: 'PIN' },
  open: { en: 'Open portal', ta: 'பக்கத்தைத் திற' },
  wrongPin: { en: 'That PIN is not right. Please try again.', ta: 'PIN தவறு. மீண்டும் முயற்சிக்கவும்.' },
  offTitle: { en: 'This page isn’t switched on', ta: 'இந்தப் பக்கம் இயக்கப்படவில்லை' },
  offBody: { en: 'Your photographer hasn’t turned on the project page for your booking.', ta: 'உங்கள் முன்பதிவுக்குப் புகைப்படக் கலைஞர் திட்டப் பக்கத்தை இயக்கவில்லை.' },
  banner: { en: 'Curious to try this for your business?', ta: 'உங்கள் தொழிலுக்கு இதை முயற்சிக்க விருப்பமா?' },
  bannerCta: { en: 'Sign up as a photographer', ta: 'புகைப்படக் கலைஞராகப் பதிவு செய்யுங்கள்' },
  dismiss: { en: 'Dismiss', ta: 'மூடு' },
  menu: { en: 'Menu', ta: 'பட்டியல்' },
  more: { en: 'More', ta: 'மேலும்' },
  documents: { en: 'Documents', ta: 'ஆவணங்கள்' },
  whatsappGroup: { en: 'WhatsApp group', ta: 'WhatsApp குழு' },
  lock: { en: 'Lock portal', ta: 'பக்கத்தைப் பூட்டு' },
  crashTitle: { en: 'This page could not load', ta: 'இந்தப் பக்கத்தை ஏற்ற முடியவில்லை' },
  crashBody: { en: 'Please try another page from the menu, or reload. If it keeps happening, let the studio know.', ta: 'பட்டியலிலிருந்து வேறு பக்கத்தைத் திறக்கவும் அல்லது மீண்டும் ஏற்றவும். தொடர்ந்தால் ஸ்டுடியோவிடம் தெரிவிக்கவும்.' },
  reload: { en: 'Reload', ta: 'மீண்டும் ஏற்று' },
}

interface NavItem {
  to: string
  icon: IconName
  label: Bi
  short?: Bi
  tab?: boolean
}

const NAV: NavItem[] = [{ to: '', icon: 'dashboard', label: { en: 'Home', ta: 'முகப்பு' }, tab: true }]

const ss = () => (typeof window !== 'undefined' ? window.sessionStorage : undefined)
const ssGet = (k: string) => {
  try {
    return ss()?.getItem(k) ?? null
  } catch {
    return null
  }
}
const ssSet = (k: string, v: string | null) => {
  try {
    if (v === null) ss()?.removeItem(k)
    else ss()?.setItem(k, v)
  } catch {
    /* private mode */
  }
}

const NEUTRAL = { accent: '#3f3f46' }

export default function Portal() {
  const { code = '' } = useParams()
  const lang = useLang()
  const t = useT(copy)
  const project = useOsStore(s => s.projects.find(p => p.code === code.toLowerCase()))
  const studio = useStudioStore(s => (project ? s.studios.find(x => x.id === project.studioId) : undefined))
  const [unlocked, setUnlocked] = useState(() => (project ? (isLan() ? gateOpen('project', project.id) : ssGet(pinKey(code)) === project.pin) : false))

  // Another portal code in the same tab: re-check the remembered PIN.
  useEffect(() => {
    setUnlocked(project ? (isLan() ? gateOpen('project', project.id) : ssGet(pinKey(code)) === project.pin) : false)
  }, [code, project?.pin]) // eslint-disable-line react-hooks/exhaustive-deps

  useBrandHead(project ? studio : undefined, project && studio ? `${project.name} · ${studio.name}` : '')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (!project || !studio)
    return (
      <StudioTheme studio={NEUTRAL} className="min-h-svh bg-[#faf9f7] text-ink">
        <Notice icon="lock" title={t.notFound} body={t.notFoundBody} />
      </StudioTheme>
    )

  if (!linksLive(studio))
    return (
      <StudioTheme studio={studio} className="min-h-svh bg-[#faf9f7] text-ink">
        <div className="flex justify-center pt-12">
          <StudioMark studio={studio} size={48} />
        </div>
        <Notice icon="clock" title={t.paused} body={t.pausedBody}>
          <a href={`tel:${(studio.phone || studio.whatsapp || '').replace(/\s/g, '')}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-[14px] font-semibold">
            <Icon name="phone" size={16} />
            {t.contactStudio}
          </a>
        </Notice>
      </StudioTheme>
    )

  if (project.features?.portal === false)
    return (
      <StudioTheme studio={studio} className="min-h-svh bg-[#faf9f7] text-ink">
        <div className="flex justify-center pt-12">
          <StudioMark studio={studio} size={48} />
        </div>
        <Notice icon="lock" title={t.offTitle} body={t.offBody} />
      </StudioTheme>
    )

  const base = `/p/${project.code}`

  return (
    <StudioTheme studio={studio} className="min-h-svh bg-[#faf9f7] text-ink">
      {studio.portalBanner && <SignupBanner />}
      {unlocked ? (
        <PortalProvider value={{ project, studio, base, lang }}>
          <Shell
            onLock={() => {
              ssSet(pinKey(code), null)
              setUnlocked(false)
            }}
          />
        </PortalProvider>
      ) : (
        <PinGate
          project={project}
          studio={studio}
          onOk={() => {
            ssSet(pinKey(code), project.pin)
            setUnlocked(true)
          }}
        />
      )}
    </StudioTheme>
  )
}

function SignupBanner() {
  const t = useT(copy)
  const [hidden, setHidden] = useState(() => ssGet(bannerKey) === '1')
  if (hidden) return null
  return (
    <div className="relative z-40 flex items-center justify-center gap-2 bg-ink px-10 py-2 text-center text-[12.5px] text-white/85 print:hidden">
      <span>
        {t.banner}{' '}
        <Link to="/for-photographers" className="font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
          {t.bannerCta} →
        </Link>
      </span>
      <button
        type="button"
        aria-label={t.dismiss}
        onClick={() => {
          ssSet(bannerKey, '1')
          setHidden(true)
        }}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

function PinGate({ project, studio, onOk }: { project: Project; studio: Studio; onOk: () => void }) {
  const t = useT(copy)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const check = (value: string) => {
    void checkPin(project.code, value, project.pin).then(ok => {
      if (ok) return onOk()
      setError(true)
      setPin('')
    })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (PIN_RE.test(pin)) check(pin)
  }

  return (
    <main className="relative mx-auto flex min-h-[85svh] max-w-sm flex-col items-center justify-center px-6 py-12 text-center">
      <div className="absolute right-4 top-4">
        <LangToggle />
      </div>
      <StudioMark studio={studio} size={64} />
      <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/50">{studio.name}</p>
      <h1 className="mt-6 font-display text-[30px] font-medium leading-tight">{project.name}</h1>
      <p className="mt-1 text-[14px] text-ink/55">{t.yourPortal}</p>
      <form onSubmit={submit} className="mt-10 w-full">
        <label htmlFor="portal-pin" className="block text-[13.5px] text-ink/65">
          {t.enterPin}
        </label>
        <input
          id="portal-pin"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{4}"
          maxLength={4}
          value={pin}
          aria-invalid={error}
          aria-describedby={error ? 'portal-pin-err' : undefined}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 4)
            setPin(v)
            setError(false)
            if (v.length === 4) check(v)
          }}
          className={`mt-3 h-16 w-full rounded-2xl border bg-white text-center font-mono text-[28px] tracking-[0.6em] outline-none transition focus:ring-4 focus:ring-[var(--accent-ring)] ${error ? 'border-red-400' : 'border-ink/12 focus:border-[var(--accent)]'}`}
          placeholder="••••"
        />
        <p id="portal-pin-err" role="alert" className="mt-2 min-h-5 text-[13px] text-red-600">
          {error ? t.wrongPin : ''}
        </p>
        <AccentButton type="submit" disabled={!PIN_RE.test(pin)} className="mt-3 w-full" icon="arrowRight">
          {t.open}
        </AccentButton>
      </form>
    </main>
  )
}

function useNav(project: Project) {
  const event = useStudioStore(s => (project.galleryEventId ? s.events.find(e => e.id === project.galleryEventId) : undefined))
  return { items: NAV, selection: !!event && project.features?.gallery !== false }
}

function navCls(active: boolean) {
  return `flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14px] font-medium transition ${active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-ink/70 hover:bg-ink/[0.04] hover:text-ink'}`
}

const selectionLabel: Bi = { en: 'Photo selection', ta: 'புகைப்படத் தேர்வு' }

function NavList({ project, base, onPick }: { project: Project; base: string; onPick?: () => void }) {
  const lang = useLang()
  const t = useT(copy)
  const { items, selection } = useNav(project)
  return (
    <nav className="flex flex-col gap-1">
      {items.map(n => (
        <NavLink key={n.to} to={n.to ? `${base}/${n.to}` : base} end onClick={onPick} className={({ isActive }) => navCls(isActive)}>
          <Icon name={n.icon} size={18} />
          {n.label[lang]}
        </NavLink>
      ))}
      {selection && (
        <NavLink to={`${base}/selection`} onClick={onPick} className={({ isActive }) => navCls(isActive)}>
          <Icon name="heart" size={18} />
          {selectionLabel[lang]}
        </NavLink>
      )}
      {(project.documents.length > 0 || project.whatsappGroup) && <div className="my-3 h-px bg-ink/[0.07]" />}
      {project.documents.length > 0 && (
        <>
          <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">{t.documents}</p>
          {project.documents.map(d => (
            <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className={navCls(false)}>
              <Icon name="external" size={17} />
              <span className="truncate">{d.name}</span>
            </a>
          ))}
        </>
      )}
      {project.whatsappGroup && (
        <a href={project.whatsappGroup} target="_blank" rel="noopener noreferrer" className={navCls(false)}>
          <Icon name="whatsapp" size={18} />
          {t.whatsappGroup}
        </a>
      )}
    </nav>
  )
}

function Shell({ onLock }: { onLock: () => void }) {
  const { project, studio, base, lang } = usePortal()
  const t = useT(copy)
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  // The photo picker needs the full width, and its own toolbar sticks to the top on phones.
  const picker = pathname.startsWith(`${base}/selection`)
  const { selection } = useNav(project)

  const brand = (
    <div className="flex items-center gap-3">
      <StudioMark studio={studio} size={36} />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-semibold">{studio.name}</p>
        <p className="truncate text-[12px] text-ink/50">{project.name}</p>
      </div>
    </div>
  )

  return (
    <div className="lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-72 shrink-0 flex-col overflow-y-auto border-r border-ink/[0.07] bg-white px-4 py-6 lg:flex print:hidden">
        <div className="px-2">{brand}</div>
        <div className="mt-8 flex-1">
          <NavList project={project} base={base} />
        </div>
        <div className="mt-6 flex items-center justify-between px-2">
          <LangToggle />
          <button type="button" onClick={onLock} aria-label={t.lock} title={t.lock} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] hover:text-ink">
            <Icon name="lock" size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className={`${picker ? '' : 'sticky top-0'} z-30 flex items-center justify-between gap-3 border-b border-ink/[0.07] bg-white/90 px-4 py-3 backdrop-blur lg:hidden print:hidden`}>
        {brand}
        <button type="button" onClick={() => setMenu(true)} aria-label={t.menu} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-ink/[0.05]">
          <Icon name="menu" size={18} />
        </button>
      </header>

      <main className={`min-w-0 flex-1 px-4 pb-28 pt-6 lg:pb-16 lg:pt-10 print:p-0 ${picker ? 'md:px-8' : 'sm:px-6 lg:px-10'}`}>
        <div className={`mx-auto ${picker ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
          <SectionBoundary key={pathname}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route
                path="selection"
                element={
                  <Suspense fallback={<div className="min-h-[60svh]" />}>
                    <ClientGallery embedded />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to={base} replace />} />
            </Routes>
          </SectionBoundary>
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink/[0.07] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
        {NAV.filter(n => n.tab).map(n => (
          <NavLink key={n.to} to={n.to ? `${base}/${n.to}` : base} end className={({ isActive }) => `flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold ${isActive ? 'text-[var(--accent)]' : 'text-ink/50'}`}>
            <Icon name={n.icon} size={20} />
            <span className="max-w-full truncate px-1">{(n.short ?? n.label)[lang]}</span>
          </NavLink>
        ))}
        {selection && (
          <NavLink to={`${base}/selection`} className={({ isActive }) => `flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold ${isActive ? 'text-[var(--accent)]' : 'text-ink/50'}`}>
            <Icon name="heart" size={20} />
            <span className="max-w-full truncate px-1">{selectionLabel[lang]}</span>
          </NavLink>
        )}
        <button type="button" onClick={() => setMenu(true)} className="flex h-16 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-ink/50">
          <Icon name="menu" size={20} />
          {t.more}
        </button>
      </nav>

      <Modal open={menu} onClose={() => setMenu(false)} label={t.menu}>
        <div className="p-5 pt-8">
          <div className="mb-5 px-2">{brand}</div>
          <NavList project={project} base={base} onPick={() => setMenu(false)} />
          <div className="mt-5 flex items-center justify-between px-2">
            <LangToggle />
            <button type="button" onClick={onLock} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-[13px] font-semibold text-ink/60 hover:bg-ink/[0.05]">
              <Icon name="lock" size={15} />
              {t.lock}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/** Keeps the portal nav on screen when one section fails; keyed by path so moving on clears it. */
class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('Portal section crashed', error)
  }
  render() {
    return this.state.failed ? <SectionError /> : this.props.children
  }
}

function SectionError() {
  const t = useT(copy)
  return (
    <Notice icon="info" title={t.crashTitle} body={t.crashBody}>
      <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-5 text-[14px] font-semibold">
        {t.reload}
      </button>
    </Notice>
  )
}
