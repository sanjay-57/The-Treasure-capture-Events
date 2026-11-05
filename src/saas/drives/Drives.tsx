import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Button, EmptyState } from '../../components/ui'
import { PageHeader, relTime } from '../../pages/admin/kit'
import { useLang, useT } from '../../lib/i18n'
import { useTitle } from '../../lib/ui'
import { supportsFsa } from '../scan'
import { useCurrentStudio, useStudioStore } from '../store'
import { DRV } from './copy'
import { CapacityBar, Counts, StaleTag, StatusTag } from './parts'
import { ScanFlow } from './ScanFlow'
import { drivesOf } from '../scope'

const ORDER = { ok: 0, missing: 1, retired: 2 } as const

/** /studio/drives: every drive the studio owns. */
export default function Drives() {
  const t = useT(DRV)
  const lang = useLang()
  useTitle({ en: 'Drives', ta: 'டிரைவ்கள்' })
  const studio = useCurrentStudio()
  const all = useStudioStore(s => s.drives)
  const drives = drivesOf(all, studio?.id).sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.label.localeCompare(b.label, undefined, { numeric: true }))
  const [adding, setAdding] = useState(false)
  const [fsa, setFsa] = useState<boolean | null>(null)
  useEffect(() => setFsa(supportsFsa()), [])
  if (!studio) return null

  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <Button variant="outline" iconLeft="search" to="/studio/drives/search">{t.search}</Button>
            <Button variant="ink" iconLeft="plus" onClick={() => setAdding(true)}>{t.add}</Button>
          </>
        }
      />

      {fsa !== null && (
        <p className="mb-6 flex items-start gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[13px] leading-relaxed text-ink/60">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-ink/40" />
          {fsa ? t.fsaYes : t.fsaNo}
        </p>
      )}

      {drives.length === 0 ? (
        <EmptyState icon="inbox" title={t.emptyTitle} body={t.emptyBody} action={<Button variant="ink" iconLeft="plus" onClick={() => setAdding(true)}>{t.add}</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drives.map(d => (
            <Link
              key={d.id}
              to={`/studio/drives/${d.id}`}
              className={`group flex flex-col gap-4 rounded-[26px] border hairline bg-white p-5 shadow-[0_1px_2px_rgba(10,10,11,0.04),0_10px_30px_-18px_rgba(10,10,11,0.18)] transition hover:border-ink/25 ${d.status === 'retired' ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-semibold tracking-tight text-ink">{d.label}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink/50">
                    <Icon name="mapPin" size={13} className="shrink-0" />
                    {d.kept || '—'}
                  </p>
                </div>
                <Icon name="arrowRight" size={16} className="mt-1 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </div>
              <CapacityBar drive={d} />
              <Counts drive={d} />
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t hairline pt-3">
                <StatusTag drive={d} />
                <StaleTag drive={d} />
                <span className="ml-auto text-[12px] text-ink/45">
                  {t.lastScan}: {d.lastScanAt ? relTime(d.lastScanAt, lang) : t.never}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ScanFlow open={adding} onClose={() => setAdding(false)} studioId={studio.id} />
    </div>
  )
}
