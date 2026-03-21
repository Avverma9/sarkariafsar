import mongoose from "mongoose";

const toCanonicalUrl = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const jobSectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    canonicalUrl: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSectionSchema.pre("save", function ensureCanonicalUrl(next) {
  if (this.name && !this.canonicalUrl) {
    this.canonicalUrl = toCanonicalUrl(this.name);
  }
  next();
});

const JobSection =
  mongoose.models.JobSection ||
  mongoose.model("JobSection", jobSectionSchema);

export { toCanonicalUrl };

export default JobSection;
