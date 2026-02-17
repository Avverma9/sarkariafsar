import mongoose from "mongoose";
import cron from "node-cron";
import MegaPost from "../models/megaPost.model.mjs";
import PostDetail from "../models/postdetail.model.mjs";
import { buildDedupeKeys } from "../utils/dedupe.mjs";
import logger from "../utils/logger.mjs";
import { comparePageHashSignature } from "../utils/pageHash.mjs";
import {
  buildPageHashFromSnapshot,
  buildPostSnapshotFromRaw,
  diffSnapshotFields,
} from "../utils/postSnapshot.mjs";
import { buildContentHashes } from "../utils/contentHash.mjs";
import { scrapePostsFromSection } from "./scraper.service.mjs";
import { scrapePostDetails } from "./postscrape.service.mjs";
import { sendPostUpdateNotification } from "./email.service.mjs";
import { acquireJobLock, releaseJobLock } from "./jobLock.service.mjs";

const DEFAULT_MATCH_THRESHOLD = Number(process.env.POST_UPDATE_MATCH_THRESHOLD || 0.8);
const DEFAULT_MAX_CANDIDATES = Number(process.env.POST_UPDATE_MAX_CANDIDATES || 5);
const DEFAULT_BATCH_SIZE = Number(process.env.POST_UPDATE_BATCH_SIZE || 20);
const DEFAULT_CRON_EXPRESSION = String(process.env.POST_UPDATE_CRON || "0 */2 * * *");
const DEFAULT_POST_UPDATE_LOCK_TTL_MS = Math.max(
  60 * 1000,
  Number(process.env.POST_UPDATE_LOCK_TTL_MS || 3 * 60 * 60 * 1000),
);
const POST_UPDATE_LOCK_KEY = "post-update";
const STALE_WINDOW_MS = 2 * 60 * 60 * 1000;

function makeError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function cleanText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function tokenSet(text) {
  const words = cleanText(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
  return new Set(words);
}

function jaccardSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (!setA.size && !setB.size) return 0;

  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter++;
  }

  const union = setA.size + setB.size - inter;
  if (!union) return 0;
  return inter / union;
}

function buildCandidateSeedScore(post, candidate) {
  const baseUrl = normalizeUrl(post.originalUrl);
  const candUrl = normalizeUrl(candidate.postUrl);

  if (baseUrl && candUrl && baseUrl === candUrl) return 1;

  const baseKeys = buildDedupeKeys(post.title, post.originalUrl) || {};
  const candKeys = buildDedupeKeys(candidate.title, candidate.postUrl) || {};
  const baseAlt = baseKeys.altKeys || {};
  const candAlt = candKeys.altKeys || {};

  let score = jaccardSimilarity(post.title, candidate.title);

  if (
    baseAlt.idKey &&
    candAlt.idKey &&
    baseAlt.idKey === candAlt.idKey
  ) {
    score = Math.max(score, 0.96);
  } else if (
    baseAlt.tokenKey &&
    candAlt.tokenKey &&
    baseAlt.tokenKey === candAlt.tokenKey
  ) {
    score = Math.max(score, 0.9);
  }

  return score;
}

function getBaseSnapshot(post) {
  if (post.updateSnapshot && typeof post.updateSnapshot === "object") {
    return post.updateSnapshot;
  }

  if (post.contentText || post.contentHtml) {
    return buildPostSnapshotFromRaw({
      title: post.title,
      sourceUrl: post.originalUrl,
      contentText: post.contentText || "",
      contentHtml: post.contentHtml || "",
      applyLinks: [],
      importantLinks: [],
      dates: {},
    });
  }

  return {};
}

