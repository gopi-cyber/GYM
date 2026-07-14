// Central registry for companies and users (auth + company resolution).
// One global SQLite file that identifies which gym DB belongs to each company.
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const REGISTRY_PATH = process.env.REGISTRY_DB_PATH || path.resolve(__dirname, '..', 'data', 'registry.db');
fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });

const db = new Database(REGISTRY_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  db_path TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','trainer','customer')),
  company_id TEXT NOT NULL REFERENCES companies(id),
  membership TEXT,
  joined_date TEXT DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now')),
  phone TEXT,
  gym_address TEXT,
  gps_location TEXT,
  mobile_number TEXT,
  avatar TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

const cols = db.prepare("PRAGMA table_info(users)").all().map(x => x.name);
const need = [
  ['phone', 'ALTER TABLE users ADD COLUMN phone TEXT'],
  ['gym_address', "ALTER TABLE users ADD COLUMN gym_address TEXT"],
  ['gps_location', "ALTER TABLE users ADD COLUMN gps_location TEXT"],
  ['mobile_number', "ALTER TABLE users ADD COLUMN mobile_number TEXT"],
  ['avatar', "ALTER TABLE users ADD COLUMN avatar TEXT"]
];
for (const [name, sql] of need) {
  if (!cols.includes(name)) {
    try { db.exec(sql); } catch (e) { /* ignore */ }
  }
}

module.exports = db;
