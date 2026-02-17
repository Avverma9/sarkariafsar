import mongoose from "mongoose";

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
});

export const AggregatorSite = mongoose.model("Site", siteSchema);