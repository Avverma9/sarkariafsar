import crypto from "crypto";
import { parseJobDetailsFromText } from "../services/postparse.service.mjs";

const TRACKED_PATHS = [
  "title",
  "advertisementNumber",
  "totalPosts",
  "dates.postDate",
  "dates.applicationStartDate",
  "dates.applicationLastDate",
  "dates.examDate",
  "dates.resultDate",
  "fee.generalObc",
  "fee.scSt",
  "age.min",
  "age.max",
  "links.applyOnline",
  "links.officialNotification",
];

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function getByPath(obj, path) {
  const keys = String(path || "").split(".");
  let cur = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== "object") return "";
    cur = cur[key];
  }
  return cur ?? "";
}

function pickNotificationLink(importantLinks = []) {
  for (const link of importantLinks) {
    const text = normalizeText(link?.text).toLowerCase();
    const url = normalizeText(link?.url);
    if (!url) continue;
    if (text.includes("notification") || text.includes("official") || url.endsWith(".pdf")) {
      return url;
    }
  }
  return "";
}

export function buildPostSnapshotFromRaw(raw = {}) {
  const parsed = parseJobDetailsFromText(raw.contentText || "");
  const applyOnline = normalizeText(raw?.applyLinks?.[0]?.url || "");
  const officialNotification = pickNotificationLink(raw?.importantLinks || []);

  return {
    title: normalizeText(raw.title),
    metaDesc: normalizeText(raw.metaDesc),
    sourceUrl: normalizeText(raw.sourceUrl),
    siteHost: normalizeText(raw.siteHost),
    advertisementNumber: normalizeText(parsed.advtNo),
    totalPosts: normalizeNum(parsed.totalPosts),
    dates: {
      postDate: normalizeText(parsed.postDate || ""),
      applicationStartDate: normalizeText(parsed?.importantDates?.applyStart || ""),
      applicationLastDate: normalizeText(parsed?.importantDates?.applyLast || ""),
      examDate: normalizeText(raw?.dates?.examDate || ""),
      resultDate: normalizeText(raw?.dates?.resultDate || ""),
    },
    fee: {
      generalObc: normalizeNum(parsed?.fee?.generalObc),
      scSt: normalizeNum(parsed?.fee?.scSt),
    },
    age: {
      min: normalizeNum(parsed?.age?.min),
      max: normalizeNum(parsed?.age?.max),
      asOn: normalizeText(parsed?.age?.asOn || ""),
    },
    links: {
      applyOnline,
      officialNotification,
    },
  };
}

export function buildPageHashFromSnapshot(snapshot = {}) {
  const normalized = {};
  let comparableCount = 0;

  for (const path of TRACKED_PATHS) {
    const value = normalizeText(getByPath(snapshot, path));
    normalized[path] = value;
    if (value) comparableCount++;
  }

  const hashedFields = {};
  for (const [path, value] of Object.entries(normalized)) {
    hashedFields[path] = value ? hash(value) : "";
  }

  const stable = Object.keys(normalized)
    .sort()
    .map((path) => `${path}:${normalized[path]}`)
    .join("|");

  return {
    pageHash: hash(stable),
    fields: normalized,
    hashedFields,
    comparableCount,
  };
}

export function diffSnapshotFields(oldSnapshot = {}, newSnapshot = {}) {
  const out = [];

  for (const path of TRACKED_PATHS) {
    const oldValue = normalizeText(getByPath(oldSnapshot, path));
    const newValue = normalizeText(getByPath(newSnapshot, path));
    if (oldValue !== newValue) {
      out.push({ field: path, oldValue, newValue });
    }
  }

  return out;
}

