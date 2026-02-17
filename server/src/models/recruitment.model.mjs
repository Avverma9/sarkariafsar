import mongoose from "mongoose";

const recruitmentSchema = new mongoose.Schema(
  {
    recruitmentKey: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "" },
    advertisementNumber: { type: String, default: "" },
    organization: {
      name: { type: String, default: "" },
      shortName: { type: String, default: "" },
      website: { type: String, default: "" },
      type: { type: String, default: "" },
    },
    canonicalSourceUrl: { type: String, default: "" },
    lastEventAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("Recruitment", recruitmentSchema);
