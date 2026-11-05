import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { BackLink, Button, EmptyState, Modal } from '../../components/ui'
import { ConfirmModal, FormSelect, PageHeader, Panel, Tabs, TextInput, relTime } from '../../pages/admin/kit'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { toast, useTitle } from '../../lib/ui'
import { deleteDriveAssets, dirOf, duplicatesByFingerprint, eventsFromAssets, folderTree, needsMeta, readScanNote, type StoredAsset, type TreeNode } from '../scan'
import { useCurrentStudio, useStudioStore } from '../store'
import type { Drive, DriveStatus } from '../types'
import { formatBytes } from '../usage'
import { DRV } from './copy'
import { capacityText, invalidateAssets, nf, parseCapacity, useDriveAssets } from './data'
import { CapacityBar, Counts, StaleTag, StatusTag } from './parts'
import { ScanFlow } from './ScanFlow'

type Tab = 'folders' | 'events' | 'dupes' | 'history'

/** /studio/drives/:id */
export default function DriveDetail() {
  const t = useT(DRV)
  const lang = useLang()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const studio = useCurrentStudio()
  const allDrives = useStudioStore(s => s.drives)
  const allScans = useStudioStore(s => s.scans)
  const drive = allDrives.find(d => d.id === id && d.studioId === studio?.id)
  useTitle({ en: drive?.label ?? 'Drive', ta: drive?.label ?? 'டிரைவ்' })
  const studioDriveIds = useMemo(() => allDrives.filter(d => d.studioId === studio?.id).map(d => d.id), [allDrives, studio?.id])
  const assets = useDriveAssets(drive ? [drive.id] : [])
  const [tab, setTab] = useState<Tab>('folders')
  const [scan, setScan] = useState<null | 'scan' | 'verify'>(null)
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState<null | 'retire' | 'delete'>(null)
  const [note, setNote] = useState<ReturnType<typeof readScanNote>>(null)
  useEffect(() => setNote(drive ? readScanNote(drive.id) : null), [drive?.id, drive?.lastScanAt, scan])

  if (!studio) return null
  if (!drive)
    return (
      <div>
        <BackLink to="/studio/drives">{t.back}</BackLink>
        <div className="mt-6">
          <EmptyState icon="inbox" title={t.notFound} />
        </div>
      </div>
    )

  const scans = allScans.filter(s => s.driveId === drive.id).sort((a, b) => (a.at < b.at ? 1 : -1))
  const pending = assets ? assets.filter(a => needsMeta(a)).length : 0
  const { updateDrive, removeDrive } = useStudioStore.getState()

  return (
    <div>
      <div className="mb-5">
        <BackLink to="/studio/drives">{t.back}</BackLink>
      </div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={drive.label}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Icon name="mapPin" size={14} />
            {drive.kept || '—'}
          </span>
        }
        actions={
          <>
            <Button variant="ink" iconLeft="refresh" onClick={() => setScan('scan')}>{t.rescan}</Button>
            <Button variant="outline" iconLeft="eye" onClick={() => setScan('verify')}>{t.verify}</Button>
            <Button variant="outline" iconLeft="edit" onClick={() => setEditing(true)}>{t.edit}</Button>
            {drive.status === 'retired' ? (
              <Button variant="ghost" onClick={() => updateDrive(drive.id, { status: 'ok' })}>{t.unretire}</Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirm('retire')}>{t.retire}</Button>
            )}
            <Button variant="ghost" iconLeft="trash" onClick={() => setConfirm('delete')}>{t.del}</Button>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusTag drive={drive} />
          <StaleTag drive={drive} />
          <span className="text-[12.5px] text-ink/45">
            {t.lastScan}: {drive.lastScanAt ? relTime(drive.lastScanAt, lang) : t.never}
          </span>
        </div>
      </PageHeader>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Panel bodyClass="p-5">
          <CapacityBar drive={drive} />
        </Panel>
        <Panel bodyClass="p-5">
          <Counts drive={drive} />
        </Panel>
      </div>

      {(note || pending > 0) && (
        <p className="mb-6 flex items-start gap-2.5 rounded-2xl bg-ruby-soft px-4 py-3 text-[13px] leading-relaxed text-ruby-deep">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
          {note?.phase === 'walk' ? t.interrupted : t.pendingMeta(pending)}
        </p>
      )}
      {drive.notes && <p className="mb-6 whitespace-pre-line text-[14px] text-ink/60">{drive.notes}</p>}

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'folders', label: t.tabFolders },
          { value: 'events', label: t.tabEvents },
          { value: 'dupes', label: t.tabDupes },
          { value: 'history', label: t.tabHistory, count: scans.length },
        ]}
      />

      {tab === 'history' ? (
        <History scans={scans} />
      ) : assets === null ? (
        <p className="py-10 text-center text-[14px] text-ink/45">{t.loading}</p>
      ) : assets.length === 0 ? (
        <EmptyState icon="inbox" title={t.noFiles} />
      ) : tab === 'folders' ? (
        <Folders assets={assets} />
      ) : tab === 'events' ? (
        <Events assets={assets} />
      ) : (
        <Dupes drive={drive} assets={assets} studioDriveIds={studioDriveIds} />
      )}

      <ScanFlow open={scan !== null} verify={scan === 'verify'} onClose={() => setScan(null)} studioId={studio.id} driveId={drive.id} />
      <EditDrive open={editing} onClose={() => setEditing(false)} drive={drive} />
      <ConfirmModal open={confirm === 'retire'} onClose={() => setConfirm(null)} onConfirm={() => updateDrive(drive.id, { status: 'retired' })} title={t.retireTitle} body={t.retireBody} confirmLabel={t.retire} tone="ink" />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await deleteDriveAssets(drive.id).catch(() => {})
          invalidateAssets(drive.id)
          removeDrive(drive.id)
          toast(t.deleted)
          navigate('/studio/drives')
        }}
        title={t.delTitle}
        body={t.delBody}
        confirmLabel={t.del}
        icon="trash"
      />
    </div>
  )
}

