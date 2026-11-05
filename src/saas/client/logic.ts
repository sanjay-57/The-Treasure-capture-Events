import type { Chapter, Pick as ProofPick, Proof } from '../types'

/** Pure rules behind the client gallery. No React, no store: tested in logic.test.ts. */

export type Filter = 'all' | 'selected' | 'unselected'

export type QuotaKind = 'left' | 'reached' | 'over'
export interface QuotaState {
  kind: QuotaKind
  /** Photos left to reach the quota, or photos over it. 0 when reached. */
  n: number
  /** 0..1 for the ring, capped at 1. */
  ratio: number
}

export function quotaState(count: number, quota: number): QuotaState {
  const q = Math.max(0, quota)
  const ratio = q ? Math.min(1, count / q) : count ? 1 : 0
  if (count > q) return { kind: 'over', n: count - q, ratio }
  if (count === q) return { kind: 'reached', n: 0, ratio }
  return { kind: 'left', n: q - count, ratio }
}

type QuotaCopy = { left: string; reached: string; over: string }
/** "12 more to reach the album quota" / "Album quota reached" / "3 over the album quota…" */
export function quotaText(count: number, quota: number, t: QuotaCopy): string {
  const s = quotaState(count, quota)
  return s.kind === 'reached' ? t.reached : `${s.n} ${s.kind === 'over' ? t.over : t.left}`
}

export function filterProofs(proofs: Proof[], picked: ReadonlySet<string>, filter: Filter): Proof[] {
  if (filter === 'all') return proofs
  const want = filter === 'selected'
  return proofs.filter(p => picked.has(p.id) === want)
}

export function filterCounts(proofs: Proof[], picked: ReadonlySet<string>): Record<Filter, number> {
  let selected = 0
  for (const p of proofs) if (picked.has(p.id)) selected++
  return { all: proofs.length, selected, unselected: proofs.length - selected }
}

export interface ChapterGroup {
  chapter: Chapter
  proofs: Proof[]
}

/**
 * Proofs grouped by the event's chapters (sorted), each sorted by `sort`.
 * Proofs whose chapter key is unknown land in a trailing "other" group so nothing disappears.
 */
export function groupByChapter(chapters: Chapter[], proofs: Proof[], otherName = 'More'): ChapterGroup[] {
  const sorted = [...chapters].sort((a, b) => a.sort - b.sort)
  const known = new Set(sorted.map(c => c.key))
  const groups = sorted.map(chapter => ({ chapter, proofs: [] as Proof[] }))
  const byKey = new Map(groups.map(g => [g.chapter.key, g]))
  const other: Proof[] = []
  for (const p of [...proofs].sort((a, b) => a.sort - b.sort)) {
    if (known.has(p.chapter)) byKey.get(p.chapter)!.proofs.push(p)
    else other.push(p)
  }
  if (other.length) groups.push({ chapter: { key: '__other', name: otherName, sort: Number.MAX_SAFE_INTEGER }, proofs: other })
  return groups.filter(g => g.proofs.length > 0)
}

/** Distinct "who is choosing" names on the picks, with how many each made. */
export function pickers(picks: ProofPick[]): { name: string; count: number }[] {
  const m = new Map<string, number>()
  for (const p of picks) if (p.by) m.set(p.by, (m.get(p.by) ?? 0) + 1)
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

/** wa.me link: digits only, 91 prefixed to a bare 10-digit Indian number. */
export function waLink(phone: string, text: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.length === 10) d = `91${d}`
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}

/** Camera filename shown to the client: what they quote back to the studio. */
export const proofName = (p: Pick<Proof, 'filename' | 'ext'>) => `${p.filename}.${p.ext}`
