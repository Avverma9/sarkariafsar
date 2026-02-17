import mongoose from "mongoose";
import MegaPost from "../models/megaPost.model.mjs";
import Recruitment from "../models/recruitment.model.mjs";
import RecruitmentEvent from "../models/recruitmentEvent.model.mjs";
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
    sourceUrl: post.originalUrl || "",
  });

  post.aiData = aiData;
  post.aiScraped = true;
  post.aiScrapedAt = new Date();
  post.aiModel = String(modelName || "").trim();

  const recruitmentKey = buildRecruitmentKey(aiData);
  const meta = extractRecruitmentMeta(aiData);

  const recruitment = await Recruitment.findOneAndUpdate(
    { recruitmentKey },
    {
      $set: {
        title: meta.title,
        advertisementNumber: meta.advertisementNumber,
        organization: meta.organization,
        canonicalSourceUrl: meta.canonicalSourceUrl || post.originalUrl || "",
      },
      $setOnInsert: {
        recruitmentKey,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  post.recruitmentId = recruitment._id;
  post.recruitmentKey = recruitmentKey;
  post.lastEventProcessedAt = new Date();
  await post.save();

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
    recruitmentKey,
    insertedEvents: insertedEvents.length,
    modelName: String(modelName || ""),
    notify,
  };
}
