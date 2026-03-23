import JobDetails from "../models/jobdetails.model.mjs";
import pLimit from "p-limit";
import { buildLocalSourceEvidence } from "./official-source-sync.mjs";
import { prepareNormalizedPayload } from "./job-sync.mjs";
import { buildHumanStatus, isGenericStatus } from "./job-status.mjs";
import {
  buildSchemaFallbackPost,
  generateSchemaDrivenSourcePost,
  isSchemaRichJob,
  isSourcePostAiConfigured,
} from "./source-post-ai.mjs";

const toObject = (value) => {
  if (!value) return {};
  if (typeof value?.toObject === "function") {
    return value.toObject({ versionKey: false });
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
};

const toText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const dedupeLinkEntries = (...groups) => {
  const seen = new Set();
  const output = [];

  for (const group of groups) {
    for (const entry of Array.isArray(group) ? group : []) {
      const url = toText(entry?.url || entry?.href || "");
      if (!url) continue;
      const label = toText(entry?.label || entry?.text || "Official Link");
      const key = `${url}::${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({
        label,
        url,
        status: toText(entry?.status || "Active") || "Active",
      });
    }
  }

  return output;
};

const mergeHealedDocument = (base = {}, patch = {}) => {
  const mergedOfficialLinks = {
    ...(base.official_links || {}),
    ...(patch.official_links || {}),
  };
  const mergedOfficialEntries = dedupeLinkEntries(
    base?.official_links?.links,
    patch?.official_links?.links
  );
  if (mergedOfficialEntries.length > 0) {
    mergedOfficialLinks.links = mergedOfficialEntries;
  }

  const next = {
    ...base,
    ...patch,
    title: toText(patch.title || patch.jobtitle || base.title || base.jobtitle),
    jobtitle: toText(patch.jobtitle || patch.title || base.jobtitle || base.title),
    official_links: mergedOfficialLinks,
    direct_links: {
      ...(base.direct_links || {}),
      ...(patch.direct_links || {}),
    },
  };

  next.status = buildHumanStatus({
    postType: next.postType || base.postType || "job",
    applyLastDate: next.applyLastDate || base.applyLastDate || null,
    currentStatus: patch.status || base.status || "",
    title: next.title || next.jobtitle || base.title || base.jobtitle || "",
  });

  return next;
};

export const needsSchemaHeal = (doc = {}) =>
  !isSchemaRichJob(doc, { postType: doc?.postType || "job" }) ||
  isGenericStatus(doc?.status || "", doc?.postType || "job");

export const healSingleJobDocument = async (
  doc,
  { dryRun = false, allowAi = true } = {}
) => {
  const baseDoc = toObject(doc);
  const startedRich = isSchemaRichJob(baseDoc, {
    postType: baseDoc?.postType || "job",
  });
  const startedGenericStatus = isGenericStatus(
    baseDoc?.status || "",
    baseDoc?.postType || "job"
  );

  if (!needsSchemaHeal(baseDoc)) {
    return {
      action: "unchanged",
      id: String(baseDoc?._id || ""),
      title: baseDoc?.title || baseDoc?.jobtitle || "",
      rich: true,
      humanStatus: true,
    };
  }

  let healedDoc = mergeHealedDocument(
    baseDoc,
    buildSchemaFallbackPost({
      candidate: baseDoc,
      previewJob: baseDoc,
    })
  );

  let usedAi = false;
  if (
    allowAi &&
    isSourcePostAiConfigured() &&
    !isSchemaRichJob(healedDoc, { postType: healedDoc?.postType || "job" })
  ) {
    try {
      const sourceEvidence = await buildLocalSourceEvidence(healedDoc);
      const enriched = await generateSchemaDrivenSourcePost({
        candidate: healedDoc,
        previewJob: healedDoc,
        sourceEvidence,
      });

      if (enriched.status === "ready" && enriched.post && Object.keys(enriched.post).length > 0) {
        healedDoc = mergeHealedDocument(healedDoc, enriched.post);
        usedAi = true;
      }
    } catch {
      // Keep deterministic fallback output when AI enrichment is unavailable.
    }
  }

  healedDoc.status = buildHumanStatus({
    postType: healedDoc?.postType || "job",
    applyLastDate: healedDoc?.applyLastDate || null,
    currentStatus: healedDoc?.status || "",
    title: healedDoc?.title || healedDoc?.jobtitle || "",
  });

  const rich = isSchemaRichJob(healedDoc, {
    postType: healedDoc?.postType || "job",
  });
  const humanStatus = !isGenericStatus(
    healedDoc?.status || "",
    healedDoc?.postType || "job"
  );

  if (!rich && !humanStatus) {
    return {
      action: "skipped",
      id: String(baseDoc?._id || ""),
      title: baseDoc?.title || baseDoc?.jobtitle || "",
      rich: false,
      humanStatus: false,
      usedAi,
      reason: "insufficient_schema_evidence",
    };
  }

  const persistable = await prepareNormalizedPayload(healedDoc);
  delete persistable._id;
  delete persistable.__v;
  delete persistable.createdAt;
  delete persistable.updatedAt;

  if (dryRun) {
    return {
      action: "healed",
      id: String(baseDoc?._id || ""),
      title: persistable?.title || persistable?.jobtitle || "",
      rich,
      humanStatus,
      usedAi,
      changedRichness: !startedRich && rich,
      changedStatus: startedGenericStatus && humanStatus,
      job: persistable,
    };
  }

  const updated = await JobDetails.findOneAndUpdate(
    { _id: baseDoc._id },
    { $set: persistable },
    { new: true, runValidators: true }
  );

  return {
    action: "healed",
    id: String(baseDoc?._id || ""),
    title: updated?.title || updated?.jobtitle || "",
    rich,
    humanStatus,
    usedAi,
    changedRichness: !startedRich && rich,
    changedStatus: startedGenericStatus && humanStatus,
    job: updated,
  };
};

export const healAllJobDocuments = async ({
  limit = 0,
  dryRun = false,
  allowAi = true,
  onlyNeedy = true,
  concurrency = 3,
} = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 0;
  const safeConcurrency = Number.isFinite(Number(concurrency))
    ? Math.max(1, Number(concurrency))
    : 3;
  let query = JobDetails.find({}).sort({ updatedAt: -1, createdAt: -1 });

  if (safeLimit > 0) {
    query = query.limit(safeLimit);
  }

  const docs = await query.exec();
  const targets = onlyNeedy ? docs.filter((doc) => needsSchemaHeal(toObject(doc))) : docs;
  const limiter = pLimit(safeConcurrency);
  const results = await Promise.all(
    targets.map((doc) => limiter(() => healSingleJobDocument(doc, { dryRun, allowAi })))
  );

  return results.reduce(
    (accumulator, result) => {
      if (result.action === "healed") accumulator.healed += 1;
      if (result.action === "skipped") accumulator.skipped += 1;
      if (result.changedRichness) accumulator.richnessFixed += 1;
      if (result.changedStatus) accumulator.statusFixed += 1;
      if (result.usedAi) accumulator.usedAi += 1;
      accumulator.results.push(result);
      return accumulator;
    },
    {
      checked: targets.length,
      healed: 0,
      skipped: 0,
      richnessFixed: 0,
      statusFixed: 0,
      usedAi: 0,
      results: [],
    }
  );
};

export default {
  healAllJobDocuments,
  healSingleJobDocument,
  needsSchemaHeal,
};
