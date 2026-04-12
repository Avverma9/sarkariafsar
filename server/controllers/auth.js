const jwt = require('jsonwebtoken');
const User = require('../models/user');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sarkariafsar.com';
const JWT_EXPIRES = '30d';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Called by Passport after Google OAuth success.
 * Upserts user, creates JWT, redirects frontend to /auth/callback?token=...
 */
async function googleCallback(req, res) {
  try {
    const profile = req.user; // passport attaches google profile here temporarily

    // Upsert user
    let user = await User.findOneAndUpdate(
      { googleId: profile.googleId },
      {
        $set: {
          name:        profile.name,
          email:       profile.email,
          avatar:      profile.avatar,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { googleId: profile.googleId },
      },
      { upsert: true, new: true }
    );

    const token = signToken(user._id);
    // Redirect to frontend with JWT in query param
    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[Auth] googleCallback error', err);
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=server_error`);
  }
}

/**
 * GET /auth/me — returns current user from JWT
 */
async function getMe(req, res) {
  return res.json({
    success: true,
    data: req.user,
  });
}

module.exports = { googleCallback, getMe };
