import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Icon } from '../../../components/Icon'
import { BackLink, Button } from '../../../components/ui'
import { pick, useLang, useT } from '../../../lib/i18n'
import { toast, useTitle } from '../../../lib/ui'
import { CopyButton, FormSelect } from '../../../pages/admin/kit'
import { PIN_RE, waLink } from '../../portal/helpers'
import { useCurrentStudio, useStudioStore } from '../../store'
import { PROJECT_TABS, tabDone, type ProjectTab } from '../progress'
import { useOsStore } from '../store'
import type { Project } from '../types'
import { PROJECT_STATUS, PROJECT_STATUSES, TAB_LABEL } from './copy'
import { portalLink } from './parts'
import GalleryTab from './project/GalleryTab'
import PosesTab from './project/PosesTab'
import OverviewTab from './project/OverviewTab'

const copy = {
  title: { en: 'Project', ta: 'திட்டம்' },
  back: { en: 'All projects', ta: 'அனைத்துத் திட்டங்கள்' },
  status: { en: 'Status', ta: 'நிலை' },
  share: { en: 'Share with your client', ta: 'வாடிக்கையாளருடன் பகிருங்கள்' },
  shareB: { en: 'Your client opens this link and types the PIN to pick their album photos and choose poses.', ta: 'வாடிக்கையாளர் இந்த இணைப்பைத் திறந்து PIN-ஐ உள்ளிட்டு ஆல்பப் படங்களையும் போஸ்களையும் தேர்வு செய்யலாம்.' },
  copy: { en: 'Copy link', ta: 'இணைப்பை நகலெடு' },
  pin: { en: 'PIN', ta: 'PIN' },
  pinBad: { en: 'PIN must be 4 digits', ta: 'PIN 4 இலக்கங்களாக இருக்க வேண்டும்' },
  pinSaved: { en: 'PIN updated', ta: 'PIN புதுப்பிக்கப்பட்டது' },
  regen: { en: 'New PIN', ta: 'புதிய PIN' },
  open: { en: 'Open portal', ta: 'தளத்தைத் திற' },
  wa: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  waMsg: { en: 'Hi {name}, your project page from {studio}: {link}\nPIN: {pin}', ta: 'வணக்கம் {name}, {studio} வழங்கும் உங்கள் திட்டப் பக்கம்: {link}\nPIN: {pin}' },
  next: { en: 'Next', ta: 'அடுத்து' },
  saveClose: { en: 'Save & Close', ta: 'சேமித்து மூடு' },
  saved: { en: 'Project saved', ta: 'திட்டம் சேமிக்கப்பட்டது' },
  live: { en: 'Changes save as you type.', ta: 'தட்டச்சு செய்யும்போதே சேமிக்கப்படும்.' },
}

export default function ProjectEditor() {
  const { id } = useParams()
  const studio = useCurrentStudio()!
  const p = useOsStore(s => s.projects.find(x => x.id === id))
  if (!p || p.studioId !== studio.id) return <Navigate to="/studio/projects" replace />
  return <Editor p={p} studioName={studio.name} />
}

