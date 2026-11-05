import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as clientCopy from './client/copy'
import { posesCopy } from './poses/copy'

/** Customer pages carry the studio's brand only (plan Phase 6). */
const BANNED = /treasure|\bTTC\b|PRODUCT|LogoMark|PoweredBy|ttc-/i

const strings = (o: unknown): string[] =>
  typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : []

/** Source with comments removed, so notes like "never TTC ruby" are allowed. */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return files(p)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : []
  })
}

describe('white-label customer pages', () => {
  it('client gallery and pose copy never names TTC', () => {
    const all = [...strings(Object.fromEntries(Object.entries(clientCopy).filter(([, v]) => typeof v === 'object'))), ...strings(posesCopy)]
    expect(all.length).toBeGreaterThan(50)
    expect(all.filter(s => BANNED.test(s))).toEqual([])
  })

  it('client, portal and poses source renders no TTC brand', () => {
    const root = join(process.cwd(), 'src/saas')
    const hits = ['client', 'portal', 'poses']
      .flatMap(d => files(join(root, d)))
      .flatMap(f => stripComments(readFileSync(f, 'utf8')).split('\n').filter(l => BANNED.test(l)).map(l => `${f}: ${l.trim()}`))
    expect(hits).toEqual([])
  })
})
