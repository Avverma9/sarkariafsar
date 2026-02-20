import MegaPost from "../models/megaPost.model.mjs";
import UserWatch from "../models/userWatch.model.mjs";
import { processMegaPostToRecruitment } from "../services/recruitmentLinker.service.mjs";
import { clearFrontApiCacheBestEffort } from "../services/frontCache.service.mjs";

export const processNewPostsCron = async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.body?.limit || 20)));

    const posts = await MegaPost.find({
      aiScraped: false,
      contentHtml: { $exists: true, $ne: "" },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select("_id");

    const report = [];
    let processed = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        const result = await processMegaPostToRecruitment(post._id);
        report.push({ postId: String(post._id), success: true, ...result });
        processed++;
      } catch (err) {
        failed++;
        report.push({
          postId: String(post._id),
          success: false,
          error: err.message,
        });
      }
    }

    if (processed > 0) {
      void clearFrontApiCacheBestEffort({ reason: "cron-process-new-posts" });
    }

    return res.json({
      success: true,
      scanned: posts.length,
      processed,
      failed,
      report,
    });
  } catch (err) {
    next(err);
  }
};

export const watchSweepCron = async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(200, Number(req.body?.limit || 50)));

    const watchedRecruitments = await UserWatch.distinct("recruitmentId", { enabled: true });
    if (!watchedRecruitments.length) {
      return res.json({
        success: true,
        scanned: 0,
        processed: 0,
        failed: 0,
        report: [],
      });
    }

    const watchedPosts = await MegaPost.find({
      recruitmentId: { $in: watchedRecruitments },
      sourceSectionUrl: { $exists: true, $ne: "" },
    })
      .select("sourceSectionUrl")
      .lean();
    const watchedSectionUrls = [...new Set(watchedPosts.map((p) => String(p.sourceSectionUrl || "").trim()).filter(Boolean))];

    const posts = await MegaPost.find({
      aiScraped: false,
      contentHtml: { $exists: true, $ne: "" },
      $or: [
        { recruitmentId: { $in: watchedRecruitments } },
        ...(watchedSectionUrls.length ? [{ sourceSectionUrl: { $in: watchedSectionUrls } }] : []),
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select("_id");

    const report = [];
    let processed = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        const result = await processMegaPostToRecruitment(post._id);
        report.push({ postId: String(post._id), success: true, ...result });
        processed++;
      } catch (err) {
        failed++;
        report.push({
          postId: String(post._id),
          success: false,
          error: err.message,
        });
      }
    }

    if (processed > 0) {
      void clearFrontApiCacheBestEffort({ reason: "cron-watch-sweep" });
    }

    return res.json({
      success: true,
      watchedRecruitments: watchedRecruitments.length,
      scanned: posts.length,
      processed,
      failed,
      report,
    });
  } catch (err) {
    next(err);
  }
};
