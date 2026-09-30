import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Button, Img, Modal } from '../../components/ui'
import { EASE } from '../../components/motion'
import { useT } from '../../lib/i18n'
import { IMG, type ImgKey } from '../../lib/images'
import { useStore, type Order } from '../../lib/store'
import { toast } from '../../lib/ui'
import { PHOTO_QUOTA } from './shared'

/** Shared pieces of the two proofing designs (editorial chapters and the light table). */

export type ProofingVersion = 1 | 2

/** Which proofing design the dashboard shows. Switched from the demo panel; remembered per browser. */
export const useProofingVersion = create<{ version: ProofingVersion; setVersion: (v: ProofingVersion) => void }>()(
  persist(set => ({ version: 1, setVersion: version => set({ version }) }), { name: 'ttc-proofing-version', storage: createJSONStorage(() => localStorage) }),
)

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const ratioOf = (id: ImgKey) => IMG[id].w / IMG[id].h

const copy = {
  over: { en: 'over the album quota — extra sheets may apply', ta: 'ஆல்ப வரம்பை மீறியது — கூடுதல் தாள் கட்டணம் இருக்கலாம்' },
  left: { en: 'more to reach the album quota', ta: 'இன்னும் தேர்வு செய்யலாம்' },
  reached: { en: 'Album quota reached', ta: 'ஆல்ப வரம்பு நிறைவு' },
  confirmTitle: { en: 'Submit your selection?', ta: 'தேர்வைச் சமர்ப்பிக்கலாமா?' },
  confirmBody: {
    en: 'Your list goes to our album designers and the gallery becomes read-only. Next, you’ll choose the cover, paper and typography.',
    ta: 'உங்கள் பட்டியல் எங்கள் ஆல்ப வடிவமைப்பாளர்களுக்குச் செல்லும்; கேலரி பார்வைக்கு மட்டும் ஆகிவிடும். அடுத்து அட்டை, தாள், எழுத்துருவைத் தேர்வீர்கள்.',
  },
  photos: { en: 'photos', ta: 'படங்கள்' },
  keepChoosing: { en: 'Keep choosing', ta: 'தொடர்ந்து தேர்வு' },
  confirm: { en: 'Submit', ta: 'சமர்ப்பி' },
  submittedToast: { en: 'Selection submitted — album design is now open', ta: 'தேர்வு சமர்ப்பிக்கப்பட்டது — ஆல்பம் வடிவமைப்பு திறந்துள்ளது' },
}

/** One-line quota status: how many are left, reached, or over. */
export function useQuotaStatus(count: number, quota: number) {
  const t = useT(copy)
  return count > quota ? `${count - quota} ${t.over}` : count === quota ? t.reached : `${quota - count} ${t.left}`
}

/** One small studio mark in the bottom-right corner of each proof. */
export function Watermark({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const cls = size === 'md' ? 'bottom-2.5 right-3 text-[10px]' : size === 'xs' ? 'bottom-1 right-1.5 text-[6.5px]' : 'bottom-1.5 right-2 text-[8px]'
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute select-none whitespace-nowrap font-sans font-medium uppercase tracking-[0.14em] text-white/70 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] ${cls}`}
    >
      © The Treasure Capture
    </span>
  )
}

export function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="inline-block">
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** Confirm dialog that submits the selection and moves the client on to album design. */
export function SubmitSelectionModal({ order, selected, open, onClose }: { order: Order; selected: Set<ImgKey>; open: boolean; onClose: () => void }) {
  const t = useT(copy)
  const submitSelection = useStore(s => s.submitSelection)
  const navigate = useNavigate()
  const count = selected.size
  const quota = PHOTO_QUOTA[order.packageId]
  const status = useQuotaStatus(count, quota)

  const submit = () => {
    submitSelection(order.id)
    onClose()
    toast(t.submittedToast, 'ruby')
    navigate('/dashboard/album')
  }

  return (
    <Modal open={open} onClose={onClose} label={t.confirmTitle}>
      <div className="p-7 md:p-9">
        <div className="flex -space-x-3">
          {[...selected].slice(0, 5).map((id, i) => (
            <span key={id} className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white shadow-soft" style={{ zIndex: 5 - i, rotate: `${(i - 2) * 3}deg` }}>
              <Img k={id} w={160} ratio={1} sizes="56px" className="h-full w-full" />
            </span>
          ))}
        </div>
        <h3 className="t-3 mt-6">{t.confirmTitle}</h3>
        <p className="mt-2 font-display text-[28px] font-semibold text-ruby">
          {count} <span className="text-[18px] font-medium text-ink/50">{t.photos}</span>
        </p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/60">{t.confirmBody}</p>
        <p className={`mt-3 text-[13px] ${count > quota ? 'text-ruby' : 'text-ink/50'}`}>{status}</p>
        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            {t.keepChoosing}
          </Button>
          <Button onClick={submit} icon="check">
            {t.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
