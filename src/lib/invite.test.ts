import { describe, expect, it } from 'vitest'
import {
  BLANK_DRAFT, FREE_THEMES, PREMIUM_THEMES, THEME_META, countdown, decodeInvite, directionsUrl, draftMissing, draftToInvite, encodeInvite, invitePath, parseLatLng, premiumUnlocked,
  rsvpUrl, shareText, splitCouple, themeOpen, whatsappShareUrl, type Invite, type InviteDraft,
} from './invite'

const SAMPLE: Invite = {
  en: ['Priya', 'Karthik'],
  ta: ['பிரியா', 'கார்த்திக்'],
  date: '2027-02-14',
  time: '06:30',
  venue: 'Sri Meenakshi Mahal',
  address: 'Madurai',
  lat: 9.919512345,
  lng: 78.119345678,
  phone: '98765 43210',
  theme: 'lantern',
}

describe('invite links', () => {
  it('round-trips Tamil names through the fragment', () => {
    const back = decodeInvite(encodeInvite(SAMPLE))!
    expect(back.ta).toEqual(SAMPLE.ta)
    expect(back.en).toEqual(SAMPLE.en)
    expect(back.lat).toBe(9.91951)
    expect(back.theme).toBe('lantern')
  })
  it('stays small enough to share', () => {
    expect(invitePath(SAMPLE).length).toBeLessThan(400)
    expect(encodeInvite(SAMPLE)).not.toMatch(/[+/=]/)
  })
  it('rejects damaged links', () => {
    expect(decodeInvite('not-a-payload')).toBeNull()
    expect(decodeInvite(encodeInvite({ ...SAMPLE, theme: 'nope' as never }))).toBeNull()
  })
  it('opens old gopuram links as Lantern Night', () => {
    expect(decodeInvite(encodeInvite({ ...SAMPLE, theme: 'gopuram' as never }))!.theme).toBe('lantern')
  })
  it('builds directions and RSVP links', () => {
    expect(directionsUrl(SAMPLE)).toContain('destination=9.91951,78.11935')
    expect(rsvpUrl(SAMPLE, 'en')).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/)
    expect(rsvpUrl({ ...SAMPLE, phone: undefined }, 'ta')).toBeNull()
  })
  it('counts down to the muhurtham in India time', () => {
    const now = Date.parse('2027-02-13T06:00:00+05:30')
    expect(countdown(SAMPLE, now)).toEqual({ done: false, days: 1, hours: 0, minutes: 30, seconds: 0 })
    expect(countdown(SAMPLE, now + 3 * 864e5).done).toBe(true)
  })
})

