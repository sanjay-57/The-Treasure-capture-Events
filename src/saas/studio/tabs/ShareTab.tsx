import { Icon } from '../../../components/Icon'
import { Qr } from '../../../components/Qr'
import { Button } from '../../../components/ui'
import { CopyButton, Panel, waHref } from '../../../pages/admin/kit'
import { formatDate, useLang, useT } from '../../../lib/i18n'
import { useStudioStore } from '../../store'
import type { Studio, StudioEvent } from '../../types'
import { deriveStatus } from '../../usage'
import { daysLeft, galleryLink } from '../shared'

const copy = {
  openH: { en: 'Open the gallery to your client', ta: 'காட்சியகத்தை வாடிக்கையாளருக்குத் திறக்கவும்' },
  openB: { en: 'The link starts working and the deadline counts down.', ta: 'இணைப்பு செயல்படத் தொடங்கும், காலக்கெடு எண்ணப்படும்.' },
  open: { en: 'Open gallery', ta: 'காட்சியகத்தைத் திற' },
  noProofs: { en: 'Upload proofs first.', ta: 'முதலில் படங்களைப் பதிவேற்றுங்கள்.' },
  notActive: { en: 'Your studio is not active, so new galleries cannot be opened. See Account.', ta: 'உங்கள் ஸ்டுடியோ செயலில் இல்லை; புதிய காட்சியகங்களைத் திறக்க முடியாது. கணக்கைப் பாருங்கள்.' },
  link: { en: 'Gallery link', ta: 'காட்சியக இணைப்பு' },
  copyLink: { en: 'Copy link', ta: 'இணைப்பை நகலெடு' },
  pin: { en: 'PIN', ta: 'PIN' },
  noPin: { en: 'No PIN: anyone with the link can open it.', ta: 'PIN இல்லை: இணைப்பு உள்ள எவரும் திறக்கலாம்.' },
  copyPin: { en: 'Copy PIN', ta: 'PIN நகலெடு' },
  qr: { en: 'QR code', ta: 'QR குறியீடு' },
  qrB: { en: 'Show it on your phone or print it on the delivery envelope.', ta: 'உங்கள் கைப்பேசியில் காட்டுங்கள் அல்லது டெலிவரி உறையில் அச்சிடுங்கள்.' },
  wa: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  waB: { en: 'Message in the client’s language', ta: 'வாடிக்கையாளர் மொழியில் செய்தி' },
  copyMsg: { en: 'Copy message', ta: 'செய்தியை நகலெடு' },
  noPhone: { en: 'Add the client’s WhatsApp number in Settings.', ta: 'அமைப்புகளில் வாடிக்கையாளர் WhatsApp எண்ணைச் சேர்க்கவும்.' },
  closedNote: { en: 'The client can still view the gallery but cannot change their selection.', ta: 'வாடிக்கையாளர் காட்சியகத்தைப் பார்க்கலாம், ஆனால் தேர்வை மாற்ற முடியாது.' },
}

function message(ev: StudioEvent, studio: Studio, link: string): string {
  const due = formatDate(ev.deadline, ev.lang, { day: 'numeric', month: 'long' })
  if (ev.lang === 'ta') {
    return [
      `வணக்கம் ${ev.clientNames}!`,
      `உங்கள் "${ev.title}" படங்கள் தயார். ஆல்பத்திற்கு ${ev.quota} படங்களைத் தேர்வு செய்யுங்கள்:`,
      link,
      ev.pin ? `PIN: ${ev.pin}` : '',
      `${due}-க்குள் சமர்ப்பிக்கவும்.`,
      `— ${studio.name}`,
    ].filter(Boolean).join('\n')
  }
  return [
    `Hi ${ev.clientNames}!`,
    `Your photos from "${ev.title}" are ready. Please pick ${ev.quota} for the album:`,
    link,
    ev.pin ? `PIN: ${ev.pin}` : '',
    `Please submit by ${due}.`,
    `— ${studio.name}`,
  ].filter(Boolean).join('\n')
}

