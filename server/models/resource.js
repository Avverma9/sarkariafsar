const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    // Scope — authority-wide ya post-specific
    scopeType: {
      type: String,
      enum: ['global', 'authority', 'post'],
      required: true,
      default: 'global',
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
      enum: ['book', 'pyq', 'notes', 'syllabus', 'mock_test_ref', 'video', 'other'],
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
    price: { type: Number, default: 0, min: 0 },
    discountedPrice: { type: Number, default: null, min: 0 },
    samplePages: { type: Number, default: 5, min: 0 },
    currency: { type: String, default: 'INR' },
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
resourceSchema.pre('save', function () {
  if (this.accessType === 'external' && !this.url) {
    throw new Error('url is required when accessType is external');
  }
  if (this.accessType === 'uploaded_file' && !this.fileUrl) {
    throw new Error('fileUrl is required when accessType is uploaded_file');
  }
  if (this.accessType === 'generated' && !this.linkedMockTestId) {
    throw new Error('linkedMockTestId is required when accessType is generated');
  }
  if (this.scopeType === 'authority' && !this.authorityKey) {
    throw new Error('authorityKey is required when scopeType is authority');
  }
  if (this.scopeType === 'post' && !this.jobPostId) {
    throw new Error('jobPostId is required when scopeType is post');
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
