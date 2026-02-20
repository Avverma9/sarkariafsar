import axios from "axios";
import * as cheerio from "cheerio";
import ApiKey from "../models/apikey.model.mjs";
import GeminiModel from "../models/gemini.model.mjs";
import logger from "../utils/logger.mjs";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();
const MAX_LINES = Math.max(10, Number(process.env.POST_HTML_GEMINI_MAX_LINES || 70));
const MAX_LINE_CHARS = Math.max(80, Number(process.env.POST_HTML_GEMINI_MAX_LINE_CHARS || 180));
const MAX_OUTPUT_TOKENS = Math.max(
  64,
  Number(process.env.POST_HTML_GEMINI_MAX_OUTPUT_TOKENS || 220),
);
const REQUEST_TIMEOUT_MS = Math.max(
  8000,
  Number(process.env.POST_HTML_GEMINI_TIMEOUT_MS || 25000),
);

const SUSPICIOUS_PATTERN =
  /sarkari\s*result|sarkariexam|rojgarresult|rojarresult|follow|join|telegram|whatsapp|instagram|download\s*app|play\.google|apps\.apple|official|source\s*:|prepared\s*by/i;

const DEFAULT_REMOVE_CONTAINS = [
  "sarkari result",
  "sarkariresult",
  "sarkari exam",
  "sarkariexam",
  "rojgarresult",
  "rojarresult",
  "follow now",
  "follow on",
  "join telegram",
  "join whatsapp",
  "download app",
  "play.google.com",
  "apps.apple.com",
  "original source:",
  "source:",
  "prepared by",
];

function normalizeSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isRefinerEnabled() {
  return String(process.env.POST_HTML_GEMINI_REFINER_ENABLED || "true")
    .trim()
    .toLowerCase() !== "false";
}

