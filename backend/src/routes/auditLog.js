const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// ── GET /api/audit-log/:goalId ────────────────────────────────────────────────
router.get('/:goalId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM audit_log WHERE goal_id = $1 ORDER BY changed_at ASC',
      [req.params.goalId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/audit-log ────────────────────────────────────────────────────────
// Admin: full audit trail
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 500'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
