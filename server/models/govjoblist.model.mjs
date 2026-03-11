import mongoose from "mongoose";
import { createHash } from "node:crypto";
import { cleanJobPostTitle } from "../utils/jobPostTitle.mjs";
import { extractApplyLastDateMeta } from "../utils/jobApplyDate.mjs";

const normalizeSectionKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^\w]/g, "")
    .replace(/^_+|_+$/g, "");

const CANONICAL_SECTION_ALIASES = new Map([
  ["latest_jobs", "new_jobs"],
  ["latest_job", "new_jobs"],
  ["result", "results"],
]);

const toCanonicalSectionKey = (value = "") => {
  const normalized = normalizeSectionKey(value);
  return CANONICAL_SECTION_ALIASES.get(normalized) || normalized;
};

const getSectionLookupKeys = (value = "") => {
  const canonicalSection = toCanonicalSectionKey(value);
  if (!canonicalSection) return [];

  const legacyAliases = [...CANONICAL_SECTION_ALIASES.entries()]
    .filter(([, canonical]) => canonical === canonicalSection)
    .map(([alias]) => alias);

  return toUniqueStringArray([canonicalSection, ...legacyAliases]);
};

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

const toTitleAliasArray = (values = []) =>
  toUniqueStringArray(values)
    .map((value) => String(value || "").trim())
    .filter(Boolean);

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

const toDateTimestamp = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return date.getTime();
};

const toSortIndex = (value, fallback = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const toApplyLastDate = (value = "") => String(value || "").trim();
const isNewJobsSection = (value = "") => toCanonicalSectionKey(value) === "new_jobs";

const sortPostListByFetchedAtDesc = (postList = []) =>
  [...(postList || [])].sort((left, right) => {
    const fetchedAtDiff =
      toDateTimestamp(right?.fetchedAt) - toDateTimestamp(left?.fetchedAt);
    if (fetchedAtDiff !== 0) return fetchedAtDiff;

    const sortIndexDiff =
      toSortIndex(left?.sortIndex) - toSortIndex(right?.sortIndex);
    if (sortIndexDiff !== 0) return sortIndexDiff;

    const leftKey = String(left?.jobUrlHash || left?.jobUrl || "").trim();
    const rightKey = String(right?.jobUrlHash || right?.jobUrl || "").trim();
    return leftKey.localeCompare(rightKey);
  });

const normalizePostList = (postList = [], fallbackSectionUrl = "") => {
  if (!Array.isArray(postList)) return [];

  const normalized = [];
  const seenHashes = new Set();

  for (const item of postList) {
    if (!item || typeof item !== "object") continue;

    const rawTitle = String(item.title || "").trim();
    const title = cleanJobPostTitle(rawTitle);
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
      titleAliases: toTitleAliasArray([
        ...(item.titleAliases || []),
        rawTitle && rawTitle.toLowerCase() !== title.toLowerCase() ? rawTitle : "",
      ]),
      applyLastDate: toApplyLastDate(item.applyLastDate),
      jobUrl,
      sourceSectionUrl,
      jobUrlHash,
      sortIndex: toSortIndex(item.sortIndex, normalized.length),
      fetchedAt: item.fetchedAt ? new Date(item.fetchedAt) : new Date(),
    });
  }

  return sortPostListByFetchedAtDesc(normalized);
};

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    titleAliases: {
      type: [String],
      default: [],
    },
    jobUrl: {
      type: String,
      required: true,
      trim: true,
    },
    applyLastDate: {
      type: String,
      default: "",
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
    sortIndex: {
      type: Number,
      default: 0,
      min: 0,
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

govJobListSchema.index({ createdAt: -1 });

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
  postList: (doc.postList || []).map((post) => {
    const rawTitle = String(post.title || "").trim();
    const title = cleanJobPostTitle(rawTitle);
    return {
      title,
      titleAliases: toTitleAliasArray([
        ...(post.titleAliases || []),
        rawTitle && rawTitle.toLowerCase() !== title.toLowerCase() ? rawTitle : "",
      ]),
      applyLastDate: toApplyLastDate(post.applyLastDate),
      jobUrl: post.jobUrl || "",
      sourceSectionUrl: post.sourceSectionUrl || "",
      jobUrlHash: post.jobUrlHash || "",
      sortIndex: Number.isFinite(Number(post.sortIndex)) ? Number(post.sortIndex) : 0,
      fetchedAt: post.fetchedAt || null,
    };
  }),
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
      titleAliases: toTitleAliasArray(post.titleAliases || []),
      applyLastDate: toApplyLastDate(post.applyLastDate),
      jobUrl: post.jobUrl || "",
      sourceSectionUrl: post.sourceSectionUrl || "",
      jobUrlHash: post.jobUrlHash,
      sortIndex: toSortIndex(post.sortIndex, 0),
      fetchedAt: post.fetchedAt || new Date(),
    });
  }

  for (const post of incoming || []) {
    if (!post?.jobUrlHash) continue;
    map.set(post.jobUrlHash, {
      title: post.title || "",
      titleAliases: toTitleAliasArray([
        ...(map.get(post.jobUrlHash)?.titleAliases || []),
        ...(post.titleAliases || []),
      ]),
      applyLastDate: toApplyLastDate(post.applyLastDate),
      jobUrl: post.jobUrl || "",
      sourceSectionUrl: post.sourceSectionUrl || "",
      jobUrlHash: post.jobUrlHash,
      sortIndex: toSortIndex(post.sortIndex, 0),
      fetchedAt: post.fetchedAt || new Date(),
    });
  }

  return sortPostListByFetchedAtDesc(Array.from(map.values()));
};

