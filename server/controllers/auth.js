const jwt          = require('jsonwebtoken');
const axios        = require('axios');
const User         = require('../models/user');
const Otp          = require('../models/otp');
const AuthSettings = require('../models/authSettings');
const { sendOtpEmail } = require('../utils/mailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sarkariafsar.com';
const JWT_EXPIRES  = '30d';

const CALLBACK_URL = process.env.NODE_ENV === 'production'
  ? (process.env.PRODUCTION_CALLBACK_URL || 'https://sarkariafsar.com/api/auth/google/callback')
  : (process.env.GOOGLE_CALLBACK_URL     || 'http://localhost:5000/api/auth/google/callback');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ─── Public: enabled auth methods ────────────────────────────────────────────

async function getMethods(req, res) {
  try {
    const cfg = await AuthSettings.getSingleton();
    return res.json({
      success: true,
      data: {
        google:   cfg.googleEnabled,
        emailOtp: cfg.emailOtpEnabled,
      },
    });
  } catch (err) {
    console.error('[Auth] getMethods error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Google OAuth (manual, credentials from DB) ──────────────────────────────

async function googleInitiate(req, res) {
  try {
    const cfg = await AuthSettings.getSingleton();
    if (!cfg.googleEnabled) {
      return res.status(403).json({ success: false, message: 'Google login is disabled' });
    }
    if (!cfg.googleClientId) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=google_not_configured`);
    }
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id',     cfg.googleClientId);
    url.searchParams.set('redirect_uri',  CALLBACK_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope',         'openid email profile');
    url.searchParams.set('access_type',   'offline');
    url.searchParams.set('prompt',        'select_account');
    return res.redirect(url.toString());
  } catch (err) {
    console.error('[Auth] googleInitiate error', err);
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=server_error`);
  }
}

async function googleCallback(req, res) {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_denied`);
    }

    const cfg = await AuthSettings.getSingleton();

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      redirect_uri:  CALLBACK_URL,
      grant_type:    'authorization_code',
    });

    const infoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
    });

    const { sub, name, email, picture } = infoRes.data;

    // Upsert by email — merge accounts sharing same email
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set:         { name, avatar: picture, lastLoginAt: new Date(), googleId: sub },
        $setOnInsert: { email: email.toLowerCase() },
      },
      { upsert: true, new: true }
    );

    const token = signToken(user._id);
    return res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[Auth] googleCallback error', err);
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=server_error`);
  }
}

// ─── Email OTP ────────────────────────────────────────────────────────────────

async function sendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const cfg = await AuthSettings.getSingleton();
    if (!cfg.emailOtpEnabled) {
      return res.status(403).json({ success: false, message: 'Email OTP login is disabled' });
    }
    if (!cfg.smtpUser || !cfg.smtpPass) {
      return res.status(500).json({ success: false, message: 'SMTP not configured' });
    }

    const otp           = String(Math.floor(100000 + Math.random() * 900000));
    const expireMinutes = cfg.otpExpireMinutes || 10;
    const expiresAt     = new Date(Date.now() + expireMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email.toLowerCase(), otp, expireMinutes);

    return res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('[Auth] sendOtp error', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Check SMTP settings.' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP required' });
    }

    const record = await Otp.findOne({ email: email.toLowerCase() });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }
    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    await Otp.deleteOne({ email: email.toLowerCase() });

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set:         { lastLoginAt: new Date() },
        $setOnInsert: { name: email.split('@')[0], email: email.toLowerCase() },
      },
      { upsert: true, new: true }
    );

    const token = signToken(user._id);
    return res.json({ success: true, token });
  } catch (err) {
    console.error('[Auth] verifyOtp error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ─── Current user ─────────────────────────────────────────────────────────────

async function getMe(req, res) {
  return res.json({ success: true, data: req.user });
}

module.exports = { getMethods, googleInitiate, googleCallback, sendOtp, verifyOtp, getMe };
