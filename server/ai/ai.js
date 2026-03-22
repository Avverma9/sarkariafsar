import "../utils/loadEnv.mjs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";
import pLimit from "p-limit";
import { GoogleGenAI } from "@google/genai";
import JobDetails from "../models/jobdetails.model.mjs";
import connectDatabase, { disconnectDatabase, mongoose } from "../db/config.mjs";
import { normalizeJobInput } from "../utils/job-normalize.mjs";
import {
  sendJobUpdateNotification,
  sendSystemEventNotification,
} from "../job-notification/notification.mjs";

const DEFAULT_JOB_AI_MODEL = process.env.JOB_AI_MODEL || "gemini-2.5-flash";
const DEFAULT_AI_MONITOR_CONCURRENCY = Number.parseInt(
  String(process.env.JOB_AI_MONITOR_CONCURRENCY || "2"),
  10
);
const DEFAULT_AI_MONITOR_LIMIT = Number.parseInt(
  String(process.env.JOB_AI_MONITOR_LIMIT || "0"),
  10
);
const DEFAULT_AI_MONITOR_SCHEDULE =
  process.env.JOB_AI_MONITOR_SCHEDULE || "0 7 * * *";
const DEFAULT_AI_MONITOR_TIMEZONE =
  process.env.JOB_AI_MONITOR_TIMEZONE || "Asia/Kolkata";
const DEFAULT_AI_MONITOR_ENABLED = toBoolean(
  process.env.JOB_AI_MONITOR_ENABLED,
  true
);
const DEFAULT_AI_MONITOR_RUN_ON_START = toBoolean(
  process.env.JOB_AI_MONITOR_RUN_ON_START,
  false
);
const MAX_EMAIL_CHANGES = 20;
const MAX_SOURCE_URLS = 6;

const DEFAULT_TRACKED_FIELD_CANDIDATES = [
  "important_dates",
  "official_links",
  "vacancy_details",
  "applyLastDate",
  "application_fee",
  "age_limit",
  "eligibility_criteria",
  "selection_process",
  "how_to_apply",
  "admit_card",
  "salary",
  "pay_scale",
  "exam_pattern",
  "result_dates",
  "notification_details",
  "advertisement_number",
];

const TRACKED_FIELD_PATTERN =
  /date|link|vacan|fee|age|eligib|selection|apply|admit|result|schedule|process|important|official|seat|salary|pay|exam|notification/i;

const TRACKED_FIELD_EXCLUSIONS = new Set([
  "_id",
  "__v",
  "dedupeKey",
  "slug",
  "sectionCanonicalUrl",
  "sectionName",
  "jobtitle",
  "title",
  "category",
  "language",
  "tags",
  "meta",
  "introduction",
  "conclusion",
  "disclaimer",
  "createdAt",
  "updatedAt",
  "postDate",
  "aiMonitoring",
]);

const JSON_FENCE_PATTERN = /^```(?:json)?\s*|\s*```$/gi;
const ABSOLUTE_URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

let aiClient = null;
let cronTask = null;
let cronRunning = false;

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value?.toObject === "function") {
    return value.toObject({ versionKey: false });
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (typeof value === "object") {
    return cloneValue(value);
  }
  return value;
};

function cloneValue(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = cloneValue(entry);
    }
    return output;
  }

  return value;
}

const normalizeTextForHash = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim();

const normalizeValueForHash = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValueForHash(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((accumulator, key) => {
        accumulator[key] = normalizeValueForHash(value[key]);
        return accumulator;
      }, {});
  }

  if (typeof value === "string") return normalizeTextForHash(value);
  return value;
};

const stableStringify = (value) => JSON.stringify(normalizeValueForHash(value));

const hashValue = (value = "") =>
  createHash("sha256").update(String(value || "")).digest("hex");

const toUniqueArray = (value = []) => [...new Set(value.filter(Boolean))];

