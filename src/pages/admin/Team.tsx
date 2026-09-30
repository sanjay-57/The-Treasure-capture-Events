import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { Button, EmptyState, Modal, Segmented } from '../../components/ui'
import { EASE } from '../../components/motion'
import { KolamCorner } from '../../components/tamil'
import { DISTRICTS, ROLES, districtName, eventByKey, type DistrictKey, type Worker, type WorkerRole } from '../../lib/data'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { useStore, type Order, type OutboxMessage } from '../../lib/store'
import { AC, Avatar, ConfirmModal, FormSelect, MiniSelect, PageHeader, SearchInput, Stars, StatusPill, Switch, TextInput, WaBubble, WaFrame, daysUntil, inDays, telHref } from './kit'

const copy = {
  eyebrow: { en: 'Photographers & freelancers', ta: 'புகைப்படக் கலைஞர்கள் & ஃப்ரீலான்ஸர்கள்' },
  title: { en: 'Team', ta: 'குழு' },
  sub: { en: 'Your crew across Tamil Nadu. Dispatch sends venue, timings and client contact to their WhatsApp.', ta: 'தமிழ்நாடு முழுவதும் உங்கள் குழு. பணி அனுப்பினால் இடம், நேரம், வாடிக்கையாளர் தொடர்பு அவர்களின் WhatsApp-க்குச் செல்லும்.' },
  add: { en: 'Add member', ta: 'உறுப்பினர் சேர்' },
  total: { en: 'Crew members', ta: 'குழு உறுப்பினர்கள்' },
  availableNow: { en: 'Available now', ta: 'இப்போது கிடைப்பவர்கள்' },
  freelancers: { en: 'Freelancers', ta: 'ஃப்ரீலான்ஸர்கள்' },
  districts: { en: 'Districts covered', ta: 'உள்ளடக்கிய மாவட்டங்கள்' },
  search: { en: 'Search name or phone', ta: 'பெயர் அல்லது தொலைபேசி' },
  allDistricts: { en: 'All districts', ta: 'அனைத்து மாவட்டங்கள்' },
  allRoles: { en: 'All roles', ta: 'அனைத்துப் பணிகள்' },
  role: { en: 'Role', ta: 'பணி' },
  district: { en: 'District', ta: 'மாவட்டம்' },
  any: { en: 'Any', ta: 'அனைவரும்' },
  jobs: { en: 'jobs', ta: 'பணிகள்' },
  active: { en: 'active', ta: 'நடப்பில்' },
  dispatch: { en: 'Dispatch', ta: 'பணி அனுப்பு' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  removeTitle: { en: 'Remove from team?', ta: 'குழுவிலிருந்து நீக்கவா?' },
  removeBody: { en: 'They will no longer appear in dispatch suggestions. Past orders keep their history.', ta: 'பணி பரிந்துரைகளில் இனி தோன்ற மாட்டார். பழைய ஆர்டர்களின் வரலாறு மாறாது.' },
  removed: { en: 'removed from the team', ta: 'குழுவிலிருந்து நீக்கப்பட்டார்' },
  nowAvailable: { en: 'is now available', ta: 'இப்போது கிடைக்கிறார்' },
  nowBusy: { en: 'marked unavailable', ta: 'கிடைக்கவில்லை எனக் குறிக்கப்பட்டார்' },
  newMember: { en: 'New crew member', ta: 'புதிய குழு உறுப்பினர்' },
  editMember: { en: 'Edit crew member', ta: 'குழு உறுப்பினரைத் திருத்து' },
  nameEn: { en: 'Name (English)', ta: 'பெயர் (ஆங்கிலம்)' },
  nameTa: { en: 'Name (Tamil)', ta: 'பெயர் (தமிழ்)' },
  phone: { en: 'WhatsApp number', ta: 'WhatsApp எண்' },
  rating: { en: 'Rating', ta: 'மதிப்பீடு' },
  jobsDone: { en: 'Jobs completed', ta: 'முடித்த பணிகள்' },
  freelance: { en: 'Freelancer', ta: 'ஃப்ரீலான்ஸர்' },
  freelanceHint: { en: 'Paid per job rather than salaried', ta: 'சம்பளம் அல்ல, ஒவ்வொரு பணிக்கும் ஊதியம்' },
  availableHint: { en: 'Shown first when dispatching', ta: 'பணி அனுப்பும்போது முதலில் காட்டப்படும்' },
  saveMember: { en: 'Save member', ta: 'உறுப்பினரைச் சேமி' },
  saved: { en: 'Team updated', ta: 'குழு புதுப்பிக்கப்பட்டது' },
  needName: { en: 'Name and phone are required', ta: 'பெயரும் தொலைபேசியும் அவசியம்' },
  dispatchTitle: { en: 'Dispatch', ta: 'பணி அனுப்பு:' },
  dispatchSub: { en: 'Pick an upcoming order. Orders in their district are listed first.', ta: 'வரவிருக்கும் ஆர்டரைத் தேர்ந்தெடுக்கவும். அவர்களின் மாவட்ட ஆர்டர்கள் முதலில்.' },
  noOrders: { en: 'No open orders to dispatch to.', ta: 'அனுப்புவதற்கு திறந்த ஆர்டர்கள் இல்லை.' },
  assign: { en: 'Assign', ta: 'ஒதுக்கு' },
  onIt: { en: 'On this job', ta: 'பணியில் உள்ளார்' },
  sent: { en: 'Sent on WhatsApp', ta: 'WhatsApp-ல் அனுப்பப்பட்டது' },
  sameDistrict: { en: 'Same district', ta: 'அதே மாவட்டம்' },
  done: { en: 'Done', ta: 'சரி' },
  another: { en: 'Assign another', ta: 'மற்றொன்றை ஒதுக்கு' },
  crewCount: { en: 'crew', ta: 'குழு' },
}

type Avail = 'all' | 'available' | 'busy'

export default function Team() {
  const t = useT(copy)
  const lang = useLang()
  const workers = useStore(s => s.workers)
  const orders = useStore(s => s.orders)
  const upsert = useStore(s => s.upsertWorker)
  const removeWorker = useStore(s => s.removeWorker)
  const [q, setQ] = useState('')
  const [district, setDistrict] = useState<'all' | DistrictKey>('all')
  const [role, setRole] = useState<'all' | WorkerRole>('all')
  const [avail, setAvail] = useState<Avail>('all')
  const [editing, setEditing] = useState<Worker | 'new' | null>(null)
  const [removing, setRemoving] = useState<Worker | null>(null)
  const [dispatching, setDispatching] = useState<Worker | null>(null)
  useTitle({ en: 'Team', ta: 'குழு' })

  const activeJobs = useMemo(() => {
    const m: Record<string, number> = {}
    for (const o of orders) if (o.status !== 'DELIVERED') for (const w of o.workerIds) m[w] = (m[w] ?? 0) + 1
    return m
  }, [orders])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return workers.filter(w => {
      if (district !== 'all' && w.district !== district) return false
      if (role !== 'all' && w.role !== role) return false
      if (avail === 'available' && !w.available) return false
      if (avail === 'busy' && w.available) return false
      if (s && !(w.name.en.toLowerCase().includes(s) || w.name.ta.includes(q.trim()) || w.phone.replace(/\D/g, '').includes(s.replace(/\D/g, '') || '§'))) return false
      return true
    })
  }, [workers, q, district, role, avail])

  const stats = [
    { l: t.total, v: workers.length, icon: 'users' as const },
    { l: t.availableNow, v: workers.filter(w => w.available).length, icon: 'check' as const },
    { l: t.freelancers, v: workers.filter(w => w.freelance).length, icon: 'camera' as const },
    { l: t.districts, v: new Set(workers.map(w => w.district)).size, icon: 'mapPin' as const },
  ]
  const filtersOn = district !== 'all' || role !== 'all' || avail !== 'all' || !!q

  return (
    <div>
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} actions={<Button size="sm" iconLeft="plus" onClick={() => setEditing('new')} className="max-md:!h-10 max-md:w-full">{t.add}</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:mb-6 md:grid-cols-4 md:gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.6, ease: EASE }} className="flex min-w-0 items-center gap-3 rounded-[22px] border hairline bg-white px-3.5 py-3 md:px-4 md:py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/[0.045] text-ink/60"><Icon name={s.icon} size={16} /></span>
            <div className="min-w-0">
              <p className="font-display text-[26px] font-medium leading-none text-ink">{s.v}</p>
              <p className="mt-1 truncate text-[12px] text-ink/50">{s.l}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 md:mb-6 md:flex md:flex-wrap md:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={t.search} className="col-span-2 md:w-[260px]" />
        <MiniSelect label={t.district} icon="mapPin" value={district} onChange={setDistrict} options={[{ value: 'all', label: t.allDistricts }, ...DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] }))]} />
        <MiniSelect label={t.role} icon="camera" value={role} onChange={setRole} options={[{ value: 'all', label: t.allRoles }, ...(Object.keys(ROLES) as WorkerRole[]).map(r => ({ value: r, label: ROLES[r][lang] }))]} />
        <Segmented<Avail> size="sm" value={avail} onChange={setAvail} className="col-span-2 w-full [&>button]:h-9 [&>button]:flex-1 md:ml-auto md:w-fit md:[&>button]:h-7 md:[&>button]:flex-none" options={[{ value: 'all', label: t.any }, { value: 'available', label: AC.available[lang] }, { value: 'busy', label: AC.busy[lang] }]} />
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="users"
          title={AC.noResults[lang]}
          action={filtersOn ? <Button variant="outline" size="sm" onClick={() => { setQ(''); setDistrict('all'); setRole('all'); setAvail('all') }}>{AC.clearFilters[lang]}</Button> : <Button size="sm" iconLeft="plus" onClick={() => setEditing('new')}>{t.add}</Button>}
        />
      ) : (
        <motion.ul layout className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((w, i) => (
              <motion.li
                key={w.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 8) * 0.04, duration: 0.5, ease: EASE } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
              >
                <WorkerCard
                  w={w}
                  active={activeJobs[w.id] ?? 0}
                  onToggle={v => { upsert({ ...w, available: v }); toast(`${w.name[lang]} ${v ? t.nowAvailable : t.nowBusy}`) }}
                  onEdit={() => setEditing(w)}
                  onRemove={() => setRemoving(w)}
                  onDispatch={() => setDispatching(w)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      <WorkerModal worker={editing} onClose={() => setEditing(null)} />
      <DispatchModal worker={dispatching} onClose={() => setDispatching(null)} />
      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => { if (removing) { removeWorker(removing.id); toast(`${removing.name[lang]} ${t.removed}`) } }}
        title={t.removeTitle}
        body={removing ? <><strong className="text-ink">{removing.name[lang]}</strong> · {ROLES[removing.role][lang]}. {t.removeBody}</> : null}
        confirmLabel={t.remove}
        icon="trash"
      />
    </div>
  )
}

