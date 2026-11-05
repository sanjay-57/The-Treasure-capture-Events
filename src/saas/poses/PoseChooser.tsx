import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { isLan } from '../../api/mode'
import { checkPin, gateOpen } from '../../api/auth'
import { useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { HowToPose, PoseImage } from '../../components/poses'
import { useLang, useT } from '../../lib/i18n'
import type { PoseDef } from '../../lib/poses'
import { toast } from '../../lib/ui'
import { GateFrame, NotEnabled } from '../client/Gate'
import { waLink } from '../client/logic'
import { AccentButton, LangToggle, Notice } from '../client/ui'
import { resolvePosesCode } from '../links'
import { useOsStore } from '../os/store'
import type { PoseAnswer, PosePlan, Project } from '../os/types'
import { pinKey } from '../portal/helpers'
import { useStudioStore } from '../store'
import { StudioMark, StudioTheme, useBrandHead } from '../theme'
import type { Studio } from '../types'
import { linksLive } from '../usage'
import { fill, posesCopy } from './copy'
import { planPoses, poseProgress, shotList } from './logic'

/**
 * /poses/:code — the photographer's customer rates the poses the studio sent
 * (Yes / No), before the shoot. White-labelled: studio name, logo and accent
 * only. Gated by the project's portal PIN; unlocking here or on the portal
 * unlocks both for the tab session. Answers save to the store as they go.
 */

const ss = () => (typeof window !== 'undefined' ? window.sessionStorage : undefined)
const ssGet = (k: string) => {
  try {
    return ss()?.getItem(k) ?? null
  } catch {
    return null
  }
}
const ssSet = (k: string, v: string) => {
  try {
    ss()?.setItem(k, v)
  } catch {
    /* private mode: ask again next time */
  }
}

export default function PoseChooser() {
  const { code = '' } = useParams()
  const lc = code.toLowerCase()
  const t = useT(posesCopy)
  const lang = useLang()
  const project = useOsStore(s => resolvePosesCode(lc, s.projects))
  const studio = useStudioStore(s => (project ? s.studios.find(x => x.id === project.studioId) : undefined))
  const [unlocked, setUnlocked] = useState(() => (project ? (isLan() ? gateOpen('project', project.id) : ssGet(pinKey(lc)) === project.pin) : false))

  useEffect(() => {
    setUnlocked(project ? (isLan() ? gateOpen('project', project.id) : ssGet(pinKey(lc)) === project.pin) : false)
  }, [lc, project?.pin]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useBrandHead(project ? studio : undefined, project && studio ? `${t.title} · ${studio.name}` : t.title)

  if (!project || !studio)
    return (
      <StudioTheme studio={{ accent: '#3f3f46' }}>
        <GateFrame>
          <Notice icon="search" title={t.notFoundTitle} body={t.notFoundBody} />
        </GateFrame>
      </StudioTheme>
    )

  const wa = waLink(studio.whatsapp, fill(t.changeMsg, { name: project.name }))
  const plan = project.poses

  return (
    <StudioTheme studio={studio}>
      {!linksLive(studio) ? (
        <GateFrame studio={studio}>
          <Notice icon="pause" title={t.pausedTitle} body={t.pausedBody}>
            <ContactButton href={wa}>{t.contact}</ContactButton>
          </Notice>
        </GateFrame>
      ) : project.features?.poses === false ? (
        <NotEnabled studio={studio} />
      ) : !plan?.sentAt || !planPoses(plan).length ? (
        <GateFrame studio={studio}>
          <Notice icon="camera" title={t.notReadyTitle} body={fill(t.notReadyBody, { studio: studio.name })} />
        </GateFrame>
      ) : !unlocked ? (
        <PinGate
          studio={studio}
          project={project}
          onOk={() => {
            ssSet(pinKey(lc), project.pin)
            setUnlocked(true)
          }}
        />
      ) : (
        <Chooser studio={studio} project={project} plan={plan} wa={wa} />
      )}
    </StudioTheme>
  )
}

function ContactButton({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--accent-ink)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]">
      <Icon name="whatsapp" size={17} />
      {children}
    </a>
  )
}

function PinGate({ studio, project, onOk }: { studio: Studio; project: Project; onOk: () => void }) {
  const t = useT(posesCopy)
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    void checkPin(project.code, pin, project.pin).then(ok => (ok ? onOk() : setWrong(true)))
  }
  return (
    <GateFrame studio={studio}>
      <form onSubmit={submit} className="mx-auto w-full max-w-sm px-6 py-12 text-center">
        <p className="t-label text-[var(--accent)]">{t.kicker}</p>
        <h1 className="mt-2 text-balance font-display text-[32px] font-medium leading-[1.1]">{t.title}</h1>
        <p className="mt-2 text-[14px] text-ink/55">
          {project.name}
          {project.theme && ` · ${project.theme}`}
        </p>
        <label className="mt-8 block text-left">
          <span className="text-[13px] font-medium">{t.pinLabel}</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={e => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              setWrong(false)
            }}
            aria-invalid={wrong}
            aria-describedby="poses-pin-hint"
            className="mt-1.5 h-14 w-full rounded-2xl border border-ink/15 bg-white text-center font-mono text-[24px] tracking-[0.4em] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-ring)]"
          />
          <span id="poses-pin-hint" className={`mt-1.5 block text-[12px] ${wrong ? 'text-red-600' : 'text-ink/45'}`} role={wrong ? 'alert' : undefined}>
            {wrong ? t.pinWrong : t.pinHint}
          </span>
        </label>
        <AccentButton type="submit" icon="arrowRight" className="mt-6 w-full" disabled={pin.length < 4}>
          {t.enter}
        </AccentButton>
      </form>
    </GateFrame>
  )
}

