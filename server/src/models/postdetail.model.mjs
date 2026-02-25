import mongoose from "mongoose";

const postDetailSchema = new mongoose.Schema(
  {
    megaPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MegaPost",
      required: true,
    },
    postTitle: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    pageHash: { type: String, default: "", index: true },
    htmlStableHash: { type: String, default: "" },
    textHash: { type: String, default: "" },
    lastScrapedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: true,
  }
);

postDetailSchema.index({ megaPostId: 1 }, { unique: true });

const PostDetail = mongoose.model("PostDetail", postDetailSchema);

export default PostDetail;
