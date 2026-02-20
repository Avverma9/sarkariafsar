import axios from "axios";
import ApiKey from "../models/apikey.model.mjs";
import GeminiModel from "../models/gemini.model.mjs";
import { buildRecruitmentVerificationPrompt } from "../utils/prompt.mjs";
import { buildReadyPostHtml } from "../utils/postHtmlTransform.mjs";
import { buildDraftRecruitmentFromHtml } from "../utils/recruitmentDraft.util.mjs";
import logger from "../utils/logger.mjs";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_VERIFY_DRAFT_CHARS = 45000;

function unwrapJsonText(text) {
  let raw = String(text || "").trim();
  if (!raw) throw new Error("Gemini returned empty output");

  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Gemini did not return valid JSON");
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getRecruitmentDefaults(sourceUrl = "") {
  return {
    title: "",
    advertisementNumber: "",
    organization: {
      name: "",
      shortName: "",
      website: "",
      type: "Other",
    },
    importantDates: {
      notificationDate: "",
      postDate: "",
      applicationStartDate: "",
      applicationLastDate: "",
      feePaymentLastDate: "",
      correctionDate: "",
      preExamDate: "",
      mainsExamDate: "",
      examDate: "",
      admitCardDate: "",
      resultDate: "",
      answerKeyReleaseDate: "",
      finalAnswerKeyDate: "",
      documentVerificationDate: "",
      counsellingDate: "",
      meritListDate: "",
    },
    vacancyDetails: {
      totalPosts: 0,
      positions: [],
      categoryWise: {
        general: 0,
        obc: 0,
        sc: 0,
        st: 0,
        ewsExemption: 0,
        ph: 0,
        other: {},
      },
      districtWise: [],
    },
    applicationFee: {
      general: 0,
      ewsObc: 0,
      scSt: 0,
      female: 0,
      ph: 0,
      correctionCharge: 0,
      currency: "INR",
      paymentMode: [],
      exemptions: "",
    },
    ageLimit: {
      minimumAge: 0,
      maximumAge: 0,
      asOn: "",
      ageRelaxation: {
        scSt: 0,
        obc: 0,
        ph: 0,
        exServicemen: 0,
        other: {},
      },
      categoryWise: {
        ur: { male: 0, female: 0 },
        obc: { male: 0, female: 0 },
        sc: { male: 0, female: 0 },
        st: { male: 0, female: 0 },
      },
    },
    eligibility: {
      educationQualification: "",
      streamRequired: "",
      minimumPercentage: 0,
      experienceRequired: "",
      specialRequirements: [],
    },
    physicalStandards: {
      male: { height: "", chest: "", weight: "", eyesight: "" },
      female: { height: "", weight: "", eyesight: "" },
    },
    physicalEfficiencyTest: {
      male: { distance: "", duration: "" },
      female: { distance: "", duration: "" },
    },
    selectionProcess: [],
    importantLinks: {
      applyOnline: "",
      officialNotification: "",
      officialWebsite: "",
      syllabus: "",
      examPattern: "",
      admitCard: "",
      resultLink: "",
      answerKey: "",
      documentVerificationNotice: "",
      faq: "",
      other: {},
    },
    documentation: [],
    status: "Active",
    sourceUrl: String(sourceUrl || "").trim(),
    additionalInfo: "",
    extraFields: {
      unmappedKeyValues: {},
      links: [],
      keyValues: [],
    },
    content: {
      originalSummary: "",
      whoShouldApply: [],
      keyHighlights: [],
      applicationSteps: [],
      selectionProcessSummary: "",
      documentsChecklist: [],
      feeSummary: "",
      importantNotes: [],
      faq: [],
    },
  };
}

function mergeDefaults(defaultValue, value) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(value) ? value : defaultValue;
  }
  if (isPlainObject(defaultValue)) {
    const src = isPlainObject(value) ? value : {};
    const out = {};
    for (const key of Object.keys(defaultValue)) {
      out[key] = mergeDefaults(defaultValue[key], src[key]);
    }
    for (const key of Object.keys(src)) {
      if (!(key in out)) out[key] = src[key];
    }
    return out;
  }
  if (value === null || value === undefined) return defaultValue;
  return value;
}

