const { GoogleGenerativeAI } = require("@google/generative-ai");
const KeyMapping = require("../models/keyMapping");

// ── Known canonical keys per section — Gemini uses these as reference ──
const KNOWN_KEYS = {
  importantDates: [
    "applyStart", "applyEnd", "examDate", "admitCard",
    "answerKey", "result", "resultDate", "interviewDate", "joiningDate",
  ],
  applicationFee: [
    "general", "obc", "sc", "st", "ews", "exServiceman",
    "female", "pwd", "total",
  ],
  ageLimit: [
    "minimumAge", "maximumAge", "ageRelaxation",
    "generalAge", "obcAge", "scStAge",
  ],
  salaryDetails: [
    "payScale", "payBand", "gradePay", "basicPay", "totalEmoluments",
  ],
  admitCardInfo: ["releaseDate", "downloadLink", "examCenter"],
  resultInfo: ["releaseDate", "cutOff", "meritList", "downloadLink"],
  answerKeyInfo: ["releaseDate", "downloadLink", "objectionLink", "status"],
};

const ALL_KNOWN_KEYS = [...new Set(Object.values(KNOWN_KEYS).flat())];

// ── In-memory cache: rawKey:sectionHint → canonicalKey ──
const memCache = new Map();

// Disabled keys map: apiKey -> timestamp until which it is disabled
const disabledKeys = new Map();

// Gemini timing/backoff defaults (ms)
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 8000);
const GEMINI_BACKOFF_MS = Number(process.env.GEMINI_BACKOFF_MS || 60000);
const GEMINI_TIMEOUT_BACKOFF_MS = Number(process.env.GEMINI_TIMEOUT_BACKOFF_MS || 5000);

// ── Multi-key support: parse comma-separated GEMINI_API_KEY ──
function _getApiKeys() {
  if (String(process.env.SKIP_GEMINI || "").trim() === "1") {
    console.log("[keyResolver] SKIP_GEMINI=1 — skipping Gemini API calls");
    return [];
  }

  const raw = process.env.GEMINI_API_KEY || "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

// Round-robin index — distributes load across keys
let _keyIndex = 0;

function toCamelCase(str = "") {
  return String(str)
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

async function _askGemini(rawKey, sectionHint) {
  const keys = _getApiKeys();
  if (!keys.length) return toCamelCase(rawKey);

  const sectionKeys = KNOWN_KEYS[sectionHint] || [];
  const prompt = `You are a database key normalizer for an Indian government job portal.

Section: "${sectionHint}"
Known keys for this section: [${sectionKeys.join(", ")}]
All known keys across all sections: [${ALL_KNOWN_KEYS.join(", ")}]

Raw scraped key from HTML: "${rawKey}"

Task:
1. If this key is semantically the same as a known key → return that exact known key.
2. If it is semantically similar → return the closest known key.
3. If it is genuinely new/different → invent a new camelCase English key.

Rules:
- Return ONLY the camelCase key name.
- No explanation. No quotes. No spaces.
- Must be valid JavaScript identifier (camelCase, no special chars).`;

  // Try each key starting from round-robin index; rotate on any failure
  const startIdx = _keyIndex % keys.length;
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    const apiKey = keys[idx];

    // Skip temporarily disabled keys
    const disabledUntil = disabledKeys.get(apiKey) || 0;
    if (disabledUntil > Date.now()) {
      continue;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      const callStart = Date.now();
      const generatePromise = model.generateContent(prompt);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('gemini timeout')), GEMINI_TIMEOUT_MS)
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const took = Date.now() - callStart;

      const text = (result && result.response && typeof result.response.text === 'function')
        ? String(result.response.text()).trim().replace(/[^a-zA-Z0-9]/g, "")
        : "";

      if (text) {
        // Advance index so next call starts from the next key (load distribution)
        _keyIndex = (idx + 1) % keys.length;
        console.log(`[keyResolver] Gemini key[${idx}] succeeded in ${took}ms for rawKey=\"${rawKey}\"`);
        return text;
      }
    } catch (err) {
      const errMsg = err && err.message ? String(err.message) : String(err || '');
      const isQuota = /429|quota|rate.limit/i.test(errMsg);
      const isInvalid = /400|invalid|not.found|404/i.test(errMsg);
      const isTimeout = /timeout/i.test(errMsg) || errMsg === 'gemini timeout';

      console.warn(`[keyResolver] Gemini key[${idx}] error: ${errMsg} (quota:${isQuota} invalid:${isInvalid} timeout:${isTimeout})`);

      if (isQuota) {
        const backoffMs = Number(process.env.GEMINI_BACKOFF_MS || GEMINI_BACKOFF_MS);
        disabledKeys.set(apiKey, Date.now() + backoffMs);
        console.warn(`[keyResolver] Disabling key[${idx}] for ${backoffMs}ms due to quota/429`);
        continue;
      }

      if (isTimeout) {
        const shortBackoff = Number(process.env.GEMINI_TIMEOUT_BACKOFF_MS || GEMINI_TIMEOUT_BACKOFF_MS);
        disabledKeys.set(apiKey, Date.now() + shortBackoff);
        console.warn(`[keyResolver] Temporarily disabling key[${idx}] for ${shortBackoff}ms after timeout`);
        continue;
      }

      if (isInvalid) {
        console.warn(`[keyResolver] Gemini key[${idx}] invalid or rejected; skipping`);
        continue;
      }

      console.error(`[keyResolver] Gemini key[${idx}] unexpected error:`, errMsg);
      break;
    }
  }

  console.warn("[keyResolver] All Gemini keys exhausted, falling back to toCamelCase");
  return toCamelCase(rawKey);
}

/**
 * Resolves a raw scraped key to a canonical camelCase key.
 * Resolution order: in-memory cache → MongoDB registry → Gemini → save to registry.
 *
 * @param {string} rawKey      - The raw key from HTML (e.g. "OnlineStartDate")
 * @param {string} sectionHint - The contentJson section (e.g. "importantDates")
 * @returns {Promise<string>}  - Canonical camelCase key
 */
async function resolveKey(rawKey, sectionHint = "") {
  const raw = String(rawKey || "").trim();
  if (!raw) return "";

  const cacheKey = `${sectionHint}::${raw}`;

  // 1. In-memory cache
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);

  // 2. MongoDB registry
  try {
    const saved = await KeyMapping.findOne({ rawKey: raw });
    if (saved) {
      memCache.set(cacheKey, saved.canonicalKey);
      return saved.canonicalKey;
    }
  } catch (_) {}

  // 3. Gemini
  const canonical = await _askGemini(raw, sectionHint);

  // 4. Persist to registry
  try {
    await KeyMapping.create({
      rawKey: raw,
      canonicalKey: canonical,
      sectionHint,
      source: "gemini",
    });
  } catch (_) {}

  memCache.set(cacheKey, canonical);
  return canonical;
}

/**
 * Batch-resolve an object of rawKey→value pairs.
 * Returns a new object with canonical keys.
 */
async function resolveKeyValuePairs(rawObj, sectionHint = "") {
  const resolved = {};
  await Promise.all(
    Object.entries(rawObj).map(async ([rawKey, value]) => {
      const canonical = await resolveKey(rawKey, sectionHint);
      resolved[canonical] = value;
    })
  );
  return resolved;
}

module.exports = { resolveKey, resolveKeyValuePairs, toCamelCase };
