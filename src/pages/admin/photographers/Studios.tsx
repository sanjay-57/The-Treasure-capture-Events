import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Icon } from '../../../components/Icon'
import { Button, EmptyState } from '../../../components/ui'
import { formatINR, useLang, useT } from '../../../lib/i18n'
import { useTitle } from '../../../lib/ui'
import { PRODUCT } from '../../../saas/brand'
import { StudioMark } from '../../../saas/theme'
import { formatBytes } from '../../../saas/usage'
import { AC, MiniSelect, PageHeader, Panel, Progress, SearchInput, relTime } from '../kit'
import { filterRows, sortRows, studioRow, type StatusFilter, type StudioRow, type StudioSort } from './helpers'
import { PH, STUDIO_STATUS, StudioStatusPill, useWingData } from './shared'

const copy = {
  title: { en: 'Studios', ta: 'ஸ்டுடியோக்கள்' },
  sub: { en: `Photographers using ${PRODUCT.name}: their plan, payment status, days left and what they owe.`, ta: `${PRODUCT.name} பயன்படுத்தும் புகைப்படக் கலைஞர்கள்: திட்டம், கட்டண நிலை, மீதி நாட்கள், நிலுவை.` },
  search: { en: 'Search studio, owner, city, phone…', ta: 'ஸ்டுடியோ, உரிமையாளர், ஊர், தொலைபேசி தேடு…' },
  status: { en: 'Status', ta: 'நிலை' },
  allStatus: { en: 'All statuses', ta: 'அனைத்து நிலைகளும்' },
  sort: { en: 'Sort', ta: 'வரிசை' },
  sName: { en: 'Name A–Z', ta: 'பெயர்' },
  sDue: { en: 'Most due', ta: 'அதிக நிலுவை' },
  sUsage: { en: 'Highest usage', ta: 'அதிகப் பயன்பாடு' },
  sActivity: { en: 'Recent activity', ta: 'சமீபச் செயல்பாடு' },
  sStorage: { en: 'Most storage', ta: 'அதிகச் சேமிப்பு' },
  sNewest: { en: 'Newest sign-up', ta: 'புதிய பதிவு' },
  studio: { en: 'Studio', ta: 'ஸ்டுடியோ' },
  plan: { en: 'Plan', ta: 'திட்டம்' },
  clients: { en: 'Term', ta: 'காலம்' },
  galleries: { en: 'galleries this month', ta: 'இம்மாத கேலரிகள்' },
  daysLeft: { en: 'days left', ta: 'நாள் மீதம்' },
  storage: { en: 'Storage', ta: 'சேமிப்பு' },
  last: { en: 'Last activity', ta: 'கடைசிச் செயல்பாடு' },
  due: { en: 'Due', ta: 'நிலுவை' },
  approvals: { en: 'Review approvals', ta: 'ஒப்புதல்களைப் பார்' },
  plans: { en: 'Plans', ta: 'திட்டங்கள்' },
  count: { en: 'studios', ta: 'ஸ்டுடியோக்கள்' },
  none: { en: 'No studios yet', ta: 'இன்னும் ஸ்டுடியோ இல்லை' },
  noneBody: { en: 'Photographers who sign up wait in Approvals until their payment is marked Paid.', ta: 'பதிவு செய்பவர்கள் முதலில் ஒப்புதல்களில் தோன்றுவர்.' },
}

const STATUSES: StatusFilter[] = ['all', 'pending', 'active', 'paused', 'cancelled']
const SORTS: StudioSort[] = ['name', 'due', 'usage', 'activity', 'storage', 'newest']

export default function Studios() {
  const t = useT(copy)
  const lang = useLang()
  useTitle({ en: 'Studios', ta: 'ஸ்டுடியோக்கள்' })
  const data = useWingData()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = (STATUSES.includes(params.get('status') as StatusFilter) ? params.get('status') : 'all') as StatusFilter
  const sort = (SORTS.includes(params.get('sort') as StudioSort) ? params.get('sort') : 'name') as StudioSort
  const setParam = (k: string, v: string, def: string) => {
    const next = new URLSearchParams(params)
    if (v === def) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const all = useMemo(() => data.studios.map(s => studioRow(s, data)), [data])
  const rows = useMemo(() => sortRows(filterRows(all, q, status), sort), [all, q, status, sort])
  const pending = all.filter(r => r.status === 'pending').length
  const sortLabel: Record<StudioSort, string> = { name: t.sName, due: t.sDue, usage: t.sUsage, activity: t.sActivity, storage: t.sStorage, newest: t.sNewest }

  return (
    <div>
      <PageHeader
        eyebrow={PH.wing[lang]}
        title={t.title}
        subtitle={t.sub}
        actions={
          <>
            <Button to="/admin/photographers/approvals" variant={pending ? 'ruby' : 'outline'} size="sm" iconLeft="check" className="flex-1 md:flex-none">
              {t.approvals}{pending ? ` · ${pending}` : ''}
            </Button>
            <Button to="/admin/photographers/plans" variant="outline" size="sm" iconLeft="grid" className="flex-1 md:flex-none">{t.plans}</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
        <SearchInput value={q} onChange={v => setParam('q', v, '')} placeholder={t.search} className="col-span-2 md:w-[340px]" />
        <MiniSelect<StatusFilter> label={t.status} icon="filter" value={status} onChange={v => setParam('status', v, 'all')} options={STATUSES.map(s => ({ value: s, label: s === 'all' ? t.allStatus : STUDIO_STATUS[s][lang] }))} />
        <MiniSelect<StudioSort> label={t.sort} icon="rows" value={sort} onChange={v => setParam('sort', v, 'name')} className="md:ml-auto" options={SORTS.map(s => ({ value: s, label: sortLabel[s] }))} />
      </div>

      {!all.length ? (
        <EmptyState icon="camera" title={t.none} body={t.noneBody} />
      ) : !rows.length ? (
        <EmptyState icon="search" title={AC.noResults[lang]} action={<Button variant="outline" size="sm" onClick={() => setParams({}, { replace: true })}>{AC.clearFilters[lang]}</Button>} />
      ) : (
        <Panel bodyClass="p-0">
          <p className="border-b hairline px-5 py-3 text-[12.5px] text-ink/45 md:px-6">{rows.length} {t.count}</p>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="t-label text-ink/40">
                  <th className="px-6 py-3 font-medium">{t.studio}</th>
                  <th className="px-3 py-3 font-medium">{t.plan}</th>
                  <th className="px-3 py-3 font-medium">{t.clients}</th>
                  <th className="px-3 py-3 font-medium">{t.storage}</th>
                  <th className="px-3 py-3 font-medium">{t.last}</th>
                  <th className="px-6 py-3 text-right font-medium">{t.due}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => <TableRow key={r.studio.id} r={r} />)}
              </tbody>
            </table>
          </div>
          {/* Phone / tablet cards */}
          <ul className="divide-y divide-ink/[0.06] lg:hidden">
            {rows.map(r => <CardRow key={r.studio.id} r={r} />)}
          </ul>
        </Panel>
      )}
    </div>
  )
}

