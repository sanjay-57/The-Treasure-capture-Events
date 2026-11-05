import { useState } from 'react'
import { Button } from '../../../components/ui'
import { useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { PageHeader, Panel, TextInput } from '../../../pages/admin/kit'
import { useCurrentStudio, useStudioStore } from '../../store'
import { BrandingForm, brandingOf, type BrandingDraft } from '../../studio/shared'

const copy = {
  title: { en: 'Profile', ta: 'சுயவிவரம்' },
  eyebrow: { en: 'Account', ta: 'கணக்கு' },
  sub: { en: 'Your studio name, logo and colour show on every client gallery and portal.', ta: 'உங்கள் ஸ்டுடியோ பெயர், லோகோ, நிறம் ஒவ்வொரு வாடிக்கையாளர் காட்சியகத்திலும் தளத்திலும் தெரியும்.' },
  owner: { en: 'Owner name', ta: 'உரிமையாளர் பெயர்' },
  city: { en: 'City', ta: 'நகரம்' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்' },
  phone: { en: 'Login phone', ta: 'உள்நுழைவு எண்' },
  details: { en: 'Studio details', ta: 'ஸ்டுடியோ விவரங்கள்' },
  branding: { en: 'Branding', ta: 'பிராண்டிங்' },
  save: { en: 'Save changes', ta: 'மாற்றங்களைச் சேமி' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  needName: { en: 'Add your studio name', ta: 'ஸ்டுடியோ பெயரைச் சேர்க்கவும்' },
}

export default function Profile() {
  const t = useT(copy)
  useTitle(copy.title)
  const studio = useCurrentStudio()!
  const updateStudio = useStudioStore(s => s.updateStudio)
  const [draft, setDraft] = useState<BrandingDraft>(() => brandingOf(studio))
  const [extra, setExtra] = useState(() => ({ ownerName: studio.ownerName, city: studio.city, email: studio.email ?? '' }))
  const save = () => {
    if (!draft.name.trim()) return toast(t.needName, 'ruby')
    updateStudio(studio.id, { ...draft, name: draft.name.trim(), ownerName: extra.ownerName.trim(), city: extra.city.trim(), email: extra.email.trim() || undefined })
    toast(t.saved)
  }
  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} />
      <div className="space-y-6">
        <Panel title={t.details} icon="building">
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput label={t.owner} value={extra.ownerName} onChange={v => setExtra({ ...extra, ownerName: v })} />
            <TextInput label={t.city} value={extra.city} onChange={v => setExtra({ ...extra, city: v })} />
            <TextInput label={t.email} type="email" inputMode="email" value={extra.email} onChange={v => setExtra({ ...extra, email: v })} />
          </div>
          <p className="mt-4 text-[12.5px] text-ink/50">{t.phone}: {studio.phone}</p>
        </Panel>
        <Panel title={t.branding} icon="sparkle">
          <BrandingForm value={draft} onChange={setDraft} />
        </Panel>
        <div className="flex justify-end"><Button onClick={save}>{t.save}</Button></div>
      </div>
    </div>
  )
}
