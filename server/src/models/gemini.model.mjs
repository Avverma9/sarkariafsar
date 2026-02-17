import mongoose from "mongoose";

const geminiModelSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
    index: true,
  },
  lastUsedAt: { type: Date },
}, { timestamps: true });

const GeminiModel = mongoose.model("GeminiModel", geminiModelSchema);

export default GeminiModel;
