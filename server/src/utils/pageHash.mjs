import crypto from "crypto";

function toRecruitment(payload) {
  if (payload?.recruitment && typeof payload.recruitment === "object") {
    return payload.recruitment;
  }
  if (payload && typeof payload === "object") return payload;
  return {};
}

function cleanText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

export function buildPageHash(payload) {
  const recruitment = toRecruitment(payload);
  const org = recruitment.organization || {};
  const dates = recruitment.importantDates || {};
  const fee = recruitment.applicationFee || {};
  const vacancy = recruitment.vacancyDetails || {};
  const age = recruitment.ageLimit || {};

  const fields = {
    title: cleanText(recruitment.title),
    organization: cleanText(org.name || org.shortName),
    advertisementNumber: cleanText(recruitment.advertisementNumber),
    applicationStartDate: cleanText(dates.applicationStartDate),
    applicationLastDate: cleanText(dates.applicationLastDate),
    examDate: cleanText(dates.examDate),
    feeGeneral: normalizeNumber(fee.general),
    feeEwsObc: normalizeNumber(fee.ewsObc),
    feeScSt: normalizeNumber(fee.scSt),
    totalPosts: normalizeNumber(vacancy.totalPosts),
    minAge: normalizeNumber(age.minimumAge),
    maxAge: normalizeNumber(age.maximumAge),
  };

  const hashedFields = {};
  let comparableCount = 0;

  for (const [k, v] of Object.entries(fields)) {
    hashedFields[k] = v ? hashValue(v) : "";
    if (v) comparableCount++;
  }

  const stable = Object.keys(fields)
    .sort()
    .map((k) => `${k}:${fields[k]}`)
    .join("|");

  return {
    pageHash: hashValue(stable),
    fields,
    hashedFields,
    comparableCount,
  };
}

export function comparePageHashSignature(a, b) {
  if (!a?.hashedFields || !b?.hashedFields) return 0;
  if (a.pageHash && b.pageHash && a.pageHash === b.pageHash) return 1;

  let comparable = 0;
  let matched = 0;

  for (const key of Object.keys(a.hashedFields)) {
    const x = a.hashedFields[key];
    const y = b.hashedFields[key];
    if (!x && !y) continue;
    comparable++;
    if (x && y && x === y) matched++;
  }

  if (!comparable) return 0;
  return matched / comparable;
}

