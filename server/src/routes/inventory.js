const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/inventory - anyone authenticated in this company can view
router.get('/', requireAuth, (req, res) => {
  res.json(
    req.gymDb
      .prepare('SELECT * FROM inventory WHERE company_id = ?')
      .all(req.user.company_id)
  );
});

// POST /api/inventory - owner only
router.post('/', requireAuth, requireRole('owner'), (req, res) => {
  const { name, type, quantity, status, threshold, last_serviced } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  const id = uuidv4();
  req.gymDb.prepare(
    `INSERT INTO inventory (id, company_id, name, type, quantity, status, threshold, last_serviced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.company_id, name, type, quantity || 0, status || 'Functional', threshold ?? null, last_serviced ?? null);
  res.status(201).json(req.gymDb.prepare('SELECT * FROM inventory WHERE id = ?').get(id));
});

// PUT /api/inventory/:id - owner only
router.put('/:id', requireAuth, requireRole('owner'), (req, res) => {
  const existing = req.gymDb.prepare('SELECT * FROM inventory WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const merged = { ...existing, ...req.body };
  req.gymDb.prepare(
    `UPDATE inventory SET name=?, type=?, quantity=?, status=?, threshold=?, last_serviced=? WHERE id=? AND company_id=?`
  ).run(merged.name, merged.type, merged.quantity, merged.status, merged.threshold, merged.last_serviced, req.params.id, req.user.company_id);
  res.json(req.gymDb.prepare('SELECT * FROM inventory WHERE id = ? AND company_id = ?').get(req.params.id, req.user.company_id));
});

// DELETE /api/inventory/:id - owner only
router.delete('/:id', requireAuth, requireRole('owner'), (req, res) => {
  req.gymDb.prepare('DELETE FROM inventory WHERE id = ? AND company_id = ?').run(req.params.id, req.user.company_id);
  res.status(204).end();
});

module.exports = router;