const pickPrimarySectionDoc = (docs = [], canonicalSection = "") => {
  const normalizedCanonical = toCanonicalSectionKey(canonicalSection);
  return (
    docs.find(
      (doc) =>
        normalizeSectionKey(doc?.section || "") === normalizedCanonical
    ) ||
    docs[0] ||
    null
  );
};

const selectCanonicalSectionDocs = (docs = []) => {
  const canonicalMap = new Map();

  for (const doc of docs || []) {
    const canonicalSection = toCanonicalSectionKey(doc?.section || "");
    if (!canonicalSection) continue;

    const existing = canonicalMap.get(canonicalSection);
    const isCanonicalDoc =
      normalizeSectionKey(doc?.section || "") === canonicalSection;
    const existingIsCanonical =
      normalizeSectionKey(existing?.section || "") === canonicalSection;

    if (!existing || (isCanonicalDoc && !existingIsCanonical)) {
      canonicalMap.set(
        canonicalSection,
        isCanonicalDoc
          ? doc
          : {
              ...doc,
              section: canonicalSection,
            }
      );
    }
  }

  return [...canonicalMap.values()];
};

const buildApplyLastDateMetaMap = (detailDocs = []) => {
  const output = new Map();

  for (const detail of detailDocs || []) {
    const hash = String(detail?.jobUrlHash || "").trim();
    if (!hash || output.has(hash)) continue;

    const meta = extractApplyLastDateMeta(detail);
    if (!meta.applyLastDate && !meta.applyLastDateTimestamp) continue;
    output.set(hash, meta);
  }

  return output;
};

const hydratePostListApplyLastDate = ({
  postList = [],
  applyLastDateMetaMap = new Map(),
} = {}) =>
  (postList || []).map((post) => ({
    ...post,
    applyLastDate:
      applyLastDateMetaMap.get(String(post?.jobUrlHash || "").trim())?.applyLastDate ||
      toApplyLastDate(post?.applyLastDate),
  }));

