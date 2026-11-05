import { useEffect, useRef, useState } from 'react'
import { Button, EmptyState } from '../../components/ui'
import { api, ApiError } from '../../api/client'
import { isLan } from '../../api/mode'
import { useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { ConfirmModal, PageHeader, Panel, Switch, TextInput, relTime } from './kit'

const copy = {
  eyebrow: { en: 'Studio server', ta: 'ஸ்டுடியோ சர்வர்' },
  title: { en: 'Server & accounts', ta: 'சர்வர் & கணக்குகள்' },
  sub: { en: 'Who can sign in to admin, moving data onto the studio server, and backups.', ta: 'நிர்வாகத்தில் யார் உள்நுழையலாம், தரவை ஸ்டுடியோ சர்வருக்கு மாற்றுதல், காப்புப்பிரதிகள்.' },
  // Mock mode
  mockTitle: { en: "This browser's data", ta: 'இந்த உலாவியின் தரவு' },
  mockSub: { en: 'Right now everything is saved in this browser only.', ta: 'இப்போது அனைத்தும் இந்த உலாவியில் மட்டுமே சேமிக்கப்படுகிறது.' },
  mockBody: { en: 'Download a file of every order, lead, studio and gallery typed in here. When the studio server is running, open this page there and import the file so nothing is lost. Admin accounts are managed on the server.', ta: 'இங்கே உள்ளிட்ட அனைத்து ஆர்டர்கள், வாய்ப்புகள், ஸ்டுடியோக்கள், கேலரிகளின் கோப்பைப் பதிவிறக்குங்கள். ஸ்டுடியோ சர்வர் இயங்கும்போது அங்கே இந்தப் பக்கத்தைத் திறந்து கோப்பை இறக்குமதி செய்யுங்கள். நிர்வாகக் கணக்குகள் சர்வரில் நிர்வகிக்கப்படும்.' },
  download: { en: 'Download data file', ta: 'தரவுக் கோப்பைப் பதிவிறக்கு' },
  downloaded: { en: 'Data file downloaded', ta: 'தரவுக் கோப்பு பதிவிறக்கப்பட்டது' },
  // Accounts
  admins: { en: 'Admin accounts', ta: 'நிர்வாகக் கணக்குகள்' },
  adminsSub: { en: 'Name + password logins for staff.', ta: 'ஊழியர்களுக்கான பெயர் + கடவுச்சொல் உள்நுழைவுகள்.' },
  never: { en: 'Never signed in', ta: 'இதுவரை உள்நுழையவில்லை' },
  lastIn: { en: 'Last signed in {when}', ta: 'கடைசியாக உள்நுழைந்தது {when}' },
  disabled: { en: 'Disabled', ta: 'முடக்கப்பட்டது' },
  disable: { en: 'Disable', ta: 'முடக்கு' },
  disableTitle: { en: 'Disable {name}?', ta: '{name} ஐ முடக்கவா?' },
  disableBody: { en: 'They can no longer sign in to admin. Their past actions stay in the log.', ta: 'அவர்கள் இனி நிர்வாகத்தில் உள்நுழைய முடியாது. அவர்களின் முந்தைய செயல்கள் பதிவில் இருக்கும்.' },
  disabledToast: { en: 'Account disabled', ta: 'கணக்கு முடக்கப்பட்டது' },
  add: { en: 'Add an admin', ta: 'நிர்வாகியைச் சேர்' },
  name: { en: 'Name', ta: 'பெயர்' },
  password: { en: 'Password (8+ characters)', ta: 'கடவுச்சொல் (8+ எழுத்துகள்)' },
  create: { en: 'Create account', ta: 'கணக்கை உருவாக்கு' },
  created: { en: 'Admin account created', ta: 'நிர்வாகக் கணக்கு உருவாக்கப்பட்டது' },
  mine: { en: 'Change my password', ta: 'என் கடவுச்சொல்லை மாற்று' },
  newPw: { en: 'New password', ta: 'புதிய கடவுச்சொல்' },
  again: { en: 'Type it again', ta: 'மீண்டும் உள்ளிடுக' },
  save: { en: 'Save password', ta: 'கடவுச்சொல்லைச் சேமி' },
  saved: { en: 'Password changed', ta: 'கடவுச்சொல் மாற்றப்பட்டது' },
  mismatch: { en: 'The two passwords differ', ta: 'இரண்டு கடவுச்சொற்களும் வேறுபடுகின்றன' },
  short: { en: 'Use at least 8 characters', ta: 'குறைந்தது 8 எழுத்துகள் தேவை' },
  taken: { en: 'That name is already used', ta: 'அந்தப் பெயர் ஏற்கனவே உள்ளது' },
  // Import + backup
  importTitle: { en: 'Import a data file', ta: 'தரவுக் கோப்பை இறக்குமதி செய்' },
  importSub: { en: 'The file downloaded from this page before the server was set up.', ta: 'சர்வர் அமைக்கும் முன் இந்தப் பக்கத்திலிருந்து பதிவிறக்கிய கோப்பு.' },
  overwrite: { en: 'Replace records that already exist on the server', ta: 'சர்வரில் ஏற்கனவே உள்ள பதிவுகளை மாற்று' },
  choose: { en: 'Choose file…', ta: 'கோப்பைத் தேர்வுசெய்…' },
  imported: { en: 'Imported {n} records', ta: '{n} பதிவுகள் இறக்குமதி செய்யப்பட்டன' },
  nothing: { en: 'Nothing new in that file', ta: 'அந்தக் கோப்பில் புதியது எதுவும் இல்லை' },
  badFile: { en: 'That is not a data file from this site', ta: 'இது இந்தத் தளத்தின் தரவுக் கோப்பு அல்ல' },
  backup: { en: 'Backup', ta: 'காப்புப்பிரதி' },
  backupSub: { en: 'Runs every night at 2 am when BACKUP_DIR is set in server/.env.', ta: 'server/.env இல் BACKUP_DIR அமைத்தால் தினமும் இரவு 2 மணிக்கு இயங்கும்.' },
  backupNow: { en: 'Back up now', ta: 'இப்போது காப்புப்பிரதி எடு' },
  backedUp: { en: 'Backup written', ta: 'காப்புப்பிரதி எழுதப்பட்டது' },
  audit: { en: 'Recent activity', ta: 'சமீபத்திய செயல்பாடு' },
  auditEmpty: { en: 'No admin activity yet', ta: 'இன்னும் நிர்வாகச் செயல்பாடு இல்லை' },
}

interface Admin { id: string; name: string; disabled: number; createdAt: string; lastLoginAt: string | null }
interface Audit { actor: string; action: string; target: string | null; at: string }

const STORAGE_KEYS = { ttc: 'ttc-store-v2', studio: 'ttc-studio-v2', os: 'ttc-studio-os-v2' } as const

/** The `state` objects zustand persisted for each store, the shape POST /api/admin/import takes. */
function readBrowserData() {
  const out: Record<string, unknown> = {}
  for (const [k, key] of Object.entries(STORAGE_KEYS)) {
    try {
      const v = JSON.parse(localStorage.getItem(key) ?? 'null')?.state
      if (v && typeof v === 'object') out[k] = v
    } catch {
      // Unreadable entry: skip it.
    }
  }
  return out
}

const errText = (e: unknown) => (e instanceof ApiError ? e.message : String(e))

export default function Server() {
  const t = useT(copy)
  useTitle({ en: 'Server & accounts', ta: 'சர்வர் & கணக்குகள்' })
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.sub} />
      {isLan() ? <LanPanels /> : <MockPanel />}
    </div>
  )
}

