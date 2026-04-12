const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Admin  = require('../models/admin');

const SEED_EMAIL    = 'av95766@gmail.com';
const SEED_PASSWORD = 'Avverma@1';
const SEED_NAME     = 'Ankit Verma';

/**
 * Seed default admin if none exists.
 * Called once on server startup.
 */
async function seedAdmin() {
  try {
    const exists = await Admin.findOne({ email: SEED_EMAIL });
    if (exists) {
      console.log('[Admin] Seed: admin already exists —', SEED_EMAIL);
      return;
    }
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
    await Admin.create({ email: SEED_EMAIL, passwordHash, name: SEED_NAME });
    console.log('[Admin] Seed: admin created —', SEED_EMAIL);
  } catch (err) {
    console.error('[Admin] Seed error:', err.message);
  }
}

/**
 * POST /api/admin/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email aur password dono required hain' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        _id:         admin._id,
        name:        admin.name,
        email:       admin.email,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (err) {
    console.error('[Admin] login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * GET /api/admin/me  — verify token + return admin info
 */
async function getMe(req, res) {
  return res.json({
    success: true,
    data: {
      _id:         req.admin._id,
      name:        req.admin.name,
      email:       req.admin.email,
      lastLoginAt: req.admin.lastLoginAt,
    },
  });
}

/**
 * POST /api/admin/change-password  — change own password
 * Body: { currentPassword, newPassword }
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword aur newPassword required hain' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password minimum 6 characters ka hona chahiye' });
    }

    const admin = await Admin.findById(req.admin._id);
    const match = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password galat hai' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return res.json({ success: true, message: 'Password successfully change ho gaya' });
  } catch (err) {
    console.error('[Admin] changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { login, getMe, changePassword, seedAdmin };
