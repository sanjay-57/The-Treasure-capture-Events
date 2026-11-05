import type { Me } from '../../../src/api/collections'

/**
 * What one browser session may do. A device can hold several at once
 * (the studio laptop is admin and can also open a customer's gallery link).
 */
export interface Grants {
  admin?: { id: string; name: string }
  customer?: string
  orderIds: string[]
  studioId?: string
  verified?: string
  gates: { projects: string[]; events: string[] }
}

export const emptyGrants = (): Grants => ({ orderIds: [], gates: { projects: [], events: [] } })

export const isEmpty = (g: Grants) => !g.admin && !g.customer && !g.studioId && !g.verified && !g.orderIds.length && !g.gates.projects.length && !g.gates.events.length

export const toMe = (g: Grants): Me => ({
  admin: g.admin ? { name: g.admin.name } : undefined,
  customer: g.customer,
  orderIds: g.orderIds,
  studioId: g.studioId,
  verified: g.verified,
  gates: g.gates,
})

export type Realm = 'admin' | 'customer' | 'studio' | 'gate'

export function dropRealm(g: Grants, realm?: Realm): Grants {
  if (!realm) return emptyGrants()
  const next = structuredClone(g)
  if (realm === 'admin') delete next.admin
  if (realm === 'customer') {
    delete next.customer
    next.orderIds = []
  }
  if (realm === 'studio') {
    delete next.studioId
    delete next.verified
  }
  if (realm === 'gate') next.gates = { projects: [], events: [] }
  return next
}