describe('invite builder', () => {
  const DRAFT: InviteDraft = {
    ...BLANK_DRAFT, brideEn: ' Priya ', groomEn: 'Karthik', brideTa: 'பிரியா', date: '2027-02-14', time: '06:30',
    venue: 'Sri Meenakshi Mahal', pin: '9.919512, 78.119345', phone: '98765 43210', theme: 'lantern', caricatureUrl: 'https://cdn.example.com/c.webp',
  }
  it('unlocks premium themes only with the premium e-invite in the cart', () => {
    expect(premiumUnlocked({ einvite_premium: 1 })).toBe(true)
    expect(premiumUnlocked({ einvite: 1 })).toBe(false)
    expect(premiumUnlocked(undefined)).toBe(false)
    expect(themeOpen('ivory', false)).toBe(true)
    expect(themeOpen('lantern', false)).toBe(false)
    expect(themeOpen('lantern', true)).toBe(true)
    // Every design has picker metadata, and there are at least 25 of them.
    expect(Object.keys(THEME_META).sort()).toEqual([...FREE_THEMES, ...PREMIUM_THEMES].sort())
    expect(FREE_THEMES.length + PREMIUM_THEMES.length).toBeGreaterThanOrEqual(25)
    expect(themeOpen('athangudi', false)).toBe(false)
    expect(themeOpen('turmeric', false)).toBe(true)
    expect(decodeInvite(encodeInvite({ ...SAMPLE, theme: 'polka' as never }))!.theme).toBe('turmeric')
  })
  it('round-trips the builder fields through the link', () => {
    const back = decodeInvite(encodeInvite(draftToInvite(DRAFT)))!
    expect(back.en).toEqual(['Priya', 'Karthik'])
    // A blank Tamil name falls back to the English one.
    expect(back.ta).toEqual(['பிரியா', 'Karthik'])
    expect([back.lat, back.lng]).toEqual([9.91951, 78.11935])
    expect(back.caricature).toBe('https://cdn.example.com/c.webp')
    expect(back.parents).toBeUndefined()
    expect(decodeInvite(encodeInvite(draftToInvite({ ...DRAFT, parentsTa: 'ஆசியுடன்' })))!.parents).toEqual({ en: 'ஆசியுடன்', ta: 'ஆசியுடன்' })
  })
  it('never puts a local image or a free-theme caricature in the link', () => {
    expect(draftToInvite({ ...DRAFT, caricatureUrl: 'data:image/webp;base64,AAAA' }).caricature).toBeUndefined()
    expect(draftToInvite({ ...DRAFT, theme: 'ivory' }).caricature).toBeUndefined()
  })
  it('lists what is missing before a link can be made', () => {
    expect(draftMissing(DRAFT)).toEqual([])
    expect(draftMissing(BLANK_DRAFT)).toEqual(['names', 'date', 'venue'])
  })
  it('reads map pins and couple names', () => {
    expect(parseLatLng('9.9195, 78.1193')).toEqual({ lat: 9.9195, lng: 78.1193 })
    expect(parseLatLng('https://www.google.com/maps/@9.9195,78.1193,17z')).toEqual({ lat: 9.9195, lng: 78.1193 })
    expect(parseLatLng('Madurai')).toBeNull()
    expect(parseLatLng('95, 78')).toBeNull()
    expect(splitCouple('Priya & Karthik')).toEqual(['Priya', 'Karthik'])
    expect(splitCouple('Anand and Meena')).toEqual(['Anand', 'Meena'])
    expect(splitCouple('Lakshmi')).toEqual(['Lakshmi', ''])
  })
  it('writes the share message in the sender’s language', () => {
    expect(shareText(SAMPLE, 'en')).toMatch(/^Priya & Karthik are getting married! .*2027.*muhurtham 06:30, at Sri Meenakshi Mahal/)
    expect(shareText(SAMPLE, 'ta')).toContain('பிரியா – கார்த்திக் திருமணம்')
    const wa = whatsappShareUrl(SAMPLE, 'en', 'https://x.in/i/lantern#abc')
    expect(wa).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(decodeURIComponent(wa.split('text=')[1])).toMatch(/\nhttps:\/\/x\.in\/i\/lantern#abc$/)
  })
})

describe('fortune cookies', () => {
  it('never repeats until every fortune has been seen', async () => {
    const { FORTUNES, nextFortune } = await import('./fortunes')
    let seen: number[] = []
    const got = new Set<number>()
    for (let n = 0; n < FORTUNES.length; n++) {
      const r = nextFortune(seen, 42)
      expect(got.has(r.index)).toBe(false)
      got.add(r.index)
      seen = r.seen
    }
    expect(got.size).toBe(FORTUNES.length)
    expect(nextFortune(seen, 42).seen).toHaveLength(1)
  })
  it('has 67 fortunes in the planned tone mix, with no repeats', async () => {
    const { FORTUNES } = await import('./fortunes')
    expect(FORTUNES).toHaveLength(67)
    const counts: Record<string, number> = {}
    for (const f of FORTUNES) counts[f.tone] = (counts[f.tone] ?? 0) + 1
    expect(counts).toEqual({ blessing: 15, playful: 15, poetic: 12, home: 8, travel: 7, elders: 10 })
    expect(new Set(FORTUNES.map(f => f.en.trim())).size).toBe(67)
    expect(new Set(FORTUNES.map(f => f.ta.trim())).size).toBe(67)
    for (const f of FORTUNES) expect(f.en.length).toBeLessThanOrEqual(110)
  })
  it('gives different devices different first fortunes', async () => {
    const { nextFortune } = await import('./fortunes')
    const firsts = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => nextFortune([], seed).index))
    expect(firsts.size).toBeGreaterThan(2)
  })
})

describe('invite QR', () => {
  it('encodes the directions link into a valid QR grid', async () => {
    const { qrModules } = await import('../components/Qr')
    const rows = qrModules(directionsUrl(SAMPLE))
    expect(rows.length).toBeGreaterThanOrEqual(21)
    expect((rows.length - 17) % 4).toBe(0)
    // Finder pattern: top-left 7×7 has a dark outer ring and a light inner ring.
    expect(rows[0].slice(0, 7).every(Boolean)).toBe(true)
    expect(rows[1].slice(1, 6).some(Boolean)).toBe(false)
  })
})

describe('studio JSON-LD', () => {
  it('splits the CMS address and lists the package offers', async () => {
    const { studioJsonLd } = await import('./seo')
    const ld = studioJsonLd({ phone: '+91 98940 12345', email: 'hello@x.in', addressEn: '14, West Masi Street, Madurai 625001' }, ['Madurai'], [{ name: 'Gold', price: 29999 }])
    expect(ld.address).toMatchObject({ streetAddress: '14, West Masi Street', addressLocality: 'Madurai', postalCode: '625001' })
    expect(ld.telephone).toBe('+919894012345')
    expect(ld.makesOffer[0]).toMatchObject({ price: 29999, priceCurrency: 'INR' })
  })
})
