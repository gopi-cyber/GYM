require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const attendanceRoutes = require('./routes/attendance');
const fitnessPlanRoutes = require('./routes/fitnessPlans');
const directoryRoutes = require('./routes/directory');
const plansRoutes = require('./routes/plans');
const subscriptionsRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');
const registry = require('./registry');
const { forCompany } = require('./gymDb');
const { requireSubscription, requirePlanFeature } = require('./middleware/subscription');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VigorGMS API' }));

app.use('/api/auth', authRoutes);

// Public routes that must be reachable without a JWT.
app.use('/api/plans', plansRoutes);

// Admin endpoints: use route-level auth/admin checks, not the shared
// authenticated company middleware.
app.use('/api/admin', adminRoutes);

// Payment/subscription endpoints: use route-level role checks.
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// Attach company context and isolated gym DB for authenticated requests.
app.use('/api', (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.companyId = payload.company_id || payload.companyId;
    if (!req.companyId) return res.status(400).json({ error: 'Token missing company scope' });
    req.registryDb = registry;
    req.gymDb = forCompany(req.companyId, payload.gym_db_path);
    next();
  } catch (e) {
    console.error('[AUTH] token verify failed', e && e.message, 'prefix=', String(token).slice(0,20), 'path=', req.path);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Admin endpoints: bypass subscription enforcement but require admin flag.
app.use('/api/admin', adminRoutes);

// Payment webhook endpoint does not require local user auth; validated via Stripe signature.
app.use('/api/payments', paymentsRoutes);

// Subscription management endpoints still available.
app.use('/api/subscriptions', subscriptionsRoutes);

// Subscription enforcement after authentication.
app.use('/api/users', requireSubscription);
app.use('/api/inventory', requireSubscription);
app.use('/api/attendance', requireSubscription);
app.use('/api/fitness-plans', requireSubscription);
app.use('/api/directory', requireSubscription);

// Sensitive endpoints: extra rate limit against brute force and misuse.
try {
  const { authLimiter, globalApiLimiter } = require('./middleware/rateLimit');
  app.use('/api/auth', authLimiter);
  app.use('/api/payments', authLimiter);
  app.use('/api', globalApiLimiter);
} catch (e) {
  console.warn('Rate limiting middleware disabled:', e.message);
}

app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fitness-plans', fitnessPlanRoutes);
app.use('/api/directory', directoryRoutes);

// Serve client static files from `../client`
const CLIENT_DIR = path.join(__dirname, '..', '..', 'client');
app.use(express.static(CLIENT_DIR));

// SPA fallback: return `index.html` for direct client-side routes.
app.get(['/dashboard', '/pricing', '/checkout', '/admin', '/auth', '/'], (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VigorGMS API listening on http://localhost:${PORT}`);
});
