import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { BackLink, Button, EmptyState } from '../../components/ui'
import { FormSelect, PageHeader, Panel, SearchInput, TextInput } from '../../pages/admin/kit'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { assetsCsv, dateOf, searchAssets, type AssetQuery } from '../scan'
import { useCurrentStudio, useStudioStore } from '../store'
import type { AssetKind } from '../types'
import { formatBytes } from '../usage'
import { DRV } from './copy'
import { downloadText, useDriveAssets } from './data'
import { drivesOf } from '../scope'

type KindQ = AssetKind | 'all'

/** /studio/drives/search: find a file across every drive. */
export default function Search() {
  const t = useT(DRV)
  const lang = useLang()
  useTitle({ en: 'Find a file', ta: 'கோப்பைத் தேடு' })
  const studio = useCurrentStudio()
  const all = useStudioStore(s => s.drives)
  const drives = useMemo(() => drivesOf(all, studio?.id), [all, studio?.id])
  const assets = useDriveAssets(useMemo(() => drives.map(d => d.id), [drives]))
  const [q, setQ] = useState<AssetQuery & { kind: KindQ }>({ text: '', folder: '', camera: '', from: '', to: '', kind: 'all' })
  const dq = useDeferredValue(q)
  const active = !!(dq.text?.trim() || dq.folder?.trim() || dq.camera?.trim() || dq.from || dq.to || dq.kind !== 'all')
  const result = useMemo(() => (assets && active ? searchAssets(assets, dq) : null), [assets, dq, active])
  const byId = useMemo(() => new Map(drives.map(d => [d.id, d])), [drives])
  if (!studio) return null

  const exportCsv = () => {
    if (!assets) return
    const rows = searchAssets(assets, dq, Infinity).rows
    downloadText(`drive-search-${new Date().toISOString().slice(0, 10)}.csv`, assetsCsv(rows, id => byId.get(id)))
  }

  return (
    <div>
      <div className="mb-5">
        <BackLink to="/studio/drives">{t.back}</BackLink>
      </div>
      <PageHeader eyebrow={t.eyebrow} title={t.searchTitle} subtitle={t.searchSub} actions={result && result.total > 0 ? <Button variant="outline" iconLeft="receipt" onClick={exportCsv}>{t.exportCsv}</Button> : undefined} />

      <Panel className="mb-5" bodyClass="space-y-3 p-4 md:p-5">
        <SearchInput value={q.text ?? ''} onChange={v => setQ({ ...q, text: v })} placeholder={t.searchPh} autoFocus />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <TextInput className="col-span-2 md:col-span-1" label={t.folder} value={q.folder ?? ''} onChange={v => setQ({ ...q, folder: v })} placeholder={t.folderPh} />
          <TextInput className="col-span-2 md:col-span-1" label={t.cameraPh} value={q.camera ?? ''} onChange={v => setQ({ ...q, camera: v })} placeholder="EOS R5" />
          <TextInput label={t.fromDate} type="date" value={q.from ?? ''} onChange={v => setQ({ ...q, from: v })} />
          <TextInput label={t.toDate} type="date" value={q.to ?? ''} onChange={v => setQ({ ...q, to: v })} />
          <FormSelect<KindQ>
            className="col-span-2 md:col-span-1"
            label={t.kind}
            value={q.kind}
            onChange={v => setQ({ ...q, kind: v })}
            options={(['all', 'raw', 'photo', 'video', 'other'] as const).map(k => ({ value: k, label: t[`kind_${k}`] }))}
          />
        </div>
      </Panel>

      {drives.length === 0 ? (
        <EmptyState icon="inbox" title={t.noDrivesSearch} action={<Button variant="ink" to="/studio/drives">{t.add}</Button>} />
      ) : assets === null ? (
        <p className="py-10 text-center text-[14px] text-ink/45">{t.loading}</p>
      ) : !result ? null : result.total === 0 ? (
        <EmptyState icon="search" title={t.noResults} />
      ) : (
        <>
          <p className="mb-3 text-[13px] tabular-nums text-ink/55">{t.results(result.rows.length, result.total)}</p>
          <Panel bodyClass="divide-y hairline">
            {result.rows.map(a => {
              const d = byId.get(a.driveId)
              return (
                <div key={a.id} className="px-4 py-3 md:px-5">
                  <p className="flex items-baseline gap-2">
                    <span className="truncate text-[14px] font-medium text-ink">
                      {a.filename}
                      {a.ext && `.${a.ext}`}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-ink/40">
                      {formatBytes(a.bytes)} · {formatDate(dateOf(a), lang)}
                      {a.camera && ` · ${a.camera}`}
                    </span>
                  </p>
                  <p className="mt-0.5 break-all text-[12.5px] text-ink/55">
                    <Link to={`/studio/drives/${a.driveId}`} className="font-medium text-ink hover:text-ruby">
                      {d?.label ?? '—'}
                    </Link>
                    {' · '}/{a.path}
                    {d?.kept && (
                      <span className="whitespace-nowrap text-ink/45">
                        {' · '}
                        <Icon name="mapPin" size={11} className="inline -mt-0.5" /> {d.kept}
                      </span>
                    )}
                  </p>
                </div>
              )
            })}
          </Panel>
        </>
      )}
    </div>
  )
}
