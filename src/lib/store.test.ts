import { describe, expect, it } from 'vitest'
import { resolvePrices, tierCart } from './catalogue'
import { eventByKey } from './data'
import { computeQuote } from './pricing'
import { EMPTY_DRAFT, useStore } from './store'

describe('showroom quote', () => {
  it('creates a lead, an ENQUIRY order and a WhatsApp quote without touching the visitor draft', () => {
    const before = useStore.getState()
    const cart = tierCart(eventByKey('birthday')!.tiers, 'premium')
    const id = useStore.getState().saveShowroomQuote({ ...EMPTY_DRAFT, name: 'Meena', contact: '90000 11111', district: 'madurai', eventType: 'birthday', cart })
    const s = useStore.getState()
    const order = s.orders.find(o => o.id === id)!
    expect(order.status).toBe('ENQUIRY')
    expect(order.source).toBe('showroom')
    expect(order.quote.total).toBe(29999)
    expect(order.quote.total).toBe(computeQuote({ eventType: 'birthday', cart, distanceKm: 0 }, resolvePrices(s.cms.catalogue.prices)).total)
    expect(s.leads[0]).toMatchObject({ name: 'Meena', source: 'showroom' })
    expect(s.outbox.some(m => m.orderId === id && m.template === 'quote_sent')).toBe(true)
    expect(s.draft).toEqual(before.draft)
    expect(s.session).toEqual(before.session)
  })
  it('refuses without a name, mobile, event and district', () => {
    expect(useStore.getState().saveShowroomQuote({ ...EMPTY_DRAFT, name: 'Meena' })).toBeNull()
  })
})
