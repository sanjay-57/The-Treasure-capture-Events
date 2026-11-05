import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/ui'
import { FormSelect, PageHeader, TextInput } from '../../pages/admin/kit'
import { useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { DEFAULT_CHAPTERS, useCurrentStudio, useStudioStore } from '../store'
import type { Chapter } from '../types'
import { moveChapter, slugKey } from '../upload'
import { endOfDayIso, isoDate } from './shared'

const copy = {
  title: { en: 'New event', ta: 'புதிய நிகழ்வு' },
  eyebrow: { en: 'Events', ta: 'நிகழ்வுகள்' },
  name: { en: 'Event title', ta: 'நிகழ்வுத் தலைப்பு' },
  namePh: { en: 'Divya & Rahul · Wedding', ta: 'திவ்யா & ராகுல் · திருமணம்' },
  date: { en: 'Event date', ta: 'நிகழ்வு தேதி' },
  clients: { en: 'Client names', ta: 'வாடிக்கையாளர் பெயர்கள்' },
  phone: { en: 'Client WhatsApp', ta: 'வாடிக்கையாளர் WhatsApp' },
  pin: { en: 'PIN (optional, 4 digits)', ta: 'PIN (விருப்பம், 4 இலக்கம்)' },
  quota: { en: 'Photos to pick', ta: 'தேர்வு செய்ய வேண்டிய படங்கள்' },
  deadline: { en: 'Choose by', ta: 'தேர்வுக்கான கடைசி நாள்' },
  lang: { en: 'Client language', ta: 'வாடிக்கையாளர் மொழி' },
  chapters: { en: 'Chapters', ta: 'அத்தியாயங்கள்' },
  chaptersHint: { en: 'Folders you drop in also become chapters. You can rename and reorder later.', ta: 'நீங்கள் இடும் கோப்புறைகளும் அத்தியாயங்களாகும். பின்னர் பெயர் மாற்றலாம், வரிசைப்படுத்தலாம்.' },
  addChapter: { en: 'Add chapter', ta: 'அத்தியாயம் சேர்' },
  create: { en: 'Create and upload', ta: 'உருவாக்கிப் பதிவேற்று' },
  need: { en: 'Add a title and the client names', ta: 'தலைப்பு, வாடிக்கையாளர் பெயர்களைச் சேர்க்கவும்' },
  badPin: { en: 'PIN must be 4 digits', ta: 'PIN 4 இலக்கமாக இருக்க வேண்டும்' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  up: { en: 'Move up', ta: 'மேலே' },
  down: { en: 'Move down', ta: 'கீழே' },
}

export default function EventNew() {
  const t = useT(copy)
  useTitle(copy.title)
  const navigate = useNavigate()
  const studio = useCurrentStudio()!
  const createEvent = useStudioStore(s => s.createEvent)
  const [f, setF] = useState(() => ({
    title: '',
    date: isoDate(new Date()),
    clientNames: '',
    clientPhone: '',
    pin: '',
    quota: String(studio.defaultQuota),
    deadline: isoDate(new Date(Date.now() + studio.defaultWindowDays * 86_400_000)),
    lang: studio.lang,
  }))
  const [chapters, setChapters] = useState<Chapter[]>(DEFAULT_CHAPTERS.map(c => ({ ...c })))
  const [newChapter, setNewChapter] = useState('')
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))

  const addChapter = () => {
    const name = newChapter.trim()
    if (!name) return
    let key = slugKey(name)
    for (let k = 2; chapters.some(c => c.key === key); k++) key = `${slugKey(name)}-${k}`
    setChapters([...chapters, { key, name, sort: chapters.length }])
    setNewChapter('')
  }

  const submit = async () => {
    if (!f.title.trim() || !f.clientNames.trim()) return toast(t.need, 'ruby')
    if (f.pin && !/^\d{4}$/.test(f.pin)) return toast(t.badPin, 'ruby')
    const cs = chapters.filter(c => c.name.trim()).map((c, i) => ({ ...c, name: c.name.trim(), sort: i }))
    const ev = await createEvent(studio.id, {
      title: f.title.trim(),
      date: f.date,
      clientNames: f.clientNames.trim(),
      clientPhone: f.clientPhone.trim(),
      pin: f.pin || undefined,
      quota: Math.max(1, Number(f.quota) || studio.defaultQuota),
      deadline: endOfDayIso(f.deadline),
      lang: f.lang,
      chapters: cs.length ? cs : undefined,
    })
    if (!ev) return
    navigate(`/studio/events/${ev.id}?tab=upload`, { replace: true })
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={t.eyebrow} title={t.title} />
      <form className="grid gap-5 rounded-[26px] border border-ink/[0.08] bg-white p-5 md:p-8" onSubmit={e => { e.preventDefault(); submit() }}>
        <TextInput label={t.name} value={f.title} onChange={v => set('title', v)} placeholder={t.namePh} required autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t.clients} value={f.clientNames} onChange={v => set('clientNames', v)} required />
          <TextInput label={t.phone} type="tel" inputMode="tel" value={f.clientPhone} onChange={v => set('clientPhone', v)} />
          <TextInput label={t.date} type="date" value={f.date} onChange={v => set('date', v)} />
          <TextInput label={t.deadline} type="date" value={f.deadline} onChange={v => set('deadline', v)} />
          <TextInput label={t.quota} inputMode="numeric" value={f.quota} onChange={v => set('quota', v.replace(/\D/g, ''))} />
          <TextInput label={t.pin} inputMode="numeric" value={f.pin} onChange={v => set('pin', v.replace(/\D/g, '').slice(0, 4))} />
          <FormSelect label={t.lang} value={f.lang} onChange={v => set('lang', v)} options={[{ value: 'en', label: 'English' }, { value: 'ta', label: 'தமிழ்' }]} />
        </div>

        <div>
          <p className="t-label mb-1.5 text-ink/50">{t.chapters}</p>
          <ul className="grid gap-2">
            {chapters.map((c, i) => (
              <li key={c.key} className="flex items-center gap-2">
                <input value={c.name} onChange={e => setChapters(chapters.map(x => (x.key === c.key ? { ...x, name: e.target.value } : x)))} className="h-10 min-w-0 flex-1 rounded-xl border border-ink/10 px-3 text-[15px] outline-none focus:border-ruby md:text-[14px]" />
                <button type="button" aria-label={t.up} disabled={i === 0} onClick={() => setChapters(moveChapter(chapters, c.key, -1))} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] disabled:opacity-30"><Icon name="chevronDown" size={15} className="rotate-180" /></button>
                <button type="button" aria-label={t.down} disabled={i === chapters.length - 1} onClick={() => setChapters(moveChapter(chapters, c.key, 1))} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] disabled:opacity-30"><Icon name="chevronDown" size={15} /></button>
                <button type="button" aria-label={t.remove} onClick={() => setChapters(chapters.filter(x => x.key !== c.key))} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink/50 hover:bg-ink/[0.05] hover:text-ruby"><Icon name="x" size={15} /></button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input value={newChapter} onChange={e => setNewChapter(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChapter() } }} placeholder={t.addChapter} className="h-10 min-w-0 flex-1 rounded-xl border border-dashed border-ink/15 px-3 text-[15px] outline-none focus:border-ruby md:text-[14px]" />
            <Button size="sm" variant="outline" iconLeft="plus" onClick={addChapter}>{t.addChapter}</Button>
          </div>
          <p className="mt-1.5 text-xs text-ink/45">{t.chaptersHint}</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" icon="arrowRight">{t.create}</Button>
        </div>
      </form>
    </div>
  )
}
