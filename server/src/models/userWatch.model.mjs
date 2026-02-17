import mongoose from "mongoose";

const userWatchSchema = new mongoose.Schema(
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
    enabled: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0 },
    channels: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

userWatchSchema.index({ email: 1, recruitmentId: 1 }, { unique: true });

export default mongoose.model("UserWatch", userWatchSchema);
