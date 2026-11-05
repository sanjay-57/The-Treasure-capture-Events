import { useMemo, type ReactNode } from 'react'
import { PoseImage } from '../../../../components/poses'
import { Button } from '../../../../components/ui'
import { eventByKey, type EventKey } from '../../../../lib/data'
import { formatDate, useLang, useT } from '../../../../lib/i18n'
import { FAITHS, POSE_EVENTS, WHO, poseSrc, posesFor, type Faith, type PoseDef } from '../../../../lib/poses'
import { toast } from '../../../../lib/ui'
import { CopyButton, FormSelect } from '../../../../pages/admin/kit'
import { posesLink, whatsappShare } from '../../../links'
import { moveId, planPoses, poseProgress, poseSetFor, shotList } from '../../../poses/logic'
import { waLink } from '../../../portal/helpers'
import { useCurrentStudio } from '../../../store'
import { useOsStore } from '../../store'
import type { PosePlan, Project } from '../../types'
import { IconBtn, Pill, SectionTitle } from '../parts'

/**
 * Project → Poses: pick the event type and religion, fill from the pose
 * library, trim and order, send /poses/<code>, then read the yes/no answers
 * and print the shot list. The customer page names the studio only.
 */

const copy = {
  off: { en: 'Poses are switched off for this customer. Turn them on under Overview → Features.', ta: 'இந்த வாடிக்கையாளருக்குப் போஸ்கள் அணைக்கப்பட்டுள்ளன. மேலோட்டம் → வசதிகள் பகுதியில் இயக்குங்கள்.' },
  setup: { en: 'Pose set', ta: 'போஸ் தொகுப்பு' },
  setupB: { en: 'Common poses for the event, plus ritual poses for the religion. Your customer never sees the religion tag.', ta: 'நிகழ்வுக்கான பொதுவான போஸ்கள், மதத்துக்கான சடங்கு போஸ்களுடன். மத அடையாளம் வாடிக்கையாளருக்குத் தெரியாது.' },
  event: { en: 'Event type', ta: 'நிகழ்வு வகை' },
  religion: { en: 'Religion', ta: 'மதம்' },
  none: { en: 'Not set (common poses only)', ta: 'அமைக்கவில்லை (பொதுவான போஸ்கள் மட்டும்)' },
  fill: { en: 'Fill from library', ta: 'நூலகத்திலிருந்து நிரப்பு' },
  filled: { en: 'Pose list filled', ta: 'போஸ் பட்டியல் நிரப்பப்பட்டது' },
  list: { en: 'Poses to send', ta: 'அனுப்ப வேண்டிய போஸ்கள்' },
  empty: { en: 'No poses yet. Choose the event type and fill from the library.', ta: 'இன்னும் போஸ்கள் இல்லை. நிகழ்வு வகையைத் தேர்ந்து நூலகத்திலிருந்து நிரப்புங்கள்.' },
  earlier: { en: 'Move earlier', ta: 'முன்னே நகர்த்து' },
  later: { en: 'Move later', ta: 'பின்னே நகர்த்து' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  addMore: { en: 'Add from the library', ta: 'நூலகத்திலிருந்து சேர்' },
  send: { en: 'Send to the customer', ta: 'வாடிக்கையாளருக்கு அனுப்பு' },
  sendB: { en: 'The link opens with the project PIN. Answers save as your customer goes.', ta: 'இணைப்பு திட்ட PIN-உடன் திறக்கும். வாடிக்கையாளர் பதில்கள் உடனே சேமிக்கப்படும்.' },
  sendNow: { en: 'Send poses', ta: 'போஸ்களை அனுப்பு' },
  unsend: { en: 'Take back', ta: 'திரும்பப் பெறு' },
  sentOn: { en: 'Sent', ta: 'அனுப்பியது' },
  notSent: { en: 'Not sent yet: the link shows "on their way" until you send.', ta: 'இன்னும் அனுப்பவில்லை: அனுப்பும் வரை இணைப்பு "தயாராகின்றன" எனக் காட்டும்.' },
  copy: { en: 'Copy poses link', ta: 'போஸ் இணைப்பை நகலெடு' },
  wa: { en: 'Send on WhatsApp', ta: 'WhatsApp-ல் அனுப்பு' },
  answers: { en: 'Customer answers', ta: 'வாடிக்கையாளர் பதில்கள்' },
  progress: { en: '{n} of {total} answered · {yes} yes · {no} no', ta: '{total}-ல் {n} பதில் · {yes} ஆம் · {no} வேண்டாம்' },
  submitted: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  waiting: { en: 'Waiting for the customer', ta: 'வாடிக்கையாளருக்காகக் காத்திருக்கிறது' },
  print: { en: 'Print shot list', ta: 'ஷாட் பட்டியலை அச்சிடு' },
  reopen: { en: 'Let them change answers', ta: 'பதில்களை மாற்ற அனுமதி' },
  yes: { en: 'Yes', ta: 'ஆம்' },
  no: { en: 'No', ta: 'வேண்டாம்' },
  shotList: { en: 'Shot list', ta: 'ஷாட் பட்டியல்' },
}

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export default function PosesTab({ p }: { p: Project }) {
  const t = useT(copy)
  const lang = useLang()
  const studio = useCurrentStudio()!
  const { setPosePlan, setReligion, togglePoseSend, reopenPoses } = useOsStore()
  const plan: PosePlan = p.poses ?? { faiths: p.religion ? [p.religion] : [], eventKey: guessEvent(p.type), ids: [], picks: {} }
  const poses = useMemo(() => planPoses(plan), [plan])
  const library = useMemo(() => posesFor(plan.eventKey, plan.faiths).filter(x => !plan.ids.includes(x.id)), [plan.eventKey, plan.faiths, plan.ids])
  const prog = poseProgress(plan)
  const link = posesLink(p.code)

  if (p.features?.poses === false) return <p className="rounded-2xl bg-ink/[0.04] px-4 py-3 text-[13.5px] text-ink/60">{t.off}</p>

  const setReligionBoth = (v: string) => {
    const f = (v || undefined) as Faith | undefined
    setReligion(p.id, f)
    setPosePlan(p.id, { ...plan, faiths: f ? [f] : [] })
  }
  const fillFromLibrary = () => {
    const ids = poseSetFor(plan.eventKey, plan.faiths[0])
    setPosePlan(p.id, { ...plan, ids, picks: Object.fromEntries(Object.entries(plan.picks).filter(([k]) => ids.includes(k))) })
    toast(t.filled)
  }
  const setIds = (ids: string[]) => setPosePlan(p.id, { ...plan, ids })

  const printList = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const rows = shotList(plan)
      .map((x, i) => `<li><img src="${poseSrc(x)}" alt=""><div><h3>${i + 1}. ${esc(x.title[lang])}</h3>${x.steps.map(s => `<p><b>${esc(WHO[s.who][lang])}:</b> ${esc(s.text[lang])}</p>`).join('')}</div></li>`)
      .join('')
    w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(t.shotList)} · ${esc(p.name)}</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:24px;color:#111}h1{font-size:22px;margin:0}h2{font-size:14px;color:#666;font-weight:500;margin:4px 0 18px}ol{list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:14px}li{display:flex;gap:12px;break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:10px}img{width:90px;height:120px;object-fit:cover;border-radius:6px}h3{font-size:15px;margin:0 0 6px}p{margin:0 0 4px}</style></head><body><h1>${esc(t.shotList)} · ${esc(p.name)}</h1><h2>${esc(studio.name)}${p.events[0]?.date ? ` · ${esc(formatDate(p.events[0].date, lang))}` : ''}</h2><ol>${rows}</ol><script>onload=()=>print()</script></body></html>`)
    w.document.close()
  }

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>{t.setup}</SectionTitle>
        <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <p className="mb-4 text-[13px] text-ink/55">{t.setupB}</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <FormSelect label={t.event} value={plan.eventKey} onChange={v => setPosePlan(p.id, { ...plan, eventKey: v })} options={POSE_EVENTS.map(k => ({ value: k, label: eventByKey(k)?.name[lang] ?? k }))} />
            <FormSelect label={t.religion} value={(p.religion ?? '') as Faith | ''} onChange={setReligionBoth} options={[{ value: '' as const, label: t.none }, ...FAITHS.map(f => ({ value: f.key, label: f.label[lang] }))]} />
            <Button variant="ink" iconLeft="sparkle" onClick={fillFromLibrary}>{t.fill}</Button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle action={<span className="text-[12.5px] text-ink/45">{poses.length}</span>}>{t.list}</SectionTitle>
        {poses.length === 0 ? (
          <p className="rounded-2xl bg-ink/[0.04] px-4 py-3 text-[13.5px] text-ink/60">{t.empty}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {poses.map(x => (
              <PoseTile key={x.id} pose={x} answer={plan.picks[x.id]} labels={t}>
                <IconBtn icon="chevronLeft" label={t.earlier} onClick={() => setIds(moveId(plan.ids, x.id, -1))} />
                <IconBtn icon="chevronRight" label={t.later} onClick={() => setIds(moveId(plan.ids, x.id, 1))} />
                <IconBtn icon="trash" tone="red" label={t.remove} onClick={() => setIds(plan.ids.filter(id => id !== x.id))} />
              </PoseTile>
            ))}
          </div>
        )}
        {library.length > 0 && (
          <details className="mt-4 rounded-[22px] border border-ink/[0.08] bg-white p-4">
            <summary className="cursor-pointer text-[13.5px] font-semibold text-ink">{t.addMore} · {library.length}</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {library.map(x => (
                <button key={x.id} type="button" onClick={() => setIds([...plan.ids, x.id])} className="h-9 cursor-pointer rounded-full border border-ink/10 px-3.5 text-[13px] text-ink/75 hover:bg-ink/[0.04]">
                  + {x.title[lang]}
                </button>
              ))}
            </div>
          </details>
        )}
      </section>

      <section>
        <SectionTitle action={plan.sentAt ? <Pill tone="green">{t.sentOn} {formatDate(plan.sentAt, lang)}</Pill> : undefined}>{t.send}</SectionTitle>
        <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
          <p className="text-[12.5px] text-ink/50">{plan.sentAt ? t.sendB : t.notSent}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-2xl bg-ink/[0.04] py-1 pl-3.5 pr-1">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink/80">{link}</span>
              <CopyButton text={link} label={t.copy} />
            </div>
            {plan.sentAt ? (
              <>
                <Button variant="ink" size="sm" iconLeft="whatsapp" href={waLink(p.phone, whatsappShare(studio, p, 'poses'))}>{t.wa}</Button>
                {!plan.submittedAt && <Button variant="ghost" size="sm" onClick={() => togglePoseSend(p.id)}>{t.unsend}</Button>}
              </>
            ) : (
              <Button variant="ink" size="sm" iconLeft="send" disabled={!poses.length} onClick={() => { setPosePlan(p.id, plan); togglePoseSend(p.id) }}>{t.sendNow}</Button>
            )}
          </div>
        </div>
      </section>

      {plan.sentAt && (
        <section>
          <SectionTitle action={<Pill tone={plan.submittedAt ? 'green' : 'amber'}>{plan.submittedAt ? `${t.submitted} ${formatDate(plan.submittedAt, lang)}` : t.waiting}</Pill>}>{t.answers}</SectionTitle>
          <div className="rounded-[22px] border border-ink/[0.08] bg-white p-4 md:p-5">
            <p className="text-[14px] font-medium text-ink">{fill(t.progress, { n: prog.answered, total: prog.total, yes: prog.yes, no: prog.no })}</p>
            {plan.submittedAt && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ink" size="sm" iconLeft="book" onClick={printList}>{t.print}</Button>
                <Button variant="ghost" size="sm" iconLeft="refresh" onClick={() => reopenPoses(p.id)}>{t.reopen}</Button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function PoseTile({ pose, answer, labels, children }: { pose: PoseDef; answer?: 'yes' | 'no'; labels: { yes: string; no: string }; children: ReactNode }) {
  const lang = useLang()
  return (
    <figure className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
      <div className="relative">
        <PoseImage pose={pose} />
        {answer && <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${answer === 'yes' ? 'bg-emerald-600 text-white' : 'bg-ink/75 text-white'}`}>{answer === 'yes' ? labels.yes : labels.no}</span>}
      </div>
      <figcaption className="p-2.5">
        <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">{pose.title[lang]}</p>
        <div className="mt-1 flex justify-end">{children}</div>
      </figcaption>
    </figure>
  )
}

/** Best guess of the pose event from the free-text project type. */
function guessEvent(type: string): EventKey {
  const k = POSE_EVENTS.find(e => type.toLowerCase().includes(e) || (eventByKey(e)?.name.en ?? '').toLowerCase() === type.toLowerCase())
  return k ?? 'wedding'
}
