import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import Recruitment from "../models/recruitment.model.mjs";
import RecruitmentEvent from "../models/recruitmentEvent.model.mjs";
import UserWatch from "../models/userWatch.model.mjs";
import { extractRecruitmentJsonFromContentHtml } from "./geminiExtract.service.mjs";
import {
  buildEventSignatures,
  buildRecruitmentKey,
} from "../utils/recruitmentEntity.util.mjs";
import { notifyWatchers } from "./notifier.service.mjs";
import logger from "../utils/logger.mjs";

function ensureObjectId(id, name) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    const err = new Error(`Valid ${name} is required`);
    err.statusCode = 400;
    throw err;
  }
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRecruitmentMeta(aiData = {}) {
  const r =
    aiData?.recruitment && typeof aiData.recruitment === "object"
      ? aiData.recruitment
      : aiData || {};
  return {
    title: String(r?.title || "").trim(),
    advertisementNumber: String(r?.advertisementNumber || "").trim(),
    organization: {
      name: String(r?.organization?.name || "").trim(),
      shortName: String(r?.organization?.shortName || "").trim(),
      website: String(r?.organization?.website || "").trim(),
      type: String(r?.organization?.type || "").trim(),
    },
    canonicalSourceUrl: String(r?.sourceUrl || "").trim(),
  };
}

async function findRecruitmentFallback(meta = {}, post = null) {
  const advt = String(meta?.advertisementNumber || "").trim();
  const orgShort = String(meta?.organization?.shortName || "").trim();
  const orgName = String(meta?.organization?.name || "").trim();
  const sourceUrlCandidates = [
    normalizeUrl(meta?.canonicalSourceUrl || ""),
    normalizeUrl(post?.originalUrl || ""),
  ].filter(Boolean);

  const or = [];
  if (sourceUrlCandidates.length) {
    or.push({ canonicalSourceUrl: { $in: sourceUrlCandidates } });
  }

  if (advt && (orgShort || orgName)) {
    const orgOr = [];
    if (orgShort) {
      orgOr.push({ "organization.shortName": { $regex: `^${escapeRegex(orgShort)}$`, $options: "i" } });
    }
    if (orgName) {
      orgOr.push({ "organization.name": { $regex: `^${escapeRegex(orgName)}$`, $options: "i" } });
    }
    if (orgOr.length) {
      or.push({
        advertisementNumber: { $regex: `^${escapeRegex(advt)}$`, $options: "i" },
        $or: orgOr,
      });
    }
  }

  if (!or.length) return null;

  return Recruitment.findOne({ $or: or }).sort({ updatedAt: -1 });
}

