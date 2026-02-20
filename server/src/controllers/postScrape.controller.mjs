import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { buildContentHashes } from "../utils/contentHash.mjs";
import { buildCompactAiInput } from "../utils/aiInputFormatter.mjs";
import {
  buildPageHashFromSnapshot,
  buildPostSnapshotFromRaw,
} from "../utils/postSnapshot.mjs";
import { sendPostUpdateNotification } from "../services/email.service.mjs";
import { runPostUpdateBatch, updateSinglePostById } from "../services/postUpdate.service.mjs";
import {
  buildPreparedHtmlChanges,
  buildReadyPostHtml,
  diffPreparedHtml,
} from "../utils/postHtmlTransform.mjs";
import { refinePreparedHtmlWithGemini } from "../services/geminiHtmlRefine.service.mjs";
import { extractRecruitmentJsonFromContentHtml } from "../services/geminiExtract.service.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function ensureRecruitmentPayload(payload, { title = "", sourceUrl = "" } = {}) {
  const root = isPlainObject(payload) ? { ...payload } : {};
  const recruitment = isPlainObject(root.recruitment) ? { ...root.recruitment } : {};

  recruitment.title = String(recruitment.title || title || "").trim();
  recruitment.sourceUrl = String(recruitment.sourceUrl || sourceUrl || "").trim();

  if (!isPlainObject(recruitment.organization)) recruitment.organization = {};
  if (!isPlainObject(recruitment.importantDates)) recruitment.importantDates = {};
  if (!isPlainObject(recruitment.vacancyDetails)) recruitment.vacancyDetails = {};
  if (!isPlainObject(recruitment.applicationFee)) recruitment.applicationFee = {};
  if (!isPlainObject(recruitment.ageLimit)) recruitment.ageLimit = {};
  if (!isPlainObject(recruitment.eligibility)) recruitment.eligibility = {};
  if (!isPlainObject(recruitment.physicalStandards)) recruitment.physicalStandards = {};
  if (!isPlainObject(recruitment.physicalEfficiencyTest)) recruitment.physicalEfficiencyTest = {};
  if (!Array.isArray(recruitment.selectionProcess)) recruitment.selectionProcess = [];
  if (!isPlainObject(recruitment.importantLinks)) recruitment.importantLinks = {};
  if (!isPlainObject(recruitment.importantLinks.other)) recruitment.importantLinks.other = {};
  if (!Array.isArray(recruitment.documentation)) recruitment.documentation = [];
  if (!isPlainObject(recruitment.content)) recruitment.content = {};
  if (!isPlainObject(recruitment.extraFields)) recruitment.extraFields = {};
  if (!isPlainObject(recruitment.extraFields.unmappedKeyValues)) {
    recruitment.extraFields.unmappedKeyValues = {};
  }
  if (!Array.isArray(recruitment.extraFields.links)) recruitment.extraFields.links = [];
  if (!Array.isArray(recruitment.extraFields.keyValues)) recruitment.extraFields.keyValues = [];

  root.recruitment = recruitment;
  return root;
}

async function findPostAndDetailByAggregation({ postId = "", canonicalKey = "", megaSlug = "" }) {
  const match = {};

  if (isValidObjectId(postId)) {
    match._id = new mongoose.Types.ObjectId(postId);
  } else if (canonicalKey) {
    match.canonicalKey = canonicalKey;
    if (megaSlug) match.megaSlug = megaSlug;
  } else {
    return null;
  }

  const pipeline = [
    { $match: match },
    { $sort: { updatedAt: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: "postdetails",
        localField: "_id",
        foreignField: "megaPostId",
        as: "postDetail",
      },
    },
    {
      $set: {
        postDetail: { $first: "$postDetail" },
      },
    },
  ];

  const rows = await MegaPost.aggregate(pipeline);
  return rows?.[0] || null;
}

