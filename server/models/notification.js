const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPost',
    required: true,
  },
  slug:                { type: String, required: true },
  postTitle:           { type: String },
  sectionCanonicalUrl: { type: String },

  isActive:       { type: Boolean, default: true },
  subscribedAt:   { type: Date, default: Date.now },
  lastNotifiedAt: { type: Date, default: null },
}, { timestamps: true });

// One subscription per user per post
notificationSchema.index({ userId: 1, postId: 1 }, { unique: true });
// Fast lookup when a post changes
notificationSchema.index({ postId: 1, isActive: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
