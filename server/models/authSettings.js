const mongoose = require('mongoose');

const authSettingsSchema = new mongoose.Schema({
  googleEnabled:      { type: Boolean, default: true },
  googleClientId:     { type: String,  default: '' },
  googleClientSecret: { type: String,  default: '' },

  emailOtpEnabled:    { type: Boolean, default: false },
  smtpHost:           { type: String,  default: 'smtp.gmail.com' },
  smtpPort:           { type: Number,  default: 465 },
  smtpSecure:         { type: Boolean, default: true },
  smtpUser:           { type: String,  default: '' },
  smtpPass:           { type: String,  default: '' },
  smtpFrom:           { type: String,  default: '' },
  otpExpireMinutes:   { type: Number,  default: 10 },
}, { timestamps: true });

authSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('AuthSettings', authSettingsSchema);