function ensureRecruitmentRoot(parsed, sourceUrl = "") {
  if (!isPlainObject(parsed)) {
    throw new Error("Parsed response is not an object");
  }

  const hasRecruitmentField = Object.prototype.hasOwnProperty.call(parsed, "recruitment");
  const root = hasRecruitmentField ? { ...parsed } : {};
  const recruitment = isPlainObject(parsed.recruitment)
    ? { ...parsed.recruitment }
    : hasRecruitmentField
      ? {}
      : { ...parsed };

  const merged = mergeDefaults(getRecruitmentDefaults(sourceUrl), recruitment);
  merged.title = String(merged.title || parsed.title || "").trim();
  merged.sourceUrl = String(merged.sourceUrl || sourceUrl || "").trim();
  root.recruitment = merged;
  return root;
}

function compactDraftForPrompt(draft = {}) {
  const clone = JSON.parse(JSON.stringify(draft || {}));
  const rec = clone?.recruitment || {};

  if (typeof rec?.content?.originalSummary === "string" && rec.content.originalSummary.length > 700) {
    rec.content.originalSummary = rec.content.originalSummary.slice(0, 700);
  }

  if (rec.extraFields && typeof rec.extraFields === "object") {
    if (Array.isArray(rec.extraFields.links) && rec.extraFields.links.length > 80) {
      rec.extraFields.links = rec.extraFields.links.slice(0, 80);
    }
    if (Array.isArray(rec.extraFields.keyValues) && rec.extraFields.keyValues.length > 120) {
      rec.extraFields.keyValues = rec.extraFields.keyValues.slice(0, 120);
    }
    const unmapped = rec.extraFields.unmappedKeyValues || {};
    const unmappedKeys = Object.keys(unmapped);
    if (unmappedKeys.length > 120) {
      rec.extraFields.unmappedKeyValues = Object.fromEntries(
        unmappedKeys.slice(0, 120).map((k) => [k, unmapped[k]]),
      );
    }
  }

  let raw = JSON.stringify(clone);
  if (raw.length <= MAX_VERIFY_DRAFT_CHARS) return clone;

  if (rec.extraFields) {
    rec.extraFields.keyValues = [];
    rec.extraFields.links = [];
    rec.extraFields.unmappedKeyValues = {};
  }

  raw = JSON.stringify(clone);
  if (raw.length <= MAX_VERIFY_DRAFT_CHARS) return clone;

  if (rec.content) {
    rec.content.originalSummary = "";
    rec.content.keyHighlights = Array.isArray(rec.content.keyHighlights)
      ? rec.content.keyHighlights.slice(0, 4)
      : [];
  }

  return clone;
}

async function getActiveModels() {
  const models = await GeminiModel.find({ status: true })
    .sort({ priority: -1, updatedAt: -1, createdAt: -1 })
    .lean();

  const list = models
    .map((m) => String(m.modelName || "").trim().toLowerCase())
    .filter(Boolean);

  if (!list.length) {
    return [String(process.env.GEMINI_MODEL || DEFAULT_MODEL).trim()];
  }
  return list;
}

async function getActiveKeys() {
  const keys = await ApiKey.find({ provider: "gemini", status: { $ne: "INACTIVE" } })
    .sort({ priority: -1, updatedAt: -1, createdAt: -1 })
    .lean();

  const fromDb = keys.map((k) => String(k.apiKey || "").trim()).filter(Boolean);
  const envKey = String(process.env.GEMINI_API_KEY || "").trim();

  if (envKey && !fromDb.includes(envKey)) fromDb.push(envKey);

  return {
    keyList: fromDb,
    keyMap: new Map(
      keys
        .map((k) => [String(k.apiKey || "").trim(), k._id])
        .filter(([apiKey]) => Boolean(apiKey)),
    ),
  };
}

