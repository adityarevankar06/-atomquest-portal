const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'atomquest-secret';

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required.' });
    if (!password) return res.status(400).json({ error: 'Password is required.' });

    const emailLower = email.toLowerCase().trim();

    const { rows } = await pool.query(
      'SELECT * FROM employees WHERE email = $1',
      [emailLower]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: `No account found for ${email}.`
      });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not set up. Contact admin.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

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
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM employees WHERE email = $1',
      [req.user.email]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User record not found.' });
    const user = rows[0];
    return res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, manager_email: user.manager_email }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/profile
// ---------------------------------------------------------------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM employees WHERE email = $1',
      [req.user.email]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User record not found.' });
    const user = rows[0];
    return res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, manager_email: user.manager_email }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
