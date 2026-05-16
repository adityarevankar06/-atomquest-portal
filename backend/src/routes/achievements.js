const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { calculateScore } = require('../utils/scoringEngine');
const { goalsDB, getGoalById } = require('./goals');

// In-memory store: { goalId: { actual_value, employee_remarks, progress_score, manager_comments: [] } }
const achievementsDB = {};

// ─── GET /achievements ───────────────────────────────────────────────────────
// Employee: returns own approved goals merged with their achievement data
router.get('/', authMiddleware, (req, res) => {
  const empId = req.user.id;

  const myGoals = Object.values(goalsDB).filter(
    g => g.employee_id === empId && g.status === 'Approved'
  );

  const result = myGoals.map(g => {
    const ach = achievementsDB[g.id] || {};
    return { ...g, ...ach, manager_comments: ach.manager_comments || [] };
  });

  res.json(result);
});

// ─── GET /achievements/team ──────────────────────────────────────────────────
// Manager: returns all team's approved goals with achievement data
// MUST come before /:goalId
router.get('/team', authMiddleware, (req, res) => {
  const { USERS } = require('./auth');
  const managerId = req.user.id;
  const manager = Object.values(USERS).find(u => u.id === managerId);

  if (!manager) return res.status(404).json({ error: 'Manager not found' });

  // Find employees whose manager_email matches this manager
  const teamEmails = USERS
    .filter(u => u.role === 'employee' && u.manager_email === manager.email)
    .map(u => u.id);

  const teamGoals = Object.values(goalsDB).filter(
    g => teamEmails.includes(g.employee_id) && g.status === 'Approved'
  );

  const result = teamGoals.map(g => {
    const ach = achievementsDB[g.id] || {};
    const emp = Object.values(USERS).find(u => u.id === g.employee_id);
    return {
      ...g,
      ...ach,
      manager_comments: ach.manager_comments || [],
      employee_name: emp?.name,
      employee_email: emp?.email,
    };
  });

  res.json(result);
});

// ─── POST /achievements/:goalId ──────────────────────────────────────────────
// Employee: submit or update actual value for a goal
router.post('/:goalId', authMiddleware, (req, res) => {
  const { goalId } = req.params;
  const { actual_value, employee_remarks } = req.body;

  if (actual_value === undefined || actual_value === null || actual_value === '') {
    return res.status(400).json({ error: 'actual_value is required' });
  }

  const goal = getGoalById(goalId);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  if (goal.employee_id !== req.user.id) {
    return res.status(403).json({ error: 'This goal does not belong to you' });
  }
  if (goal.status !== 'Approved') {
    return res.status(400).json({ error: 'Can only submit actuals for Approved goals' });
  }

  const progress_score = calculateScore(goal, actual_value);

  const existing = achievementsDB[goalId] || { manager_comments: [] };
  achievementsDB[goalId] = {
    ...existing,
    actual_value,
    employee_remarks: employee_remarks || '',
    progress_score,
    submitted_at: new Date().toISOString(),
  };

  res.json({
    message: 'Actual value saved',
    goal_id: goalId,
    actual_value,
    progress_score,
  });
});

// ─── POST /achievements/checkin/:goalId ─────────────────────────────────────
// Manager: add a check-in comment to a goal's achievement record
// MUST come before the /:goalId wildcard — registered later but named route wins
router.post('/checkin/:goalId', authMiddleware, (req, res) => {
  const { goalId } = req.params;
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'comment is required' });
  }

  const goal = getGoalById(goalId);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  // Verify the goal belongs to this manager's team
  const { USERS } = require('./auth');
  const manager = Object.values(USERS).find(u => u.id === req.user.id);
  const emp = Object.values(USERS).find(u => u.id === goal.employee_id);

  if (!manager || !emp || emp.manager_email !== manager.email) {
    return res.status(403).json({ error: 'This goal does not belong to your team' });
  }

  if (!achievementsDB[goalId]) {
    achievementsDB[goalId] = { manager_comments: [] };
  }
  if (!achievementsDB[goalId].manager_comments) {
    achievementsDB[goalId].manager_comments = [];
  }

  const commentEntry = {
    manager_id: req.user.id,
    manager_name: req.user.name,
    comment: comment.trim(),
    created_at: new Date().toISOString(),
  };

  achievementsDB[goalId].manager_comments.push(commentEntry);

  res.json({ message: 'Comment added', comment: commentEntry });
});

module.exports = router;
module.exports.achievementsDB = achievementsDB;