async function migrateWatchersIfRecruitmentSwitched({
  previousRecruitmentId = "",
  nextRecruitmentId = "",
}) {
  const fromId = String(previousRecruitmentId || "").trim();
  const toId = String(nextRecruitmentId || "").trim();
  if (!fromId || !toId || fromId === toId) {
    return { migrated: 0, sourceWatchers: 0 };
  }
  if (!mongoose.Types.ObjectId.isValid(fromId) || !mongoose.Types.ObjectId.isValid(toId)) {
    return { migrated: 0, sourceWatchers: 0 };
  }

  const sourceWatchers = await UserWatch.find({
    recruitmentId: new mongoose.Types.ObjectId(fromId),
  }).lean();
  let migrated = 0;

  for (const w of sourceWatchers) {
    const email = String(w?.email || "").trim().toLowerCase();
    if (!email) continue;

    await UserWatch.findOneAndUpdate(
      {
        email,
        recruitmentId: new mongoose.Types.ObjectId(toId),
      },
      {
        $set: {
          enabled: w?.enabled !== false,
          priority: Number.isFinite(Number(w?.priority)) ? Number(w.priority) : 0,
          channels: {
            email: w?.channels?.email !== false,
            whatsapp: w?.channels?.whatsapp === true,
          },
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    migrated++;
  }

  return { migrated, sourceWatchers: sourceWatchers.length };
}

export async function processMegaPostToRecruitment(postId) {
  ensureObjectId(postId, "postId");

  const post = await MegaPost.findById(postId);
  if (!post) {
    const err = new Error("MegaPost not found");
    err.statusCode = 404;
    throw err;
  }
  if (!String(post.contentHtml || "").trim()) {
    const err = new Error("MegaPost contentHtml is missing");
    err.statusCode = 400;
    throw err;
  }

  const { data: aiData, modelName } = await extractRecruitmentJsonFromContentHtml({
    contentHtml: post.contentHtml,
    newHtml: post.newHtml || "",
    title: post.title || "",
    sourceUrl: post.originalUrl || "",
  });

  post.aiData = aiData;
  post.aiScraped = true;
  post.aiScrapedAt = new Date();
  post.aiModel = String(modelName || "").trim();

  const recruitmentKey = buildRecruitmentKey(aiData);
  const meta = extractRecruitmentMeta(aiData);
  const previousRecruitmentId = String(post.recruitmentId || "").trim();
  const canonicalSourceUrl = meta.canonicalSourceUrl || post.originalUrl || "";

  let recruitment = null;
  if (previousRecruitmentId && mongoose.Types.ObjectId.isValid(previousRecruitmentId)) {
    recruitment = await Recruitment.findById(previousRecruitmentId);
  }

  const keyedRecruitment = await Recruitment.findOne({ recruitmentKey });
  if (recruitment && keyedRecruitment) {
    if (String(recruitment._id) !== String(keyedRecruitment._id)) {
      recruitment = keyedRecruitment;
    }
  } else if (!recruitment) {
    recruitment = keyedRecruitment;
  }
  if (!recruitment) {
    recruitment = await findRecruitmentFallback(meta, post);
  }

  if (recruitment) {
    recruitment.title = meta.title;
    recruitment.advertisementNumber = meta.advertisementNumber;
    recruitment.organization = meta.organization;
    recruitment.canonicalSourceUrl = canonicalSourceUrl;
    if (!String(recruitment.recruitmentKey || "").trim()) {
      recruitment.recruitmentKey = recruitmentKey;
    }
    await recruitment.save();
  } else {
    recruitment = await Recruitment.create({
      recruitmentKey,
      title: meta.title,
      advertisementNumber: meta.advertisementNumber,
      organization: meta.organization,
      canonicalSourceUrl,
    });
  }

  const resolvedRecruitmentKey = String(recruitment?.recruitmentKey || recruitmentKey);
  post.recruitmentId = recruitment._id;
  post.recruitmentKey = resolvedRecruitmentKey;
  post.lastEventProcessedAt = new Date();
  await post.save();

  const watchMigration = await migrateWatchersIfRecruitmentSwitched({
    previousRecruitmentId,
    nextRecruitmentId: String(recruitment._id),
  });
  if (watchMigration.migrated > 0) {
    logger.info(
      `Watch migration done for post=${post._id}: moved=${watchMigration.migrated}/${watchMigration.sourceWatchers} to recruitment=${recruitment._id}`,
    );
  }

  const eventCandidates = buildEventSignatures(aiData);
  const insertedEvents = [];

  for (const ev of eventCandidates) {
    try {
      await RecruitmentEvent.create({
        recruitmentId: recruitment._id,
        eventType: ev.eventType,
        eventDate: ev.eventDate || null,
        label: ev.label,
        linkUrl: ev.linkUrl || "",
        payload: ev.payload || {},
        signatureHash: ev.signatureHash,
        sourcePostId: post._id,
      });
      insertedEvents.push({
        ...ev,
        sourcePostId: post._id,
      });
    } catch (err) {
      if (err?.code === 11000) continue;
      logger.error(
        `RecruitmentEvent upsert failed postId=${post._id} eventType=${ev.eventType}: ${err.message}`,
      );
      throw err;
    }
  }

  let notify = { watchers: 0, events: insertedEvents.length, sent: 0, skipped: 0, failed: 0 };
  if (insertedEvents.length > 0) {
    notify = await notifyWatchers(recruitment._id, insertedEvents);
    await Recruitment.updateOne(
      { _id: recruitment._id },
      { $set: { lastEventAt: new Date() } },
    );
  }

  return {
    recruitmentId: String(recruitment._id),
    recruitmentKey: resolvedRecruitmentKey,
    insertedEvents: insertedEvents.length,
    modelName: String(modelName || ""),
    notify,
    watchMigration,
  };
}