const sortPostListByDeadlineDesc = ({
  postList = [],
  applyLastDateMetaMap = new Map(),
} = {}) => {
  const hydratedPostList = hydratePostListApplyLastDate({
    postList,
    applyLastDateMetaMap,
  });

  return [...hydratedPostList].sort((left, right) => {
    const leftDeadline =
      applyLastDateMetaMap.get(String(left?.jobUrlHash || "").trim())?.applyLastDateTimestamp ||
      0;
    const rightDeadline =
      applyLastDateMetaMap.get(String(right?.jobUrlHash || "").trim())?.applyLastDateTimestamp ||
      0;

    if (leftDeadline > 0 && rightDeadline > 0 && leftDeadline !== rightDeadline) {
      return rightDeadline - leftDeadline;
    }

    if (leftDeadline > 0 && rightDeadline <= 0) return -1;
    if (leftDeadline <= 0 && rightDeadline > 0) return 1;

    const leftSortIndex = toSortIndex(left?.sortIndex, Number.MAX_SAFE_INTEGER);
    const rightSortIndex = toSortIndex(right?.sortIndex, Number.MAX_SAFE_INTEGER);
    if (leftSortIndex !== rightSortIndex) {
      return leftSortIndex - rightSortIndex;
    }

    const fetchedAtDiff = toDateTimestamp(right?.fetchedAt) - toDateTimestamp(left?.fetchedAt);
    if (fetchedAtDiff !== 0) return fetchedAtDiff;

    return String(left?.jobUrl || "").localeCompare(String(right?.jobUrl || ""));
  });
};

const buildApplyLastDateUpdates = ({
  postList = [],
  applyLastDateMetaMap = new Map(),
} = {}) => {
  const updates = [];

  for (const post of postList || []) {
    const jobUrlHash = String(post?.jobUrlHash || "").trim();
    if (!jobUrlHash) continue;

    const applyLastDate =
      applyLastDateMetaMap.get(jobUrlHash)?.applyLastDate || "";
    if (!applyLastDate) continue;
    if (toApplyLastDate(post?.applyLastDate) === applyLastDate) continue;

    updates.push({
      jobUrlHash,
      jobUrl: String(post?.jobUrl || "").trim(),
      applyLastDate,
    });
  }

  return updates;
};

const hydrateSectionDocPostList = ({
  section = "",
  postList = [],
  applyLastDateMetaMap = new Map(),
} = {}) =>
  isNewJobsSection(section)
    ? sortPostListByDeadlineDesc({ postList, applyLastDateMetaMap })
    : hydratePostListApplyLastDate({ postList, applyLastDateMetaMap });

const hydrateGovJobListDocsWithApplyLastDates = async ({
  docs = [],
  persistApplyLastDates = false,
} = {}) => {
  if (!Array.isArray(docs) || docs.length === 0) {
    return [];
  }

  const docIds = docs
    .map((doc) => doc?._id)
    .filter(Boolean);

  const aggregatedDocs =
    docIds.length > 0
      ? await GovJobList.aggregate([
          {
            $match: {
              _id: { $in: docIds },
            },
          },
          {
            $lookup: {
              from: "gov_job_details",
              let: {
                jobHashes: "$postList.jobUrlHash",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$jobUrlHash", "$$jobHashes"],
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    jobUrlHash: 1,
                    jsonData: 1,
                    importantDates: 1,
                  },
                },
              ],
              as: "detailDocs",
            },
          },
        ])
      : [];

  const aggregatedMap = new Map(
    aggregatedDocs.map((doc) => [String(doc?._id || ""), doc])
  );
  const pendingUpdates = [];

  const hydratedDocs = docs.map((doc) => {
    const aggregatedDoc = aggregatedMap.get(String(doc?._id || ""));
    const applyLastDateMetaMap = buildApplyLastDateMetaMap(
      aggregatedDoc?.detailDocs || []
    );

    pendingUpdates.push(
      ...buildApplyLastDateUpdates({
        postList: doc?.postList || [],
        applyLastDateMetaMap,
      })
    );

    return {
      ...doc,
      postList: hydrateSectionDocPostList({
        section: String(doc?.section || "").trim(),
        postList: doc?.postList || [],
        applyLastDateMetaMap,
      }),
    };
  });

  if (persistApplyLastDates && pendingUpdates.length > 0) {
    await syncGovJobListApplyLastDates({
      updates: pendingUpdates,
    });
  }

  return hydratedDocs.map(toResponseShape);
};

const isRetryableWriteError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.name === "VersionError" ||
    message.includes("no matching document found") ||
    message.includes("version")
  );
};

