import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router'
import { Icon } from '../../../components/Icon'
import { BackLink, Button, EmptyState } from '../../../components/ui'
import { PRINT_CSS } from '../../../components/InvoiceDoc'
import { formatDate, formatINR, useLang, useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { PRODUCT } from '../../../saas/brand'
import { useStudioStore } from '../../../saas/store'
import { StudioMark } from '../../../saas/theme'
import { planTotal, type EventStatus, type PaymentStatus, type PlanKey, type Studio, type StudioMessage, type StudioTerm } from '../../../saas/types'
import { GRACE_DAYS, daysLeft, deriveStatus, expiredOn, formatBytes, graceLeftDays, linksLive, planOf } from '../../../saas/usage'
import { ConfirmModal, FormSelect, MODE_LABEL, Meta, PageHeader, Panel, SaveBar, Switch, TextInput, WaBubble, WaFrame, relTime, telHref, waHref } from '../kit'
import { monthLabel, reminderText, revokedText, studioRow, usageSeries } from './helpers'
import { MarkPaidModal, PH, PlanPrice, StudioStatusPill, notifyWa, useWingData } from './shared'
import { ControlsPanel, CustomersPanel } from './StudioControls'

const copy = {
  back: { en: 'All studios', ta: 'அனைத்து ஸ்டுடியோக்களும்' },
  notFound: { en: 'Studio not found', ta: 'ஸ்டுடியோ இல்லை' },
  notFoundBody: { en: 'It may have been removed, or the demo data was reset.', ta: 'நீக்கப்பட்டிருக்கலாம் அல்லது டெமோ தரவு மீட்டமைக்கப்பட்டிருக்கலாம்.' },
  openPanel: { en: 'Open their panel', ta: 'அவர்கள் பேனலைத் திற' },
  joined: { en: 'Signed up', ta: 'பதிவு' },
  until: { en: 'Paid until', ta: 'வரை செலுத்தப்பட்டது' },
  // payment
  payment: { en: 'Payment', ta: 'கட்டணம்' },
  pending: { en: 'Pending', ta: 'நிலுவை' },
  paid: { en: 'Paid', ta: 'செலுத்தப்பட்டது' },
  revoke: { en: 'Revoke', ta: 'ரத்து செய்' },
  cancelStudio: { en: 'Cancel account', ta: 'கணக்கை ரத்து செய்' },
  pendingTitle: { en: 'Set payment back to pending?', ta: 'கட்டணத்தை நிலுவைக்கு மாற்றவா?' },
  pendingBody: { en: 'They cannot sign in until you mark Paid again. Client links stop now.', ta: 'மீண்டும் "செலுத்தப்பட்டது" அழுத்தும் வரை உள்நுழைய முடியாது.' },
  revokeTitle: { en: 'Revoke this payment?', ta: 'இந்தக் கட்டணத்தை ரத்து செய்யவா?' },
  revokeBody: { en: `They lose sign-in at once. Client links they already shared keep working for ${GRACE_DAYS} days, then stop until you mark Paid.`, ta: `உடனே உள்நுழைவு நிற்கும். பகிர்ந்த இணைப்புகள் ${GRACE_DAYS} நாள் வேலை செய்யும்.` },
  cancelTitle: { en: 'Cancel this account?', ta: 'இந்தக் கணக்கை ரத்து செய்யவா?' },
  cancelBody: { en: 'They can no longer sign in and every client link stops at once. Their records stay here. Marking Paid later reopens it.', ta: 'அவர்கள் உள்நுழைய முடியாது; அனைத்து இணைப்புகளும் உடனே நிற்கும். பதிவுகள் இங்கே இருக்கும்.' },
  notify: { en: 'Tell them on WhatsApp', ta: 'WhatsApp-ல் தெரிவி' },
  graceLeft: { en: 'Client links keep working for {n} more day(s), then stop.', ta: 'வாடிக்கையாளர் இணைப்புகள் இன்னும் {n} நாள் வேலை செய்யும்.' },
  graceOver: { en: `The ${GRACE_DAYS}-day grace is over: client links are off until you mark Paid.`, ta: `${GRACE_DAYS} நாள் சலுகை முடிந்தது: கட்டணம் உறுதியாகும் வரை இணைப்புகள் இயங்காது.` },
  pendingBanner: { en: 'Waiting for payment. Mark Paid once the money is in to let them sign in.', ta: 'கட்டணத்திற்குக் காத்திருக்கிறது. பணம் வந்ததும் "செலுத்தப்பட்டது" அழுத்தவும்.' },
  revokedBanner: { en: 'Payment revoked', ta: 'கட்டணம் ரத்து' },
  expiredBanner: { en: 'Term expired', ta: 'காலம் முடிந்தது' },
  cancelledBanner: { en: 'Account cancelled. Client links are off.', ta: 'கணக்கு ரத்து. இணைப்புகள் இயங்காது.' },
  daysLeft: { en: 'days left', ta: 'நாள் மீதம்' },
  saved: { en: 'Studio updated', ta: 'புதுப்பிக்கப்பட்டது' },
  // usage
  usage: { en: 'Usage', ta: 'பயன்பாடு' },
  usageSub: { en: 'Client galleries opened, last 6 months (plans do not cap this)', ta: 'திறந்த கேலரிகள், கடந்த 6 மாதம்' },
  thisMonth: { en: 'This month', ta: 'இம்மாதம்' },
  galleries: { en: 'galleries', ta: 'கேலரிகள்' },
  storage: { en: 'Proof storage', ta: 'சேமிப்பு' },
  drives: { en: 'Drives tracked', ta: 'பதிவு செய்த டிரைவ்கள்' },
  events: { en: 'Galleries', ta: 'கேலரிகள்' },
  eventsSub: { en: 'Counts and status only. Client photos are not browsed from here.', ta: 'எண்ணிக்கையும் நிலையும் மட்டும்.' },
  noEvents: { en: 'No galleries yet.', ta: 'இன்னும் கேலரி இல்லை.' },
  proofs: { en: 'proofs', ta: 'படங்கள்' },
  picked: { en: 'picked', ta: 'தேர்வு' },
  deadline: { en: 'due', ta: 'கெடு' },
  // terms
  terms: { en: 'Terms paid', ta: 'செலுத்திய காலங்கள்' },
  termsSub: { en: 'One line per payment. Print a receipt for any of them.', ta: 'ஒவ்வொரு கட்டணத்திற்கும் ஒரு வரி.' },
  noTerms: { en: 'No payments yet.', ta: 'இன்னும் கட்டணம் இல்லை.' },
  receipt: { en: 'Receipt', ta: 'ரசீது' },
  // messages
  remind: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  reminder: { en: 'WhatsApp', ta: 'WhatsApp' },
  reminderSub: { en: 'Opens WhatsApp with this text and logs it here', ta: 'இந்த உரையுடன் WhatsApp திறக்கும்' },
  message: { en: 'Message', ta: 'செய்தி' },
  sent: { en: 'Opened WhatsApp and logged the message', ta: 'WhatsApp திறந்து பதிவு செய்யப்பட்டது' },
  log: { en: 'Message log', ta: 'செய்திப் பதிவு' },
  noMessages: { en: 'Nothing sent to this studio yet.', ta: 'இன்னும் எதுவும் அனுப்பப்படவில்லை.' },
  // profile
  profile: { en: 'Profile & branding', ta: 'சுயவிவரம் & பிராண்டிங்' },
  name: { en: 'Studio name', ta: 'ஸ்டுடியோ பெயர்' },
  owner: { en: 'Owner', ta: 'உரிமையாளர்' },
  phone: { en: 'Phone (login)', ta: 'தொலைபேசி (உள்நுழைவு)' },
  whatsapp: { en: 'WhatsApp', ta: 'WhatsApp' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  city: { en: 'City', ta: 'ஊர்' },
  accent: { en: 'Accent colour', ta: 'நிறம்' },
  watermark: { en: 'Watermark text', ta: 'நீர்க்குறி' },
  logo: { en: 'Logo URL', ta: 'லோகோ URL' },
  plan: { en: 'Plan', ta: 'திட்டம்' },
  planChanged: { en: 'Plan changed', ta: 'திட்டம் மாற்றப்பட்டது' },
  planNote: { en: 'A change applies from the next payment. The running term and past receipts stay as they are.', ta: 'மாற்றம் அடுத்த கட்டணம் முதல் பொருந்தும்.' },
  notes: { en: 'Notes', ta: 'குறிப்புகள்' },
  notesPh: { en: 'Only TTC staff see this', ta: 'TTC பணியாளர்கள் மட்டும்' },
  saveNotes: { en: 'Save notes', ta: 'சேமி' },
  notesSaved: { en: 'Notes saved', ta: 'சேமிக்கப்பட்டது' },
}

const EVENT_STATUS: Record<EventStatus, string> = { draft: 'Draft', uploading: 'Uploading', open: 'Open', submitted: 'Submitted', closed: 'Closed', archived: 'Archived' }
const TEMPLATE_LABEL: Record<StudioMessage['template'], string> = { paid: 'studio_paid', reminder: 'payment_reminder', revoked: 'studio_revoked', custom: 'custom' }

type Confirm = 'pending' | 'revoke' | 'cancel' | null

export default function StudioDetail() {
  const { id = '' } = useParams()
  const t = useT(copy)
  const lang = useLang()
  const navigate = useNavigate()
  const data = useWingData()
  const studio = data.studios.find(s => s.id === id)
  useTitle({ en: studio ? studio.name : 'Studio', ta: studio ? studio.name : 'ஸ்டுடியோ' })

  if (!studio) {
    return (
      <div>
        <BackLink to="/admin/photographers">{t.back}</BackLink>
        <div className="mt-6"><EmptyState icon="camera" title={t.notFound} body={t.notFoundBody} /></div>
      </div>
    )
  }

  const status = deriveStatus(studio)
  const openPanel = () => {
    useStudioStore.getState().viewAsStudio(studio.id)
    navigate('/studio')
  }

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <BackLink to="/admin/photographers">{t.back}</BackLink>
      <div className="mt-5" />
      <PageHeader
        eyebrow={PH.wing[lang]}
        title={studio.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StudioStatusPill status={status} />
            <span>{studio.ownerName} · {studio.city}</span>
            <a href={telHref(studio.phone)} className="tabular-nums hover:text-ruby">{studio.phone}</a>
            <span className="text-ink/40">{t.joined} {formatDate(studio.createdAt, lang)}{studio.sub.endsAt && studio.sub.payment === 'paid' ? ` · ${t.until} ${formatDate(studio.sub.endsAt, lang)}` : ''}</span>
          </span>
        }
        actions={
          <>
            <Button onClick={openPanel} variant="ink" size="sm" iconLeft="eye" className="flex-1 md:flex-none" disabled={status === 'cancelled'}>{t.openPanel}</Button>
            <Button href={waHref(studio.whatsapp)} variant="outline" size="sm" iconLeft="whatsapp" className="flex-1 md:flex-none">WhatsApp</Button>
          </>
        }
      >
        <div className="mt-4"><StudioMark studio={studio} size={44} /></div>
      </PageHeader>

      <StatusBanner studio={studio} />

      <div key={studio.id} className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 md:space-y-5 lg:col-span-2">
          <UsagePanel studio={studio} />
          <CustomersPanel studio={studio} />
          <EventsPanel studio={studio} />
          <TermsPanel studio={studio} />
          <MessagesPanel studio={studio} />
        </div>
        <div className="min-w-0 space-y-4 md:space-y-5">
          <PaymentPanel studio={studio} />
          <PlanPanel studio={studio} />
          <ControlsPanel studio={studio} />
          <ProfilePanel key={studio.id} studio={studio} />
          <NotesPanel key={`n-${studio.id}`} studio={studio} />
        </div>
      </div>
    </div>
  )
}

// ─── Payment status ──────────────────────────────────────────────────────────

function StatusBanner({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const status = deriveStatus(studio)
  if (status === 'active') return null
  let body: string
  if (status === 'paused') {
    const left = graceLeftDays(studio)
    const exp = expiredOn(studio)
    const head = exp ? `${t.expiredBanner} ${formatDate(exp, lang)}` : `${t.revokedBanner} ${relTime(studio.sub.changedAt, lang)}`
    body = `${head}. ${linksLive(studio) && left > 0 ? t.graceLeft.replace('{n}', String(left)) : t.graceOver}`
  } else body = status === 'pending' ? t.pendingBanner : t.cancelledBanner
  return (
    <div className={`mb-5 flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[13.5px] ${status === 'cancelled' ? 'border hairline bg-white text-ink/60' : 'glass-ruby-tint text-ruby-deep'}`}>
      <Icon name={status === 'paused' ? 'clock' : 'info'} size={17} className="mt-0.5 shrink-0" />
      <p className="leading-relaxed">{body}</p>
    </div>
  )
}

/** Pending / Paid / Revoke: the real gate for /studio sign-in. */
function PaymentPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [paying, setPaying] = useState(false)
  const [notify, setNotify] = useState(true)
  const st = useStudioStore.getState
  const status = deriveStatus(studio)
  const pay = studio.sub.payment
  const left = daysLeft(studio)
  const open = (c: Confirm) => {
    setNotify(true)
    setConfirm(c)
  }

  const run = () => {
    if (confirm === 'pending') st().markPending(studio.id)
    else if (confirm === 'revoke') {
      st().revokePaid(studio.id)
      if (notify) notifyWa(studio, revokedText(studio, GRACE_DAYS, PRODUCT.name), 'revoked')
    } else if (confirm === 'cancel') st().cancelStudio(studio.id)
    toast(t.saved)
  }

  const map: Record<Exclude<Confirm, null>, { title: string; body: string; label: string; icon: 'clock' | 'x' }> = {
    pending: { title: t.pendingTitle, body: t.pendingBody, label: t.pending, icon: 'clock' },
    revoke: { title: t.revokeTitle, body: t.revokeBody, label: t.revoke, icon: 'x' },
    cancel: { title: t.cancelTitle, body: t.cancelBody, label: t.cancelStudio, icon: 'x' },
  }
  const m = confirm ? map[confirm] : null
  const seg = (k: PaymentStatus, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} aria-pressed={pay === k} className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-[13px] font-semibold transition ${pay === k ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/[0.05]'}`}>
      {label}
    </button>
  )

  return (
    <Panel title={t.payment} icon="rupee">
      <div className="flex items-center gap-2"><StudioStatusPill status={status} />{status === 'active' && <span className="text-[12.5px] tabular-nums text-ink/55">{left} {t.daysLeft}</span>}</div>
      <div className="mt-4 flex gap-1 rounded-2xl bg-ink/[0.04] p-1" role="group" aria-label={t.payment}>
        {seg('pending', t.pending, () => pay !== 'pending' && open('pending'))}
        {seg('paid', `👍 ${t.paid}`, () => setPaying(true))}
        {seg('revoked', t.revoke, () => pay !== 'revoked' && open('revoke'))}
      </div>
      {studio.sub.endsAt && pay === 'paid' && <p className="mt-3 text-[12.5px] text-ink/55">{t.until} {formatDate(studio.sub.endsAt, lang)}</p>}
      {status === 'paused' && <p className="mt-3 text-[12.5px] leading-relaxed text-ink/45">{graceLeftDays(studio) > 0 ? t.graceLeft.replace('{n}', String(graceLeftDays(studio))) : t.graceOver}</p>}
      {status !== 'cancelled' && (
        <div className="mt-4 border-t hairline pt-3">
          <Button size="sm" variant="ghost" iconLeft="x" onClick={() => open('cancel')}>{t.cancelStudio}</Button>
        </div>
      )}
      <MarkPaidModal studio={studio} open={paying} onClose={() => setPaying(false)} />
      <ConfirmModal open={!!m} onClose={() => setConfirm(null)} onConfirm={run} title={m?.title ?? ''} body={m?.body} confirmLabel={m?.label ?? ''} icon={m?.icon}>
        {confirm === 'revoke' && (
          <label className="flex items-center justify-between gap-3 text-[13.5px] text-ink/70">
            {t.notify}
            <Switch checked={notify} onChange={setNotify} label={t.notify} size="sm" />
          </label>
        )}
      </ConfirmModal>
    </Panel>
  )
}

// ─── Usage ───────────────────────────────────────────────────────────────────

function UsagePanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const data = useWingData()
  const drives = useStudioStore(s => s.drives)
  const row = useMemo(() => studioRow(studio, data), [studio, data])
  const series = useMemo(() => usageSeries(studio.id, data.events, 6), [studio.id, data.events])
  const max = Math.max(1, ...series.map(s => s.count))
  const mine = drives.filter(d => d.studioId === studio.id && d.status !== 'retired')
  const driveBytes = mine.reduce((n, d) => n + d.usedBytes, 0)
  return (
    <Panel title={t.usage} subtitle={t.usageSub} icon="dashboard">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
        <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={series.map(s => `${monthLabel(s.month)}: ${s.count}`).join(', ')}>
          {series.map((s, i) => {
            const last = i === series.length - 1
            return (
              <div key={s.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`text-[12px] font-semibold tabular-nums ${s.count ? 'text-ink' : 'text-ink/30'}`}>{s.count}</span>
                <div className={`w-full max-w-[44px] rounded-t-md ${last ? 'bg-ink' : 'bg-ink/25'}`} style={{ height: `${(s.count / max) * 100}%`, minHeight: 2 }} />
                <span className={`text-[11px] ${last ? 'font-semibold text-ink' : 'text-ink/45'}`}>{monthLabel(s.month, true)}</span>
              </div>
            )
          })}
        </div>
        <dl className="grid grid-cols-2 gap-4 md:w-52 md:grid-cols-1">
          <Meta label={t.thisMonth}><span className="tabular-nums">{row.clients} {t.galleries} · {row.plan.name}</span></Meta>
          <Meta label={t.storage}><span className="tabular-nums">{formatBytes(row.storage)}</span></Meta>
          <Meta label={t.drives}><span className="tabular-nums">{mine.length}{mine.length ? ` · ${formatBytes(driveBytes)}` : ''}</span></Meta>
        </dl>
      </div>
    </Panel>
  )
}

function EventsPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const events = useStudioStore(s => s.events)
  const proofs = useStudioStore(s => s.proofs)
  const picks = useStudioStore(s => s.picks)
  const mine = useMemo(() => events.filter(e => e.studioId === studio.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [events, studio.id])
  const proofCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of proofs) m[p.eventId] = (m[p.eventId] ?? 0) + 1
    return m
  }, [proofs])
  return (
    <Panel title={`${t.events} · ${mine.length}`} subtitle={t.eventsSub} icon="image" bodyClass="p-0">
      {!mine.length ? (
        <p className="px-5 py-6 text-[13.5px] text-ink/45 md:px-6">{t.noEvents}</p>
      ) : (
        <ul className="divide-y divide-ink/[0.06]">
          {mine.map(e => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 md:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{e.title}</p>
                <p className="truncate text-[12px] text-ink/45">
                  {formatDate(e.date, lang)} · {proofCount[e.id] ?? 0} {t.proofs} · {(picks[e.id] ?? []).length}/{e.quota} {t.picked}
                  {e.status === 'open' ? ` · ${t.deadline} ${formatDate(e.deadline, lang)}` : ''}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${e.status === 'open' ? 'bg-ruby-soft text-ruby-deep' : e.status === 'submitted' ? 'bg-ink text-white' : 'bg-ink/[0.06] text-ink/60'}`}>{EVENT_STATUS[e.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

// ─── Terms ───────────────────────────────────────────────────────────────────

function TermsPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const lang = useLang()
  const plans = useStudioStore(s => s.plans)
  const terms = useStudioStore(s => s.terms)
  const mine = useMemo(() => terms.filter(x => x.studioId === studio.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt)), [terms, studio.id])
  const [printing, setPrinting] = useState<StudioTerm | null>(null)
  useEffect(() => {
    if (printing) window.print()
  }, [printing])

  return (
    <Panel id="terms" title={t.terms} subtitle={t.termsSub} icon="receipt" bodyClass="p-0">
      {!mine.length ? (
        <p className="px-5 py-6 text-[13.5px] text-ink/45 md:px-6">{t.noTerms}</p>
      ) : (
        <ul className="divide-y divide-ink/[0.06]">
          {mine.map(x => (
            <li key={x.id} className="flex items-center gap-3 px-5 py-3.5 md:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold tabular-nums text-ink">{formatINR(x.amount)} <span className="font-normal text-ink/50">· {planOf(plans, x.plan).name} · {MODE_LABEL[x.mode][lang]}</span></p>
                <p className="truncate text-[12px] text-ink/45">{formatDate(x.from, lang)} → {formatDate(x.to, lang)}{x.note ? ` · ${x.note}` : ''}</p>
              </div>
              <Button size="sm" variant="outline" iconLeft="receipt" onClick={() => setPrinting({ ...x })}>{t.receipt}</Button>
            </li>
          ))}
        </ul>
      )}
      {typeof document !== 'undefined' && printing &&
        createPortal(
          <div id="ttc-print">
            <PrintableReceipt studio={studio} term={printing} planName={planOf(plans, printing.plan).name} />
          </div>,
          document.body,
        )}
    </Panel>
  )
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** Plain black-on-white receipt for one paid term (InvoiceDoc is order-shaped, so this is its own document). */
function PrintableReceipt({ studio, term, planName }: { studio: Studio; term: StudioTerm; planName: string }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#0a0a0b', fontSize: 12, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: 12 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>The Treasure Capture Events</p>
          <p style={{ color: '#666' }}>{PRODUCT.name} · Madurai</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Receipt</p>
          <p style={{ color: '#666' }}>No. {term.id.toUpperCase()}</p>
          <p style={{ color: '#666' }}>{day(term.paidAt)}</p>
        </div>
      </div>
      <div style={{ margin: '14px 0' }}>
        <p style={{ color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Received from</p>
        <p style={{ fontWeight: 600 }}>{studio.name}</p>
        <p>{studio.ownerName} · {studio.city} · {studio.phone}{studio.email ? ` · ${studio.email}` : ''}</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #0a0a0b', textAlign: 'left' }}>
            <th style={{ padding: '6px 0' }}>Plan</th>
            <th>Period</th>
            <th>Paid by</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '6px 0' }}>{planName}</td>
            <td>{day(term.from)} to {day(term.to)}</td>
            <td>{term.mode.toUpperCase()}{term.note ? ` · ${term.note}` : ''}</td>
            <td style={{ textAlign: 'right' }}>{formatINR(term.amount)}</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '10px 0', fontWeight: 600 }}>Total received</td>
            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(term.amount)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginTop: 24, color: '#666' }}>Thank you. Keep this receipt for your records.</p>
    </div>
  )
}

// ─── Messages ────────────────────────────────────────────────────────────────

function MessagesPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const plans = useStudioStore(s => s.plans)
  const messages = useStudioStore(s => s.messages)
  const status = deriveStatus(studio)
  const owes = status === 'pending' || status === 'paused'
  const suggested = reminderText(studio, planOf(plans, studio.sub.plan), PRODUCT.name)
  const [body, setBody] = useState(suggested)
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched) setBody(suggested)
  }, [suggested, touched])
  const mine = messages.filter(m => m.studioId === studio.id)

  const send = () => {
    if (!body.trim()) return
    notifyWa(studio, body.trim(), touched ? 'custom' : 'reminder')
    setTouched(false)
    toast(t.sent)
  }

  return (
    <Panel title={t.reminder} subtitle={t.reminderSub} icon="whatsapp">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <TextInput label={t.message} value={body} onChange={v => { setBody(v); setTouched(true) }} rows={6} />
          <Button size="sm" iconLeft="whatsapp" onClick={send} variant={owes ? 'ruby' : 'outline'}>{t.remind}</Button>
        </div>
        <div>
          <p className="t-label mb-3 text-ink/50">{t.log}</p>
          {!mine.length ? (
            <p className="text-[13px] text-ink/45">{t.noMessages}</p>
          ) : (
            <WaFrame name={studio.name} sub={studio.whatsapp}>
              {mine.slice(-8).map(m => <WaBubble key={m.id} body={m.body} template={TEMPLATE_LABEL[m.template]} at={m.at} compact />)}
            </WaFrame>
          )}
        </div>
      </div>
    </Panel>
  )
}

// ─── Plan, profile, notes ────────────────────────────────────────────────────

function PlanPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const plans = useStudioStore(s => s.plans)
  const plan = planOf(plans, studio.sub.plan)
  return (
    <Panel title={t.plan} icon="grid">
      <FormSelect<PlanKey>
        label={t.plan}
        value={studio.sub.plan}
        onChange={v => {
          useStudioStore.getState().changePlan(studio.id, v)
          toast(t.planChanged)
        }}
        options={plans.map(p => ({ value: p.key, label: `${p.name} · ₹${planTotal(p).toLocaleString('en-IN')}` }))}
      />
      <p className="mt-3 text-[13.5px] font-medium text-ink"><PlanPrice plan={plan} /></p>
      <p className="mt-2 text-[12px] leading-relaxed text-ink/45">{t.planNote}</p>
    </Panel>
  )
}

type Draft = Pick<Studio, 'name' | 'ownerName' | 'phone' | 'whatsapp' | 'city' | 'accent' | 'watermark'> & { email: string; logoUrl: string }
const toDraft = (s: Studio): Draft => ({ name: s.name, ownerName: s.ownerName, phone: s.phone, whatsapp: s.whatsapp, email: s.email ?? '', city: s.city, accent: s.accent, watermark: s.watermark, logoUrl: s.logoUrl })

function ProfilePanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const base = useMemo(() => toDraft(studio), [studio])
  const [d, setD] = useState<Draft>(base)
  const dirty = (Object.keys(base) as (keyof Draft)[]).some(k => base[k] !== d[k])
  const f = (k: keyof Draft) => (v: string) => setD(x => ({ ...x, [k]: v }))
  const save = () => {
    useStudioStore.getState().updateStudio(studio.id, { ...d, name: d.name.trim() || studio.name, email: d.email.trim() || undefined, logoUrl: d.logoUrl.trim() || studio.logoUrl })
    toast(t.saved)
  }
  return (
    <Panel title={t.profile} icon="edit">
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
          <StudioMark studio={{ name: d.name || studio.name, accent: d.accent, logoUrl: d.logoUrl || studio.logoUrl }} size={40} />
          <span className="min-w-0 truncate text-[12px] text-ink/50">{d.watermark}</span>
        </div>
        <TextInput label={t.name} value={d.name} onChange={f('name')} />
        <TextInput label={t.owner} value={d.ownerName} onChange={f('ownerName')} />
        <div className="grid grid-cols-2 gap-3">
          <TextInput label={t.phone} value={d.phone} onChange={f('phone')} inputMode="tel" />
          <TextInput label={t.whatsapp} value={d.whatsapp} onChange={f('whatsapp')} inputMode="tel" />
        </div>
        <TextInput label={t.email} value={d.email} onChange={f('email')} inputMode="email" />
        <TextInput label={t.city} value={d.city} onChange={f('city')} />
        <div>
          <p className="t-label mb-1.5 text-ink/50">{t.accent}</p>
          <div className="flex items-center gap-2">
            <input type="color" aria-label={t.accent} value={d.accent} onChange={e => f('accent')(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-ink/10 bg-white p-1" />
            <TextInput label="" value={d.accent} onChange={f('accent')} className="flex-1 [&>label]:hidden" />
          </div>
        </div>
        <TextInput label={t.watermark} value={d.watermark} onChange={f('watermark')} />
        <TextInput label={t.logo} value={d.logoUrl} onChange={f('logoUrl')} inputMode="url" placeholder="https://" />
      </div>
      <SaveBar show={dirty} onSave={save} onDiscard={() => setD(base)} />
    </Panel>
  )
}

function NotesPanel({ studio }: { studio: Studio }) {
  const t = useT(copy)
  const [notes, setNotes] = useState(studio.notes)
  const dirty = notes !== studio.notes
  return (
    <Panel title={t.notes} icon="book">
      <TextInput label={t.notes} value={notes} onChange={setNotes} rows={4} placeholder={t.notesPh} className="[&>label]:sr-only" />
      <div className="mt-3">
        <Button size="sm" variant={dirty ? 'ink' : 'outline'} disabled={!dirty} onClick={() => { useStudioStore.getState().updateStudio(studio.id, { notes }); toast(t.notesSaved) }}>{t.saveNotes}</Button>
      </div>
    </Panel>
  )
}
