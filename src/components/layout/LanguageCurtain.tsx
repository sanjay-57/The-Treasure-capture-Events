import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Kolam } from '../tamil'
import { EASE } from '../motion'
import { useUi } from '../../lib/ui'
import { useStore } from '../../lib/store'

/**
 * Full-screen transition for the English ⇄ Tamil switch. The curtain rises,
 * the language (and with it every string, font and photo) flips while hidden,
 * then the curtain lifts away.
 */
export function LanguageCurtain() {
  const target = useUi(s => s.curtain)
  const switched = useRef(false)

  const onCovered = () => {
    if (switched.current || !target) return
    switched.current = true
    useStore.getState().setLang(target)
    setTimeout(() => useUi.setState({ curtain: null }), 900)
  }

  const toTamil = target === 'ta'

  return (
    <AnimatePresence onExitComplete={() => (switched.current = false)}>
      {target && (
        <motion.div
          key="curtain"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.75, ease: [0.83, 0, 0.17, 1] }}
          onAnimationComplete={onCovered}
          aria-live="polite"
        >
          <div className="ambient-dark grain absolute inset-0" />
          {toTamil && <div className="kolam-bg absolute inset-0 opacity-[0.12]" />}
          <motion.div
            className="relative flex flex-col items-center px-6 text-center text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          >
            <Kolam size={132} className="h-[104px] w-[104px] text-ruby-bright sm:h-[132px] sm:w-[132px]" strokeWidth={1.4} />
            <p
              className="mt-6 text-5xl sm:mt-8 md:text-7xl"
              style={{ fontFamily: toTamil ? "'Arima', serif" : "'Cormorant Garamond', serif", fontStyle: toTamil ? 'normal' : 'italic', fontWeight: 500 }}
            >
              {toTamil ? 'வணக்கம்' : 'Welcome'}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/50" style={{ letterSpacing: toTamil ? '0.1em' : undefined }}>
              {toTamil ? 'தமிழில் தொடர்கிறோம்' : 'Continuing in English'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
