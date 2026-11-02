import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from './Icon'
import { EASE } from './motion'
import { useLang } from '../lib/i18n'
import { PACKAGE_ALBUM_POINTS, PACKAGE_ALBUM_TITLE } from '../lib/packageNote'

/** Collapsible "How packages and albums work" card. `tone="dark"` sits on ruby or ink backgrounds. */
export function PackageAlbumNote({ className = '', defaultOpen = false, tone = 'light' }: { className?: string; defaultOpen?: boolean; tone?: 'light' | 'dark' }) {
  const lang = useLang()
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const dark = tone === 'dark'
  return (
    <div className={`overflow-hidden rounded-[22px] border ${dark ? 'border-white/10 bg-white/[0.06] text-white' : 'border-ink/[0.08] bg-white/70 text-ink shadow-soft'} ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left cursor-pointer sm:px-5"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-white/10' : 'glass-ruby-tint text-ruby'}`}>
          <Icon name="info" size={16} />
        </span>
        <span className="flex-1 text-[14px] font-semibold">{PACKAGE_ALBUM_TITLE[lang]}</span>
        <Icon name="chevronDown" size={18} className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${dark ? 'text-white/60' : 'text-ink/45'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ul className={`space-y-2 border-t px-4 pb-4 pt-3 text-[13.5px] leading-relaxed sm:px-5 ${dark ? 'border-white/10 text-white/75' : 'hairline text-ink/65'}`}>
              {PACKAGE_ALBUM_POINTS.map(p => (
                <li key={p.en} className="flex items-start gap-2.5">
                  <Icon name="check" size={14} strokeWidth={2.2} className={`mt-1 shrink-0 ${dark ? 'text-white/60' : 'text-ruby'}`} />
                  {p[lang]}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
