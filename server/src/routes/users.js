const express = require('express');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const row = req.registryDb.prepare('SELECT id, email, name, role, membership, joined_date, phone, gym_address, gps_location, mobile_number FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// PUT /api/users/me
router.put('/me', requireAuth, (req, res) => {
  const { name, email, phone, gymAddress, gpsLocation, mobileNumber, avatar } = req.body || {};
  const updates = [];
  const values = [];
  if (typeof name === 'string' && name.trim()) { updates.push('name = ?'); values.push(name.trim()); }
  if (typeof email === 'string' && email.trim()) { updates.push('email = ?'); values.push(email.trim()); }
  if (typeof phone === 'string' && phone.trim()) { updates.push('phone = ?'); values.push(phone.trim()); }
  else if (phone === null) { updates.push('phone = NULL'); }
  if (typeof gymAddress === 'string') { updates.push('gym_address = ?'); values.push(gymAddress.trim()); }
  else if (gymAddress === null) { updates.push('gym_address = NULL'); }
  if (typeof gpsLocation === 'string') { updates.push('gps_location = ?'); values.push(gpsLocation.trim()); }
  else if (gpsLocation === null) { updates.push('gps_location = NULL'); }
  if (typeof mobileNumber === 'string' && mobileNumber.trim()) { updates.push('mobile_number = ?'); values.push(mobileNumber.trim()); }
  if (typeof avatar === 'string' && avatar.trim()) { updates.push('avatar = ?'); values.push(avatar.trim()); }
  else if (avatar === null) { updates.push('avatar = NULL'); }

  if (!updates.length) return res.status(400).json({ error: 'No profile fields to update' });

  values.push(req.user.id);
  req.registryDb.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = req.registryDb.prepare('SELECT id, email, name, role, membership, joined_date, phone, gym_address, gps_location, mobile_number, avatar FROM users WHERE id = ?').get(req.user.id);
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
