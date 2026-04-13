const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  postId:   { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
  slug:     { type: String, required: true },
  title:    { type: String },
  savedAt:  { type: Date, default: Date.now },
}, { _id: false });

const mockHistorySchema = new mongoose.Schema({
  testId:       { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
  testTitle:    { type: String },
  score:        { type: Number, default: 0 },
  totalQ:       { type: Number, default: 0 },
  timeTakenSec: { type: Number, default: 0 },
  takenAt:      { type: Date, default: Date.now },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  itemId:      { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType:    { type: String, enum: ['resource', 'mock_test'], required: true },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  purchasedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: { type: String, sparse: true, unique: true },
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  avatar:   { type: String, default: null },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },

  savedJobs:       { type: [savedJobSchema],   default: [] },
  mockTestHistory: { type: [mockHistorySchema], default: [] },
  purchases:       { type: [purchaseSchema],    default: [] },

  lastLoginAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
