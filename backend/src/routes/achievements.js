const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { calculateScore } = require('../utils/scoringEngine');
const pool = require('../db');

const router = express.Router();

// ── GET /api/achievements ─────────────────────────────────────────────────────
// Employee: own approved goals merged with achievement data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, a.actual_value, a.employee_remarks, a.progress_score, a.submitted_at
       FROM goals g
       LEFT JOIN achievements a ON a.goal_id = g.id
       WHERE g.employee_email = $1 AND g.status = 'Approved'
       ORDER BY g.created_at DESC`,
      [req.user.email]
    );

    // Attach manager comments
    const result = [];
    for (const row of rows) {
      const { rows: comments } = await pool.query(
        'SELECT * FROM checkin_comments WHERE goal_id = $1 ORDER BY created_at ASC',
        [row.id]
      );
      result.push({ ...row, manager_comments: comments });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/achievements/team ────────────────────────────────────────────────
// Manager: team's approved goals with achievement data
router.get('/team', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, e.name AS employee_name, e.email AS employee_email_ref,
              a.actual_value, a.employee_remarks, a.progress_score, a.submitted_at
       FROM goals g
       JOIN employees e ON e.email = g.employee_email
       LEFT JOIN achievements a ON a.goal_id = g.id
       WHERE e.manager_email = $1 AND g.status = 'Approved'
       ORDER BY g.created_at DESC`,
      [req.user.email]
    );

    const result = [];
    for (const row of rows) {
      const { rows: comments } = await pool.query(
        'SELECT * FROM checkin_comments WHERE goal_id = $1 ORDER BY created_at ASC',
        [row.id]
      );
      result.push({ ...row, manager_comments: comments });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/achievements/:goalId ────────────────────────────────────────────
// Employee: submit or update actual value
router.post('/:goalId', authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { actual_value, employee_remarks } = req.body;

    if (actual_value === undefined || actual_value === null || actual_value === '') {
      return res.status(400).json({ error: 'actual_value is required' });
    }

    const { rows: goalRows } = await pool.query('SELECT * FROM goals WHERE id = $1', [goalId]);
    if (goalRows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    const goal = goalRows[0];

    if (goal.employee_email !== req.user.email) {
      return res.status(403).json({ error: 'This goal does not belong to you' });
    }
    if (goal.status !== 'Approved') {
      return res.status(400).json({ error: 'Can only submit actuals for Approved goals' });
    }

    const progress_score = calculateScore(goal, actual_value);

    await pool.query(
      `INSERT INTO achievements (id, goal_id, actual_value, employee_remarks, progress_score, submitted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (goal_id) DO UPDATE
         SET actual_value = $3, employee_remarks = $4,
             progress_score = $5, submitted_at = NOW()`,
      [uuidv4(), goalId, actual_value, employee_remarks || '', progress_score]
    );

    res.json({ message: 'Actual value saved', goal_id: goalId, actual_value, progress_score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/achievements/checkin/:goalId ────────────────────────────────────
// Manager: add a check-in comment
router.post('/checkin/:goalId', authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'comment is required' });
    }

    const { rows: goalRows } = await pool.query('SELECT * FROM goals WHERE id = $1', [goalId]);
    if (goalRows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    const goal = goalRows[0];

    // Verify goal belongs to this manager's team
    const { rows: empRows } = await pool.query(
      'SELECT * FROM employees WHERE email = $1', [goal.employee_email]
    );
    if (empRows.length === 0 || empRows[0].manager_email !== req.user.email) {
      return res.status(403).json({ error: 'This goal does not belong to your team' });
    }

    const { rows: inserted } = await pool.query(
      `INSERT INTO checkin_comments (id, goal_id, manager_id, manager_name, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [uuidv4(), goalId, req.user.id, req.user.name, comment.trim()]
    );

    res.json({ message: 'Comment added', comment: inserted[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
