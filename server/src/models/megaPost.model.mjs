import mongoose from "mongoose";

const megaPostSchema = new mongoose.Schema(
  {
    megaSlug: { type: String, required: true, index: true },
    megaTitle: { type: String, required: true },

    title: { type: String, required: true, index: true },

    // 🔥 Deduplication key
    canonicalKey: { type: String, required: true, index: true },

    // 🔥 ORIGINAL POST URL (AI scraping ke liye)
    originalUrl: { type: String, required: true },

    // Secondary dedupe keys
    altIdKey: { type: String, default: "", index: true },
    altTokenKey: { type: String, default: "", index: true },
    altUrlKey: { type: String, default: "", index: true },

    // Track source
    sourceSiteId: { type: mongoose.Schema.Types.ObjectId, ref: "AggregatorSite" },
    sourceSiteName: { type: String },
    sourceSectionUrl: { type: String },

    // Raw content for AI extraction
    contentHtml: { type: String, default: "" },
    contentText: { type: String, default: "" },
    newHtml: { type: String, default: "" },

    // AI scraping ke liye future fields
    aiScraped: { type: Boolean, default: false },
    aiScrapedAt: { type: Date },
    aiModel: { type: String, default: "" },
    aiData: { type: Object, default: null },
    recruitmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Recruitment", index: true },
    recruitmentKey: { type: String, default: "", index: true },
    lastEventProcessedAt: { type: Date, default: null, index: true },

    // Gemini-free tracked snapshot for periodic update API
    updateSnapshot: { type: Object, default: null },
    pageHash: { type: String, default: "", index: true },

    // Periodic post-update matching metadata
    lastPostUpdateCheckAt: { type: Date, index: true },
    lastPostMatchScore: { type: Number, default: 0 },
    lastPostMatchedUrl: { type: String, default: "" },
    lastPostFingerprintHash: { type: String, default: "" },
    lastPostNotifyAt: { type: Date },

    // Frontend favorite marker (global on post)
    isFavorite: { type: Boolean, default: false, index: true },
    favoriteMarkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ❗ Dedupe across mega section
megaPostSchema.index({ megaSlug: 1, canonicalKey: 1 }, { unique: true });
megaPostSchema.index({ megaSlug: 1, altIdKey: 1 });
megaPostSchema.index({ megaSlug: 1, altTokenKey: 1 });
megaPostSchema.index({ megaSlug: 1, altUrlKey: 1 });
megaPostSchema.index({ megaTitle: 1, sourceSectionUrl: 1, createdAt: -1 });

export default mongoose.model("MegaPost", megaPostSchema);
