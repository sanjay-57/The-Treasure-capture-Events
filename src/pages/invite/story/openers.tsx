import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Lang } from '../../../lib/i18n'
import type { Invite } from '../../../lib/invite'
import { rnd } from '../themes'
import { Cluster, Kolam, Lantern, Toran } from './motifs'
import { shade, type StoryTheme } from './theme'

/*
 * The opening ritual, drawn over the page. Tap anywhere: doors and the arch
 * swing inward and the camera walks through the doorway into the page behind;
 * curtains and marigold strings part; the gatefold's medallion splits and the
 * panels fold toward you; the envelope's wax seal cracks, the flap lifts and
 * the card rises out. With a painted clip (`art.openerVideo`) the tap plays
 * the clip instead. `onOpened` fires as the last frame fades.
 */

const EASE = [0.65, 0, 0.25, 1] as const

const DURATION: Record<StoryTheme['opener'], number> = {
  doors: 2900, arch: 2900, curtains: 2300, strings: 2500, gates: 2500, envelope: 3300,
}

const copy = {
  tap: { en: 'Tap to open', ta: 'திறக்கத் தொடவும்' },
  invited: { en: 'You are invited', ta: 'உங்களுக்கு அழைப்பு' },
  weds: { en: 'are getting married', ta: 'திருமண அழைப்பு' },
}

