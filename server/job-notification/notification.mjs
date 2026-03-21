import axios from "axios";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";

const DEFAULT_SUBJECT_PREFIX =
  process.env.JOB_UPDATE_EMAIL_SUBJECT_PREFIX || "[SarkariAfsar Job Update]";
const DEFAULT_NEW_POST_SUBJECT_PREFIX =
  process.env.NEW_POST_EMAIL_SUBJECT_PREFIX || "[SarkariAfsar New Posts]";
const DEFAULT_SYSTEM_EVENT_SUBJECT_PREFIX =
  process.env.SYSTEM_EVENT_EMAIL_SUBJECT_PREFIX || "[SarkariAfsar Event]";
const DEFAULT_NEW_POST_EMAIL_MAX_POSTS = Number.parseInt(
  String(process.env.NEW_POST_EMAIL_MAX_POSTS || "25"),
  10
);

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};
const BLOCKED_PROTOCOL_PREFIXES = ["javascript:", "mailto:", "tel:", "data:", "#"];
const DEFAULT_JOB_SKIP_PATTERNS = [
  /^home$/i,
  /^sarkari\s*result$/i,
  /\blet['’]?\s*s?\s*update\b/i,
  /^latest\s*job(s)?$/i,
  /^admit\s*card(s)?$/i,
  /^result(s)?$/i,
  /^exam\s*result(s)?$/i,
  /^admission(s)?$/i,
  /^answer\s*key(s)?$/i,
  /\bcontact(\s+us)?\b/i,
  /\bprivacy(\s+policy)?\b/i,
  /\bdisclaimer\b/i,
  /\babout(\s+us)?\b/i,
];
const GENERIC_TITLE_PATTERNS = [
  /^click here$/i,
  /^join whatsapp$/i,
  /^join telegram$/i,
  /^read more$/i,
  /^download now$/i,
  /^apply now$/i,
  /^view more$/i,
  /^here$/i,
];
const BLOCKED_HOSTNAME_PATTERNS = [
  /(^|\.)whatsapp\.com$/i,
  /(^|\.)t\.me$/i,
  /(^|\.)telegram\.me$/i,
  /(^|\.)play\.google\.com$/i,
  /(^|\.)apps\.apple\.com$/i,
  /(^|\.)youtube\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)x\.com$/i,
  /(^|\.)twitter\.com$/i,
];
const DEFAULT_STATE_FILE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  String(process.env.JOB_NOTIFICATION_STATE_FILE || "").trim() || ".notification-state.json"
);
const DEFAULT_SECTION_PAGINATION_MAX_PAGES = 25;
const DEFAULT_SECTION_PAGINATION_MAX_EMPTY_PAGES = 2;
const DEFAULT_FETCH_RETRY_ATTEMPTS = 3;
const DEFAULT_FETCH_RETRY_DELAY_MS = 1200;
const DEFAULT_RUN_HISTORY_LIMIT = 25;
const DEFAULT_DELIVERY_LOG_LIMIT = 100;
const DEFAULT_PENDING_NOTIFICATION_LIMIT = 100;

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const DETAIL_FETCH_FOR_NEW_JOBS = toBoolean(
  process.env.JOB_NOTIFICATION_FETCH_DETAIL_FOR_NEW,
  false
);

const toCleanText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toUniqueArray = (values = []) => {
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const clean = String(value || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }

  return output;
};

const toPositiveInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const createRegex = (value) => {
  if (!value) return null;
  if (value instanceof RegExp) return value;
  return new RegExp(String(value), "i");
};

