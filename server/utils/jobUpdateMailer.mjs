import nodemailer from "nodemailer";

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

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
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
  .map((item) => item.trim())
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

const buildSubject = ({ jobTitle = "", changedFields = [] } = {}) => {
  const fields = changedFields.slice(0, 3).join(", ");
  return `${DEFAULT_SUBJECT_PREFIX} ${jobTitle}${fields ? ` | ${fields}` : ""}`;
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

const buildTextBody = ({
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

const buildHtmlBody = ({
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

  const subject = buildSubject({ jobTitle, changedFields });
  return sendMailMessage({
    enabled: EMAIL_NOTIFICATIONS_ENABLED,
    subject,
    text: buildTextBody({
      jobTitle,
      jobUrl,
      matchedBy,
      changedFields,
      changes,
      omittedChangeCount,
    }),
    html: buildHtmlBody({
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

export default {
  sendJobUpdateNotification,
  sendNewPostsNotification,
  sendSystemEventNotification,
};
