import mongoose from "mongoose";

const jobDetailsSchema = new mongoose.Schema(
  {
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    sectionCanonicalUrl: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    jobtitle: {
      type: String,
      required: true,
      trim: true,
    },
    postDate: {
      type: Date,
      default: Date.now,
    },
    applyLastDate: {
      type: Date,
      required: true,
    },
    aiMonitoring: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    strict: false,
    timestamps: true,
  }
);

jobDetailsSchema.index({ postDate: -1, applyLastDate: 1 });

const JobDetails =
  mongoose.models.JobDetails || mongoose.model("JobDetails", jobDetailsSchema);

export default JobDetails;
