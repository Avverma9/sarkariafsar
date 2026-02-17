import nodemailer from "nodemailer";
import logger from "../utils/logger.mjs";

let transporter = null;

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_TO,
  );
}

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function formatChanges(changes = []) {
  if (!changes.length) return "No tracked field changes.";
  return changes
    .map(
      (c, idx) =>
        `${idx + 1}. ${c.field}\n   Old: ${c.oldValue || "(empty)"}\n   New: ${c.newValue || "(empty)"}`,
    )
    .join("\n");
}

export async function sendPostUpdateNotification({
  postId,
  title,
  oldUrl,
  newUrl,
  pageHashOld,
  pageHashNew,
  score,
  changes = [],
}) {
  if (!isEmailConfigured()) {
    logger.warn("Email notification skipped: SMTP/EMAIL env not configured");
    return { sent: false, reason: "email-not-configured" };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const to = process.env.EMAIL_TO;
  const subject = `[Post Update] ${title || "Recruitment post updated"}`;

  const text = [
    "Recruitment post update detected.",
    "",
    `Post ID: ${postId}`,
    `Title: ${title || ""}`,
    `Match Score: ${score}`,
    `Old URL: ${oldUrl || ""}`,
    `New URL: ${newUrl || ""}`,
    `Old Hash: ${pageHashOld || ""}`,
    `New Hash: ${pageHashNew || ""}`,
    "",
    "Changed Fields:",
    formatChanges(changes),
  ].join("\n");

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text,
  });

  return { sent: true };
}

