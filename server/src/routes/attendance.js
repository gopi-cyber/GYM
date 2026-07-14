const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../gymDb');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

function computeDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im);
  return Math.round((mins / 60) * 100) / 100;
}

// GET /api/attendance - owner sees all company rows, customer/trainer see their own
router.get('/', requireAuth, (req, res) => {
  if (req.user.role === 'owner') {
    return res.json(req.gymDb.prepare('SELECT * FROM attendance WHERE company_id = ? ORDER BY date DESC').all(req.user.company_id));
  }
  res.json(req.gymDb.prepare('SELECT * FROM attendance WHERE company_id = ? AND user_id = ? ORDER BY date DESC').all(req.user.company_id, req.user.id));
});

// POST /api/attendance/checkin
router.post('/checkin', requireAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const open = req.gymDb
    .prepare('SELECT * FROM attendance WHERE company_id = ? AND user_id = ? AND date = ? AND check_out IS NULL')
    .get(req.user.company_id, req.user.id, today);
  if (open) return res.status(409).json({ error: 'Already checked in today', record: open });

  const id = uuidv4();
  req.gymDb.prepare('INSERT INTO attendance (id, company_id, user_id, date, check_in) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.company_id, req.user.id, today, now);
  res.status(201).json(req.gymDb.prepare('SELECT * FROM attendance WHERE id = ?').get(id));
});

// POST /api/attendance/checkout
router.post('/checkout', requireAuth, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const open = req.gymDb
    .prepare('SELECT * FROM attendance WHERE company_id = ? AND user_id = ? AND date = ? AND check_out IS NULL')
    .get(req.user.company_id, req.user.id, today);
  if (!open) return res.status(404).json({ error: 'No open check-in found for today' });

  const duration = computeDuration(open.check_in, now);
  req.gymDb.prepare('UPDATE attendance SET check_out = ?, duration = ? WHERE id = ?').run(now, duration, open.id);
  res.json(req.gymDb.prepare('SELECT * FROM attendance WHERE id = ?').get(open.id));
});

// POST /api/attendance/log { userId } - owner/trainer only
router.post('/log', requireAuth, requireRole('owner', 'trainer'), (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const target = req.registryDb.prepare('SELECT id FROM users WHERE id = ? AND company_id = ?').get(userId, req.user.company_id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const open = req.gymDb
    .prepare('SELECT * FROM attendance WHERE company_id = ? AND user_id = ? AND date = ? AND check_out IS NULL')
    .get(req.user.company_id, userId, today);

  if (open) {
    const duration = computeDuration(open.check_in, now);
    req.gymDb.prepare('UPDATE attendance SET check_out = ?, duration = ? WHERE id = ?').run(now, duration, open.id);
    return res.json(req.gymDb.prepare('SELECT * FROM attendance WHERE id = ?').get(open.id));
  }

  const id = uuidv4();
  req.gymDb.prepare('INSERT INTO attendance (id, company_id, user_id, date, check_in) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.company_id, userId, today, now);
  res.status(201).json(req.gymDb.prepare('SELECT * FROM attendance WHERE id = ?').get(id));
});

// GET /api/attendance/stats/peak-hours - owner only, scoped to company
router.get('/stats/peak-hours', requireAuth, requireRole('owner'), (req, res) => {
  const rows = req.gymDb.prepare('SELECT check_in FROM attendance WHERE company_id = ? AND check_in IS NOT NULL').all(req.user.company_id);
  const buckets = {};
  rows.forEach(r => {
    const hour = r.check_in.split(':')[0];
    buckets[hour] = (buckets[hour] || 0) + 1;
  });
  res.json(buckets);
});

module.exports = router;
