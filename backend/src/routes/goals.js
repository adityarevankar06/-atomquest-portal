const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { validateGoal, validateGoalWeightage } = require('../utils/goalValidator');
const pool = require('../db');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getEmployeeGoals(email) {
  const { rows } = await pool.query(
    'SELECT * FROM goals WHERE employee_email = $1 ORDER BY created_at DESC',
    [email]
  );
  return rows;
}

async function getTeamGoals(managerEmail) {
  const { rows } = await pool.query(
    `SELECT g.* FROM goals g
     JOIN employees e ON e.email = g.employee_email
     WHERE e.manager_email = $1
     ORDER BY g.created_at DESC`,
    [managerEmail]
  );
  return rows;
}

async function auditLog(goalId, field, oldVal, newVal, byEmail) {
  await pool.query(
    `INSERT INTO audit_log (id, goal_id, field_changed, old_value, new_value, changed_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      uuidv4(), goalId, field,
      oldVal !== undefined && oldVal !== null ? String(oldVal) : null,
      newVal !== undefined && newVal !== null ? String(newVal) : null,
      byEmail
    ]
  );
}

// ── POST /api/goals/submit ────────────────────────────────────────────────────
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Employee') {
      return res.status(403).json({ error: 'Only Employees can submit goals.' });
    }

    const myGoals = await getEmployeeGoals(req.user.email);
    const drafts  = myGoals.filter(g => g.status === 'Draft');

    if (drafts.length === 0) {
      return res.status(400).json({ error: 'No Draft goals found to submit.' });
    }

    validateGoalWeightage(myGoals, [], 'update');

    const now = new Date().toISOString();
    for (const g of drafts) {
      await pool.query(
        `UPDATE goals SET status = 'Submitted', updated_at = $1 WHERE id = $2`,
        [now, g.id]
      );
      await auditLog(g.id, 'status', g.status, 'Submitted', req.user.email);
    }

    return res.status(200).json({
      success: true,
      message: `${drafts.length} goal(s) submitted for manager approval.`
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── GET /api/goals/team ───────────────────────────────────────────────────────
router.get('/team', authMiddleware, async (req, res) => {
  try {
    const goals = await getTeamGoals(req.user.email);
    return res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/goals/approve/:goalId ──────────────────────────────────────────
router.post('/approve/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.goalId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Goal not found.' });
    const goal = rows[0];

    if (goal.status !== 'Submitted') {
      return res.status(400).json({
        error: `Goal must be in 'Submitted' state. Current: '${goal.status}'.`
      });
    }

    const teamGoals = await getTeamGoals(req.user.email);
    if (!teamGoals.find(g => g.id === goal.id)) {
      return res.status(403).json({ error: 'This goal does not belong to your team.' });
    }

    const { approved, reason } = req.body;
    if (approved === undefined || approved === null) {
      return res.status(400).json({ error: "'approved' (true or false) is required." });
    }

    const now = new Date().toISOString();

    if (approved === true || approved === 'true') {
      await pool.query(
        `UPDATE goals SET status='Approved', approved_at=$1, approved_by=$2, updated_at=$1 WHERE id=$3`,
        [now, req.user.email, goal.id]
      );
      await auditLog(goal.id, 'status', 'Submitted', 'Approved', req.user.email);

      const { rows: updated } = await pool.query('SELECT * FROM goals WHERE id = $1', [goal.id]);
      return res.status(200).json({ success: true, message: 'Goal approved.', data: updated[0] });
    } else {
      if (!reason || String(reason).trim() === '') {
        return res.status(400).json({ error: "'reason' is required when rejecting." });
      }
      await pool.query(
        `UPDATE goals SET status='Rejected', rejected_at=$1, rejected_by=$2,
         rejection_reason=$3, updated_at=$1 WHERE id=$4`,
        [now, req.user.email, reason.trim(), goal.id]
      );
      await auditLog(goal.id, 'status', 'Submitted', 'Rejected', req.user.email);
      await auditLog(goal.id, 'rejection_reason', null, reason.trim(), req.user.email);

      const { rows: updated } = await pool.query('SELECT * FROM goals WHERE id = $1', [goal.id]);
      return res.status(200).json({ success: true, message: 'Goal rejected.', data: updated[0] });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/goals/audit/:goalId ──────────────────────────────────────────────
router.get('/audit/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows: goal } = await pool.query('SELECT id FROM goals WHERE id = $1', [req.params.goalId]);
    if (goal.length === 0) return res.status(404).json({ error: 'Goal not found.' });

    const { rows: logs } = await pool.query(
      'SELECT * FROM audit_log WHERE goal_id = $1 ORDER BY changed_at ASC',
      [req.params.goalId]
    );
    return res.status(200).json({ success: true, goal_id: req.params.goalId, data: logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/goals ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, email } = req.user;
    let goals;

    if (role === 'Admin') {
      const { rows } = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
      goals = rows;
    } else if (role === 'Manager') {
      goals = await getTeamGoals(email);
    } else {
      goals = await getEmployeeGoals(email);
    }

    return res.status(200).json({ success: true, count: goals.length, data: goals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/goals ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Employee') {
      return res.status(403).json({ error: 'Only Employees can create goals.' });
    }

    const incoming = Array.isArray(req.body) ? req.body : [req.body];

    incoming.forEach((g, i) => {
      try { validateGoal(g, false); }
      catch (e) { throw new Error(`Goal ${i + 1}: ${e.message}`); }
    });

    const existing = await getEmployeeGoals(req.user.email);
    validateGoalWeightage(incoming, existing, 'create');

    const created = [];
    for (const g of incoming) {
      const id  = uuidv4();
      const now = new Date().toISOString();

      await pool.query(
        `INSERT INTO goals
          (id, employee_email, employee_name, title, description, thrust_area,
           uom_type, uom_direction, target, weightage, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Draft',$11,$11)`,
        [
          id, req.user.email, req.user.name,
          g.title.trim(), (g.description || '').trim(),
          g.thrust_area, g.uom_type,
          g.uom_direction || 'Min',
          parseFloat(g.target), parseFloat(g.weightage), now
        ]
      );

      await auditLog(id, 'status', null, 'Draft', req.user.email);

      const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [id]);
      created.push(rows[0]);
    }

    return res.status(201).json({
      success: true,
      message: `${created.length} goal(s) created.`,
      data: created
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── GET /api/goals/:goalId ────────────────────────────────────────────────────
router.get('/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.goalId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Goal not found.' });
    const goal = rows[0];

    const { role, email } = req.user;
    if (role === 'Employee' && goal.employee_email !== email) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (role === 'Manager') {
      const team = await getTeamGoals(email);
      if (!team.find(g => g.id === goal.id)) {
        return res.status(403).json({ error: 'This goal does not belong to your team.' });
      }
    }

    return res.status(200).json({ success: true, data: goal });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/goals/:goalId ────────────────────────────────────────────────────
router.put('/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.goalId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Goal not found.' });
    const goal = rows[0];

    if (goal.employee_email !== req.user.email) {
      return res.status(403).json({ error: 'You can only edit your own goals.' });
    }
    if (goal.status !== 'Draft') {
      return res.status(400).json({ error: `Only Draft goals are editable. Status: '${goal.status}'.` });
    }

    validateGoal(req.body, true);

    const fields = ['title', 'description', 'thrust_area', 'uom_type', 'uom_direction', 'target', 'weightage'];
    const updates = [];
    const values  = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const newVal = (field === 'target' || field === 'weightage')
          ? parseFloat(req.body[field])
          : req.body[field];

        if (String(newVal) !== String(goal[field])) {
          await auditLog(goal.id, field, goal[field], newVal, req.user.email);
        }

        updates.push(`${field} = $${idx++}`);
        values.push(newVal);
      }
    }

    if (updates.length === 0) {
      return res.status(200).json({ success: true, data: goal });
    }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(goal.id);

    await pool.query(
      `UPDATE goals SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    const { rows: updated } = await pool.query('SELECT * FROM goals WHERE id = $1', [goal.id]);
    return res.status(200).json({ success: true, data: updated[0] });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/goals/:goalId ─────────────────────────────────────────────────
router.delete('/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [req.params.goalId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Goal not found.' });
    const goal = rows[0];

    if (goal.employee_email !== req.user.email) {
      return res.status(403).json({ error: 'You can only delete your own goals.' });
    }
    if (goal.status !== 'Draft') {
      return res.status(400).json({ error: `Only Draft goals can be deleted. Status: '${goal.status}'.` });
    }

    await auditLog(goal.id, 'status', goal.status, 'DELETED', req.user.email);
    await pool.query('DELETE FROM goals WHERE id = $1', [goal.id]);

    return res.status(200).json({ success: true, message: 'Goal deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
