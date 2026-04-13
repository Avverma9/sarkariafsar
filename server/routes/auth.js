const router   = require('express').Router();
const authUser = require('../middleware/authUser');
const {
  getMethods,
  googleInitiate, googleCallback,
  sendOtp, verifyOtp,
  getMe,
} = require('../controllers/auth');

// Public: which methods are enabled
router.get('/methods', getMethods);

// Google OAuth (manual — creds from DB)
router.get('/google',          googleInitiate);
router.get('/google/callback', googleCallback);

// Email OTP
router.post('/send-otp',   sendOtp);
router.post('/verify-otp', verifyOtp);

// Current user
router.get('/me', authUser, getMe);

module.exports = router;
