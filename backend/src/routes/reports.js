const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Mock data for reports
let goalsDB = {};
let achievementsDB = {};
let auditLogsDB = {};

// GET: CSV export of achievements
router.get('/achievements-export', authMiddleware, (req, res) => {
    try {
        // For demo, return sample CSV data
        const csvData = `Employee,Goal,Target,Actual,Score,Status
Alice Johnson,Increase Revenue,100000,85000,85,On Track
Alice Johnson,Customer Satisfaction,85,88,100,Completed
Bob Manager,Process Efficiency,2026-12-31,2026-11-30,100,Completed
Charlie Admin,Safety Incidents,0,2,0,On Track`;

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=achievements.csv');
        res.send(csvData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Completion dashboard metrics
router.get('/completion-status', authMiddleware, (req, res) => {
    try {
        // For demo, return sample metrics
        const metrics = {
            success: true,
            data: {
                total_goals: 24,
                submitted: 20,
                approved: 18,
                checkin_completed: 15,
                completion_percentage: Math.round((15 / 24) * 100)
            }
        };

        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Create audit log entry
router.post('/audit-log', authMiddleware, (req, res) => {
    try {
        const { goalId, fieldChanged, oldValue, newValue } = req.body;

        if (!goalId || !fieldChanged) {
            return res.status(400).json({ 
                error: 'Missing required fields: goalId, fieldChanged' 
            });
        }

        const auditLog = {
            id: Date.now(),
            goal_id: goalId,
            field_changed: fieldChanged,
            old_value: oldValue,
            new_value: newValue,
            changed_by: req.user.email,
            changed_at: new Date().toISOString()
        };

        auditLogsDB[auditLog.id] = auditLog;

        res.status(201).json({
            success: true,
            data: auditLog
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET: Audit log for a goal
router.get('/audit-log/:goalId', adminMiddleware, (req, res) => {
    try {
        const { goalId } = req.params;

        // For demo, return sample audit logs
        const auditLogs = [
            {
                goal_id: goalId,
                field_changed: 'status',
                old_value: 'Draft',
                new_value: 'Approved',
                changed_by: 'bob@acme.com',
                changed_at: '2026-05-16T10:30:00Z'
            },
            {
                goal_id: goalId,
                field_changed: 'target',
                old_value: '100000',
                new_value: '120000',
                changed_by: 'alice@acme.com',
                changed_at: '2026-05-16T09:15:00Z'
            }
        ];

        res.json({
            success: true,
            data: auditLogs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Admin dashboard summary
router.get('/admin-summary', adminMiddleware, (req, res) => {
    try {
        const summary = {
            success: true,
            data: {
                total_employees: 3,
                total_goals: 24,
                goals_submitted: 20,
                goals_approved: 18,
                goals_with_checkin: 15,
                average_score: 87.5,
                teams: [
                    { manager: 'Bob Manager', employees: 8, goals: 12, approved: 10 },
                    { manager: 'Another Manager', employees: 6, goals: 12, approved: 8 }
                ]
            }
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