export function Opener({ th, invite, lang, onStart, onOpened }: { th: StoryTheme; invite: Invite; lang: Lang; onStart: () => void; onOpened: () => void }) {
  const [open, setOpen] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const done = useRef(false)
  const finish = () => {
    if (done.current) return
    done.current = true
    onOpened()
  }
  const useVideo = !!th.art.openerVideo && !videoFailed
  const tap = () => {
    if (open) return
    setOpen(true)
    onStart()
    navigator.vibrate?.(18)
    if (useVideo && video.current) {
      void video.current.play().catch(() => setVideoFailed(true))
      return
    }
    window.setTimeout(finish, DURATION[th.opener])
  }
  useEffect(() => {
    // A clip that never ends (stalled network) still lets the guest in.
    if (open && useVideo) {
      const id = window.setTimeout(finish, 12000)
      return () => window.clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useVideo])

  const initials = [invite.en[0][0] ?? '', invite.en[1][0] ?? ''].map(c => c.toUpperCase()) as [string, string]
  const names = invite[lang]
  const scene: Record<StoryTheme['opener'], ReactNode> = {
    doors: <Doorway th={th} open={open} initials={initials} />,
    arch: <Doorway th={th} open={open} initials={initials} arch />,
    curtains: <Curtains th={th} open={open} initials={initials} />,
    strings: <Strings th={th} open={open} />,
    gates: <Gatefold th={th} open={open} initials={initials} />,
    envelope: <Envelope th={th} open={open} initials={initials} names={names} lang={lang} />,
  }

  return (
    <motion.div
      className="absolute inset-0 z-40 cursor-pointer overflow-hidden"
      role="button"
      tabIndex={0}
      aria-label={copy.tap[lang]}
      onClick={tap}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && tap()}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      {useVideo ? (
        <video
          ref={video}
          src={th.art.openerVideo}
          poster={th.art.opener}
          muted
          playsInline
          preload="auto"
          onEnded={finish}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : scene[th.opener]}

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-[7cqh] z-10 flex justify-center"
        animate={{ opacity: open ? 0 : 1, y: open ? 12 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <span
          className="st-pulse flex items-center gap-2 rounded-full px-4 py-2 text-[clamp(11px,3.2cqw,14px)] font-medium uppercase tracking-[0.2em] backdrop-blur-md"
          style={{ background: 'rgba(20,12,6,0.55)', color: '#fff7e6', border: `1px solid ${th.trim}88` }}
        >
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M7 9V4.5a1.5 1.5 0 0 1 3 0V9m0-1.5a1.5 1.5 0 0 1 3 0V10m0-1a1.5 1.5 0 0 1 3 0v3.5c0 3-2 5.5-5 5.5h-1c-2.2 0-3.5-1.2-4.6-3L3.8 12a1.4 1.4 0 0 1 2.3-1.6L7 11.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {copy.tap[lang]}
        </span>
      </motion.div>
    </motion.div>
  )
}

// ─── Shared pieces ──────────────────────────────────────────────────────────

/** A round medallion cut down the middle: `half` picks which side this leaf carries. */
function HalfMedallion({ th, initials, half, size }: { th: StoryTheme; initials: [string, string]; half: 'left' | 'right'; size: string }) {
  return (
    <div
      className="absolute top-1/2 overflow-hidden"
      style={{ width: `calc(${size} / 2)`, height: size, marginTop: `calc(${size} / -2)`, [half === 'left' ? 'right' : 'left']: 0 }}
    >
      <div
        className="absolute top-0 flex items-center justify-center rounded-full"
        style={{
          width: size, height: size, [half === 'left' ? 'left' : 'right']: 0,
          background: `radial-gradient(circle at 35% 30%, ${shade(th.trim, 0.45)}, ${th.trim} 45%, ${shade(th.trim, -0.35)} 100%)`,
          boxShadow: `0 6px 18px rgba(0,0,0,0.45), inset 0 0 0 3px ${shade(th.trim, -0.25)}, inset 0 0 0 6px ${shade(th.trim, 0.3)}`,
        }}
      >
        <div className="absolute inset-[14%] rounded-full" style={{ border: `1px dashed ${shade(th.trim, -0.45)}` }} />
        <span style={{ fontFamily: `${th.script}, cursive`, fontSize: `calc(${size} * 0.34)`, color: shade(th.trim, -0.6), textShadow: `0 1px 0 ${shade(th.trim, 0.5)}` }}>
          {initials[0]}<span style={{ fontSize: '0.6em', margin: '0 0.08em' }}>&amp;</span>{initials[1]}
        </span>
      </div>
    </div>
  )
}

// ─── Doors & arch ───────────────────────────────────────────────────────────

/** Carved double doors in a wall; the doorway is a window onto the page beneath, so walking through lands on it. */
function Doorway({ th, open, initials, arch = false }: { th: StoryTheme; open: boolean; initials: [string, string]; arch?: boolean }) {
  const wall = th.dark ? ['#2a1a10', '#140b05'] : arch ? ['#f4e9d8', '#e3d0b2'] : ['#efe1c8', '#dcc6a0']
  const [base, dark, light] = th.shell
  const radius = arch ? '50% 50% 0 0 / 34% 34% 0 0' : '6px 6px 0 0'
  const studs = `radial-gradient(circle at 40% 35%, ${shade(th.trim, 0.6)} 0 1px, ${th.trim} 1.6px 2.6px, ${shade(th.trim, -0.5)} 3px, transparent 3.6px)`
  const leaf = (side: 'left' | 'right') => (
    <motion.div
      className="absolute inset-y-0 w-1/2"
      style={{
        [side]: 0,
        transformOrigin: `${side} center`,
        background: arch
          ? `linear-gradient(90deg, ${dark}, ${base} 10%, ${light} 50%, ${base} 90%, ${dark})`
          : `repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 9px), linear-gradient(90deg, ${dark}, ${base} 12%, ${light} 50%, ${base} 88%, ${dark})`,
        boxShadow: `inset ${side === 'left' ? '-' : ''}2px 0 0 rgba(0,0,0,0.5)`,
        backfaceVisibility: 'hidden',
      }}
      animate={{ rotateY: open ? (side === 'left' ? 104 : -104) : 0 }}
      transition={{ duration: 1.9, delay: 0.25, ease: EASE }}
    >
      {/* Raised panels with brass studs along the rails. */}
      <div className="absolute inset-[7%_10%] flex flex-col gap-[4%]">
        {[0.34, 0.33, 0.33].map((f, i) => (
          <div
            key={i}
            className="relative"
            style={{
              flex: f,
              borderRadius: arch && i === 0 ? (side === 'left' ? '100% 0 4px 4px / 60% 0 4px 4px' : '0 100% 4px 4px / 0 60% 4px 4px') : 4,
              boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.28), inset 3px 3px 7px rgba(255,255,255,0.14), inset -4px -4px 10px rgba(0,0,0,0.38)',
              background: arch ? `linear-gradient(160deg, ${light}, ${base})` : undefined,
            }}
          >
            {!arch && <div className="absolute inset-x-[10%] top-1/2 h-[14px] -translate-y-1/2" style={{ backgroundImage: studs, backgroundSize: '14px 14px', backgroundRepeat: 'repeat-x' }} />}
          </div>
        ))}
      </div>
      {!arch && (
        <>
          <div className="absolute inset-y-[3%] w-[14px]" style={{ [side === 'left' ? 'right' : 'left']: '3%', backgroundImage: studs, backgroundSize: '14px 18px', backgroundRepeat: 'repeat-y' }} />
          <div className="absolute inset-y-[3%] w-[14px]" style={{ [side]: '3%', backgroundImage: studs, backgroundSize: '14px 18px', backgroundRepeat: 'repeat-y' }} />
        </>
      )}
      {/* Brass ring knocker near the meeting edge. */}
      <div
        className="absolute top-[56%] h-[7cqw] w-[7cqw] rounded-full"
        style={{ [side === 'left' ? 'right' : 'left']: '9%', border: `2px solid ${th.trim}`, boxShadow: `0 3px 4px rgba(0,0,0,0.5), inset 0 0 0 1px ${shade(th.trim, 0.4)}` }}
      />
      <HalfMedallion th={th} initials={initials} half={side} size="22cqw" />
    </motion.div>
  )

  return (
    <motion.div
      className="absolute inset-0"
      style={{ transformOrigin: '50% 50%' }}
      animate={open ? { scale: [1, 1.04, 3.4], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
      transition={{ duration: 2.9, times: [0, 0.45, 1], ease: 'easeIn' }}
    >
      {/* The doorway: its spread shadow is the wall, so everything outside it is wall and inside it is the page. */}
      <div
        className="absolute left-1/2 top-[50%] h-[66cqh] w-[74cqw] -translate-x-1/2 -translate-y-1/2"
        style={{ perspective: '1100px', borderRadius: radius, boxShadow: `0 0 0 220vmax ${wall[0]}` }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ borderRadius: radius, background: `radial-gradient(60% 50% at 50% 60%, #fff3cf, ${th.trim}55 55%, transparent 80%)` }}
          animate={{ opacity: open ? [0, 1, 0] : 0 }}
          transition={{ duration: 2.4, delay: 0.3 }}
        />
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: radius, perspective: '1100px' }}>
          {leaf('left')}
          {leaf('right')}
        </div>
        {/* Carved surround. */}
        <div
          className="pointer-events-none absolute -inset-[3.2cqw]"
          style={{
            borderRadius: arch ? '50% 50% 0 0 / 36% 36% 0 0' : 8,
            border: `3.2cqw solid ${th.dark ? '#5b3a1e' : arch ? '#e9d6b8' : '#8a5a2e'}`,
            borderBottom: 'none',
            boxShadow: `inset 0 0 0 2px ${th.trim}99, 0 0 0 2px ${th.trim}66, 0 20px 50px rgba(0,0,0,0.35)`,
          }}
        />
      </div>

      {/* Wall dressing: wash of light, toran or blooms over the door, lamps or kolam at its foot. */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 45% at 50% 48%, transparent 40%, ${wall[1]}cc 100%)` }} />
      {arch ? (
        <>
          <Cluster th={th} size="44cqw" corner="tl" seed={3} style={{ top: '9cqh', left: '2cqw' }} />
          <Cluster th={th} size="44cqw" corner="tr" seed={8} style={{ top: '9cqh', right: '2cqw' }} />
          <Cluster th={th} size="34cqw" corner="bl" seed={5} style={{ bottom: '13cqh', left: '0' }} />
          <Cluster th={th} size="34cqw" corner="br" seed={11} style={{ bottom: '13cqh', right: '0' }} />
          {th.finale === 'lanterns' && (
            <>
              <div className="st-swing absolute left-[6cqw] top-[22cqh]" style={{ transformOrigin: 'top center' }}><div className="mx-auto h-[8cqh] w-px" style={{ background: th.trim }} /><Lantern size="9cqw" color={th.trim} /></div>
              <div className="st-swing absolute right-[6cqw] top-[22cqh]" style={{ transformOrigin: 'top center', animationDelay: '-1.2s' }}><div className="mx-auto h-[8cqh] w-px" style={{ background: th.trim }} /><Lantern size="9cqw" color={th.trim} /></div>
            </>
          )}
        </>
      ) : (
        <>
          <Toran th={th} className="absolute left-[10cqw] top-[15.5cqh] h-[9cqh] w-[80cqw]" />
          <div className="absolute inset-x-[3cqw] bottom-[2cqh] flex justify-between">
            <Kolam color={th.dark ? '#f6efe2' : '#ffffff'} size="19cqw" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }} />
            <Kolam color={th.dark ? '#f6efe2' : '#ffffff'} size="19cqw" delay={0.4} style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }} />
          </div>
        </>
      )}
    </motion.div>
  )
}

// ─── Silk curtains ──────────────────────────────────────────────────────────

function Curtains({ th, open, initials }: { th: StoryTheme; open: boolean; initials: [string, string] }) {
  const [base, dark, light] = th.shell
  const silk = `repeating-linear-gradient(90deg, ${dark} 0, ${base} 2.2%, ${light} 4.6%, ${base} 7%, ${dark} 9.4%)`
  const zari = `repeating-linear-gradient(45deg, ${th.trim} 0 6px, ${shade(th.trim, -0.35)} 6px 9px), ${th.trim}`
  const half = (side: 'left' | 'right') => (
    <motion.div
      className="absolute inset-y-0 w-[53%]"
      style={{ [side]: 0, transformOrigin: `${side} top`, background: silk, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
      animate={open ? { scaleX: 0.16, skewY: side === 'left' ? -2 : 2 } : { scaleX: 1, skewY: 0 }}
      transition={{ duration: 1.7, delay: 0.35, ease: EASE }}
    >
      {/* Zari: a broad border along the hem and a narrow one down the inner edge. */}
      <div className="absolute inset-x-0 bottom-0 h-[11cqh]" style={{ background: zari, boxShadow: `inset 0 3px 0 ${shade(th.trim, 0.4)}, inset 0 -3px 0 ${shade(th.trim, -0.4)}` }}>
        <div className="absolute inset-x-0 top-[30%] h-[40%]" style={{ background: `radial-gradient(circle at 50% 50%, ${dark} 0 34%, transparent 36%) 0 0 / 7cqw 100%` }} />
      </div>
      <div className="absolute inset-y-0 w-[3.5cqw]" style={{ [side === 'left' ? 'right' : 'left']: 0, background: zari }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 30%, rgba(0,0,0,0.25))' }} />
    </motion.div>
  )
  return (
    <div className="absolute inset-0">
      {half('left')}
      {half('right')}
      {/* Pelmet with scalloped hem and tassels; it lifts away as the curtains part. */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[13cqh]"
        style={{ background: `linear-gradient(180deg, ${dark}, ${base})`, boxShadow: '0 10px 24px rgba(0,0,0,0.45)' }}
        animate={{ y: open ? '-110%' : 0 }}
        transition={{ duration: 1, delay: 1.1, ease: EASE }}
      >
        <div className="absolute inset-x-0 bottom-[-3cqh] h-[3.2cqh]" style={{ background: `radial-gradient(circle at 50% 0, ${th.trim} 0 46%, transparent 48%) 0 0 / 8.33cqw 100%` }} />
        <div className="absolute inset-x-0 bottom-[1.5cqh] h-[0.6cqh]" style={{ background: th.trim }} />
      </motion.div>
      {/* Tie-back with the couple's initials. */}
      <motion.div
        className="absolute left-1/2 top-[44cqh] flex -translate-x-1/2 flex-col items-center"
        animate={open ? { y: '-30cqh', opacity: 0, scale: 0.7 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <div className="h-[16cqh] w-[2px]" style={{ background: th.trim }} />
        <div
          className="st-swing flex h-[24cqw] w-[24cqw] items-center justify-center rounded-full"
          style={{ transformOrigin: '50% -16cqh', background: `radial-gradient(circle at 35% 30%, ${shade(th.trim, 0.45)}, ${th.trim} 50%, ${shade(th.trim, -0.35)})`, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
        >
          <span style={{ fontFamily: `${th.script}, cursive`, fontSize: '8cqw', color: dark }}>{initials[0]}&amp;{initials[1]}</span>
        </div>
        <div className="mt-1 h-[9cqh] w-[5cqw]" style={{ background: `repeating-linear-gradient(90deg, ${th.trim} 0 2px, ${shade(th.trim, -0.4)} 2px 3px)`, clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)' }} />
      </motion.div>
    </div>
  )
}

// ─── Marigold strings ───────────────────────────────────────────────────────

function Strings({ th, open }: { th: StoryTheme; open: boolean }) {
  const n = 13
  const blooms = 22
  return (
    <div className="absolute inset-0" style={{ background: `radial-gradient(80% 60% at 50% 40%, ${shade(th.shell[2], 0.5)}, ${th.shell[0]})` }}>
      <div className="absolute inset-x-0 top-[2cqh] z-10 h-[1.6cqh] rounded-full" style={{ background: `linear-gradient(180deg, ${shade(th.trim, 0.3)}, ${th.trim}, ${shade(th.trim, -0.4)})`, boxShadow: '0 4px 10px rgba(0,0,0,0.35)' }} />
      {Array.from({ length: n }, (_, i) => {
        const p = i / (n - 1)
        const to = p < 0.5 ? p * 0.22 : 0.78 + (p - 0.5) * 0.44
        const far = Math.abs(p - 0.5)
        return (
          <motion.div
            key={i}
            className="absolute top-[3cqh] flex h-[97cqh] w-[8cqw] -translate-x-1/2 flex-col items-center"
            style={{ left: `${4 + p * 92}%` }}
            animate={open ? { left: `${4 + to * 92}%`, rotate: p < 0.5 ? 4 : -4 } : { left: `${4 + p * 92}%`, rotate: 0 }}
            transition={{ duration: 1.5, delay: 0.25 + (0.5 - far) * 0.5, ease: EASE }}
          >
            <div className="st-swing flex h-full flex-col items-center" style={{ transformOrigin: 'top center', animationDelay: `${-rnd(i) * 3}s`, animationDuration: `${3 + rnd(i + 4) * 2}s` }}>
              <div className="absolute inset-y-0 w-px" style={{ background: '#6b3a10' }} />
              {Array.from({ length: blooms }, (_, j) => {
                const c = (i + j) % 3 === 0 ? th.petal[1] : th.petal[0]
                return (
                  <span
                    key={j}
                    className="relative -mb-[0.8cqh] block h-[7cqw] w-[7cqw] shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 45% 40%, ${shade(c, 0.35)} 0 18%, ${c} 40%, ${shade(c, -0.3)} 100%)`,
                      boxShadow: `inset 0 0 0 1.5px ${shade(c, -0.15)}, 0 2px 3px rgba(0,0,0,0.25)`,
                      outline: `1px dashed ${shade(c, -0.25)}`, outlineOffset: '-3px',
                    }}
                  />
                )
              })}
              <span className="mt-1 block h-[3cqw] w-[3cqw] rotate-45" style={{ background: th.leaf }} />
              <span className="block h-[4cqw] w-[3.4cqw] rounded-b-full" style={{ background: `linear-gradient(90deg, ${shade(th.trim, -0.4)}, #e9b949, ${shade(th.trim, -0.4)})` }} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Gatefold ───────────────────────────────────────────────────────────────

