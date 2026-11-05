import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Readable } from 'node:stream'
import { bad } from '../util'

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/
const SAFE_FILE = /^[A-Za-z0-9_-]{1,64}(\.t)?\.(jpg|jpeg|png|webp|gif|webm|ogg|m4a|mp3)$/

/**
 * Photos on the laptop's disk. Proofs: media/proofs/<eventId>/<proofId>.jpg (+ .t.jpg thumb).
 * Other uploads (CMS photos, logos): media/files/<key>.<ext>. A B2 adapter can replace this later.
 */
export class Media {
  readonly root: string
  constructor(dataDir: string) {
    this.root = dataDir === ':memory:' ? fs.mkdtempSync(path.join(os.tmpdir(), 'ttc-media-')) : path.join(dataDir, 'media')
    fs.mkdirSync(path.join(this.root, 'proofs'), { recursive: true })
    fs.mkdirSync(path.join(this.root, 'files'), { recursive: true })
  }

  proofFile(eventId: string, file: string): string {
    if (!SAFE_ID.test(eventId) || !SAFE_FILE.test(file)) throw bad('bad_path')
    return path.join(this.root, 'proofs', eventId, file)
  }
  file(key: string): string {
    if (!SAFE_FILE.test(key)) throw bad('bad_path')
    return path.join(this.root, 'files', key)
  }

  async save(target: string, data: Readable | Buffer): Promise<number> {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    const tmp = `${target}.${process.pid}.part`
    if (Buffer.isBuffer(data)) fs.writeFileSync(tmp, data)
    else await pipeline(data, fs.createWriteStream(tmp))
    fs.renameSync(tmp, target)
    return fs.statSync(target).size
  }

  exists(p: string) {
    return fs.existsSync(p)
  }

  removeProof(eventId: string, proofId: string) {
    if (!SAFE_ID.test(eventId) || !SAFE_ID.test(proofId)) return
    for (const f of [`${proofId}.jpg`, `${proofId}.t.jpg`]) fs.rmSync(path.join(this.root, 'proofs', eventId, f), { force: true })
  }
  removeEvent(eventId: string) {
    if (SAFE_ID.test(eventId)) fs.rmSync(path.join(this.root, 'proofs', eventId), { recursive: true, force: true })
  }
}

export const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg',
}
export const EXT_FOR: Record<string, string> = Object.fromEntries(Object.entries(MIME).filter(([e]) => e !== 'jpeg').map(([e, m]) => [m, e]))
