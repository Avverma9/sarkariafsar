const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.NODE_ENV === 'production'
                  ? (process.env.PRODUCTION_CALLBACK_URL)
                  : (process.env.GOOGLE_CALLBACK_URL),
  },
  (accessToken, refreshToken, profile, done) => {
    // Normalize profile — we'll upsert in the controller
    const user = {
      googleId: profile.id,
      name:     profile.displayName,
      email:    profile.emails?.[0]?.value || '',
      avatar:   profile.photos?.[0]?.value || null,
    };
    return done(null, user);
  }
));

module.exports = passport;
