import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../components/ui'
import { ConfirmModal, FormSelect, Panel, TextInput } from '../../../pages/admin/kit'
import { useT } from '../../../lib/i18n'
import { toast } from '../../../lib/ui'
import { useStudioStore } from '../../store'
import type { StudioEvent } from '../../types'
import { forgetUploads } from '../../upload'
import { endOfDayIso, isoDate } from '../shared'

const copy = {
  details: { en: 'Event details', ta: 'நிகழ்வு விவரங்கள்' },
  name: { en: 'Event title', ta: 'நிகழ்வுத் தலைப்பு' },
  date: { en: 'Event date', ta: 'நிகழ்வு தேதி' },
  clients: { en: 'Client names', ta: 'வாடிக்கையாளர் பெயர்கள்' },
  phone: { en: 'Client WhatsApp', ta: 'வாடிக்கையாளர் WhatsApp' },
  pin: { en: 'PIN (optional, 4 digits)', ta: 'PIN (விருப்பம், 4 இலக்கம்)' },
  quota: { en: 'Photos to pick', ta: 'தேர்வு செய்ய வேண்டிய படங்கள்' },
  deadline: { en: 'Choose by', ta: 'தேர்வுக்கான கடைசி நாள்' },
  lang: { en: 'Client language', ta: 'வாடிக்கையாளர் மொழி' },
  save: { en: 'Save', ta: 'சேமி' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது' },
  badPin: { en: 'PIN must be 4 digits', ta: 'PIN 4 இலக்கமாக இருக்க வேண்டும்' },
  need: { en: 'Add a title and the client names', ta: 'தலைப்பு, வாடிக்கையாளர் பெயர்களைச் சேர்க்கவும்' },
  danger: { en: 'Delete event', ta: 'நிகழ்வை நீக்கு' },
  dangerB: { en: 'Deletes the event, its previews, the client’s selection and the activity log. Your RAW files are not touched.', ta: 'நிகழ்வு, முன்னோட்டங்கள், வாடிக்கையாளர் தேர்வு, செயல்பாட்டுப் பதிவு நீக்கப்படும். உங்கள் RAW கோப்புகள் தொடப்படாது.' },
  delete: { en: 'Delete event', ta: 'நிகழ்வை நீக்கு' },
  confirm: { en: 'Delete this event for good?', ta: 'இந்த நிகழ்வை நிரந்தரமாக நீக்கவா?' },
}

export function SettingsTab({ event: ev }: { event: StudioEvent }) {
  const t = useT(copy)
  const navigate = useNavigate()
  const updateEvent = useStudioStore(s => s.updateEvent)
  const deleteEvent = useStudioStore(s => s.deleteEvent)
  const [confirm, setConfirm] = useState(false)
  const [f, setF] = useState(() => ({
    title: ev.title,
    date: ev.date,
    clientNames: ev.clientNames,
    clientPhone: ev.clientPhone,
    pin: ev.pin ?? '',
    quota: String(ev.quota),
    deadline: isoDate(new Date(ev.deadline)),
    lang: ev.lang,
  }))
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))

  const save = () => {
    if (!f.title.trim() || !f.clientNames.trim()) return toast(t.need, 'ruby')
    if (f.pin && !/^\d{4}$/.test(f.pin)) return toast(t.badPin, 'ruby')
    updateEvent(ev.id, {
      title: f.title.trim(),
      date: f.date,
      clientNames: f.clientNames.trim(),
      clientPhone: f.clientPhone.trim(),
      pin: f.pin || undefined,
      quota: Math.max(1, Number(f.quota) || ev.quota),
      deadline: f.deadline === isoDate(new Date(ev.deadline)) ? ev.deadline : endOfDayIso(f.deadline),
      lang: f.lang,
    })
    toast(t.saved)
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <Panel title={t.details} icon="edit">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); save() }}>
          <TextInput className="sm:col-span-2" label={t.name} value={f.title} onChange={v => set('title', v)} required />
          <TextInput label={t.clients} value={f.clientNames} onChange={v => set('clientNames', v)} required />
          <TextInput label={t.phone} type="tel" inputMode="tel" value={f.clientPhone} onChange={v => set('clientPhone', v)} />
          <TextInput label={t.date} type="date" value={f.date} onChange={v => set('date', v)} />
          <TextInput label={t.deadline} type="date" value={f.deadline} onChange={v => set('deadline', v)} />
          <TextInput label={t.quota} inputMode="numeric" value={f.quota} onChange={v => set('quota', v.replace(/\D/g, ''))} />
          <TextInput label={t.pin} inputMode="numeric" value={f.pin} onChange={v => set('pin', v.replace(/\D/g, '').slice(0, 4))} />
          <FormSelect label={t.lang} value={f.lang} onChange={v => set('lang', v)} options={[{ value: 'en', label: 'English' }, { value: 'ta', label: 'தமிழ்' }]} />
          <div className="flex items-end justify-end sm:col-span-2"><Button type="submit">{t.save}</Button></div>
        </form>
      </Panel>
      <Panel title={t.danger} icon="trash">
        <p className="text-[13.5px] text-ink/60">{t.dangerB}</p>
        <div className="mt-4"><Button variant="outline" iconLeft="trash" onClick={() => setConfirm(true)}>{t.delete}</Button></div>
      </Panel>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          forgetUploads(ev.id)
          deleteEvent(ev.id)
          navigate('/studio', { replace: true })
        }}
        title={t.confirm}
        body={t.dangerB}
        confirmLabel={t.delete}
        icon="trash"
      />
    </div>
  )
}
