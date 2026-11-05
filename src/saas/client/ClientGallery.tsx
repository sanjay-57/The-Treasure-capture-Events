import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { formatDate, useLang, useT } from '../../lib/i18n'
import { toast } from '../../lib/ui'
import { resolveGalleryCode } from '../links'
import { bumpStage, useOsStore } from '../os/store'
import type { Project } from '../os/types'
import { useStudioStore } from '../store'
import { StudioMark, StudioTheme, useBrandHead } from '../theme'
import type { Pick as ProofPick, PickerVersion, Proof, Studio, StudioEvent } from '../types'
import { graceLeftDays, linksLive } from '../usage'
import { galleryCopy, gateCopy, submitCopy } from './copy'
import { Gallery } from './Gallery'
import { Archived, Gate, NotEnabled, NotFound, NotReady, Paused } from './Gate'
import { useSelectionSync } from './hooks'
import { LightTable } from './LightTable'
import { quotaText } from './logic'
import { useClientSession } from './session'
import { PickerChips, SaveIndicator, SubmitBar, SubmitModal, Submitted } from './SubmitBar'
import { LangToggle } from './ui'

/**
 * /gallery/:code (project code) and /s/:code (legacy event code) — the
 * client's photo selection gallery. Mounted outside the TTC layout and
 * white-labelled with the photographer's studio (name, logo, accent).
 * Opened by project code, the project's portal PIN guards it.
 *
 * `embedded`: rendered inside the client portal (/p/:code/selection), which
 * already checked the PIN and draws its own nav, so no gate and no header here.
 */

const EMPTY: ProofPick[] = []

export default function ClientGallery({ embedded = false }: { embedded?: boolean }) {
  const params = useParams()
  const lc = (params.code ?? params.slug ?? '').toLowerCase()
  const projects = useOsStore(s => s.projects)
  const events = useStudioStore(s => s.events)
  const hit = useMemo(() => resolveGalleryCode(lc, projects, events), [lc, projects, events])
  const project = hit?.project
  const realEvent = hit?.event
  // By project code the portal PIN opens it (one code, one PIN); a legacy event code keeps its own PIN.
  const event = useMemo(() => (realEvent && project && project.code === lc ? { ...realEvent, pin: project.pin } : realEvent), [realEvent, project, lc])
  const studioId = project?.studioId ?? event?.studioId
  const studio = useStudioStore(s => (studioId ? s.studios.find(x => x.id === studioId) : undefined))
  const allProofs = useStudioStore(s => s.proofs)
  const picks = useStudioStore(s => (event ? s.picks[event.id] : undefined)) ?? EMPTY
  const proofs = useMemo(() => (event ? allProofs.filter(p => p.eventId === event.id).sort((a, b) => a.sort - b.sort) : []), [allProofs, event])
  const session = useClientSession(lc, event)
  const lang = useLang()

  // Outside the TTC Shell nobody else sets <html lang>; Tamil typography keys off it.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useBrandHead(studio, studio ? `${event?.title ?? project?.name ?? ''} · ${studio.name}` : 'Gallery')

  if (!studio || (!event && !project))
    return (
      <StudioTheme studio={{ accent: '#3f3f46' }}>
        <NotFound />
      </StudioTheme>
    )

  if (project && project.features?.gallery === false)
    return (
      <StudioTheme studio={studio}>
        <NotEnabled studio={studio} />
      </StudioTheme>
    )

  if (!event)
    return (
      <StudioTheme studio={studio}>
        <NotReady studio={studio} />
      </StudioTheme>
    )

  const picker: PickerVersion = project?.pickerOverride ?? studio.pickerVersion ?? 'normal'

  return (
    <StudioTheme studio={studio}>
      {!linksLive(studio) ? (
        <Paused studio={studio} event={event} />
      ) : event.status === 'draft' || event.status === 'uploading' ? (
        <NotReady studio={studio} />
      ) : event.status === 'archived' ? (
        <Archived studio={studio} event={event} />
      ) : !session.entered && !embedded ? (
        <Gate
          studio={studio}
          event={event}
          cover={proofs.find(p => p.id === event.coverProofId) ?? proofs[0]}
          count={proofs.length}
          defaultName={session.name}
          graceDays={graceLeftDays(studio)}
          onEnter={session.enter}
          onLang={session.rememberLang}
        />
      ) : (
        <Workspace studio={studio} event={event} project={project} swipe={picker === 'swipe'} proofs={proofs} picks={picks} name={session.name} onLang={session.rememberLang} embedded={embedded} />
      )}
    </StudioTheme>
  )
}