async function markKeySuccess(keyId) {
  if (!keyId) return;
  await ApiKey.updateOne(
    { _id: keyId },
    {
      $inc: { successCount: 1 },
      $set: { lastUsedAt: new Date(), lastError: "" },
    },
  );
}

async function markKeyFailure(keyId, message) {
  if (!keyId) return;
  await ApiKey.updateOne(
    { _id: keyId },
    {
      $inc: { failCount: 1 },
      $set: {
        lastFailedAt: new Date(),
        lastError: String(message || "Gemini request failed").slice(0, 500),
      },
    },
  );
}

async function callGemini({ apiKey, modelName, prompt }) {
  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(modelName)}:generateContent`;
  const { data } = await axios.post(
    url,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.05,
        responseMimeType: "application/json",
      },
    },
    {
      params: { key: apiKey },
      timeout: 90000,
      headers: { "Content-Type": "application/json" },
    },
  );

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => String(p?.text || "")).join("\n").trim();

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked the response (${blockReason})`);
    }
    throw new Error("Gemini returned empty response text");
  }

  return text;
}

function buildDraft({ contentHtml = "", newHtml = "", title = "", sourceUrl = "" }) {
  const incomingNewHtml = String(newHtml || "").trim();
  const incomingContentHtml = String(contentHtml || "").trim();

  if (!incomingNewHtml && !incomingContentHtml) {
    throw new Error("contentHtml/newHtml is empty");
  }

  const htmlForParse = incomingNewHtml || buildReadyPostHtml({
    title,
    sourceUrl,
    contentHtml: incomingContentHtml,
  }).newHtml;

  return buildDraftRecruitmentFromHtml({
    html: String(htmlForParse || "").trim(),
    title,
    sourceUrl,
  });
}

export async function extractRecruitmentJsonFromContentHtml({
  contentHtml,
  sourceUrl = "",
  title = "",
  newHtml = "",
}) {
  const draft = buildDraft({ contentHtml, newHtml, title, sourceUrl });
  const promptPayload = compactDraftForPrompt(draft);
  const prompt = buildRecruitmentVerificationPrompt(promptPayload);

  let models = [];
  let keysData = { keyList: [], keyMap: new Map() };

  try {
    [models, keysData] = await Promise.all([getActiveModels(), getActiveKeys()]);
  } catch (err) {
    logger.warn(`Gemini verification setup failed, using rule draft only: ${err.message}`);
    return {
      data: ensureRecruitmentRoot(draft, sourceUrl),
      modelName: "rule-draft-v1",
      meta: { usedGemini: false, reason: "setup-failed" },
    };
  }

  const keyList = keysData.keyList || [];
  if (!keyList.length) {
    return {
      data: ensureRecruitmentRoot(draft, sourceUrl),
      modelName: "rule-draft-v1",
      meta: { usedGemini: false, reason: "no-active-key" },
    };
  }

  for (const modelName of models) {
    for (const apiKey of keyList) {
      const keyId = keysData.keyMap.get(apiKey);
      try {
        const text = await callGemini({ apiKey, modelName, prompt });
        const parsed = unwrapJsonText(text);
        const payload = ensureRecruitmentRoot(parsed, sourceUrl);

        await Promise.all([
          markKeySuccess(keyId),
          GeminiModel.updateOne(
            { modelName: String(modelName).toLowerCase() },
            { $set: { lastUsedAt: new Date() } },
          ),
        ]);

        return {
          data: payload,
          modelName: `${modelName}+json-verify-v1`,
          meta: { usedGemini: true },
        };
      } catch (err) {
        const msg = err?.response?.data?.error?.message || err.message || "Unknown Gemini error";
        await markKeyFailure(keyId, msg);
        logger.error(`Gemini verification failed for model=${modelName}: ${msg}`);
      }
    }
  }

  return {
    data: ensureRecruitmentRoot(draft, sourceUrl),
    modelName: "rule-draft-v1",
    meta: { usedGemini: false, reason: "all-models-failed" },
  };
}