function Chooser({ studio, project, plan, wa }: { studio: Studio; project: Project; plan: PosePlan; wa: string }) {
  const t = useT(posesCopy)
  const setPosePick = useOsStore(s => s.setPosePick)
  const submitPoses = useOsStore(s => s.submitPoses)
  const poses = useMemo(() => planPoses(plan), [plan])
  const prog = poseProgress(plan)
  const done = !!plan.submittedAt

  const answer = (id: string, a: PoseAnswer) => setPosePick(project.id, id, plan.picks[id] === a ? undefined : a)
  const submit = () => {
    if (!prog.complete) return
    submitPoses(project.id)
    toast(t.sentToast)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-[100svh] bg-white text-ink">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 md:px-8">
        <span className="flex min-w-0 items-center gap-3">
          <StudioMark studio={studio} size={36} />
          <span className="truncate font-display text-[17px] font-medium">{studio.name}</span>
        </span>
        <LangToggle />
      </header>

      <main className="mx-auto max-w-[1200px] px-4 pb-36 md:px-8">
        <p className="t-label text-[var(--accent)]">{t.kicker}</p>
        <h1 className="mt-1.5 text-balance font-display text-[28px] font-medium leading-[1.1] md:text-[40px]">{t.title}</h1>
        <p className="mt-1.5 text-[13.5px] text-ink/55">
          {project.name}
          {project.theme && ` · ${project.theme}`} · {prog.total} {t.poses}
        </p>
        {!done && <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink/65">{t.intro}</p>}

        {done && (
          <section className="mt-5 flex flex-col gap-4 rounded-[24px] bg-[var(--accent-soft)] p-6 md:flex-row md:items-center md:justify-between md:p-8" role="status">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
                <Icon name="check" size={22} strokeWidth={2.2} />
              </span>
              <div>
                <h2 className="font-display text-[22px] font-medium leading-tight">{fill(t.thanksTitle, { studio: studio.name })}</h2>
                <p className="mt-1.5 text-[14px] text-ink/60">{t.thanksBody}</p>
                <p className="mt-1 text-[12.5px] text-ink/45">{t.change}</p>
              </div>
            </div>
            <ContactButton href={wa}>{t.contact}</ContactButton>
          </section>
        )}

        {done ? (
          <>
            <h2 className="mb-3 mt-8 text-[15px] font-semibold">
              {t.yourYes} · {prog.yes}
            </h2>
            <PoseGrid poses={shotList(plan)} />
          </>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {poses.map(p => (
              <PoseCard key={p.id} pose={p} value={plan.picks[p.id]} onAnswer={a => answer(p.id, a)} />
            ))}
          </div>
        )}
      </main>

      {!done && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/[0.08] bg-white/95 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">{fill(t.answered, { n: prog.answered, total: prog.total })}</p>
              <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/[0.08]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-[width]" style={{ width: `${prog.total ? (prog.answered / prog.total) * 100 : 0}%` }} />
              </div>
              {!prog.complete && <p className="mt-1 text-[12px] text-ink/45">{t.submitHint}</p>}
            </div>
            <AccentButton icon="arrowRight" disabled={!prog.complete} onClick={submit}>
              {t.submit}
            </AccentButton>
          </div>
        </div>
      )}
    </div>
  )
}

function PoseCard({ pose, value, onAnswer }: { pose: PoseDef; value?: PoseAnswer; onAnswer: (a: PoseAnswer) => void }) {
  const t = useT(posesCopy)
  const lang = useLang()
  return (
    <article className={`overflow-hidden rounded-[22px] border bg-white transition ${value === 'yes' ? 'border-[var(--accent)] ring-2 ring-[var(--accent-ring)]' : value === 'no' ? 'border-ink/[0.08] opacity-70' : 'border-ink/[0.08]'}`}>
      <PoseImage pose={pose} />
      <div className="p-4">
        <h3 className="font-display text-[18px] font-medium leading-snug">{pose.title[lang]}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={pose.title[lang]}>
          {(
            [
              ['yes', t.yes, 'check'],
              ['no', t.no, 'x'],
            ] as const
          ).map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              aria-pressed={value === k}
              onClick={() => onAnswer(k)}
              className={`flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] ${
                value === k ? (k === 'yes' ? 'bg-[var(--accent)] text-[var(--accent-ink)]' : 'bg-ink text-white') : 'border border-ink/15 text-ink hover:bg-ink/[0.04]'
              }`}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          ))}
        </div>
        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-[13px] font-medium text-[var(--accent)]">{t.how} →</summary>
          <div className="mt-3">
            <HowToPose pose={pose} compact />
          </div>
        </details>
      </div>
    </article>
  )
}

function PoseGrid({ poses }: { poses: PoseDef[] }) {
  const lang = useLang()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {poses.map(p => (
        <figure key={p.id} className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
          <PoseImage pose={p} />
          <figcaption className="p-3 text-[13.5px] font-medium">{p.title[lang]}</figcaption>
        </figure>
      ))}
    </div>
  )
}
