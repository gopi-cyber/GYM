const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { forCompany } = require('../gymDb');

const REGISTRY_PATH = process.env.REGISTRY_DB_PATH || path.resolve(__dirname, '..', '..', 'data', 'registry.db');
fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
const registry = new Database(REGISTRY_PATH);
registry.pragma('journal_mode = WAL');
registry.pragma('foreign_keys = ON');

function ensureCompanyAccess(companyId) {
  const row = registry.prepare('SELECT status, features FROM companies WHERE id = ?').get(companyId);
  if (!row) return { allowed: false, reason: 'Company not found' };
  if (row.status === 'suspended' || row.status === 'canceled') return { allowed: false, reason: `Company status: ${row.status}` };

  const sub = registry.prepare(
    `SELECT status, trial_end, current_period_end, cancel_at_period_end, plan_id FROM subscriptions WHERE company_id = ? ORDER BY created_at DESC LIMIT 1`
  ).get(companyId);

  if (!sub) return { allowed: false, reason: 'No active subscription' };

  const now = new Date();
  const nowISO = dateToDateISO(now);

  if (sub.status === 'trialing') {
    if (sub.trial_end && sub.trial_end < nowISO) {
      return { allowed: false, reason: 'Trial expired' };
    }
  }

  if (sub.status === 'active') {
    if (sub.cancel_at_period_end && sub.current_period_end && sub.current_period_end < nowISO) {
      return { allowed: false, reason: 'Subscription ended' };
    }
  }

  if (['past_due', 'unpaid', 'incomplete'].includes(sub.status)) {
    const graceDue = sub.current_period_end || nowISO;
    if (graceDue < nowISO) return { allowed: false, reason: `Subscription status: ${sub.status}` };
  }

  return { allowed: true };
}

function dateToDateISO(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function requireSubscription(req, res, next) {
  if (!req.companyId) return res.status(400).json({ error: 'No company scope' });
  const result = ensureCompanyAccess(req.companyId);
  if (!result.allowed) {
    if (result.reason === 'Trial expired' || result.reason === 'Subscription ended') {
      return res.status(403).json({ error: 'subscription_required', reason: result.reason, checkout_url: `/api/subscriptions/current` });
    }
    return res.status(403).json({ error: 'subscription_required', reason: result.reason });
  }
  req.companyStatus = result;
  next();
}

function attachSubscriptionContext(req, res, next) {
  if (!req.companyId) return next();
  const plan = registry.prepare(
    `SELECT p.slug, p.name, p.price_cents, p.interval, p.features, s.status, s.current_period_end
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.company_id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`
  ).get(req.companyId);
  req.plan = plan || null;
  next();
}

function recordAdminAction(req, action, targetType, targetId, metadata) {
  try {
    const id = require('uuid').v4();
    registry.prepare(
      'INSERT INTO admin_actions (id, actor_user_id, company_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.user?.id, req.user?.company_id || null, action, targetType || null, targetId || null, metadata ? JSON.stringify(metadata) : null);
  } catch (e) {
    console.error('Failed to record admin action:', e);
  }
}

module.exports = { registry, ensureCompanyAccess, requireSubscription, attachSubscriptionContext, recordAdminAction };
