import mongoose from "mongoose";

const jobLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    owner: { type: String, default: "" },
    lockedUntil: { type: Date, required: true, index: true },
    lastRunAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("JobLock", jobLockSchema);
