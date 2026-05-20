import jwt from 'jsonwebtoken';

// In‑memory blacklist for demo purposes
const blacklist = new Set();

export const addToBlacklist = (token) => {
  blacklist.add(token);
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Invalid token format' });
  if (blacklist.has(token)) return res.status(401).json({ success: false, message: 'Token revoked' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload; // attach payload to request
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token verification failed' });
  }
};
