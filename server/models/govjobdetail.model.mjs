import mongoose from "mongoose";
import { createHash } from "node:crypto";

const HTML_SIMILARITY_DEDUPE_VERSION = "formatted_html_hash_similarity_v1";
const DEFAULT_SIMILARITY_THRESHOLD = 0.8;
const SIMILARITY_CANDIDATE_LIMIT = 120;
const HTML_TOKEN_NGRAM_SIZE = 3;
const HTML_TOKEN_MAX_HASHES = 320;

const toCleanString = (value = "") => String(value || "").trim();

const normalizeHost = (hostname = "") =>
  toCleanString(hostname)
    .toLowerCase()
    .replace(/^www\./, "");

const toSourceHost = (primaryUrl = "", fallbackUrl = "") => {
  const candidates = [primaryUrl, fallbackUrl];
  for (const candidate of candidates) {
    try {
      return normalizeHost(new URL(candidate).hostname);
    } catch {
      // ignore
    }
  }
  return "";
};

const normalizeJobUrl = (value = "") => {
  const raw = toCleanString(value);
  if (!raw) return "";

  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid jobUrl protocol");
  }

  parsed.hash = "";
  return parsed.toString();
};

const stableJsonStringify = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    const items = keys.map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`);
    return `{${items.join(",")}}`;
  }

  return JSON.stringify(String(value));
};

const toUniqueStringArray = (values = []) => {
  if (!Array.isArray(values)) return [];

  const output = [];
  const seen = new Set();
  for (const value of values) {
    const clean = toCleanString(value);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
};

const hashValue = (value = "") =>
  createHash("sha256").update(String(value || "")).digest("hex");

const normalizeHtmlForHash = (value = "") =>
  String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, " and ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toHtmlTokenHashes = (value = "") => {
  const words = normalizeHtmlForHash(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (words.length === 0) return [];

  const hashes = [];
  const seen = new Set();
  const ngramSize = HTML_TOKEN_NGRAM_SIZE;

  const segments =
    words.length < ngramSize
      ? [words.join(" ")]
      : Array.from(
          { length: words.length - ngramSize + 1 },
          (_, index) => words.slice(index, index + ngramSize).join(" ")
        );

  for (const segment of segments) {
    const tokenHash = hashValue(segment);
    if (seen.has(tokenHash)) continue;
    seen.add(tokenHash);
    hashes.push(tokenHash);
    if (hashes.length >= HTML_TOKEN_MAX_HASHES) break;
  }

  return hashes;
};

const clampSimilarity = (value, fallback = DEFAULT_SIMILARITY_THRESHOLD) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

const calculateHashSimilarity = (leftHashes = [], rightHashes = []) => {
  const left = new Set((leftHashes || []).filter(Boolean));
  const right = new Set((rightHashes || []).filter(Boolean));

  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  const union = left.size + right.size - intersection;
  if (union <= 0) return 0;
  return intersection / union;
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createJobUrlHash = (jobUrl = "") => hashValue(normalizeJobUrl(jobUrl));

export const createJsonDataHash = (jsonData = null) => hashValue(stableJsonStringify(jsonData));

export const createFormattedHtmlHash = (formattedHtml = "") =>
  hashValue(normalizeHtmlForHash(formattedHtml));

export const createContentHash = (jsonData = null, formattedHtml = "") =>
  hashValue(`${createJsonDataHash(jsonData)}|${createFormattedHtmlHash(formattedHtml)}`);

const govJobDetailSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    jobUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    jobUrlHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    formattedHtmlHash: {
      type: String,
      default: "",
      index: true,
    },
    formattedHtmlTokenHashes: {
      type: [String],
      default: [],
    },
    formattedHtml: {
      type: String,
      default: "",
    },
    jsonData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    sourceSectionUrl: {
      type: String,
      default: "",
      trim: true,
    },
    sourceHost: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    jobUrlAliases: {
      type: [String],
      default: [],
    },
    jobUrlAliasHashes: {
      type: [String],
      default: [],
      index: true,
    },
    dedupeMeta: {
      version: {
        type: String,
        default: HTML_SIMILARITY_DEDUPE_VERSION,
      },
      matchedBy: {
        type: String,
        default: "",
      },
      similarityScore: {
        type: Number,
        default: 0,
      },
    },
    pageTitle: {
      type: String,
      default: "",
      trim: true,
    },
    canonicalUrl: {
      type: String,
      default: "",
      trim: true,
    },
    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },
    lastScrapedAt: {
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

govJobDetailSchema.pre("validate", function normalizeGovJobDetailDoc(next) {
  try {
    this.title = toCleanString(this.title || this?.jsonData?.title || this.pageTitle || "");
    this.jobUrl = normalizeJobUrl(this.jobUrl || "");
    this.jobUrlHash = createJobUrlHash(this.jobUrl);
    this.formattedHtml = String(this.formattedHtml || "");
    this.formattedHtmlHash = createFormattedHtmlHash(this.formattedHtml);
    this.formattedHtmlTokenHashes = toHtmlTokenHashes(this.formattedHtml);
    this.contentHash = createContentHash(this.jsonData, this.formattedHtml);
    this.section = toCleanString(this.section || "");
    this.sourceSectionUrl = toCleanString(this.sourceSectionUrl || "");
    this.sourceHost = toSourceHost(this.sourceSectionUrl, this.jobUrl);
    this.jobUrlAliases = toUniqueStringArray([...(this.jobUrlAliases || []), this.jobUrl]);
    this.jobUrlAliasHashes = toUniqueStringArray(
      this.jobUrlAliases.map((url) => {
        try {
          return createJobUrlHash(url);
        } catch {
          return "";
        }
      })
    );
    this.pageTitle = toCleanString(this.pageTitle || "");
    this.canonicalUrl = toCleanString(this.canonicalUrl || "");
    this.metaDescription = toCleanString(this.metaDescription || "");
    this.dedupeMeta = {
      version: toCleanString(this?.dedupeMeta?.version || HTML_SIMILARITY_DEDUPE_VERSION),
      matchedBy: toCleanString(this?.dedupeMeta?.matchedBy || ""),
      similarityScore: clampSimilarity(this?.dedupeMeta?.similarityScore, 0),
    };

    if (!this.lastScrapedAt || Number.isNaN(new Date(this.lastScrapedAt).getTime())) {
      this.lastScrapedAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

const GovJobDetail =
  mongoose.models.GovJobDetail ||
  mongoose.model("GovJobDetail", govJobDetailSchema, "gov_job_details");

const toResponseShape = (doc) => ({
  id: String(doc._id),
  title: doc.title || "",
  jobUrl: doc.jobUrl || "",
  jobUrlHash: doc.jobUrlHash || "",
  contentHash: doc.contentHash || "",
  formattedHtmlHash: doc.formattedHtmlHash || "",
  section: doc.section || "",
  sourceSectionUrl: doc.sourceSectionUrl || "",
  sourceHost: doc.sourceHost || "",
  dedupeMeta: {
    version: doc?.dedupeMeta?.version || HTML_SIMILARITY_DEDUPE_VERSION,
    matchedBy: doc?.dedupeMeta?.matchedBy || "",
    similarityScore: clampSimilarity(doc?.dedupeMeta?.similarityScore, 0),
  },
  pageTitle: doc.pageTitle || "",
  canonicalUrl: doc.canonicalUrl || "",
  metaDescription: doc.metaDescription || "",
  lastScrapedAt: doc.lastScrapedAt || null,
  createdAt: doc.createdAt || null,
  updatedAt: doc.updatedAt || null,
});

const toDetailResponseShape = (doc) => ({
  ...toResponseShape(doc),
  formattedHtml: doc.formattedHtml || "",
  jsonData: doc.jsonData ?? null,
  jobUrlAliases: [...(doc.jobUrlAliases || [])],
});

const mergeJobUrlAliases = (doc = {}, normalizedJobUrl = "") =>
  toUniqueStringArray([
    ...(doc?.jobUrlAliases || []),
    doc?.jobUrl || "",
    normalizedJobUrl || "",
  ]);

const findBestSimilarityCandidate = async ({
  section = "",
  sourceHost = "",
  formattedHtmlTokenHashes = [],
  threshold = DEFAULT_SIMILARITY_THRESHOLD,
} = {}) => {
  if (!sourceHost || !Array.isArray(formattedHtmlTokenHashes) || formattedHtmlTokenHashes.length === 0) {
    return null;
  }

  const query = { sourceHost };
  if (section) {
    query.section = toCleanString(section);
  }

  const candidates = await GovJobDetail.find(query)
    .sort({ lastScrapedAt: -1, updatedAt: -1 })
    .limit(SIMILARITY_CANDIDATE_LIMIT);

  let bestDoc = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = calculateHashSimilarity(
      formattedHtmlTokenHashes,
      candidate?.formattedHtmlTokenHashes || []
    );

    if (score > bestScore) {
      bestScore = score;
      bestDoc = candidate;
    }
  }

  if (!bestDoc || bestScore < threshold) return null;
  return { doc: bestDoc, score: bestScore };
};

export const upsertGovJobDetailFromScrape = async ({
  jobUrl = "",
  formattedHtml = "",
  jsonData = null,
  section = "",
  sourceSectionUrl = "",
  pageTitle = "",
  canonicalUrl = "",
  metaDescription = "",
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
  extra = {},
} = {}) => {
  const normalizedJobUrl = normalizeJobUrl(jobUrl);
  const jobUrlHash = createJobUrlHash(normalizedJobUrl);
  const safeSimilarityThreshold = clampSimilarity(
    similarityThreshold,
    DEFAULT_SIMILARITY_THRESHOLD
  );
  const formattedHtmlString = String(formattedHtml || "");
  const formattedHtmlHash = createFormattedHtmlHash(formattedHtmlString);
  const formattedHtmlTokenHashes = toHtmlTokenHashes(formattedHtmlString);
  const sourceHost = toSourceHost(sourceSectionUrl, normalizedJobUrl);
  const contentHash = createContentHash(jsonData, formattedHtmlString);
  const normalizedTitle = toCleanString(extra?.title || jsonData?.title || pageTitle || "");
  const payload = {
    ...((extra && typeof extra === "object" && !Array.isArray(extra)) ? extra : {}),
    title: normalizedTitle,
    jobUrl: normalizedJobUrl,
    jobUrlHash,
    contentHash,
    formattedHtmlHash,
    formattedHtmlTokenHashes,
    formattedHtml: formattedHtmlString,
    jsonData: jsonData ?? null,
    section: toCleanString(section || ""),
    sourceSectionUrl: toCleanString(sourceSectionUrl || ""),
    sourceHost,
    jobUrlAliases: [normalizedJobUrl],
    jobUrlAliasHashes: [jobUrlHash],
    dedupeMeta: {
      version: HTML_SIMILARITY_DEDUPE_VERSION,
      matchedBy: "",
      similarityScore: 0,
    },
    pageTitle: toCleanString(pageTitle || ""),
    canonicalUrl: toCleanString(canonicalUrl || ""),
    metaDescription: toCleanString(metaDescription || ""),
    lastScrapedAt: new Date(),
  };

  const existing = await GovJobDetail.findOne({
    $or: [
      { jobUrlHash },
      { jobUrl: normalizedJobUrl },
      { jobUrlAliasHashes: jobUrlHash },
      { jobUrlAliases: normalizedJobUrl },
    ],
  });

  if (existing) {
    const mergedAliases = mergeJobUrlAliases(existing, normalizedJobUrl);
    const changed = existing.contentHash !== contentHash;
    payload.jobUrlAliases = mergedAliases;
    payload.jobUrlAliasHashes = mergedAliases.map((url) => createJobUrlHash(url));
    payload.dedupeMeta = {
      version: HTML_SIMILARITY_DEDUPE_VERSION,
      matchedBy: "job_url_hash",
      similarityScore: 1,
    };
    Object.assign(existing, payload);
    await existing.save();

    return {
      created: false,
      updated: true,
      changed,
      patched: false,
      similarityScore: 1,
      detail: toDetailResponseShape(existing),
    };
  }

  const similarityMatch = await findBestSimilarityCandidate({
    section: payload.section,
    sourceHost: payload.sourceHost,
    formattedHtmlTokenHashes: payload.formattedHtmlTokenHashes,
    threshold: safeSimilarityThreshold,
  });

  if (similarityMatch?.doc) {
    const matchedDoc = similarityMatch.doc;
    const mergedAliases = mergeJobUrlAliases(matchedDoc, normalizedJobUrl);
    const changed = matchedDoc.contentHash !== contentHash;
    payload.jobUrlAliases = mergedAliases;
    payload.jobUrlAliasHashes = mergedAliases.map((url) => createJobUrlHash(url));
    payload.dedupeMeta = {
      version: HTML_SIMILARITY_DEDUPE_VERSION,
      matchedBy: "formatted_html_similarity",
      similarityScore: similarityMatch.score,
    };
    Object.assign(matchedDoc, payload);
    await matchedDoc.save();

    return {
      created: false,
      updated: true,
      changed,
      patched: true,
      similarityScore: similarityMatch.score,
      detail: toDetailResponseShape(matchedDoc),
    };
  }

  payload.dedupeMeta = {
    version: HTML_SIMILARITY_DEDUPE_VERSION,
    matchedBy: "created",
    similarityScore: 0,
  };

  const created = await GovJobDetail.create(payload);
  return {
    created: true,
    updated: false,
    changed: true,
    patched: false,
    similarityScore: 0,
    detail: toDetailResponseShape(created),
  };
};

export const listGovJobDetails = async ({ limit = 50 } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 50;
  const docs = await GovJobDetail.find({})
    .sort({ lastScrapedAt: -1, updatedAt: -1 })
    .limit(safeLimit)
    .lean();

  return docs.map(toResponseShape);
};

export const listAllGovJobDetails = async () => {
  const docs = await GovJobDetail.find({})
    .sort({ lastScrapedAt: -1, updatedAt: -1 })
    .lean();

  return docs.map(toDetailResponseShape);
};

export const findGovJobDetailsByTitle = async ({ title = "" } = {}) => {
  const normalizedTitle = toCleanString(title);
  if (!normalizedTitle) {
    throw new Error("title is required");
  }

  const escaped = escapeRegExp(normalizedTitle);
  const regexText = escaped.replace(/\s+/g, "\\s+");
  const regex = new RegExp(regexText, "i");

  const docs = await GovJobDetail.find({
    $or: [{ title: regex }, { pageTitle: regex }, { "jsonData.title": regex }],
  })
    .sort({ lastScrapedAt: -1, updatedAt: -1 })
    .lean();

  return docs.map(toDetailResponseShape);
};

export const findGovJobDetailByJobUrl = async ({ jobUrl = "" } = {}) => {
  const rawJobUrl = toCleanString(jobUrl);
  if (!rawJobUrl) {
    throw new Error("jobUrl is required");
  }

  const normalizedJobUrl = normalizeJobUrl(rawJobUrl);
  const jobUrlHash = createJobUrlHash(normalizedJobUrl);

  const doc = await GovJobDetail.findOne({
    $or: [
      { jobUrlHash },
      { jobUrl: normalizedJobUrl },
      { jobUrlAliasHashes: jobUrlHash },
      { jobUrlAliases: normalizedJobUrl },
    ],
  }).lean();

  return doc ? toDetailResponseShape(doc) : null;
};

export const govJobDetailModel = {
  model: GovJobDetail,
  upsertFromScrape: upsertGovJobDetailFromScrape,
  list: listGovJobDetails,
  getAll: listAllGovJobDetails,
  findByTitle: findGovJobDetailsByTitle,
  findByJobUrl: findGovJobDetailByJobUrl,
  createJobUrlHash,
  createJsonDataHash,
  createFormattedHtmlHash,
  createContentHash,
  calculateHashSimilarity,
};

export { GovJobDetail, govJobDetailSchema, normalizeJobUrl };

export default govJobDetailModel;
