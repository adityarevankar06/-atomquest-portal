const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// ── GET /api/reports/completion-status ───────────────────────────────────────
router.get('/completion-status', authMiddleware, async (req, res) => {
  try {
    const { rows: allGoals } = await pool.query('SELECT * FROM goals');

    const total      = allGoals.length;
    const submitted  = allGoals.filter(g => ['Submitted','Approved','Rejected'].includes(g.status)).length;
    const approved   = allGoals.filter(g => g.status === 'Approved').length;
    const rejected   = allGoals.filter(g => g.status === 'Rejected').length;
    const draft      = allGoals.filter(g => g.status === 'Draft').length;

    // Goals with actual values submitted
    const { rows: achRows } = await pool.query(
      `SELECT a.goal_id FROM achievements a
       JOIN goals g ON g.id = a.goal_id
       WHERE g.status = 'Approved' AND a.actual_value IS NOT NULL`
    );
    const checkin_done = achRows.length;

    // Per-employee breakdown
    const { rows: empBreakdown } = await pool.query(
      `SELECT e.name, e.email,
              COUNT(g.id) AS total,
              COUNT(CASE WHEN g.status = 'Approved' THEN 1 END) AS approved,
              COUNT(CASE WHEN a.actual_value IS NOT NULL THEN 1 END) AS checkin_done
       FROM employees e
       LEFT JOIN goals g ON g.employee_email = e.email
       LEFT JOIN achievements a ON a.goal_id = g.id AND g.status = 'Approved'
       WHERE e.role = 'Employee'
       GROUP BY e.name, e.email`
    );

    const by_employee = {};
    empBreakdown.forEach(row => {
      by_employee[row.name] = {
        total:        parseInt(row.total),
        approved:     parseInt(row.approved),
        checkin_done: parseInt(row.checkin_done)
      };
    });

    res.json({
      metrics: { total, submitted, approved, rejected, draft, checkin_done },
      by_employee
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/reports/achievements-export ─────────────────────────────────────
router.get('/achievements-export', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.name AS employee, e.email,
              g.title AS goal_title, g.thrust_area, g.uom_type,
              g.uom_direction, g.target, g.weightage, g.status,
              a.actual_value, a.progress_score,
              a.employee_remarks, a.submitted_at
       FROM goals g
       JOIN employees e ON e.email = g.employee_email
       LEFT JOIN achievements a ON a.goal_id = g.id
       ORDER BY e.name, g.created_at`
    );

    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="atomquest-achievements.csv"');
      return res.send('No data to export');
    }

    const headers = [
      'Employee','Email','Goal_Title','Thrust_Area','UoM_Type',
      'Direction','Target','Weightage_Pct','Status',
      'Actual_Value','Progress_Score','Employee_Remarks','Submitted_At'
    ];

    const escape = val => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const csv = [
      headers.join(','),
      ...rows.map(r => [
        escape(r.employee), escape(r.email), escape(r.goal_title),
        escape(r.thrust_area), escape(r.uom_type), escape(r.uom_direction),
        escape(r.target), escape(r.weightage), escape(r.status),
        escape(r.actual_value), escape(r.progress_score),
        escape(r.employee_remarks), escape(r.submitted_at)
      ].join(','))
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="atomquest-achievements.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