async function findBestMatchingCandidate(post, options = {}) {
  const matchThreshold = Number(options.matchThreshold || DEFAULT_MATCH_THRESHOLD);
  const maxCandidates = Math.max(
    1,
    Number(options.maxCandidates || DEFAULT_MAX_CANDIDATES),
  );

  const sectionUrl = String(options.sourceSectionUrl || post.sourceSectionUrl || "").trim();
  if (!sectionUrl) {
    throw makeError("sourceSectionUrl is missing for post update", 400);
  }

  const siteBaseUrl = String(
    options.siteBaseUrl || post.sourceSiteUrl || post.originalUrl || sectionUrl,
  ).trim();
  const sectionPosts = await scrapePostsFromSection(sectionUrl, siteBaseUrl);
  if (!sectionPosts.length) {
    throw makeError("No posts found in source section", 404);
  }

  const scored = sectionPosts
    .map((candidate) => ({
      ...candidate,
      seedScore: buildCandidateSeedScore(post, candidate),
    }))
    .sort((a, b) => b.seedScore - a.seedScore);

  const shortlisted = scored.slice(0, maxCandidates);
  const baseSnapshot = getBaseSnapshot(post);
  const baseHashInfo = buildPageHashFromSnapshot(baseSnapshot);
  const hasBaseFingerprint = baseHashInfo.comparableCount >= 2;

  let best = null;

  for (const candidate of shortlisted) {
    try {
      const raw = await scrapePostDetails(candidate.postUrl);
      if (!String(raw.contentText || "").trim()) continue;

      const snapshot = buildPostSnapshotFromRaw(raw);
      const candidateHashInfo = buildPageHashFromSnapshot(snapshot);
      const contentHashes = buildContentHashes({ contentHtml: raw.contentHtml || "" });

      const hashScore = hasBaseFingerprint
        ? comparePageHashSignature(baseHashInfo, candidateHashInfo)
        : candidate.seedScore;
      const overallScore = hasBaseFingerprint
        ? 0.65 * hashScore + 0.35 * candidate.seedScore
        : candidate.seedScore;

      const details = {
        candidate,
        raw,
        snapshot,
        hashInfo: candidateHashInfo,
        contentHashes,
        hashScore,
        overallScore: Number(overallScore.toFixed(4)),
      };

      if (!best || details.overallScore > best.overallScore) {
        best = details;
      }
    } catch (err) {
      logger.error(
        `Candidate evaluation failed for post=${post._id} url=${candidate.postUrl}: ${err.message}`,
      );
    }
  }

  if (!best) {
    throw makeError("No candidate could be evaluated for this post", 404);
  }

  return {
    best,
    matched: best.overallScore >= matchThreshold,
    matchThreshold,
    baseSnapshot,
    baseHashInfo,
  };
}

