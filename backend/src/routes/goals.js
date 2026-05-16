const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, managerMiddleware } = require('../middleware/auth');
const { validateGoal, validateGoalWeightage } = require('../utils/goalValidator');
const router = express.Router();

// Mock in-memory database
const goalsDB = {};
const auditLogsDB = {};

// GET: List employee's goals
router.get('/', authMiddleware, (req, res) => {
    try {
        const userEmail = req.user.email;
        const userGoals = Object.values(goalsDB).filter(g => g.employee_email === userEmail);
        res.json({
            success: true,
            data: userGoals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Create goal(s)
router.post('/', authMiddleware, (req, res) => {
    try {
        const goals = Array.isArray(req.body) ? req.body : [req.body];
        
        // Validate each goal
        goals.forEach(goal => validateGoal(goal));
        
        // Validate total weightage
        validateGoalWeightage(goals);

        const userEmail = req.user.email;
        const createdGoals = [];

        goals.forEach(goal => {
            const goalId = uuidv4();
            const newGoal = {
                id: goalId,
                employee_email: userEmail,
                employee_name: req.user.name,
                title: goal.title,
                description: goal.description || '',
                thrust_area: goal.thrust_area,
                uom_type: goal.uom_type,
                uom_direction: goal.uom_direction || 'Min',
                target: goal.target,
                weightage: parseFloat(goal.weightage),
                status: 'Draft',
                created_at: new Date().toISOString(),
                approved_at: null,
                approved_by: null
            };

            goalsDB[goalId] = newGoal;
            createdGoals.push(newGoal);

            // Log creation in audit
            auditLogsDB[uuidv4()] = {
                goal_id: goalId,
                field_changed: 'created',
                old_value: null,
                new_value: 'DRAFT',
                changed_by: userEmail,
                changed_at: new Date().toISOString()
            };
        });

        res.status(201).json({
            success: true,
            message: `${createdGoals.length} goal(s) created successfully`,
            data: createdGoals
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT: Update goal (only before approval)
router.put('/:goalId', authMiddleware, (req, res) => {
    try {
        const { goalId } = req.params;
        const goal = goalsDB[goalId];

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goal.employee_email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (goal.status !== 'Draft') {
            return res.status(400).json({ error: 'Can only edit Draft goals' });
        }

        // Validate new goal data if provided
        if (req.body.title) validateGoal(req.body);

        const oldGoal = { ...goal };
        Object.assign(goal, {
            ...req.body,
            updated_at: new Date().toISOString()
        });

        // Log update
        auditLogsDB[uuidv4()] = {
            goal_id: goalId,
            field_changed: 'updated',
            old_value: JSON.stringify(oldGoal),
            new_value: JSON.stringify(goal),
            changed_by: req.user.email,
            changed_at: new Date().toISOString()
        };

        res.json({ success: true, data: goal });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE: Delete goal (only Draft)
router.delete('/:goalId', authMiddleware, (req, res) => {
    try {
        const { goalId } = req.params;
        const goal = goalsDB[goalId];

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (goal.employee_email !== req.user.email) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (goal.status !== 'Draft') {
            return res.status(400).json({ error: 'Can only delete Draft goals' });
        }

        delete goalsDB[goalId];

        res.json({ success: true, message: 'Goal deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Manager approves goal
router.post('/approve/:goalId', managerMiddleware, (req, res) => {
    try {
        const { goalId } = req.params;
        const { approved } = req.body;
        const goal = goalsDB[goalId];

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const oldStatus = goal.status;
        
        if (approved) {
            goal.status = 'Approved';
            goal.approved_at = new Date().toISOString();
            goal.approved_by = req.user.email;
        } else {
            goal.status = 'Rejected';
        }

        // Log approval
        auditLogsDB[uuidv4()] = {
            goal_id: goalId,
            field_changed: 'status',
            old_value: oldStatus,
            new_value: goal.status,
            changed_by: req.user.email,
            changed_at: new Date().toISOString()
        };

        res.json({
            success: true,
            message: `Goal ${approved ? 'approved' : 'rejected'}`,
            data: goal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Manager's team goals
router.get('/team', managerMiddleware, (req, res) => {
    try {
        // For demo, return all non-approved goals
        const teamGoals = Object.values(goalsDB).filter(g => g.status === 'Draft' || g.status === 'Rejected');
        res.json({
            success: true,
            data: teamGoals
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: All goals (admin)
router.get('/all', authMiddleware, (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        res.json({
            success: true,
            data: Object.values(goalsDB)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
