import { describe, expect, it } from 'vitest'
import { countdownLabel, fillContract, fitWithin, isMapsUrl, isPinterestUrl, normaliseUrl, progressCount, waLink, waNumber } from './helpers'

describe('fillContract', () => {
  it('fills every placeholder, tolerating spaces', () => {
    const out = fillContract('{{studio}} and {{ client }} agree on {{total}}. {{studio}} signs.', { client: 'Divya & Rahul', studio: 'Lens', total: '₹1,000' })
    expect(out).toBe('Lens and Divya & Rahul agree on ₹1,000. Lens signs.')
  })
  it('leaves unknown placeholders alone', () => {
    expect(fillContract('{{date}}', { client: 'a', studio: 'b', total: 'c' })).toBe('{{date}}')
  })
})

describe('isMapsUrl', () => {
  it.each([
    'https://maps.google.com/?q=Le+Meridien',
    'maps.google.co.in/maps?q=x',
    'https://www.google.com/maps/place/Sri+Krishna+Mahal',
    'https://google.co.in/maps/@11.0,76.9,15z',
    'https://goo.gl/maps/abc123',
    'https://maps.app.goo.gl/XyZ987',
  ])('accepts %s', u => expect(isMapsUrl(u)).toBe(true))
  it.each(['', 'hello', 'https://google.com/search?q=maps', 'https://maps.app.goo.gl/', 'https://goo.gl/abc', 'https://evil.com/maps.google.com', 'javascript:alert(1)', 'https://maps.google.com.evil.io/'])(
    'rejects %s',
    u => expect(isMapsUrl(u)).toBe(false),
  )
  it('normalises', () => expect(normaliseUrl(' maps.app.goo.gl/x ')).toBe('https://maps.app.goo.gl/x'))
})

describe('WhatsApp links', () => {
  it('adds 91 to 10-digit numbers', () => expect(waNumber('98765 43210')).toBe('919876543210'))
  it('keeps numbers already with country code', () => expect(waNumber('+91 90000 11111')).toBe('919000011111'))
  it('drops trunk 0', () => expect(waNumber('09876543210')).toBe('919876543210'))
  it('encodes text', () => expect(waLink('9876543210', 'Hi & bye')).toBe('https://wa.me/919876543210?text=Hi%20%26%20bye'))
})

describe('countdownLabel / progressCount', () => {
  it('labels', () => {
    expect(countdownLabel(null).en).toBe('Event done')
    expect(countdownLabel(0).en).toBe('Today')
    expect(countdownLabel(1).en).toBe('Tomorrow')
    expect(countdownLabel(24).en).toBe('24 days to go')
    expect(countdownLabel(24).ta).toContain('24')
  })
  it('counts', () => {
    expect(progressCount(120, 300)).toBe('120 / 300')
    expect(progressCount(5, null)).toBe('—')
    expect(progressCount(7, 5)).toBe('5 / 5')
  })
})

describe('isPinterestUrl / fitWithin', () => {
  it('pinterest', () => {
    expect(isPinterestUrl('https://pinterest.com/divya/wedding')).toBe(true)
    expect(isPinterestUrl('in.pinterest.com/x')).toBe(true)
    expect(isPinterestUrl('https://pin.it/abc')).toBe(true)
    expect(isPinterestUrl('https://pinterest.evil.io/x')).toBe(false)
    expect(isPinterestUrl('nope')).toBe(false)
  })
  it('fits', () => {
    expect(fitWithin(4000, 3000)).toEqual({ w: 1600, h: 1200 })
    expect(fitWithin(1000, 3200)).toEqual({ w: 500, h: 1600 })
    expect(fitWithin(800, 600)).toEqual({ w: 800, h: 600 })
  })
})
