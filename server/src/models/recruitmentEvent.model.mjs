import mongoose from "mongoose";

const EVENT_TYPES = [
  "APPLICATION",
  "DEADLINE",
  "ADMIT_CARD",
  "EXAM_DATE",
  "RESULT",
  "ANSWER_KEY",
  "CORRECTION",
  "DV",
  "COUNSELLING",
  "MERIT",
];

const recruitmentEventSchema = new mongoose.Schema(
  {
    recruitmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruitment",
      required: true,
      index: true,
    },
    eventType: { type: String, enum: EVENT_TYPES, required: true, index: true },
    eventDate: { type: Date, default: null, index: true },
    label: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    signatureHash: { type: String, required: true, index: true },
    sourcePostId: { type: mongoose.Schema.Types.ObjectId, ref: "MegaPost", index: true },
  },
  { timestamps: true },
);

recruitmentEventSchema.index(
  { recruitmentId: 1, eventType: 1, signatureHash: 1 },
  { unique: true },
);

export default mongoose.model("RecruitmentEvent", recruitmentEventSchema);