function parseJsonLoose(text = "") {
  let raw = String(text || "").trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Gemini refine response is not valid JSON");
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function toUniqueLines(values = []) {
  const out = [];
  const seen = new Set();
  for (const v of values) {
    const line = normalizeSpace(v);
    if (!line || seen.has(line.toLowerCase())) continue;
    seen.add(line.toLowerCase());
    out.push(line);
  }
  return out;
}

function extractSuspiciousLines(html = "") {
  const $ = cheerio.load(String(html || ""));
  $("script,style,noscript,iframe").remove();

  const lines = [];
  $("p,li,a,div,span,td,th,strong,b,h1,h2,h3").each((_, el) => {
    const text = normalizeSpace($(el).text());
    if (!text || text.length < 4 || text.length > MAX_LINE_CHARS) return;
    if (!SUSPICIOUS_PATTERN.test(text)) return;
    lines.push(text);
  });

  return toUniqueLines(lines).slice(0, MAX_LINES);
}

function buildRefinePrompt({ title = "", sourceUrl = "", lines = [] } = {}) {
  const compactTitle = normalizeSpace(title).slice(0, 180);
  const compactUrl = normalizeSpace(sourceUrl).slice(0, 240);
  const payload = lines.map((line, idx) => `${idx + 1}. ${line}`).join("\n");

  return [
    "You are a strict sanitizer for job-post HTML text.",
    "Task: find lines that should be removed because they are competitor branding, follow/join CTA, app download CTA, social CTA, or source attribution/footer meta.",
    "Return JSON only with this shape:",
    '{"removeExactLines":["..."],"removeContains":["..."]}',
    "Rules:",
    "- Keep arrays short (max 20 each).",
    "- removeContains should be lowercase phrase fragments.",
    "- Do not return explanation.",
    `Title: ${compactTitle || "N/A"}`,
    `SourceUrl: ${compactUrl || "N/A"}`,
    "Candidate lines:",
    payload || "N/A",
  ].join("\n");
}

function normalizeRemovalRules(parsed = {}) {
  const removeExactLines = Array.isArray(parsed?.removeExactLines)
    ? parsed.removeExactLines
    : [];
  const removeContainsRaw = Array.isArray(parsed?.removeContains)
    ? parsed.removeContains
    : [];

  const exact = toUniqueLines(removeExactLines).slice(0, 30);
  const contains = toUniqueLines(removeContainsRaw)
    .map((x) => x.toLowerCase())
    .concat(DEFAULT_REMOVE_CONTAINS)
    .filter(Boolean)
    .slice(0, 60);

  return {
    exactSet: new Set(exact.map((x) => x.toLowerCase())),
    contains,
  };
}

function removeNodesByRules(html = "", rules = { exactSet: new Set(), contains: [] }) {
  const $ = cheerio.load(String(html || ""), { decodeEntities: false });

  const shouldRemoveText = (value = "") => {
    const text = normalizeSpace(value);
    if (!text) return false;
    const lower = text.toLowerCase();
    if (rules.exactSet.has(lower)) return true;
    return rules.contains.some((needle) => needle && lower.includes(needle));
  };

  $("p,li,div,section,span,td,th,a,strong,b").each((_, el) => {
    const node = $(el);
    const text = normalizeSpace(node.text());
    if (!text || text.length > 1400) return;
    const hasNestedContainers = node.find("table,ul,ol,section,article,form").length > 0;
    if (!["a", "strong", "b"].includes(String(el.tagName || "").toLowerCase()) && hasNestedContainers) {
      return;
    }
    if (!shouldRemoveText(text)) return;
    node.remove();
  });

  for (let i = 0; i < 3; i += 1) {
    $("p,div,section,article,li,td,span").each((_, el) => {
      const node = $(el);
      if (
        !normalizeSpace(node.text()) &&
        !node.find("img,table,a,input,button,iframe").length &&
        node.children().length === 0
      ) {
        node.remove();
      }
    });
  }

  return $.html();
}

async function getActiveModels() {
  const rows = await GeminiModel.find({ status: true })
    .sort({ priority: -1, updatedAt: -1, createdAt: -1 })
    .lean();

  const list = rows
    .map((m) => String(m.modelName || "").trim().toLowerCase())
    .filter(Boolean);

  return list.length ? list : [DEFAULT_MODEL];
}

async function getUsableKeys() {
  const keys = await ApiKey.find({
    provider: "gemini",
    status: { $ne: "INACTIVE" },
  })
    .sort({ priority: -1, updatedAt: -1, createdAt: -1 })
    .lean();

  const keyList = keys.map((k) => String(k.apiKey || "").trim()).filter(Boolean);
  const keyMap = new Map(
    keys
      .map((k) => [String(k.apiKey || "").trim(), k._id])
      .filter(([k]) => Boolean(k)),
  );
  return { keyList, keyMap };
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

async function markKeyFailure(keyId, message = "") {
  if (!keyId) return;
  await ApiKey.updateOne(
    { _id: keyId },
    {
      $inc: { failCount: 1 },
      $set: {
        lastFailedAt: new Date(),
        lastError: String(message || "Gemini html refine failed").slice(0, 500),
      },
    },
  );
}

async function callGeminiJson({ apiKey, modelName, prompt }) {
  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(modelName)}:generateContent`;
  const { data } = await axios.post(
    url,
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
      },
    },
    {
      params: { key: apiKey },
      timeout: REQUEST_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    },
  );

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => String(p?.text || "")).join("\n").trim();
  if (!text) {
    const reason = data?.promptFeedback?.blockReason;
    throw new Error(reason ? `Gemini blocked (${reason})` : "Gemini empty response");
  }
  return parseJsonLoose(text);
}

export async function refinePreparedHtmlWithGemini({
  html = "",
  title = "",
  sourceUrl = "",
} = {}) {
  const enabled = isRefinerEnabled();
  const inputHtml = String(html || "").trim();
  if (!inputHtml) {
    return {
      html: "",
      meta: {
        enabled,
        usedGemini: false,
        reason: "empty-html",
      },
    };
  }

  if (!enabled) {
    return {
      html: inputHtml,
      meta: {
        enabled: false,
        usedGemini: false,
        reason: "disabled-by-env",
      },
    };
  }

  const suspiciousLines = extractSuspiciousLines(inputHtml);
  if (!suspiciousLines.length) {
    return {
      html: inputHtml,
      meta: {
        enabled: true,
        usedGemini: false,
        reason: "no-suspicious-lines",
      },
    };
  }

  const prompt = buildRefinePrompt({ title, sourceUrl, lines: suspiciousLines });
  let models;
  let keyData;
  try {
    [models, keyData] = await Promise.all([getActiveModels(), getUsableKeys()]);
  } catch (err) {
    const msg = err?.message || "unable to fetch Gemini models/keys";
    logger.warn(`Gemini HTML refine setup failed: ${msg}`);
    return {
      html: inputHtml,
      meta: {
        enabled: true,
        usedGemini: false,
        reason: "setup-failed",
        error: msg,
      },
    };
  }
  const keyList = keyData.keyList;

  if (!keyList.length) {
    return {
      html: inputHtml,
      meta: {
        enabled: true,
        usedGemini: false,
        reason: "no-active-key",
      },
    };
  }

  const failures = [];
  let attempts = 0;

  for (const modelName of models) {
    for (const apiKey of keyList) {
      attempts += 1;
      const keyId = keyData.keyMap.get(apiKey);
      try {
        const parsed = await callGeminiJson({ apiKey, modelName, prompt });
        const rules = normalizeRemovalRules(parsed);
        const refinedHtml = removeNodesByRules(inputHtml, rules);

        await Promise.all([
          markKeySuccess(keyId),
          GeminiModel.updateOne(
            { modelName: String(modelName).toLowerCase() },
            { $set: { lastUsedAt: new Date() } },
          ),
        ]);

        return {
          html: refinedHtml,
          meta: {
            enabled: true,
            usedGemini: true,
            modelName,
            attempts,
            suspiciousLineCount: suspiciousLines.length,
            removeContainsCount: rules.contains.length,
            removeExactCount: rules.exactSet.size,
          },
        };
      } catch (err) {
        const msg = err?.response?.data?.error?.message || err.message || "Unknown Gemini refine error";
        failures.push(`${modelName}: ${msg}`);
        await markKeyFailure(keyId, msg);
        logger.warn(`Gemini HTML refine failed for model=${modelName}: ${msg}`);
      }
    }
  }

  try {
    const fallbackRules = normalizeRemovalRules({
      removeExactLines: [],
      removeContains: DEFAULT_REMOVE_CONTAINS,
    });
    return {
      html: removeNodesByRules(inputHtml, fallbackRules),
      meta: {
        enabled: true,
        usedGemini: false,
        reason: "all-model-key-attempts-failed",
        attempts,
        failures: failures.slice(0, 3),
        suspiciousLineCount: suspiciousLines.length,
      },
    };
  } catch (err) {
    return {
      html: inputHtml,
      meta: {
        enabled: true,
        usedGemini: false,
        reason: "fallback-failed",
        attempts,
        failures: failures.slice(0, 3),
        error: err?.message || "fallback sanitize failed",
      },
    };
  }
}

export default refinePreparedHtmlWithGemini;