function Editor({ p, studioName }: { p: Project; studioName: string }) {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: p.name || copy.title.en, ta: p.name || copy.title.ta })
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (PROJECT_TABS.includes(params.get('tab') as ProjectTab) ? params.get('tab') : 'overview') as ProjectTab
  const setTab = (x: ProjectTab) => setParams({ tab: x }, { replace: true })
  const { setProjectStatus, updateProject, regeneratePin } = useOsStore()
  const galleryStatus = useStudioStore(s => (p.galleryEventId ? s.events.find(e => e.id === p.galleryEventId)?.status : undefined))
  const [pin, setPin] = useState(p.pin)
  useEffect(() => setPin(p.pin), [p.pin])
  // Braces: some scroll extensions make window.scrollTo return a value, and React would call it as the cleanup.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  const link = portalLink(p.code)
  const pinOk = PIN_RE.test(pin)
  const commitPin = () => {
    if (!pinOk) return
    if (pin !== p.pin) {
      updateProject(p.id, { pin })
      toast(t.pinSaved)
    }
  }
  const msg = t.waMsg.replace('{name}', p.greetName || p.clientNames).replace('{studio}', studioName).replace('{link}', link).replace('{pin}', p.pin)
  const i = PROJECT_TABS.indexOf(tab)
  const next = PROJECT_TABS[i + 1]

  const body = {
    overview: <OverviewTab p={p} />,
    gallery: <GalleryTab p={p} />,
    poses: <PosesTab p={p} />,
  }[tab]

  return (
    <div>
      <div className="mb-4"><BackLink to="/studio/projects">{t.back}</BackLink></div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="t-label text-ink/45">{p.type} · {p.clientNames}</p>
          <h1 className="mt-1.5 break-words font-display text-[28px] font-medium leading-tight text-ink md:text-[38px]">{p.name || '—'}</h1>
        </div>
        <FormSelect className="md:w-56" label={t.status} value={p.status} onChange={s => setProjectStatus(p.id, s)} options={PROJECT_STATUSES.map(s => ({ value: s, label: pick(lang, PROJECT_STATUS[s]) }))} />
      </div>

      <section className="mb-6 rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink"><Icon name="share" size={16} />{t.share}</p>
            <p className="mt-1 text-[12.5px] text-ink/50">{t.shareB}</p>
            <div className="mt-3 flex items-center gap-1 rounded-2xl bg-ink/[0.04] py-1 pl-3.5 pr-1">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink/80">{link}</span>
              <CopyButton text={link} label={t.copy} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="t-label mb-1.5 block text-ink/50" htmlFor="pin">{t.pin}</label>
              <input
                id="pin"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onBlur={commitPin}
                onKeyDown={e => e.key === 'Enter' && commitPin()}
                aria-invalid={!pinOk}
                className={`h-11 w-24 rounded-2xl border bg-white text-center font-mono text-[18px] tracking-[0.3em] outline-none focus:ring-4 ${pinOk ? 'border-ink/10 focus:border-ruby focus:ring-ruby/10' : 'border-ruby focus:ring-ruby/10'}`}
              />
            </div>
            <Button variant="ghost" size="sm" iconLeft="refresh" onClick={() => regeneratePin(p.id)}>{t.regen}</Button>
            <Button variant="outline" size="sm" iconLeft="external" href={`/p/${p.code}`}>{t.open}</Button>
            <Button variant="ink" size="sm" iconLeft="whatsapp" href={waLink(p.phone, msg)}>{t.wa}</Button>
          </div>
        </div>
        {!pinOk && <p className="mt-2 text-[12.5px] text-ruby">{t.pinBad}</p>}
      </section>

      <div role="tablist" className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0" data-lenis-prevent>
        {PROJECT_TABS.map((x, n) => {
          const on = x === tab
          const done = tabDone(p, x, { galleryStatus })
          return (
            <button key={x} type="button" role="tab" aria-selected={on} onClick={() => setTab(x)} className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition ${on ? 'bg-ink text-white' : 'text-ink/60 hover:bg-ink/[0.05] hover:text-ink'}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold ${done ? (on ? 'bg-white text-ink' : 'bg-emerald-600 text-white') : on ? 'bg-white/20' : 'bg-ink/[0.07]'}`}>
                {done ? <Icon name="check" size={11} strokeWidth={2.6} /> : n + 1}
              </span>
              {pick(lang, TAB_LABEL[x])}
            </button>
          )
        })}
      </div>

      <div className="min-h-[40vh]">{body}</div>

      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 mt-8 flex items-center justify-between gap-3 rounded-full border border-ink/[0.08] bg-white/95 py-2 pl-4 pr-2 shadow-[0_10px_30px_-18px_rgba(10,10,11,0.35)] backdrop-blur md:bottom-4">
        <span className="hidden text-[12.5px] text-ink/45 sm:block">{t.live}</span>
        <div className="ml-auto flex gap-2">
          {next && <Button variant="outline" size="sm" icon="arrowRight" onClick={() => setTab(next)}>{t.next}: {pick(lang, TAB_LABEL[next])}</Button>}
          <Button variant="ink" size="sm" iconLeft="check" onClick={() => { toast(t.saved); navigate('/studio/projects') }}>{t.saveClose}</Button>
        </div>
      </div>
    </div>
  )
}
