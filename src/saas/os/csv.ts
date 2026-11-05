/**
 * CSV for the project import (and export helpers). Pure: tested in csv.test.ts.
 * RFC 4180-ish: comma separated; fields may be quoted with
 * "…", doubled quotes ("") inside are a literal quote, quoted fields may hold commas
 * and line breaks. CRLF and LF both work. A UTF-8 BOM is dropped.
 */

export function parseCsv(text: string): string[][] {
  const s = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
      } else field += c
      i++
      continue
    }
    if (c === '"' && field === '') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
    i++
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.some(f => f.trim() !== ''))
}

const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
export const toCsv = (rows: (string | number)[][]) => rows.map(r => r.map(v => esc(String(v))).join(',')).join('\r\n')

export const IMPORT_COLUMNS = ['name', 'type', 'client', 'phone', 'email', 'event', 'date', 'venue', 'total'] as const

export interface ImportRow {
  /** 1-based line in the file (header is line 1). */
  line: number
  name: string
  type: string
  client: string
  phone: string
  email?: string
  event?: string
  /** YYYY-MM-DD */
  date?: string
  venue?: string
  /** Whole rupees, tax included as given. */
  total?: number
}

export interface ImportError {
  line: number
  message: string
}

/** Accepts YYYY-MM-DD or DD/MM/YYYY (also DD-MM-YYYY); returns YYYY-MM-DD or null. */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim()
  let y: number, m: number, d: number
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)
  if (r) [y, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])]
  else if ((r = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s))) [d, m, y] = [Number(r[1]), Number(r[2]), Number(r[3])]
  else return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "₹1,50,000", "150000", "1.5L" is not accepted (ambiguous) → null. */
export function parseRupees(raw: string): number | null {
  const s = raw.replace(/[₹,\s]/g, '').replace(/^rs\.?/i, '')
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return Math.round(Number(s))
}

/** Parses the import file. Header names are matched case-insensitively; order is free; unknown columns ignored. */
export function parseProjectCsv(text: string): { rows: ImportRow[]; errors: ImportError[] } {
  const table = parseCsv(text)
  const errors: ImportError[] = []
  if (!table.length) return { rows: [], errors: [{ line: 1, message: 'The file is empty' }] }
  const head = table[0].map(h => h.trim().toLowerCase())
  const col = Object.fromEntries(IMPORT_COLUMNS.map(c => [c, head.indexOf(c)])) as Record<(typeof IMPORT_COLUMNS)[number], number>
  const missing = (['name', 'client', 'phone'] as const).filter(c => col[c] < 0)
  if (missing.length) return { rows: [], errors: [{ line: 1, message: `Missing column: ${missing.join(', ')}` }] }
  const rows: ImportRow[] = []
  table.slice(1).forEach((r, i) => {
    const line = i + 2
    const get = (c: (typeof IMPORT_COLUMNS)[number]) => (col[c] >= 0 ? (r[col[c]] ?? '').trim() : '')
    const name = get('name')
    const client = get('client')
    const phone = get('phone')
    const problems: string[] = []
    if (!name) problems.push('name is empty')
    if (!client) problems.push('client is empty')
    if (phone.replace(/\D/g, '').length < 10) problems.push('phone needs at least 10 digits')
    let date: string | undefined
    if (get('date')) {
      const d = normaliseDate(get('date'))
      if (d) date = d
      else problems.push(`date "${get('date')}" is not YYYY-MM-DD or DD/MM/YYYY`)
    }
    let total: number | undefined
    if (get('total')) {
      const t = parseRupees(get('total'))
      if (t === null) problems.push(`total "${get('total')}" is not a number`)
      else total = t
    }
    if (problems.length) return errors.push({ line, message: problems.join('; ') })
    rows.push({ line, name, type: get('type') || 'Wedding', client, phone, email: get('email') || undefined, event: get('event') || undefined, date, venue: get('venue') || undefined, total })
  })
  return { rows, errors }
}
