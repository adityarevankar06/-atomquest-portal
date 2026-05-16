const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const managerMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Manager access required' });
        }
        next();
    });
};

const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

module.exports = { authMiddleware, managerMiddleware, adminMiddleware };