function Workspace({ studio, event, project, swipe, proofs, picks, name, onLang, embedded }: { studio: Studio; event: StudioEvent; project?: Project; swipe: boolean; proofs: Proof[]; picks: ProofPick[]; name: string; onLang: (l: string) => void; embedded: boolean }) {
  const t = useT(galleryCopy)
  const g = useT(gateCopy)
  const s = useT(submitCopy)
  const lang = useLang()
  const togglePick = useStudioStore(x => x.togglePick)
  const setPickNote = useStudioStore(x => x.setPickNote)
  const submitSelection = useStudioStore(x => x.submitSelection)
  const [mode, setMode] = useState<'gallery' | 'table'>('gallery')
  const [confirm, setConfirm] = useState(false)
  const sync = useSelectionSync(event.id, picks)

  const canChoose = event.status === 'open'
  const proofIds = useMemo(() => new Set(proofs.map(p => p.id)), [proofs])
  // Only count picks whose proof still exists (the studio may have removed one).
  const livePicks = useMemo(() => picks.filter(p => proofIds.has(p.proofId)), [picks, proofIds])
  const picked = useMemo(() => new Set(livePicks.map(p => p.proofId)), [livePicks])
  const byId = useMemo(() => new Map(proofs.map(p => [p.id, p])), [proofs])
  const count = picked.size
  const status = quotaText(count, event.quota, s)

  const toggle = useCallback(
    (id: string) => {
      if (!canChoose) return
      if (!picked.has(id) && count + 1 === event.quota) toast(s.quotaToast)
      togglePick(event.id, id, name || undefined)
    },
    [canChoose, picked, count, event.quota, event.id, name, togglePick, s.quotaToast],
  )
  const note = useCallback((id: string, n: string) => canChoose && setPickNote(event.id, id, n), [canChoose, event.id, setPickNote])

  const submit = () => {
    submitSelection(event.id)
    if (project) bumpStage(project.id, 'selection_received')
    setConfirm(false)
    setMode('gallery')
    toast(s.submittedToast)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={embedded ? 'text-ink' : 'min-h-[100svh] bg-white text-ink'}>
      {!embedded && (
        <header className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 md:px-8">
          <span className="flex min-w-0 items-center gap-3">
            <StudioMark studio={studio} size={36} />
            <span className="truncate font-display text-[17px] font-medium">{studio.name}</span>
          </span>
          <LangToggle onPick={onLang} />
        </header>
      )}

      <main className={embedded ? 'pb-36' : 'mx-auto max-w-[1400px] px-4 pb-36 md:px-8'}>
        <div className="flex flex-col gap-3 pb-2 pt-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-balance font-display text-[28px] font-medium leading-[1.1] md:text-[40px]">{event.title}</h1>
            {project?.theme && <p className="mt-1 text-[14px] font-medium text-[var(--accent)]">{project.theme}</p>}
            <p className="mt-1.5 text-[13.5px] text-ink/55">
              {formatDate(event.date, lang)} · {proofs.length} {g.photos}
              {canChoose && event.deadline && (
                <>
                  {' · '}
                  {g.chooseBy} {formatDate(event.deadline, lang, { day: 'numeric', month: 'short' })}
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <PickerChips picks={livePicks} />
              {canChoose && (
                <span className="sm:hidden">
                  <SaveIndicator state={sync} />
                </span>
              )}
            </div>
          </div>
          {swipe && canChoose && proofs.length > 0 && (
            <div role="group" aria-label={t.gallery} className="inline-flex shrink-0 self-start rounded-full bg-ink/[0.05] p-1 text-[13px] font-medium md:self-auto">
              {(
                [
                  ['gallery', t.gallery, 'grid'],
                  ['table', t.lightTable, 'rows'],
                ] as const
              ).map(([k, label, icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  aria-pressed={mode === k}
                  className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] ${mode === k ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink'}`}
                >
                  <Icon name={icon} size={15} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {event.status === 'submitted' && <Submitted studio={studio} event={event} count={count} />}
        {event.status === 'closed' && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-ink/[0.04] p-4 text-[13.5px] text-ink/65" role="status">
            <Icon name="lock" size={16} className="mt-0.5 shrink-0" />
            <span>
              <strong className="font-semibold text-ink">{g.closedTitle}.</strong> {g.closedBody}
            </span>
          </div>
        )}

        {swipe && mode === 'table' && canChoose ? (
          <LightTable event={event} proofs={proofs} picked={picked} quotaText={status} onToggle={toggle} onSubmit={() => setConfirm(true)} />
        ) : (
          <Gallery event={event} proofs={proofs} picks={livePicks} picked={picked} readOnly={!canChoose} onToggle={toggle} onNote={note} />
        )}
      </main>

      {!embedded && <div className="pb-28" />}

      {canChoose && <SubmitBar count={count} quota={event.quota} status={status} sync={sync} onSubmit={() => setConfirm(true)} inPortal={embedded} />}
      <SubmitModal open={confirm} onClose={() => setConfirm(false)} onConfirm={submit} picks={livePicks} proofs={byId} quota={event.quota} status={status} />
    </div>
  )
}
