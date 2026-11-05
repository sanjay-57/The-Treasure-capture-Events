import type { Pick, Proof } from './types'

/**
 * The hand-off to Lightroom Classic, exactly as docs/photographer-guide says:
 * one line, names separated by a comma and a space, no file extensions. Pasted
 * into the Library Filter (Text · Filename · Contains) it shows those RAWs.
 */

export const stripExt = (name: string) => name.replace(/\.[A-Za-z0-9]{2,5}$/, '')

/** Lightroom's text search splits on spaces, so a name with a space can't be found this way. */
export const hasSpace = (name: string) => /\s/.test(name)

/** One Lightroom search line. Keeps the first-seen order and drops duplicates. */
export function lightroomList(names: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of names) {
    const n = stripExt(raw.trim())
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out.join(', ')
}

const bodyOf = (p: Proof) => p.serial || p.camera || ''

/** True when the same filename was uploaded from two different camera bodies. */
export function hasCollisions(proofs: Proof[]): boolean {
  const bodies = new Map<string, string>()
  for (const p of proofs) {
    const b = bodyOf(p)
    const prev = bodies.get(p.filename)
    if (prev !== undefined && prev !== b) return true
    bodies.set(p.filename, b)
  }
  return false
}

export interface ExportGroup {
  /** "Nikon Z6 II · serial 3012345", or "All cameras". */
  label: string
  camera?: string
  serial?: string
  proofs: Proof[]
  line: string
}

/**
 * Selected proofs → Lightroom lines. One line for the whole set, unless two
 * bodies share filenames; then one line per body, so the photographer filters
 * each camera's folder on its own.
 */
export function exportGroups(selected: Proof[]): ExportGroup[] {
  const sorted = [...selected].sort((a, b) => a.sort - b.sort)
  if (!hasCollisions(sorted)) return [{ label: 'All cameras', proofs: sorted, line: lightroomList(sorted.map(p => p.filename)) }]
  const groups = new Map<string, Proof[]>()
  for (const p of sorted) {
    const k = bodyOf(p)
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  return [...groups.entries()].map(([k, ps]) => {
    const camera = ps[0].camera
    const serial = ps[0].serial
    const label = k ? [camera, serial && `serial ${serial}`].filter(Boolean).join(' · ') : 'Unknown camera'
    return { label, camera, serial, proofs: ps, line: lightroomList(ps.map(p => p.filename)) }
  })
}

const cell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV of the selection with notes, for the photographer's records or an editor. */
export function selectionCsv(selected: Proof[], picks: Pick[], chapterName: (key: string) => string = k => k): string {
  const byId = new Map(picks.map(p => [p.proofId, p]))
  const head = ['filename', 'original_ext', 'chapter', 'camera', 'serial', 'taken_at', 'chosen_by', 'note']
  const rows = [...selected]
    .sort((a, b) => a.sort - b.sort)
    .map(p => {
      const pick = byId.get(p.id)
      return [p.filename, p.ext, chapterName(p.chapter), p.camera, p.serial, p.takenAt, pick?.by, pick?.note].map(cell).join(',')
    })
  return [head.join(','), ...rows].join('\n')
}

/** Plain-text file: one name per line with its extension, as on the photographer's disk. */
export function selectionTxt(selected: Proof[]): string {
  return [...selected]
    .sort((a, b) => a.sort - b.sort)
    .map(p => `${p.filename}.${p.ext}`)
    .join('\n')
}
