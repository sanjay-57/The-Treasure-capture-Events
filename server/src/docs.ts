import type { Coll } from '../../src/api/collections'
import type { DB } from './db'
import { KEYS } from './keys'
import { now } from './util'

export interface Doc {
  id: string
  doc: any
}

type Field = 'owner' | 'parent' | 'code'

/** Typed access to the docs table. Every read returns rows in display order (pos). */
export class Docs {
  private q: Record<string, any>

  constructor(public db: DB) {
    this.q = {
      get: db.prepare('SELECT id, data FROM docs WHERE coll = ? AND id = ?'),
      all: db.prepare('SELECT id, data FROM docs WHERE coll = ? ORDER BY pos'),
      owner: db.prepare('SELECT id, data FROM docs WHERE coll = ? AND owner = ? ORDER BY pos'),
      parent: db.prepare('SELECT id, data FROM docs WHERE coll = ? AND parent = ? ORDER BY pos'),
      code: db.prepare('SELECT id, data FROM docs WHERE coll = ? AND code = ? ORDER BY pos'),
      pos: db.prepare('SELECT pos FROM docs WHERE coll = ? AND id = ?'),
      bounds: db.prepare('SELECT MIN(pos) lo, MAX(pos) hi FROM docs WHERE coll = ?'),
      put: db.prepare(
        `INSERT INTO docs (coll, id, owner, parent, code, pos, data, updated_at) VALUES (@coll, @id, @owner, @parent, @code, @pos, @data, @at)
         ON CONFLICT (coll, id) DO UPDATE SET owner = @owner, parent = @parent, code = @code, data = @data, updated_at = @at`,
      ),
      del: db.prepare('DELETE FROM docs WHERE coll = ? AND id = ?'),
      wipe: db.prepare('DELETE FROM docs'),
      count: db.prepare('SELECT COUNT(*) n FROM docs WHERE coll = ?'),
    }
  }

  private rows(stmt: any, ...args: unknown[]): Doc[] {
    return (stmt.all(...args) as { id: string; data: string }[]).map(r => ({ id: r.id, doc: JSON.parse(r.data) }))
  }

  get(coll: Coll, id: string): any | undefined {
    const r = this.q.get.get(coll, id) as { data: string } | undefined
    return r ? JSON.parse(r.data) : undefined
  }
  all(coll: Coll): Doc[] {
    return this.rows(this.q.all, coll)
  }
  by(coll: Coll, field: Field, value: string | null | undefined): Doc[] {
    if (!value) return []
    return this.rows(this.q[field], coll, value)
  }
  count(coll: Coll): number {
    return (this.q.count.get(coll) as { n: number }).n
  }
  exists(coll: Coll, id: string): boolean {
    return !!this.q.pos.get(coll, id)
  }

  /** Insert or update. New rows go first (prepend) or last in display order. */
  put(coll: Coll, id: string, doc: unknown, prepend = false) {
    const k = KEYS[coll](doc as Record<string, unknown>, id)
    let pos = (this.q.pos.get(coll, id) as { pos: number } | undefined)?.pos
    if (pos === undefined) {
      const b = this.q.bounds.get(coll) as { lo: number | null; hi: number | null }
      pos = prepend ? (b.lo ?? 0) - 1 : (b.hi ?? 0) + 1
    }
    this.q.put.run({ coll, id, owner: k.owner ?? null, parent: k.parent ?? null, code: k.code ?? null, pos, data: JSON.stringify(doc), at: now() })
  }
  del(coll: Coll, id: string) {
    this.q.del.run(coll, id)
  }
  wipe() {
    this.q.wipe.run()
  }
  tx<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }
}
