const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { registry, recordAdminAction } = require('../middleware/subscription');
const { requireAuth, requireRole } = require('../auth');
const { sendEmail } = require('../middleware/email');
const { createCheckoutSession } = require('../middleware/stripe');

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

  const ownerEmail = (req.user && req.user.email) || 'owner@example.com';
  void sendEmail({
    to: ownerEmail,
    subject: 'VigorGMS payment confirmation',
    text: `Payment of ${(amountCents / 100).toFixed(2)} USD succeeded for plan ${plan.name}. Subscription is now active.`,
    html: `<h1>Payment Confirmed</h1><p>Plan: <b>${plan.name}</b></p><p>Amount: <b>${(amountCents / 100).toFixed(2)} USD</b></p><p>Subscription status: <b>active</b></p>`,
  }).catch((err) => console.error('[email] async send failed after payment', err));

  res.status(201).json({ payment, subscription: updatedSub, invoice: updatedInvoice });
});

// POST /api/payments/checkout { plan_slug }
router.post('/checkout', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { plan_slug } = req.body || {};
    const origin = (req.headers.origin || `${req.protocol}://${req.headers.host}`).replace(/\/$/, '');
    const session = await createCheckoutSession({
      companyId: req.user.company_id,
      planSlug: plan_slug,
      origin,
      email: req.user.email,
    });
    res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('[payments] checkout failed', err);
    res.status(400).json({ error: err.message || 'Checkout failed' });
  }
});

// POST /api/payments/webhook
// Verifies Stripe webhooks and persists subscription/invoice/events.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(501).json({ error: 'Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET.' });
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' });

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error('[payments] webhook verify failed', err);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const companyId = session.subscription_data && session.subscription_data.metadata && session.subscription_data.metadata.companyId;
      const planSlug = session.subscription_data && session.subscription_data.metadata && session.subscription_data.metadata.planSlug;
      if (companyId && planSlug) {
        const existingSub = registry.prepare('SELECT id FROM subscriptions WHERE company_id = ? ORDER BY created_at DESC LIMIT 1').get(companyId);
        const nowISO = new Date().toISOString();
        const subId = existingSub ? existingSub.id : uuidv4();

        if (!existingSub) {
          registry.prepare('INSERT INTO subscriptions (id, company_id, status, plan_slug, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(subId, companyId, 'active', planSlug, nowISO, nowISO);
        } else {
          registry.prepare('UPDATE subscriptions SET status = ?, plan_slug = ?, updated_at = ? WHERE id = ?').run('active', planSlug, nowISO, subId);
        }

        const invoiceId = uuidv4();
        registry.prepare('INSERT INTO invoices (id, company_id, subscription_id, amount_cents, status, due_date, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(invoiceId, companyId, subId, 0, 'paid', nowISO, nowISO);
        const paymentId = uuidv4();
        registry.prepare('INSERT INTO payments (id, company_id, subscription_id, invoice_id, amount_cents, currency, status, provider, payment_reference, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(paymentId, companyId, subId, invoiceId, 0, 'USD', 'succeeded', 'stripe', session.id, JSON.stringify({ event: event.type }));
        recordAdminAction({ user: { company_id: companyId } }, 'payment.stripe.webhook', 'payment', paymentId, { planSlug, session: session.id });
      }
    }
  } catch (err) {
    console.error('[payments] webhook processing failed', err);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
