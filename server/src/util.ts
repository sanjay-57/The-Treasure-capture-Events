import { randomBytes, randomInt, createHash, timingSafeEqual } from 'node:crypto'

export const now = () => new Date().toISOString()
/** Last 10 digits, the same rule as normalizePhone in src/lib/store.ts. */
export const phone10 = (s: unknown) => (typeof s === 'string' ? s.replace(/\D/g, '').slice(-10) : '')
export const token = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
export const digits = (n: number) => Array.from({ length: n }, () => randomInt(10)).join('')
export const id = (prefix: string) => `${prefix}_${randomBytes(6).toString('base64url').replace(/[-_]/g, '').slice(0, 8).toLowerCase()}`

export function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code)
  }
}
export const forbid = (why = 'forbidden') => new HttpError(403, why)
export const notFound = (what = 'not_found') => new HttpError(404, what)
export const bad = (why = 'bad_request') => new HttpError(400, why)
