import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button } from '../../components/ui'
import { EASE } from '../../components/motion'
import { PoseImage } from '../../components/poses'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { FAITHS, faithsFor, poseById, posesFor, type Faith, type PoseDef } from '../../lib/poses'
import { paidTotal, posesMessage, useStore, type Order } from '../../lib/store'
import { toast } from '../../lib/ui'
import { AC, ConfirmModal, Panel, WaBubble, WaFrame } from './kit'

/*
 * Order page panel for the pose guide — the first step once the advance is
 * in. The admin adds ritual sets on top of the common poses (the client never
 * sees which set a pose came from), trims the list, and sends it. Afterwards
 * the panel tracks the client's ratings and links to the crew's shot list.
 */

const copy = {
  title: { en: 'Pose guide', ta: 'போஸ் வழிகாட்டி' },
  sub: { en: 'Step 1 after the advance — the client picks, the crew shoots', ta: 'முன்பணத்துக்குப் பின் முதல் படி — வாடிக்கையாளர் தேர்வு, குழு படப்பிடிப்பு' },
  unpaid: { en: 'Record the advance first. The guide reaches the client only after payment.', ta: 'முதலில் முன்பணத்தைப் பதிவு செய்யுங்கள். கட்டணம் வந்த பின்னரே வழிகாட்டி வாடிக்கையாளருக்குச் செல்லும்.' },
  rituals: { en: 'Ritual sets', ta: 'சடங்குத் தொகுப்புகள்' },
  ritualsSub: { en: 'Common poses always go. Add the family’s ritual poses — only the studio sees this choice.', ta: 'பொதுவான போஸ்கள் எப்போதும் செல்லும். குடும்பத்தின் சடங்கு போஸ்களைச் சேர்க்கவும் — இந்தத் தேர்வு ஸ்டுடியோவுக்கு மட்டுமே தெரியும்.' },
  noRituals: { en: 'No ritual poses for this event — common poses only.', ta: 'இந்த நிகழ்வுக்குச் சடங்கு போஸ்கள் இல்லை — பொதுவானவை மட்டும்.' },
  common: { en: 'Common poses', ta: 'பொதுவான போஸ்கள்' },
  tapToggle: { en: 'Tap a pose to leave it out', ta: 'விலக்க ஒரு போஸைத் தொடுங்கள்' },
  selected: { en: 'poses selected', ta: 'போஸ்கள் தேர்வு' },
  send: { en: 'Send to client', ta: 'வாடிக்கையாளருக்கு அனுப்பு' },
  resend: { en: 'Update & resend', ta: 'புதுப்பித்து மீண்டும் அனுப்பு' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  confirmTitle: { en: 'Send the pose guide?', ta: 'போஸ் வழிகாட்டியை அனுப்பலாமா?' },
  confirmBody: { en: 'The client gets this on WhatsApp and the Poses tab unlocks on their dashboard.', ta: 'வாடிக்கையாளருக்கு இது வாட்ஸ்அப்பில் செல்லும், அவர்கள் பக்கத்தில் போஸ்கள் பகுதி திறக்கும்.' },
  sentToast: { en: 'Pose guide sent', ta: 'போஸ் வழிகாட்டி அனுப்பப்பட்டது' },
  sentOn: { en: 'Sent', ta: 'அனுப்பியது' },
  rated: { en: 'Rated', ta: 'மதிப்பிட்டவை' },
  liked: { en: 'Liked', ta: 'பிடித்தவை' },
  waiting: { en: 'Waiting for the client', ta: 'வாடிக்கையாளருக்காகக் காத்திருக்கிறது' },
  submitted: { en: 'Shot list locked', ta: 'படப் பட்டியல் உறுதி' },
  shotList: { en: 'Open shot list', ta: 'படப் பட்டியலைத் திற' },
  edit: { en: 'Edit selection', ta: 'தேர்வைத் திருத்து' },
  reopen: { en: 'Reopen for client', ta: 'வாடிக்கையாளருக்கு மீண்டும் திற' },
  reopened: { en: 'The client can change their picks again', ta: 'வாடிக்கையாளர் மீண்டும் மாற்றலாம்' },
  included: { en: 'Included', ta: 'சேர்க்கப்பட்டவை' },
  commonOnly: { en: 'Common only', ta: 'பொதுவானவை மட்டும்' },
}

export function PosesPanel({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const plan = o.poses
  const [editing, setEditing] = useState(!plan)
  const reopen = useStore(s => s.reopenPoses)

  if (o.eventType === 'commercial') return null

  return (
    <Panel id="poses" title={t.title} subtitle={t.sub} icon="camera" kolam>
      <AnimatePresence mode="wait" initial={false}>
        {editing || !plan ? (
          <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
            <Editor o={o} onDone={() => setEditing(false)} onCancel={plan ? () => setEditing(false) : undefined} />
          </motion.div>
        ) : (
          <motion.div key="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
            <Status o={o} />
            <div className="mt-5 flex flex-wrap gap-2">
              <Button to={`/admin/poses/${o.id}`} variant="ink" size="sm" iconLeft="camera" className="max-md:!h-11 max-md:flex-1">{t.shotList}</Button>
              <Button variant="outline" size="sm" iconLeft="edit" onClick={() => setEditing(true)} className="max-md:!h-11 max-md:flex-1">{t.edit}</Button>
              {plan.submittedAt && (
                <Button variant="ghost" size="sm" iconLeft="refresh" onClick={() => { reopen(o.id); toast(t.reopened) }} className="max-md:!h-11">{t.reopen}</Button>
              )}
            </div>
            <p className="mt-4 text-[12px] text-ink/40">
              {t.included}: {plan.faiths.length ? plan.faiths.map(f => FAITHS.find(x => x.key === f)?.label[lang]).join(' · ') : t.commonOnly}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}

function Status({ o }: { o: Order }) {
  const t = useT(copy)
  const lang = useLang()
  const plan = o.poses!
  const poses = plan.ids.map(poseById).filter((p): p is PoseDef => !!p)
  const rated = poses.filter(p => plan.picks[p.id]).length
  const liked = poses.filter(p => plan.picks[p.id] === 'yes')

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t.sentOn} value={formatDate(plan.sentAt, lang, { day: 'numeric', month: 'short' })} />
        <Stat label={t.rated} value={`${rated}/${poses.length}`} />
        <Stat label={t.liked} value={String(liked.length)} ruby />
      </div>
      <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${plan.submittedAt ? 'bg-ink text-white' : 'bg-ruby-soft text-ruby-deep'}`}>
        <Icon name={plan.submittedAt ? 'check' : 'clock'} size={12} />
        {plan.submittedAt ? `${t.submitted} · ${formatDate(plan.submittedAt, lang, { day: 'numeric', month: 'short' })}` : t.waiting}
      </p>
      {liked.length > 0 && (
        <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {liked.slice(0, 16).map(p => (
            <span key={p.id} className="overflow-hidden rounded-lg" title={p.title[lang]}>
              <PoseImage pose={p} />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, ruby }: { label: string; value: string; ruby?: boolean }) {
  return (
    <div className="rounded-2xl bg-ink/[0.035] px-3.5 py-3">
      <p className="t-label text-ink/40">{label}</p>
      <p className={`mt-1 text-[18px] font-semibold tabular-nums ${ruby ? 'text-ruby' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function Editor({ o, onDone, onCancel }: { o: Order; onDone: () => void; onCancel?: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const send = useStore(s => s.sendPoses)
  const plan = o.poses
  const available = useMemo(() => faithsFor(o.eventType), [o.eventType])
  const [faiths, setFaiths] = useState<Faith[]>(plan?.faiths ?? (o.religion && available.includes(o.religion) ? [o.religion] : []))
  const [left, setLeft] = useState<Set<string>>(() => {
    if (!plan) return new Set()
    return new Set(posesFor(o.eventType, plan.faiths).map(p => p.id).filter(id => !plan.ids.includes(id)))
  })
  const [confirm, setConfirm] = useState(false)

  const pool = posesFor(o.eventType, faiths)
  const chosen = pool.filter(p => !left.has(p.id))
  const paid = paidTotal(o) > 0
  const groups: { key: string; label: string; poses: PoseDef[] }[] = [
    { key: 'common', label: t.common, poses: pool.filter(p => !p.faith) },
    ...faiths.map(f => ({ key: f, label: FAITHS.find(x => x.key === f)!.label[lang], poses: pool.filter(p => p.faith === f) })),
  ]

  const toggleFaith = (f: Faith) => setFaiths(fs => (fs.includes(f) ? fs.filter(x => x !== f) : [...FAITHS.map(x => x.key).filter(k => k === f || fs.includes(k))]))
  const togglePose = (id: string) => setLeft(s => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })

  const doSend = () => {
    send(o.id, chosen.map(p => p.id), faiths)
    toast(`${t.sentToast} · ${AC.waSent[lang]}`)
    onDone()
  }

  return (
    <div>
      {!paid && (
        <p className="mb-5 flex items-start gap-2.5 rounded-2xl border border-dashed border-ruby/30 bg-ruby-soft/40 px-4 py-3.5 text-[13px] text-ruby-deep">
          <Icon name="lock" size={15} className="mt-0.5 shrink-0" />
          {t.unpaid}
        </p>
      )}

      <p className="t-label text-ink/40">{t.rituals}</p>
      {available.length ? (
        <>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/50">{t.ritualsSub}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {FAITHS.filter(f => available.includes(f.key)).map(f => {
              const on = faiths.includes(f.key)
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFaith(f.key)}
                  className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition cursor-pointer ${on ? 'border-ink bg-ink text-white' : 'border-ink/12 bg-white hover:border-ink/35'}`}
                >
                  <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border ${on ? 'border-white bg-white text-ink' : 'border-ink/25'}`}>
                    {on && <Icon name="check" size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold">{f.label[lang]}</span>
                    <span className={`mt-0.5 block text-[11.5px] leading-snug ${on ? 'text-white/60' : 'text-ink/45'}`}>{f.note[lang]}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[12.5px] text-ink/50">{t.noRituals}</p>
      )}

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink">
          {chosen.length} <span className="font-normal text-ink/50">{t.selected}</span>
        </p>
        <p className="text-[11.5px] text-ink/40">{t.tapToggle}</p>
      </div>

      <div className="mt-3 space-y-5">
        {groups.filter(g => g.poses.length).map(g => (
          <div key={g.key}>
            <p className="t-label mb-2 text-ink/40">{g.label} · {g.poses.filter(p => !left.has(p.id)).length}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
              {g.poses.map(p => {
                const on = !left.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => togglePose(p.id)}
                    className={`group relative overflow-hidden rounded-xl text-left transition duration-300 cursor-pointer ${on ? 'ring-1 ring-ink/10' : 'opacity-40 grayscale'}`}
                  >
                    <PoseImage pose={p} />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-2 pb-1.5 pt-6 text-[10.5px] font-medium leading-tight text-white">{p.title[lang]}</span>
                    <span className={`absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full transition ${on ? 'bg-ruby text-white' : 'bg-white/90 text-ink/40'}`}>
                      <Icon name={on ? 'check' : 'x'} size={11} strokeWidth={2.6} />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} className="max-md:!h-11">{t.cancel}</Button>}
        <Button size="sm" icon="send" disabled={!paid || !chosen.length} onClick={() => setConfirm(true)} className="max-md:!h-11">
          {plan ? t.resend : t.send} · {chosen.length}
        </Button>
      </div>

      <ConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={doSend} title={t.confirmTitle} body={t.confirmBody} confirmLabel={plan ? t.resend : t.send} icon="send">
        <WaFrame name={o.client.name} sub={o.client.contact}>
          <WaBubble body={posesMessage(o, chosen.length, !!plan)} template={plan ? 'poses_updated' : 'poses_ready'} compact />
        </WaFrame>
      </ConfirmModal>
    </div>
  )
}
