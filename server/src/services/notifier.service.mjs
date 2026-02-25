import nodemailer from "nodemailer";
import mongoose from "mongoose";
import NotifyLog from "../models/notifyLog.model.mjs";
import UserWatch from "../models/userWatch.model.mjs";
import Recruitment from "../models/recruitment.model.mjs";
import MegaPost from "../models/megaPost.model.mjs";
import logger from "../utils/logger.mjs";

let transporter = null;

function formatDateYmdLocal(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

async function sendMail({ to, subject, html, text }) {
  if (!to) return { sent: false, reason: "recipient-missing" };
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { sent: false, reason: "smtp-not-configured" };
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

function renderEmail({ recruitment, event, sourceUrl }) {
  const title = String(recruitment?.title || "Recruitment Update");
  const eventType = String(event?.eventType || "UPDATE");
  const eventDate = formatDateYmdLocal(event?.eventDate) || "Not specified";
  const link = String(event?.linkUrl || "");

  const subject = `[Recruitment Update] ${title} - ${eventType}`;
  const text = [
    `Recruitment: ${title}`,
    `Event: ${eventType}`,
    `Date: ${eventDate}`,
    `Label: ${event?.label || ""}`,
    `Link: ${link || "Not specified"}`,
    `Source: ${sourceUrl || "Not specified"}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h3 style="margin:0 0 8px">${title}</h3>
      <p style="margin:0 0 4px"><strong>Event:</strong> ${eventType}</p>
      <p style="margin:0 0 4px"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin:0 0 4px"><strong>Label:</strong> ${event?.label || ""}</p>
      <p style="margin:0 0 4px"><strong>Link:</strong> ${link ? `<a href="${link}">${link}</a>` : "Not specified"}</p>
      <p style="margin:0"><strong>Source:</strong> ${sourceUrl || "Not specified"}</p>
    </div>
  `;

  return { subject, text, html };
}

export async function notifyWatchers(recruitmentId, insertedEvents = []) {
  const recruitmentIdRaw = String(recruitmentId || "").trim();
  if (!mongoose.Types.ObjectId.isValid(recruitmentIdRaw)) {
    throw new Error("Valid recruitmentId is required");
  }
  if (!Array.isArray(insertedEvents) || !insertedEvents.length) {
    return { watchers: 0, events: 0, sent: 0, skipped: 0, failed: 0 };
  }
  const recruitmentObjectId = new mongoose.Types.ObjectId(recruitmentIdRaw);

  const sourcePostIds = [
    ...new Set(
      insertedEvents
        .map((ev) => String(ev?.sourcePostId || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  ];

  const [watchers, recruitment, sourcePosts] = await Promise.all([
    UserWatch.find({ recruitmentId: recruitmentObjectId, enabled: true }).lean(),
    Recruitment.findById(recruitmentObjectId).lean(),
    sourcePostIds.length
      ? MegaPost.find({ _id: { $in: sourcePostIds } })
          .select("_id originalUrl")
          .lean()
      : [],
  ]);
  const sourceUrlByPostId = new Map(
    sourcePosts.map((row) => [String(row._id), String(row.originalUrl || "").trim()]),
  );

  if (!watchers.length) return { watchers: 0, events: insertedEvents.length, sent: 0, skipped: 0, failed: 0 };

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const w of watchers) {
    if (w?.channels?.email === false) {
      skipped += insertedEvents.length;
      continue;
    }

    const to = String(w.email || "").trim().toLowerCase();
    if (!to) {
      skipped += insertedEvents.length;
      continue;
    }

    for (const ev of insertedEvents) {
      const eventKey = `${ev.eventType}:${ev.signatureHash}`;
      const eventSourcePostId = String(ev?.sourcePostId || "").trim();
      const sourceUrl = String(
        sourceUrlByPostId.get(eventSourcePostId) ||
          ev?.payload?.sourceUrl ||
          recruitment?.canonicalSourceUrl ||
          "",
      );
      const notifyLogQuery = {
        email: to,
        recruitmentId: recruitmentObjectId,
        eventKey,
      };
      let logCreated = false;

      try {
        await NotifyLog.create({
          ...notifyLogQuery,
          eventKey,
          sentAt: new Date(),
          meta: {
            eventType: ev.eventType,
            signatureHash: ev.signatureHash,
            sourceUrl,
          },
        });
        logCreated = true;

        const mail = renderEmail({ recruitment, event: ev, sourceUrl });
        const mailRes = await sendMail({
          to,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        if (mailRes.sent) {
          sent++;
        } else {
          skipped++;
          if (logCreated) {
            await NotifyLog.deleteOne(notifyLogQuery).catch((cleanupErr) => {
              logger.warn(
                `NotifyLog rollback failed. recruitmentId=${recruitmentIdRaw} email=${to} event=${eventKey}: ${cleanupErr.message}`,
              );
            });
          }
        }
      } catch (err) {
        if (err?.code === 11000) {
          skipped++;
          continue;
        }
        failed++;
        if (logCreated) {
          await NotifyLog.deleteOne(notifyLogQuery).catch((cleanupErr) => {
            logger.warn(
              `NotifyLog rollback failed. recruitmentId=${recruitmentIdRaw} email=${to} event=${eventKey}: ${cleanupErr.message}`,
            );
          });
        }
        logger.error(`Watcher notification failed. recruitmentId=${recruitmentId} email=${to} event=${eventKey}: ${err.message}`);
      }
    }
  }

  return {
    watchers: watchers.length,
    events: insertedEvents.length,
    sent,
    skipped,
    failed,
  };
}
