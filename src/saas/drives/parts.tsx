import { useT } from '../../lib/i18n'
import { formatBytes } from '../usage'
import type { Drive } from '../types'
import { DRV } from './copy'
import { isStale, nf } from './data'

export function StatusTag({ drive }: { drive: Drive }) {
  const t = useT(DRV)
  const label = drive.status === 'ok' ? t.status_ok : drive.status === 'missing' ? t.status_missing : t.status_retired
  const tone = drive.status === 'ok' ? 'bg-ink/[0.06] text-ink' : drive.status === 'missing' ? 'bg-ruby-soft text-ruby-deep' : 'border border-ink/15 text-ink/50'
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-semibold ${tone}`}>{label}</span>
}

export function StaleTag({ drive }: { drive: Drive }) {
  const t = useT(DRV)
  if (!isStale(drive)) return null
  return <span className="inline-flex h-6 items-center rounded-full bg-ruby-soft px-2.5 text-[11.5px] font-semibold text-ruby-deep">{t.stale}</span>
}

/** Used vs capacity. Capacity is typed in by the photographer; browsers cannot read it. */
export function CapacityBar({ drive }: { drive: Drive }) {
  const t = useT(DRV)
  if (!drive.capacityBytes) return <p className="text-[12.5px] tabular-nums text-ink/50">{formatBytes(drive.usedBytes)} {t.used}</p>
  const v = Math.min(1, drive.usedBytes / drive.capacityBytes)
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]">
        <div className={`h-full rounded-full ${v > 0.9 ? 'bg-ruby' : 'bg-ink'}`} style={{ width: `${v * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[12.5px] tabular-nums text-ink/50">
        {formatBytes(drive.usedBytes)} {t.of} {formatBytes(drive.capacityBytes)} · {Math.round(v * 100)}%
      </p>
    </div>
  )
}

export function Counts({ drive }: { drive: Pick<Drive, 'fileCount' | 'photoCount' | 'rawCount' | 'videoCount'> }) {
  const t = useT(DRV)
  const items: [number, string][] = [
    [drive.fileCount, t.files],
    [drive.rawCount, t.raws],
    [drive.photoCount, t.photos],
    [drive.videoCount, t.videos],
  ]
  return (
    <dl className="grid grid-cols-4 gap-2">
      {items.map(([v, l]) => (
        <div key={l} className="min-w-0">
          <dd className="truncate text-[15px] font-semibold tabular-nums text-ink">{nf(v)}</dd>
          <dt className="truncate text-[11.5px] text-ink/45">{l}</dt>
        </div>
      ))}
    </dl>
  )
}
