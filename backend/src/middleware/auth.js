const jwt = require('jsonwebtoken');

// Use JWT_SECRET from env, with a built-in fallback for demo/mock deployments.
// In a real production setup with a database, always set JWT_SECRET in Vercel env vars.
const JWT_SECRET = process.env.JWT_SECRET || 'prescrypto-demo-secret-change-in-production';

if (!process.env.JWT_SECRET) {
  console.warn('[Auth] WARNING: JWT_SECRET not set in environment. Using built-in demo secret. Set this in Vercel env vars for production use.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const cookieHeader = req.headers.cookie || '';
  const cookieToken = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('prescrypto_token='))
    ?.split('=')
    .slice(1)
    .join('=');
  const token = (authHeader && authHeader.split(' ')[1]) || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
