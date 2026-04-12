const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    // Scope — authority-wide ya post-specific
    scopeType: {
      type: String,
      enum: ['authority', 'post'],
      required: true,
      default: 'authority',
    },

    // Authority-level scope fields
    authorityKey: {
      type: String,
      trim: true,
      lowercase: true,
    },
    conductingAuthorityFull: {
      type: String,
      trim: true,
    },

    // Post-level scope field (optional override)
    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      default: null,
    },

    // Resource type
    type: {
      type: String,
      enum: ['book', 'pyq', 'notes', 'syllabus', 'mock_test_ref', 'other'],
      required: true,
    },

    // How user accesses this resource
    accessType: {
      type: String,
      enum: ['external', 'uploaded_file', 'generated'],
      required: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // For accessType = external
    url: { type: String, trim: true, default: null },

    // For accessType = uploaded_file
    fileUrl: { type: String, trim: true, default: null },
    fileName: { type: String, trim: true, default: null },
    fileSizeBytes: { type: Number, default: null },
    mimeType: { type: String, default: null },

    // For accessType = generated (linked mock test)
    linkedMockTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      default: null,
    },

    // Optional metadata
    year: { type: Number, default: null },
    examTags: { type: [String], default: [] },
    language: { type: String, default: 'Hindi/English' },
    isFree: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Audit
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

// Indexes for fast lookups
resourceSchema.index({ scopeType: 1, authorityKey: 1, isActive: 1 });
resourceSchema.index({ jobPostId: 1, isActive: 1 });
resourceSchema.index({ type: 1, isActive: 1 });

// Validation: conditional required fields based on accessType
resourceSchema.pre('save', function (next) {
  if (this.accessType === 'external' && !this.url) {
    return next(new Error('url is required when accessType is external'));
  }
  if (this.accessType === 'uploaded_file' && !this.fileUrl) {
    return next(new Error('fileUrl is required when accessType is uploaded_file'));
  }
  if (this.accessType === 'generated' && !this.linkedMockTestId) {
    return next(new Error('linkedMockTestId is required when accessType is generated'));
  }
  if (this.scopeType === 'authority' && !this.authorityKey) {
    return next(new Error('authorityKey is required when scopeType is authority'));
  }
  if (this.scopeType === 'post' && !this.jobPostId) {
    return next(new Error('jobPostId is required when scopeType is post'));
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