export const checkPostDetail = async (req, res, next) => {
  try {
    const postId = String(req.body?.postId || req.body?.megaPostId || req.query?.postId || req.query?.megaPostId || "").trim();
    const canonicalKey = String(req.body?.canonicalKey || req.query?.canonicalKey || "").trim();
    const megaSlug = String(req.body?.megaSlug || req.query?.megaSlug || "").trim();

    if (!isValidObjectId(postId) && !canonicalKey) {
      return res.status(400).json({
        success: false,
        message: "Either valid 'postId' or 'canonicalKey' is required",
      });
    }

    const row = await findPostAndDetailByAggregation({ postId, canonicalKey, megaSlug });
    if (!row) {
      return res.status(404).json({ success: false, message: "MegaPost not found" });
    }

    const postDetailId = row.postDetail?._id ? String(row.postDetail._id) : "";
    return res.json({
      success: true,
      exists: !!postDetailId,
      message: postDetailId ? "PostDetail exists" : "PostDetail not found",
      data: {
        postId: String(row._id),
        postDetailId,
        canonicalKey: String(row.canonicalKey || ""),
        megaSlug: String(row.megaSlug || ""),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const patchPostDetail = async (req, res, next) => {
  try {
    const postId = String(req.body?.postId || req.body?.megaPostId || "").trim();
    const updates = req.body?.updates;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Valid 'postId' or 'megaPostId' is required",
      });
    }

    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "'updates' object is required",
      });
    }

    const entries = Object.entries(updates);
    if (!entries.length) {
      return res.status(400).json({
        success: false,
        message: "'updates' cannot be empty",
      });
    }

    const setPayload = {};
    const updatedPaths = [];
    for (const [path, value] of entries) {
      const key = String(path || "").trim();
      if (!key) continue;
      if (key.includes("$") || key.includes("__proto__")) {
        return res.status(400).json({
          success: false,
          message: `Invalid update path: ${key}`,
        });
      }
      setPayload[`formattedData.${key}`] = value;
      if (key === "recruitment" || key.startsWith("recruitment.")) {
        setPayload[key] = value;
      }
      updatedPaths.push(key);
    }

    if (!updatedPaths.length) {
      return res.status(400).json({
        success: false,
        message: "No valid update paths provided",
      });
    }

    const updated = await PostDetail.findOneAndUpdate(
      { megaPostId: new mongoose.Types.ObjectId(postId) },
      {
        $set: {
          ...setPayload,
          lastScrapedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    ).select("_id megaPostId");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "PostDetail not found for provided MegaPost",
      });
    }

    void clearFrontApiCacheBestEffort({ reason: "post-detail-patch" });

    return res.json({
      success: true,
      message: "PostDetail fields updated",
      data: {
        postDetailId: String(updated._id),
        megaPostId: String(updated.megaPostId),
        updatedPaths,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchPostDetailsByLinks = async (req, res, next) => {
  try {
    const q = String(req.query?.q || req.body?.q || "").trim();
    const officialWebsite = String(
      req.query?.officialWebsite || req.body?.officialWebsite || "",
    ).trim();
    const officialNotification = String(
      req.query?.officialNotification || req.body?.officialNotification || "",
    ).trim();
    const pageNum = Math.max(1, Number(req.query?.page || req.body?.page || 1));
    const lim = Math.min(200, Math.max(1, Number(req.query?.limit || req.body?.limit || 20)));
    const skip = (pageNum - 1) * lim;

    const andConditions = [];
    const pushTokenConditions = (rawValue) => {
      const tokens = String(rawValue || "")
        .split(/\s+/)
        .map((x) => x.trim())
        .filter(Boolean);

      for (const token of tokens) {
        const rx = new RegExp(escapeRegex(token), "i");
        andConditions.push({
          $or: [
            { "formattedData.recruitment.importantLinks.officialWebsite": { $regex: rx } },
            { "formattedData.recruitment.importantLinks.officialNotification": { $regex: rx } },
            { "recruitment.importantLinks.officialWebsite": { $regex: rx } },
            { "recruitment.importantLinks.officialNotification": { $regex: rx } },
          ],
        });
      }
    };

    if (q) pushTokenConditions(q);
    if (officialWebsite) {
      const rx = new RegExp(escapeRegex(officialWebsite), "i");
      andConditions.push({
        $or: [
          { "formattedData.recruitment.importantLinks.officialWebsite": { $regex: rx } },
          { "recruitment.importantLinks.officialWebsite": { $regex: rx } },
        ],
      });
    }
    if (officialNotification) {
      const rx = new RegExp(escapeRegex(officialNotification), "i");
      andConditions.push({
        $or: [
          { "formattedData.recruitment.importantLinks.officialNotification": { $regex: rx } },
          { "recruitment.importantLinks.officialNotification": { $regex: rx } },
        ],
      });
    }

    if (!andConditions.length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one of 'q', 'officialWebsite', or 'officialNotification'",
      });
    }

    const match = { $and: andConditions };
    const [rows, total] = await Promise.all([
      PostDetail.find(match)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      PostDetail.countDocuments(match),
    ]);

    return res.json({
      success: true,
      count: rows.length,
      pagination: {
        total,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(total / lim),
      },
      data: rows.map((r) => {
        const officialWebsite =
          r?.formattedData?.recruitment?.importantLinks?.officialWebsite ||
          r?.recruitment?.importantLinks?.officialWebsite ||
          "";
        const officialNotification =
          r?.formattedData?.recruitment?.importantLinks?.officialNotification ||
          r?.recruitment?.importantLinks?.officialNotification ||
          "";
        const applyOnline =
          r?.formattedData?.recruitment?.importantLinks?.applyOnline ||
          r?.recruitment?.importantLinks?.applyOnline ||
          "";

        return {
          ...r,
          postDetailId: String(r._id),
          megaPostId: String(r.megaPostId || ""),
          officialWebsite,
          officialNotification,
          applyOnline,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

export const scrapePost = async (req, res, next) => {
  try {
    const postId = String(req.body?.postId || req.body?.megaPostId || "").trim();
    const canonicalKey = String(req.body?.canonicalKey || "").trim();
    const megaSlug = String(req.body?.megaSlug || "").trim();

    if (!isValidObjectId(postId) && !canonicalKey) {
      return res.status(400).json({
        success: false,
        message: "Either valid 'postId' or 'canonicalKey' is required",
      });
    }

    const row = await findPostAndDetailByAggregation({ postId, canonicalKey, megaSlug });
    if (!row) {
      return res.status(404).json({ success: false, message: "MegaPost not found" });
    }

    // Cache hit: return directly without AI call.
    if (row.postDetail?.formattedData && typeof row.postDetail.formattedData === "object") {
      return res.json({
        success: true,
        cached: true,
        message: "PostDetail already exists. Returned cached formatted data without AI call.",
        data: row.postDetail.formattedData,
        meta: {
          postId: String(row._id),
          postDetailId: String(row.postDetail._id),
          canonicalKey: row.canonicalKey || "",
          megaSlug: row.megaSlug || "",
          sourceUrl: row.originalUrl || "",
        },
      });
    }

    const post = await MegaPost.findById(row._id);
    if (!post) {
      return res.status(404).json({ success: false, message: "MegaPost not found" });
    }

    const contentHtml = String(post.contentHtml || "").trim();
    if (!contentHtml) {
      return res.status(400).json({
        success: false,
        message: "contentHtml is missing in db.megaposts for this post",
      });
    }

    const compactInput = buildCompactAiInput({
      title: post.title,
      sourceUrl: post.originalUrl,
      contentHtml: post.contentHtml || "",
      fallbackText: post.contentText || "",
    });

    const { data, modelName } = await extractRecruitmentJsonFromContentHtml({
      contentHtml: compactInput,
      sourceUrl: post.originalUrl || "",
      // optional: postTitle: post.title
    });

    const normalizedData = ensureRecruitmentPayload(data, {
      title: post.title,
      sourceUrl: post.originalUrl || "",
    });

    // Build snapshot for hash (from existing content)
    const snapshot = buildPostSnapshotFromRaw({
      title: post.title,
      metaDesc: post.metaDesc || "",
      sourceUrl: post.originalUrl || "",
      siteHost: post.siteHost || "",
      contentText: post.contentText || "",
      contentHtml: post.contentHtml || "",
      applyLinks: post.applyLinks || [],
      importantLinks: post.importantLinks || [],
      dates: post.dates || {},
    });

    const hashInfo = buildPageHashFromSnapshot(snapshot);
    const contentHashes = buildContentHashes({ contentHtml: post.contentHtml || "" });

    // Save
    post.aiData = normalizedData;
    post.updateSnapshot = {
      ...snapshot,
      _hash: {
        htmlStableHash: contentHashes.htmlStableHash,
        textHash: contentHashes.textHash,
      },
    };
    post.pageHash = hashInfo.pageHash;
    post.aiScraped = true;
    post.aiModel = String(modelName || "").trim();
    post.aiScrapedAt = new Date();

    await post.save();

    const postDetail = await PostDetail.findOneAndUpdate(
      { megaPostId: post._id },
      {
        $set: {
          megaPostId: post._id,
          postTitle: post.title || "",
          sourceUrl: post.originalUrl || "",
          pageHash: hashInfo.pageHash,
          htmlStableHash: contentHashes.htmlStableHash,
          textHash: contentHashes.textHash,
          modelUsed: post.aiModel,
          lastScrapedAt: new Date(),
          formattedData: normalizedData,
          updateSnapshot: post.updateSnapshot,
          recruitment: normalizedData?.recruitment || normalizedData,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    void clearFrontApiCacheBestEffort({ reason: "post-scrape" });

    return res.json({
      success: true,
      cached: false,
      message: "Recruitment data extracted with Gemini and saved to db.megaposts",
      data: normalizedData,
      meta: {
        postId: String(post._id),
        postDetailId: String(postDetail?._id || ""),
        model: post.aiModel,
        pageHash: hashInfo.pageHash,
        comparableFields: hashInfo.comparableCount,
        htmlStableHash: contentHashes.htmlStableHash,
        textHash: contentHashes.textHash,
      },
    });
  } catch (err) {
    next(err);
  }
};


export const postUpdate = async (req, res, next) => {
  try {
    const postId = String(req.body?.postId || req.body?.megaPostId || "").trim();
    const force =
      req.body?.force === true ||
      String(req.query?.force || "").trim().toLowerCase() === "true";

    const matchThreshold = Number(req.body?.matchThreshold);
    const maxCandidates = Number(req.body?.maxCandidates);

    const options = {
      force,
      ...(Number.isFinite(matchThreshold) ? { matchThreshold } : {}),
      ...(Number.isFinite(maxCandidates) ? { maxCandidates } : {}),
      ...(req.body?.sourceSectionUrl
        ? { sourceSectionUrl: String(req.body.sourceSectionUrl).trim() }
        : {}),
      ...(req.body?.siteBaseUrl ? { siteBaseUrl: String(req.body.siteBaseUrl).trim() } : {}),
    };

    // Single
    if (postId) {
      if (!isValidObjectId(postId)) {
        return res.status(400).json({ success: false, message: "Valid 'postId' is required" });
      }

      const result = await updateSinglePostById(postId, options);
      void clearFrontApiCacheBestEffort({ reason: "post-update-single" });
      return res.json({ success: true, mode: "single", ...result });
    }

    // Batch
    const limit = Math.max(1, Math.min(200, Number(req.body?.limit || 20)));
    const batch = await runPostUpdateBatch({ ...options, limit });
    void clearFrontApiCacheBestEffort({ reason: "post-update-batch" });

    return res.json({ success: true, mode: "batch", ...batch });
  } catch (err) {
    next(err);
  }
};

export const trackPostChanges = postUpdate;
