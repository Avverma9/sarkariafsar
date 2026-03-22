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
    title: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    advertisement_number: {
      type: String,
      trim: true,
      default: "",
    },
    advertisementNumber: {
      type: String,
      trim: true,
      default: "",
    },
    conducting_authority: {
      type: String,
      trim: true,
      default: "",
    },
    conductingAuthority: {
      type: String,
      trim: true,
      default: "",
    },
    recruitmentKey: {
      type: String,
      index: true,
      trim: true,
      default: "",
    },
    postType: {
      type: String,
      index: true,
      trim: true,
      default: "job",
    },
    lifecycleStage: {
      type: String,
      index: true,
      trim: true,
      default: "application_open",
    },
    isActive: {
      type: Boolean,
      index: true,
      default: true,
    },
    statusReason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      trim: true,
      default: "",
    },
    derivedFromPostId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    sourceDomain: {
      type: String,
      trim: true,
      default: "",
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: "",
    },
    direct_links: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    official_links: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    postDate: {
      type: Date,
      default: Date.now,
    },
    applyLastDate: {
      type: Date,
      default: null,
    },
    aiMonitoring: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    strict: false,
    strictQuery: false,
    timestamps: true,
  }
);

jobDetailsSchema.index({ postDate: -1, applyLastDate: 1 });
jobDetailsSchema.index({ recruitmentKey: 1, postType: 1 });
jobDetailsSchema.index({ recruitmentKey: 1, lifecycleStage: 1 });
jobDetailsSchema.index({ advertisement_number: 1, postType: 1 });
jobDetailsSchema.index({ advertisementNumber: 1, postType: 1 });

const JobDetails =
  mongoose.models.JobDetails || mongoose.model("JobDetails", jobDetailsSchema);

export default JobDetails;