function MockPanel() {
  const t = useT(copy)
  const download = () => {
    const blob = new Blob([JSON.stringify(readBrowserData())], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ttc-browser-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast(t.downloaded)
  }
  return (
    <Panel title={t.mockTitle} subtitle={t.mockSub} icon="settings">
      <p className="max-w-2xl text-[14px] leading-relaxed text-ink/60">{t.mockBody}</p>
      <Button className="mt-5" variant="ink" icon="arrowRight" onClick={download}>{t.download}</Button>
    </Panel>
  )
}

function LanPanels() {
  const t = useT(copy)
  const lang = useLang()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [toDisable, setToDisable] = useState<Admin | null>(null)
  const load = () => {
    api<Admin[]>('/api/admin/admins').then(setAdmins, e => toast(errText(e)))
    api<Audit[]>('/api/admin/audit').then(a => setAudit(a.slice(0, 30)), () => {})
  }
  useEffect(load, [])

  const disable = (a: Admin) =>
    api(`/api/admin/admins/${a.id}/disable`, { method: 'POST' }).then(() => {
      toast(t.disabledToast)
      load()
    }, e => toast(errText(e)))

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel title={t.admins} subtitle={t.adminsSub} icon="users" className="md:col-span-2" bodyClass="divide-y hairline">
        {admins.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5 md:px-6">
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-medium text-ink">{a.name}</p>
              <p className="text-[12.5px] text-ink/50">{a.lastLoginAt ? t.lastIn.replace('{when}', relTime(a.lastLoginAt, lang)) : t.never}</p>
            </div>
            {a.disabled ? (
              <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[11.5px] font-semibold text-ink/55">{t.disabled}</span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setToDisable(a)}>{t.disable}</Button>
            )}
          </div>
        ))}
      </Panel>
      <AddAdmin onDone={load} />
      <ChangePassword />
      <ImportFile onDone={load} />
      <Backup onDone={load} />
      <Panel title={t.audit} icon="clock" className="md:col-span-2" bodyClass="p-0">
        {audit.length ? (
          <ul className="divide-y hairline">
            {audit.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-[13px] md:px-6">
                <span className="min-w-0 truncate text-ink/75">
                  <span className="font-medium text-ink">{r.actor}</span> · {r.action}{r.target ? ` · ${r.target}` : ''}
                </span>
                <span className="shrink-0 text-ink/45">{relTime(r.at, lang)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="clock" title={t.auditEmpty} />
        )}
      </Panel>
      <ConfirmModal
        open={!!toDisable}
        onClose={() => setToDisable(null)}
        onConfirm={() => toDisable && disable(toDisable)}
        title={t.disableTitle.replace('{name}', toDisable?.name ?? '')}
        body={t.disableBody}
        confirmLabel={t.disable}
        icon="lock"
      />
    </div>
  )
}

