// Central registry for companies and users (auth + company resolution).
// One global SQLite file that identifies which gym DB belongs to each company.
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

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
  status TEXT NOT NULL DEFAULT 'active',
  features TEXT,
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
  avatar TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  interval TEXT NOT NULL DEFAULT 'monthly',
  price_cents INTEGER NOT NULL DEFAULT 0,
  features TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_end TEXT,
  current_period_start TEXT DEFAULT (date('now')),
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  due_date TEXT,
  paid_at TEXT,
  hosted_url TEXT,
  pdf_url TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  company_id TEXT REFERENCES companies(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_company ON admin_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_actor ON admin_actions(actor_user_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  invoice_id TEXT REFERENCES invoices(id),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT,
  payment_reference TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
`);

const cols = db.prepare("PRAGMA table_info(users)").all().map(x => x.name);
const need = [
  ['phone', 'ALTER TABLE users ADD COLUMN phone TEXT'],
  ['gym_address', "ALTER TABLE users ADD COLUMN gym_address TEXT"],
  ['gps_location', "ALTER TABLE users ADD COLUMN gps_location TEXT"],
  ['mobile_number', "ALTER TABLE users ADD COLUMN mobile_number TEXT"],
  ['avatar', "ALTER TABLE users ADD COLUMN avatar TEXT"],
  ['is_admin', 'ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0']
];
for (const [name, sql] of need) {
  if (!cols.includes(name)) {
    try { db.exec(sql); } catch (e) { /* ignore */ }
  }
}

const companyCols = db.prepare("PRAGMA table_info(companies)").all().map(x => x.name);
const companyNeed = [
  ['status', "ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active'"],
  ['features', 'ALTER TABLE companies ADD COLUMN features TEXT']
];
for (const [name, sql] of companyNeed) {
  if (!companyCols.includes(name)) {
    try { db.exec(sql); } catch (e) { /* ignore */ }
  }
}

function seedDefaults() {
  const planCount = db.prepare('SELECT COUNT(*) as c FROM plans').get().c;
  if (planCount === 0) {
    const plans = [
      { name: 'Starter', slug: 'starter', interval: 'monthly', priceCents: 2900, features: JSON.stringify({ trainers: 2, storage: '5GB' }) },
      { name: 'Growth', slug: 'growth', interval: 'monthly', priceCents: 7900, features: JSON.stringify({ trainers: 10, storage: '20GB', analytics: true }) },
      { name: 'Enterprise', slug: 'enterprise', interval: 'monthly', priceCents: 19900, features: JSON.stringify({ trainers: 50, storage: '100GB', analytics: true, prioritySupport: true }) }
    ];
    const insert = db.prepare('INSERT INTO plans (id, name, slug, interval, price_cents, features) VALUES (?, ?, ?, ?, ?, ?)');
    plans.forEach(p => insert.run(uuidv4(), p.name, p.slug, p.interval, p.priceCents, p.features));
    console.log('Seeded default plans.');
  }
}
seedDefaults();

module.exports = db;
