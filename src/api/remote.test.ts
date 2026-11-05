import { beforeAll, describe, expect, it, vi } from 'vitest'
import { useStore } from '../lib/store'
import { bindRemote } from './remote'

const calls: { store: string; action: string; args: unknown[] }[] = []
let reply: (body: { store: string; action: string; args: unknown[] }) => unknown = () => ({ result: null, seq: 1, changes: [], me: { orderIds: [], gates: { projects: [], events: [] } } })

beforeAll(() => {
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    const body = JSON.parse(init.body)
    calls.push(body)
    return { ok: true, status: 200, text: async () => JSON.stringify(reply(body)) }
  })
  bindRemote()
})

const me = { orderIds: [], gates: { projects: [], events: [] }, admin: { name: 'A' } }

describe('bindRemote', () => {
  it('sends server actions and applies the reply', async () => {
    const o = useStore.getState().orders[0]
    reply = () => ({ result: null, seq: 2, changes: [{ coll: 'orders', id: o.id, doc: { ...o, status: 'DELIVERED' } }], me })
    await useStore.getState().setStatus(o.id, 'DELIVERED')
    expect(calls.at(-1)).toEqual({ store: 'ttc', action: 'setStatus', args: [o.id, 'DELIVERED'] })
    expect(useStore.getState().orders.find(x => x.id === o.id)!.status).toBe('DELIVERED')
  })
  it('keeps device-only actions local', () => {
    const n = calls.length
    useStore.getState().setLang('ta')
    expect(useStore.getState().lang).toBe('ta')
    expect(calls.length).toBe(n)
  })
  it('hearts change at once, before the server answers', () => {
    const o = useStore.getState().orders[0]
    const before = o.selection.includes('px')
    useStore.getState().toggleSelection(o.id, 'px')
    expect(useStore.getState().orders[0].selection.includes('px')).toBe(!before)
    expect(calls.at(-1)?.action).toBe('toggleSelection')
  })
  it('sends the booking draft with submitEnquiry and returns the new id', async () => {
    reply = () => ({ result: 'TTC-2026-0999', seq: 3, changes: [], me })
    useStore.getState().updateDraft({ name: 'Z', contact: '9000000001' })
    const id = await useStore.getState().submitEnquiry()
    expect(id).toBe('TTC-2026-0999')
    expect((calls.at(-1)!.args[0] as { name: string }).name).toBe('Z')
  })
})
