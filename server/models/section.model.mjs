import mongoose from 'mongoose';

const jobSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true  // Added for completeness; adjust as needed
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"  // Optional default value [web:27]
  },
  canonicalUrl: {
    type: String,
    unique: true,  // Ensures uniqueness for URLs
    sparse: true   // Allows nulls for uniqueness checks
  }
}, {
  timestamps: true
});

// Pre-save hook: Generate canonicalUrl from name if not set (e.g., "My Job" → "my-job")
jobSectionSchema.pre('save', function(next) {
  if (this.name && !this.canonicalUrl) {
    this.canonicalUrl = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
      .trim()
      .replace(/\s+/g, '-')         // Spaces to hyphens
      .replace(/-+/g, '-');         // Collapse hyphens
  }
  next();
});

const JobSection = mongoose.model('JobSection', jobSectionSchema);

export default JobSection;