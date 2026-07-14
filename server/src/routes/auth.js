const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../registry');
const { forCompany } = require('../gymDb');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function generateJwt(user, gymDbPath) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, company_id: user.company_id, gym_db_path: gymDbPath },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, role, companySlug } = req.body;

  // Create or reuse a company registry entry.
  let company = db.prepare('SELECT * FROM companies WHERE slug = ?').get(companySlug);
  if (!company) {
    const companyId = uuidv4();
    const dbPath = require('path').resolve(__dirname, '..', process.env.GYM_DB_DIR || 'data/gyms', `${companySlug}.db`);
    db.prepare('INSERT INTO companies (id, name, slug, db_path) VALUES (?, ?, ?, ?)')
      .run(companyId, companySlug, companySlug, dbPath);
    company = { id: companyId, name: companySlug, slug: companySlug, db_path: dbPath };
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  const allowedRole = ['owner', 'trainer', 'customer'].includes(role) ? role : 'customer';

  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, company_id, phone, gym_address, gps_location, mobile_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, email, hash, name, allowedRole, company.id, req.body.phone || null, req.body.gymAddress || null, req.body.gpsLocation || null, req.body.mobileNumber || null);

  // Ensure gym DB exists for isolation.
  forCompany(company.id, company.db_path);

  const user = { id, email, name, role: allowedRole, company_id: company.id };
  const token = generateJwt(user, company.db_path);
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(row.company_id);
  const user = { id: row.id, email: row.email, name: row.name, role: row.role, company_id: row.company_id };
  const token = generateJwt(user, company.db_path);
  res.json({ token, user });
});

module.exports = router;