/** `link` overrides the /s/<code> link (a project's gallery uses /gallery/<project code>). */
export function ShareTab({ event: ev, studio, link: linkOverride }: { event: StudioEvent; studio: Studio; link?: string }) {
  const t = useT(copy)
  const lang = useLang()
  const proofCount = useStudioStore(s => s.proofs.reduce((n, p) => (p.eventId === ev.id ? n + 1 : n), 0))
  const openEvent = useStudioStore(s => s.openEvent)
  const logActivity = useStudioStore(s => s.logActivity)
  const link = linkOverride ?? galleryLink(ev)
  const notYetOpen = ev.status === 'draft' || ev.status === 'uploading'
  const msg = message(ev, studio, link)
  const dl = daysLeft(ev.deadline)

  return (
    <div className="grid gap-6">
      {notYetOpen && (
        <div className="rounded-[26px] border border-ink/[0.08] bg-white p-5 md:p-7">
          <h2 className="text-[18px] font-semibold text-ink">{t.openH}</h2>
          <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink/55">{t.openB}</p>
          {!proofCount ? (
            <p className="mt-4 text-[13.5px] font-medium text-ink/70">{t.noProofs}</p>
          ) : deriveStatus(studio) !== 'active' ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[13.5px] text-amber-950">{t.notActive}</p>
          ) : (
            <div className="mt-5"><Button onClick={() => openEvent(ev.id)} icon="arrowRight">{t.open}</Button></div>
          )}
        </div>
      )}
      {(ev.status === 'closed' || ev.status === 'submitted') && <p className="rounded-2xl bg-ink/[0.05] px-4 py-3 text-[13.5px] text-ink/70">{t.closedNote}</p>}

      <div className={`grid gap-6 lg:grid-cols-[1fr_280px] ${notYetOpen ? 'pointer-events-none opacity-45' : ''}`} aria-disabled={notYetOpen}>
        <div className="grid gap-6">
          <Panel title={t.link} icon="globe">
            <div className="flex items-center gap-2 rounded-2xl bg-ink/[0.04] px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-ink">{link}</span>
              <CopyButton text={link} label={t.copyLink} />
            </div>
            <div className="mt-4 flex items-center gap-3 text-[13.5px]">
              <span className="t-label text-ink/45">{t.pin}</span>
              {ev.pin ? <><span className="font-mono text-[16px] font-semibold tracking-[0.2em] text-ink">{ev.pin}</span><CopyButton text={ev.pin} label={t.copyPin} /></> : <span className="text-ink/55">{t.noPin}</span>}
            </div>
            {ev.status === 'open' && <p className="mt-3 text-[12.5px] text-ink/50">{formatDate(ev.deadline, lang)} · {dl >= 0 ? `${dl}` : '0'} d</p>}
          </Panel>
          <Panel title={t.wa} subtitle={`${t.waB}: ${ev.lang === 'ta' ? 'தமிழ்' : 'English'}`} icon="whatsapp" action={<CopyButton text={msg} label={t.copyMsg} />}>
            <pre className="whitespace-pre-wrap rounded-2xl bg-[#e7fbe0] px-4 py-3 font-sans text-[13.5px] leading-relaxed text-ink">{msg}</pre>
            <div className="mt-4">
              {ev.clientPhone ? (
                <a href={waHref(ev.clientPhone, msg)} target="_blank" rel="noreferrer" onClick={() => logActivity(ev.id, 'shared', 'WhatsApp')} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink-3">
                  <Icon name="whatsapp" size={17} />{t.wa}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-ink/55"><Icon name="info" size={14} />{t.noPhone}</p>
              )}
            </div>
          </Panel>
        </div>
        <Panel title={t.qr} icon="grid">
          <div className="flex flex-col items-center">
            <Qr text={link} size={200} label={link} />
            <p className="mt-3 text-center text-[12.5px] text-ink/50">{t.qrB}</p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
