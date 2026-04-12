const router = require('express').Router();
const passport = require('passport');
const { googleCallback, getMe } = require('../controllers/auth');
const authUser = require('../middleware/authUser');

// Step 1: Redirect to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }),
  googleCallback
);

// Step 3: Get current user
router.get('/me', authUser, getMe);

module.exports = router;
