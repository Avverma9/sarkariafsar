const mongoose = require("mongoose");
const { Schema } = mongoose;

const SourceInfoSchema = new Schema(
  {
    sourceSiteName: { type: String, default: "" },
    sourceSectionName: { type: String, default: "" },
    sourceSectionUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ScrapedContentSchema = new Schema(
  {
    contentHtml: { type: String, default: "" },
    contentJson: { type: Schema.Types.Mixed, default: {} },
    extractedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const jobPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    dedupeKey: {
      type: String,
      default: "",
      trim: true,
    },

    jobtitle: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    sectionName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    sectionCanonicalUrl: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    language: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    advertisement_number: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    advertisementNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    conducting_authority: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    conductingAuthority: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    disclaimer: {
      type: String,
      default: "",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    applyLastDate: {
      type: Date,
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    scrapedMeta: {
      type: SourceInfoSchema,
      default: () => ({}),
    },

    scrapedContent: {
      type: ScrapedContentSchema,
      default: () => ({}),
    },

    htmlSnapshot: {
      type: String,
      default: "",
      trim: true,
    },

    titleSignature: {
      type: String,
      default: "",
      trim: true,
    },

    lastPatchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
    collection: "scrapper_posts",
  }
);

jobPostSchema.index({ sectionCanonicalUrl: 1, createdAt: -1 });
jobPostSchema.index({ isActive: 1, createdAt: -1 });
jobPostSchema.index({ sourceUrl: 1 }, { sparse: true });
jobPostSchema.index({ htmlSnapshot: 1 }, { sparse: true });
jobPostSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

module.exports =
  mongoose.models.JobPost || mongoose.model("JobPost", jobPostSchema);
