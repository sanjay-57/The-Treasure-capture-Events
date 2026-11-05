/**
 * npm --prefix server run admin -- password [name]   new random password for an admin (default: admin)
 * npm --prefix server run admin -- seed demo|empty    wipe all records and reload (accounts stay)
 * Stop the server first.
 */
import { loadConfig } from './config'
import { openDb } from './db'
import { Docs } from './docs'
import { Engine } from './engine/engine'
import { hashPassword } from './auth/password'
import { seed, type SeedMode } from './seed'
import { id, now, token } from './util'

const [cmd, arg] = process.argv.slice(2)
const cfg = loadConfig()
const db = openDb(cfg.dataDir)

if (cmd === 'password') {
  const name = arg || cfg.adminName
  const password = token(9)
  const hash = hashPassword(password)
  const row = db.prepare('SELECT id FROM admins WHERE name = ?').get(name) as { id: string } | undefined
  if (row) db.prepare('UPDATE admins SET password_hash = ?, disabled = 0 WHERE id = ?').run(hash, row.id)
  else db.prepare('INSERT INTO admins (id, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(id('ad'), name, hash, now())
  db.prepare('DELETE FROM attempts WHERE key = ?').run('admin:' + name.toLowerCase())
  console.log(`Admin "${name}" password: ${password}`)
} else if (cmd === 'seed' && (arg === 'demo' || arg === 'empty')) {
  const docs = new Docs(db)
  db.prepare('DELETE FROM assets').run()
  seed(new Engine(docs, () => {}), docs, arg as SeedMode)
  console.log(`Reloaded: ${arg}`)
} else {
  console.log('Usage: npm --prefix server run admin -- password [name] | seed demo|empty')
  process.exitCode = 1
}
db.close()
