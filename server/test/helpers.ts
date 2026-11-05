import { buildApp } from '../src/app'
import { testConfig } from '../src/config'

export async function boot(over: Parameters<typeof testConfig>[0] = {}) {
  const built = await buildApp(testConfig(over), { seed: 'demo' })
  const { app } = built
  /** A device: keeps its own cookie like a browser. */
  const device = (ip = '192.168.1.20') => {
    let cookie = ''
    const call = async (method: 'GET' | 'POST', url: string, body?: unknown) => {
      const res = await app.inject({ method, url, payload: body as any, remoteAddress: ip, headers: cookie ? { cookie } : {} })
      const set = res.headers['set-cookie']
      if (set) cookie = (Array.isArray(set) ? set[0] : set).split(';')[0]
      return { status: res.statusCode, body: res.body ? safeJson(res.body) : undefined, raw: res }
    }
    return {
      get: (url: string) => call('GET', url),
      post: (url: string, body?: unknown) => call('POST', url, body ?? {}),
      act: (store: string, action: string, ...args: unknown[]) => call('POST', '/api/act', { store, action, args }),
      get cookie() {
        return cookie
      },
    }
  }
  const admin = async () => {
    const d = device()
    const r = await d.post('/api/auth/admin/login', { name: 'admin', password: 'test-pass-123' })
    if (r.status !== 200) throw new Error('admin login failed ' + JSON.stringify(r.body))
    return d
  }
  /** Customer (or photographer) logging in with a code read off the admin screen. */
  const withCode = async (phone: string, purpose: 'customer' | 'studio') => {
    const d = device()
    const req = await d.post('/api/auth/code/request', { phone, purpose })
    if (req.status !== 200) throw new Error('code request ' + JSON.stringify(req.body))
    const a = await admin()
    const codes = (await a.get('/api/admin/codes')).body as { phone: string; code: string }[]
    const code = codes.find(c => c.phone === phone.replace(/\D/g, '').slice(-10))!.code
    const v = await d.post('/api/auth/code/verify', { phone, purpose, code })
    if (v.status !== 200) throw new Error('verify ' + JSON.stringify(v.body))
    return d
  }
  return { ...built, device, admin, withCode, close: () => app.close() }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
