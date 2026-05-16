const jwt = require('jsonwebtoken');

// ─── FIX 2: Graceful token expiry ────────────────────────────────────────────
// Before: all JWT errors returned a generic 403. The frontend couldn't tell
// the difference between "never had a token" vs "token expired", so it never
// prompted the user to log in again.
//
// After: TokenExpiredError → 401 with { expired: true }
//        Any other JWT error → 403 with { error: 'Invalid token' }
//        No token at all     → 401 with { error: 'No token provided' }
//
// The frontend checks `err.response.data.expired` and redirects to /login.

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'atomquest-secret');
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Tell the client to re-authenticate — don't just say "forbidden"
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
        expired: true,
      });
    }
    // Tampered / wrong secret / malformed
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