export const upsertGovJobListSection = async ({
  section = "",
  sectionName = "",
  sectionUrls = [],
  postList = [],
  replacePostList = true,
  extra = {},
} = {}) => {
  const normalizedSection = toCanonicalSectionKey(section || sectionName);
  if (!normalizedSection) {
    throw new Error("section is required");
  }

  const normalizedSectionName = String(sectionName || normalizedSection).trim();
  const normalizedSectionUrls = toSectionUrlArray(sectionUrls || []);
  const normalizedPostList = normalizePostList(postList || [], normalizedSectionUrls[0] || "");
  const safeExtra =
    extra && typeof extra === "object" && !Array.isArray(extra) ? extra : {};

  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const lookupSections = getSectionLookupKeys(normalizedSection);
      const existingDocs = await GovJobList.find({
        section: { $in: lookupSections },
      }).sort({ updatedAt: -1, createdAt: -1 });
      const existing = pickPrimarySectionDoc(existingDocs, normalizedSection);

      if (existing) {
        existing.section = normalizedSection;
        existing.sectionName = normalizedSectionName || existing.sectionName;
        existing.sectionUrls = toSectionUrlArray([
          ...(existing.sectionUrls || []),
          ...normalizedSectionUrls,
        ]);
        existing.postList = replacePostList
          ? normalizedPostList
          : mergePostLists(existing.postList || [], normalizedPostList);
        existing.totalPosts = existing.postList.length;
        existing.lastSyncedAt = new Date();

        Object.assign(existing, safeExtra);
        await existing.save();

        const duplicateIds = existingDocs
          .filter((doc) => String(doc?._id || "") !== String(existing?._id || ""))
          .map((doc) => doc._id);

        if (duplicateIds.length > 0) {
          await GovJobList.deleteMany({ _id: { $in: duplicateIds } });
        }

        return { created: false, sectionData: toResponseShape(existing) };
      }

      const created = await GovJobList.create({
        ...safeExtra,
        section: normalizedSection,
        sectionName: normalizedSectionName || normalizedSection,
        sectionUrls: normalizedSectionUrls,
        postList: normalizedPostList,
      });

      return { created: true, sectionData: toResponseShape(created) };
    } catch (error) {
      lastError = error;
      if (!isRetryableWriteError(error) || attempt === 2) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Failed to upsert job list section");
};

export const syncGovJobListApplyLastDates = async ({ updates = [] } = {}) => {
  const updateMap = new Map();

  for (const item of updates || []) {
    if (!item || typeof item !== "object") continue;

    const applyLastDate = toApplyLastDate(item.applyLastDate);
    if (!applyLastDate) continue;

    let jobUrlHash = String(item.jobUrlHash || "").trim();
    if (!jobUrlHash) {
      try {
        jobUrlHash = createJobUrlHash(item.jobUrl || "");
      } catch {
        jobUrlHash = "";
      }
    }

    if (!jobUrlHash) continue;
    updateMap.set(jobUrlHash, applyLastDate);
  }

  const hashes = [...updateMap.keys()];
  if (hashes.length === 0) {
    return {
      matchedSections: 0,
      updatedSections: 0,
      updatedPosts: 0,
    };
  }

  const docIds = await GovJobList.find({
    "postList.jobUrlHash": { $in: hashes },
  }).distinct("_id");

  let updatedSections = 0;
  let updatedPosts = 0;

  for (const docId of docIds) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const currentDoc = await GovJobList.findById(docId).lean();
      if (!currentDoc) break;

      let docUpdatedPosts = 0;
      const updatedPostList = (currentDoc.postList || []).map((post) => {
        const applyLastDate = updateMap.get(String(post?.jobUrlHash || "").trim());
        if (!applyLastDate) {
          return post;
        }

        if (toApplyLastDate(post?.applyLastDate) === applyLastDate) {
          return post;
        }

        docUpdatedPosts += 1;
        return {
          ...post,
          applyLastDate,
        };
      });

      if (docUpdatedPosts === 0) {
        break;
      }

      const normalizedPostList = normalizePostList(
        updatedPostList,
        currentDoc?.sectionUrls?.[0] || ""
      );

      const updateResult = await GovJobList.updateOne(
        { _id: currentDoc._id, __v: currentDoc.__v },
        {
          $set: {
            postList: normalizedPostList,
            totalPosts: normalizedPostList.length,
            lastSyncedAt: new Date(),
          },
          $inc: { __v: 1 },
        }
      );

      if (updateResult.modifiedCount > 0) {
        updatedSections += 1;
        updatedPosts += docUpdatedPosts;
        break;
      }

      if (attempt === 2) {
        throw new Error(`Failed to sync applyLastDate for gov_job_lists doc ${docId}`);
      }
    }
  }

  return {
    matchedSections: docIds.length,
    updatedSections,
    updatedPosts,
  };
};