// ─── Folders ─────────────────────────────────────────────────────────────────

const CAP = 100

function Folders({ assets }: { assets: StoredAsset[] }) {
  const tree = useMemo(() => folderTree(assets), [assets])
  const rootFiles = tree.files - tree.children.reduce((n, c) => n + c.files, 0)
  return (
    <Panel bodyClass="p-2 md:p-3">
      <ul>
        {rootFiles > 0 && <Row name="/" files={rootFiles} bytes={tree.bytes - tree.children.reduce((n, c) => n + c.bytes, 0)} depth={0} />}
        <Children nodes={tree.children} depth={0} />
      </ul>
    </Panel>
  )
}

function Children({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  const t = useT(DRV)
  const [limit, setLimit] = useState(CAP)
  return (
    <>
      {nodes.slice(0, limit).map(n => (
        <Node key={n.path} node={n} depth={depth} />
      ))}
      {nodes.length > limit && (
        <li>
          <button type="button" onClick={() => setLimit(l => l + CAP * 5)} className="ml-3 cursor-pointer py-2 text-[13px] font-medium text-ruby" style={{ paddingLeft: depth * 18 }}>
            {t.showMore(nodes.length - limit)}
          </button>
        </li>
      )}
    </>
  )
}

function Node({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(false)
  const has = node.children.length > 0
  return (
    <li>
      <Row name={node.name} files={node.files} bytes={node.bytes} depth={depth} open={has ? open : undefined} onToggle={has ? () => setOpen(o => !o) : undefined} />
      {open && has && (
        <ul>
          <Children nodes={node.children} depth={depth + 1} />
        </ul>
      )}
    </li>
  )
}

function Row({ name, files, bytes, depth, open, onToggle }: { name: string; files: number; bytes: number; depth: number; open?: boolean; onToggle?: () => void }) {
  const t = useT(DRV)
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!onToggle}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition enabled:cursor-pointer enabled:hover:bg-ink/[0.035] disabled:cursor-default"
      style={{ paddingLeft: 12 + depth * 18 }}
    >
      <Icon name={onToggle ? (open ? 'chevronDown' : 'chevronRight') : 'minus'} size={14} className="shrink-0 text-ink/35" />
      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{name}</span>
      <span className="shrink-0 text-[12px] tabular-nums text-ink/45">
        {nf(files)} {t.files} · {formatBytes(bytes)}
      </span>
    </button>
  )
}

// ─── Events ──────────────────────────────────────────────────────────────────

function Events({ assets }: { assets: StoredAsset[] }) {
  const t = useT(DRV)
  const lang = useLang()
  const events = useMemo(() => eventsFromAssets(assets), [assets])
  if (!events.length) return <EmptyState icon="calendar" title={t.noEvents} />
  const range = (a: string, b: string) => {
    const x = formatDate(a, lang)
    const y = formatDate(b, lang)
    return x === y ? x : `${x} – ${y}`
  }
  return (
    <Panel bodyClass="divide-y hairline">
      {events.slice(0, 500).map(e => (
        <div key={e.folder} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-ink">{e.folder}</p>
            <p className="text-[12.5px] text-ink/45">{range(e.from, e.to)}</p>
          </div>
          <p className="shrink-0 text-[12.5px] tabular-nums text-ink/55">
            {[e.raws && `${nf(e.raws)} ${t.raws}`, e.photos && `${nf(e.photos)} ${t.photos}`, e.videos && `${nf(e.videos)} ${t.videos}`].filter(Boolean).join(' · ')} · {formatBytes(e.bytes)}
          </p>
        </div>
      ))}
    </Panel>
  )
}

// ─── Duplicates ──────────────────────────────────────────────────────────────

