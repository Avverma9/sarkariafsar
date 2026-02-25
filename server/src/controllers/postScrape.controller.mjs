import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { runPostUpdateBatch, updateSinglePostById } from "../services/postUpdate.service.mjs";
import { buildReadyPostHtml } from "../utils/postHtmlTransform.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPostDetailLegacyUnsetPayload() {
  return {
    contentHtml: "",
    newHtml: "",
    formattedData: "",
    recruitment: "",
    modelUsed: "",
    aiData: "",
    aiModel: "",
    aiScraped: "",
    aiScrapedAt: "",
    pageHash: "",
    htmlStableHash: "",
    textHash: "",
    updateSnapshot: "",
  };
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

async function upsertPostDetailMetaOnly({ megaPostId, postTitle = "", sourceUrl = "" }) {
  return PostDetail.findOneAndUpdate(
    { megaPostId },
    {
      $set: {
        megaPostId,
        postTitle: String(postTitle || "").trim(),
        sourceUrl: String(sourceUrl || "").trim(),
        lastScrapedAt: new Date(),
      },
      $unset: {
        ...getPostDetailLegacyUnsetPayload(),
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );
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

    const allowedUpdateKeys = new Set(["postTitle", "sourceUrl"]);
    const blockedAiOrHtmlKeys = new Set([
      "formattedData",
      "recruitment",
      "modelUsed",
      "contentHtml",
      "newHtml",
      "aiData",
      "aiModel",
      "aiScraped",
      "aiScrapedAt",
      "pageHash",
      "htmlStableHash",
      "textHash",
      "updateSnapshot",
    ]);
    const setPayload = {};
    const updatedPaths = [];
    const rejectedPaths = [];
    for (const [path, value] of entries) {
      const key = String(path || "").trim();
      if (!key) continue;
      if (key.includes("$") || key.includes("__proto__")) {
        return res.status(400).json({
          success: false,
          message: `Invalid update path: ${key}`,
        });
      }
      const rootKey = key.split(".")[0];
      if (blockedAiOrHtmlKeys.has(rootKey)) {
        rejectedPaths.push(key);
        continue;
      }
      if (!allowedUpdateKeys.has(rootKey) || key.includes(".")) {
        rejectedPaths.push(key);
        continue;
      }
      if (rootKey === "postTitle") {
        setPayload.postTitle = String(value || "").trim();
      } else if (rootKey === "sourceUrl") {
        setPayload.sourceUrl = String(value || "").trim();
      }
      updatedPaths.push(key);
    }

    if (rejectedPaths.length && !updatedPaths.length) {
      return res.status(400).json({
        success: false,
        message:
          "PostDetail only allows 'postTitle' and 'sourceUrl'. HTML/AI/formatted fields are stored in MegaPost.",
        rejectedPaths,
      });
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
        rejectedPaths,
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

    const cachedContentHtml = String(row.contentHtml || "");
    const cachedNewHtml = String(row.newHtml || "");

    // Cache hit from MegaPost: return directly when transformed HTML is already available.
    if (cachedNewHtml.trim()) {
      let postDetailId = row.postDetail?._id ? String(row.postDetail._id) : "";
      if (!postDetailId || row.postDetail?.contentHtml || row.postDetail?.newHtml) {
        const detail = await upsertPostDetailMetaOnly({
          megaPostId: row._id,
          postTitle: row.title || "",
          sourceUrl: row.originalUrl || "",
        });
        postDetailId = String(detail?._id || "");
      }

      return res.json({
        success: true,
        cached: true,
        message: "Returned cached transformed HTML from MegaPost.",
        data: {
          contentHtml: cachedContentHtml,
          newHtml: cachedNewHtml,
        },
        meta: {
          postId: String(row._id),
          postDetailId,
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
    const incomingNewHtml = String(post.newHtml || "").trim();
    if (!contentHtml && !incomingNewHtml) {
      return res.status(400).json({
        success: false,
        message: "contentHtml/newHtml is missing in db.megaposts for this post",
      });
    }

    let formattedNewHtml = incomingNewHtml;
    if (contentHtml) {
      try {
        const transformed = buildReadyPostHtml({
          title: post.title || "",
          sourceUrl: post.originalUrl || "",
          contentHtml: post.contentHtml || "",
        });
        formattedNewHtml = String(
          transformed?.reactHtml || transformed?.newHtml || "",
        ).trim();
      } catch {
        formattedNewHtml = incomingNewHtml || contentHtml;
      }
    }

    // Keep MegaPost state non-AI for this endpoint.
    post.aiScraped = false;
    post.aiScrapedAt = null;
    post.aiModel = "";
    post.aiData = null;
    post.newHtml = String(formattedNewHtml || "");
    await post.save();

    const postDetail = await upsertPostDetailMetaOnly({
      megaPostId: post._id,
      postTitle: post.title || "",
      sourceUrl: post.originalUrl || "",
    });

    void clearFrontApiCacheBestEffort({ reason: "post-scrape" });

    return res.json({
      success: true,
      cached: false,
      message: "Transformed HTML saved in MegaPost and returned from MegaPost.",
      data: {
        contentHtml: String(post.contentHtml || ""),
        newHtml: String(formattedNewHtml || ""),
      },
      meta: {
        postId: String(post._id),
        postDetailId: String(postDetail?._id || ""),
        canonicalKey: row.canonicalKey || "",
        megaSlug: row.megaSlug || "",
        sourceUrl: post.originalUrl || "",
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
      ...(typeof req.body?.refreshRecruitment === "boolean"
        ? { refreshRecruitment: req.body.refreshRecruitment }
        : {}),
      ...(req.body?.forceRecruitmentRefresh === true
        ? { forceRecruitmentRefresh: true }
        : {}),
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
      await PostDetail.updateOne(
        { megaPostId: new mongoose.Types.ObjectId(postId) },
        {
          $unset: getPostDetailLegacyUnsetPayload(),
          $set: { lastScrapedAt: new Date() },
        },
      );
      void clearFrontApiCacheBestEffort({ reason: "post-update-single" });
      return res.json({ success: true, mode: "single", ...result });
    }

    // Batch
    const limit = Math.max(1, Math.min(200, Number(req.body?.limit || 20)));
    const batch = await runPostUpdateBatch({ ...options, limit });
    const batchMegaPostIds = Array.isArray(batch?.report)
      ? batch.report
          .map((x) => String(x?.postId || "").trim())
          .filter((x) => mongoose.Types.ObjectId.isValid(x))
          .map((x) => new mongoose.Types.ObjectId(x))
      : [];
    if (batchMegaPostIds.length) {
      await PostDetail.updateMany(
        { megaPostId: { $in: batchMegaPostIds } },
        {
          $unset: getPostDetailLegacyUnsetPayload(),
          $set: { lastScrapedAt: new Date() },
        },
      );
    }
    void clearFrontApiCacheBestEffort({ reason: "post-update-batch" });

    return res.json({ success: true, mode: "batch", ...batch });
  } catch (err) {
    next(err);
  }
};

export const trackPostChanges = postUpdate;
