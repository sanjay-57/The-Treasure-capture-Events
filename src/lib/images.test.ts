import { describe, expect, it } from 'vitest'
import { photoSrcSet, photoUrl, setImageOverrides } from './images'

describe('admin photo replacements', () => {
  it('photoUrl returns the admin URL when one is set, the stock photo otherwise', () => {
    expect(photoUrl('m_couple_bokeh', 800)).toContain('images.unsplash.com')
    expect(photoSrcSet('m_couple_bokeh')).toContain(' 480w')
    setImageOverrides({ m_couple_bokeh: 'https://studio.example/own.jpg' })
    expect(photoUrl('m_couple_bokeh', 800, 600)).toBe('https://studio.example/own.jpg')
    expect(photoSrcSet('m_couple_bokeh')).toBeUndefined()
    expect(photoUrl('m_couple_lights', 800)).toContain('images.unsplash.com')
    setImageOverrides(undefined)
    expect(photoUrl('m_couple_bokeh', 800)).toContain('images.unsplash.com')
  })
})
