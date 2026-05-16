const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

/**
 * Verifies Bearer token and attaches decoded user to req.user
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authorization header missing or malformed. Expected: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token not provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach clean user object to request
        req.user = {
            id:    decoded.id,
            email: decoded.email,
            name:  decoded.name,
            role:  decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired. Please log in again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token.' });
        }
        console.error('Auth middleware error:', error.message);
        return res.status(403).json({ error: 'Authentication failed.' });
    }
};

/**
 * Allows Manager AND Admin (Admins can do everything managers can)
 */
const managerMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
            return res.status(403).json({
                error: 'Access denied. Manager or Admin role required.',
                your_role: req.user.role
            });
        }
        next();
    });
};

/**
 * Admin only
 */
const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                error: 'Access denied. Admin role required.',
                your_role: req.user.role
            });
        }
        next();
    });
};

module.exports = { authMiddleware, managerMiddleware, adminMiddleware };
