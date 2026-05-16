const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock user database
const USERS = {
    'alice@acme.com': { email: 'alice@acme.com', role: 'Employee', name: 'Alice Johnson' },
    'bob@acme.com': { email: 'bob@acme.com', role: 'Manager', name: 'Bob Manager' },
    'charlie@acme.com': { email: 'charlie@acme.com', role: 'Admin', name: 'Charlie Admin' }
};

router.post('/login', (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Verify user exists
        const user = USERS[email];
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Verify role matches
        if (role && user.role !== role) {
            return res.status(401).json({ error: 'Invalid role for this user' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                email: user.email, 
                role: user.role,
                name: user.name,
                id: email // Use email as ID for now
            },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.get('/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        res.json({ user: decoded });
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
});

module.exports = router;
