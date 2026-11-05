import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { Icon } from '../../../components/Icon'
import { Qr } from '../../../components/Qr'
import { LangToggle } from '../../../components/layout/Nav'
import type { Lang } from '../../../lib/i18n'
import { dateParts, directionsUrl, rsvpUrl, timeLabel, type Invite } from '../../../lib/invite'
import { FortuneCookie, MapSheet, Sheet, labels } from '../Invite'
import { ensureFonts, textureUrl } from '../themes'
import { Cluster, Invocation, Rule } from './motifs'
import { Opener } from './openers'
import { Ambient, Couple, Events, Finale, Hero, Rsvp, SaveTheDate, ScrollRoot, Venue } from './sections'
import { sheetStyle, shade, storyFonts, storyTheme, type StoryTheme } from './theme'

/*
 * One invite, two layouts. `story`: the opener, then the scrolling page.
 * `card`: the single still card, paper-craft blooms round the edges, the
 * guest's actions under it; with `still` it is the PNG (directions QR in place
 * of the buttons, no motion). `size` fixes the stage (builder preview, PNG);
 * without it the stage fills the screen, phone-width on wide screens.
 */

const chrome = {
  replay: { en: 'Replay', ta: 'மீண்டும்' },
  sample: { en: 'Sample invite', ta: 'மாதிரி அழைப்பிதழ்' },
  request: { en: 'We request the pleasure of your presence at the wedding celebration of', ta: 'இருவீட்டார் ஆசியுடன் நடைபெறும் திருமண விழாவிற்கு அன்புடன் அழைக்கிறோம்' },
  muhurtham: { en: 'Muhurtham', ta: 'முகூர்த்தம்' },
  directions: { en: 'Directions', ta: 'வழி' },
  rsvp: { en: 'RSVP', ta: 'வருகை' },
  map: { en: 'Map', ta: 'வரைபடம்' },
  share: { en: 'Share', ta: 'பகிர்' },
  scan: { en: 'Scan for directions', ta: 'வழிக்கு ஸ்கேன் செய்யவும்' },
}

export interface StoryProps {
  invite: Invite
  lang: Lang
  sample?: boolean
  size?: { w: number; h: number }
  still?: boolean
  art?: string
  share?: ReactNode
  onReady?: () => void
}

