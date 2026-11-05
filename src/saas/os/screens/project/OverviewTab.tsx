import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../../components/ui'
import { formatDate, useLang, useT } from '../../../../lib/i18n'
import { toast } from '../../../../lib/ui'
import { ConfirmModal, FormSelect } from '../../../../pages/admin/kit'
import { FAITHS, type Faith } from '../../../../lib/poses'
import { useCurrentStudio, useStudioStore } from '../../../store'
import { STATUS_LABEL } from '../../../studio/shared'
import type { FeatureFlags } from '../../../types'
import { useOsStore } from '../../store'
import type { Project } from '../../types'
import { WorkStepper } from '../../WorkStepper'
import { LiveTextInput, SectionTitle, SwitchRow } from '../parts'

const copy = {
  basics: { en: 'Project and client', ta: 'திட்டமும் வாடிக்கையாளரும்' },
  name: { en: 'Project name', ta: 'திட்டப் பெயர்' },
  type: { en: 'Type', ta: 'வகை' },
  names: { en: 'Client names', ta: 'வாடிக்கையாளர் பெயர்கள்' },
  greet: { en: 'Greet as (portal says "Welcome, …")', ta: 'வரவேற்கும் பெயர் (தளம் "வணக்கம், …")' },
  phone: { en: 'Phone', ta: 'தொலைபேசி' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  ext: { en: 'External link (Instagram, Drive…)', ta: 'வெளி இணைப்பு (Instagram, Drive…)' },
  group: { en: 'WhatsApp group link', ta: 'WhatsApp குழு இணைப்பு' },
  gallery: { en: 'Album selection gallery', ta: 'ஆல்பம் தேர்வு காட்சியகம்' },
  galleryB: { en: 'The gallery where your client picks photos for the album. The linked gallery shows on the client page.', ta: 'ஆல்பத்துக்காக வாடிக்கையாளர் படங்களைத் தேர்வு செய்யும் காட்சியகம். இணைத்த காட்சியகம் வாடிக்கையாளர் பக்கத்தில் தெரியும்.' },
  pickGallery: { en: 'Linked gallery', ta: 'இணைத்த காட்சியகம்' },
  noGallery: { en: 'Not linked', ta: 'இணைக்கவில்லை' },
  createGallery: { en: 'Create gallery for this project', ta: 'இந்தத் திட்டத்துக்குக் காட்சியகம் உருவாக்கு' },
  openGallery: { en: 'Open Album selection', ta: 'ஆல்பத் தேர்வைத் திற' },
  created: { en: 'Gallery created and linked. Add photos to open it.', ta: 'காட்சியகம் உருவாக்கி இணைக்கப்பட்டது. படங்களைச் சேர்த்துத் திறக்கவும்.' },
  custom: { en: 'Customer settings', ta: 'வாடிக்கையாளர் அமைப்புகள்' },
  theme: { en: 'Theme (shown on the gallery and poses pages)', ta: 'தீம் (காட்சியகம், போஸ் பக்கங்களில் தெரியும்)' },
  themePh: { en: 'e.g. Chettinad traditional', ta: 'எ.கா. செட்டிநாடு பாரம்பரியம்' },
  religion: { en: 'Religion (sets the ritual poses)', ta: 'மதம் (சடங்கு போஸ்களைத் தீர்மானிக்கும்)' },
  noReligion: { en: 'None', ta: 'இல்லை' },
  features: { en: 'Features for this customer', ta: 'இந்த வாடிக்கையாளருக்கான வசதிகள்' },
  fGallery: { en: 'Album selection gallery', ta: 'ஆல்பம் தேர்வு காட்சியகம்' },
  fPoses: { en: 'Pose chooser', ta: 'போஸ் தேர்வு' },
  fPortal: { en: 'Client page (PIN link)', ta: 'வாடிக்கையாளர் பக்கம் (PIN இணைப்பு)' },
  fOffHint: { en: 'Off: the link shows a short "not switched on" note.', ta: 'அணைத்தால்: இணைப்பு "இயக்கப்படவில்லை" எனக் காட்டும்.' },
  work: { en: 'Work progress', ta: 'வேலை முன்னேற்றம்' },
  workB: { en: 'Your client sees this on their portal. Tap a step to set it. Submitting the photo selection moves it to "Selection received" on its own.', ta: 'உங்கள் வாடிக்கையாளர் தளத்தில் இதைப் பார்ப்பார். அமைக்க ஒரு படியைத் தட்டுங்கள். தேர்வு சமர்ப்பித்தவுடன் "தேர்வு பெறப்பட்டது" தானாக வரும்.' },
  danger: { en: 'Delete project', ta: 'திட்டத்தை நீக்கு' },
  dangerQ: { en: 'Delete this project?', ta: 'இந்தத் திட்டத்தை நீக்கவா?' },
  dangerB: { en: 'The project’s gallery and pose choices go with it. The client links stop working.', ta: 'திட்டக் காட்சியகமும் போஸ் தேர்வுகளும் நீங்கும். வாடிக்கையாளர் இணைப்புகள் வேலை செய்யாது.' },
}

export default function OverviewTab({ p }: { p: Project }) {
  const t = useT(copy)
  const lang = useLang()
  const navigate = useNavigate()
  const studio = useCurrentStudio()!
  const allEvents = useStudioStore(s => s.events)
  const { updateProject, deleteProject, ensureGallery, setTheme, setReligion, setFeatures, setStage } = useOsStore()
  const feat = (k: keyof FeatureFlags) => (v: boolean) => setFeatures(p.id, { [k]: v })
  const [del, setDel] = useState(false)
  const galleries = useMemo(() => allEvents.filter(e => e.studioId === studio.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allEvents, studio.id])
  const set = <K extends keyof Project>(k: K) => (v: string) => updateProject(p.id, { [k]: k === 'email' || k === 'externalLink' || k === 'whatsappGroup' ? v || undefined : v } as Partial<Project>)

  const link = (galleryId: string | undefined) => updateProject(p.id, { galleryEventId: galleryId })

  const create = async () => {
    if (await ensureGallery(p.id)) toast(t.created)
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>{t.basics}</SectionTitle>
        <div className="grid gap-3 rounded-[22px] border border-ink/[0.08] bg-white p-4 sm:grid-cols-2 md:p-5">
          <LiveTextInput label={t.name} value={p.name} onSave={set('name')} required />
          <LiveTextInput label={t.type} value={p.type} onSave={set('type')} />
          <LiveTextInput label={t.names} value={p.clientNames} onSave={set('clientNames')} required />
          <LiveTextInput label={t.greet} value={p.greetName} onSave={set('greetName')} />
          <LiveTextInput label={t.phone} value={p.phone} onSave={set('phone')} inputMode="tel" required />
          <LiveTextInput label={t.email} value={p.email ?? ''} onSave={set('email')} inputMode="email" />
          <LiveTextInput label={t.ext} value={p.externalLink ?? ''} onSave={set('externalLink')} inputMode="url" placeholder="https://" />
          <LiveTextInput label={t.group} value={p.whatsappGroup ?? ''} onSave={set('whatsappGroup')} inputMode="url" placeholder="https://chat.whatsapp.com/…" />
        </div>
      </section>

      <section>
        <SectionTitle>{t.custom}</SectionTitle>
        <div className="space-y-5 rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <LiveTextInput label={t.theme} value={p.theme ?? ''} onSave={v => setTheme(p.id, v)} placeholder={t.themePh} />
            <FormSelect label={t.religion} value={(p.religion ?? '') as Faith | ''} onChange={v => setReligion(p.id, (v || undefined) as Faith | undefined)} options={[{ value: '' as const, label: t.noReligion }, ...FAITHS.map(f => ({ value: f.key, label: f.label[lang] }))]} />
          </div>
          <div>
            <p className="t-label mb-3 text-ink/50">{t.features}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchRow checked={p.features?.gallery !== false} onChange={feat('gallery')} label={t.fGallery} hint={t.fOffHint} />
              <SwitchRow checked={p.features?.poses !== false} onChange={feat('poses')} label={t.fPoses} hint={t.fOffHint} />
              <SwitchRow checked={p.features?.portal !== false} onChange={feat('portal')} label={t.fPortal} hint={t.fOffHint} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>{t.work}</SectionTitle>
        <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <p className="mb-4 text-[13px] text-ink/55">{t.workB}</p>
          <WorkStepper stage={p.stage ?? 'booked'} onSet={s => setStage(p.id, s)} />
        </div>
      </section>

      <section>
        <SectionTitle>{t.gallery}</SectionTitle>
        <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <p className="mb-4 text-[13px] text-ink/55">{t.galleryB}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <FormSelect
              className="sm:flex-1"
              label={t.pickGallery}
              value={p.galleryEventId ?? ''}
              onChange={v => link(v || undefined)}
              options={[{ value: '', label: t.noGallery }, ...galleries.map(g => ({ value: g.id, label: `${g.title} · ${formatDate(g.date, lang)} · ${STATUS_LABEL[g.status][lang]}` }))]}
            />
            {p.galleryEventId ? <Button variant="outline" icon="arrowRight" to={`/studio/projects/${p.id}?tab=gallery`}>{t.openGallery}</Button> : <Button variant="ink" iconLeft="plus" onClick={create}>{t.createGallery}</Button>}
          </div>
        </div>
      </section>

      <section className="flex justify-end">
        <Button variant="ghost" iconLeft="trash" onClick={() => setDel(true)}>{t.danger}</Button>
      </section>
      <ConfirmModal open={del} onClose={() => setDel(false)} title={t.dangerQ} body={t.dangerB} confirmLabel={t.danger} icon="trash" onConfirm={() => { deleteProject(p.id); navigate('/studio/projects', { replace: true }) }} />
    </div>
  )
}
