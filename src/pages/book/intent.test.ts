import { describe, expect, it } from 'vitest'
import { parseIntents } from './intent'

const kinds = (text: string) => parseIntents(text)
const items = (text: string) => parseIntents(text).flatMap(i => (i.kind === 'item' ? [i.id] : []))

describe('voice intents', () => {
  it('reads hours in English and Tamil', () => {
    expect(kinds('six hours')).toContainEqual({ kind: 'hours', hours: 6 })
    expect(kinds('make it 10 hours')).toContainEqual({ kind: 'hours', hours: 10 })
    expect(kinds('ஆறு மணி நேரம்')).toContainEqual({ kind: 'hours', hours: 6 })
    expect(kinds('பன்னிரண்டு மணி நேரம்')).toContainEqual({ kind: 'hours', hours: 12 })
    expect(kinds('two sessions')).toContainEqual({ kind: 'sessions', sessions: 2 })
  })
  it('maps package names, including Tamil', () => {
    expect(kinds('switch to gold')).toContainEqual(expect.objectContaining({ kind: 'tier', tier: 'premium' }))
    expect(kinds('கோல்ட் தொகுப்பு')).toContainEqual(expect.objectContaining({ kind: 'tier', tier: 'premium' }))
    expect(kinds('beach')).toContainEqual(expect.objectContaining({ kind: 'tier', tier: 'standard', family: 'outdoor', fallback: 'look_beach' }))
  })
  it('knows the candid styles', () => {
    expect(items('add cinematic')).toEqual(['vid_cinematic'])
    expect(items('add interview video')).toEqual(['vid_documentary'])
    expect(items('add couple portraits')).toEqual(['candid_couple'])
    expect(items('add candid photography')).toEqual(['candid_family'])
    expect(items('add semi candid video')).toEqual(['semi_candid_video'])
    expect(items('we expect 200 guests')).toEqual([])
  })
  it('reads album lines and sheets', () => {
    const i = parseIntents('Aura 35 sheets')
    expect(i).toContainEqual({ kind: 'albumLine', line: 'aura' })
    expect(i).toContainEqual(expect.objectContaining({ kind: 'item', id: 'album_35' }))
    expect(items('10x28 album 45 sheets')).toEqual(['album_1028_45'])
    expect(items('pixel passage album')).toEqual([])
    expect(items('add an album')).toEqual(['album_25'])
  })
  it('does not read hours as a quantity', () => {
    expect(parseIntents('drone for 6 hours')).toContainEqual({ kind: 'item', id: 'drone', op: 'add', qty: undefined })
  })
  it('picks frame sizes and FPV', () => {
    expect(items('add an A3 frame')).toEqual(['frame_a3'])
    expect(items('add fpv drone')).toEqual(['drone_fpv'])
  })
  it('answers questions without changing the cart', () => {
    expect(kinds("what's in gold?")).toEqual([{ kind: 'askPackage', tier: 'premium', family: undefined }])
    expect(kinds('கோல்டில் என்ன இருக்கு')).toContainEqual(expect.objectContaining({ kind: 'askPackage', tier: 'premium' }))
    expect(kinds('how much is silver')).toContainEqual(expect.objectContaining({ kind: 'askPackage', tier: 'standard' }))
    expect(kinds('album எவ்வளவு?')).toEqual([{ kind: 'askAlbum' }])
    expect(kinds('how much is the album')).toEqual([{ kind: 'askAlbum' }])
    expect(kinds('how do albums work')).toEqual([{ kind: 'askAlbum' }])
    expect(kinds('how much is drone?')).toEqual([{ kind: 'askItem', id: 'drone' }])
    expect(kinds('fpv எவ்வளவு')).toEqual([{ kind: 'askItem', id: 'drone_fpv' }])
    expect(kinds('price of an A3 frame')).toEqual([{ kind: 'askItem', id: 'frame_a3' }])
  })
  it('still orders when the customer asks for it', () => {
    expect(kinds('switch to gold')).not.toContainEqual(expect.objectContaining({ kind: 'askPackage' }))
    expect(items('add an album, what is the total')).toEqual(['album_25'])
    expect(kinds("what's my total")).toEqual([{ kind: 'total' }])
  })
})
