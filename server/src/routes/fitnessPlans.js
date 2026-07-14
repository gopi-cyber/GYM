const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireRole } = require('../auth');

const router = express.Router();

// GET /api/fitness-plans/me
router.get('/me', requireAuth, (req, res) => {
  const row = req.gymDb.prepare('SELECT * FROM fitness_plans WHERE company_id = ? AND customer_id = ?').get(req.user.company_id, req.user.id);
  if (!row) return res.status(404).json({ error: 'No plan assigned yet' });
  res.json({
    ...row,
    workout_plan: JSON.parse(row.workout_plan || '[]'),
    nutrition_plan: JSON.parse(row.nutrition_plan || '[]')
  });
});

// GET /api/fitness-plans/customer/:customerId
router.get('/customer/:customerId', requireAuth, (req, res) => {
  const row = req.gymDb.prepare('SELECT * FROM fitness_plans WHERE company_id = ? AND customer_id = ?').get(req.user.company_id, req.params.customerId);
  if (!row) return res.status(404).json({ error: 'No plan found' });
  if (req.user.role === 'owner' || req.user.id === row.trainer_id || req.user.id === row.customer_id) {
    return res.json({
      ...row,
      workout_plan: JSON.parse(row.workout_plan || '[]'),
      nutrition_plan: JSON.parse(row.nutrition_plan || '[]')
    });
  }
  return res.status(403).json({ error: 'Forbidden' });
});

// POST /api/fitness-plans
router.post('/', requireAuth, requireRole('owner', 'trainer'), (req, res) => {
  const { customerId, workoutPlan, nutritionPlan } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId is required' });

  const existing = req.gymDb.prepare('SELECT * FROM fitness_plans WHERE company_id = ? AND customer_id = ?').get(req.user.company_id, customerId);
  const trainerId = req.user.role === 'trainer' ? req.user.id : (req.body.trainerId || existing?.trainer_id || null);

  if (existing) {
    req.gymDb.prepare(
      `UPDATE fitness_plans SET trainer_id=?, workout_plan=?, nutrition_plan=?, updated_at=datetime('now')
       WHERE company_id=? AND customer_id=?`
    ).run(trainerId, JSON.stringify(workoutPlan || []), JSON.stringify(nutritionPlan || []), req.user.company_id, customerId);
  } else {
    const id = uuidv4();
    req.gymDb.prepare(
      `INSERT INTO fitness_plans (id, company_id, customer_id, trainer_id, workout_plan, nutrition_plan)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, req.user.company_id, customerId, trainerId, JSON.stringify(workoutPlan || []), JSON.stringify(nutritionPlan || []));
  }

  const row = req.gymDb.prepare('SELECT * FROM fitness_plans WHERE company_id = ? AND customer_id = ?').get(req.user.company_id, customerId);
  res.status(200).json({
    ...row,
    workout_plan: JSON.parse(row.workout_plan || '[]'),
    nutrition_plan: JSON.parse(row.nutrition_plan || '[]')
  });
});

module.exports = router;
