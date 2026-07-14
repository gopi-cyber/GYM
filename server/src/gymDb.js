// Per-company isolated database connection cache for VigorGMS.
// Each company gets its own SQLite file under `data/gyms/<company_slug>.db`.
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const GYM_DIR = path.resolve(__dirname, '..', process.env.GYM_DB_DIR || 'data/gyms');
fs.mkdirSync(GYM_DIR, { recursive: true });

const cache = new Map();

function forCompany(companyId, dbPath) {
  if (cache.has(companyId)) return cache.get(companyId);

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
CREATE TABLE IF NOT EXISTS directory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('trainer','doctor')),
  specialty TEXT,
  experience TEXT,
  hospital TEXT,
  avatar TEXT,
  bio TEXT,
  linked_user_id TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('equipment','subliment')),
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Functional',
  threshold INTEGER,
  last_serviced TEXT
);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(company_id);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  duration REAL
);
CREATE INDEX IF NOT EXISTS idx_attendance_company_user ON attendance(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(company_id, date);

CREATE TABLE IF NOT EXISTS fitness_plans (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  trainer_id TEXT,
  workout_plan TEXT,
  nutrition_plan TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fitness_plans_company_customer ON fitness_plans(company_id, customer_id);
  `);

  cache.set(companyId, db);
  return db;
}

function get(companyId) {
  if (!cache.has(companyId)) throw new Error('Gym database not initialized for company: ' + companyId);
  return cache.get(companyId);
}

function closeAll() {
  for (const db of cache.values()) db.close();
  cache.clear();
}

module.exports = { forCompany, get, closeAll };
