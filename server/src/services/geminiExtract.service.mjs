import axios from "axios";
import ApiKey from "../models/apikey.model.mjs";
import GeminiModel from "../models/gemini.model.mjs";
import { buildRecruitmentExtractionPrompt } from "../utils/prompt.mjs";
import logger from "../utils/logger.mjs";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-1.5-flash";
const MAX_PROMPT_CHARS = 120000;

function normalizeRawForPrompt(contentHtml) {
  const raw = String(contentHtml || "").trim();
  if (!raw) return "";

  if (raw.length <= MAX_PROMPT_CHARS) return raw;
  return `${raw.slice(0, MAX_PROMPT_CHARS)}\n\n[TRUNCATED_FOR_MODEL_LIMIT]`;
}

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

function ensureRecruitmentRoot(parsed, sourceUrl = "") {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Parsed response is not an object");
  }

  const root =
    parsed.recruitment && typeof parsed.recruitment === "object"
      ? parsed
      : { recruitment: parsed };

  if (!root.recruitment.sourceUrl) {
    root.recruitment.sourceUrl = sourceUrl;
  }

  return root;
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
        temperature: 0.1,
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

export async function extractRecruitmentJsonFromContentHtml({
  contentHtml,
  sourceUrl = "",
}) {
  const normalized = normalizeRawForPrompt(contentHtml);
  if (!normalized) {
    throw new Error("contentHtml is empty");
  }

  const prompt = buildRecruitmentExtractionPrompt(normalized);
  const [models, keysData] = await Promise.all([getActiveModels(), getActiveKeys()]);
  const keyList = keysData.keyList;

  if (!keyList.length) {
    throw new Error("No active Gemini API key found");
  }

  const failures = [];

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

        return { data: payload, modelName };
      } catch (err) {
        const msg = err?.response?.data?.error?.message || err.message || "Unknown Gemini error";
        failures.push(`${modelName}: ${msg}`);

        await markKeyFailure(keyId, msg);
        logger.error(`Gemini extraction failed for model=${modelName}: ${msg}`);
      }
    }
  }

  throw new Error(
    `Gemini extraction failed after trying all active models/keys. ${failures.slice(0, 3).join(" | ")}`,
  );
}
