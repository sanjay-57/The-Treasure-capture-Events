import { describe, expect, it } from 'vitest'
import {
  CATALOGUE, DEFAULT_PRICES, PLACEHOLDER_PRICE, albumUpgradeCost, bundlePrice, cartLabel, coverageFor, droneMultiplier, hoursMultiplier,
  albumDelta, cartPackageItems, endsPackage, pendingItems, presetName, presetSaving, presetSum, setCartHours, setCartQty, tierCart, tierPreset, variantDelta, type CatalogueId,
} from './catalogue'
import { EVENTS } from './data'
import { computeQuote, packageInfo } from './pricing'

const FAMILY = { kind: 'family' as const }
const TIERS = ['basic', 'standard', 'premium'] as const

describe('hours → multiplier', () => {
  it.each([
    [2, 0.65], [3, 1], [4, 1], [5, 1.35], [6, 1.65], [7, 2], [8, 2], [9, 2.35], [12, 3], [16, 4],
  ])('%i h → × %f', (h, m) => expect(hoursMultiplier(h)).toBe(m))

  it('clamps to 2–16', () => {
    expect(hoursMultiplier(0)).toBe(0.65)
    expect(hoursMultiplier(40)).toBe(4)
  })

  it('drone has no mini session', () => {
    expect(droneMultiplier(2)).toBe(1)
    expect(droneMultiplier(5)).toBe(2)
    expect(droneMultiplier(8)).toBe(2)
  })

  it('describes the coverage in words', () => {
    expect(coverageFor(6).label.en).toBe('6 hours = 1 session + 2 hours overtime (+65 %)')
    expect(coverageFor(2).label.en).toContain('mini session')
    expect(coverageFor(7).label.en).toContain('rounds up to 2 sessions')
  })

  it('scales per-session crew by the multiplier', () => {
    const cart = { tier: 'custom' as const, sessions: 1, hours: 6, items: { trad_photo: 1 as number } }
    const q = computeQuote({ eventType: 'wedding', cart, distanceKm: 0 })
    expect(q.total).toBe(Math.round(12500 * 1.65))
    expect(q.coverage.multiplier).toBe(1.65)
    expect(q.lines[0].detail?.en).toBe('× 1.65 (6 h)')
  })
})

describe('candid bundles', () => {
  it('one style is à la carte', () => {
    expect(bundlePrice('candid_photo', ['candid_couple']).saving).toBe(0)
  })
  it('any two photo styles: 25 % off their sum', () => {
    const r = bundlePrice('candid_photo', ['candid_couple', 'candid_guests'])
    expect(r.sum).toBe(13500)
    expect(r.price).toBe(10125)
  })
  it('all three photo styles: ₹20,000 flat', () => {
    expect(bundlePrice('candid_photo', ['candid_couple', 'candid_family', 'candid_guests']).price).toBe(20000)
  })
  it('video: two for ₹25,000, three for ₹35,000', () => {
    expect(bundlePrice('candid_video', ['vid_documentary', 'vid_cinematic']).price).toBe(25000)
    expect(bundlePrice('candid_video', ['vid_documentary', 'vid_moments', 'vid_cinematic']).price).toBe(35000)
  })
  it('emits a saving line, bundle first then hours multiplier (mini session)', () => {
    const cart = { tier: 'custom' as const, sessions: 1, hours: 2, items: { candid_couple: 1, candid_family: 1, candid_guests: 1 } }
    const q = computeQuote({ eventType: 'wedding', cart, distanceKm: 0 })
    const saving = q.lines.find(l => l.kind === 'saving')!
    expect(saving.amount).toBe(-Math.round(5500 * 0.65))
    expect(q.total).toBe(Math.round(25500 * 0.65) - Math.round(5500 * 0.65))
  })
})

