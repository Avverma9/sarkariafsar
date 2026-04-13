const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
});

// MongoDB TTL index — auto-deletes docs after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