function GateFace({ th }: { th: StoryTheme }) {
  const [base, dark, light] = th.shell
  const pattern: Record<StoryTheme['gate'], CSSProperties> = {
    lotus: { backgroundImage: `radial-gradient(circle at 50% 50%, ${light} 0 18%, transparent 19%), radial-gradient(circle at 0 0, ${shade(base, 0.15)} 0 12%, transparent 13%)`, backgroundSize: '12cqw 12cqw' },
    peacock: {
      backgroundImage: `radial-gradient(ellipse 18% 24% at 50% 52%, #1b2e7a 0 36%, #2bb3a6 40% 58%, ${th.trim} 62% 70%, transparent 74%)`,
      backgroundSize: '14cqw 18cqw',
    },
    kolam: { backgroundImage: `radial-gradient(circle, ${th.trim} 0 1.2px, transparent 1.6px)`, backgroundSize: '6cqw 6cqw' },
    none: {},
  }
  return (
    <>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${light}, ${base} 40%, ${dark})` }} />
      <div className="absolute inset-0 opacity-60" style={pattern[th.gate]} />
      <div className="absolute inset-[4cqw] rounded-[2cqw]" style={{ border: `1.5px solid ${th.trim}`, boxShadow: `inset 0 0 0 4px transparent, inset 0 0 0 5px ${th.trim}66` }} />
    </>
  )
}

function Gatefold({ th, open, initials }: { th: StoryTheme; open: boolean; initials: [string, string] }) {
  const panel = (side: 'left' | 'right') => (
    <motion.div
      className="absolute inset-y-0 w-1/2 overflow-hidden"
      style={{ [side]: 0, transformOrigin: `${side} center`, boxShadow: '0 0 30px rgba(0,0,0,0.35)' }}
      animate={open ? { rotateY: side === 'left' ? -88 : 88, opacity: [1, 1, 0] } : { rotateY: 0, opacity: 1 }}
      transition={{ duration: 1.7, delay: 0.6, ease: EASE, opacity: { duration: 1.7, delay: 0.6, times: [0, 0.8, 1] } }}
    >
      <div className="absolute inset-y-0 w-[200%]" style={{ [side]: 0 }}>
        <GateFace th={th} />
        {th.gate === 'lotus' && (
          <>
            <Cluster th={th} size="46cqw" corner="tl" seed={2} />
            <Cluster th={th} size="46cqw" corner="br" seed={6} />
            <Cluster th={th} size="30cqw" corner="tr" seed={9} />
            <Cluster th={th} size="30cqw" corner="bl" seed={4} />
          </>
        )}
        {th.gate === 'kolam' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Kolam color={th.trim} size="64cqw" delay={0.3} />
          </div>
        )}
      </div>
      <div className="absolute inset-y-0 w-[1.5cqw]" style={{ [side === 'left' ? 'right' : 'left']: 0, background: `linear-gradient(90deg, ${shade(th.trim, -0.3)}, ${th.trim}, ${shade(th.trim, -0.3)})` }} />
      <motion.div className="absolute inset-0" animate={open ? { scale: [1, 1.06, 1] } : {}} transition={{ duration: 0.5 }}>
        <HalfMedallion th={th} initials={initials} half={side} size="30cqw" />
      </motion.div>
    </motion.div>
  )
  return (
    <div className="absolute inset-0" style={{ perspective: '1000px' }}>
      {panel('left')}
      {panel('right')}
    </div>
  )
}

// ─── Envelope ───────────────────────────────────────────────────────────────

function Envelope({ th, open, initials, names, lang }: { th: StoryTheme; open: boolean; initials: [string, string]; names: [string, string]; lang: Lang }) {
  const [base, dark, light] = th.shell
  const [flapBack, setFlapBack] = useState(false)
  useEffect(() => {
    if (!open) return setFlapBack(false)
    const id = window.setTimeout(() => setFlapBack(true), 1000)
    return () => window.clearTimeout(id)
  }, [open])
  const liner = `radial-gradient(circle at 50% 50%, ${th.trim} 0 1.4px, transparent 1.8px) 0 0 / 14px 14px, radial-gradient(circle at 50% 50%, ${th.trim}66 0 5px, transparent 5.5px) 7px 7px / 14px 14px, ${th.paper.startsWith('rgba') ? '#fbf6ec' : th.paper}`
  const seal = (half: 'left' | 'right') => (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ clipPath: half === 'left' ? 'polygon(0 0, 52% 0, 46% 50%, 54% 100%, 0 100%)' : 'polygon(52% 0, 100% 0, 100% 100%, 54% 100%, 46% 50%)' }}
      animate={open ? { x: half === 'left' ? -18 : 18, y: 60, rotate: half === 'left' ? -28 : 28, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeIn' }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full"
        style={{ background: `radial-gradient(circle at 38% 32%, ${shade(th.seal, 0.35)}, ${th.seal} 52%, ${shade(th.seal, -0.4)})`, boxShadow: `inset 0 0 0 0.9cqw ${shade(th.seal, -0.18)}, inset 0 0 0 1.5cqw ${shade(th.seal, 0.12)}` }}
      >
        <span style={{ fontFamily: `${th.script}, cursive`, fontSize: '6.4cqw', color: shade(th.seal, -0.55), textShadow: `0 1px 0 ${shade(th.seal, 0.4)}` }}>{initials[0]}{initials[1]}</span>
      </div>
    </motion.div>
  )
  return (
    <div className="absolute inset-0" style={{ background: th.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(60% 40% at 50% 50%, ${th.dark ? 'rgba(255,240,200,0.12)' : 'rgba(255,255,255,0.7)'}, transparent 70%)` }} />
      {th.finale === 'stars' && Array.from({ length: 30 }, (_, i) => (
        <span key={i} className="st-twinkle absolute rounded-full bg-white" style={{ left: `${rnd(i) * 100}%`, top: `${rnd(i + 40) * 100}%`, width: 2 + rnd(i + 3) * 2, height: 2 + rnd(i + 3) * 2, animationDelay: `${rnd(i + 9) * 4}s` }} />
      ))}
      <p className="absolute inset-x-0 top-[17cqh] text-center text-[3.4cqw] uppercase tracking-[0.35em]" style={{ color: th.muted, fontFamily: `${th.serif}, serif` }}>
        {copy.invited[lang]}
      </p>
      <motion.div
        className="absolute left-1/2 top-1/2 h-[60cqw] w-[86cqw]"
        style={{ x: '-50%', y: '-50%', perspective: '900px' }}
        animate={open ? { y: ['-50%', '-50%', '40%'], opacity: [1, 1, 0] } : { y: '-50%', opacity: 1 }}
        transition={{ duration: 3.2, times: [0, 0.6, 1], ease: 'easeIn' }}
      >
        <div className={open ? undefined : 'st-float'} style={{ position: 'absolute', inset: 0 }}>
          {/* Back and liner. */}
          <div className="absolute inset-0 rounded-[2cqw]" style={{ background: `linear-gradient(160deg, ${dark}, ${base})`, boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }} />
          {/* The card, rising out once the flap is up. */}
          <motion.div
            className="absolute inset-x-[5%] top-[6%] flex h-[88%] flex-col items-center justify-center rounded-[1.4cqw] text-center"
            style={{ background: th.paper.startsWith('rgba') ? '#fbf6ec' : th.paper, boxShadow: '0 4px 14px rgba(0,0,0,0.2)', color: th.dark ? '#2a1c10' : th.ink, zIndex: 1 }}
            animate={open ? { y: ['0%', '0%', '-62%', '-62%'], scale: [1, 1, 1.04, 1.6], opacity: [1, 1, 1, 0] } : { y: '0%', scale: 1, opacity: 1 }}
            transition={{ duration: 3.2, times: [0, 0.34, 0.62, 1], ease: EASE }}
          >
            <span style={{ fontFamily: `${th.script}, cursive`, fontSize: '8cqw', lineHeight: 1.1 }}>{names[0]}</span>
            <span style={{ fontFamily: `${th.serif}, serif`, fontSize: '3cqw', letterSpacing: '0.2em' }}>&amp;</span>
            <span style={{ fontFamily: `${th.script}, cursive`, fontSize: '8cqw', lineHeight: 1.1 }}>{names[1]}</span>
            <span className="mt-1 uppercase" style={{ fontSize: '2.3cqw', letterSpacing: '0.24em', opacity: 0.6 }}>{copy.weds[lang]}</span>
          </motion.div>
          {/* Front pocket. */}
          <div
            className="absolute inset-0 rounded-[2cqw]"
            style={{
              zIndex: 2,
              background: `linear-gradient(200deg, ${light}, ${base} 50%, ${dark})`,
              clipPath: 'polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)',
              boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)',
            }}
          >
            <div className="absolute inset-0" style={{ background: `linear-gradient(32deg, transparent 49.6%, ${shade(base, -0.25)} 50%, transparent 50.6%), linear-gradient(-32deg, transparent 49.6%, ${shade(base, -0.25)} 50%, transparent 50.6%)` }} />
          </div>
          {/* Flap: outside face and liner face. */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[62%]"
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d', zIndex: flapBack ? 0 : 4 }}
            animate={{ rotateX: open ? 178 : 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
          >
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${light}, ${base})`, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backfaceVisibility: 'hidden', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))' }} />
            <div className="absolute inset-0" style={{ background: liner, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transform: 'rotateX(180deg)', backfaceVisibility: 'hidden' }} />
          </motion.div>
          {/* Wax seal on the flap's tip; it cracks in two. */}
          <div className="absolute left-1/2 top-[62%] z-[5] h-[17cqw] w-[17cqw] -translate-x-1/2 -translate-y-1/2" style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.4))' }}>
            {seal('left')}
            {seal('right')}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
