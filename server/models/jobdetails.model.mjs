import mongoose from 'mongoose';

const jobDetailsSchema = new mongoose.Schema({
  sectionCanonicalUrl: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true  // Fast lookups by URL
  },
  jobtitle: { 
    type: String, 
    required: true 
  },
  postDate: { 
    type: Date, 
    default: Date.now  // Auto current date [web:27]
  },
  applyLastDate: { 
    type: Date, 
    required: true  // Changed to Date for sorting/comparisons
  }
}, {
  strict: false,  // Allows extra fields (e.g., salary, location) [web:2]
  timestamps: true
});

// Index for active jobs (postDate recent, applyLastDate future)
jobDetailsSchema.index({ postDate: -1, applyLastDate: 1 });

const JobDetails = mongoose.model('JobDetails', jobDetailsSchema);

export default JobDetails;