export async function updateSinglePostById(postId, options = {}) {
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    throw makeError("Valid postId is required", 400);
  }

  const post = await MegaPost.findById(postId);
  if (!post) throw makeError("MegaPost not found", 404);
  const postDetail = await PostDetail.findOne({ megaPostId: post._id })
    .select("_id formattedData")
    .lean();
  if (!postDetail) {
    return {
      updated: false,
      matched: false,
      skipped: true,
      reason: "PostDetail not found for this MegaPost",
      postId: String(post._id),
      email: { sent: false, reason: "skipped-no-postdetail" },
    };
  }

  const now = new Date();
  const oldUrl = String(post.originalUrl || "");
  const oldHash = String(post.pageHash || "");

  const matchResult = await findBestMatchingCandidate(post, options);
  const best = matchResult.best;

  post.lastPostUpdateCheckAt = now;
  post.lastPostMatchScore = best.overallScore;
  post.lastPostMatchedUrl = best.candidate.postUrl;

  if (!matchResult.matched) {
    await post.save();
    return {
      updated: false,
      matched: false,
      reason: "No candidate crossed match threshold",
      postId: String(post._id),
      score: best.overallScore,
      threshold: matchResult.matchThreshold,
      bestMatchUrl: best.candidate.postUrl,
      email: { sent: false, reason: "not-updated" },
    };
  }

  const previousSnapshot = matchResult.baseSnapshot;
  const previousHash = oldHash || matchResult.baseHashInfo.pageHash;
  const nextHash = best.hashInfo.pageHash;
  const fieldChanges = diffSnapshotFields(previousSnapshot, best.snapshot);
  const oldHtmlHash = String(post.updateSnapshot?._hash?.htmlStableHash || "").trim();
  const oldTextHash = String(post.updateSnapshot?._hash?.textHash || "").trim();
  const newHtmlHash = String(best.contentHashes?.htmlStableHash || "").trim();
  const newTextHash = String(best.contentHashes?.textHash || "").trim();
  const htmlChanged = !!oldHtmlHash && !!newHtmlHash && oldHtmlHash !== newHtmlHash;
  const textChanged = !!oldTextHash && !!newTextHash && oldTextHash !== newTextHash;
  const urlChanged = normalizeUrl(oldUrl) !== normalizeUrl(best.candidate.postUrl);
  const contentMissingBefore = !String(post.contentHtml || "").trim();
  const hashChanged = previousHash !== nextHash;
  const contentHashChanged = htmlChanged || textChanged;

  const shouldUpdate =
    urlChanged ||
    hashChanged ||
    fieldChanges.length > 0 ||
    contentMissingBefore ||
    contentHashChanged;

  if (shouldUpdate) {
    post.originalUrl = best.candidate.postUrl;
    post.title = String(best.raw.title || best.candidate.title || post.title).trim();
    post.contentHtml = String(best.raw.contentHtml || "").trim();
    post.contentText = String(best.raw.contentText || "").trim();
    post.updateSnapshot = {
      ...best.snapshot,
      _hash: {
        htmlStableHash: newHtmlHash,
        textHash: newTextHash,
      },
    };
    post.pageHash = nextHash;
    post.lastPostFingerprintHash = nextHash;
  } else {
    const hasContentHashInSnapshot = Boolean(
      post.updateSnapshot?._hash?.htmlStableHash || post.updateSnapshot?._hash?.textHash,
    );
    if (!post.updateSnapshot || !hasContentHashInSnapshot) {
      post.updateSnapshot = {
        ...(post.updateSnapshot && typeof post.updateSnapshot === "object"
          ? post.updateSnapshot
          : best.snapshot),
        _hash: {
          htmlStableHash: newHtmlHash,
          textHash: newTextHash,
        },
      };
    }
    if (!post.pageHash) post.pageHash = previousHash;
  }

  await post.save();

  const notifyChanges = [...fieldChanges];
  if (htmlChanged) {
    notifyChanges.push({
      field: "_hash.htmlStableHash",
      oldValue: oldHtmlHash,
      newValue: newHtmlHash,
    });
  }
  if (textChanged) {
    notifyChanges.push({
      field: "_hash.textHash",
      oldValue: oldTextHash,
      newValue: newTextHash,
    });
  }

  let emailStatus = { sent: false, reason: "not-updated" };
  if (shouldUpdate) {
    try {
      emailStatus = await sendPostUpdateNotification({
        postId: String(post._id),
        title: post.title,
        oldUrl,
        newUrl: post.originalUrl,
        pageHashOld: previousHash,
        pageHashNew: nextHash,
        score: best.overallScore,
        changes: notifyChanges,
      });

      if (emailStatus.sent) {
        post.lastPostNotifyAt = new Date();
        await post.save();
      }
    } catch (err) {
      logger.error(`Update email failed for post=${post._id}: ${err.message}`);
      emailStatus = { sent: false, reason: err.message };
    }
  }

  return {
    updated: shouldUpdate,
    matched: true,
    postId: String(post._id),
    score: best.overallScore,
    threshold: matchResult.matchThreshold,
    bestMatchUrl: best.candidate.postUrl,
    urlChanged,
    hashChanged,
    htmlChanged,
    textChanged,
    fieldChanges: notifyChanges,
    email: emailStatus,
  };
}

