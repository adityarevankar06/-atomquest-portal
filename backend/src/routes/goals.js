const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const { validateGoal, validateGoalWeightage } = require('../utils/goalValidator');
const { USERS } = require('./auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------
const goalsDB = {};   // goalId → goal object
const auditDB = {};   // logId  → audit log entry

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEmployeeGoals(email) {
    return Object.values(goalsDB).filter(g => g.employee_email === email);
}

function getTeamGoals(managerEmail) {
    const teamEmails = Object.values(USERS)
        .filter(u => u.manager_email === managerEmail)
        .map(u => u.email);
    return Object.values(goalsDB).filter(g => teamEmails.includes(g.employee_email));
}

function audit(goalId, field, oldVal, newVal, byEmail) {
    auditDB[uuidv4()] = {
        goal_id:       goalId,
        field_changed: field,
        old_value:     oldVal !== undefined && oldVal !== null ? String(oldVal) : null,
        new_value:     newVal !== undefined && newVal !== null ? String(newVal) : null,
        changed_by:    byEmail,
        changed_at:    new Date().toISOString()
    };
}

// ===========================================================================
// NAMED ROUTES — declared BEFORE /:goalId to avoid wildcard collisions
// ===========================================================================

// POST /api/goals/submit
// Employee submits all their Draft goals for manager review (100% total enforced)
router.post('/submit', authMiddleware, (req, res) => {
    try {
        if (req.user.role !== 'Employee') {
            return res.status(403).json({ error: 'Only Employees can submit goals.' });
        }

        const myGoals = getEmployeeGoals(req.user.email);
        const drafts  = myGoals.filter(g => g.status === 'Draft');

        if (drafts.length === 0) {
            return res.status(400).json({ error: 'No Draft goals found to submit.' });
        }

        validateGoalWeightage(myGoals, [], 'update');

        const now = new Date().toISOString();
        drafts.forEach(g => {
            const old    = g.status;
            g.status     = 'Submitted';
            g.updated_at = now;
            audit(g.id, 'status', old, 'Submitted', req.user.email);
        });

        console.log(`[GOALS] ${req.user.email} submitted ${drafts.length} goal(s)`);

        return res.status(200).json({
            success: true,
            message: `${drafts.length} goal(s) submitted for manager approval.`,
            data: drafts
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// GET /api/goals/team
// Manager sees all goals of their direct reports
router.get('/team', authMiddleware, (req, res) => {
    try {
        const teamGoals = getTeamGoals(req.user.email);
        return res.status(200).json({
            success: true,
            count: teamGoals.length,
            data: teamGoals
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/goals/approve/:goalId
// Manager approves or rejects a Submitted goal
// Body: { approved: true|false, reason?: string }
router.post('/approve/:goalId', authMiddleware, (req, res) => {
    try {
        const goal = goalsDB[req.params.goalId];
        if (!goal) return res.status(404).json({ error: 'Goal not found.' });

        if (goal.status !== 'Submitted') {
            return res.status(400).json({
                error: `Goal must be in 'Submitted' state to action. Current status: '${goal.status}'.`
            });
        }

        const teamGoals = getTeamGoals(req.user.email);
        if (!teamGoals.find(g => g.id === goal.id)) {
            return res.status(403).json({ error: 'This goal does not belong to your team.' });
        }

        const { approved, reason } = req.body;

        if (approved === undefined || approved === null) {
            return res.status(400).json({ error: "'approved' (true or false) is required." });
        }

        const oldStatus = goal.status;
        const now       = new Date().toISOString();

        if (approved === true || approved === 'true') {
            goal.status      = 'Approved';
            goal.approved_at = now;
            goal.approved_by = req.user.email;
            goal.updated_at  = now;

            audit(goal.id, 'status', oldStatus, 'Approved', req.user.email);
            console.log(`[GOALS] ${req.user.email} APPROVED goal ${goal.id}`);

            return res.status(200).json({
                success: true,
                message: 'Goal approved and locked for editing.',
                data: goal
            });
        } else {
            if (!reason || String(reason).trim() === '') {
                return res.status(400).json({ error: "'reason' is required when rejecting a goal." });
            }

            goal.status           = 'Rejected';
            goal.rejected_at      = now;
            goal.rejected_by      = req.user.email;
            goal.rejection_reason = reason.trim();
            goal.updated_at       = now;

            audit(goal.id, 'status',           oldStatus,   'Rejected',     req.user.email);
            audit(goal.id, 'rejection_reason', null,        reason.trim(),  req.user.email);
            console.log(`[GOALS] ${req.user.email} REJECTED goal ${goal.id} — ${reason}`);

            return res.status(200).json({
                success: true,
                message: 'Goal rejected and returned to employee for revision.',
                data: goal
            });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/goals/audit/:goalId
// Full audit trail for one goal (Manager + Admin)
router.get('/audit/:goalId', authMiddleware, (req, res) => {
    try {
        const goal = goalsDB[req.params.goalId];
        if (!goal) return res.status(404).json({ error: 'Goal not found.' });

        const logs = Object.values(auditDB)
            .filter(l => l.goal_id === req.params.goalId)
            .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));

        return res.status(200).json({ success: true, goal_id: req.params.goalId, data: logs });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// ===========================================================================
// COLLECTION ROUTES
// ===========================================================================

// GET /api/goals
// Employee → own | Manager → team | Admin → all
router.get('/', authMiddleware, (req, res) => {
    try {
        const { role, email } = req.user;
        let goals;

        if (role === 'Admin') {
            goals = Object.values(goalsDB);
        } else if (role === 'Manager') {
            goals = getTeamGoals(email);
        } else {
            goals = getEmployeeGoals(email);
        }

        return res.status(200).json({ success: true, count: goals.length, data: goals });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/goals
// Create one or multiple goals (Employee only).
// Body: single goal object OR array of goal objects.
// Entire employee goal set must total 100% after creation.
router.post('/', authMiddleware, (req, res) => {
    try {
        if (req.user.role !== 'Employee') {
            return res.status(403).json({ error: 'Only Employees can create goals.' });
        }

        const incoming = Array.isArray(req.body) ? req.body : [req.body];

        incoming.forEach((g, i) => {
            try {
                validateGoal(g, false);
            } catch (e) {
                throw new Error(`Goal ${i + 1}: ${e.message}`);
            }
        });

        const existing = getEmployeeGoals(req.user.email);
        validateGoalWeightage(incoming, existing, 'create');

        const created = [];
        incoming.forEach(g => {
            const id  = uuidv4();
            const now = new Date().toISOString();
            const goal = {
                id,
                employee_email:   req.user.email,
                employee_name:    req.user.name,
                title:            g.title.trim(),
                description:      (g.description || '').trim(),
                thrust_area:      g.thrust_area,
                uom_type:         g.uom_type,
                uom_direction:    g.uom_direction || 'Min',
                target:           parseFloat(g.target),
                weightage:        parseFloat(g.weightage),
                status:           'Draft',
                created_at:       now,
                updated_at:       now,
                approved_at:      null,
                approved_by:      null,
                rejected_at:      null,
                rejected_by:      null,
                rejection_reason: null
            };
            goalsDB[id] = goal;
            audit(id, 'status', null, 'Draft', req.user.email);
            created.push(goal);
        });

        console.log(`[GOALS] ${req.user.email} created ${created.length} goal(s)`);

        return res.status(201).json({
            success: true,
            message: `${created.length} goal(s) created successfully.`,
            data: created
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// ===========================================================================
// PARAMETERISED ROUTES — after all named routes
// ===========================================================================

// GET /api/goals/:goalId
router.get('/:goalId', authMiddleware, (req, res) => {
    try {
        const goal = goalsDB[req.params.goalId];
        if (!goal) return res.status(404).json({ error: 'Goal not found.' });

        const { role, email } = req.user;

        if (role === 'Employee' && goal.employee_email !== email) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        if (role === 'Manager' && !getTeamGoals(email).find(g => g.id === goal.id)) {
            return res.status(403).json({ error: 'This goal does not belong to your team.' });
        }

        return res.status(200).json({ success: true, data: goal });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/goals/:goalId  — partial update, Draft only
router.put('/:goalId', authMiddleware, (req, res) => {
    try {
        const goal = goalsDB[req.params.goalId];
        if (!goal) return res.status(404).json({ error: 'Goal not found.' });

        if (goal.employee_email !== req.user.email) {
            return res.status(403).json({ error: 'You can only edit your own goals.' });
        }
        if (goal.status !== 'Draft') {
            return res.status(400).json({
                error: `Goal cannot be edited. Status is '${goal.status}'. Only Draft goals are editable.`
            });
        }

        validateGoal(req.body, true);

        if (req.body.weightage !== undefined) {
            const others       = getEmployeeGoals(req.user.email).filter(g => g.id !== goal.id);
            const hypothetical = [...others, { ...goal, weightage: parseFloat(req.body.weightage) }];
            validateGoalWeightage(hypothetical, [], 'update');
        }

        const fields = ['title', 'description', 'thrust_area', 'uom_type', 'uom_direction', 'target', 'weightage'];
        fields.forEach(field => {
            if (req.body[field] !== undefined && String(req.body[field]) !== String(goal[field])) {
                audit(goal.id, field, goal[field], req.body[field], req.user.email);
            }
        });

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                goal[field] = (field === 'target' || field === 'weightage')
                    ? parseFloat(req.body[field])
                    : req.body[field];
            }
        });
        goal.updated_at = new Date().toISOString();

        console.log(`[GOALS] ${req.user.email} updated goal ${goal.id}`);
        return res.status(200).json({ success: true, data: goal });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// DELETE /api/goals/:goalId  — Draft only
router.delete('/:goalId', authMiddleware, (req, res) => {
    try {
        const goal = goalsDB[req.params.goalId];
        if (!goal) return res.status(404).json({ error: 'Goal not found.' });

        if (goal.employee_email !== req.user.email) {
            return res.status(403).json({ error: 'You can only delete your own goals.' });
        }
        if (goal.status !== 'Draft') {
            return res.status(400).json({
                error: `Goal cannot be deleted. Status is '${goal.status}'. Only Draft goals can be deleted.`
            });
        }

        audit(goal.id, 'status', goal.status, 'DELETED', req.user.email);
        delete goalsDB[goal.id];

        console.log(`[GOALS] ${req.user.email} deleted goal ${req.params.goalId}`);
        return res.status(200).json({ success: true, message: 'Goal deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
module.exports.goalsDB = goalsDB;
