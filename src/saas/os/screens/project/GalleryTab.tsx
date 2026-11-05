import { useState } from 'react'
import { Button } from '../../../../components/ui'
import { useT } from '../../../../lib/i18n'
import { CopyButton, Tabs } from '../../../../pages/admin/kit'
import { galleryLink, whatsappShare } from '../../../links'
import { waLink } from '../../../portal/helpers'
import { useCurrentStudio, useStudioStore } from '../../../store'
import { StatusBadge } from '../../../studio/shared'
import { ProgressTab } from '../../../studio/tabs/ProgressTab'
import { SelectionTab } from '../../../studio/tabs/SelectionTab'
import { SettingsTab } from '../../../studio/tabs/SettingsTab'
import { ShareTab } from '../../../studio/tabs/ShareTab'
import { UploadTab } from '../../../studio/tabs/UploadTab'
import { useOsStore } from '../../store'
import type { Project } from '../../types'
import { SectionTitle } from '../parts'

/**
 * Project → Gallery: the album selector for this customer, inside the project.
 * Upload RAW/JPEG here, copy the /gallery/<code> link, then read the selection.
 * Reuses the studio gallery tabs as they are.
 */

const copy = {
  title: { en: 'Album selection gallery', ta: 'ஆல்பம் தேர்வு காட்சியகம்' },
  off: { en: 'The gallery is switched off for this customer. Turn it on under Overview → Features.', ta: 'இந்த வாடிக்கையாளருக்குக் காட்சியகம் அணைக்கப்பட்டுள்ளது. மேலோட்டம் → வசதிகள் பகுதியில் இயக்குங்கள்.' },
  none: { en: 'This project has no gallery yet.', ta: 'இந்தத் திட்டத்துக்கு இன்னும் காட்சியகம் இல்லை.' },
  create: { en: 'Set up the gallery', ta: 'காட்சியகத்தை அமை' },
  link: { en: 'Customer gallery link', ta: 'வாடிக்கையாளர் காட்சியக இணைப்பு' },
  linkB: { en: 'Opens with the project PIN. Your customer sees only your studio name and logo.', ta: 'திட்ட PIN-உடன் திறக்கும். உங்கள் ஸ்டுடியோ பெயரும் லோகோவும் மட்டுமே தெரியும்.' },
  copy: { en: 'Copy gallery link', ta: 'காட்சியக இணைப்பை நகலெடு' },
  wa: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  upload: { en: 'Upload', ta: 'பதிவேற்றம்' },
  share: { en: 'Share', ta: 'பகிர்' },
  progress: { en: 'Progress', ta: 'முன்னேற்றம்' },
  selection: { en: 'Selection', ta: 'தேர்வு' },
  settings: { en: 'Quota & deadline', ta: 'எண்ணிக்கை & காலக்கெடு' },
}

type Sub = 'upload' | 'share' | 'progress' | 'selection' | 'settings'

export default function GalleryTab({ p }: { p: Project }) {
  const t = useT(copy)
  const studio = useCurrentStudio()!
  const ensureGallery = useOsStore(s => s.ensureGallery)
  const raw = useStudioStore(s => (p.galleryEventId ? s.events.find(e => e.id === p.galleryEventId && e.studioId === p.studioId) : undefined))
  const proofCount = useStudioStore(s => (p.galleryEventId ? s.proofs.reduce((n, x) => (x.eventId === p.galleryEventId ? n + 1 : n), 0) : 0))
  const pickCount = useStudioStore(s => (p.galleryEventId ? (s.picks[p.galleryEventId] ?? []).length : 0))
  const [sub, setSub] = useState<Sub | null>(null)

  if (p.features?.gallery === false) return <p className="rounded-2xl bg-ink/[0.04] px-4 py-3 text-[13.5px] text-ink/60">{t.off}</p>

  if (!raw)
    return (
      <div className="rounded-[22px] border border-ink/[0.08] bg-white p-5">
        <p className="text-[14px] text-ink/65">{t.none}</p>
        <div className="mt-4"><Button variant="ink" iconLeft="plus" onClick={() => ensureGallery(p.id)}>{t.create}</Button></div>
      </div>
    )

  // The customer link is /gallery/<project code>, guarded by the project PIN.
  const ev = { ...raw, pin: p.pin }
  const link = galleryLink(p.code)
  const tab: Sub = sub ?? (proofCount ? (ev.status === 'submitted' || ev.status === 'closed' ? 'selection' : 'share') : 'upload')

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle action={<StatusBadge status={ev.status} />}>{t.title}</SectionTitle>
        <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <p className="text-[13.5px] font-semibold text-ink">{t.link}</p>
          <p className="mt-0.5 text-[12.5px] text-ink/50">{t.linkB}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-2xl bg-ink/[0.04] py-1 pl-3.5 pr-1">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink/80">{link}</span>
              <CopyButton text={link} label={t.copy} />
            </div>
            <Button variant="ink" size="sm" iconLeft="whatsapp" href={waLink(p.phone, whatsappShare(studio, p, 'gallery'))}>{t.wa}</Button>
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onChange={setSub}
        options={[
          { value: 'upload', label: t.upload, icon: 'image', count: proofCount },
          { value: 'share', label: t.share, icon: 'share' },
          { value: 'progress', label: t.progress, icon: 'clock' },
          { value: 'selection', label: t.selection, icon: 'heart', count: pickCount },
          { value: 'settings', label: t.settings, icon: 'settings' },
        ]}
      />
      {tab === 'upload' && <UploadTab event={ev} />}
      {tab === 'share' && <ShareTab event={ev} studio={studio} link={link} />}
      {tab === 'progress' && <ProgressTab event={ev} />}
      {tab === 'selection' && <SelectionTab event={ev} />}
      {tab === 'settings' && <SettingsTab event={raw} />}
    </div>
  )
}
