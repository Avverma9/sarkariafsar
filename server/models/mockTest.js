const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'Each question must have exactly 4 options',
      },
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: { type: String, trim: true, default: '' },
    topic: { type: String, trim: true, default: '' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { _id: true }
);

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    // Linked job post (published target)
    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      default: null,
    },

    // Authority-level grouping (for reuse across posts)
    authorityKey: { type: String, trim: true, lowercase: true },
    conductingAuthorityFull: { type: String, trim: true },

    // Source PDF tracking
    sourcePdfPath: { type: String, default: null },
    sourcePdfName: { type: String, default: null },
    extractedText: { type: String, default: null },

    // Test config
    durationMin: { type: Number, default: 60 },
    totalQuestions: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
    examYear: { type: Number, default: null },
    examStage: { type: String, default: null },
    language: { type: String, default: 'Hindi/English' },
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0, min: 0 },
    discountedPrice: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'INR' },

    // Lifecycle status
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived'],
      default: 'draft',
    },

    questions: { type: [questionSchema], default: [] },

    // Parsing quality tracking
    parseStats: {
      totalExtracted: { type: Number, default: 0 },
      totalRejected: { type: Number, default: 0 },
      rejectionReasons: { type: [String], default: [] },
    },

    // Audit
    createdBy: { type: String, default: 'admin' },
    reviewedBy: { type: String, default: null },
    publishedBy: { type: String, default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
mockTestSchema.index({ jobPostId: 1, status: 1 });
mockTestSchema.index({ authorityKey: 1, status: 1 });

// Auto-sync totalQuestions before save
mockTestSchema.pre('save', function () {
  this.totalQuestions = this.questions.length;
});

module.exports = mongoose.model('MockTest', mockTestSchema);
