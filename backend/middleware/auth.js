// backend/middleware/auth.js
// Verifies Supabase JWT and attaches user + role to req
const supabase = require('../supabaseClient');
const { jwtDecode } = require('jwt-decode');

/**
 * Middleware: Verify that request contains a valid Supabase JWT.
 * Attaches req.user and req.userRole.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decoded;
    try {
      // Decode and verify the JWT directly
      decoded = jwtDecode(token);
    } catch (decodeErr) {
      console.error('JWT decode error:', decodeErr.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = decoded.sub;

    if (!userId) {
      console.error('No user ID in token');
      return res.status(401).json({ error: 'Invalid token: no user ID' });
    }

    // Verify token is not expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token expired:', new Date(decoded.exp * 1000));
      return res.status(401).json({ error: 'Token expired' });
    }

    // Fetch the user's role from our custom users table
    const { data: userRecord, error: userErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userErr) {
      console.error('User record error:', userErr.message);
      return res.status(401).json({ error: 'User record not found' });
    }

    if (!userRecord) {
      console.error('No user record found for:', userId);
      return res.status(401).json({ error: 'User record not found' });
    }

    req.user = { id: userId };
    req.userRole = userRecord.role;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: Require admin role.
 * Must be used AFTER authenticate().
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Middleware: Require faculty role.
 */
const requireFaculty = (req, res, next) => {
  if (req.userRole !== 'faculty') {
    return res.status(403).json({ error: 'Faculty access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireFaculty };
