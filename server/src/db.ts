import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

export type DB = Database.Database

/** Append-only. Each entry runs once, tracked by PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `
  -- Every store record, in the frontend's own shape (see src/api/collections.ts).
  -- owner / parent / code are lookup keys filled by server/src/keys.ts.
  CREATE TABLE docs (
    coll TEXT NOT NULL,
    id TEXT NOT NULL,
    owner TEXT,
    parent TEXT,
    code TEXT,
    pos REAL NOT NULL,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (coll, id)
  ) WITHOUT ROWID;
  CREATE INDEX docs_owner ON docs (coll, owner);
  CREATE INDEX docs_parent ON docs (coll, parent);
  CREATE INDEX docs_code ON docs (coll, code);

  CREATE TABLE admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    disabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    grants TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    user_agent TEXT,
    ip TEXT
  );

  -- Login codes. On the LAN there is no SMS: staff read the code off the admin screen.
  CREATE TABLE otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    purpose TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TEXT
  );
  CREATE INDEX otps_phone ON otps (phone, purpose);

  -- Failed PIN / password attempts, for lockouts.
  CREATE TABLE attempts (
    key TEXT NOT NULL,
    at TEXT NOT NULL
  );
  CREATE INDEX attempts_key ON attempts (key, at);

  CREATE TABLE audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor TEXT,
    action TEXT NOT NULL,
    target TEXT,
    at TEXT NOT NULL
  );

  -- Drive catalogue rows (too many for the browser store; never synced whole).
  CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    drive_id TEXT NOT NULL,
    studio_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    kind TEXT NOT NULL,
    fingerprint TEXT,
    data TEXT NOT NULL
  );
  CREATE INDEX assets_drive ON assets (drive_id);
  CREATE INDEX assets_search ON assets (studio_id, filename COLLATE NOCASE);
  CREATE INDEX assets_fp ON assets (studio_id, fingerprint);
  `,
]

export function openDb(dataDir: string): DB {
  let file = ':memory:'
  if (dataDir !== ':memory:') {
    fs.mkdirSync(dataDir, { recursive: true })
    file = path.join(dataDir, 'ttc.db')
  }
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  migrate(db)
  return db
}

function migrate(db: DB) {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v])
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}
