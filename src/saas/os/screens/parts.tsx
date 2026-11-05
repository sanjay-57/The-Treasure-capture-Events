import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from '../../../components/Icon'
import { Switch, TextInput } from '../../../pages/admin/kit'
import { useCurrentStudio } from '../../store'
import { useOsStore } from '../store'
import { projectsOf } from '../../scope'

/** Shared bits for the Studio OS screens. */

export const useStudioId = () => useCurrentStudio()!.id

export function useProjects() {
  const sid = useStudioId()
  const all = useOsStore(s => s.projects)
  return useMemo(() => projectsOf(all, sid), [all, sid])
}

export const portalLink = (code: string) => `${window.location.origin}/p/${code}`
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
/** Whole, non-negative number from a text field. */
export const toInt = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, '')) || 0))
export const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

export type Tone = 'red' | 'amber' | 'green' | 'ink' | 'muted' | 'blue'
const TONES: Record<Tone, string> = {
  red: 'bg-ruby/10 text-ruby-deep',
  amber: 'bg-amber-100 text-amber-900',
  green: 'bg-emerald-100 text-emerald-900',
  ink: 'bg-ink text-white',
  muted: 'bg-ink/[0.06] text-ink/65',
  blue: 'bg-sky-100 text-sky-900',
}
export function Pill({ tone = 'muted', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none ${TONES[tone]}`}>{children}</span>
}

export function Kpi({ label, value, hint, tone, to, icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'red' | 'default'; to?: string; icon?: IconName }) {
  const body = (
    <>
      <p className="t-label flex items-center gap-1.5 text-ink/45">{icon && <Icon name={icon} size={13} />}{label}</p>
      <p className={`mt-1.5 truncate text-[22px] font-semibold tabular-nums tracking-tight ${tone === 'red' ? 'text-ruby' : 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[12px] text-ink/45">{hint}</p>}
    </>
  )
  const cls = 'block min-w-0 rounded-[20px] border border-ink/[0.08] bg-white px-4 py-3.5 transition'
  return to ? <Link to={to} className={`${cls} hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(10,10,11,0.35)]`}>{body}</Link> : <div className={cls}>{body}</div>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function IconBtn({ icon, label, onClick, href, tone }: { icon: IconName; label: string; onClick?: () => void; href?: string; tone?: 'red' }) {
  const cls = `inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition ${tone === 'red' ? 'text-ruby/70 hover:bg-ruby/10 hover:text-ruby' : 'text-ink/50 hover:bg-ink/[0.06] hover:text-ink'}`
  if (href) return <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={cls}><Icon name={icon} size={16} /></a>
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={cls}><Icon name={icon} size={16} /></button>
}

/** Kit Switch with its label shown beside it. */
export function SwitchRow({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <Switch checked={checked} onChange={onChange} label={label} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-ink/45">{hint}</span>}
      </span>
    </label>
  )
}

/**
 * Kit TextInput that saves as you type without being bound to the store. In LAN mode
 * every save is a server round trip, so a store-bound input drops keys and jumps back.
 * Typing stays local; it saves after a short pause and when the field unmounts.
 */
export function LiveTextInput({ value, onSave, delay = 500, ...rest }: Omit<ComponentProps<typeof TextInput>, 'onChange'> & { onSave: (v: string) => void; delay?: number }) {
  const [v, setV] = useState(value)
  const pending = useRef<{ v: string; timer: ReturnType<typeof setTimeout> } | null>(null)
  const save = useRef(onSave)
  save.current = onSave
  const flush = () => {
    const p = pending.current
    if (!p) return
    clearTimeout(p.timer)
    pending.current = null
    save.current(p.v)
  }
  // Follow outside changes (the server's reply, another device) unless an edit is waiting.
  useEffect(() => {
    if (!pending.current) setV(value)
  }, [value])
  useEffect(() => flush, [])
  const change = (next: string) => {
    setV(next)
    if (pending.current) clearTimeout(pending.current.timer)
    pending.current = { v: next, timer: setTimeout(flush, delay) }
  }
  return <TextInput {...rest} value={v} onChange={change} />
}
