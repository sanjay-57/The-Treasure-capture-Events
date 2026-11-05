import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { CopyButton, Panel } from '../../pages/admin/kit'
import { useT } from '../../lib/i18n'
import { matchSelection } from '../scan'
import { useStudioStore } from '../store'
import { DRV } from './copy'
import { CopyChosen } from './CopyChosen'
import { copyPlan } from './copyOut'
import { nf, useDriveAssets } from './data'

/**
 * "Where are the originals?" for a submitted selection: matches the chosen
 * proof filenames (no extension) to files on the studio's scanned drives,
 * preferring RAW, and lists what it cannot find.
 */
export function SelectionLocator({ studioId, filenames, folderName = 'Chosen originals' }: { studioId: string; filenames: string[]; folderName?: string }) {
  const t = useT(DRV)
  const all = useStudioStore(s => s.drives)
  const drives = useMemo(() => all.filter(d => d.studioId === studioId), [all, studioId])
  const assets = useDriveAssets(useMemo(() => drives.map(d => d.id), [drives]))
  const retired = useMemo(() => new Set(drives.filter(d => d.status === 'retired').map(d => d.id)), [drives])
  const m = useMemo(() => (assets ? matchSelection(filenames, assets, retired) : null), [assets, filenames, retired])
  const plan = useMemo(() => (m && assets ? copyPlan(m, assets) : []), [m, assets])
  const [showAll, setShowAll] = useState(false)
  const label = (id: string) => drives.find(d => d.id === id)?.label ?? id
  const kept = (id: string) => drives.find(d => d.id === id)?.kept
  const wanted = m ? m.best.size + m.missing.length : 0
  const dirName = (dir: string) => (dir ? `/${dir}` : t.root)

  let body
  if (!filenames.length) body = <p className="text-[14px] text-ink/50">{t.locEmpty}</p>
  else if (!drives.length || (assets && assets.length === 0))
    body = (
      <p className="text-[14px] text-ink/55">
        {t.locNoDrives}{' '}
        <Link to="/studio/drives" className="font-medium text-ruby">{t.title} →</Link>
      </p>
    )
  else if (!m) body = <p className="text-[14px] text-ink/45">{t.loading}</p>
  else {
    const one = m.locations.length === 1 && m.missing.length === 0
    const locs = showAll ? m.locations : m.locations.slice(0, 8)
    body = (
      <div className="space-y-4">
        <p className="text-[15px] font-semibold leading-snug text-ink">
          {m.best.size === 0 ? t.locNone : one ? t.locAll(m.best.size, label(m.locations[0].driveId), dirName(m.locations[0].dir)) : t.locSome(m.best.size, wanted)}
        </p>
        {!one && m.locations.length > 0 && (
          <ul className="divide-y hairline rounded-2xl border hairline">
            {locs.map(l => (
              <li key={`${l.driveId}/${l.dir}`} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{label(l.driveId)}</p>
                  <p className="truncate text-[12px] text-ink/50">{dirName(l.dir)}</p>
                </div>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">{nf(l.count)}</span>
              </li>
            ))}
            {m.locations.length > locs.length && (
              <li>
                <button type="button" onClick={() => setShowAll(true)} className="w-full cursor-pointer px-4 py-2.5 text-left text-[13px] font-medium text-ruby">
                  {t.showMore(m.locations.length - locs.length)}
                </button>
              </li>
            )}
          </ul>
        )}
        {m.locations.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink/50">
            {[...new Set(m.locations.map(l => l.driveId))].map(id => (
              <span key={id} className="inline-flex items-center gap-1">
                <Icon name="mapPin" size={12} />
                {label(id)}: {kept(id) || '—'}
              </span>
            ))}
          </p>
        )}
        {m.alsoOn.length > 0 && (
          <ul className="space-y-0.5 text-[12.5px] text-ink/50">
            {m.alsoOn.map(b => (
              <li key={b.driveId}>{t.alsoOn(label(b.driveId), b.count)}</li>
            ))}
          </ul>
        )}
        {m.missing.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-ruby">
              {t.missing(m.missing.length)}
              <CopyButton text={m.missing.join('\n')} label={t.copyMissing} />
            </p>
            <p className="max-h-32 overflow-y-auto break-words text-[12.5px] leading-relaxed text-ink/60" data-lenis-prevent>
              {m.missing.join(', ')}
            </p>
          </div>
        )}
        {plan.length > 0 && <CopyChosen groups={plan} drives={drives} folderName={folderName} />}
      </div>
    )
  }

  return (
    <Panel title={t.locTitle} icon="inbox">
      {body}
    </Panel>
  )
}

export default SelectionLocator
