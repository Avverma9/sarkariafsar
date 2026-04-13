const AuthSettings = require('../models/authSettings');

async function getSettings(req, res) {
  try {
    const cfg = await AuthSettings.getSingleton();
    return res.json({ success: true, data: cfg });
  } catch (err) {
    console.error('[AuthSettings] getSettings error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      googleEnabled, googleClientId, googleClientSecret,
      emailOtpEnabled,
      smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom,
      otpExpireMinutes,
    } = req.body;

    const cfg = await AuthSettings.getSingleton();

    if (googleEnabled      !== undefined) cfg.googleEnabled      = googleEnabled;
    if (googleClientId     !== undefined) cfg.googleClientId     = googleClientId;
    if (googleClientSecret !== undefined) cfg.googleClientSecret = googleClientSecret;
    if (emailOtpEnabled    !== undefined) cfg.emailOtpEnabled    = emailOtpEnabled;
    if (smtpHost           !== undefined) cfg.smtpHost           = smtpHost;
    if (smtpPort           !== undefined) cfg.smtpPort           = Number(smtpPort);
    if (smtpSecure         !== undefined) cfg.smtpSecure         = smtpSecure;
    if (smtpUser           !== undefined) cfg.smtpUser           = smtpUser;
    if (smtpPass           !== undefined) cfg.smtpPass           = smtpPass;
    if (smtpFrom           !== undefined) cfg.smtpFrom           = smtpFrom;
    if (otpExpireMinutes   !== undefined) cfg.otpExpireMinutes   = Number(otpExpireMinutes);

    await cfg.save();
    return res.json({ success: true, data: cfg, message: 'Auth settings saved successfully' });
  } catch (err) {
    console.error('[AuthSettings] updateSettings error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSettings, updateSettings };
