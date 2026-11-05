import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { testConfig } from '../src/config'

let dist: string
let app: Awaited<ReturnType<typeof buildApp>>['app']
beforeAll(async () => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-dist-'))
  fs.mkdirSync(path.join(dist, 'assets'))
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><div id="root"></div>')
  fs.writeFileSync(path.join(dist, 'assets', 'app-abc.js'), 'console.log(1)')
  ;({ app } = await buildApp(testConfig({ serveSite: true, distDir: dist })))
})
afterAll(() => app.close())

const get = (url: string) => app.inject({ method: 'GET', url, remoteAddress: '192.168.1.5' })

describe('serving the built site', () => {
  it('serves index.html for / and every client route', async () => {
    for (const u of ['/', '/gallery/demo4821', '/admin/orders', '/p/divya2rk']) {
      const r = await get(u)
      expect(r.statusCode, u).toBe(200)
      expect(r.body).toContain('id="root"')
      expect(r.headers['cache-control']).toBe('no-cache')
    }
  })
  it('caches hashed assets for a year and keeps API 404s as JSON', async () => {
    const a = await get('/assets/app-abc.js')
    expect(a.statusCode).toBe(200)
    expect(a.headers['cache-control']).toContain('immutable')
    const n = await get('/api/nope')
    expect(n.statusCode).toBe(404)
    expect(n.json().error).toBe('not_found')
  })
})