describe('packages', () => {
  it('Bronze, Silver and Gold hit their targets', () => {
    expect(presetSum(FAMILY, 'basic')).toBe(12500)
    expect(presetSum(FAMILY, 'standard')).toBe(19999)
    expect(presetSum(FAMILY, 'premium')).toBe(33999)
    for (const tier of TIERS) {
      const q = computeQuote({ eventType: 'wedding', cart: tierCart(FAMILY, tier), distanceKm: 0 })
      expect(q.total).toBe(tierPreset(FAMILY, tier).target)
    }
  })
  it('Bronze and Silver have no saving line; Gold saves ₹4,000', () => {
    expect(presetSaving(FAMILY, 'basic')).toBe(0)
    expect(presetSaving(FAMILY, 'standard')).toBe(0)
    expect(presetSaving(FAMILY, 'premium')).toBe(-4000)
    const q = computeQuote({ eventType: 'wedding', cart: tierCart(FAMILY, 'premium'), distanceKm: 0 })
    expect(q.lines.filter(l => l.kind === 'saving')).toHaveLength(1)
    expect(q.package?.saving).toBe(-4000)
  })
  it('every event with targets sums to them at one session', () => {
    for (const ev of EVENTS) for (const tier of TIERS) {
      const target = tierPreset(ev.tiers, tier).target
      if (target === undefined) continue
      expect(computeQuote({ eventType: ev.key, cart: tierCart(ev.tiers, tier), distanceKm: 0 }).total).toBe(target)
    }
  })
  it('removing a non-main item keeps the package and its saving', () => {
    const cart = setCartQty(tierCart(FAMILY, 'premium'), 'calendar', 0)
    expect(cart.tier).toBe('premium')
    const q = computeQuote({ eventType: 'wedding', cart, distanceKm: 0 })
    expect(q.total).toBe(29999 - 749)
    expect(q.package?.removed).toEqual(['calendar'])
    expect(q.package?.label.en).toBe('Gold package − Calendar')
  })
  it('adding an item keeps the package and extends the label', () => {
    const cart = setCartQty(tierCart(FAMILY, 'premium'), 'drone', 1)
    expect(cart.tier).toBe('premium')
    const q = computeQuote({ eventType: 'wedding', cart, distanceKm: 0 })
    expect(q.total).toBe(29999 + 13000)
    expect(q.package?.label.en).toBe('Gold package + Drone · slow-motion')
  })
  it('removing a main item drops to custom and loses the saving', () => {
    const cart = setCartQty(tierCart(FAMILY, 'premium'), 'album_1028_pkg_25', 0)
    expect(cart.tier).toBe('custom')
    const q = computeQuote({ eventType: 'wedding', cart, distanceKm: 0 })
    expect(q.package).toBeUndefined()
    expect(q.lines.some(l => l.kind === 'saving')).toBe(false)
    expect(q.total).toBe(33999 - 5000)
  })
  it('swapping the package album for a non-variant album ends the package', () => {
    const cart = setCartQty(tierCart(FAMILY, 'standard'), 'album_45', 1)
    expect(cart.tier).toBe('custom')
    expect(cart.items.album_a4_15).toBeUndefined()
  })
  it('packageInfo is undefined for custom carts and presets without a target', () => {
    expect(packageInfo('wedding', { ...tierCart(FAMILY, 'basic'), tier: 'custom' })).toBeUndefined()
    expect(packageInfo('model', tierCart({ kind: 'shoot', shootItem: 'model_portfolio' }, 'basic'))).toBeUndefined()
  })
})

describe('package variants', () => {
  it('Silver option 2 is ₹24,999 with no saving line', () => {
    const cart = tierCart(FAMILY, 'standard', 1, undefined, 0)
    expect(cart.items.album_25).toBe(1)
    expect(cart.items.album_a4_15).toBeUndefined()
    const q = computeQuote({ eventType: 'birthday', cart, distanceKm: 0 })
    expect(q.total).toBe(24999)
    expect(q.lines.some(l => l.kind === 'saving')).toBe(false)
  })
  it('Gold option 2 is ₹34,999 with the same ₹4,000 saving', () => {
    const q = computeQuote({ eventType: 'birthday', cart: tierCart(FAMILY, 'premium', 1, undefined, 0), distanceKm: 0 })
    expect(q.total).toBe(34999)
    expect(q.package?.saving).toBe(-4000)
  })
  it('picking the variant album keeps the package and switches variant', () => {
    const cart = setCartQty(tierCart(FAMILY, 'standard'), 'album_25', 1)
    expect(cart.tier).toBe('standard')
    expect(cart.variant).toBe(0)
    expect(computeQuote({ eventType: 'birthday', cart, distanceKm: 0 }).total).toBe(24999)
    const back = setCartQty(cart, 'album_a4_15', 1)
    expect(back.tier).toBe('standard')
    expect(back.variant).toBeUndefined()
  })
  it('removing the variant album drops to custom', () => {
    const cart = setCartQty(tierCart(FAMILY, 'premium', 1, undefined, 0), 'album_35', 0)
    expect(cart.tier).toBe('custom')
  })
})

describe('wedding and outdoor packages', () => {
  const WED = { kind: 'wedding' as const }
  it('wedding uses its own packages at ₹786 placeholders', () => {
    for (const tier of TIERS) {
      expect(tierPreset(WED, tier).pending).toBe(true)
      expect(computeQuote({ eventType: 'wedding', cart: tierCart(WED, tier), distanceKm: 0 }).total).toBe(PLACEHOLDER_PRICE)
    }
    expect(presetName(WED, 'standard').en).toBe('Package 2')
  })
  it('outdoor looks are the packages at ₹10,000 each, reels on top', () => {
    const OUT = { kind: 'outdoor' as const }
    for (const tier of TIERS) expect(computeQuote({ eventType: 'outdoor', cart: tierCart(OUT, tier), distanceKm: 0 }).total).toBe(10000)
    const withReels = setCartQty(tierCart(OUT, 'standard'), 'reels', 1)
    expect(withReels.tier).toBe('standard')
    expect(computeQuote({ eventType: 'outdoor', cart: withReels, distanceKm: 0 }).total).toBe(17000)
  })
  it('cart labels use the preset name', () => {
    expect(cartLabel(tierCart({ kind: 'outdoor' }, 'premium')).en).toBe('Meadow look · 4 h')
  })
})

