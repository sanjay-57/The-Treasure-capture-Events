import { Icon } from '../../components/Icon'
import { useLang, type Bi } from '../../lib/i18n'
import { WORK_STAGES, type WorkStage } from './types'

/** Work stage names, shared by the studio's Overview tab and the client portal. No admin kit here: the portal imports it. */
export const STAGE_LABEL: Record<WorkStage, Bi> = {
  booked: { en: 'Booked', ta: 'முன்பதிவு' },
  shoot_done: { en: 'Shoot done', ta: 'படப்பிடிப்பு முடிந்தது' },
  culling: { en: 'Sorting photos', ta: 'படங்களைப் பிரித்தல்' },
  selection_sent: { en: 'Selection sent', ta: 'தேர்வுக்கு அனுப்பப்பட்டது' },
  selection_received: { en: 'Selection received', ta: 'தேர்வு பெறப்பட்டது' },
  editing: { en: 'Editing', ta: 'திருத்தம்' },
  album_design: { en: 'Album design', ta: 'ஆல்பம் வடிவமைப்பு' },
  delivered: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
}

/** Horizontal stepper over WORK_STAGES. With onSet each step is a button; without it, read-only. */
export function WorkStepper({ stage, onSet, tone = 'ink' }: { stage: WorkStage; onSet?: (s: WorkStage) => void; tone?: 'ink' | 'accent' }) {
  const lang = useLang()
  const cur = Math.max(0, WORK_STAGES.indexOf(stage))
  const on = tone === 'accent' ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-ink text-white'
  const line = tone === 'accent' ? 'bg-[var(--accent)]' : 'bg-ink'
  return (
    <ol className="no-scrollbar -mx-1 flex overflow-x-auto px-1 pb-1" aria-label="Work progress" data-lenis-prevent>
      {WORK_STAGES.map((s, i) => {
        const done = i < cur
        const now = i === cur
        const dot = (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done || now ? on : 'bg-ink/[0.07] text-ink/45'} ${now ? 'ring-4 ring-ink/10' : ''}`}>
            {done ? <Icon name="check" size={13} strokeWidth={2.6} /> : i + 1}
          </span>
        )
        const label = <span className={`mt-1.5 block text-center text-[11.5px] leading-tight ${now ? 'font-semibold text-ink' : done ? 'text-ink/70' : 'text-ink/40'}`}>{STAGE_LABEL[s][lang]}</span>
        return (
          <li key={s} className="relative flex min-w-[88px] flex-1 flex-col items-center" aria-current={now ? 'step' : undefined}>
            {i > 0 && <span className={`absolute right-1/2 top-3.5 -z-0 h-0.5 w-full ${i <= cur ? line : 'bg-ink/[0.08]'}`} aria-hidden />}
            {onSet ? (
              <button type="button" onClick={() => onSet(s)} className="relative z-10 flex cursor-pointer flex-col items-center rounded-xl px-1 py-0.5 hover:bg-ink/[0.04]">
                {dot}
                {label}
              </button>
            ) : (
              <span className="relative z-10 flex flex-col items-center px-1 py-0.5">
                {dot}
                {label}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
