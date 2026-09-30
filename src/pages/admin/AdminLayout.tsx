import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Icon, LogoMark, type IconName } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { Kolam } from '../../components/tamil'
import { AnimatedOutlet } from '../../components/layout/Shell'
import { eventByKey } from '../../lib/data'
import { COMMON, useLang, useT, type Bi } from '../../lib/i18n'
import { toast } from '../../lib/ui'
import { normalizePhone, useStore } from '../../lib/store'
import { AC, Avatar, ConfirmModal, StatusPill, useIsPhone } from './kit'

const copy = {
  viewSite: { en: 'View site', ta: 'இணையதளம்' },
  searchPh: { en: 'Search orders, clients, phone…', ta: 'ஆர்டர், பெயர், தொலைபேசி தேடு…' },
  searchShort: { en: 'Search…', ta: 'தேடு…' },
  noMatch: { en: 'No orders match', ta: 'பொருந்தும் ஆர்டர் இல்லை' },
  ordersHdr: { en: 'Orders', ta: 'ஆர்டர்கள்' },
  signOut: { en: 'Sign out', ta: 'வெளியேறு' },
  reset: { en: 'Reset demo data', ta: 'டெமோ தரவை மீட்டமை' },
  resetTitle: { en: 'Reset all demo data?', ta: 'அனைத்து டெமோ தரவையும் மீட்டமைக்கவா?' },
  resetBody: {
    en: 'Orders, payments, crew, leads, messages and CMS edits return to the original sample set. This cannot be undone.',
    ta: 'ஆர்டர்கள், கட்டணங்கள், குழு, வாய்ப்புகள், செய்திகள், CMS மாற்றங்கள் அனைத்தும் தொடக்க மாதிரிக்குத் திரும்பும். இதைத் திரும்பப் பெற முடியாது.',
  },
  resetDone: { en: 'Demo data restored', ta: 'டெமோ தரவு மீட்டமைக்கப்பட்டது' },
  role: { en: 'Studio administrator', ta: 'ஸ்டுடியோ நிர்வாகி' },
  integrations: { en: 'Integrations', ta: 'இணைப்புகள்' },
  waApi: { en: 'WhatsApp Business', ta: 'WhatsApp Business' },
  live: { en: 'Connected', ta: 'இணைந்துள்ளது' },
  menu: { en: 'Open menu', ta: 'மெனு திற' },
  closeMenu: { en: 'Close menu', ta: 'மெனு மூடு' },
  account: { en: 'Account', ta: 'கணக்கு' },
  signedOut: { en: 'Signed out', ta: 'வெளியேறினீர்கள்' },
  workspace: { en: 'Workspace', ta: 'பணியிடம்' },
  more: { en: 'More', ta: 'மேலும்' },
}

type NavItem = { to: string; label: Bi; icon: IconName; end?: boolean; count?: 'orders' | 'team' | 'messages' | 'leads' }
const NAV: NavItem[] = [
  { to: '/admin', label: AC.overview, icon: 'dashboard', end: true },
  { to: '/admin/orders', label: AC.orders, icon: 'receipt', count: 'orders' },
  { to: '/admin/team', label: AC.team, icon: 'users', count: 'team' },
  { to: '/admin/messages', label: AC.messages, icon: 'whatsapp', count: 'messages' },
  { to: '/admin/leads', label: AC.leads, icon: 'inbox', count: 'leads' },
  { to: '/admin/billing', label: AC.billing, icon: 'rupee' },
  { to: '/admin/cms', label: AC.cms, icon: 'image' },
]
const TABS = NAV.filter(n => ['/admin', '/admin/orders', '/admin/messages', '/admin/team'].includes(n.to))

