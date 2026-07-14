const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/inventory - anyone authenticated in this company can view
router.get('/', requireAuth, (req, res) => {
  const rows = req.gymDb
    .prepare('SELECT * FROM inventory WHERE company_id = ?')
    .all(req.user.company_id);
  res.json(rows);
});

// POST /api/inventory - owner only
router.post('/', requireAuth, requireRole('owner'), (req, res) => {
  const { name, type, quantity, status, threshold, last_serviced } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  const id = uuidv4();
  req.gymDb.prepare(
    `INSERT INTO inventory (id, company_id, name, type, quantity, status, threshold, last_serviced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.company_id, name, type, quantity || 0, status || 'Functional', threshold ?? null, last_serviced ?? null);
  checkLowStock(req.gymDb, req.user.company_id);
  res.status(201).json(req.gymDb.prepare('SELECT * FROM inventory WHERE id = ?').get(id));
});

// PUT /api/inventory/:id - owner only
router.put('/:id', requireAuth, requireRole('owner'), (req, res) => {
  const existing = req.gymDb.prepare('SELECT * FROM inventory WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const merged = { ...existing, ...req.body };
  req.gymDb.prepare(
    `UPDATE inventory SET name=?, type=?, quantity=?, status=?, threshold=?, last_serviced=? WHERE id=? AND company_id=?`
  ).run(merged.name, merged.type, merged.quantity, merged.status, merged.threshold, merged.last_serviced, req.params.id, req.user.company_id);
  checkLowStock(req.gymDb, req.user.company_id);
  res.json(req.gymDb.prepare('SELECT * FROM inventory WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id));
});

// DELETE /api/inventory/:id - owner only
router.delete('/:id', requireAuth, requireRole('owner'), (req, res) => {
  req.gymDb.prepare('DELETE FROM inventory WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.status(204).end();
});

function checkLowStock(req, gymDb, companyId) {
  try {
    const rows = gymDb.prepare("SELECT name, quantity, threshold FROM inventory WHERE company_id = ? AND threshold IS NOT NULL AND quantity <= threshold").all(companyId);
    if (!rows.length) return;
    const registry = req.registryDb;
    const owners = registry.prepare("SELECT id, name, phone, email FROM users WHERE company_id = ? AND role = 'owner'").all(companyId);
    const msg = `Low stock alert: ${rows.map(r => `${r.name} (${r.quantity}/${r.threshold})`).join(', ')}`;
    owners.forEach(o => {
      sendSms(o.phone, msg, o);
      console.log(`SMS queued for gym owner ${o.name || o.email}: ${msg}`);
    });
  } catch (err) {
    console.error('Low stock notification failed:', err.message);
  }
}

function sendSms(phone, text, owner) {
  if (!phone) return;
  if (process.env.SMS_PROVIDER === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    client.messages.create({ body: text, from: process.env.TWILIO_FROM, to: phone }).catch(err => console.error('Twilio SMS failed:', err.message));
  } else if (process.env.SMS_PROVIDER === 'firebase' && process.env.FIREBASE_SERVER_KEY) {
    const https = require('https');
    const data = JSON.stringify({ to: phone, notification: { title: 'VigorGMS', body: text } });
    const options = { hostname: 'fcm.googleapis.com', path: '/fcm/send', method: 'POST', headers: { Authorization: 'key=' + process.env.FIREBASE_SERVER_KEY, 'Content-Type': 'application/json' } };
    const req = https.request(options, res => { const body = []; res.on('data', chunk => body.push(chunk)); res.on('end', () => { if (!String.fromCharCode.apply(null, body).includes('success')) console.error('Firebase SMS failed'); }); });
    req.on('error', err => console.error('Firebase SMS failed:', err.message));
    req.write(data);
    req.end();
  } else {
    console.log(`[SMS] to=${phone} owner=${owner && owner.name || owner && owner.email || ''} body=${text}`);
  }
}

module.exports = router;
