require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');
const attendanceRoutes = require('./routes/attendance');
const fitnessPlanRoutes = require('./routes/fitnessPlans');
const directoryRoutes = require('./routes/directory');
const plansRoutes = require('./routes/plans');
const subscriptionsRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const registry = require('./registry');
const { forCompany } = require('./gymDb');
const { requireSubscription } = require('./middleware/subscription');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VigorGMS API' }));

app.use('/api/auth', authRoutes);

// Resolve company from JWT and attach isolated gym DB to req for protected routes.
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
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Admin endpoints: bypass subscription enforcement but require admin flag.
app.use('/api/admin', adminRoutes);

// Plans/subscriptions: enrollment endpoints without subscription wall.
app.use('/api/plans', plansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// Subscription enforcement for company-scoped protected routes.
app.use('/api', requireSubscription);

app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fitness-plans', fitnessPlanRoutes);
app.use('/api/directory', directoryRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VigorGMS API listening on http://localhost:${PORT}`);
});
