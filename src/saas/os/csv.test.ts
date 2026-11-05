import { describe, expect, it } from 'vitest'
import { normaliseDate, parseCsv, parseProjectCsv, parseRupees, toCsv } from './csv'

describe('parseCsv', () => {
  it('handles quotes, commas, doubled quotes, CRLF and newlines in fields', () => {
    const t = '﻿a,b,c\r\n"x, y","he said ""hi""","line1\nline2"\r\n\r\n1,,3'
    expect(parseCsv(t)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'he said "hi"', 'line1\nline2'],
      ['1', '', '3'],
    ])
  })
  it('round-trips through toCsv', () => {
    const rows = [['a,b', 'c"d', 'e'], ['1', '2', '3']]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe('import helpers', () => {
  it('dates', () => {
    expect(normaliseDate('2026-12-05')).toBe('2026-12-05')
    expect(normaliseDate('5/12/2026')).toBe('2026-12-05')
    expect(normaliseDate('31/02/2026')).toBeNull()
    expect(normaliseDate('Dec 5')).toBeNull()
  })
  it('rupees', () => {
    expect(parseRupees('₹1,50,000')).toBe(150000)
    expect(parseRupees('Rs. 2500.6')).toBe(2501)
    expect(parseRupees('1.5L')).toBeNull()
  })
})

describe('parseProjectCsv', () => {
  it('reads rows in any column order and reports bad lines', () => {
    const t = [
      'Client,Name,Phone,Total,Date,Venue,Type',
      '"Anu & Vijay","Anu Wedding",9876543210,"₹2,36,000",12/01/2027,"Hall, Salem",Wedding',
      'Ravi,,98765,abc,2027-13-01,,',
      'Priya,Priya Shower,+91 98765 43210,,,,',
    ].join('\n')
    const { rows, errors } = parseProjectCsv(t)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ line: 2, name: 'Anu Wedding', client: 'Anu & Vijay', total: 236000, date: '2027-01-12', venue: 'Hall, Salem' })
    expect(rows[1]).toMatchObject({ line: 4, type: 'Wedding', total: undefined, date: undefined })
    expect(errors).toHaveLength(1)
    expect(errors[0].line).toBe(3)
    expect(errors[0].message).toContain('name is empty')
    expect(errors[0].message).toContain('phone')
    expect(errors[0].message).toContain('total')
  })
  it('needs the key columns', () => {
    expect(parseProjectCsv('name,type\nA,B').errors[0].message).toContain('client')
    expect(parseProjectCsv('').errors).toHaveLength(1)
  })
})
