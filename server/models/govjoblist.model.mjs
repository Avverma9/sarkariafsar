import mongoose from "mongoose";
import { createHash } from "node:crypto";

const normalizeSectionKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "")
    .replace(/^_+|_+$/g, "");

const normalizeUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid URL protocol");
  }

  parsed.hash = "";
  return parsed.toString();
};

const toHash = (value = "") =>
  createHash("sha256").update(String(value || "")).digest("hex");

export const createJobUrlHash = (jobUrl = "") => toHash(normalizeUrl(jobUrl));

const toUniqueStringArray = (values = []) => {
  if (!Array.isArray(values)) return [];

  const output = [];
  const seen = new Set();

  for (const value of values) {
    const clean = String(value || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }

  return output;
};

const toSectionUrlArray = (values = []) => {
  const urls = [];
  for (const value of toUniqueStringArray(values)) {
    try {
      urls.push(normalizeUrl(value));
    } catch {
      continue;
    }
  }
  return urls;
};

const normalizePostList = (postList = [], fallbackSectionUrl = "") => {
  if (!Array.isArray(postList)) return [];

  const normalized = [];
  const seenHashes = new Set();

  for (const item of postList) {
    if (!item || typeof item !== "object") continue;

    const title = String(item.title || "").trim();
    const rawJobUrl = String(item.jobUrl || "").trim();
    const rawSourceSectionUrl = String(
      item.sourceSectionUrl || item.sectionUrl || fallbackSectionUrl || ""
    ).trim();

    if (!rawJobUrl) continue;

    let jobUrl = "";
    let sourceSectionUrl = "";
    try {
      jobUrl = normalizeUrl(rawJobUrl);
      sourceSectionUrl = rawSourceSectionUrl ? normalizeUrl(rawSourceSectionUrl) : "";
    } catch {
      continue;
    }

    const jobUrlHash = createJobUrlHash(jobUrl);
    if (seenHashes.has(jobUrlHash)) continue;
    seenHashes.add(jobUrlHash);

    normalized.push({
      title,
      jobUrl,
      sourceSectionUrl,
      jobUrlHash,
      fetchedAt: item.fetchedAt ? new Date(item.fetchedAt) : new Date(),
    });
  }

  return normalized;
};

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    jobUrl: {
      type: String,
      required: true,
      trim: true,
    },
    sourceSectionUrl: {
      type: String,
      default: "",
      trim: true,
    },
    jobUrlHash: {
      type: String,
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    strict: false,
  }
);

const govJobListSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    sectionName: {
      type: String,
      default: "",
      trim: true,
    },
    sectionUrls: {
      type: [String],
      default: [],
    },
    postList: {
      type: [postSchema],
      default: [],
    },
    totalPosts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    strict: false,
    minimize: false,
    timestamps: true,
  }
);

govJobListSchema.pre("validate", function normalizeGovJobListDoc(next) {
  try {
    this.section = normalizeSectionKey(this.section || this.sectionName);
    if (!this.section) {
      throw new Error("section is required");
    }

    this.sectionName = String(this.sectionName || this.section).trim();
    this.sectionUrls = toSectionUrlArray(this.sectionUrls || []);
    this.postList = normalizePostList(this.postList || [], this.sectionUrls[0] || "");
    this.totalPosts = this.postList.length;
    this.lastSyncedAt = new Date();

    next();
  } catch (error) {
    next(error);
  }
});

const GovJobList =
  mongoose.models.GovJobList ||
  mongoose.model("GovJobList", govJobListSchema, "gov_job_lists");

const toResponseShape = (doc) => ({
  id: String(doc._id),
  section: doc.section,
  sectionName: doc.sectionName || "",
  sectionUrls: [...(doc.sectionUrls || [])],
  totalPosts: Number(doc.totalPosts || 0),
  postList: (doc.postList || []).map((post) => ({
    title: post.title || "",
    jobUrl: post.jobUrl || "",
    sourceSectionUrl: post.sourceSectionUrl || "",
    jobUrlHash: post.jobUrlHash || "",
    fetchedAt: post.fetchedAt || null,
  })),
  lastSyncedAt: doc.lastSyncedAt || null,
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const mergePostLists = (existing = [], incoming = []) => {
  const map = new Map();

  for (const post of existing || []) {
    if (!post?.jobUrlHash) continue;
    map.set(post.jobUrlHash, {
      title: post.title || "",
      jobUrl: post.jobUrl || "",
      sourceSectionUrl: post.sourceSectionUrl || "",
      jobUrlHash: post.jobUrlHash,
      fetchedAt: post.fetchedAt || new Date(),
    });
  }

  for (const post of incoming || []) {
    if (!post?.jobUrlHash) continue;
    map.set(post.jobUrlHash, {
      title: post.title || "",
      jobUrl: post.jobUrl || "",
      sourceSectionUrl: post.sourceSectionUrl || "",
      jobUrlHash: post.jobUrlHash,
      fetchedAt: post.fetchedAt || new Date(),
    });
  }

  return Array.from(map.values());
};

export const upsertGovJobListSection = async ({
  section = "",
  sectionName = "",
  sectionUrls = [],
  postList = [],
  extra = {},
} = {}) => {
  const normalizedSection = normalizeSectionKey(section || sectionName);
  if (!normalizedSection) {
    throw new Error("section is required");
  }

  const normalizedSectionName = String(sectionName || normalizedSection).trim();
  const normalizedSectionUrls = toSectionUrlArray(sectionUrls || []);
  const normalizedPostList = normalizePostList(postList || [], normalizedSectionUrls[0] || "");

  const existing = await GovJobList.findOne({ section: normalizedSection });
  if (existing) {
    existing.sectionName = normalizedSectionName || existing.sectionName;
    existing.sectionUrls = toSectionUrlArray([...(existing.sectionUrls || []), ...normalizedSectionUrls]);
    existing.postList = mergePostLists(existing.postList || [], normalizedPostList);
    existing.totalPosts = existing.postList.length;
    existing.lastSyncedAt = new Date();

    if (extra && typeof extra === "object" && !Array.isArray(extra)) {
      Object.assign(existing, extra);
    }

    await existing.save();
    return { created: false, sectionData: toResponseShape(existing) };
  }

  const created = await GovJobList.create({
    ...(extra && typeof extra === "object" && !Array.isArray(extra) ? extra : {}),
    section: normalizedSection,
    sectionName: normalizedSectionName || normalizedSection,
    sectionUrls: normalizedSectionUrls,
    postList: normalizedPostList,
  });

  return { created: true, sectionData: toResponseShape(created) };
};

export const getGovJobListBySection = async (section = "") => {
  const normalizedSection = normalizeSectionKey(section);
  if (!normalizedSection) return null;

  const doc = await GovJobList.findOne({ section: normalizedSection }).lean();
  return doc ? toResponseShape(doc) : null;
};

export const listGovJobListSections = async () => {
  const docs = await GovJobList.find({}).sort({ section: 1 }).lean();
  return docs.map(toResponseShape);
};

export const govJobListModel = {
  model: GovJobList,
  upsertSection: upsertGovJobListSection,
  getBySection: getGovJobListBySection,
  list: listGovJobListSections,
  createJobUrlHash,
};

export { GovJobList, govJobListSchema };

export default govJobListModel;
