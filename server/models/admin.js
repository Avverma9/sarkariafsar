const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name:         { type: String, default: 'Admin' },
    isActive:     { type: Boolean, default: true },
    lastLoginAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