function dueText(r: StudioRow, lang: 'en' | 'ta') {
  if (r.due > 0) return formatINR(r.due)
  return r.status === 'active' ? AC.paid[lang] : '—'
}

function Usage({ r }: { r: StudioRow }) {
  const t = useT(copy)
  const months = r.plan.months
  return (
    <div className="w-full min-w-[110px] max-w-[160px]">
      <p className="mb-1.5 text-[12.5px] tabular-nums text-ink/70">
        <span className={`font-semibold ${r.status === 'active' && r.daysLeft <= 14 ? 'text-ruby' : 'text-ink'}`}>{r.daysLeft}</span> {t.daysLeft}
      </p>
      <Progress value={Math.min(1, r.daysLeft / (months * 30.4))} />
      <p className="mt-1 text-[11.5px] tabular-nums text-ink/45">{r.clients} {t.galleries}</p>
    </div>
  )
}

function TableRow({ r }: { r: StudioRow }) {
  const lang = useLang()
  const s = r.studio
  const to = `/admin/photographers/${s.id}`
  return (
    <tr className="group border-t hairline transition hover:bg-ink/[0.02]">
      <td className="px-6 py-3.5">
        <Link to={to} className="flex items-center gap-3">
          <StudioMark studio={s} size={36} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink group-hover:text-ruby">{s.name}</span>
            <span className="block truncate text-[12px] text-ink/45">{s.ownerName} · {s.phone} · {s.city}</span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <p className="font-medium text-ink">{r.plan.name}</p>
        <StudioStatusPill status={r.status} className="mt-1.5" />
      </td>
      <td className="px-3 py-3.5"><Usage r={r} /></td>
      <td className="px-3 py-3.5 tabular-nums text-ink/70">{formatBytes(r.storage)}</td>
      <td className="px-3 py-3.5 text-ink/55">{relTime(r.lastActivity, lang)}</td>
      <td className={`px-6 py-3.5 text-right font-semibold tabular-nums ${r.due > 0 ? 'text-ruby' : 'text-ink/40'}`}>{dueText(r, lang)}</td>
    </tr>
  )
}

function CardRow({ r }: { r: StudioRow }) {
  const lang = useLang()
  const t = useT(copy)
  const s = r.studio
  return (
    <li>
      <Link to={`/admin/photographers/${s.id}`} className="flex gap-3 px-5 py-4 transition hover:bg-ink/[0.02]">
        <StudioMark studio={s} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{s.name}</p>
              <p className="truncate text-[12px] text-ink/45">{s.ownerName} · {s.city}</p>
            </div>
            <Icon name="chevronRight" size={16} className="mt-1 shrink-0 text-ink/25" />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StudioStatusPill status={r.status} />
            <span className="text-[12px] font-medium text-ink/60">{r.plan.name}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
            <div className="col-span-3 sm:col-span-1"><p className="t-label mb-1 text-ink/40">{t.clients}</p><Usage r={r} /></div>
            <div><p className="t-label mb-1 text-ink/40">{t.storage}</p><p className="tabular-nums text-ink/70">{formatBytes(r.storage)}</p></div>
            <div><p className="t-label mb-1 text-ink/40">{t.last}</p><p className="text-ink/60">{relTime(r.lastActivity, lang)}</p></div>
            <div><p className="t-label mb-1 text-ink/40">{t.due}</p><p className={`font-semibold tabular-nums ${r.due > 0 ? 'text-ruby' : 'text-ink/40'}`}>{dueText(r, lang)}</p></div>
          </div>
        </div>
      </Link>
    </li>
  )
}
