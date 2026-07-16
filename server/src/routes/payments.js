const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { registry, recordAdminAction } = require('../middleware/subscription');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// POST /api/payments/simulate { plan_slug }
router.post('/simulate', requireAuth, requireRole('owner'), (req, res) => {
  const { plan_slug } = req.body || {};

  const plan = registry.prepare('SELECT * FROM plans WHERE slug = ? AND active = 1').get(plan_slug);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const sub = registry.prepare('SELECT * FROM subscriptions WHERE company_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.company_id);
  if (!sub) return res.status(404).json({ error: 'No subscription found for this company' });
  if (sub.status === 'canceled') return res.status(409).json({ error: 'Subscription is canceled' });

  const invoice = registry.prepare(
    `SELECT i.* FROM invoices i
     WHERE i.subscription_id = ?
     ORDER BY i.created_at DESC
     LIMIT 1`
  ).get(sub.id);

  const amountCents = invoice ? Number(invoice.amount_cents) : Number(plan.price_cents);
  const invoiceId = invoice ? invoice.id : uuidv4();

  if (!invoice) {
    registry.prepare(
      `INSERT INTO invoices (id, company_id, subscription_id, amount_cents, status, due_date)
       VALUES (?, ?, ?, ?, 'open', date('now'))`
    ).run(invoiceId, req.user.company_id, sub.id, amountCents);
  }

  const paymentId = uuidv4();
  const nowISO = new Date().toISOString();
  registry.prepare(
    `INSERT INTO payments (id, company_id, subscription_id, invoice_id, amount_cents, currency, status, provider, payment_reference, metadata)
     VALUES (?, ?, ?, ?, ?, 'USD', 'succeeded', 'simulated', ?, ?)`
  ).run(paymentId, req.user.company_id, sub.id, invoiceId, amountCents, `SIM-${Date.now()}`, JSON.stringify({ plan_slug: plan.slug }));

  registry.prepare(`UPDATE invoices SET status = 'paid', paid_at = ? WHERE id = ?`).run(nowISO, invoiceId);
  registry.prepare(`UPDATE subscriptions SET status = 'active', updated_at = ? WHERE id = ?`).run(nowISO, sub.id);

  recordAdminAction(req, 'payment.simulate', 'payment', paymentId, { plan_slug: plan.slug, amount_cents: amountCents, invoice_id: invoiceId });

  const payment = registry.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  const updatedSub = registry.prepare('SELECT * FROM subscriptions WHERE id = ?').get(sub.id);
  const updatedInvoice = registry.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

  res.status(201).json({ payment, subscription: updatedSub, invoice: updatedInvoice });
});

module.exports = router;
