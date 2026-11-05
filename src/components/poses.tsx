import { Icon } from './Icon'
import { useLang } from '../lib/i18n'
import { WHO, poseSrc, type PoseDef } from '../lib/poses'

/*
 * Pose pieces shared by the client's pose guide and the admin library /
 * shot list: the illustration and the "how to pose" notes.
 */

const HOW = { en: 'How to pose', ta: 'எப்படி போஸ் கொடுப்பது' }
const ITEMS = { en: 'Useful items', ta: 'தேவையான பொருட்கள்' }

export function PoseImage({ pose, className = '', eager = false }: { pose: PoseDef; className?: string; eager?: boolean }) {
  const lang = useLang()
  return <img src={poseSrc(pose)} alt={pose.title[lang]} width={300} height={400} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className={`block aspect-[3/4] w-full select-none object-cover ${className}`} />
}

export function HowToPose({ pose, compact = false, dark = false }: { pose: PoseDef; compact?: boolean; dark?: boolean }) {
  const lang = useLang()
  const muted = dark ? 'text-white/45' : 'text-ink/45'
  const body = dark ? 'text-white/80' : 'text-ink/75'
  return (
    <div>
      <p className={`t-label ${muted}`}>{HOW[lang]}</p>
      <dl className={`mt-3 ${compact ? 'space-y-2.5' : 'space-y-3.5'}`}>
        {pose.steps.map((s, i) => (
          <div key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
            <dt className={`pt-px text-[11.5px] font-semibold uppercase tracking-[0.08em] ${dark ? 'text-ruby-bright' : 'text-ruby'}`}>{WHO[s.who][lang]}</dt>
            <dd className={`${compact ? 'text-[13.5px]' : 'text-[14.5px]'} leading-relaxed ${body}`}>{s.text[lang]}</dd>
          </div>
        ))}
      </dl>
      {pose.props && (
        <div className={`mt-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-3 ${dark ? 'bg-white/[0.06]' : 'bg-ink/[0.035]'}`}>
          <Icon name="sparkle" size={15} className={`mt-0.5 shrink-0 ${dark ? 'text-gold-bright' : 'text-gold'}`} />
          <p className={`text-[13px] leading-relaxed ${body}`}>
            <span className={`font-semibold ${dark ? 'text-white' : 'text-ink'}`}>{ITEMS[lang]}: </span>
            {pose.props[lang]}
          </p>
        </div>
      )}
    </div>
  )
}
