import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const N = 16384

export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(pw, salt, 32, { N })
  return `scrypt$${N}$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, n, salt, key] = stored.split('$')
  if (alg !== 'scrypt' || !salt || !key) return false
  const want = Buffer.from(key, 'base64')
  const got = scryptSync(pw, Buffer.from(salt, 'base64'), want.length, { N: Number(n) })
  return timingSafeEqual(want, got)
}
