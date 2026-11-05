import fs from 'node:fs'
import path from 'node:path'
import type { Ctx } from '../context'

const KEEP = 14

/** Copies ttc.db (consistent online backup) and new media files to BACKUP_DIR. */
export async function backupNow(ctx: Ctx): Promise<{ file: string }> {
  const dir = ctx.cfg.backupDir!
  fs.mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const file = path.join(dir, `ttc-${stamp}.db`)
  await ctx.db.backup(file)
  fs.cpSync(ctx.media.root, path.join(dir, 'media'), { recursive: true, force: false, errorOnExist: false })
  const old = fs.readdirSync(dir).filter(f => /^ttc-.*\.db$/.test(f)).sort()
  for (const f of old.slice(0, Math.max(0, old.length - KEEP))) fs.rmSync(path.join(dir, f), { force: true })
  return { file }
}

/** Hourly housekeeping, and the nightly backup at 02:00 when BACKUP_DIR is set. */
export function startJobs(ctx: Ctx, log: (m: string) => void): () => void {
  let lastBackupDay = ''
  const tick = async () => {
    ctx.sessions.sweep()
    ctx.attempts.sweep()
    ctx.db.prepare('DELETE FROM otps WHERE expires_at < ?').run(new Date(Date.now() - 864e5).toISOString())
    const d = new Date()
    const day = d.toISOString().slice(0, 10)
    if (ctx.cfg.backupDir && d.getHours() === 2 && lastBackupDay !== day) {
      lastBackupDay = day
      try {
        log(`Backup written: ${(await backupNow(ctx)).file}`)
      } catch (e) {
        log(`Backup failed: ${(e as Error).message}`)
      }
    }
  }
  const t = setInterval(tick, 15 * 60_000)
  t.unref()
  return () => clearInterval(t)
}
