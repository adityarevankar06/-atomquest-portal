const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { calculateProgressScore } = require('../utils/scoringEngine');
const router = express.Router();

// Mock in-memory database
const achievementsDB = {};
const checkInsDB = {};

// POST: Submit quarterly achievement
router.post('/submit', authMiddleware, (req, res) => {
    try {
        const { goalId, quarter, actual_achievement, status } = req.body;

        if (!goalId || !quarter || actual_achievement === undefined || !status) {
            return res.status(400).json({ 
                error: 'Missing required fields: goalId, quarter, actual_achievement, status' 
            });
        }

        const achievementId = uuidv4();
        const newAchievement = {
            id: achievementId,
            goal_id: goalId,
            employee_email: req.user.email,
            quarter: quarter,
            fiscal_year: new Date().getFullYear(),
            actual_achievement: parseFloat(actual_achievement),
            status: status, // Not Started, On Track, Completed
            progress_score: 0, // Will be calculated when approved
            created_at: new Date().toISOString()
        };

        achievementsDB[achievementId] = newAchievement;

        res.status(201).json({
            success: true,
            message: 'Achievement submitted',
            data: newAchievement
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET: Get achievements for a goal
router.get('/:goalId', authMiddleware, (req, res) => {
    try {
        const { goalId } = req.params;
        const achievements = Object.values(achievementsDB).filter(a => a.goal_id === goalId);
        
        res.json({
            success: true,
            data: achievements
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Manager conducts check-in and scores achievement
router.post('/checkin/:achievementId', authMiddleware, (req, res) => {
    try {
        const { achievementId } = req.params;
        const { comment, progress_score } = req.body;

        if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Manager access required for check-in' });
        }

        const achievement = achievementsDB[achievementId];
        if (!achievement) {
            return res.status(404).json({ error: 'Achievement not found' });
        }

        const checkInId = uuidv4();
        const checkIn = {
            id: checkInId,
            achievement_id: achievementId,
            manager_email: req.user.email,
            comment: comment || '',
            progress_score: progress_score || achievement.progress_score,
            created_at: new Date().toISOString()
        };

        checkInsDB[checkInId] = checkIn;
        achievement.progress_score = checkIn.progress_score;

        res.status(201).json({
            success: true,
            message: 'Check-in completed',
            data: checkIn
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET: Check-ins for an achievement
router.get('/checkin/:achievementId', authMiddleware, (req, res) => {
    try {
        const { achievementId } = req.params;
        const checkIns = Object.values(checkInsDB).filter(c => c.achievement_id === achievementId);
        
        res.json({
            success: true,
            data: checkIns
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