function useCounts() {
  const orders = useStore(s => s.orders)
  const workers = useStore(s => s.workers)
  const outbox = useStore(s => s.outbox)
  const leads = useStore(s => s.leads)
  return useMemo(
    () => ({
      orders: orders.filter(o => o.status === 'ENQUIRY').length,
      team: workers.filter(w => w.available).length,
      messages: outbox.length,
      leads: leads.length,
    }),
    [orders, workers, outbox, leads],
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarContent({ onNavigate, layoutKey }: { onNavigate?: () => void; layoutKey: string }) {
  const lang = useLang()
  const t = useT(copy)
  const counts = useCounts()
  return (
    <div className="relative flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="group flex items-center gap-3 px-6 pb-7 pt-7">
        <LogoMark size={32} className="transition-transform duration-500 group-hover:rotate-[8deg]" />
        <span className="min-w-0 leading-tight">
          <span className={`block truncate text-white ${lang === 'ta' ? 'font-accent text-[15px] font-semibold' : 'font-display text-[20px] font-semibold tracking-tight'}`}>{COMMON.brandShort[lang]}</span>
          <span className="block text-[11px] font-medium text-white/40">{AC.console[lang]}</span>
        </span>
      </Link>

      <p className="t-label px-6 pb-2 text-white/30">{t.workspace}</p>
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Admin">
        {NAV.map(item => {
          const n = item.count ? counts[item.count] : 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `group relative flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14px] font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/55 hover:text-white'}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={`admin-nav-${layoutKey}`}
                      className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                    >
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-x-[1px] -translate-y-1/2 rounded-full bg-ruby-bright shadow-[0_0_12px_rgba(226,38,79,0.8)]" />
                    </motion.span>
                  )}
                  <Icon name={item.icon} size={18} className={`relative transition-colors ${isActive ? 'text-ruby-bright' : 'text-white/45 group-hover:text-white/80'}`} />
                  <span className="relative flex-1 truncate">{item.label[lang]}</span>
                  {item.count && n > 0 && (
                    <span className={`relative min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${item.count === 'orders' ? 'bg-ruby text-white' : 'bg-white/10 text-white/60'}`}>{n}</span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="flex-1" />

      {lang === 'ta' && (
        <div className="pointer-events-none flex justify-center pb-4 opacity-60">
          <Kolam size={84} className="text-ruby-bright/60" strokeWidth={1.2} />
        </div>
      )}

      <div className="mx-3 mb-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
        <p className="t-label mb-3 text-white/35">{t.integrations}</p>
        {[
          { icon: 'whatsapp' as const, label: t.waApi },
        ].map(i => (
          <div key={i.label} className="flex items-center gap-2.5 py-1 text-[12.5px] text-white/65">
            <Icon name={i.icon} size={15} className="text-white/40" />
            <span className="flex-1 truncate">{i.label}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/45">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-ruby-bright animate-pulse-ring" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-ruby-bright" />
              </span>
              {t.live}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Global search ───────────────────────────────────────────────────────────

function GlobalSearch() {
  const t = useT(copy)
  const lang = useLang()
  const orders = useStore(s => s.orders)
  const navigate = useNavigate()
  const phone = useIsPhone()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const d = s.replace(/\D/g, '')
    return orders
      .filter(o => o.id.toLowerCase().includes(s) || o.client.name.toLowerCase().includes(s) || (d.length >= 3 && normalizePhone(o.client.contact).includes(d)))
      .slice(0, 6)
  }, [q, orders])

  useEffect(() => setHi(0), [q])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement))) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [])

  const go = (id: string) => {
    navigate(`/admin/orders/${id}`)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 md:max-w-[440px]">
      <label className="group flex h-10 items-center rounded-full border border-ink/[0.08] bg-white/80 pl-3.5 pr-2 shadow-[0_1px_2px_rgba(10,10,11,0.04)] transition focus-within:border-ruby focus-within:bg-white focus-within:ring-4 focus-within:ring-ruby/10">
        <Icon name="search" size={16} className="shrink-0 text-ink/35 transition group-focus-within:text-ruby" />
        <span className="sr-only">{AC.search[lang]}</span>
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
            if (e.key === 'Enter' && results[hi]) go(results[hi].id)
            if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
          }}
          placeholder={phone ? t.searchShort : t.searchPh}
          role="combobox"
          aria-expanded={open && !!q}
          aria-controls="admin-search-list"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[16px] outline-none placeholder:text-ink/35 md:text-[14px]"
        />
        <kbd className="hidden shrink-0 rounded-md border border-ink/10 bg-ink/[0.03] px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink/40 md:block">⌘K</kbd>
      </label>

      <AnimatePresence>
        {open && q.trim() && (
          <motion.div
            id="admin-search-list"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="glass-strong absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-3xl p-2 max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[60px] max-md:max-h-[calc(100svh-80px)] max-md:overflow-y-auto"
          >
            <p className="t-label px-3 pb-1 pt-2 text-ink/40">{t.ordersHdr}</p>
            {results.length === 0 && <p className="px-3 py-4 text-[13.5px] text-ink/50">{t.noMatch} “{q}”</p>}
            {results.map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={i === hi}
                onMouseEnter={() => setHi(i)}
                onClick={() => go(o.id)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition cursor-pointer ${i === hi ? 'bg-ink/[0.05]' : ''}`}
              >
                <Avatar name={o.client.name} size={34} tone={i === hi ? 'ink' : 'muted'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{o.client.name}</span>
                  <span className="block truncate text-[12px] text-ink/50">
                    <span className="font-mono">{o.id}</span> · {eventByKey(o.eventType)?.name[lang]} · {o.client.contact}
                  </span>
                </span>
                <StatusPill status={o.status} eventType={o.eventType} className="hidden sm:inline-flex" />
                <Icon name="arrowRight" size={15} className={`text-ink/30 transition ${i === hi ? 'translate-x-0.5 text-ruby' : ''}`} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Account menu ────────────────────────────────────────────────────────────

function AccountMenu({ onReset }: { onReset: () => void }) {
  const t = useT(copy)
  const session = useStore(s => s.session)
  const logout = useStore(s => s.logout)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = session?.name ?? 'Admin'

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={t.account} className="flex h-10 items-center gap-2 rounded-full pl-1 pr-1 transition hover:bg-ink/[0.05] md:pr-3 cursor-pointer">
        <Avatar name={name} size={32} tone="ruby" />
        <span className="hidden max-w-[120px] truncate text-[13.5px] font-medium text-ink md:block">{name}</span>
        <Icon name="chevronDown" size={14} className={`hidden text-ink/40 transition-transform md:block ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="glass-strong absolute right-0 top-12 z-50 w-[min(16rem,calc(100vw-24px))] origin-top-right overflow-hidden rounded-3xl p-2"
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2">
              <Avatar name={name} size={40} tone="ruby" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
                <p className="truncate text-[12px] text-ink/50">{t.role}</p>
              </div>
            </div>
            <div className="h-px bg-ink/[0.06]" />
            <MenuRow icon="external" label={t.viewSite} onClick={() => { setOpen(false); navigate('/') }} />
            <MenuRow icon="refresh" label={t.reset} onClick={() => { setOpen(false); onReset() }} />
            <MenuRow
              icon="logout"
              label={t.signOut}
              danger
              onClick={() => {
                setOpen(false)
                logout()
                toast(t.signedOut)
                navigate('/admin/login', { replace: true })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`mt-1 flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13.5px] md:min-h-0 font-medium transition cursor-pointer ${danger ? 'text-ruby hover:bg-ruby-soft' : 'text-ink/75 hover:bg-ink/[0.05] hover:text-ink'}`}>
      <Icon name={icon} size={16} />
      {label}
    </button>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const t = useT(copy)
  const lang = useLang()
  const { pathname } = useLocation()
  const lenis = useLenis()
  const counts = useCounts()
  const inMore = !TABS.some(n => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  const [drawer, setDrawer] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => setDrawer(false), [pathname])
  useEffect(() => {
    if (drawer) lenis?.stop()
    else lenis?.start()
  }, [drawer, lenis])

  const doReset = () => {
    const name = useStore.getState().session?.name ?? 'Studio Admin'
    useStore.getState().resetDemo()
    // resetDemo clears the session too; keep the admin signed in.
    useStore.getState().loginAdmin(name)
    toast(t.resetDone)
  }

  return (
    <div className="min-h-[100svh] bg-mist">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] overflow-hidden text-white lg:block">
        <div className="ambient-dark absolute inset-0" />
        <div className="grain absolute inset-0" />
        {lang === 'ta' && <div className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.035]" />}
        <div className="absolute inset-y-0 right-0 w-px bg-white/[0.06]" />
        <div className="relative h-full overflow-y-auto no-scrollbar" data-lenis-prevent>
          <SidebarContent layoutKey="desk" />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[86%] max-w-[310px] overflow-hidden rounded-r-[28px] text-white shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.5, ease: EASE }}
              aria-label="Admin menu"
            >
              <div className="ambient-dark absolute inset-0" />
              <div className="grain absolute inset-0" />
              {lang === 'ta' && <div className="kolam-bg-white pointer-events-none absolute inset-0 opacity-[0.035]" />}
              <button type="button" onClick={() => setDrawer(false)} aria-label={t.closeMenu} className="absolute right-4 top-[calc(1.5rem+env(safe-area-inset-top))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:text-white cursor-pointer">
                <Icon name="x" size={16} />
              </button>
              <div className="relative h-full overflow-y-auto pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] no-scrollbar" data-lenis-prevent>
                <SidebarContent layoutKey="drawer" onNavigate={() => setDrawer(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-ink/[0.06] bg-mist/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-2.5 px-4 sm:gap-3 md:h-16 md:px-8">
            <button type="button" onClick={() => setDrawer(true)} aria-label={t.menu} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-ink/[0.05] md:flex lg:hidden cursor-pointer">
              <Icon name="menu" size={20} />
            </button>
            <Link to="/admin" className="shrink-0 lg:hidden" aria-label={COMMON.brand[lang]}>
              <LogoMark size={28} />
            </Link>
            <GlobalSearch />
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link to="/" className="hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-ink/60 transition hover:bg-ink/[0.05] hover:text-ink md:flex">
                <Icon name="external" size={15} />
                {t.viewSite}
              </Link>
              <AccountMenu onReset={() => setConfirmReset(true)} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 md:px-8 md:pb-24 md:pt-10">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <AnimatedOutlet />
          </Suspense>
        </main>
      </div>

      {/* Phone tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.06] bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden" aria-label="Admin">
        <div className="grid h-16 grid-cols-5 px-1">
          {TABS.map(item => {
            const n = item.count ? counts[item.count] : 0
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors ${isActive ? 'text-ink' : 'text-ink/45'}`}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="admin-tab" className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-ruby" transition={{ type: 'spring', stiffness: 420, damping: 38 }} />}
                    <span className="relative">
                      <Icon name={item.icon} size={21} className={isActive ? 'text-ruby' : ''} />
                      {item.count === 'orders' && n > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-[17px] rounded-full bg-ruby px-1 text-center text-[10px] font-semibold leading-[17px] text-white ring-2 ring-white tabular-nums">{n}</span>}
                    </span>
                    <span className={`max-w-full truncate text-[10.5px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label[lang]}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          <button type="button" onClick={() => setDrawer(true)} aria-label={t.menu} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors cursor-pointer ${inMore ? 'text-ink' : 'text-ink/45'}`}>
            {inMore && <motion.span layoutId="admin-tab" className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-ruby" transition={{ type: 'spring', stiffness: 420, damping: 38 }} />}
            <Icon name="menu" size={21} className={inMore ? 'text-ruby' : ''} />
            <span className={`max-w-full truncate text-[10.5px] leading-tight ${inMore ? 'font-semibold' : 'font-medium'}`}>{t.more}</span>
          </button>
        </div>
      </nav>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        title={t.resetTitle}
        body={t.resetBody}
        confirmLabel={t.reset}
        icon="refresh"
      />
    </div>
  )
}
