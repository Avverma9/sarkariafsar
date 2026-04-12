const jwt   = require('jsonwebtoken');
const Admin = require('../models/admin');

/**
 * Verify admin JWT from Authorization: Bearer <token>
 * Attaches req.admin on success.
 */
async function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Admin authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied — not an admin token' });
    }

    const admin = await Admin.findById(payload.adminId).select('-passwordHash -__v');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account not found or inactive' });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
}

module.exports = authAdmin;
