import type { ServerResponse } from 'node:http'
import type { Change } from '../../../src/api/collections'
import type { Docs } from '../docs'
import type { Sessions } from '../auth/sessions'
import { Scope } from '../policy/scope'

interface Conn {
  res: ServerResponse
  tokenHash?: string
}

const KEEP = 500

/**
 * Server-Sent Events. Every committed change goes to each open tab, filtered by
 * what that tab's session may see. Grants are re-read on each publish, so a tab
 * that just logged in starts receiving more without reconnecting.
 */
export class Hub {
  seq = 0
  private log: { seq: number; changes: Change[] }[] = []
  private conns = new Set<Conn>()
  private beat: NodeJS.Timeout

  constructor(private sessions: Sessions, private docs: Docs) {
    this.beat = setInterval(() => {
      for (const c of this.conns) c.res.write(': ping\n\n')
    }, 20_000)
    this.beat.unref()
  }

  get size() {
    return this.conns.size
  }

  publish(changes: Change[]) {
    if (!changes.length) return
    const seq = ++this.seq
    this.log.push({ seq, changes })
    if (this.log.length > KEEP) this.log.shift()
    for (const c of this.conns) this.send(c, seq, changes)
  }

  /** Non-record events for admin tabs (login codes). */
  toAdmins(event: string, data: unknown) {
    for (const c of this.conns) {
      if (!c.tokenHash || !this.sessions.readHash(c.tokenHash).grants.admin) continue
      c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }
  }

  attach(res: ServerResponse, tokenHash: string | undefined, lastId: number | undefined) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(`retry: 3000\nevent: hello\ndata: ${JSON.stringify({ seq: this.seq })}\n\n`)
    const conn: Conn = { res, tokenHash }
    if (lastId !== undefined && lastId < this.seq) {
      const oldest = this.log[0]?.seq ?? this.seq + 1
      if (lastId + 1 < oldest) res.write('event: resync\ndata: {}\n\n')
      else for (const e of this.log) if (e.seq > lastId) this.send(conn, e.seq, e.changes)
    }
    this.conns.add(conn)
    res.on('close', () => this.conns.delete(conn))
  }

  private send(c: Conn, seq: number, changes: Change[]) {
    const grants = c.tokenHash ? this.sessions.readHash(c.tokenHash).grants : undefined
    if (!grants) return
    const out = new Scope(grants, this.docs).filter(changes)
    if (out.length) c.res.write(`id: ${seq}\nevent: changes\ndata: ${JSON.stringify({ seq, changes: out })}\n\n`)
  }

  close() {
    clearInterval(this.beat)
    for (const c of this.conns) c.res.end()
    this.conns.clear()
  }
}
