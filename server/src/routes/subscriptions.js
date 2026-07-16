const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { registry, requireSubscription, recordAdminAction } = require('../middleware/subscription');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/subscriptions/current
router.get('/current', requireAuth, requireSubscription, (req, res) => {
  const row = registry.prepare(
    `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.price_cents, p.interval, p.features
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.company_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`
  ).get(req.user.company_id);
  if (!row) return res.status(404).json({ error: 'No subscription' });
  res.json({ ...row, features: safeParse(row.features) });
});

// POST /api/subscriptions/checkout { plan_slug }
router.post('/checkout', requireAuth, requireRole('owner'), (req, res) => {
  const { plan_slug } = req.body || {};
  const plan = registry.prepare('SELECT * FROM plans WHERE slug = ? AND active = 1').get(plan_slug);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const sub = registry.prepare('SELECT s.* FROM subscriptions s WHERE s.company_id = ? ORDER BY s.created_at DESC LIMIT 1').get(req.user.company_id);
  if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
    return res.status(409).json({ error: 'Active subscription already exists' });
  }

  const id = uuidv4();
  const todayISO = new Date().toISOString().slice(0, 10);
  const periodEndISO = addMonths(todayISO, 1);
  const trialEndISO = addMonths(todayISO, 1);

  registry.prepare(
    `INSERT INTO subscriptions (id, company_id, plan_id, status, current_period_start, current_period_end, trial_end, metadata)
     VALUES (?, ?, ?, 'trialing', ?, ?, ?, ?)`
  ).run(id, req.user.company_id, plan.id, todayISO, periodEndISO, trialEndISO, JSON.stringify({ plan_slug: plan.slug }));

  recordAdminAction(req, 'subscription.checkout', 'subscription', id, { plan_slug: plan.slug });

  const row = registry.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  res.status(201).json(row);
});

// POST /api/subscriptions/:id/cancel
router.post('/:id/cancel', requireAuth, requireRole('owner'), (req, res) => {
  const row = registry.prepare("SELECT * FROM subscriptions WHERE id = ? AND company_id = ?").get(req.params.id, req.user.company_id);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });
  if (row.status === 'canceled') return res.status(409).json({ error: 'Subscription already canceled' });
  const canceledAt = new Date().toISOString();
  registry.prepare(
    'UPDATE subscriptions SET status = ?, cancel_at_period_end = 1, updated_at = ? WHERE id = ?'
  ).run('canceled', canceledAt, row.id);
  recordAdminAction(req, 'subscription.cancel', 'subscription', row.id);
  res.json(registry.prepare('SELECT * FROM subscriptions WHERE id = ?').get(row.id));
});

// GET /api/subscriptions/usage (basic usage summary)
router.get('/usage', requireAuth, requireSubscription, (req, res) => {
  const counts = {};
  ['inventory', 'attendance', 'fitness_plans'].forEach(table => {
    counts[table] = req.gymDb.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE company_id = ?`).get(req.user.company_id).c;
  });
  res.json({ company_id: req.user.company_id, usage: counts });
});

function safeParse(text) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

module.exports = router;