export const normalizeGovJobListDocuments = async ({ section = "" } = {}) => {
  const query = {};
  const normalizedSection = toCanonicalSectionKey(section);
  if (normalizedSection) {
    query.section = { $in: getSectionLookupKeys(normalizedSection) };
  }

  const docIds = await GovJobList.find(query).distinct("_id");
  let normalizedSections = 0;

  for (const docId of docIds) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const currentDoc = await GovJobList.findById(docId).lean();
      if (!currentDoc) break;

      const normalizedPostList = normalizePostList(
        currentDoc.postList || [],
        currentDoc?.sectionUrls?.[0] || ""
      );

      const updateResult = await GovJobList.updateOne(
        { _id: currentDoc._id, __v: currentDoc.__v },
        {
          $set: {
            postList: normalizedPostList,
            totalPosts: normalizedPostList.length,
            lastSyncedAt: new Date(),
          },
          $inc: { __v: 1 },
        }
      );

      if (updateResult.modifiedCount > 0) {
        normalizedSections += 1;
        break;
      }

      if (updateResult.matchedCount === 0 && attempt < 2) {
        continue;
      }

      if (updateResult.matchedCount > 0) {
        break;
      }

      if (attempt === 2) {
        throw new Error(`Failed to normalize gov_job_lists doc ${docId}`);
      }
    }
  }

  return {
    matchedSections: docIds.length,
    normalizedSections,
  };
};

export const getGovJobListBySection = async (section = "") => {
  const normalizedSection = toCanonicalSectionKey(section);
  if (!normalizedSection) return null;

  const docs = await GovJobList.find({
    section: { $in: getSectionLookupKeys(normalizedSection) },
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  const doc = pickPrimarySectionDoc(docs, normalizedSection);
  if (!doc) return null;

  if (normalizeSectionKey(doc.section || "") !== normalizedSection) {
    return toResponseShape({
      ...doc,
      section: normalizedSection,
    });
  }

  return toResponseShape(doc);
};

export const getGovJobListBySectionWithApplyLastDates = async ({
  section = "",
  persistApplyLastDates = false,
} = {}) => {
  const normalizedSection = toCanonicalSectionKey(section);
  if (!normalizedSection) return null;

  const docs = await GovJobList.find({
    section: { $in: getSectionLookupKeys(normalizedSection) },
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  const doc = pickPrimarySectionDoc(docs, normalizedSection);
  if (!doc) return null;

  const hydratedDocs = await hydrateGovJobListDocsWithApplyLastDates({
    docs: [
      normalizeSectionKey(doc.section || "") === normalizedSection
        ? doc
        : {
            ...doc,
            section: normalizedSection,
          },
    ],
    persistApplyLastDates,
  });

  return hydratedDocs[0] || null;
};

export const listGovJobListSections = async () => {
  const docs = await GovJobList.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  return selectCanonicalSectionDocs(docs).map(toResponseShape);
};

export const listGovJobListSectionsWithApplyLastDates = async ({
  persistApplyLastDates = false,
} = {}) => {
  const docs = await GovJobList.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return hydrateGovJobListDocsWithApplyLastDates({
    docs: selectCanonicalSectionDocs(docs),
    persistApplyLastDates,
  });
};

export const govJobListModel = {
  model: GovJobList,
  upsertSection: upsertGovJobListSection,
  normalizeDocuments: normalizeGovJobListDocuments,
  syncApplyLastDates: syncGovJobListApplyLastDates,
  getBySection: getGovJobListBySection,
  getBySectionWithApplyLastDates: getGovJobListBySectionWithApplyLastDates,
  list: listGovJobListSections,
  listWithApplyLastDates: listGovJobListSectionsWithApplyLastDates,
  createJobUrlHash,
};

export { GovJobList, govJobListSchema };

export default govJobListModel;
