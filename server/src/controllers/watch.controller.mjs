import mongoose from "mongoose";
import UserWatch from "../models/userWatch.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import MegaPost from "../models/megaPost.model.mjs";
import { processMegaPostToRecruitment } from "../services/recruitmentLinker.service.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

function ensureObjectId(id, name) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    const err = new Error(`Valid ${name} is required`);
    err.statusCode = 400;
    throw err;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makeHttpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function resolveWatchTarget({
  postId = "",
  postDetailId = "",
  megaPostId = "",
  canonicalKey = "",
  megaSlug = "",
}) {
  const canonical = String(canonicalKey || "").trim();
  const slug = String(megaSlug || "").trim();
  let detail = null;
  let megaPost = null;

  const normalizedPostId = String(postId || "").trim();
  const normalizedPostDetailId = String(postDetailId || "").trim();
  const normalizedMegaPostId = String(megaPostId || "").trim();

  if (
    !normalizedPostId &&
    !normalizedPostDetailId &&
    !normalizedMegaPostId &&
    !canonical
  ) {
    throw makeHttpError(
      "Provide one of postId, postDetailId, megaPostId, or canonicalKey",
      400,
    );
  }

  if (normalizedPostDetailId) {
    ensureObjectId(normalizedPostDetailId, "postDetailId");
    detail = await PostDetail.findById(normalizedPostDetailId)
      .select("_id megaPostId")
      .lean();
    if (!detail?.megaPostId) {
      throw makeHttpError("PostDetail not found for provided postDetailId", 404);
    }
  } else if (normalizedPostId) {
    ensureObjectId(normalizedPostId, "postId");

    // Backward compatible:
    // - If postId is PostDetail._id, use it directly.
    // - Else treat postId as MegaPost._id.
    detail = await PostDetail.findById(normalizedPostId)
      .select("_id megaPostId")
      .lean();
    if (!detail?.megaPostId) {
      megaPost = await MegaPost.findById(normalizedPostId).select("_id").lean();
      if (!megaPost?._id) {
        throw makeHttpError("No PostDetail or MegaPost found for provided postId", 404);
      }
    }
  } else if (normalizedMegaPostId) {
    ensureObjectId(normalizedMegaPostId, "megaPostId");
    megaPost = await MegaPost.findById(normalizedMegaPostId).select("_id").lean();
    if (!megaPost?._id) {
      throw makeHttpError("MegaPost not found for provided megaPostId", 404);
    }
  } else if (canonical) {
    const match = { canonicalKey: canonical };
    if (slug) match.megaSlug = slug;
    megaPost = await MegaPost.findOne(match).sort({ updatedAt: -1 }).select("_id").lean();
    if (!megaPost?._id) {
      throw makeHttpError("MegaPost not found for provided canonicalKey", 404);
    }
  }

  const resolvedMegaPostId = detail?.megaPostId
    ? String(detail.megaPostId)
    : String(megaPost?._id || "");
  if (!resolvedMegaPostId) {
    throw makeHttpError("Unable to resolve target MegaPost", 404);
  }

  return {
    postDetailId: detail?._id ? String(detail._id) : "",
    megaPostId: resolvedMegaPostId,
  };
}

export const createOrUpdateWatch = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const postId = String(req.body?.postId || "").trim();
    const postDetailId = String(req.body?.postDetailId || "").trim();
    const megaPostId = String(req.body?.megaPostId || "").trim();
    const canonicalKey = String(req.body?.canonicalKey || "").trim();
    const megaSlug = String(req.body?.megaSlug || "").trim();
    const enabled = req.body?.enabled !== false;
    const priority = Number.isFinite(Number(req.body?.priority))
      ? Number(req.body.priority)
      : 10;
    const channels = {
      email: req.body?.channels?.email !== false,
      whatsapp: req.body?.channels?.whatsapp === true,
    };

    if (!isValidEmail(email)) {
      const err = new Error("Valid email is required");
      err.statusCode = 400;
      throw err;
    }
    const target = await resolveWatchTarget({
      postId,
      postDetailId,
      megaPostId,
      canonicalKey,
      megaSlug,
    });

    const processed = await processMegaPostToRecruitment(target.megaPostId);
    void clearFrontApiCacheBestEffort({ reason: "watch-create-or-update" });

    const watch = await UserWatch.findOneAndUpdate(
      {
        email,
        recruitmentId: new mongoose.Types.ObjectId(processed.recruitmentId),
      },
      {
        $set: {
          enabled,
          priority,
          channels,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    ).lean();

    return res.json({
      success: true,
      message: "Watch saved",
      postDetailId: target.postDetailId,
      megaPostId: target.megaPostId,
      recruitmentId: processed.recruitmentId,
      recruitmentKey: processed.recruitmentKey,
      watchId: String(watch?._id || ""),
      enabled: watch?.enabled === true,
      priority: watch?.priority ?? priority,
      channels: watch?.channels || channels,
    });
  } catch (err) {
    next(err);
  }
};
