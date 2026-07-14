// SQLite connection + schema setup for VigorGMS
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || './data/gms.db';
const resolvedPath = path.resolve(__dirname, '..', dbPath);

// Ensure data directory exists
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---- Schema ----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','trainer','customer')),
  membership TEXT,
  joined_date TEXT DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS directory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('trainer','doctor')),
  specialty TEXT,
  experience TEXT,
  hospital TEXT,
  avatar TEXT,
  bio TEXT,
  linked_user_id TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('equipment','subliment')),
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Functional',
  threshold INTEGER,
  last_serviced TEXT
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  duration REAL
);

CREATE TABLE IF NOT EXISTS fitness_plans (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  trainer_id TEXT REFERENCES users(id),
  workout_plan TEXT,   -- JSON string
  nutrition_plan TEXT, -- JSON string
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