describe('album upgrades', () => {
  it('Silver A4 → 25 sheets costs the ₹5,000 difference', () => {
    expect(albumUpgradeCost(tierCart(FAMILY, 'standard'), 25)).toBe(5000)
  })
  it('the same tier is free, a bigger tier pays the difference', () => {
    const cart = { tier: 'custom' as const, sessions: 1, items: { album_25: 1 } as Partial<Record<CatalogueId, number>> }
    expect(albumUpgradeCost(cart, 25)).toBe(0)
    expect(albumUpgradeCost(cart, 45)).toBe(8000)
  })
  it('10×28 albums move within the 10×28 tiers', () => {
    const cart = { tier: 'custom' as const, sessions: 1, items: { album_1028_25: 1 } as Partial<Record<CatalogueId, number>> }
    expect(albumUpgradeCost(cart, 35)).toBe(3000)
  })
  it('no album pays the full tier price', () => {
    expect(albumUpgradeCost({ tier: 'custom', sessions: 1, items: {} }, 35)).toBe(10000)
  })
})

describe('reels need an outdoor shoot', () => {
  it('are refused without one', () => {
    const cart = setCartQty(tierCart(FAMILY, 'basic'), 'reels', 1)
    expect(cart.items.reels).toBeUndefined()
  })
  it('are dropped with the last outdoor item', () => {
    const custom = { tier: 'custom' as const, sessions: 1, items: { outdoor_mini: 1 } as Partial<Record<CatalogueId, number>> }
    const withReels = setCartQty(custom, 'reels', 1)
    expect(withReels.items.reels).toBe(1)
    expect(setCartQty(withReels, 'outdoor_mini', 0).items.reels).toBeUndefined()
  })
})

describe('catalogue hygiene', () => {
  it('every ₹786 item is flagged pending', () => {
    for (const i of CATALOGUE) if (i.price === PLACEHOLDER_PRICE) expect(i.pending, i.id).toBe(true)
    expect(pendingItems().map(i => i.id)).toContain('wooden_box')
  })
  it('on-request items never add to the total', () => {
    const cart = { tier: 'custom' as const, sessions: 1, items: { ledwall: 1, photobooth: 1, selfie360: 1 } as Partial<Record<CatalogueId, number>> }
    expect(computeQuote({ eventType: 'wedding', cart, distanceKm: 0 }).total).toBe(0)
  })
  it('legacy carts without hours price at sessions × 4 h', () => {
    const cart = { tier: 'custom' as const, sessions: 2, items: { trad_video: 1 } as Partial<Record<CatalogueId, number>> }
    expect(computeQuote({ eventType: 'wedding', cart, distanceKm: 0 }).total).toBe(DEFAULT_PRICES.trad_video * 2)
  })
})

describe('package UI helpers', () => {
  it('variant switch shows the difference: Silver 12×15 +₹5,000, Gold 12×36 +₹5,000', () => {
    expect(variantDelta(FAMILY, 'standard', 0)).toBe(5000)
    expect(variantDelta(FAMILY, 'premium', 0)).toBe(5000)
  })
  it('album cards read as the difference against the album in the cart', () => {
    const silver = tierCart(FAMILY, 'standard')
    expect(albumDelta(silver, 'album_25')).toBe(5000)
    expect(albumDelta({ ...silver, items: {} }, 'album_25')).toBe(6500)
  })
  it('warns before a main item goes, not before an option goes', () => {
    const gold = tierCart(FAMILY, 'premium')
    expect(endsPackage(gold, 'album_1028_pkg_25', 0)).toBe(true)
    expect(endsPackage(gold, 'semi_candid_video', 0)).toBe(true)
    expect(endsPackage(gold, 'calendar', 0)).toBe(false)
    expect(endsPackage(gold, 'drone', 1)).toBe(false)
    expect(endsPackage({ ...gold, tier: 'custom' }, 'trad_photo', 0)).toBe(false)
  })
  it('the package badge list follows the variant', () => {
    const silver2 = tierCart(FAMILY, 'standard', 1, 4, 0)
    const items = cartPackageItems(silver2)
    expect(items.album_25).toBe(1)
    expect(items.album_a4_15).toBeUndefined()
    expect(cartPackageItems({ ...silver2, tier: 'custom' })).toEqual({})
  })
  it('setting hours keeps sessions in step and keeps the package', () => {
    const c = setCartHours(tierCart(FAMILY, 'premium'), 6)
    expect(c.hours).toBe(6)
    expect(c.sessions).toBe(2)
    expect(c.tier).toBe('premium')
    expect(setCartHours(c, 40).hours).toBe(16)
    const q = computeQuote({ eventType: 'birthday', cart: c, distanceKm: 0 })
    expect(q.package?.saving).toBe(-4000)
  })
})