function buildBatchQuery({ force = false } = {}) {
  const q = {
    sourceSectionUrl: { $exists: true, $ne: "" },
  };

  if (force) return q;

  const staleBefore = new Date(Date.now() - STALE_WINDOW_MS);
  q.$or = [
    { lastPostUpdateCheckAt: { $exists: false } },
    { lastPostUpdateCheckAt: { $lt: staleBefore } },
  ];
  return q;
}

export async function runPostUpdateBatch(options = {}) {
  const limit = Math.max(1, Number(options.limit || DEFAULT_BATCH_SIZE));
  const force = options.force === true;
  const query = buildBatchQuery({ force });

  const posts = await MegaPost.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "postdetails",
        localField: "_id",
        foreignField: "megaPostId",
        as: "postDetail",
      },
    },
    { $match: { "postDetail.0": { $exists: true } } },
    { $sort: { lastPostUpdateCheckAt: 1, updatedAt: 1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);

  const report = [];
  let matchedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  let notifiedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    try {
      const result = await updateSinglePostById(post._id, options);
      if (result.matched) matchedCount++;
      if (result.updated) updatedCount++;
      if (result.skipped) skippedCount++;
      if (result.email?.sent) notifiedCount++;
      report.push(result);
    } catch (err) {
      failedCount++;
      report.push({
        postId: String(post._id),
        matched: false,
        updated: false,
        error: err.message,
      });
      logger.error(`Post update failed for ${post._id}: ${err.message}`);
    }
  }

  return {
    scanned: posts.length,
    matched: matchedCount,
    updated: updatedCount,
    skipped: skippedCount,
    notified: notifiedCount,
    failed: failedCount,
    report,
  };
}

let schedulerTask = null;
let schedulerRunning = false;

export function startPostUpdateScheduler() {
  const enabled = String(process.env.POST_UPDATE_SCHEDULER_ENABLED || "true")
    .trim()
    .toLowerCase();

  if (enabled === "false" || enabled === "0") {
    logger.info("Post update scheduler is disabled by env");
    return null;
  }

  if (schedulerTask) {
    return schedulerTask;
  }

  const runSweep = async () => {
    if (schedulerRunning) {
      logger.warn("Post update scheduler skipped: previous run still active");
      return;
    }

    schedulerRunning = true;
    const lockOwner = `post-update:pid:${process.pid}:${Date.now()}`;
    try {
      const lock = await acquireJobLock({
        key: POST_UPDATE_LOCK_KEY,
        owner: lockOwner,
        ttlMs: DEFAULT_POST_UPDATE_LOCK_TTL_MS,
      });
      if (!lock.acquired) {
        logger.warn("Post update scheduler skipped: already running in another worker");
        return;
      }

      const result = await runPostUpdateBatch({
        limit: DEFAULT_BATCH_SIZE,
        force: false,
      });
      logger.info(
        `Post update sweep done. scanned=${result.scanned}, matched=${result.matched}, updated=${result.updated}, notified=${result.notified}, failed=${result.failed}`,
      );
    } catch (err) {
      logger.error(`Post update sweep failed: ${err.message}`);
    } finally {
      await releaseJobLock({
        key: POST_UPDATE_LOCK_KEY,
        owner: lockOwner,
      }).catch((err) => logger.warn(`Post update lock release failed: ${err.message}`));
      schedulerRunning = false;
    }
  };

  if (!cron.validate(DEFAULT_CRON_EXPRESSION)) {
    logger.error(`Invalid POST_UPDATE_CRON expression: ${DEFAULT_CRON_EXPRESSION}`);
    return null;
  }

  schedulerTask = cron.schedule(DEFAULT_CRON_EXPRESSION, () => {
    runSweep().catch((err) => logger.error(`Post update cron run failed: ${err.message}`));
  });

  logger.info(
    `Post update scheduler started. cron=${DEFAULT_CRON_EXPRESSION}, batchSize=${DEFAULT_BATCH_SIZE}`,
  );

  runSweep().catch((err) => logger.error(`Initial post update sweep failed: ${err.message}`));
  return schedulerTask;
}
