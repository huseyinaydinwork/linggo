// SQLite (Node yerleşik node:sqlite) — şema ve küçük yardımcılar
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 4000;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL DEFAULT '',
    pass_hash     TEXT NOT NULL,
    verified      INTEGER NOT NULL DEFAULT 0,
    role          TEXT NOT NULL DEFAULT 'user',
    plan          TEXT NOT NULL DEFAULT 'free',
    plan_until    INTEGER,
    plan_note     TEXT NOT NULL DEFAULT '',
    progress      TEXT,
    progress_at   INTEGER NOT NULL DEFAULT 0,
    stats         TEXT,
    admin_note    TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL,
    last_seen     INTEGER
  );

  CREATE TABLE IF NOT EXISTS codes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose     TEXT NOT NULL,
    code_hash   TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS codes_user ON codes(user_id, purpose);

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL,
    ua          TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS events (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type     TEXT NOT NULL,
    data     TEXT,
    ts       INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS events_user ON events(user_id, ts);
  CREATE INDEX IF NOT EXISTS events_type ON events(type, ts);

  CREATE TABLE IF NOT EXISTS item_stats (
    item   TEXT PRIMARY KEY,
    kind   TEXT NOT NULL,
    ok     INTEGER NOT NULL DEFAULT 0,
    wrong  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS content (
    key         TEXT PRIMARY KEY,
    json        TEXT NOT NULL,
    updated_at  INTEGER NOT NULL,
    updated_by  INTEGER
  );

  -- every content change keeps the previous version (for the change log and one-click restore)
  CREATE TABLE IF NOT EXISTS content_history (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    key       TEXT NOT NULL,
    action    TEXT NOT NULL,           -- edit | import | reset | revert
    prev      TEXT NOT NULL,           -- JSON before the change
    diff      TEXT NOT NULL DEFAULT '{}',
    summary   TEXT NOT NULL DEFAULT '',
    note      TEXT NOT NULL DEFAULT '',
    admin_id  INTEGER,
    ts        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS content_history_key ON content_history(key, ts);

  CREATE TABLE IF NOT EXISTS admin_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id  INTEGER,
    action    TEXT NOT NULL,
    target    TEXT,
    detail    TEXT,
    ts        INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id    TEXT NOT NULL,
    source     TEXT NOT NULL,          -- free | coins | paid | gift | grant(coins)
    coins      INTEGER NOT NULL DEFAULT 0, -- spent (+) or granted (-)
    ts         INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS purchases_user ON purchases(user_id);

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind       TEXT NOT NULL,          -- plan | item
    ref        TEXT NOT NULL,          -- premium-monthly | premium-yearly | item id
    amount     REAL NOT NULL,
    currency   TEXT NOT NULL DEFAULT 'TRY',
    status     TEXT NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
    provider   TEXT NOT NULL DEFAULT 'manual',
    note       TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_status ON orders(status, created_at);

  CREATE TABLE IF NOT EXISTS email_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    template  TEXT NOT NULL,
    ref       TEXT NOT NULL DEFAULT '',  -- dedupe key (e.g. week, plan_until)
    subject   TEXT NOT NULL DEFAULT '',
    status    TEXT NOT NULL,              -- sent | dev | failed | skipped
    error     TEXT,
    ts        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS email_log_user ON email_log(user_id, template, ref);
  CREATE INDEX IF NOT EXISTS email_log_ts ON email_log(ts);

  CREATE TABLE IF NOT EXISTS campaigns (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject    TEXT NOT NULL,
    title      TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL,
    cta        TEXT NOT NULL DEFAULT '',
    segment    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'draft', -- draft | sending | sent
    sent       INTEGER NOT NULL DEFAULT 0,
    failed     INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at INTEGER NOT NULL,
    sent_at    INTEGER
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rewards (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key      TEXT NOT NULL,             -- m:<date>:<mission> | d:<date> | lv:<n> | b:<badge> | st:<n>
    tier     TEXT NOT NULL,
    coins    INTEGER NOT NULL DEFAULT 0,
    xp       INTEGER NOT NULL DEFAULT 0,
    item_id  TEXT,
    missed   INTEGER NOT NULL DEFAULT 0, -- extra coins a Premium member would have got (upsell hint)
    ts       INTEGER NOT NULL,
    UNIQUE (user_id, key)
  );
`);

// Column migrations for databases created by earlier versions
const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map(c => c.name));
const addCol = (name, def) => { if (!cols.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`); };
addCol('marketing', 'INTEGER NOT NULL DEFAULT 0');
if (!cols.has('coins_earned')) { db.exec('ALTER TABLE users ADD COLUMN coins_earned REAL NOT NULL DEFAULT 0'); db.exec('UPDATE users SET coins_earned = 50'); }
addCol('xp_seen', 'INTEGER NOT NULL DEFAULT 0');
addCol('level', "TEXT NOT NULL DEFAULT ''");

export const q = {
  get: (sql, ...a) => db.prepare(sql).get(...a),
  all: (sql, ...a) => db.prepare(sql).all(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};

export function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

export function adminLog(adminId, action, target = '', detail = '') {
  q.run('INSERT INTO admin_log (admin_id, action, target, detail, ts) VALUES (?,?,?,?,?)', adminId, action, String(target), typeof detail === 'string' ? detail : JSON.stringify(detail), Date.now());
}

// Periodic cleanup of expired codes/sessions and very old events
export function housekeeping() {
  const now = Date.now();
  q.run('DELETE FROM codes WHERE expires_at < ?', now - 864e5);
  q.run('DELETE FROM sessions WHERE expires_at < ?', now);
  q.run('DELETE FROM events WHERE ts < ?', now - 400 * 864e5);
}
