import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { extractRecruitmentJsonFromContentHtml } from "../services/geminiExtract.service.mjs";
import { buildPageHashFromSnapshot, buildPostSnapshotFromRaw } from "../utils/postSnapshot.mjs";
import { buildContentHashes } from "../utils/contentHash.mjs";
import { buildCompactAiInput } from "../utils/aiInputFormatter.mjs";
import { runPostUpdateBatch, updateSinglePostById } from "../services/postUpdate.service.mjs";

function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function ensureRecruitmentPayload(data) {
  if (!data || typeof data !== "object") return { ok: false, reason: "Gemini returned empty/non-object data" };
  if (!data.recruitment || typeof data.recruitment !== "object")
    return { ok: false, reason: "Missing 'recruitment' root object in extracted JSON" };
  return { ok: true };
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

    const validation = ensureRecruitmentPayload(data);
    if (!validation.ok) {
      return res.status(422).json({
        success: false,
        message: validation.reason,
        model: modelName || "",
      });
    }

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
    post.aiData = data;
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
          formattedData: data,
          updateSnapshot: post.updateSnapshot,
          recruitment: data?.recruitment || data,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      success: true,
      cached: false,
      message: "Recruitment data extracted with Gemini and saved to db.megaposts",
      data,
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
      return res.json({ success: true, mode: "single", ...result });
    }

    // Batch
    const limit = Math.max(1, Math.min(200, Number(req.body?.limit || 20)));
    const batch = await runPostUpdateBatch({ ...options, limit });

    return res.json({ success: true, mode: "batch", ...batch });
  } catch (err) {
    next(err);
  }
};

export const trackPostChanges = postUpdate;
