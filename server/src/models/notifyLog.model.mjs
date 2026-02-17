import mongoose from "mongoose";

const notifyLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    recruitmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruitment",
      required: true,
      index: true,
    },
    eventKey: { type: String, required: true, index: true },
    sentAt: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notifyLogSchema.index({ email: 1, recruitmentId: 1, eventKey: 1 }, { unique: true });

export default mongoose.model("NotifyLog", notifyLogSchema);
