import { AnimatePresence, motion } from 'motion/react'
import { Img } from '../../components/ui'
import { Reveal } from '../../components/motion'
import { useLang, useT } from '../../lib/i18n'
import { useStore } from '../../lib/store'
import { eventByKey } from '../../lib/data'
import { eventGallery } from '../../lib/gallery'

const copy = {
  tales: { en: 'Here are our pictorial tales', ta: 'எங்கள் படக் கதைகள்' },
  talesNote: { en: 'A few frames from celebrations like yours.', ta: 'உங்களுடையதைப் போன்ற விழாக்களிலிருந்து சில படங்கள்.' },
}

/** Full-bleed, softly blurred photo of the chosen event behind the booking glass (traditional set in Tamil). */
export function EventBackdrop() {
  const lang = useLang()
  const eventType = useStore(s => s.draft.eventType)
  const key = eventType ? eventByKey(eventType)?.img[lang] : undefined
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <AnimatePresence>
        {key && (
          <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0">
            {/* Phones fetch a small file and blur it less: under that much blur the detail is never seen, and a lighter filter is kinder to low-end Android */}
            <Img k={key} w={1200} sizes="(max-width: 767px) 30vw, 100vw" alt="" className="absolute -inset-10 [filter:blur(14px)_saturate(1.1)] md:[filter:blur(22px)_saturate(1.1)]" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Wash so the glass panels and text stay legible over any photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-white/92" />
    </div>
  )
}

type Tale = ReturnType<typeof eventGallery>[number]

function TaleCard({ tale, className }: { tale: Tale; className: string }) {
  const lang = useLang()
  return (
    <figure className={`shrink-0 ${className}`}>
      {tale.img && <Img k={tale.img} w={480} ratio={4 / 5} sizes="240px" className="aspect-[4/5] rounded-[20px] shadow-soft" />}
      <figcaption className="mt-1.5 truncate text-[12px] text-ink/55">{tale.title[lang]}</figcaption>
    </figure>
  )
}

/**
 * "Here are our pictorial tales": gallery photos of the chosen event, always drifting.
 * Wide screens (≥1500px, where the steps leave the left margin empty) get a fixed column
 * sliding upwards in that margin; narrower screens get a strip sliding sideways under the
 * step. The list is doubled so the CSS loop (-50%) is seamless; hover pauses it.
 */
export function PictorialTales() {
  const lang = useLang()
  const t = useT(copy)
  const eventType = useStore(s => s.draft.eventType)
  const items = eventGallery(eventType, lang, 10)
  if (!eventType || !items.length) return null
  const loop = [...items, ...items]
  return (
    <>
      {/* Absolute over the whole booking area with a sticky inner, so it rides along but never covers the footer */}
      <aside
        aria-label={t.tales}
        className="absolute inset-y-0 z-0 hidden w-[min(240px,calc((100vw-72rem)/2-2rem))] min-[1500px]:block"
        style={{ left: 'calc((100vw - 72rem) / 4 - min(120px, (100vw - 72rem) / 4 - 1rem))' }}
      >
        <div className="sticky top-24 flex h-[calc(100vh-7rem)] flex-col">
          <p className="t-label px-1 pb-3 pt-2 text-ink/50">{t.tales}</p>
          <div className="min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_86%,transparent)]">
            <div className="tales-up flex flex-col gap-4" style={{ ['--tales-dur' as string]: `${items.length * 9}s` }}>
              {loop.map((i, n) => <TaleCard key={`${i.id}-${n}`} tale={i} className="w-full" />)}
            </div>
          </div>
        </div>
      </aside>
      <section className="mt-16 min-[1500px]:hidden md:mt-24" aria-label={t.tales}>
        <Reveal>
          <p className="t-3 text-ink">{t.tales}</p>
          <p className="mt-1 text-[14px] text-ink/55">{t.talesNote}</p>
        </Reveal>
        <div className="-mx-5 mt-5 overflow-hidden md:mx-0 [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <div className="tales-left flex w-max gap-3 md:gap-4" style={{ ['--tales-dur' as string]: `${items.length * 7}s` }}>
            {loop.map((i, n) => <TaleCard key={`${i.id}-${n}`} tale={i} className="w-[46vw] sm:w-[30vw] md:w-[220px]" />)}
          </div>
        </div>
      </section>
    </>
  )
}
