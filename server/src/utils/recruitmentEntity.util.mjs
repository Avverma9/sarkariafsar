import crypto from "node:crypto";

const TITLE_STOPWORDS = [
  "online form",
  "apply",
  "admit card",
  "result",
  "answer key",
  "download",
  "notification",
  "recruitment",
  "vacancy",
  "latest",
];

function cleanText(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function sha1(v) {
  return crypto.createHash("sha1").update(String(v || ""), "utf8").digest("hex");
}

export function normalizeTitleBase(title = "") {
  let t = cleanText(title);
  t = t.replace(/\b20\d{2}\b/g, " ");
  t = t.replace(/[^a-z0-9\s]/g, " ");
  for (const kw of TITLE_STOPWORDS) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    t = t.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function parseEventDate(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  let m = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  m = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (m) {
    const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const direct = new Date(raw);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function getRecruitmentRoot(aiData = {}) {
  if (aiData?.recruitment && typeof aiData.recruitment === "object") return aiData.recruitment;
  if (aiData && typeof aiData === "object") return aiData;
  return {};
}

function pickLink(importantLinks = {}, keys = []) {
  for (const key of keys) {
    const v = String(importantLinks?.[key] || "").trim();
    if (v) return v;
  }
  return "";
}

function eventSignatureHash(eventType, eventDate, linkUrl, label) {
  const dateStr = eventDate instanceof Date ? eventDate.toISOString().slice(0, 10) : "";
  return sha1(`${eventType}|${dateStr}|${String(linkUrl || "").trim()}|${String(label || "").trim()}`);
}

export function buildRecruitmentKey(aiData = {}) {
  const r = getRecruitmentRoot(aiData);
  const orgShort = String(r?.organization?.shortName || "").trim().toLowerCase();
  const orgName = String(r?.organization?.name || "").trim().toLowerCase();
  const org = orgShort || orgName || "unknown-org";
  const advt = String(r?.advertisementNumber || "").trim().toLowerCase();
  const titleBase = normalizeTitleBase(r?.title || "");
  return sha1(`${org}|${advt}|${titleBase}`);
}

export function buildEventSignatures(aiData = {}) {
  const r = getRecruitmentRoot(aiData);
  const importantDates = r?.importantDates || {};
  const importantLinks = r?.importantLinks || {};
  const sourceUrl = String(r?.sourceUrl || aiData?.sourceUrl || "").trim();

  const candidates = [
    {
      eventType: "APPLICATION",
      eventDateRaw: importantDates?.applicationStartDate,
      label: "Application Start",
      linkUrl: pickLink(importantLinks, ["applyOnline", "officialWebsite"]),
    },
    {
      eventType: "DEADLINE",
      eventDateRaw: importantDates?.applicationLastDate,
      label: "Application Last Date",
      linkUrl: pickLink(importantLinks, ["applyOnline", "officialWebsite"]),
    },
    {
      eventType: "ADMIT_CARD",
      eventDateRaw: importantDates?.admitCardDate,
      label: "Admit Card",
      linkUrl: pickLink(importantLinks, ["admitCard", "officialWebsite"]),
    },
    {
      eventType: "RESULT",
      eventDateRaw: importantDates?.resultDate,
      label: "Result",
      linkUrl: pickLink(importantLinks, ["resultLink", "officialWebsite"]),
    },
    {
      eventType: "ANSWER_KEY",
      eventDateRaw: importantDates?.answerKeyReleaseDate || importantDates?.finalAnswerKeyDate,
      label: importantDates?.finalAnswerKeyDate ? "Final Answer Key" : "Answer Key",
      linkUrl: pickLink(importantLinks, ["answerKey", "officialWebsite"]),
    },
  ];

  const events = [];
  for (const c of candidates) {
    const eventDate = parseEventDate(c.eventDateRaw);
    const linkUrl = String(c.linkUrl || "").trim();
    if (!eventDate && !linkUrl) continue;

    const signatureHash = eventSignatureHash(c.eventType, eventDate, linkUrl, c.label);
    events.push({
      eventType: c.eventType,
      eventDate: eventDate || null,
      label: c.label,
      linkUrl,
      payload: {
        sourceUrl,
        importantDates,
        importantLinks,
      },
      signatureHash,
    });
  }

  return events;
}
