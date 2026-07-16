const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { registry, recordAdminAction } = require('../middleware/subscription');

const router = express.Router();

// GET /api/plans
router.get('/', (req, res) => {
  const rows = registry.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY price_cents ASC').all();
  res.json(rows.map(r => ({ ...r, features: safeParse(r.features) })));
});

// GET /api/plans/:id
router.get('/:id', (req, res) => {
  const row = registry.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Plan not found' });
  res.json({ ...row, features: safeParse(row.features) });
});

function safeParse(text) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

module.exports = router;
