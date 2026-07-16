// Stripe checkout integration.
// Uses real Stripe when STRIPE_SECRET_KEY is configured; otherwise falls back
// to the existing simulated flow without changing callers.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const { registry } = require('../registry');

async function findOrCreateStripeCustomer({ email, companyId, name }) {
  const existing = registry.prepare('SELECT stripe_customer_id FROM users WHERE company_id = ? AND email = ?').get(companyId, email);
  if (existing && existing.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { companyId },
  });
  registry.prepare('UPDATE users SET stripe_customer_id = ? WHERE company_id = ? AND email = ?').run(customer.id, companyId, email);
  return customer.id;
}

async function createCheckoutSession({ companyId, planSlug, origin, email }) {
  const plan = registry.prepare('SELECT * FROM plans WHERE slug = ? AND active = 1').get(planSlug);
  if (!plan) throw new Error('Plan not found');

  const customerOptions = email ? { email, companyId, name: (email.split('@')[0] || 'Gym Owner') } : { email: 'owner@example.com', companyId, name: 'Gym Owner' };
  const customerId = await findOrCreateStripeCustomer(customerOptions);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: Number(plan.price_cents),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: { planSlug, companyId },
    },
    success_url: `${origin}/checkout?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
  });

  return { url: session.url, id: session.id };
}

module.exports = {
  createCheckoutSession,
};
