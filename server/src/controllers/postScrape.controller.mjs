import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { buildContentHashes } from "../utils/contentHash.mjs";
import { sendPostUpdateNotification } from "../services/email.service.mjs";
import { runPostUpdateBatch, updateSinglePostById } from "../services/postUpdate.service.mjs";
import {
  buildPreparedHtmlChanges,
  buildReadyPostHtml,
  diffPreparedHtml,
} from "../utils/postHtmlTransform.mjs";
import { refinePreparedHtmlWithGemini } from "../services/geminiHtmlRefine.service.mjs";

function isValidObjectId(id) {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    const previousHtml = String(post.newHtml || row.postDetail?.newHtml || "").trim();
    const prepared = buildReadyPostHtml({
      title: post.title,
      sourceUrl: post.originalUrl || "",
      contentHtml: post.contentHtml || "",
    });
    const localHtml = String(prepared.newHtml || "").trim();
    if (!localHtml) {
      return res.status(422).json({
        success: false,
        message: "Unable to build ready HTML from post content",
      });
    }
    const aiRefine = await refinePreparedHtmlWithGemini({
      html: localHtml,
      title: post.title,
      sourceUrl: post.originalUrl || "",
    });
    const newHtml = String(aiRefine.html || localHtml).trim();

    const newHashes = buildContentHashes({ contentHtml: newHtml });
    const hasPrevious = Boolean(previousHtml);
    const oldHashes = previousHtml
      ? buildContentHashes({ contentHtml: previousHtml })
      : { htmlStableHash: "", textHash: "" };
    const htmlChanged = !hasPrevious || oldHashes.htmlStableHash !== newHashes.htmlStableHash;
    const textChanged = !hasPrevious || oldHashes.textHash !== newHashes.textHash;

    const diff = diffPreparedHtml(previousHtml, newHtml, { limit: 20 });
    const changeEntries = buildPreparedHtmlChanges(diff, 10);
    const now = new Date();

    post.newHtml = newHtml;
    post.pageHash = newHashes.htmlStableHash;
    post.lastPostFingerprintHash = newHashes.htmlStableHash;
    post.lastPostUpdateCheckAt = now;
    post.updateSnapshot = {
      ...(post.updateSnapshot && typeof post.updateSnapshot === "object" ? post.updateSnapshot : {}),
      title: String(post.title || ""),
      sourceUrl: String(post.originalUrl || ""),
      _hash: {
        htmlStableHash: newHashes.htmlStableHash,
        textHash: newHashes.textHash,
      },
    };

    await post.save();

    const postDetail = await PostDetail.findOneAndUpdate(
      { megaPostId: post._id },
      {
        $set: {
          megaPostId: post._id,
          postTitle: post.title || "",
          sourceUrl: post.originalUrl || "",
          pageHash: newHashes.htmlStableHash,
          htmlStableHash: newHashes.htmlStableHash,
          textHash: newHashes.textHash,
          modelUsed: aiRefine?.meta?.usedGemini
            ? "html-transform-v1+gemini-refine"
            : "html-transform-v1",
          lastScrapedAt: now,
          newHtml,
          htmlDiff: diff,
          linkTransformReport: prepared.report,
          geminiRefineMeta: aiRefine?.meta || null,
          updateSnapshot: post.updateSnapshot,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    let notify = { sent: false, reason: "not-updated" };
    if (hasPrevious && (htmlChanged || textChanged) && changeEntries.length) {
      try {
        notify = await sendPostUpdateNotification({
          postId: String(post._id),
          title: String(post.title || ""),
          oldUrl: String(post.originalUrl || ""),
          newUrl: String(post.originalUrl || ""),
          pageHashOld: oldHashes.htmlStableHash,
          pageHashNew: newHashes.htmlStableHash,
          score: 1,
          changes: changeEntries,
        });
      } catch (err) {
        notify = { sent: false, reason: err.message || "notify-failed" };
      }
    }

    return res.json({
      success: true,
      message: "Ready-to-use branded HTML generated and saved",
      changed: {
        htmlChanged,
        textChanged,
        addedValues: diff.addedCount,
        removedValues: diff.removedCount,
      },
      hashes: {
        pageHash: newHashes.htmlStableHash,
        htmlStableHash: newHashes.htmlStableHash,
        textHash: newHashes.textHash,
      },
      report: prepared.report,
      aiRefine: aiRefine?.meta || { enabled: false, usedGemini: false },
      notify,
      meta: {
        postId: String(post._id),
        postDetailId: String(postDetail?._id || ""),
        canonicalKey: String(post.canonicalKey || ""),
        megaSlug: String(post.megaSlug || ""),
        sourceUrl: String(post.originalUrl || ""),
      },
      newHtml,
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
    const perPostDelayMsRaw = req.body?.perPostDelayMs ?? req.body?.postDelayMs ?? req.query?.perPostDelayMs ?? req.query?.postDelayMs;
    const perPostDelayMs =
      perPostDelayMsRaw === undefined ? undefined : Math.max(0, Number(perPostDelayMsRaw) || 0);
    const allWithPostDetail =
      req.body?.allWithPostDetail === true ||
      String(req.query?.allWithPostDetail || "").trim().toLowerCase() === "true";

    const options = {
      force,
      ...(Number.isFinite(matchThreshold) ? { matchThreshold } : {}),
      ...(Number.isFinite(maxCandidates) ? { maxCandidates } : {}),
      ...(perPostDelayMs !== undefined ? { perPostDelayMs } : {}),
      ...(allWithPostDetail ? { allWithPostDetail: true } : {}),
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
