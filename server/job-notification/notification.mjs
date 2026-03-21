import axios from "axios";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const DEFAULT_STATE_FILE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  String(process.env.JOB_NOTIFICATION_STATE_FILE || "").trim() || ".notification-state.json"
);
const DEFAULT_SECTION_PAGINATION_MAX_PAGES = 25;
const DEFAULT_SECTION_PAGINATION_MAX_EMPTY_PAGES = 2;

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

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

const fetchHtml = async (url, requestConfig = {}) => {
  const response = await axios.get(url, {
    timeout: 30000,
    headers: DEFAULT_HEADERS,
    responseType: "text",
    transformResponse: [(data) => data],
    ...requestConfig,
  });

  return typeof response.data === "string" ? response.data : String(response.data || "");
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

const loadNotificationState = async (stateFilePath = DEFAULT_STATE_FILE_PATH) => {
  try {
    const content = await readFile(stateFilePath, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return {};
  }

  return {};
};

const saveNotificationState = async (state = {}, stateFilePath = DEFAULT_STATE_FILE_PATH) => {
  await mkdir(path.dirname(stateFilePath), { recursive: true });
  await writeFile(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
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
          )}</strong></td>
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

        const rawTitle = toCleanText($element.text()) || toCleanText($element.attr("title"));
        const matchTarget = `${rawTitle} ${jobUrl}`.trim();
        if (!rawTitle) continue;
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
  const previousSnapshot = state[finalStateKey] || null;
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

  state[finalStateKey] = {
    sectionName: finalSectionName,
    sectionUrls: scrapeResult.sectionUrls,
    updatedAt: new Date().toISOString(),
    totalPosts: scrapeResult.totalPosts,
    posts: scrapeResult.posts,
  };
  await saveNotificationState(state, stateFilePath);

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

  const results = [];
  for (const target of targets) {
    results.push(
      await notifyStandaloneSectionPosts({
        ...target,
        stateFilePath,
        notifyOnFirstRun:
          typeof target?.notifyOnFirstRun === "boolean"
            ? target.notifyOnFirstRun
            : notifyOnFirstRun,
      })
    );
  }

  return {
    targets: results.length,
    sent: results.filter((item) => item.sent).length,
    results,
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
  targets = [],
  stateFilePath = DEFAULT_STATE_FILE_PATH,
  notifyOnFirstRun = false,
} = {}) => {
  if (cronTask) return cronTask;
  if (!enabled) return null;
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
            `[job-notification-cron] completed in ${result.durationMs}ms | targets=${result.targets} sent=${result.sent}`
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
            `[job-notification-cron] initial run completed in ${result.durationMs}ms | targets=${result.targets} sent=${result.sent}`
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
  const rawTargets = String(process.env.JOB_NOTIFICATION_TARGETS || "").trim();
  if (!rawTargets) {
    throw new Error("JOB_NOTIFICATION_TARGETS env is required");
  }

  let targets = [];
  try {
    targets = JSON.parse(rawTargets);
  } catch (error) {
    throw new Error(`Invalid JOB_NOTIFICATION_TARGETS JSON: ${error?.message || error}`);
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
