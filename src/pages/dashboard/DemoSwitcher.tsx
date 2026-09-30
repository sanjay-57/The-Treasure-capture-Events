import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { useLang, useT } from '../../lib/i18n'
import { STATUS_META, STATUS_ORDER, statusName } from '../../lib/data'
import { DEMO_CLIENT_PHONE, normalizePhone, useStore, type Order } from '../../lib/store'
import { toast } from '../../lib/ui'
import { useProofingVersion, type ProofingVersion } from './proofing'
import { photosUnlocked } from './shared'

const copy = {
  demo: { en: 'Demo', ta: 'டெமோ' },
  title: { en: 'Presentation mode', ta: 'விளக்கக் காட்சி முறை' },
  body: { en: 'Jump this demo order to any stage to show each feature.', ta: 'ஒவ்வொரு வசதியையும் காட்ட, இந்த டெமோ ஆர்டரை எந்த நிலைக்கும் மாற்றலாம்.' },
  moved: { en: 'Demo order moved to', ta: 'டெமோ ஆர்டர் மாற்றப்பட்டது:' },
  stage: { en: 'Stage', ta: 'நிலை' },
  design: { en: 'Photo selection design', ta: 'படத் தேர்வு வடிவமைப்பு' },
  v1: { en: 'Editorial', ta: 'இதழ் பாணி' },
  v2: { en: 'Light table', ta: 'ஒளி மேசை' },
  switched: { en: 'Photo selection switched to', ta: 'படத் தேர்வு மாற்றப்பட்டது:' },
}

/**
 * Floating stage switcher shown only for the demo client account, so the
 * whole order journey can be presented without going through admin.
 */
export function DemoSwitcher({ order }: { order: Order }) {
  const lang = useLang()
  const t = useT(copy)
  const navigate = useNavigate()
  const demoJumpTo = useStore(s => s.demoJumpTo)
  const [open, setOpen] = useState(false)
  const version = useProofingVersion(s => s.version)
  const setVersion = useProofingVersion(s => s.setVersion)

  if (normalizePhone(order.client.contact) !== DEMO_CLIENT_PHONE) return null
  const current = STATUS_ORDER.indexOf(order.status)

  const jump = (i: number) => {
    const status = STATUS_ORDER[i]
    demoJumpTo(order.id, status)
    setOpen(false)
    toast(`${t.moved} ${statusName(status, order.eventType, lang)}`, 'ruby')
    const to = STATUS_META[status].cta?.to
    navigate(to && to !== '/dashboard/track' ? to : '/dashboard')
  }

  const pickVersion = (v: ProofingVersion) => {
    setVersion(v)
    toast(`${t.switched} V${v} · ${v === 1 ? t.v1 : t.v2}`, 'ruby')
    if (photosUnlocked(order)) navigate('/dashboard/photos')
  }

  return createPortal(
    <div className="fixed bottom-24 left-3 z-[70] lg:bottom-6 lg:left-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="glass-dark mb-3 w-[min(320px,calc(100vw-24px))] origin-bottom-left rounded-3xl p-3"
            data-lenis-prevent
          >
            <div className="px-2 pb-3 pt-1">
              <p className="text-sm font-semibold text-white">{t.title}</p>
              <p className="mt-1 text-[12px] leading-snug text-white/55">{t.body}</p>
            </div>
            <ol className="space-y-1">
              {STATUS_ORDER.map((s, i) => {
                const active = i === current
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => jump(i)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[13px] transition cursor-pointer ${active ? 'bg-ruby text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${active ? 'bg-white text-ruby' : i < current ? 'bg-white/20 text-white' : 'border border-white/20 text-white/60'}`}>
                        {i < current ? <Icon name="check" size={12} strokeWidth={2.4} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{statusName(s, order.eventType, lang)}</span>
                      {active && <Icon name="eye" size={15} />}
                    </button>
                  </li>
                )
              })}
            </ol>

            <div className="mt-3 border-t border-white/10 px-2 pb-1 pt-3">
              <p className="text-[12px] text-white/55">{t.design}</p>
              <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-white/[0.06] p-1">
                {([1, 2] as const).map(v => {
                  const on = v === version
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => pickVersion(v)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12.5px] transition cursor-pointer ${on ? 'bg-ruby text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    >
                      <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums ${on ? 'bg-white text-ruby' : 'border border-white/20'}`}>V{v}</span>
                      <span className="truncate">{v === 1 ? t.v1 : t.v2}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="glass-dark flex h-11 items-center gap-2.5 rounded-full pl-2 pr-4 text-[13px] font-medium text-white shadow-2xl transition hover:bg-white/10 cursor-pointer"
      >
        <span className="flex h-7 items-center rounded-full bg-ruby px-2.5 text-[11px] font-semibold uppercase tracking-wider">{t.demo}</span>
        <span className="tabular-nums text-white/70">
          {t.stage} {current + 1}/8 · V{version}
        </span>
        <Icon name="chevronDown" size={15} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>,
    document.body,
  )
}