const normalizeUrl = (value = "") => {
  const candidate = String(value || "").trim();
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const collectUrls = (value, bucket = []) => {
  if (!value) return bucket;

  if (typeof value === "string") {
    const matches = value.match(ABSOLUTE_URL_PATTERN) || [];
    bucket.push(...matches);
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectUrls(item, bucket);
    }
    return bucket;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) {
      collectUrls(item, bucket);
    }
  }

  return bucket;
};

const extractOfficialSourceUrls = (job = {}) => {
  const candidates = [];
  collectUrls(job?.official_links, candidates);
  collectUrls(job?.officialLinks, candidates);
  collectUrls(job?.important_links, candidates);
  collectUrls(job?.importantLinks, candidates);
  collectUrls(job?.how_to_apply, candidates);
  collectUrls(job?.notification_details, candidates);
  collectUrls(job?.sourceUrls, candidates);
  collectUrls(job?.reference_links, candidates);

  if (candidates.length < MAX_SOURCE_URLS) {
    collectUrls(job, candidates);
  }

  return toUniqueArray(candidates.map((url) => normalizeUrl(url)).filter(Boolean)).slice(
    0,
    MAX_SOURCE_URLS
  );
};

const summarizeVacancyContext = (job = {}) => {
  const parts = [];
  const push = (label, value) => {
    const text = truncate(
      typeof value === "string" ? value : stableStringify(value),
      400
    );
    if (text && text !== "null" && text !== "{}" && text !== "[]") {
      parts.push(`${label}: ${text}`);
    }
  };

  push("vacancy_details", job?.vacancy_details);
  push("important_dates", job?.important_dates);
  push("official_links", job?.official_links);
  push("application_fee", job?.application_fee);
  push("eligibility_criteria", job?.eligibility_criteria);

  return parts.join("\n");
};

const resolveTrackedFieldPaths = (job = {}) => {
  const keys = Object.keys(job || {});
  const dynamicMatches = keys.filter(
    (key) => !TRACKED_FIELD_EXCLUSIONS.has(key) && TRACKED_FIELD_PATTERN.test(key)
  );

  return toUniqueArray([...DEFAULT_TRACKED_FIELD_CANDIDATES, ...dynamicMatches]).filter(
    (key) => !TRACKED_FIELD_EXCLUSIONS.has(key)
  );
};

const buildTrackedSnapshot = (job = {}, trackedFieldPaths = resolveTrackedFieldPaths(job)) =>
  trackedFieldPaths.reduce((accumulator, key) => {
    accumulator[key] = cloneValue(job?.[key] ?? null);
    return accumulator;
  }, {});

const arraysEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const buildJobAiMonitoringState = (job = {}, previous = {}) => {
  const trackedFieldPaths = resolveTrackedFieldPaths(job);
  const trackedSnapshot = buildTrackedSnapshot(job, trackedFieldPaths);
  const trackedFieldHashes = trackedFieldPaths.reduce((accumulator, key) => {
    accumulator[key] = hashValue(stableStringify(trackedSnapshot[key]));
    return accumulator;
  }, {});

  return {
    version: 1,
    trackedFieldPaths,
    trackedFieldHashes,
    trackedSnapshot,
    currentHash: hashValue(stableStringify(trackedSnapshot)),
    officialSourceUrls: extractOfficialSourceUrls(job),
    lastHashRefreshAt: new Date(),
    lastCheckedAt: previous?.lastCheckedAt || null,
    lastDetectionStatus: String(previous?.lastDetectionStatus || "pending"),
    lastSummary: String(previous?.lastSummary || ""),
    lastConfidence: String(previous?.lastConfidence || ""),
    lastSources: Array.isArray(previous?.lastSources) ? previous.lastSources : [],
    lastPatchedAt: previous?.lastPatchedAt || null,
    lastMailSentAt: previous?.lastMailSentAt || null,
    lastMailStatus: String(previous?.lastMailStatus || ""),
    lastError: String(previous?.lastError || ""),
  };
};