function Dupes({ drive, assets, studioDriveIds }: { drive: Drive; assets: StoredAsset[]; studioDriveIds: string[] }) {
  const t = useT(DRV)
  const drives = useStudioStore(s => s.drives)
  const all = useDriveAssets(studioDriveIds)
  const view = useMemo(() => {
    if (!all) return null
    const groups = duplicatesByFingerprint(all).filter(g => g.some(a => a.driveId === drive.id))
    const elsewhere = new Set(all.filter(a => a.driveId !== drive.id && a.fingerprint).map(a => a.fingerprint))
    const mine = assets.filter(a => a.fingerprint)
    return { groups, onlyHere: mine.filter(a => !elsewhere.has(a.fingerprint)).length, unprinted: assets.filter(a => a.kind !== 'other' && !a.fingerprint).length }
  }, [all, assets, drive.id])
  if (!view) return <p className="py-10 text-center text-[14px] text-ink/45">{t.loading}</p>
  const label = (id: string) => drives.find(d => d.id === id)?.label ?? id
  return (
    <div className="space-y-4">
      <div className="space-y-1 text-[13px] text-ink/55">
        {view.unprinted > 0 && <p>{t.needFp(view.unprinted)}</p>}
        <p>{t.onlyCopy(view.onlyHere)}</p>
        {view.groups.length > 0 && <p>{t.dupeGroups(view.groups.length)}</p>}
      </div>
      {view.groups.length === 0 ? (
        <EmptyState icon="copy" title={t.noDupes} />
      ) : (
        <Panel bodyClass="divide-y hairline">
          {view.groups.slice(0, 50).map(g => (
            <div key={g[0].fingerprint} className="px-5 py-3.5">
              <p className="text-[14px] font-medium text-ink">
                {g[0].filename}.{g[0].ext} <span className="font-normal text-ink/45">· {formatBytes(g[0].bytes)} × {g.length}</span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {g.slice(0, 6).map(a => (
                  <li key={a.id} className="truncate text-[12.5px] text-ink/55">
                    <span className={a.driveId === drive.id ? 'font-medium text-ink' : ''}>{label(a.driveId)}</span> · {dirOf(a.path) || '/'}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Panel>
      )}
    </div>
  )
}

// ─── History ─────────────────────────────────────────────────────────────────

function History({ scans }: { scans: { id: string; at: string; added: number; removed: number; changed: number; durationSec: number }[] }) {
  const t = useT(DRV)
  const lang = useLang()
  if (!scans.length) return <EmptyState icon="clock" title={t.noScans} />
  return (
    <Panel bodyClass="divide-y hairline">
      {scans.map(s => (
        <div key={s.id} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] font-medium text-ink">
            {formatDate(s.at, lang)} <span className="font-normal text-ink/45">· {relTime(s.at, lang)}</span>
          </p>
          <p className="text-[12.5px] tabular-nums text-ink/55">
            +{nf(s.added)} {t.added} · −{nf(s.removed)} {t.removed} · {nf(s.changed)} {t.changed} · {s.durationSec}s
          </p>
        </div>
      ))}
    </Panel>
  )
}

// ─── Edit ────────────────────────────────────────────────────────────────────

function EditDrive({ open, onClose, drive }: { open: boolean; onClose: () => void; drive: Drive }) {
  const t = useT(DRV)
  const [f, setF] = useState({ label: '', kept: '', notes: '', capacity: '', status: 'ok' as DriveStatus })
  useEffect(() => {
    if (open) setF({ label: drive.label, kept: drive.kept, notes: drive.notes, capacity: capacityText(drive.capacityBytes), status: drive.status })
  }, [open, drive])
  const cap = parseCapacity(f.capacity)
  const save = () => {
    useStudioStore.getState().updateDrive(drive.id, { label: f.label.trim(), kept: f.kept.trim(), notes: f.notes.trim(), capacityBytes: cap ?? undefined, status: f.status })
    toast(t.saved)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} label={t.editTitle}>
      <div className="space-y-3 p-6 pt-7 md:p-8">
        <h2 className="pr-10 text-[20px] font-semibold tracking-tight text-ink">{t.editTitle}</h2>
        <TextInput label={t.label} value={f.label} onChange={v => setF({ ...f, label: v })} required />
        <TextInput label={t.kept} value={f.kept} onChange={v => setF({ ...f, kept: v })} placeholder={t.keptPh} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <TextInput label={t.capacity} value={f.capacity} onChange={v => setF({ ...f, capacity: v })} placeholder={t.capacityPh} />
            {cap === null && <p className="mt-1 text-[12px] text-ruby">{t.capacityBad}</p>}
          </div>
          <FormSelect<DriveStatus>
            label={t.status}
            value={f.status}
            onChange={v => setF({ ...f, status: v })}
            options={[
              { value: 'ok', label: t.status_ok },
              { value: 'missing', label: t.status_missing },
              { value: 'retired', label: t.status_retired },
            ]}
          />
        </div>
        <TextInput label={t.notes} value={f.notes} onChange={v => setF({ ...f, notes: v })} rows={3} />
        <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button variant="ink" onClick={save} disabled={!f.label.trim() || cap === null}>{t.save}</Button>
        </div>
      </div>
    </Modal>
  )
}
