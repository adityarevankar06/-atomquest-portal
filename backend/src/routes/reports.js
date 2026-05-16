const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { goalsDB } = require('./goals');
const { achievementsDB } = require('./achievements');
const { USERS } = require('./auth');

// ─── GET /api/reports/completion-status ─────────────────────────────────────
// Admin/Manager: Returns counts for the dashboard metrics cards
router.get('/completion-status', authMiddleware, (req, res) => {
  const allGoals = Object.values(goalsDB);

  const total     = allGoals.length;
  const submitted = allGoals.filter(g => ['Submitted', 'Approved', 'Rejected'].includes(g.status)).length;
  const approved  = allGoals.filter(g => g.status === 'Approved').length;
  const rejected  = allGoals.filter(g => g.status === 'Rejected').length;
  const draft     = allGoals.filter(g => g.status === 'Draft').length;

  // "checked-in" = approved goals that have an actual_value submitted
  const checkin_done = allGoals.filter(g => {
    const ach = achievementsDB[g.id];
    return g.status === 'Approved' && ach && ach.actual_value !== undefined && ach.actual_value !== null;
  }).length;

  // Per-employee breakdown for admin detail view
  const byEmployee = {};
  allGoals.forEach(g => {
    const emp = Object.values(USERS).find(u => u.id === g.employee_id);
    const empName = emp ? emp.name : `Employee ${g.employee_id}`;
    if (!byEmployee[empName]) {
      byEmployee[empName] = { total: 0, approved: 0, checkin_done: 0 };
    }
    byEmployee[empName].total += 1;
    if (g.status === 'Approved') byEmployee[empName].approved += 1;
    const ach = achievementsDB[g.id];
    if (g.status === 'Approved' && ach && ach.actual_value !== undefined) {
      byEmployee[empName].checkin_done += 1;
    }
  });

  res.json({
    metrics: { total, submitted, approved, rejected, draft, checkin_done },
    by_employee: byEmployee,
  });
});

// ─── GET /api/reports/achievements-export ───────────────────────────────────
// Admin/Manager: Returns CSV file of all goals + achievements
router.get('/achievements-export', authMiddleware, (req, res) => {
  const allGoals = Object.values(goalsDB);

  const rows = allGoals.map(g => {
    const emp = Object.values(USERS).find(u => u.id === g.employee_id);
    const ach = achievementsDB[g.id] || {};

    return {
      Employee:         emp ? emp.name : g.employee_id,
      Email:            emp ? emp.email : '',
      Goal_Title:       g.title,
      Thrust_Area:      g.thrust_area || '',
      UoM_Type:         g.uom_type || '',
      Direction:        g.uom_direction || '',
      Target:           g.uom_target ?? '',
      Weightage_Pct:    g.weightage ?? '',
      Status:           g.status,
      Actual_Value:     ach.actual_value ?? '',
      Progress_Score:   ach.progress_score ?? '',
      Employee_Remarks: ach.employee_remarks || '',
      Submitted_At:     ach.submitted_at || '',
    };
  });

  // Build CSV manually — no external dependency needed
  if (rows.length === 0) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="atomquest-achievements.csv"');
    return res.send('No data to export');
  }

  const headers = Object.keys(rows[0]);
  const escape  = val => `"${String(val).replace(/"/g, '""')}"`;

  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="atomquest-achievements.csv"');
  res.send(csv);
});

module.exports = router;
