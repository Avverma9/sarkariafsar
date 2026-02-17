import mongoose from "mongoose";
import UserWatch from "../models/userWatch.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { processMegaPostToRecruitment } from "../services/recruitmentLinker.service.mjs";

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

export const createOrUpdateWatch = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const postId = String(req.body?.postId || "").trim();
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
    ensureObjectId(postId, "postId");

    // `postId` here is PostDetail._id
    const detail = await PostDetail.findById(postId).select("_id megaPostId").lean();
    if (!detail?.megaPostId) {
      const err = new Error("PostDetail not found for provided postId");
      err.statusCode = 404;
      throw err;
    }

    const processed = await processMegaPostToRecruitment(detail.megaPostId);

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
      postDetailId: String(detail._id),
      megaPostId: String(detail.megaPostId),
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
