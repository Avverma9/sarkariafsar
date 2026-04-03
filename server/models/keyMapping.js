const mongoose = require("mongoose");

const keyMappingSchema = new mongoose.Schema(
  {
    rawKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    canonicalKey: {
      type: String,
      required: true,
      trim: true,
    },
    sectionHint: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["gemini", "manual", "pattern"],
      default: "gemini",
    },
  },
  { timestamps: true, collection: "key_mappings" }
);

module.exports =
  mongoose.models.KeyMapping ||
  mongoose.model("KeyMapping", keyMappingSchema);