export function StoryInvite({ invite, lang, sample = false, size, still = false, art, share, onReady }: StoryProps) {
  const th = storyTheme(invite.theme)
  const reduce = !!useReducedMotion()
  const card = still || invite.layout === 'card'
  const [opened, setOpened] = useState(card || reduce)
  // The page starts playing on the tap, so the names write themselves in behind the opening doors.
  const [started, setStarted] = useState(card || reduce)
  const [round, setRound] = useState(0)
  const [sheet, setSheet] = useState<'map' | 'cookie' | 'share' | null>(null)
  const [dock, setDock] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: scroller })
  useMotionValueEvent(scrollY, 'change', y => setDock(y > (scroller.current?.clientHeight ?? 600) * 0.7))
  const t = labels(lang)
  const s = sheetStyle(th)

  useEffect(() => {
    let live = true
    const fonts = storyFonts(th)
    if (invite.tradition === 'muslim') fonts.push('Amiri')
    void ensureFonts(fonts).then(() => live && onReady?.())
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite.theme, invite.tradition])

  // The builder swaps layouts and designs in place; start each one closed again.
  useEffect(() => {
    setOpened(card || reduce)
    setStarted(card || reduce)
    scroller.current?.scrollTo({ top: 0 })
  }, [invite.theme, card, reduce])

  const replay = () => {
    scroller.current?.scrollTo({ top: 0 })
    setOpened(false)
    setStarted(false)
    setRound(r => r + 1)
  }

  const rootStyle: CSSProperties = size ? { width: size.w, height: size.h } : { width: '100%', height: '100svh' }
  const stageW = size ? '100%' : card ? 'min(100vw, 56.25svh)' : 'min(100vw, 480px)'
  const rsvp = rsvpUrl(invite, lang)

  return (
    <div className="relative isolate overflow-hidden" style={{ ...rootStyle, background: th.dark ? '#0b0806' : shade(th.shell[1], -0.55) }}>
      {!size && <div className="absolute inset-0 opacity-60" style={{ background: th.bg, filter: 'blur(40px) saturate(1.2)' }} />}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ width: stageW, containerType: 'size', background: th.bg, color: th.ink, boxShadow: size ? undefined : '0 0 80px rgba(0,0,0,0.5)' }}
      >
        <div
          ref={scroller}
          data-lenis-prevent
          className={`absolute inset-0 ${opened && !card ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'}`}
          style={{ fontSize: 'clamp(13px, 4cqw, 18px)', scrollbarWidth: 'none' }}
        >
          <ScrollRoot.Provider value={scroller}>
            {card ? (
              <Card th={th} invite={invite} lang={lang} still={still} />
            ) : (
              <div key={round}>
                <Hero th={th} invite={invite} lang={lang} play={started} />
                {opened && (
                  <>
                    <Couple th={th} invite={invite} lang={lang} art={art} />
                    <SaveTheDate th={th} invite={invite} lang={lang} still={still} />
                    <Events th={th} invite={invite} lang={lang} />
                    <Venue th={th} invite={invite} lang={lang} onMap={() => setSheet('map')} />
                    <Rsvp th={th} invite={invite} lang={lang} />
                    <Finale th={th} invite={invite} lang={lang} onShare={share ? () => setSheet('share') : undefined} onFortune={() => setSheet('cookie')} />
                  </>
                )}
              </div>
            )}
          </ScrollRoot.Provider>
        </div>

        {!still && opened && !reduce && <Ambient th={th} />}

        {/* Card layout: the guest's actions under the card. */}
        {card && !still && (
          <div className="absolute inset-x-0 bottom-[2.2cqh] z-30 flex justify-center gap-[2cqw] px-[4cqw]">
            {[
              { k: 'directions', icon: 'mapPin' as const, href: directionsUrl(invite) },
              ...(rsvp ? [{ k: 'rsvp', icon: 'whatsapp' as const, href: rsvp }] : []),
              { k: 'map', icon: 'grid' as const, on: () => setSheet('map') },
              ...(share ? [{ k: 'share', icon: 'share' as const, on: () => setSheet('share') }] : []),
            ].map(b => {
              const body = <><Icon name={b.icon} size={15} /><span>{chrome[b.k as keyof typeof chrome][lang]}</span></>
              const cls = 'flex h-[9.5cqw] max-h-11 items-center gap-1.5 rounded-full px-[3.6cqw] text-[clamp(11px,3.2cqw,13px)] font-semibold shadow-lg backdrop-blur-md cursor-pointer'
              const st = { background: b.k === 'directions' ? th.accent : th.dark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.8)', color: b.k === 'directions' ? th.onAccent : th.ink }
              return 'href' in b
                ? <a key={b.k} href={b.href} target="_blank" rel="noreferrer" className={cls} style={st}>{body}</a>
                : <button key={b.k} type="button" onClick={b.on} className={cls} style={st}>{body}</button>
            })}
          </div>
        )}

        {/* Story: a slim dock once the guest scrolls past the names. */}
        {!card && !still && (
          <AnimatePresence>
            {opened && dock && (
              <motion.div
                className="absolute bottom-[2.4cqh] left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full p-1 shadow-xl backdrop-blur-md"
                style={{ background: th.dark ? 'rgba(10,6,4,0.6)' : 'rgba(255,255,255,0.78)', border: `1px solid ${th.line}` }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              >
                <a href={directionsUrl(invite)} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold" style={{ background: th.accent, color: th.onAccent }}>
                  <Icon name="mapPin" size={15} />{chrome.directions[lang]}
                </a>
                {rsvp && <a href={rsvp} target="_blank" rel="noreferrer" aria-label={chrome.rsvp[lang]} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ color: th.ink }}><Icon name="whatsapp" size={17} /></a>}
                {share && <button type="button" onClick={() => setSheet('share')} aria-label={chrome.share[lang]} className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer" style={{ color: th.ink }}><Icon name="share" size={17} /></button>}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!card && (
          <AnimatePresence>
            {!opened && <Opener key={round} th={th} invite={invite} lang={lang} onStart={() => setStarted(true)} onOpened={() => setOpened(true)} />}
          </AnimatePresence>
        )}

        {/* Chrome. */}
        {!still && (
          <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
            <div className="flex items-center gap-2">
              {sample && <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[10.5px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">{chrome.sample[lang]}</span>}
            </div>
            <div className="flex items-center gap-2">
              {!card && opened && !reduce && (
                <button type="button" onClick={replay} className="flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 text-[11.5px] text-white/90 backdrop-blur-md cursor-pointer">
                  <Icon name="refresh" size={13} />{chrome.replay[lang]}
                </button>
              )}
              {!size && <LangToggle dark />}
            </div>
          </header>
        )}

        <AnimatePresence>
          {sheet === 'map' && <Sheet s={s} label={t.map} t={t} onClose={() => setSheet(null)}><MapSheet invite={invite} s={s} t={t} lang={lang} /></Sheet>}
          {sheet === 'cookie' && <Sheet s={s} label={t.cookie} t={t} onClose={() => setSheet(null)}><FortuneCookie labels={t} lang={lang} s={s} /></Sheet>}
          {sheet === 'share' && share && <Sheet s={s} label={t.share} t={t} onClose={() => setSheet(null)}>{share}</Sheet>}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── The still card ─────────────────────────────────────────────────────────

/** The single card: paper panel, blooms bursting over its corners, the whole invitation on one face. */
function Card({ th, invite, lang, still }: { th: StoryTheme; invite: Invite; lang: Lang; still: boolean }) {
  const p = dateParts(invite.date, lang)
  const live = !still
  const names = invite[lang]
  const paper = th.dark ? shade(th.shell[1], -0.2) : th.paper.startsWith('rgba') ? '#fffaf2' : th.paper
  const enter = (delay: number) => live ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.9 } } : {}
  const name = (n: string, delay: number) => (
    <motion.p {...enter(delay)} className={live ? 'st-foil leading-[1.12]' : 'leading-[1.12]'}
      style={{
        fontFamily: `${th.script}, ${th.ta}, cursive`, fontSize: 'min(12.5cqw, 7.4cqh)', color: th.accent,
        ...(live ? { backgroundImage: `linear-gradient(100deg, ${th.accent}, ${shade(th.accent, 0.45)} 30%, ${th.accent} 50%, ${shade(th.accent, -0.2)})`, backgroundSize: '220% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {}),
      }}>
      {n}
    </motion.p>
  )
  return (
    <div className="relative h-[100cqh] w-full overflow-hidden" style={{ fontSize: 'min(3.7cqw, 2.1cqh)' }}>
      {th.art.frame && <img src={th.art.frame} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {!th.art.frame && (
        <div
          className="absolute inset-[5cqw_6cqw_13cqh] rounded-[3cqw]"
          style={{ background: `url("${textureUrl('paper')}"), ${paper}`, boxShadow: `0 24px 60px -20px rgba(0,0,0,0.55), inset 0 0 0 1.6cqw ${paper}, inset 0 0 0 calc(1.6cqw + 1.5px) ${th.trim}, inset 0 0 0 calc(2.4cqw + 1.5px) ${paper}, inset 0 0 0 calc(2.4cqw + 2.5px) ${th.trim}88` }}
        />
      )}
      {!th.art.frame && (
        <>
          <Cluster th={th} size="58cqw" corner="tl" seed={2} live={live} />
          <Cluster th={th} size="58cqw" corner="br" seed={7} live={live} delay={0.3} style={{ bottom: '9cqh' }} />
          <Cluster th={th} size="28cqw" corner="tr" seed={11} live={live} delay={0.6} />
          <Cluster th={th} size="28cqw" corner="bl" seed={4} live={live} delay={0.8} style={{ bottom: '9cqh' }} />
        </>
      )}
      <div className="absolute inset-[11cqw_14cqw_18cqh] flex flex-col items-center justify-center text-center" style={{ color: th.dark ? '#2a1c10' : th.ink }}>
        <motion.div {...enter(0.2)} className="mb-[0.9em]">
          <Invocation tradition={invite.tradition} lang={lang} color={th.accent} muted={th.dark ? '#6b5a48' : th.muted} serif={th.serif} />
        </motion.div>
        <motion.p {...enter(0.35)} className="mb-[0.8em] max-w-[20em] text-[0.82em] leading-snug" style={{ color: th.dark ? '#6b5a48' : th.muted, fontFamily: lang === 'ta' ? undefined : `${th.serif}, serif` }}>
          {chrome.request[lang]}
        </motion.p>
        {name(names[0], 0.5)}
        <motion.p {...enter(0.7)} style={{ fontFamily: `${th.script}, cursive`, fontSize: '1.8em', color: th.dark ? '#2a1c10' : th.ink }}>&amp;</motion.p>
        {name(names[1], 0.85)}
        {invite.parents?.[lang] && <motion.p {...enter(1)} className="mt-[0.6em] max-w-[20em] text-[0.78em] leading-snug" style={{ color: th.dark ? '#6b5a48' : th.muted }}>{invite.parents[lang]}</motion.p>}
        <motion.div {...enter(1.15)} className="mt-[0.9em] flex flex-col items-center gap-[0.35em]">
          <Rule color={th.accent} width="7em" />
          <p className="text-[0.92em] uppercase tracking-[0.2em]" style={{ fontFamily: `${th.serif}, serif` }}>{p.weekday}</p>
          <p className="text-[1.05em] uppercase tracking-[0.16em]" style={{ fontFamily: `${th.serif}, serif`, color: th.accent }}>{p.day} {p.month} {p.year}</p>
          {invite.time && <p className="text-[0.8em]">{chrome.muhurtham[lang]} · {timeLabel(invite.time, lang)}</p>}
          <p className="mt-[0.3em] text-[0.92em] font-semibold" style={{ fontFamily: `${th.serif}, serif` }}>{invite.venue}</p>
          {invite.address && <p className="max-w-[20em] text-[0.74em] leading-snug" style={{ color: th.dark ? '#6b5a48' : th.muted }}>{invite.address}</p>}
        </motion.div>
      </div>
      {still && (
        <div className="absolute inset-x-0 bottom-[2.5cqh] flex items-center justify-center gap-3">
          <Qr text={directionsUrl(invite)} size={70} color="#1c1208" background="#ffffff" label={chrome.scan[lang]} className="rounded-md bg-white p-1" />
          <p className="max-w-[9em] text-[11px] leading-snug" style={{ color: th.dark ? '#f3e6cf' : th.ink }}>{chrome.scan[lang]}</p>
        </div>
      )}
    </div>
  )
}

/** Picker thumbnail: the opener's material, a corner of blooms, the initials. */
export function StoryThumb({ theme, initials }: { theme: Invite['theme']; initials: string }) {
  const th = storyTheme(theme)
  const [base, dark, light] = th.shell
  const face: Record<StoryTheme['opener'], CSSProperties> = {
    doors: { background: `linear-gradient(90deg, ${dark}, ${base} 12%, ${light} 48%, ${dark} 50%, ${light} 52%, ${base} 88%, ${dark})` },
    arch: { background: `linear-gradient(90deg, ${dark}, ${light} 48%, ${dark} 50%, ${light} 52%, ${dark})`, borderRadius: '50% 50% 0 0 / 30% 30% 0 0', inset: '10% 14% 0' },
    curtains: { background: `repeating-linear-gradient(90deg, ${dark} 0, ${base} 4%, ${light} 8%, ${base} 12%, ${dark} 16%)` },
    strings: { background: `radial-gradient(circle, ${th.petal[0]} 0 40%, transparent 44%) 0 0 / 22% 9%, ${shade(light, 0.4)}` },
    gates: { background: `linear-gradient(90deg, ${base}, ${light} 49%, ${th.trim} 49.5% 50.5%, ${light} 51%, ${base})` },
    envelope: { background: `linear-gradient(160deg, ${light}, ${base})` },
  }
  return (
    <span className="absolute inset-0 overflow-hidden" style={{ background: th.bg, containerType: 'size' }}>
      <span className="absolute inset-0" style={face[th.opener]} />
      {th.opener === 'envelope' && <span className="absolute inset-x-0 top-0 h-[55%]" style={{ background: `linear-gradient(180deg, ${light}, ${base})`, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(1.08)' }} />}
      <Cluster th={th} size="62cqw" corner="tl" seed={2} live={false} />
      <span className="absolute left-1/2 top-1/2 flex h-[34cqw] w-[34cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
        style={{ background: `radial-gradient(circle at 35% 30%, ${shade(th.trim, 0.45)}, ${th.trim} 50%, ${shade(th.trim, -0.35)})`, boxShadow: '0 3px 8px rgba(0,0,0,0.4)', fontFamily: `${th.script}, cursive`, fontSize: '13cqw', color: shade(th.trim, -0.6) }}>
        {initials.replace(/\s/g, '')}
      </span>
    </span>
  )
}
