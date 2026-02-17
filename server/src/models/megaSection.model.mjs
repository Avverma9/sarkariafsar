import mongoose from "mongoose";

const megaSectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },

    // all source sections from different sites that belong to this mega section
    sources: [
      {
        siteId: { type: mongoose.Schema.Types.ObjectId, ref: "AggregatorSite" },
        siteName: { type: String },
        siteUrl: { type: String },
        sectionTitle: { type: String },
        sectionUrl: { type: String },
      },
    ],

    isManual: { type: Boolean, default: false }, // for Previous Year Paper
  },
  { timestamps: true }
);

export default mongoose.model("MegaSection", megaSectionSchema);
