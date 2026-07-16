const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { registry, requireSubscription, recordAdminAction } = require('../middleware/subscription');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const companiesCount = registry.prepare('SELECT COUNT(*) AS c FROM companies').get().c;
  const activeSubs = registry.prepare("SELECT COUNT(*) AS c FROM subscriptions WHERE status = 'active'").get().c;
  const trialing = registry.prepare("SELECT COUNT(*) AS c FROM subscriptions WHERE status = 'trialing'").get().c;
  const invoices = registry.prepare('SELECT COUNT(*) AS c FROM invoices').get().c;
  const paidInvoices = registry.prepare("SELECT COUNT(*) AS c FROM invoices WHERE status = 'paid'").get().c;
  res.json({ companiesCount, activeSubs, trialing, invoices, paidInvoices });
});

// GET /api/admin/companies
router.get('/companies', requireAuth, requireAdmin, (req, res) => {
  const rows = registry.prepare(`
    SELECT c.id, c.name, c.slug, c.status, c.created_at,
      s.status AS subscription_status,
      p.slug AS plan_slug,
      s.current_period_end,
      s.trial_end
    FROM companies c
    LEFT JOIN subscriptions s ON s.company_id = c.id
    LEFT JOIN plans p ON p.id = s.plan_id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

// PUT /api/admin/companies/:id/status
router.put('/companies/:id/status', requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const valid = ['active', 'trialing', 'suspended', 'canceled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status', valid });
  const companyId = req.params.id;
  const row = registry.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!row) return res.status(404).json({ error: 'Company not found' });

  registry.prepare('UPDATE companies SET status = ? WHERE id = ?').run(status, companyId);
  if (status === 'suspended' || status === 'canceled') {
    registry.prepare("UPDATE subscriptions SET status = ?, updated_at = datetime('now') WHERE company_id = ? AND status NOT IN ('canceled')").run(status, companyId);
  }

  recordAdminAction(req, 'company.update_status', 'company', companyId, { status });
  res.json(registry.prepare('SELECT id, name, slug, status FROM companies WHERE id = ?').get(companyId));
});

// GET /api/admin/invoices
router.get('/invoices', requireAuth, requireAdmin, (req, res) => {
  const rows = registry.prepare(`
    SELECT i.*, c.slug AS company_slug, p.slug AS plan_slug
    FROM invoices i
    JOIN companies c ON c.id = i.company_id
    LEFT JOIN subscriptions s ON s.id = i.subscription_id
    LEFT JOIN plans p ON p.id = s.plan_id
    ORDER BY i.created_at DESC
  `).all();
  res.json(rows.map(r => ({ ...r, metadata: safeParse(r.metadata) })));
});

// POST /api/admin/invoices { company_id, subscription_id, amount_cents, due_date }
router.post('/invoices', requireAuth, requireAdmin, (req, res) => {
  const { company_id, subscription_id, amount_cents, due_date } = req.body || {};
  if (!company_id || !subscription_id || !amount_cents) return res.status(400).json({ error: 'company_id, subscription_id, amount_cents required' });
  const id = uuidv4();
  registry.prepare(
    'INSERT INTO invoices (id, company_id, subscription_id, amount_cents, status, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, company_id, subscription_id, Number(amount_cents), 'draft', due_date || null);
  recordAdminAction(req, 'invoice.create', 'invoice', id, { company_id, subscription_id, amount_cents });
  res.status(201).json(registry.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
});

// POST /api/admin/invoices/:id/pay
router.post('/invoices/:id/pay', requireAuth, requireAdmin, (req, res) => {
  const row = registry.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  if (row.status === 'paid') return res.status(409).json({ error: 'Already paid' });
  registry.prepare("UPDATE invoices SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(req.params.id);
  recordAdminAction(req, 'invoice.pay', 'invoice', row.id);
  res.json(registry.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id));
});

// GET /api/admin/actions
router.get('/actions', requireAuth, requireAdmin, (req, res) => {
  const rows = registry.prepare(
    'SELECT a.*, u.name AS actor_name FROM admin_actions a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.created_at DESC LIMIT 100'
  ).all();
  res.json(rows.map(r => ({ ...r, metadata: safeParse(r.metadata) })));
});

function safeParse(text) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

module.exports = router;