function AddAdmin({ onDone }: { onDone: () => void }) {
  const t = useT(copy)
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (pw.length < 8) return toast(t.short)
    setBusy(true)
    try {
      await api('/api/admin/admins', { body: { name: name.trim(), password: pw } })
      toast(t.created)
      setName('')
      setPw('')
      onDone()
    } catch (e) {
      toast(e instanceof ApiError && e.code === 'name_taken' ? t.taken : errText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel title={t.add} icon="plus">
      <div className="space-y-3">
        <TextInput label={t.name} value={name} onChange={setName} />
        <TextInput label={t.password} value={pw} onChange={setPw} type="password" />
        <Button variant="ink" disabled={busy || name.trim().length < 2 || !pw} onClick={submit}>{t.create}</Button>
      </div>
    </Panel>
  )
}

function ChangePassword() {
  const t = useT(copy)
  const [pw, setPw] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (pw.length < 8) return toast(t.short)
    if (pw !== again) return toast(t.mismatch)
    setBusy(true)
    try {
      await api('/api/admin/password', { body: { password: pw } })
      toast(t.saved)
      setPw('')
      setAgain('')
    } catch (e) {
      toast(errText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel title={t.mine} icon="lock">
      <div className="space-y-3">
        <TextInput label={t.newPw} value={pw} onChange={setPw} type="password" />
        <TextInput label={t.again} value={again} onChange={setAgain} type="password" />
        <Button variant="ink" disabled={busy || !pw || !again} onClick={submit}>{t.save}</Button>
      </div>
    </Panel>
  )
}

function ImportFile({ onDone }: { onDone: () => void }) {
  const t = useT(copy)
  const input = useRef<HTMLInputElement>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const run = async (file: File) => {
    setBusy(true)
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !('ttc' in data || 'studio' in data || 'os' in data)) throw new Error(t.badFile)
      const { imported } = await api<{ imported: Record<string, number> }>('/api/admin/import', { body: { ttc: data.ttc, studio: data.studio, os: data.os, overwrite } })
      const n = Object.values(imported).reduce((a, b) => a + b, 0)
      toast(n ? t.imported.replace('{n}', String(n)) : t.nothing)
      onDone()
    } catch (e) {
      toast(e instanceof SyntaxError ? t.badFile : e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <Panel title={t.importTitle} subtitle={t.importSub} icon="inbox">
      <div className="flex items-center gap-3">
        <Switch checked={overwrite} onChange={setOverwrite} label={t.overwrite} size="sm" />
        <span className="text-[13.5px] text-ink/65">{t.overwrite}</span>
      </div>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={e => e.target.files?.[0] && run(e.target.files[0])} />
      <Button className="mt-4" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{t.choose}</Button>
    </Panel>
  )
}

function Backup({ onDone }: { onDone: () => void }) {
  const t = useT(copy)
  const [busy, setBusy] = useState(false)
  const run = () => {
    setBusy(true)
    api<{ file: string }>('/api/admin/backup', { method: 'POST' })
      .then(r => {
        toast(`${t.backedUp}: ${r.file}`)
        onDone()
      }, e => toast(errText(e)))
      .finally(() => setBusy(false))
  }
  return (
    <Panel title={t.backup} subtitle={t.backupSub} icon="refresh">
      <Button variant="outline" disabled={busy} onClick={run}>{t.backupNow}</Button>
    </Panel>
  )
}