export const attachJobAiMonitoring = (jobLike = {}) => {
  const plainJob = toPlainObject(jobLike);
  const previousMonitoring =
    plainJob?.aiMonitoring && typeof plainJob.aiMonitoring === "object"
      ? plainJob.aiMonitoring
      : {};

  return {
    ...plainJob,
    aiMonitoring: buildJobAiMonitoringState(plainJob, previousMonitoring),
  };
};

const getDateMs = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const buildPersistableBaselineJob = (jobLike = {}) =>
  attachJobAiMonitoring(normalizeJobInput(toPlainObject(jobLike)));

const shouldRepairJobDocument = (doc, baselineJob) => {
  const docTracking = doc?.aiMonitoring || {};
  const baselineTracking = baselineJob?.aiMonitoring || {};

  return (
    String(doc?.advertisement_number || "").trim() !==
      String(baselineJob?.advertisement_number || "").trim() ||
    String(doc?.dedupeKey || "").trim() !== String(baselineJob?.dedupeKey || "").trim() ||
    String(doc?.slug || "").trim() !== String(baselineJob?.slug || "").trim() ||
    String(doc?.sectionCanonicalUrl || "").trim() !==
      String(baselineJob?.sectionCanonicalUrl || "").trim() ||
    String(doc?.sectionName || "").trim() !== String(baselineJob?.sectionName || "").trim() ||
    String(doc?.jobtitle || "").trim() !== String(baselineJob?.jobtitle || "").trim() ||
    getDateMs(doc?.applyLastDate) !== getDateMs(baselineJob?.applyLastDate) ||
    !arraysEqual(
      Array.isArray(docTracking?.trackedFieldPaths) ? docTracking.trackedFieldPaths : [],
      Array.isArray(baselineTracking?.trackedFieldPaths) ? baselineTracking.trackedFieldPaths : []
    ) ||
    String(docTracking?.currentHash || "").trim() !==
      String(baselineTracking?.currentHash || "").trim()
  );
};

const prepareBaselineJobForMonitoring = async (doc) => {
  const baselineJob = buildPersistableBaselineJob(doc);

  if (shouldRepairJobDocument(doc, baselineJob)) {
    const persistable = toPersistableJobDocument(baselineJob);
    await JobDetails.updateOne({ _id: String(doc._id) }, { $set: persistable });
    doc.set(persistable);
  }

  return baselineJob;
};

const getDateKeyInTimezone = (value, timezone = DEFAULT_AI_MONITOR_TIMEZONE) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const wasCheckedToday = (lastCheckedAt, timezone = DEFAULT_AI_MONITOR_TIMEZONE) => {
  if (!lastCheckedAt) return false;
  return (
    getDateKeyInTimezone(lastCheckedAt, timezone) ===
    getDateKeyInTimezone(new Date(), timezone)
  );
};

const getGeminiApiKey = () =>
  String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

const isAiMonitorConfigured = () => Boolean(getGeminiApiKey());

const getAiClient = () => {
  if (aiClient) return aiClient;
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required");
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

const truncate = (value = "", limit = 500) => {
  const text = String(value || "").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3))}...`;
};

const buildAiPrompt = ({ job = {}, sourceUrls = [] } = {}) => {
  const monitoring = job?.aiMonitoring || buildJobAiMonitoringState(job);
  const trackedFields = Array.isArray(monitoring.trackedFieldPaths)
    ? monitoring.trackedFieldPaths
    : [];
  const searchContext = [
    job?.jobtitle || job?.title || "",
    job?.advertisement_number || "",
    job?.conducting_authority || "",
  ]
    .filter(Boolean)
    .join(" | ");
  const vacancySearchContext = summarizeVacancyContext(job);

  return `
You validate government job-post updates against authoritative public sources.

Rules:
- Treat the CURRENT DB SNAPSHOT as the baseline truth.
- Primary workflow: search daily using the job title, advertisement number, authority name, and vacancy/details context.
- Use Google Search to confirm official notices, revised dates, active apply links, vacancy changes, or corrigendum-style updates.
- Use the provided URLs with URL context only as optional helper context when they exist.
- Do not invent updates. If evidence is weak or conflicting, return "needs_review".
- Patch only full top-level fields. Never use dotted patch keys.
- Allowed patch keys: ${trackedFields.join(", ") || "none"}.
- If important dates change and that affects apply last date, include "applyLastDate" in the patch as an ISO date string.
- Keep patch empty when no safe update exists.
- Return JSON only. No markdown.

