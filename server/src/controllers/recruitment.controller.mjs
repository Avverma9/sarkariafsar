import mongoose from "mongoose";
import { processMegaPostToRecruitment } from "../services/recruitmentLinker.service.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

function ensureObjectId(id, name) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    const err = new Error(`Valid ${name} is required`);
    err.statusCode = 400;
    throw err;
  }
}

export const processRecruitmentPost = async (req, res, next) => {
  try {
    const postId = String(req.body?.postId || "").trim();
    ensureObjectId(postId, "postId");

    const data = await processMegaPostToRecruitment(postId);
    void clearFrontApiCacheBestEffort({ reason: "recruitment-process-post" });
    return res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};
