const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, company_id: user.company_id, gym_db_path: user.gym_db_path },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware: require a valid JWT, attach decoded payload to req.user
function requireAuth(req, res, next) {
  if (req.user) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    req.user.companyId = req.user.company_id || req.user.companyId;
    req.companyId = req.user.companyId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware factory: require one of the given roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Middleware: require elevated admin flag from registry users table
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No token provided' });
  if (!req.registryDb) return res.status(500).json({ error: 'Registry not initialized' });
  try {
    const row = req.registryDb.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
    if (!row || !row.is_admin) {
      return res.status(403).json({ error: 'Forbidden: not admin' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Authorization lookup failed' });
  }
}

module.exports = { signToken, requireAuth, requireRole, requireAdmin, JWT_SECRET };
