const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getGoalById } = require('./goals');

// In-memory audit log store shared with goals.js via module export
// goals.js pushes entries here using addAuditEntry()
const auditDB = {};

/**
 * Adds an audit entry for a goal. Called from goals.js on every
 * field-level change (create, update, status transition).
 */
function addAuditEntry(goalId, entry) {
  if (!auditDB[goalId]) auditDB[goalId] = [];
  auditDB[goalId].push({
    id:          Date.now() + Math.random(),
    goal_id:     goalId,
    field:       entry.field,
    old_value:   entry.old_value ?? null,
    new_value:   entry.new_value ?? null,
    changed_by:  entry.changed_by,
    changed_by_name: entry.changed_by_name || '',
    changed_at:  new Date().toISOString(),
    action:      entry.action || 'update',
  });
}

// ─── GET /api/audit-log/:goalId ──────────────────────────────────────────────
// Returns the full audit trail for a single goal, newest first
router.get('/:goalId', authenticate, (req, res) => {
  const { goalId } = req.params;

  const goal = getGoalById(goalId);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  // Employees can only see audit for their own goals
  if (req.user.role === 'employee' && goal.employee_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const entries = (auditDB[goalId] || []).slice().reverse(); // newest first
  res.json(entries);
});

// ─── GET /api/audit-log ──────────────────────────────────────────────────────
// Admin only: returns full audit log across all goals (flat list, newest first)
router.get('/', authenticate, authorize('admin'), (req, res) => {
  const all = Object.values(auditDB)
    .flat()
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
  res.json(all);
});

module.exports = router;
module.exports.auditDB = auditDB;
module.exports.addAuditEntry = addAuditEntry;
