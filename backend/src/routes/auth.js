const express = require('express');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// ---------------------------------------------------------------------------
// Demo user store (replaces a real DB for the hackathon)
// Key = email, value = user record
// ---------------------------------------------------------------------------
const USERS = {
    'alice@acme.com':   { id: 'user-001', email: 'alice@acme.com',   name: 'Alice Johnson', role: 'Employee', manager_email: 'bob@acme.com' },
    'bob@acme.com':     { id: 'user-002', email: 'bob@acme.com',     name: 'Bob Manager',   role: 'Manager',  manager_email: null },
    'charlie@acme.com': { id: 'user-003', email: 'charlie@acme.com', name: 'Charlie Admin', role: 'Admin',    manager_email: null }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, role }
// Returns: { success, token, user }
// ---------------------------------------------------------------------------
router.post('/login', (req, res) => {
    try {
        const { email, role } = req.body;

        // --- Input validation ---
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const emailLower = email.toLowerCase().trim();
        const user = USERS[emailLower];

        if (!user) {
            return res.status(401).json({
                error: `No account found for ${email}. Valid demo users: alice@acme.com, bob@acme.com, charlie@acme.com`
            });
        }

        // If frontend sends a role, verify it matches what the DB has
        if (role && user.role !== role) {
            return res.status(401).json({
                error: `Role mismatch. ${email} is registered as '${user.role}', not '${role}'.`
            });
        }

        // --- Issue JWT ---
        const payload = {
            id:    user.id,
            email: user.email,
            name:  user.name,
            role:  user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        console.log(`[AUTH] Login success: ${user.email} (${user.role})`);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id:    user.id,
                email: user.email,
                name:  user.name,
                role:  user.role
            }
        });

    } catch (error) {
        console.error('[AUTH] Login error:', error.message);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me  — returns the logged-in user from the token
// Requires: Bearer token
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, (req, res) => {
    // req.user is already populated by authMiddleware
    const user = USERS[req.user.email];

    if (!user) {
        return res.status(404).json({ error: 'User record not found.' });
    }

    return res.status(200).json({
        success: true,
        user: {
            id:            user.id,
            email:         user.email,
            name:          user.name,
            role:          user.role,
            manager_email: user.manager_email
        }
    });
});

// ---------------------------------------------------------------------------
// GET /api/auth/profile  — alias kept for backwards compatibility
// ---------------------------------------------------------------------------
router.get('/profile', authMiddleware, (req, res) => {
    const user = USERS[req.user.email];

    if (!user) {
        return res.status(404).json({ error: 'User record not found.' });
    }

    return res.status(200).json({
        success: true,
        user: {
            id:            user.id,
            email:         user.email,
            name:          user.name,
            role:          user.role,
            manager_email: user.manager_email
        }
    });
});

// Export USERS so goals.js can do manager → employee lookups
module.exports = router;
module.exports.USERS = USERS;
