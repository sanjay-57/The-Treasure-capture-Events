import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../lib/store'
import { useStudioStore } from '../saas/store'
import { applyChanges, applyMe, hydrate, preferRole } from './sync'

const order = (id: string, contact = '+91 98765 43210') => ({ ...useStore.getState().orders[0], id, client: { name: 'N ' + id, contact } })

beforeEach(() => {
  preferRole(null)
  useStore.setState({ session: null })
  useStudioStore.setState({ session: null })
})

describe('hydrate', () => {
  it('replaces server collections and empties the ones not sent', () => {
    hydrate({ orders: [{ id: 'A', doc: order('A') }], cms: [{ id: 'main', doc: { ...useStore.getState().cms, banner: { enabled: false, en: 'x', ta: 'x', link: '' } } }] })
    expect(useStore.getState().orders.map(o => o.id)).toEqual(['A'])
    expect(useStore.getState().workers).toEqual([])
    expect(useStore.getState().cms.banner.en).toBe('x')
    expect(useStudioStore.getState().picks).toEqual({})
  })
})

describe('applyChanges', () => {
  it('updates in place, prepends or appends new rows, deletes', () => {
    hydrate({ orders: [{ id: 'A', doc: order('A') }, { id: 'B', doc: order('B') }] })
    applyChanges([
      { coll: 'orders', id: 'B', doc: { ...order('B'), notes: 'changed' } },
      { coll: 'orders', id: 'C', doc: order('C'), prepend: true },
      { coll: 'orders', id: 'D', doc: order('D') },
      { coll: 'orders', id: 'A', doc: null },
    ])
    const o = useStore.getState().orders
    expect(o.map(x => x.id)).toEqual(['C', 'B', 'D'])
    expect(o[1].notes).toBe('changed')
  })
  it('handles record collections (picks per gallery)', () => {
    hydrate({})
    applyChanges([{ coll: 'picks', id: 'ev1', doc: [{ proofId: 'p1', at: 'now' }] }])
    expect(useStudioStore.getState().picks.ev1).toHaveLength(1)
    applyChanges([{ coll: 'picks', id: 'ev1', doc: null }])
    expect(useStudioStore.getState().picks.ev1).toBeUndefined()
  })
})

describe('applyMe', () => {
  it('admin wins; customer gets their order; studio gets its session', () => {
    hydrate({ orders: [{ id: 'A', doc: order('A') }], studios: [{ id: 'st1', doc: { ...useStudioStore.getState().studios[0], id: 'st1', phone: '+91 90000 11111' } }] })
    applyMe({ orderIds: [], customer: '9876543210', gates: { projects: [], events: [] } })
    expect(useStore.getState().session).toMatchObject({ role: 'client', orderId: 'A' })
    applyMe({ admin: { name: 'Meena' }, orderIds: [], gates: { projects: [], events: [] }, studioId: 'st1' })
    expect(useStore.getState().session).toEqual({ role: 'admin', name: 'Meena' })
    expect(useStudioStore.getState().session).toEqual({ studioId: 'st1', phone: '+91 90000 11111' })
    applyMe({ orderIds: [], gates: { projects: [], events: [] } })
    expect(useStore.getState().session).toBeNull()
    expect(useStudioStore.getState().session).toBeNull()
  })
  it('a customer code on a device that is also admin opens the client side', () => {
    hydrate({ orders: [{ id: 'A', doc: order('A') }] })
    const both = { admin: { name: 'Meena' }, customer: '9876543210', orderIds: [], gates: { projects: [], events: [] } }
    applyMe(both)
    expect(useStore.getState().session).toEqual({ role: 'admin', name: 'Meena' })
    preferRole('client')
    applyMe(both)
    expect(useStore.getState().session).toMatchObject({ role: 'client', orderId: 'A' })
    preferRole('admin')
    applyMe(both)
    expect(useStore.getState().session).toEqual({ role: 'admin', name: 'Meena' })
  })
})
