const express = require('express');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const row = req.registryDb.prepare('SELECT id, email, name, role, membership, joined_date FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// GET /api/users (owner only) - list all users in this company
router.get('/', requireAuth, requireRole('owner'), (req, res) => {
  const rows = req.registryDb.prepare('SELECT id, email, name, role, membership, joined_date FROM users WHERE company_id = ?').all(req.user.company_id);
  res.json(rows);
});

// GET /api/users/:id (owner, or the trainer assigned, or the user themself)
router.get('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'owner' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const row = req.registryDb.prepare('SELECT id, email, name, role, membership, joined_date FROM users WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

module.exports = router;