const createRegexList = (values = []) =>
  values
    .map((value) => {
      try {
        return createRegex(value);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

const isHttpUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  if (BLOCKED_PROTOCOL_PREFIXES.some((prefix) => lowered.startsWith(prefix))) {
    return null;
  }

  try {
    const absolute = new URL(trimmed, baseUrl).toString();
    return isHttpUrl(absolute) ? absolute : null;
  } catch {
    return null;
  }
};

const normalizeTextForHash = (value = "") =>
  toCleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeJobUrlForHash = (url = "") => {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const host = String(parsed.hostname || "").trim().toLowerCase().replace(/^www\./, "");
    const pathname = String(parsed.pathname || "/")
      .trim()
      .replace(/\/+/g, "/")
      .replace(/\/+$/g, "") || "/";
    const params = [...parsed.searchParams.entries()]
      .filter(([key]) => {
        const normalizedKey = String(key || "").toLowerCase();
        if (!normalizedKey) return false;
        if (normalizedKey.startsWith("utm_")) return false;
        if (["fbclid", "gclid", "ref", "source", "from"].includes(normalizedKey)) return false;
        return true;
      })
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${String(key).toLowerCase()}=${String(value || "").trim().toLowerCase()}`);

    return `${host}${pathname}${params.length > 0 ? `?${params.join("&")}` : ""}`;
  } catch {
    return String(url || "").trim().toLowerCase();
  }
};

const hashValue = (value = "") =>
  createHash("sha256").update(String(value || "")).digest("hex");

const cleanJobTitle = (value = "") =>
  toCleanText(value)
    .replace(/\s+\|\s+.*$/, "")
    .replace(/\s+-\s+apply online.*$/i, "")
    .replace(/\s+-\s+online form.*$/i, "")
    .trim();

const toComparableTitle = (value = "") =>
  cleanJobTitle(value)
    .replace(/[–—-]\s*(out|soon|updated|start|started|date extend|date extended|answer key|admit card|result)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const inferLabelFromUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop();
    if (!lastSegment) return "";
    return decodeURIComponent(lastSegment).replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
};

const buildStateKey = ({ sectionName = "", sectionUrls = [] } = {}) => {
  const normalizedUrls = toUniqueArray(sectionUrls).sort().join("|");
  const fallback = sectionName || normalizedUrls || "job-notification";
  return hashValue(fallback).slice(0, 24);
};

const inferSectionNameFromUrls = (sectionUrls = []) => {
  for (const url of sectionUrls || []) {
    const label = inferLabelFromUrl(url);
    if (label) return label;
  }

  return "Jobs";
};

const isBlockedHostname = (url = "") => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").trim();
    return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
};

const isGenericListingTitle = (title = "") => {
  const cleanTitleValue = toCleanText(title);
  if (!cleanTitleValue) return true;
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(cleanTitleValue));
};

const formatErrorMessage = (error) => {
  if (!error) return "Unknown error";
  if (Array.isArray(error?.errors) && error.errors.length > 0) {
    return error.errors
      .map((item) => item?.message || String(item))
      .filter(Boolean)
      .join(" | ");
  }
  if (error?.cause) {
    return error?.cause?.message || String(error.cause);
  }
  return error?.message || String(error);
};

const appendRunHistory = (history = [], entry = {}, limit = DEFAULT_RUN_HISTORY_LIMIT) =>
  [entry, ...(Array.isArray(history) ? history : [])].slice(0, limit);

const appendLimitedEntries = (entries = [], additions = [], limit = 0) =>
  [...(Array.isArray(additions) ? additions : []), ...(Array.isArray(entries) ? entries : [])].slice(
    0,
    limit
  );

const fetchHtml = async (url, requestConfig = {}) => {
  const safeAttempts = toPositiveInteger(
    requestConfig?.retryAttempts,
    DEFAULT_FETCH_RETRY_ATTEMPTS
  );
  const safeDelayMs = toPositiveInteger(
    requestConfig?.retryDelayMs,
    DEFAULT_FETCH_RETRY_DELAY_MS
  );

  let lastError = null;
  for (let attempt = 1; attempt <= safeAttempts; attempt += 1) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: DEFAULT_HEADERS,
        responseType: "text",
        transformResponse: [(data) => data],
        maxRedirects: 5,
        family: attempt === 1 ? 4 : undefined,
        ...requestConfig,
      });

      return typeof response.data === "string" ? response.data : String(response.data || "");
    } catch (error) {
      lastError = error;
      if (attempt < safeAttempts) {
        await sleep(safeDelayMs * attempt);
      }
    }
  }

  throw new Error(formatErrorMessage(lastError));
};

const getJobAnchorCandidates = ($) => {
  const prioritizedSelectors = [
    "main .latest-posts-last-date li > a[href]",
    "main article ul li > a[href]",
    "main article ol li > a[href]",
    "main article h1 a[href], main article h2 a[href], main article h3 a[href], main article h4 a[href]",
    "main h1 a[href], main h2 a[href], main h3 a[href], main h4 a[href]",
    "main a[href]",
    "article a[href]",
  ];

  for (const selector of prioritizedSelectors) {
    const matches = $(selector).toArray();
    if (matches.length > 0) return matches;
  }

  return $("a[href]").toArray();
};

const toPaginatedSectionUrl = (baseUrl = "", pageNumber = 1) => {
  if (pageNumber <= 1) return String(baseUrl || "").trim();

  try {
    const parsed = new URL(baseUrl);
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean)
      .filter((segment, index, allSegments) => {
        if (segment.toLowerCase() !== "page") return true;
        return !/^\d+$/.test(String(allSegments[index + 1] || ""));
      });

    parsed.pathname = `/${[...segments, "page", String(pageNumber)].join("/")}/`;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return String(baseUrl || "").trim();
  }
};

const buildJobRecord = ({
  title = "",
  jobUrl = "",
  sourceSectionUrl = "",
} = {}) => {
  const cleanTitleValue = cleanJobTitle(title) || inferLabelFromUrl(jobUrl) || "Untitled post";
  const normalizedJobUrl = normalizeJobUrlForHash(jobUrl);
  return {
    title: cleanTitleValue,
    jobUrl,
    sourceSectionUrl,
    dedupeHash: hashValue(`${normalizeTextForHash(cleanTitleValue)}|${normalizedJobUrl}`),
  };
};

const createUpdateChanges = ({ previousPost = {}, currentPost = {} } = {}) => {
  const fieldLabels = [
    ["title", "Title"],
    ["jobUrl", "Job URL"],
    ["sourceSectionUrl", "Source Section URL"],
  ];

  return fieldLabels
    .filter(([key]) => String(previousPost?.[key] || "") !== String(currentPost?.[key] || ""))
    .map(([key, label]) => ({
      path: key,
      label,
      beforePreview: String(previousPost?.[key] || "") || "(empty)",
      afterPreview: String(currentPost?.[key] || "") || "(empty)",
    }));
};

const normalizeStateShape = (rawState = {}) => {
  if (rawState && typeof rawState === "object" && !Array.isArray(rawState)) {
    if (rawState.siteSnapshots || rawState.trackedJobs || rawState.meta) {
      return {
        meta: rawState.meta && typeof rawState.meta === "object" ? rawState.meta : {},
        siteSnapshots:
          rawState.siteSnapshots && typeof rawState.siteSnapshots === "object"
            ? rawState.siteSnapshots
            : {},
        trackedJobs:
          rawState.trackedJobs && typeof rawState.trackedJobs === "object"
            ? rawState.trackedJobs
            : {},
        lastRun:
          rawState.lastRun && typeof rawState.lastRun === "object"
            ? rawState.lastRun
            : {},
        runHistory: Array.isArray(rawState.runHistory) ? rawState.runHistory : [],
        deliveryLog: Array.isArray(rawState.deliveryLog) ? rawState.deliveryLog : [],
        pendingNotifications: Array.isArray(rawState.pendingNotifications)
          ? rawState.pendingNotifications
          : [],
      };
    }

    return {
      meta: {
        version: 2,
        migratedFromLegacy: true,
      },
      siteSnapshots: rawState,
      trackedJobs: {},
      lastRun: {},
      runHistory: [],
      deliveryLog: [],
      pendingNotifications: [],
    };
  }

  return {
    meta: {
      version: 2,
    },
    siteSnapshots: {},
    trackedJobs: {},
    lastRun: {},
    runHistory: [],
    deliveryLog: [],
    pendingNotifications: [],
  };
};

const createNotificationDeliveryEntry = ({
  type = "",
  sectionName = "",
  title = "",
  jobUrl = "",
  sourceSites = [],
  changedFields = [],
  response = {},
} = {}) => {
  const createdAt = new Date().toISOString();
  const normalizedType = String(type || "").trim() || "notification";
  const normalizedSectionName = String(sectionName || "").trim();
  const normalizedTitle = String(title || "").trim();
  const normalizedJobUrl = String(jobUrl || "").trim();
  const normalizedChangedFields = normalizeArrayField(changedFields);
  const deliveryKey = hashValue(
    JSON.stringify({
      type: normalizedType,
      title: normalizedTitle,
      jobUrl: normalizedJobUrl,
      sectionName: normalizedSectionName,
      changedFields: normalizedChangedFields,
    })
  ).slice(0, 24);

  return {
    id: hashValue(`${deliveryKey}:${createdAt}`).slice(0, 24),
    deliveryKey,
    type: normalizedType,
    sectionName: normalizedSectionName,
    title: normalizedTitle,
    jobUrl: normalizedJobUrl,
    sourceSites: normalizeArrayField(sourceSites),
    changedFields: normalizedChangedFields,
    status: response?.sent ? "sent" : "pending",
    reason: String(response?.reason || "").trim(),
    error: String(response?.error || "").trim(),
    messageId: String(response?.messageId || "").trim(),
    createdAt,
  };
};

const buildEntityKey = ({ title = "", jobUrl = "" } = {}) => {
  const comparableTitle = toComparableTitle(title);
  if (comparableTitle) {
    return hashValue(`title:${normalizeTextForHash(comparableTitle)}`);
  }

  return hashValue(`url:${normalizeJobUrlForHash(jobUrl)}`);
};

const normalizeArrayField = (values = []) =>
  toUniqueArray(values)
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

const shortenPreview = (value = "", maxLength = 500) => {
  const normalized = toCleanText(value);
  if (!normalized) return "(empty)";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const buildArrayChangePreview = (beforeValues = [], afterValues = []) => {
  const before = normalizeArrayField(beforeValues);
  const after = normalizeArrayField(afterValues);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((item) => !beforeSet.has(item));
  const removed = before.filter((item) => !afterSet.has(item));

  const beforePreview = before.length > 0 ? before.join(", ") : "(empty)";
  const afterPreview = after.length > 0 ? after.join(", ") : "(empty)";

  if (added.length === 0 && removed.length === 0) {
    return {
      beforePreview,
      afterPreview,
    };
  }

  return {
    beforePreview: `${beforePreview}${removed.length > 0 ? ` | Removed: ${removed.join(", ")}` : ""}`,
    afterPreview: `${afterPreview}${added.length > 0 ? ` | Added: ${added.join(", ")}` : ""}`,
  };
};

const shouldFetchDetailForJob = ({ previousJob = null } = {}) =>
  Boolean(previousJob) || DETAIL_FETCH_FOR_NEW_JOBS;

const fetchJobDetailSnapshot = async ({ jobUrl = "", requestConfig = {} } = {}) => {
  const normalizedJobUrl = toAbsoluteUrl(jobUrl, jobUrl);
  if (!normalizedJobUrl) {
    return {
      canonicalUrl: "",
      pageTitle: "",
      metaDescription: "",
      contentHash: "",
      headingSnapshot: [],
      contentPreview: "",
    };
  }

  try {
    const html = await fetchHtml(normalizedJobUrl, requestConfig);
    const $ = cheerio.load(html);
    const textContent = toCleanText($.root().text());
    const pageTitle = toCleanText($("title").first().text());
    const metaDescription = toCleanText($('meta[name="description"]').attr("content"));
    const canonicalUrl = toAbsoluteUrl($('link[rel="canonical"]').attr("href"), normalizedJobUrl) || "";
    const headingSnapshot = normalizeArrayField(
      $("h1, h2, h3")
        .toArray()
        .map((element) => $(element).text())
        .map((value) => shortenPreview(value, 160))
        .filter(Boolean)
    ).slice(0, 12);

    return {
      canonicalUrl,
      pageTitle,
      metaDescription,
      contentHash: hashValue(textContent || html || normalizedJobUrl),
      headingSnapshot,
      contentPreview: shortenPreview(textContent, 700),
    };
  } catch (error) {
    return {
      canonicalUrl: "",
      pageTitle: "",
      metaDescription: "",
      contentHash: "",
      headingSnapshot: [],
      contentPreview: "",
      detailError: error?.message || String(error),
    };
  }
};

const aggregateTrackedJobs = ({
  siteResults = [],
  previousTrackedJobs = {},
} = {}) => {
  const aggregateMap = new Map();

  for (const siteResult of siteResults || []) {
    for (const post of siteResult?.posts || []) {
      const entityKey = buildEntityKey({
        title: post?.title,
        jobUrl: post?.jobUrl,
      });
      const current = aggregateMap.get(entityKey) || {
        entityKey,
        title: String(post?.title || "").trim(),
        comparableTitle: toComparableTitle(post?.title || ""),
        primaryJobUrl: String(post?.jobUrl || "").trim(),
        sourceSites: [],
        sourceSectionUrls: [],
        sourceJobUrls: [],
        sourceTitles: [],
        sourceRecords: [],
        detailRequestConfig: siteResult?.requestConfig || {},
      };

      current.title =
        String(current.title || "").trim().length >= String(post?.title || "").trim().length
          ? current.title
          : String(post?.title || "").trim();
      current.primaryJobUrl = current.primaryJobUrl || String(post?.jobUrl || "").trim();
      current.sourceSites.push(siteResult?.sectionName || "");
      current.sourceSectionUrls.push(post?.sourceSectionUrl || "");
      current.sourceJobUrls.push(post?.jobUrl || "");
      current.sourceTitles.push(post?.title || "");
      current.sourceRecords.push({
        sectionName: siteResult?.sectionName || "",
        sectionUrls: siteResult?.sectionUrls || [],
        sourceSectionUrl: post?.sourceSectionUrl || "",
        title: post?.title || "",
        jobUrl: post?.jobUrl || "",
      });
      aggregateMap.set(entityKey, current);
    }
  }

  return Promise.all(
    [...aggregateMap.values()].map(async (item) => {
      const previousJob = previousTrackedJobs?.[item.entityKey] || null;
      const detail = shouldFetchDetailForJob({ previousJob })
        ? await fetchJobDetailSnapshot({
            jobUrl: item.primaryJobUrl,
            requestConfig: item.detailRequestConfig || {},
          })
        : {
            canonicalUrl: String(previousJob?.canonicalUrl || "").trim(),
            pageTitle: String(previousJob?.pageTitle || "").trim(),
            metaDescription: String(previousJob?.metaDescription || "").trim(),
            contentHash: String(previousJob?.contentHash || "").trim(),
            headingSnapshot: Array.isArray(previousJob?.headingSnapshot)
              ? previousJob.headingSnapshot
              : [],
            contentPreview: String(previousJob?.contentPreview || "").trim(),
            detailError: "",
          };

      const effectiveCanonicalUrl =
        String(detail?.canonicalUrl || "").trim() ||
        String(previousJob?.canonicalUrl || "").trim();
      const effectivePageTitle =
        String(detail?.pageTitle || "").trim() ||
        String(previousJob?.pageTitle || "").trim();
      const effectiveMetaDescription =
        String(detail?.metaDescription || "").trim() ||
        String(previousJob?.metaDescription || "").trim();
      const effectiveContentHash =
        String(detail?.contentHash || "").trim() ||
        String(previousJob?.contentHash || "").trim();
      const effectiveHeadingSnapshot =
        Array.isArray(detail?.headingSnapshot) && detail.headingSnapshot.length > 0
          ? normalizeArrayField(detail.headingSnapshot)
          : normalizeArrayField(previousJob?.headingSnapshot || []);
      const effectiveContentPreview =
        String(detail?.contentPreview || "").trim() ||
        String(previousJob?.contentPreview || "").trim();

      return {
      entityKey: item.entityKey,
      title: item.title,
      comparableTitle: item.comparableTitle,
      jobUrl: item.primaryJobUrl,
      canonicalUrl: effectiveCanonicalUrl,
      pageTitle: effectivePageTitle,
      metaDescription: effectiveMetaDescription,
      contentHash: effectiveContentHash,
      headingSnapshot: effectiveHeadingSnapshot,
      contentPreview: effectiveContentPreview,
      detailError: String(detail?.detailError || "").trim(),
      sourceSites: normalizeArrayField(item.sourceSites),
      sourceSectionUrls: normalizeArrayField(item.sourceSectionUrls),
      sourceJobUrls: normalizeArrayField(item.sourceJobUrls),
      sourceTitles: normalizeArrayField(item.sourceTitles),
      sourceRecords: item.sourceRecords,
      seenOnSourcesCount: normalizeArrayField(item.sourceSites).length,
      updatedAt: new Date().toISOString(),
      };
    })
  ).then((trackedJobs) =>
    trackedJobs.sort((left, right) => left.title.localeCompare(right.title))
  );
};

const buildTrackedJobChanges = ({ previousJob = {}, currentJob = {} } = {}) => {
  const fields = [
    ["title", "Title"],
    ["jobUrl", "Job URL"],
    ["canonicalUrl", "Canonical URL"],
    ["pageTitle", "Page Title"],
    ["metaDescription", "Meta Description"],
    ["sourceSites", "Source Sites"],
    ["sourceSectionUrls", "Source Section URLs"],
    ["sourceJobUrls", "Source Job URLs"],
    ["headingSnapshot", "Page Headings"],
  ];

  const changes = [];
  for (const [key, label] of fields) {
    const before = Array.isArray(previousJob?.[key])
      ? normalizeArrayField(previousJob[key])
      : String(previousJob?.[key] || "");
    const after = Array.isArray(currentJob?.[key])
      ? normalizeArrayField(currentJob[key])
      : String(currentJob?.[key] || "");

    const beforeComparable = Array.isArray(before) ? JSON.stringify(before) : before;
    const afterComparable = Array.isArray(after) ? JSON.stringify(after) : after;

    if (beforeComparable === afterComparable) continue;

    const preview = Array.isArray(before) || Array.isArray(after)
      ? buildArrayChangePreview(before, after)
      : {
          beforePreview: shortenPreview(before),
          afterPreview: shortenPreview(after),
        };

    changes.push({
      path: key,
      label,
      beforePreview: preview.beforePreview,
      afterPreview: preview.afterPreview,
    });
  }

  const previousContentHash = String(previousJob?.contentHash || "").trim();
  const currentContentHash = String(currentJob?.contentHash || "").trim();
  const previousContentPreview = String(previousJob?.contentPreview || "").trim();
  const currentContentPreview = String(currentJob?.contentPreview || "").trim();

  if (
    previousContentHash &&
    currentContentHash &&
    previousContentHash !== currentContentHash &&
    previousContentPreview !== currentContentPreview
  ) {
    changes.push({
      path: "contentPreview",
      label: "Page Content Preview",
      beforePreview: shortenPreview(previousContentPreview, 700),
      afterPreview: shortenPreview(currentContentPreview, 700),
    });
  }

  return changes;
};

const loadNotificationState = async (stateFilePath = DEFAULT_STATE_FILE_PATH) => {
  try {
    const content = await readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(content);
    return normalizeStateShape(parsed);
  } catch {
    return normalizeStateShape({});
  }
};

const saveNotificationState = async (state = {}, stateFilePath = DEFAULT_STATE_FILE_PATH) => {
  await mkdir(path.dirname(stateFilePath), { recursive: true });
  const serialized = `${JSON.stringify(state, null, 2)}\n`;
  const tempFilePath = `${stateFilePath}.tmp`;
  const backupFilePath = `${stateFilePath}.bak`;

  try {
    await copyFile(stateFilePath, backupFilePath);
  } catch {
    // First write or backup unavailable is acceptable.
  }

  await writeFile(tempFilePath, serialized, "utf8");
  await rename(tempFilePath, stateFilePath);
};

const parseNotificationTargets = (value = process.env.JOB_NOTIFICATION_TARGETS || "") => {
  const rawTargets = String(value || "").trim();
  if (!rawTargets) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTargets);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Error(`Invalid JOB_NOTIFICATION_TARGETS JSON: ${error?.message || error}`);
  }
};

const EMAIL_NOTIFICATIONS_ENABLED = toBoolean(
  process.env.JOB_UPDATE_EMAIL_NOTIFICATIONS_ENABLED,
  true
);
const NEW_POST_EMAIL_NOTIFICATIONS_ENABLED = toBoolean(
  process.env.NEW_POST_EMAIL_NOTIFICATIONS_ENABLED,
  EMAIL_NOTIFICATIONS_ENABLED
);
const SYSTEM_EVENT_EMAIL_NOTIFICATIONS_ENABLED = toBoolean(
  process.env.SYSTEM_EVENT_EMAIL_NOTIFICATIONS_ENABLED,
  EMAIL_NOTIFICATIONS_ENABLED
);
const SMTP_HOST = String(process.env.SMTP_HOST || "").trim();
const SMTP_PORT = Number.parseInt(String(process.env.SMTP_PORT || "465"), 10);
const SMTP_SECURE = toBoolean(process.env.SMTP_SECURE, true);
const SMTP_USER = String(process.env.SMTP_USER || "").trim();
const SMTP_PASS = String(process.env.SMTP_PASS || "").trim();
const EMAIL_FROM =
  String(process.env.EMAIL_FROM || "").trim() ||
  (SMTP_USER ? `SarkariAfsar <${SMTP_USER}>` : "");
const EMAIL_TO = String(process.env.EMAIL_TO || "")
  .split(",")
  .map((item) => String(item || "").trim())
  .filter(Boolean);

let transporter = null;

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number.isNaN(SMTP_PORT) ? 465 : SMTP_PORT,
    secure: SMTP_SECURE,
    auth:
      SMTP_USER && SMTP_PASS
        ? {
            user: SMTP_USER,
            pass: SMTP_PASS,
          }
        : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
  });

  return transporter;
};

const isMailerConfigured = () =>
  EMAIL_NOTIFICATIONS_ENABLED &&
  Boolean(SMTP_HOST) &&
  Boolean(EMAIL_FROM) &&
  EMAIL_TO.length > 0;

const classifyMailFailure = (error) => {
  const message = formatErrorMessage(error);
  const normalized = String(message || "").toLowerCase();

  if (
    normalized.includes("disabled by user from hpanel") ||
    (normalized.includes("554") && normalized.includes("5.7.1"))
  ) {
    return {
      reason: "provider_disabled",
      message,
    };
  }

  if (normalized.includes("auth") || normalized.includes("invalid login")) {
    return {
      reason: "auth_failed",
      message,
    };
  }

  if (
    normalized.includes("econnrefused") ||
    normalized.includes("etimedout") ||
    normalized.includes("ehostunreach") ||
    normalized.includes("esocket")
  ) {
    return {
      reason: "transport_unavailable",
      message,
    };
  }

  return {
    reason: "send_failed",
    message,
  };
};

const sendMailMessage = async ({
  subject = "",
  text = "",
  html = "",
  enabled = true,
} = {}) => {
  if (!enabled || !isMailerConfigured()) {
    return { sent: false, reason: "mailer_not_configured" };
  }

  const mailTransporter = getTransporter();
  try {
    const info = await mailTransporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject,
      text,
      html,
    });

    return {
      sent: true,
      messageId: info.messageId || "",
      accepted: Array.isArray(info.accepted) ? info.accepted : [],
      rejected: Array.isArray(info.rejected) ? info.rejected : [],
    };
  } catch (error) {
    const failure = classifyMailFailure(error);
    transporter = null;
    console.error(
      `[job-notification-mailer] ${failure.reason}: ${failure.message}`
    );

    return {
      sent: false,
      reason: failure.reason,
      error: failure.message,
      accepted: [],
      rejected: [],
    };
  }
};

const buildJobUpdateSubject = ({ jobTitle = "", changedFields = [] } = {}) => {
  const fields = changedFields.slice(0, 3).join(", ");
  return `${DEFAULT_SUBJECT_PREFIX} ${jobTitle}${fields ? ` | ${fields}` : ""}`;
};

const buildJobUpdateTextBody = ({
  jobTitle = "",
  jobUrl = "",
  matchedBy = "",
  changedFields = [],
  changes = [],
  omittedChangeCount = 0,
} = {}) => {
  const lines = [
    "Job update detected",
    "",
    `Title: ${jobTitle}`,
    `URL: ${jobUrl}`,
    `Matched By: ${matchedBy || "unknown"}`,
    `Changed Fields: ${changedFields.join(", ") || "unknown"}`,
    "",
    "Changes:",
  ];

  for (const change of changes) {
    lines.push(`- Field: ${change.path}`);
    lines.push(`  Before: ${change.beforePreview}`);
    lines.push(`  After: ${change.afterPreview}`);
  }

  if (omittedChangeCount > 0) {
    lines.push("");
    lines.push(`Additional changes omitted: ${omittedChangeCount}`);
  }

  return lines.join("\n");
};

const buildJobUpdateHtmlBody = ({
  jobTitle = "",
  jobUrl = "",
  matchedBy = "",
  changedFields = [],
  changes = [],
  omittedChangeCount = 0,
} = {}) => {
  const rows = changes
    .map(
      (change) => `
        <tr>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;"><strong>${escapeHtml(
            change.path
          )}</strong></td>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;white-space:pre-wrap;">${escapeHtml(
            change.beforePreview
          )}</td>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;white-space:pre-wrap;">${escapeHtml(
            change.afterPreview
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1f2328;line-height:1.5;">
      <h2 style="margin-bottom:8px;">Job update detected</h2>
      <p style="margin:0 0 6px;"><strong>Title:</strong> ${escapeHtml(jobTitle)}</p>
      <p style="margin:0 0 6px;"><strong>URL:</strong> <a href="${escapeHtml(
        jobUrl
      )}">${escapeHtml(jobUrl)}</a></p>
      <p style="margin:0 0 6px;"><strong>Matched By:</strong> ${escapeHtml(
        matchedBy || "unknown"
      )}</p>
      <p style="margin:0 0 16px;"><strong>Changed Fields:</strong> ${escapeHtml(
        changedFields.join(", ") || "unknown"
      )}</p>

      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">Field</th>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">Before</th>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">After</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${
        omittedChangeCount > 0
          ? `<p style="margin-top:12px;"><strong>Additional changes omitted:</strong> ${omittedChangeCount}</p>`
          : ""
      }
    </div>`;
};

export const sendJobUpdateNotification = async ({
  jobTitle = "",
  jobUrl = "",
  matchedBy = "",
  changedFields = [],
  changes = [],
  omittedChangeCount = 0,
} = {}) => {
  if (!isMailerConfigured()) {
    return { sent: false, reason: "mailer_not_configured" };
  }

  if (!Array.isArray(changes) || changes.length === 0) {
    return { sent: false, reason: "no_changes" };
  }

  const subject = buildJobUpdateSubject({ jobTitle, changedFields });
  return sendMailMessage({
    enabled: EMAIL_NOTIFICATIONS_ENABLED,
    subject,
    text: buildJobUpdateTextBody({
      jobTitle,
      jobUrl,
      matchedBy,
      changedFields,
      changes,
      omittedChangeCount,
    }),
    html: buildJobUpdateHtmlBody({
      jobTitle,
      jobUrl,
      matchedBy,
      changedFields,
      changes,
      omittedChangeCount,
    }),
  });
};

const buildNewPostsSubject = ({
  sectionName = "",
  count = 0,
} = {}) => `${DEFAULT_NEW_POST_SUBJECT_PREFIX} ${sectionName || "Jobs"} | ${count} new`;

const buildNewPostsTextBody = ({
  sectionName = "",
  newPosts = [],
  totalNewPosts = 0,
  omittedCount = 0,
} = {}) => {
  const lines = [
    "New posts detected",
    "",
    `Section: ${sectionName || "Unknown"}`,
    `New posts: ${totalNewPosts}`,
    "",
    "Posts:",
  ];

  for (const post of newPosts) {
    lines.push(`- ${post.title}`);
    if (Array.isArray(post.sourceSites) && post.sourceSites.length > 0) {
      lines.push(`  Sources: ${post.sourceSites.join(", ")}`);
    }
    if (post.applyLastDate) lines.push(`  Apply Last Date: ${post.applyLastDate}`);
    lines.push(`  URL: ${post.jobUrl}`);
  }

  if (omittedCount > 0) {
    lines.push("");
    lines.push(`Additional new posts omitted: ${omittedCount}`);
  }

  return lines.join("\n");
};

const buildNewPostsHtmlBody = ({
  sectionName = "",
  newPosts = [],
  totalNewPosts = 0,
  omittedCount = 0,
} = {}) => {
  const rows = newPosts
    .map(
      (post) => `
        <tr>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;"><strong>${escapeHtml(
            post.title
          )}</strong>${
            Array.isArray(post.sourceSites) && post.sourceSites.length > 0
              ? `<div style="margin-top:6px;color:#57606a;font-size:12px;">Sources: ${escapeHtml(
                  post.sourceSites.join(", ")
                )}</div>`
              : ""
          }</td>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;">${escapeHtml(
            post.applyLastDate || "-"
          )}</td>
          <td style="padding:10px;border:1px solid #d0d7de;vertical-align:top;"><a href="${escapeHtml(
            post.jobUrl
          )}">${escapeHtml(post.jobUrl)}</a></td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#1f2328;line-height:1.5;">
      <h2 style="margin-bottom:8px;">New posts detected</h2>
      <p style="margin:0 0 6px;"><strong>Section:</strong> ${escapeHtml(
        sectionName || "Unknown"
      )}</p>
      <p style="margin:0 0 16px;"><strong>New posts:</strong> ${escapeHtml(totalNewPosts)}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">Title</th>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">Apply Last Date</th>
            <th style="padding:10px;border:1px solid #d0d7de;background:#f6f8fa;text-align:left;">URL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${
        omittedCount > 0
          ? `<p style="margin-top:12px;"><strong>Additional new posts omitted:</strong> ${omittedCount}</p>`
          : ""
      }
    </div>`;
};

export const sendNewPostsNotification = async ({
  sectionName = "",
  newPosts = [],
  maxPosts = DEFAULT_NEW_POST_EMAIL_MAX_POSTS,
} = {}) => {
  if (!NEW_POST_EMAIL_NOTIFICATIONS_ENABLED) {
    return { sent: false, reason: "notifications_disabled" };
  }

  if (!Array.isArray(newPosts) || newPosts.length === 0) {
    return { sent: false, reason: "no_new_posts" };
  }

  const safeMaxPosts = Number.isFinite(Number(maxPosts))
    ? Math.max(1, Number(maxPosts))
    : DEFAULT_NEW_POST_EMAIL_MAX_POSTS;
  const selectedPosts = newPosts.slice(0, safeMaxPosts);
  const omittedCount = Math.max(0, newPosts.length - selectedPosts.length);
  const subject = buildNewPostsSubject({
    sectionName,
    count: newPosts.length,
  });

  return sendMailMessage({
    enabled: true,
    subject,
    text: buildNewPostsTextBody({
      sectionName,
      newPosts: selectedPosts,
      totalNewPosts: newPosts.length,
      omittedCount,
    }),
    html: buildNewPostsHtmlBody({
      sectionName,
      newPosts: selectedPosts,
      totalNewPosts: newPosts.length,
      omittedCount,
    }),
  });
};

const buildSystemEventTextBody = ({
  title = "",
  eventType = "",
  summary = "",
  details = {},
} = {}) => {
  const lines = [
    "System event detected",
    "",
    `Title: ${title || "Event"}`,
    `Type: ${eventType || "system"}`,
  ];

  if (summary) {
    lines.push(`Summary: ${summary}`);
  }

  if (details && typeof details === "object" && Object.keys(details).length > 0) {
    lines.push("");
    lines.push("Details:");
    lines.push(JSON.stringify(details, null, 2));
  }

  return lines.join("\n");
};

const buildSystemEventHtmlBody = ({
  title = "",
  eventType = "",
  summary = "",
  details = {},
} = {}) => `
  <div style="font-family:Arial,sans-serif;color:#1f2328;line-height:1.5;">
    <h2 style="margin-bottom:8px;">${escapeHtml(title || "System event detected")}</h2>
    <p style="margin:0 0 6px;"><strong>Type:</strong> ${escapeHtml(
      eventType || "system"
    )}</p>
    ${
      summary
        ? `<p style="margin:0 0 16px;"><strong>Summary:</strong> ${escapeHtml(summary)}</p>`
        : ""
    }
    ${
      details && typeof details === "object" && Object.keys(details).length > 0
        ? `<pre style="padding:12px;background:#f6f8fa;border:1px solid #d0d7de;white-space:pre-wrap;">${escapeHtml(
            JSON.stringify(details, null, 2)
          )}</pre>`
        : ""
    }
  </div>`;

export const sendSystemEventNotification = async ({
  title = "",
  eventType = "",
  summary = "",
  details = {},
} = {}) => {
  if (!SYSTEM_EVENT_EMAIL_NOTIFICATIONS_ENABLED) {
    return { sent: false, reason: "notifications_disabled" };
  }

  const subject = `${DEFAULT_SYSTEM_EVENT_SUBJECT_PREFIX} ${title || eventType || "System event"}`;
  return sendMailMessage({
    enabled: true,
    subject,
    text: buildSystemEventTextBody({
      title,
      eventType,
      summary,
      details,
    }),
    html: buildSystemEventHtmlBody({
      title,
      eventType,
      summary,
      details,
    }),
  });
};

export const scrapeSectionPostsForNotification = async ({
  sectionName = "",
  sectionUrl = "",
  sectionUrls = [],
  jobLinkPattern = null,
  skipLinkPatterns = [],
  limit = 0,
  requestConfig = {},
  enablePagination = true,
  paginationMaxPages = DEFAULT_SECTION_PAGINATION_MAX_PAGES,
  paginationMaxEmptyPages = DEFAULT_SECTION_PAGINATION_MAX_EMPTY_PAGES,
} = {}) => {
  const normalizedSectionUrls = toUniqueArray([
    ...toStringArray(sectionUrls),
    ...toStringArray(sectionUrl),
  ])
    .map((url) => toAbsoluteUrl(url, url))
    .filter(Boolean);

  if (normalizedSectionUrls.length === 0) {
    throw new Error("sectionUrl or sectionUrls is required");
  }

  const includePattern = createRegex(jobLinkPattern);
  const excludePatterns = [
    ...DEFAULT_JOB_SKIP_PATTERNS,
    ...createRegexList(skipLinkPatterns),
  ];
  const jobs = [];
  const seen = new Set();
  const safeMaxPages = enablePagination
    ? toPositiveInteger(paginationMaxPages, DEFAULT_SECTION_PAGINATION_MAX_PAGES)
    : 1;
  const safeMaxEmptyPages = toPositiveInteger(
    paginationMaxEmptyPages,
    DEFAULT_SECTION_PAGINATION_MAX_EMPTY_PAGES
  );

  for (const currentSectionUrl of normalizedSectionUrls) {
    if (limit > 0 && jobs.length >= limit) break;

    let emptyPages = 0;
    for (let pageNumber = 1; pageNumber <= safeMaxPages; pageNumber += 1) {
      if (limit > 0 && jobs.length >= limit) break;

      const pageUrl = toPaginatedSectionUrl(currentSectionUrl, pageNumber);
      const jobsBeforePage = jobs.length;
      const html = await fetchHtml(pageUrl, requestConfig);
      const $ = cheerio.load(html);
      const anchors = getJobAnchorCandidates($);

      for (const element of anchors) {
        if (limit > 0 && jobs.length >= limit) break;

        const $element = $(element);
        const href = $element.attr("href");
        const jobUrl = toAbsoluteUrl(href, pageUrl);
        if (!jobUrl) continue;
        if (isBlockedHostname(jobUrl)) continue;

        const rawTitle = toCleanText($element.text()) || toCleanText($element.attr("title"));
        const matchTarget = `${rawTitle} ${jobUrl}`.trim();
        if (!rawTitle) continue;
        if (isGenericListingTitle(rawTitle)) continue;
        if (includePattern && !includePattern.test(matchTarget)) continue;
        if (excludePatterns.some((pattern) => pattern.test(matchTarget))) continue;

        const post = buildJobRecord({
          title: rawTitle,
          jobUrl,
          sourceSectionUrl: pageUrl,
        });
        if (seen.has(post.dedupeHash)) continue;

        seen.add(post.dedupeHash);
        jobs.push(post);
      }

      const newJobsOnPage = jobs.length - jobsBeforePage;
      if (pageNumber === 1) {
        emptyPages = 0;
        continue;
      }

      if (newJobsOnPage === 0) {
        emptyPages += 1;
        if (emptyPages >= safeMaxEmptyPages) break;
      } else {
        emptyPages = 0;
      }
    }
  }

  return {
    sectionName: sectionName || null,
    sectionUrls: normalizedSectionUrls,
    requestConfig,
    totalPosts: jobs.length,
    posts: jobs,
    fetchedAt: new Date().toISOString(),
  };
};

export const notifyStandaloneSectionPosts = async ({
  sectionName = "",
  sectionUrl = "",
  sectionUrls = [],
  stateKey = "",
  stateFilePath = DEFAULT_STATE_FILE_PATH,
  jobLinkPattern = null,
  skipLinkPatterns = [],
  limit = 0,
  requestConfig = {},
  enablePagination = true,
  paginationMaxPages = DEFAULT_SECTION_PAGINATION_MAX_PAGES,
  paginationMaxEmptyPages = DEFAULT_SECTION_PAGINATION_MAX_EMPTY_PAGES,
  notifyOnFirstRun = false,
} = {}) => {
  const scrapeResult = await scrapeSectionPostsForNotification({
    sectionName,
    sectionUrl,
    sectionUrls,
    jobLinkPattern,
    skipLinkPatterns,
    limit,
    requestConfig,
    enablePagination,
    paginationMaxPages,
    paginationMaxEmptyPages,
  });

  const finalSectionName =
    String(sectionName || "").trim() ||
    inferSectionNameFromUrls(scrapeResult.sectionUrls);
  const finalStateKey =
    String(stateKey || "").trim() ||
    buildStateKey({
      sectionName: finalSectionName,
      sectionUrls: scrapeResult.sectionUrls,
    });
  const state = await loadNotificationState(stateFilePath);
  const previousSnapshot = state?.siteSnapshots?.[finalStateKey] || null;
  const previousHashes = new Set(
    ((previousSnapshot && previousSnapshot.posts) || [])
      .map((post) => String(post?.dedupeHash || "").trim())
      .filter(Boolean)
  );
  const previousPostsByUrl = new Map(
    ((previousSnapshot && previousSnapshot.posts) || [])
      .map((post) => [normalizeJobUrlForHash(post?.jobUrl || ""), post])
      .filter(([key]) => Boolean(key))
  );

  const newPosts = scrapeResult.posts.filter((post) => !previousHashes.has(post.dedupeHash));
  const updatedPosts = [];
  for (const post of scrapeResult.posts) {
    const key = normalizeJobUrlForHash(post?.jobUrl || "");
    if (!key) continue;
    const previousPost = previousPostsByUrl.get(key);
    if (!previousPost) continue;

    const changes = createUpdateChanges({
      previousPost,
      currentPost: post,
    });
    if (changes.length === 0) continue;

    updatedPosts.push({
      title: post.title,
      jobUrl: post.jobUrl,
      sourceSectionUrl: post.sourceSectionUrl,
      changedFields: changes.map((change) => change.label),
      changes,
    });
  }

  const shouldSendNewPostNotification = previousSnapshot
    ? newPosts.length > 0
    : notifyOnFirstRun && newPosts.length > 0;
  let newPostNotification = { sent: false, reason: "no_new_posts" };
  let updateNotifications = [];

  if (shouldSendNewPostNotification) {
    newPostNotification = await sendNewPostsNotification({
      sectionName: finalSectionName,
      newPosts,
    });
  }

  for (const post of updatedPosts) {
    const response = await sendJobUpdateNotification({
      jobTitle: post.title,
      jobUrl: post.jobUrl,
      matchedBy: finalSectionName,
      changedFields: post.changedFields,
      changes: post.changes,
      omittedChangeCount: 0,
    });
    updateNotifications.push({
      jobUrl: post.jobUrl,
      title: post.title,
      response,
    });
  }

  const nextState = normalizeStateShape(state);
  nextState.siteSnapshots[finalStateKey] = {
    sectionName: finalSectionName,
    sectionUrls: scrapeResult.sectionUrls,
    updatedAt: new Date().toISOString(),
    totalPosts: scrapeResult.totalPosts,
    posts: scrapeResult.posts,
  };
  await saveNotificationState(nextState, stateFilePath);

  return {
    sent: Boolean(newPostNotification?.sent) || updateNotifications.some((item) => item?.response?.sent),
    sectionName: finalSectionName,
    stateKey: finalStateKey,
    totalPosts: scrapeResult.totalPosts,
    newPosts: newPosts.length,
    updatedPosts: updatedPosts.length,
    stateFilePath,
    newJobNotification: {
      sent: Boolean(newPostNotification?.sent),
      total: newPosts.length,
      response: newPostNotification,
    },
    updateJobNotification: {
      sent: updateNotifications.some((item) => item?.response?.sent),
      total: updatedPosts.length,
      responses: updateNotifications,
    },
  };
};

export const runStandaloneJobNotifications = async ({
  targets = [],
  stateFilePath = DEFAULT_STATE_FILE_PATH,
  notifyOnFirstRun = false,
} = {}) => {
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("targets array is required");
  }

  const state = await loadNotificationState(stateFilePath);
  const previousTrackedJobs = state?.trackedJobs || {};
  const siteSnapshots = { ...(state?.siteSnapshots || {}) };
  const siteResults = [];
  const errors = [];

  for (const target of targets) {
    try {
      const siteResult = await scrapeSectionPostsForNotification({
        ...target,
      });
      const finalSectionName =
        String(target?.sectionName || "").trim() ||
        inferSectionNameFromUrls(siteResult.sectionUrls);
      const siteKey =
        String(target?.stateKey || "").trim() ||
        buildStateKey({
          sectionName: finalSectionName,
          sectionUrls: siteResult.sectionUrls,
        });

      const normalizedSiteResult = {
        siteKey,
        sectionName: finalSectionName,
        sectionUrls: siteResult.sectionUrls,
        requestConfig: target?.requestConfig || {},
        totalPosts: siteResult.totalPosts,
        posts: siteResult.posts,
        fetchedAt: siteResult.fetchedAt,
      };

      siteSnapshots[siteKey] = {
        sectionName: finalSectionName,
        sectionUrls: siteResult.sectionUrls,
        updatedAt: new Date().toISOString(),
        totalPosts: siteResult.totalPosts,
        posts: siteResult.posts,
      };
      siteResults.push(normalizedSiteResult);
    } catch (error) {
      const finalSectionName =
        String(target?.sectionName || "").trim() ||
        inferSectionNameFromUrls(toStringArray(target?.sectionUrls || target?.sectionUrl || []));
      errors.push({
        sectionName: finalSectionName,
        sectionUrls: toStringArray(target?.sectionUrls || target?.sectionUrl || []),
        error: formatErrorMessage(error),
      });
    }
  }

  const mergedSiteResults = Object.entries(siteSnapshots).map(([siteKey, snapshot]) => ({
    siteKey,
    sectionName: snapshot?.sectionName || "",
    sectionUrls: snapshot?.sectionUrls || [],
    requestConfig: {},
    totalPosts: Number(snapshot?.totalPosts || 0),
    posts: Array.isArray(snapshot?.posts) ? snapshot.posts : [],
    fetchedAt: snapshot?.updatedAt || "",
  }));

  const trackedJobsList = await aggregateTrackedJobs({
    siteResults: mergedSiteResults,
    previousTrackedJobs,
  });
  const nextTrackedJobs = Object.fromEntries(
    trackedJobsList.map((job) => [job.entityKey, job])
  );

  const newJobs = [];
  const updatedJobs = [];
  for (const job of trackedJobsList) {
    const previousJob = previousTrackedJobs[job.entityKey];
    if (!previousJob) {
      newJobs.push(job);
      continue;
    }

    const changes = buildTrackedJobChanges({
      previousJob,
      currentJob: job,
    });
    if (changes.length === 0) continue;

    updatedJobs.push({
      ...job,
      changedFields: changes.map((change) => change.label),
      changes,
    });
  }

  const shouldSendNewPostNotification =
    Object.keys(previousTrackedJobs).length > 0
      ? newJobs.length > 0
      : notifyOnFirstRun && newJobs.length > 0;
  let newPostNotification = { sent: false, reason: "no_new_posts" };
  let updateNotifications = [];
  const deliveryLogEntries = [];
  const pendingDeliveryEntries = [];
  const successfulDeliveryKeys = new Set();

  if (shouldSendNewPostNotification) {
    newPostNotification = await sendNewPostsNotification({
      sectionName: "Tracked Sources",
      newPosts: newJobs.map((job) => ({
        title: job.title,
        jobUrl: job.jobUrl,
        sourceSites: job.sourceSites,
      })),
    });

    const deliveryEntry = createNotificationDeliveryEntry({
      type: "new_jobs",
      sectionName: "Tracked Sources",
      title: `${newJobs.length} new jobs detected`,
      sourceSites: newJobs.flatMap((job) => job.sourceSites || []),
      response: newPostNotification,
    });
    deliveryLogEntries.push(deliveryEntry);

    if (deliveryEntry.status === "sent") {
      successfulDeliveryKeys.add(deliveryEntry.deliveryKey);
    } else {
      pendingDeliveryEntries.push({
        ...deliveryEntry,
        payload: {
          totalJobs: newJobs.length,
          jobs: newJobs.map((job) => ({
            title: job.title,
            jobUrl: job.jobUrl,
            sourceSites: job.sourceSites,
          })),
        },
      });
    }
  }

  for (const job of updatedJobs) {
    const response = await sendJobUpdateNotification({
      jobTitle: job.title,
      jobUrl: job.jobUrl,
      matchedBy: job.sourceSites.join(", ") || "tracked_sources",
      changedFields: job.changedFields,
      changes: job.changes,
      omittedChangeCount: 0,
    });
    const deliveryEntry = createNotificationDeliveryEntry({
      type: "job_update",
      sectionName: job.sourceSites.join(", ") || "tracked_sources",
      title: job.title,
      jobUrl: job.jobUrl,
      sourceSites: job.sourceSites,
      changedFields: job.changedFields,
      response,
    });
    deliveryLogEntries.push(deliveryEntry);

    if (deliveryEntry.status === "sent") {
      successfulDeliveryKeys.add(deliveryEntry.deliveryKey);
    } else {
      pendingDeliveryEntries.push({
        ...deliveryEntry,
        payload: {
          changes: job.changes,
        },
      });
    }

    updateNotifications.push({
      jobUrl: job.jobUrl,
      title: job.title,
      response,
      delivery: deliveryEntry,
    });
  }

  const pendingDeliveryKeys = new Set(
    pendingDeliveryEntries.map((entry) => String(entry?.deliveryKey || "").trim()).filter(Boolean)
  );
  const preservedPendingNotifications = (state?.pendingNotifications || []).filter((entry) => {
    const deliveryKey = String(entry?.deliveryKey || "").trim();
    if (!deliveryKey) return true;
    if (successfulDeliveryKeys.has(deliveryKey)) return false;
    if (pendingDeliveryKeys.has(deliveryKey)) return false;
    return true;
  });
  const deliverySummary = {
    attempted: deliveryLogEntries.length,
    sent: deliveryLogEntries.filter((entry) => entry.status === "sent").length,
    pending: pendingDeliveryEntries.length,
    failures: pendingDeliveryEntries.map((entry) => ({
      type: entry.type,
      reason: entry.reason,
      title: entry.title,
      jobUrl: entry.jobUrl,
    })),
  };

  const nextState = {
    meta: {
      version: 2,
      updatedAt: new Date().toISOString(),
      targetsConfigured: targets.length,
      targetsSucceeded: siteResults.length,
      targetsFailed: errors.length,
      lastSuccessfulRunAt:
        siteResults.length > 0
          ? new Date().toISOString()
          : state?.meta?.lastSuccessfulRunAt || null,
    },
    siteSnapshots,
    trackedJobs: nextTrackedJobs,
    lastRun: {
      updatedAt: new Date().toISOString(),
      totalUniqueJobs: trackedJobsList.length,
      newJobs: newJobs.length,
      updatedJobs: updatedJobs.length,
      processedTargets: siteResults.length,
      preservedSnapshots: Math.max(0, Object.keys(siteSnapshots).length - siteResults.length),
      delivery: deliverySummary,
      errors,
    },
    runHistory: appendRunHistory(state?.runHistory, {
      updatedAt: new Date().toISOString(),
      processedTargets: siteResults.length,
      failedTargets: errors.length,
      totalUniqueJobs: trackedJobsList.length,
      newJobs: newJobs.length,
      updatedJobs: updatedJobs.length,
      deliveryPending: deliverySummary.pending,
      deliverySent: deliverySummary.sent,
    }),
    deliveryLog: appendLimitedEntries(
      state?.deliveryLog,
      deliveryLogEntries,
      DEFAULT_DELIVERY_LOG_LIMIT
    ),
    pendingNotifications: appendLimitedEntries(
      preservedPendingNotifications,
      pendingDeliveryEntries,
      DEFAULT_PENDING_NOTIFICATION_LIMIT
    ),
  };
  await saveNotificationState(nextState, stateFilePath);

  if (errors.length > 0) {
    try {
      await sendSystemEventNotification({
        title: "Job Notification Target Failures",
        eventType: "job_notification_partial_failure",
        summary: `${errors.length} target(s) failed, ${siteResults.length} target(s) succeeded`,
        details: {
          errors,
          processedTargets: siteResults.length,
          configuredTargets: targets.length,
        },
      });
    } catch {
      // Best-effort notification only.
    }
  }

  return {
    targets: targets.length,
    processedTargets: siteResults.length,
    failedTargets: errors.length,
    sentCount:
      (newPostNotification?.sent ? 1 : 0) +
      updateNotifications.filter((item) => item?.response?.sent).length,
    sent:
      Boolean(newPostNotification?.sent) ||
      updateNotifications.some((item) => item?.response?.sent),
    totalUniqueJobs: trackedJobsList.length,
    newJobs: newJobs.length,
    updatedJobs: updatedJobs.length,
    errors,
    delivery: deliverySummary,
    newJobNotification: {
      sent: Boolean(newPostNotification?.sent),
      total: newJobs.length,
      response: newPostNotification,
    },
    updateJobNotification: {
      sent: updateNotifications.some((item) => item?.response?.sent),
      total: updatedJobs.length,
      responses: updateNotifications,
    },
    results: mergedSiteResults.map((site) => ({
      sectionName: site.sectionName,
      totalPosts: site.totalPosts,
      fetchedAt: site.fetchedAt,
    })),
  };
};

let cronTask = null;
let cronRunning = false;

export const runStandaloneJobNotificationsCronJob = async ({
  targets = [],
  stateFilePath = DEFAULT_STATE_FILE_PATH,
  notifyOnFirstRun = false,
} = {}) => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const result = await runStandaloneJobNotifications({
      targets,
      stateFilePath,
      notifyOnFirstRun,
    });

    return {
      ...result,
      skipped: false,
      durationMs: Date.now() - startedAt,
    };
  } finally {
    cronRunning = false;
  }
};

export const startStandaloneJobNotificationCron = ({
  schedule = process.env.JOB_NOTIFICATION_CRON_SCHEDULE || "*/30 * * * *",
  timezone = process.env.JOB_NOTIFICATION_CRON_TIMEZONE || "Asia/Kolkata",
  enabled = toBoolean(process.env.JOB_NOTIFICATION_CRON_ENABLED, true),
  runOnStart = toBoolean(process.env.JOB_NOTIFICATION_CRON_RUN_ON_START, true),
  targets = parseNotificationTargets(),
  stateFilePath = DEFAULT_STATE_FILE_PATH,
  notifyOnFirstRun = toBoolean(process.env.JOB_NOTIFICATION_NOTIFY_ON_FIRST_RUN, false),
} = {}) => {
  if (cronTask) return cronTask;
  if (!enabled) return null;
  if (!Array.isArray(targets) || targets.length === 0) {
    console.warn(
      "[job-notification-cron] skipped start because JOB_NOTIFICATION_TARGETS is empty"
    );
    return null;
  }
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid notification cron schedule: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runStandaloneJobNotificationsCronJob({
        targets,
        stateFilePath,
        notifyOnFirstRun,
      })
        .then((result) => {
          console.log(
            `[job-notification-cron] completed in ${result.durationMs}ms | targets=${result.targets} sent=${result.sent} pendingMail=${result.delivery?.pending || 0}`
          );
        })
        .catch((error) => {
          console.error(`[job-notification-cron] ${error?.message || error}`);
        });
    },
    { timezone }
  );

  console.log(
    `[job-notification-cron] started (${schedule}, timezone=${timezone})`
  );

  if (runOnStart) {
    setTimeout(() => {
      runStandaloneJobNotificationsCronJob({
        targets,
        stateFilePath,
        notifyOnFirstRun,
      })
        .then((result) => {
          console.log(
            `[job-notification-cron] initial run completed in ${result.durationMs}ms | targets=${result.targets} sent=${result.sent} pendingMail=${result.delivery?.pending || 0}`
          );
        })
        .catch((error) => {
          console.error(`[job-notification-cron] initial run failed: ${error?.message || error}`);
        });
    }, 1500);
  }

  return cronTask;
};

export const stopStandaloneJobNotificationCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

const runFromCli = async () => {
  const shouldRunCron =
    process.argv.includes("--cron") || process.argv.includes("cron");
  const targets = parseNotificationTargets();
  if (targets.length === 0) {
    throw new Error("JOB_NOTIFICATION_TARGETS env is required");
  }
  const notifyOnFirstRun = toBoolean(process.env.JOB_NOTIFICATION_NOTIFY_ON_FIRST_RUN, false);

  if (shouldRunCron) {
    startStandaloneJobNotificationCron({
      targets,
      stateFilePath: DEFAULT_STATE_FILE_PATH,
      notifyOnFirstRun,
    });
    return;
  }

  const result = await runStandaloneJobNotifications({
    targets,
    stateFilePath: DEFAULT_STATE_FILE_PATH,
    notifyOnFirstRun,
  });

  console.log(JSON.stringify(result, null, 2));
};

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runFromCli().catch((error) => {
    console.error(`[job-notification] ${error?.message || error}`);
    process.exitCode = 1;
  });
}

export default {
  sendJobUpdateNotification,
  sendNewPostsNotification,
  sendSystemEventNotification,
  scrapeSectionPostsForNotification,
  notifyStandaloneSectionPosts,
  runStandaloneJobNotifications,
  runStandaloneJobNotificationsCronJob,
  startStandaloneJobNotificationCron,
  stopStandaloneJobNotificationCron,
};