Expected JSON shape:
{
  "status": "no_change" | "change_detected" | "needs_review",
  "summary": "short summary",
  "confidence": "low" | "medium" | "high",
  "changedFields": ["important_dates"],
  "changes": [
    {
      "field": "important_dates",
      "before": "old summary",
      "after": "new summary",
      "reason": "why this changed"
    }
  ],
  "patch": {},
  "sources": [
    {
      "url": "https://example.com",
      "title": "optional source title",
      "reason": "why this source is relevant"
    }
  ]
}

JOB SEARCH CONTEXT:
${searchContext || "Unavailable"}

VACANCY / CHANGEABLE FIELD SEARCH HINTS:
${vacancySearchContext || "No additional vacancy context available"}

OPTIONAL KNOWN URLS:
${sourceUrls.length > 0 ? sourceUrls.map((url) => `- ${url}`).join("\n") : "- None available in DB"}

CURRENT DB SNAPSHOT:
${JSON.stringify(monitoring.trackedSnapshot || {}, null, 2)}
`.trim();
};

const parseModelJson = (value = "") => {
  const text = String(value || "").trim().replace(JSON_FENCE_PATTERN, "").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Gemini response was not valid JSON");
  }
};

const normalizeAiResponse = (value = {}) => {
  const normalized = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const status = ["no_change", "change_detected", "needs_review"].includes(
    normalized.status
  )
    ? normalized.status
    : "needs_review";
  const confidence = ["low", "medium", "high"].includes(normalized.confidence)
    ? normalized.confidence
    : "low";
  const changedFields = Array.isArray(normalized.changedFields)
    ? normalized.changedFields.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const changes = Array.isArray(normalized.changes)
    ? normalized.changes
        .map((entry) => ({
          field: String(entry?.field || "").trim(),
          before: truncate(
            typeof entry?.before === "string"
              ? entry.before
              : stableStringify(entry?.before),
            400
          ),
          after: truncate(
            typeof entry?.after === "string"
              ? entry.after
              : stableStringify(entry?.after),
            400
          ),
          reason: truncate(String(entry?.reason || "").trim(), 240),
        }))
        .filter((entry) => entry.field || entry.reason || entry.after)
    : [];
  const sources = Array.isArray(normalized.sources)
    ? normalized.sources
        .map((entry) => ({
          url: normalizeUrl(entry?.url),
          title: truncate(String(entry?.title || "").trim(), 160),
          reason: truncate(String(entry?.reason || "").trim(), 240),
        }))
        .filter((entry) => entry.url)
    : [];

  return {
    status,
    summary: truncate(String(normalized.summary || "").trim(), 500),
    confidence,
    changedFields: toUniqueArray(changedFields),
    changes,
    patch:
      normalized.patch && typeof normalized.patch === "object" && !Array.isArray(normalized.patch)
        ? normalized.patch
        : {},
    sources,
  };
};

const runGeminiAudit = async (job = {}) => {
  const client = getAiClient();
  const sourceUrls = extractOfficialSourceUrls(job);
  const tools =
    sourceUrls.length > 0 ? [{ urlContext: {} }, { googleSearch: {} }] : [{ googleSearch: {} }];
  const response = await client.models.generateContent({
    model: DEFAULT_JOB_AI_MODEL,
    contents: buildAiPrompt({ job, sourceUrls }),
    config: {
      temperature: 0.1,
      tools,
    },
  });

  return {
    sourceUrls,
    rawText: String(response?.text || "").trim(),
    parsed: normalizeAiResponse(parseModelJson(response?.text || "")),
  };
};

const buildAllowedPatchKeys = (job = {}) =>
  new Set([...(job?.aiMonitoring?.trackedFieldPaths || resolveTrackedFieldPaths(job)), "applyLastDate"]);

const sanitizeAiPatch = (job = {}, patch = {}) => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return {};
  }

  const allowed = buildAllowedPatchKeys(job);
  const sanitized = {};

  for (const [key, value] of Object.entries(patch)) {
    if (!allowed.has(key) || value === undefined) continue;
    sanitized[key] = cloneValue(value);
  }

  return sanitized;
};

const isPlainObject = (value) =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date);

const formatPreview = (value) => {
  if (value === undefined) return "(missing)";
  if (value === null) return "null";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return truncate(value, 280);
  return truncate(stableStringify(value), 280);
};

const buildDiffPath = (basePath, key, isIndex = false) => {
  if (!basePath) return isIndex ? `[${key}]` : String(key);
  return isIndex ? `${basePath}[${key}]` : `${basePath}.${key}`;
};

const diffSnapshots = (before, after, basePath = "", changes = [], depth = 0) => {
  if (stableStringify(before) === stableStringify(after)) {
    return changes;
  }

  if (depth >= 5) {
    changes.push({
      path: basePath || "root",
      beforePreview: formatPreview(before),
      afterPreview: formatPreview(after),
    });
    return changes;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const maxLength = Math.max(before.length, after.length);

    if (maxLength > 20) {
      changes.push({
        path: basePath || "root",
        beforePreview: formatPreview(before),
        afterPreview: formatPreview(after),
      });
      return changes;
    }

    for (let index = 0; index < maxLength; index += 1) {
      diffSnapshots(
        before[index],
        after[index],
        buildDiffPath(basePath, index, true),
        changes,
        depth + 1
      );
    }

    return changes;
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = toUniqueArray([...Object.keys(before), ...Object.keys(after)]).sort();

    if (keys.length > 30 && depth >= 2) {
      changes.push({
        path: basePath || "root",
        beforePreview: formatPreview(before),
        afterPreview: formatPreview(after),
      });
      return changes;
    }

    for (const key of keys) {
      diffSnapshots(
        before[key],
        after[key],
        buildDiffPath(basePath, key),
        changes,
        depth + 1
      );
    }

    return changes;
  }

  changes.push({
    path: basePath || "root",
    beforePreview: formatPreview(before),
    afterPreview: formatPreview(after),
  });
  return changes;
};

const getTopLevelFieldFromPath = (path = "") => {
  const match = String(path || "").match(/^[^[.\]]+/);
  return match ? match[0] : "";
};

const buildNotificationUrl = (job = {}) =>
  extractOfficialSourceUrls(job)[0] || String(job?.official_links?.official_website || "").trim();

const saveMonitoringMetadata = async (doc, monitoring, updates = {}) => {
  doc.aiMonitoring = {
    ...monitoring,
    ...updates,
  };
  await doc.save();
};

const preparePatchedJob = (job = {}, patch = {}) => {
  const merged = {
    ...toPlainObject(job),
    ...patch,
  };

  delete merged._id;
  delete merged.__v;
  delete merged.createdAt;
  delete merged.updatedAt;
  delete merged.aiMonitoring;

  return attachJobAiMonitoring(normalizeJobInput(merged));
};

const toPersistableJobDocument = (jobLike = {}) => {
  const job = toPlainObject(jobLike);
  delete job._id;
  delete job.__v;
  return job;
};

export const monitorSingleJobWithAi = async (doc, { force = false } = {}) => {
  const baselineJob = await prepareBaselineJobForMonitoring(doc);
  const baselineMonitoring = baselineJob.aiMonitoring;
  const now = new Date();

  if (!force && wasCheckedToday(baselineMonitoring.lastCheckedAt)) {
    return {
      id: String(doc?._id || ""),
      status: "skipped",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: [],
      mailed: false,
    };
  }

  const audit = await runGeminiAudit(baselineJob);
  const aiResult = audit.parsed;
  const sources = aiResult.sources.length > 0
    ? aiResult.sources
    : audit.sourceUrls.map((url) => ({ url, title: "", reason: "provided official source" }));

  if (
    aiResult.status !== "change_detected" ||
    aiResult.confidence === "low" ||
    Object.keys(aiResult.patch || {}).length === 0
  ) {
    const nextStatus =
      aiResult.status === "change_detected" && aiResult.confidence === "low"
        ? "needs_review"
        : aiResult.status;

    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: nextStatus,
      lastSummary:
        aiResult.summary ||
        (nextStatus === "needs_review"
          ? "Gemini found a possible update but confidence was too low for auto-patch."
          : "No authoritative update detected."),
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: nextStatus,
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: aiResult.changedFields,
      mailed: false,
    };
  }

  const safePatch = sanitizeAiPatch(baselineJob, aiResult.patch);
  if (Object.keys(safePatch).length === 0) {
    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: "needs_review",
      lastSummary: "Gemini suggested a patch outside allowed tracked fields.",
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: "needs_review",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: aiResult.changedFields,
      mailed: false,
    };
  }

  const patchedJob = preparePatchedJob(baselineJob, safePatch);
  const changes = diffSnapshots(
    baselineMonitoring.trackedSnapshot,
    patchedJob.aiMonitoring.trackedSnapshot
  );

  if (changes.length === 0) {
    await saveMonitoringMetadata(doc, baselineMonitoring, {
      lastCheckedAt: now,
      lastDetectionStatus: "no_change",
      lastSummary:
        aiResult.summary || "Gemini returned a patch candidate but it did not change tracked values.",
      lastConfidence: aiResult.confidence,
      lastSources: sources,
      lastError: "",
    });

    return {
      id: String(doc?._id || ""),
      status: "no_change",
      jobTitle: baselineJob.jobtitle || baselineJob.title || "",
      changedFields: [],
      mailed: false,
    };
  }

  const changedFields = toUniqueArray(
    changes.map((change) => getTopLevelFieldFromPath(change.path)).filter(Boolean)
  );
  const mailChanges = changes.slice(0, MAX_EMAIL_CHANGES);
  const omittedChangeCount = Math.max(0, changes.length - mailChanges.length);
  const mailResult = await sendJobUpdateNotification({
    jobTitle: baselineJob.jobtitle || baselineJob.title || "",
    jobUrl: buildNotificationUrl(baselineJob),
    matchedBy: "gemini-ai-monitor",
    changedFields,
    changes: mailChanges,
    omittedChangeCount,
  });

  doc.set(patchedJob);
  doc.aiMonitoring = {
    ...patchedJob.aiMonitoring,
    lastCheckedAt: now,
    lastDetectionStatus: "change_detected",
    lastSummary: aiResult.summary || "Job post updated from Gemini audit.",
    lastConfidence: aiResult.confidence,
    lastSources: sources,
    lastPatchedAt: now,
    lastMailSentAt: mailResult?.sent ? now : patchedJob.aiMonitoring.lastMailSentAt || null,
    lastMailStatus: mailResult?.sent ? "sent" : String(mailResult?.reason || "skipped"),
    lastError: "",
  };
  await doc.save();

  return {
    id: String(doc?._id || ""),
    status: "updated",
    jobTitle: baselineJob.jobtitle || baselineJob.title || "",
    changedFields,
    mailed: Boolean(mailResult?.sent),
  };
};

export const validateJobAiMonitoring = async ({ limit = 0 } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 0;
  let query = JobDetails.find({}).sort({ updatedAt: -1, createdAt: -1 });
  if (safeLimit > 0) {
    query = query.limit(safeLimit);
  }

  const docs = await query.lean().exec();
  const issues = [];

  for (const doc of docs) {
    const baselineJob = buildPersistableBaselineJob(doc);
    const docTracking = doc?.aiMonitoring || {};
    const baselineTracking = baselineJob?.aiMonitoring || {};

    const docIssues = [];
    if (!String(doc?.advertisement_number || "").trim() && String(baselineJob?.advertisement_number || "").trim()) {
      docIssues.push("missing_advertisement_number");
    }
    if (
      String(docTracking?.currentHash || "").trim() !==
      String(baselineTracking?.currentHash || "").trim()
    ) {
      docIssues.push("stale_tracking_hash");
    }
    if (
      !arraysEqual(
        Array.isArray(docTracking?.trackedFieldPaths) ? docTracking.trackedFieldPaths : [],
        Array.isArray(baselineTracking?.trackedFieldPaths) ? baselineTracking.trackedFieldPaths : []
      )
    ) {
      docIssues.push("tracked_field_paths_mismatch");
    }

    if (docIssues.length > 0) {
      issues.push({
        id: String(doc?._id || ""),
        title: String(doc?.jobtitle || doc?.title || ""),
        issues: docIssues,
      });
    }
  }

  return {
    checked: docs.length,
    issueCount: issues.length,
    issues,
  };
};

export const repairAllJobDocuments = async ({ limit = 0 } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 0;
  let query = JobDetails.find({}).sort({ updatedAt: -1, createdAt: -1 });
  if (safeLimit > 0) {
    query = query.limit(safeLimit);
  }

  const docs = await query.exec();
  let repaired = 0;

  for (const doc of docs) {
    const baselineJob = buildPersistableBaselineJob(doc);
    if (shouldRepairJobDocument(doc, baselineJob)) {
      doc.set(baselineJob);
      await doc.save();
      repaired += 1;
    }
  }

  return {
    checked: docs.length,
    repaired,
  };
};

export const runJobAiMonitoring = async ({
  force = false,
  limit = DEFAULT_AI_MONITOR_LIMIT,
  concurrency = DEFAULT_AI_MONITOR_CONCURRENCY,
} = {}) => {
  if (!isAiMonitorConfigured()) {
    return {
      processed: 0,
      updated: 0,
      noChange: 0,
      needsReview: 0,
      skipped: 0,
      mailed: 0,
      errors: 0,
      reason: "gemini_not_configured",
    };
  }

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : 0;
  const safeConcurrency = Number.isFinite(Number(concurrency))
    ? Math.max(1, Number(concurrency))
    : DEFAULT_AI_MONITOR_CONCURRENCY;

  let query = JobDetails.find({}).sort({ updatedAt: -1, createdAt: -1 });
  if (safeLimit > 0) {
    query = query.limit(safeLimit);
  }

  const docs = await query.exec();
  const limiter = pLimit(safeConcurrency);
  const results = await Promise.all(
    docs.map((doc) =>
      limiter(async () => {
        try {
          return await monitorSingleJobWithAi(doc, { force });
        } catch (error) {
          const fallbackMonitoring = buildJobAiMonitoringState(toPlainObject(doc), doc?.aiMonitoring);
          await saveMonitoringMetadata(doc, fallbackMonitoring, {
            lastDetectionStatus: "error",
            lastError: truncate(error?.message || error, 500),
          });

          return {
            id: String(doc?._id || ""),
            status: "error",
            jobTitle: String(doc?.jobtitle || doc?.title || ""),
            changedFields: [],
            mailed: false,
            error: error?.message || String(error),
          };
        }
      })
    )
  );

  return results.reduce(
    (accumulator, result) => {
      accumulator.processed += 1;
      if (result.status === "updated") accumulator.updated += 1;
      if (result.status === "no_change") accumulator.noChange += 1;
      if (result.status === "needs_review") accumulator.needsReview += 1;
      if (result.status === "skipped") accumulator.skipped += 1;
      if (result.status === "error") accumulator.errors += 1;
      if (result.mailed) accumulator.mailed += 1;
      return accumulator;
    },
    {
      processed: 0,
      updated: 0,
      noChange: 0,
      needsReview: 0,
      skipped: 0,
      mailed: 0,
      errors: 0,
    }
  );
};

export const runStandaloneJobAiMonitorCronJob = async ({
  force = false,
  limit = DEFAULT_AI_MONITOR_LIMIT,
  concurrency = DEFAULT_AI_MONITOR_CONCURRENCY,
} = {}) => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const result = await runJobAiMonitoring({ force, limit, concurrency });
    return {
      ...result,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    await sendSystemEventNotification({
      title: "AI monitor cron failed",
      eventType: "job_ai_monitor_error",
      summary: truncate(error?.message || error, 320),
      details: {
        limit,
        concurrency,
      },
    });
    throw error;
  } finally {
    cronRunning = false;
  }
};

export const startJobAiMonitorCron = ({
  schedule = DEFAULT_AI_MONITOR_SCHEDULE,
  timezone = DEFAULT_AI_MONITOR_TIMEZONE,
  enabled = DEFAULT_AI_MONITOR_ENABLED,
  runOnStart = DEFAULT_AI_MONITOR_RUN_ON_START,
} = {}) => {
  if (cronTask) return cronTask;
  if (!enabled) return null;

  if (!isAiMonitorConfigured()) {
    console.warn(
      "[job-ai-monitor-cron] skipped start because GEMINI_API_KEY/GOOGLE_API_KEY is missing"
    );
    return null;
  }

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid AI monitor cron schedule: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runStandaloneJobAiMonitorCronJob()
        .then((result) => {
          console.log(
            `[job-ai-monitor-cron] completed in ${result.durationMs}ms | processed=${result.processed} updated=${result.updated} review=${result.needsReview} mailed=${result.mailed}`
          );
        })
        .catch((error) => {
          console.error(`[job-ai-monitor-cron] ${error?.message || error}`);
        });
    },
    {
      timezone,
    }
  );

  console.log(`[job-ai-monitor-cron] started (${schedule}, timezone=${timezone})`);

  if (runOnStart) {
    runStandaloneJobAiMonitorCronJob()
      .then((result) => {
        console.log(
          `[job-ai-monitor-cron] initial run completed in ${result.durationMs}ms | processed=${result.processed} updated=${result.updated} review=${result.needsReview} mailed=${result.mailed}`
        );
      })
      .catch((error) => {
        console.error(`[job-ai-monitor-cron] initial run failed: ${error?.message || error}`);
      });
  }

  return cronTask;
};

export const stopJobAiMonitorCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

const runCli = async () => {
  const shouldRunCron =
    process.argv.includes("--cron") || process.argv.includes("cron");
  const shouldValidate =
    process.argv.includes("--validate") || process.argv.includes("validate");
  const shouldRepairOnly =
    process.argv.includes("--repair-only") || process.argv.includes("repair-only");
  const shouldConnect = mongoose.connection.readyState === 0;

  if (shouldConnect) {
    await connectDatabase();
  }

  try {
    if (shouldRunCron) {
      startJobAiMonitorCron({
        enabled: true,
        runOnStart: true,
      });
      return;
    }

    if (shouldValidate) {
      const result = await validateJobAiMonitoring({
        limit: DEFAULT_AI_MONITOR_LIMIT,
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (shouldRepairOnly) {
      const result = await repairAllJobDocuments({
        limit: DEFAULT_AI_MONITOR_LIMIT,
      });
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const result = await runStandaloneJobAiMonitorCronJob({ force: true });
    console.log(
      `[job-ai-monitor] processed=${result.processed} updated=${result.updated} noChange=${result.noChange} review=${result.needsReview} skipped=${result.skipped} mailed=${result.mailed} errors=${result.errors}`
    );
  } finally {
    if (!shouldRunCron && shouldConnect) {
      await disconnectDatabase();
    }
  }
};

const isDirectRun =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runCli().catch((error) => {
    console.error(`[job-ai-monitor] ${error?.message || error}`);
    process.exit(1);
  });
}

export default {
  attachJobAiMonitoring,
  buildJobAiMonitoringState,
  monitorSingleJobWithAi,
  runJobAiMonitoring,
  runStandaloneJobAiMonitorCronJob,
  startJobAiMonitorCron,
  stopJobAiMonitorCron,
  validateJobAiMonitoring,
  repairAllJobDocuments,
};
