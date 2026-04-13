const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName:  { type: String },

    itemType:  { type: String, enum: ['resource', 'mock_test'], required: true },
    itemId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    itemTitle: { type: String },

    amount:   { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    cfOrderId:        { type: String, unique: true, sparse: true },
    paymentSessionId: { type: String, default: null },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'expired', 'refunded'],
      default: 'pending',
    },

    cfPaymentId:    { type: String, default: null },
    webhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    paidAt:         { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ cfOrderId: 1 });
orderSchema.index({ userId: 1, itemType: 1, itemId: 1 });

module.exports = mongoose.model('Order', orderSchema);
