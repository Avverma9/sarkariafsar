const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    blockId: { type: String, required: true },
    type: { type: String, required: true },
    weight: { type: Number, default: 5, min: 1, max: 10 },
    content: { type: String, required: true },
  },
  { _id: false }
);

const contentTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, required: true, unique: true },
    pageType: { type: String, required: true, index: true },
    language: { type: String, default: "hi" },
    version: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    blocks: { type: [blockSchema], required: true, validate: (v) => v.length >= 1 },
  },
  { timestamps: true }
);

contentTemplateSchema.index({ pageType: 1, language: 1, active: 1 });

module.exports = mongoose.model("ContentTemplate", contentTemplateSchema);
