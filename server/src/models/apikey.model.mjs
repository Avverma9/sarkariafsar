import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["gemini"],
      default: "gemini",
      index: true,
    },
    apiKey: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    label: { type: String, default: "" },
    priority: { type: Number, default: 0, index: true },
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    lastFailedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

apiKeySchema.index({ provider: 1, apiKey: 1 }, { unique: true });

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
