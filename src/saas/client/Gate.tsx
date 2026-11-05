import { useState, type FormEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Icon } from '../../components/Icon'
import { EASE } from '../../components/motion'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { StudioMark } from '../theme'
import type { Proof, Studio, StudioEvent } from '../types'
import { fill, gateCopy, submitCopy } from './copy'
import { waLink } from './logic'
import { AccentButton, LangToggle, Notice, ProofImg } from './ui'

/** Entry screen and the "can't open" notices for /s/:code. Studio brand only. */

export function GateFrame({ studio, children, onLang }: { studio?: Studio; children: ReactNode; onLang?: (l: string) => void }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-white text-ink">
      <header className="flex items-center justify-between gap-3 px-4 py-4 md:px-8">
        {studio ? (
          <span className="flex min-w-0 items-center gap-3">
            <StudioMark studio={studio} size={36} />
            <span className="truncate font-display text-[17px] font-medium">{studio.name}</span>
          </span>
        ) : (
          <span />
        )}
        <LangToggle onPick={onLang} />
      </header>
      <main className="flex flex-1 items-center justify-center">{children}</main>
    </div>
  )
}

export function NotFound() {
  const t = useT(gateCopy)
  return (
    <GateFrame>
      <Notice icon="search" title={t.notFoundTitle} body={t.notFoundBody} />
    </GateFrame>
  )
}

export function Paused({ studio, event }: { studio: Studio; event: StudioEvent }) {
  const t = useT(gateCopy)
  const s = useT(submitCopy)
  return (
    <GateFrame studio={studio}>
      <Notice icon="pause" title={t.pausedTitle} body={t.pausedBody}>
        <WaButton href={waLink(studio.whatsapp, fill(s.pausedMsg, { title: event.title }))}>{t.contactStudio}</WaButton>
      </Notice>
    </GateFrame>
  )
}

/** The studio switched this feature off for the customer (Project.features). */
export function NotEnabled({ studio }: { studio: Studio }) {
  const t = useT(gateCopy)
  return (
    <GateFrame studio={studio}>
      <Notice icon="lock" title={t.notEnabledTitle} body={t.notEnabledBody}>
        <WaButton href={waLink(studio.whatsapp, '')}>{t.contactStudio}</WaButton>
      </Notice>
    </GateFrame>
  )
}

export function NotReady({ studio }: { studio: Studio }) {
  const t = useT(gateCopy)
  return (
    <GateFrame studio={studio}>
      <Notice icon="camera" title={t.notReadyTitle} body={t.notReadyBody} />
    </GateFrame>
  )
}

export function Archived({ studio, event }: { studio: Studio; event: StudioEvent }) {
  const t = useT(gateCopy)
  return (
    <GateFrame studio={studio}>
      <Notice icon="lock" title={t.closedTitle} body={t.archivedBody}>
        <WaButton href={waLink(studio.whatsapp, event.title)}>{t.contactStudio}</WaButton>
      </Notice>
    </GateFrame>
  )
}

function WaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--accent-ink)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]"
    >
      <Icon name="whatsapp" size={17} />
      {children}
    </a>
  )
}

export function Gate({ studio, event, cover, count, defaultName, graceDays, onEnter, onLang }: { studio: Studio; event: StudioEvent; cover?: Proof; count: number; defaultName: string; graceDays: number; onEnter: (pin: string | undefined, name: string) => boolean | Promise<boolean>; onLang: (l: string) => void }) {
  const t = useT(gateCopy)
  const lang = useLang()
  const [pin, setPin] = useState('')
  const [name, setName] = useState(defaultName)
  const [wrong, setWrong] = useState(false)
  const canChoose = event.status === 'open'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void Promise.resolve(onEnter(event.pin ? pin : undefined, name)).then(ok => {
      setWrong(!ok)
      if (!ok) setPin('')
    })
  }

  return (
    <GateFrame studio={studio} onLang={onLang}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="w-full max-w-md px-5 py-8">
        {cover && (
          <div className="relative mb-7 overflow-hidden rounded-[24px] bg-ink/[0.05]" style={{ aspectRatio: '4 / 3' }}>
            <ProofImg proof={cover} size="full" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-4 text-[12px] font-medium text-white/90">
              {count} {t.photos}
            </span>
          </div>
        )}
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{t.welcome}</p>
        <h1 className="mt-2 text-balance font-display text-[32px] font-medium leading-[1.1] md:text-[38px]">{event.title}</h1>
        <p className="mt-2 text-[14px] text-ink/55">
          {formatDate(event.date, lang)}
          {canChoose && event.deadline && (
            <>
              {' · '}
              {t.chooseBy} {formatDate(event.deadline, lang, { day: 'numeric', month: 'short' })}
            </>
          )}
        </p>
        {graceDays > 0 && <p className="mt-2 text-[12.5px] text-amber-700">{t.graceNote}</p>}

        <form onSubmit={submit} className="mt-7 space-y-5">
          {event.pin && (
            <label className="block">
              <span className="text-[13px] font-medium">{t.pinLabel}</span>
              <input
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 8))
                  setWrong(false)
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                aria-invalid={wrong}
                aria-describedby="pin-hint"
                className={`mt-2 block h-14 w-full rounded-2xl border bg-white px-4 text-center font-mono text-[24px] tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)] ${wrong ? 'border-red-400' : 'border-ink/15 focus:border-[var(--accent)]'}`}
              />
              <span id="pin-hint" className={`mt-1.5 block text-[12px] ${wrong ? 'text-red-600' : 'text-ink/45'}`} role={wrong ? 'alert' : undefined}>
                {wrong ? t.pinWrong : t.pinHint}
              </span>
            </label>
          )}
          {canChoose && (
            <label className="block">
              <span className="text-[13px] font-medium">{t.whoLabel}</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.whoPlaceholder}
                maxLength={40}
                autoComplete="given-name"
                className="mt-2 block h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-[15px] focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-ring)]"
              />
              <span className="mt-1.5 block text-[12px] text-ink/45">{t.whoHint}</span>
            </label>
          )}
          <AccentButton type="submit" icon="arrowRight" className="w-full" disabled={!!event.pin && pin.length < event.pin.length}>
            {t.enter}
          </AccentButton>
        </form>
      </motion.div>
    </GateFrame>
  )
}
