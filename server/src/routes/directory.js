const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/directory - public directory of trainers & doctors (no auth required)
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM directory').all());
});

// POST /api/directory - owner only
router.post('/', requireAuth, requireRole('owner'), (req, res) => {
  const { name, type, specialty, experience, hospital, avatar, bio, linkedUserId } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO directory (id, name, type, specialty, experience, hospital, avatar, bio, linked_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, specialty ?? null, experience ?? null, hospital ?? null, avatar ?? null, bio ?? null, linkedUserId ?? null);
  res.status(201).json(db.prepare('SELECT * FROM directory WHERE id = ?').get(id));
});

module.exports = router;