function WorkerCard({ w, active, onToggle, onEdit, onRemove, onDispatch }: { w: Worker; active: number; onToggle: (v: boolean) => void; onEdit: () => void; onRemove: () => void; onDispatch: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[26px] border hairline bg-white p-5 transition duration-500 hover:-translate-y-0.5 hover:shadow-soft ${w.available ? '' : 'bg-white/70'}`}>
      {lang === 'ta' && <KolamCorner className="pointer-events-none absolute -bottom-1 -right-1 rotate-180 opacity-30" />}
      <div className="flex items-start gap-3.5">
        <span className="relative">
          <Avatar name={w.name[lang]} size={52} tone={w.available ? 'ruby' : 'muted'} />
          <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-white ${w.available ? 'bg-ruby-bright' : 'bg-ink/25'}`} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-[16px] font-semibold tracking-tight text-ink">{w.name[lang]}</h3>
          <p className="truncate text-[12.5px] text-ink/55">{ROLES[w.role][lang]}</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${w.freelance ? 'border border-ink/12 text-ink/55' : 'bg-ink text-white'}`}>{w.freelance ? AC.freelance[lang] : AC.staff[lang]}</span>
        </div>
        <Switch checked={w.available} onChange={onToggle} label={w.available ? AC.available[lang] : AC.busy[lang]} size="sm" />
      </div>

      <dl className="mb-4 mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[13px] md:mb-5 md:mt-5 md:gap-x-0">
        <dd className="flex items-center gap-1.5 text-ink/65"><Icon name="mapPin" size={14} className="text-ink/35" />{districtName(w.district, lang)}</dd>
        <dd className="flex items-center justify-end gap-1.5 text-ink/65"><Stars value={w.rating} size={12} /><span className="font-semibold tabular-nums text-ink">{w.rating.toFixed(1)}</span></dd>
        <dd className="flex items-center gap-1.5 text-ink/65"><Icon name="phone" size={14} className="text-ink/35" /><a href={telHref(w.phone)} className="truncate transition hover:text-ruby">{w.phone}</a></dd>
        <dd className="text-right text-ink/55"><span className="font-semibold tabular-nums text-ink">{w.jobs}</span> {t.jobs}{active > 0 && <span className="text-ruby"> · {active} {t.active}</span>}</dd>
      </dl>

      <div className="mt-auto flex items-center gap-1.5 border-t hairline pt-4">
        <Button variant={w.available ? 'ink' : 'outline'} size="sm" iconLeft="send" onClick={onDispatch} className="flex-1 max-md:!h-10">{t.dispatch}</Button>
        <button type="button" onClick={onEdit} aria-label={`${t.edit} ${w.name[lang]}`} title={t.edit} className="flex h-10 w-10 shrink-0 items-center md:h-9 md:w-9 justify-center rounded-full text-ink/45 transition hover:bg-ink/[0.05] hover:text-ink cursor-pointer"><Icon name="edit" size={16} /></button>
        <button type="button" onClick={onRemove} aria-label={`${t.remove} ${w.name[lang]}`} title={t.remove} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/45 transition hover:bg-ruby-soft md:h-9 md:w-9 hover:text-ruby cursor-pointer"><Icon name="trash" size={16} /></button>
      </div>
    </article>
  )
}

// ─── Add / edit ──────────────────────────────────────────────────────────────

const blank = (): Worker => ({ id: 'w' + Math.random().toString(36).slice(2, 8), name: { en: '', ta: '' }, role: 'lead', district: 'madurai', phone: '', available: true, freelance: true, rating: 4.5, jobs: 0 })

function WorkerModal({ worker, onClose }: { worker: Worker | 'new' | null; onClose: () => void }) {
  const t = useT(copy)
  return (
    <Modal open={!!worker} onClose={onClose} label={worker === 'new' ? t.newMember : t.editMember} className="sm:max-w-xl">
      {worker && <WorkerForm key={worker === 'new' ? 'new' : worker.id} initial={worker === 'new' ? blank() : worker} isNew={worker === 'new'} onClose={onClose} />}
    </Modal>
  )
}

function WorkerForm({ initial, isNew, onClose }: { initial: Worker; isNew: boolean; onClose: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  const upsert = useStore(s => s.upsertWorker)
  const [w, setW] = useState<Worker>(initial)
  const [err, setErr] = useState('')
  const set = (patch: Partial<Worker>) => { setW(x => ({ ...x, ...patch })); setErr('') }

  const save = () => {
    if (!w.name.en.trim() || !w.phone.trim()) return setErr(t.needName)
    upsert({ ...w, name: { en: w.name.en.trim(), ta: w.name.ta.trim() || w.name.en.trim() }, rating: Math.min(5, Math.max(0, Number(w.rating) || 0)) })
    toast(t.saved)
    onClose()
  }

  return (
    <div className="p-6 pt-7 md:p-8">
      <div className="mb-6 flex items-center gap-3.5 pr-10">
        <Avatar name={(lang === 'ta' ? w.name.ta : w.name.en) || '+'} size={48} tone="ruby" />
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">{isNew ? t.newMember : t.editMember}</h2>
          <p className="text-[13px] text-ink/50">{ROLES[w.role][lang]} · {districtName(w.district, lang)}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label={t.nameEn} value={w.name.en} onChange={v => set({ name: { ...w.name, en: v } })} required autoFocus />
        <TextInput label={t.nameTa} value={w.name.ta} onChange={v => set({ name: { ...w.name, ta: v } })} lang="ta" />
        <FormSelect<WorkerRole> label={t.role} value={w.role} onChange={v => set({ role: v })} options={(Object.keys(ROLES) as WorkerRole[]).map(r => ({ value: r, label: ROLES[r][lang] }))} />
        <FormSelect<DistrictKey> label={t.district} value={w.district} onChange={v => set({ district: v })} options={DISTRICTS.map(d => ({ value: d.key, label: d.name[lang] }))} />
        <TextInput label={t.phone} value={w.phone} onChange={v => set({ phone: v })} inputMode="tel" required className="sm:col-span-2" />
        <div className="grid grid-cols-2 gap-4 sm:contents">
        <TextInput label={t.rating} value={String(w.rating)} onChange={v => set({ rating: Number(v.replace(/[^\d.]/g, '')) || 0 })} inputMode="decimal" />
        <TextInput label={t.jobsDone} value={String(w.jobs)} onChange={v => set({ jobs: Number(v.replace(/\D/g, '')) || 0 })} inputMode="numeric" />
        </div>
      </div>
      <div className="mt-5 divide-y divide-ink/[0.06] rounded-2xl border hairline bg-white/60">
        <ToggleRow label={AC.available[lang]} hint={t.availableHint} checked={w.available} onChange={v => set({ available: v })} />
        <ToggleRow label={t.freelance} hint={t.freelanceHint} checked={w.freelance} onChange={v => set({ freelance: v })} />
      </div>
      {err && <p className="mt-3 text-[13px] text-ruby">{err}</p>}
      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>{AC.cancel[lang]}</Button>
        <Button variant="ink" iconLeft="check" onClick={save}>{t.saveMember}</Button>
      </div>
    </div>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">{label}</p>
        <p className="text-[12px] text-ink/45">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

function DispatchModal({ worker, onClose }: { worker: Worker | null; onClose: () => void }) {
  const t = useT(copy)
  const lang = useLang()
  return (
    <Modal open={!!worker} onClose={onClose} label={t.dispatchTitle} className="sm:max-w-xl">
      {worker && <DispatchBody key={worker.id} worker={worker} onClose={onClose} lang={lang} />}
    </Modal>
  )
}

function DispatchBody({ worker, onClose, lang }: { worker: Worker; onClose: () => void; lang: 'en' | 'ta' }) {
  const t = useT(copy)
  const orders = useStore(s => s.orders)
  const assign = useStore(s => s.assignWorker)
  const [sent, setSent] = useState<{ o: Order; m?: OutboxMessage } | null>(null)
  const open = useMemo(
    () =>
      orders
        .filter(o => o.status !== 'DELIVERED' && o.status !== 'BILLED' && (daysUntil(o.date) ?? 0) >= 0)
        .sort((a, b) => Number(b.district === worker.district) - Number(a.district === worker.district) || (a.date || '9999').localeCompare(b.date || '9999')),
    [orders, worker.district],
  )

  const go = (o: Order) => {
    assign(o.id, worker.id)
    const m = useStore.getState().outbox.find(x => x.orderId === o.id && x.template === 'job_dispatch' && x.to === worker.phone)
    setSent({ o, m })
    toast(AC.waDispatched[lang])
  }

  return (
    <div className="p-6 pt-7 md:p-8">
      <div className="mb-5 flex items-center gap-3.5 pr-10">
        <Avatar name={worker.name[lang]} size={48} tone="ruby" />
        <div className="min-w-0">
          <h2 className="truncate text-[20px] font-semibold tracking-tight text-ink">{t.dispatchTitle} {worker.name[lang]}</h2>
          <p className="truncate text-[13px] text-ink/50">{ROLES[worker.role][lang]} · {districtName(worker.district, lang)}</p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }}>
            <p className="mb-3 flex items-center gap-2 text-[13.5px] font-medium text-ink"><Icon name="check" size={16} className="text-ruby" />{t.sent} · {worker.phone}</p>
            <WaFrame name={worker.name[lang]} sub={sent.o.id}>
              <WaBubble body={sent.m?.body ?? ''} template="job_dispatch" at={sent.m?.at} />
            </WaFrame>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setSent(null)}>{t.another}</Button>
              <Button variant="ink" onClick={onClose}>{t.done}</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }}>
            <p className="mb-4 text-[13.5px] text-ink/55">{t.dispatchSub}</p>
            {open.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-[13.5px] text-ink/45">{t.noOrders}</p>
            ) : (
              <ul className="space-y-2">
                {open.map(o => {
                  const on = o.workerIds.includes(worker.id)
                  const d = daysUntil(o.date)
                  return (
                    <li key={o.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition sm:flex-nowrap ${on ? 'border-ink/10 bg-ink/[0.03]' : 'border-ink/[0.08] bg-white hover:border-ink/20'}`}>
                      <div className="min-w-0 flex-1 basis-[12rem] sm:basis-auto">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link to={`/admin/orders/${o.id}`} onClick={onClose} className="truncate text-[14px] font-semibold text-ink hover:text-ruby">{o.client.name}</Link>
                          {o.district === worker.district && <span className="rounded-full bg-ruby-soft px-2 py-0.5 text-[10.5px] font-semibold text-ruby-deep">{t.sameDistrict}</span>}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-ink/50">
                          {eventByKey(o.eventType)?.name[lang]} · {districtName(o.district, lang)} · {o.date ? `${formatDate(o.date, lang, { day: 'numeric', month: 'short' })}${d !== null ? ` (${inDays(d, lang)})` : ''}` : AC.tbc[lang]} · {o.workerIds.length} {t.crewCount}
                        </p>
                        <StatusPill status={o.status} eventType={o.eventType} className="mt-2" />
                      </div>
                      {on ? (
                        <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-white max-sm:w-full max-sm:py-2.5"><Icon name="check" size={13} />{t.onIt}</span>
                      ) : (
                        <Button size="sm" variant="ink" iconLeft="send" onClick={() => go(o)} className="shrink-0 max-sm:!h-10 max-sm:w-full">{t.assign}</Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
