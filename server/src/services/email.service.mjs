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

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
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

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER;
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

  const from = getFromAddress();
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

export async function sendAdminPasswordResetOtpEmail({
  to,
  name,
  otp,
  expiresInMinutes,
}) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured for sending OTP emails");
  }

  const safeName = String(name || "Admin").trim();
  const safeOtp = String(otp || "").trim();
  const ttl = Math.max(1, Number(expiresInMinutes) || 10);

  const subject = "Admin Password Reset OTP";
  const text = [
    `Hello ${safeName},`,
    "",
    "Use the OTP below to reset your admin password:",
    safeOtp,
    "",
    `This OTP expires in ${ttl} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = [
    `<p>Hello ${safeName},</p>`,
    "<p>Use the OTP below to reset your admin password:</p>",
    `<p><strong style=\"font-size:20px;letter-spacing:3px;\">${safeOtp}</strong></p>`,
    `<p>This OTP expires in <strong>${ttl} minutes</strong>.</p>`,
    "<p>If you did not request this, you can ignore this email.</p>",
  ].join("");

  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
}

