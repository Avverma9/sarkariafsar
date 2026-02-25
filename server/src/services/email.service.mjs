import nodemailer from "nodemailer";
import logger from "../utils/logger.mjs";

let transporter = null;

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getNotificationRecipients() {
  return Array.from(
    new Set(
      String(process.env.EMAIL_TO || "")
        .split(/[,\n;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function isEmailConfigured() {
  return isSmtpConfigured() && getNotificationRecipients().length > 0;
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

function formatChangesHtml(changes = []) {
  if (!changes.length) {
    return "<p style=\"margin:0 0 8px\">No tracked field changes.</p>";
  }

  const rows = changes
    .map((c, idx) => {
      const field = String(c?.field || "");
      const oldValue = String(c?.oldValue || "(empty)");
      const newValue = String(c?.newValue || "(empty)");
      return `<tr>
  <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top">${idx + 1}</td>
  <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top">${field}</td>
  <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top">${oldValue}</td>
  <td style="padding:8px;border:1px solid #e5e7eb;vertical-align:top">${newValue}</td>
</tr>`;
    })
    .join("");

  return `<table style="border-collapse:collapse;width:100%;font-size:13px">
  <thead>
    <tr>
      <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">#</th>
      <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Field</th>
      <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Old</th>
      <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">New</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
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
  const to = getNotificationRecipients();
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

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h3 style="margin:0 0 10px">Recruitment post update detected</h3>
      <p style="margin:0 0 6px"><strong>Post ID:</strong> ${postId}</p>
      <p style="margin:0 0 6px"><strong>Title:</strong> ${title || ""}</p>
      <p style="margin:0 0 6px"><strong>Match Score:</strong> ${score}</p>
      <p style="margin:0 0 6px"><strong>Old URL:</strong> ${oldUrl || ""}</p>
      <p style="margin:0 0 6px"><strong>New URL:</strong> ${newUrl || ""}</p>
      <p style="margin:0 0 6px"><strong>Old Hash:</strong> ${pageHashOld || ""}</p>
      <p style="margin:0 0 12px"><strong>New Hash:</strong> ${pageHashNew || ""}</p>
      <h4 style="margin:12px 0 8px">Changed Fields</h4>
      ${formatChangesHtml(changes)}
    </div>
  `;

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text,
    html,
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
