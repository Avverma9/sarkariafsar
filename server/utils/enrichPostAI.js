/**
 * enrichPostAI.js — Hybrid field extractor
 *
 * Phase 1: Rule-based extraction from contentJson + contentHtml (no API, always works).
 * Phase 2: Gemini for examPreparationStrategy only (skipped gracefully on quota/failure).
 *
 * Fills: jobtitle, conductingAuthority, conducting_authority,
 *        advertisementNumber, advertisement_number, location, totalVacancies,
 *        ageLimit, applicationFee, selectionProcess, salary,
 *        physicalTestDetails, syllabusBreakdown, examPreparationStrategy,
 *        tags, disclaimer
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Models tried in order — quota hit on one → fall through to next
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash",
];

// ── Multi-key round-robin (same env var as keyResolver) ──
function _getApiKeys() {
  const raw = process.env.GEMINI_API_KEY || "";
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}
let _keyIndex = 0;

function stripHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

// ─────────────────────────────────────────────────────────────
// PHASE 1 — Rule-based extraction (no API, always works)
// ─────────────────────────────────────────────────────────────

const STATE_PATTERNS = [
  { r: /\bUP\b|uttar\s*pradesh/i,         v: "Uttar Pradesh" },
  { r: /\bMP\b|madhya\s*pradesh/i,         v: "Madhya Pradesh" },
  { r: /\bRajasthan\b/i,                   v: "Rajasthan" },
  { r: /\bBihar\b/i,                       v: "Bihar" },
  { r: /\bHaryana\b/i,                     v: "Haryana" },
  { r: /\bPunjab\b/i,                      v: "Punjab" },
  { r: /\bJharkhand\b/i,                   v: "Jharkhand" },
  { r: /\bGujarat\b/i,                     v: "Gujarat" },
  { r: /\bDelhi\b|\bDMRC\b|\bDSSB\b/i,    v: "Delhi" },
  { r: /\bMaharashtra\b|\bMPSC\b/i,       v: "Maharashtra" },
  { r: /\bKarnataka\b|\bKPSC\b/i,         v: "Karnataka" },
  { r: /\bTamil\s*Nadu\b|\bTNPSC\b/i,     v: "Tamil Nadu" },
  { r: /\bAndhra\b|\bAPPSC\b/i,           v: "Andhra Pradesh" },
  { r: /\bTelangana\b|\bTSPSC\b/i,        v: "Telangana" },
  { r: /\bKerala\b|\bKPSC\b/i,            v: "Kerala" },
  { r: /\bOdisha\b|\bOPSC\b/i,            v: "Odisha" },
  { r: /\bAssam\b|\bAPSC\b/i,             v: "Assam" },
  { r: /\bWest\s*Bengal\b|\bWBCS\b/i,     v: "West Bengal" },
  { r: /\bUttarakhand\b/i,                v: "Uttarakhand" },
  { r: /\bHimachal\b|\bHPAS\b/i,          v: "Himachal Pradesh" },
  { r: /\bGoa\b/i,                         v: "Goa" },
  { r: /\bChattisgarh\b/i,                v: "Chhattisgarh" },
];

const AUTHORITY_PATTERNS = [
  { r: /UPPRPB|UP\s*Police\s*(?:Recr|SI|Const)/i, v: "Uttar Pradesh Police Recruitment & Promotion Board (UPPRPB)" },
  { r: /UPSSSC/i,   v: "Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)" },
  { r: /UPPSC/i,    v: "Uttar Pradesh Public Service Commission (UPPSC)" },
  { r: /\bSSC\s*CGL\b/i, v: "Staff Selection Commission — CGL (SSC)" },
  { r: /\bSSC\s*CHSL\b/i, v: "Staff Selection Commission — CHSL (SSC)" },
  { r: /\bSSC\s*MTS\b/i, v: "Staff Selection Commission — MTS (SSC)" },
  { r: /\bSSC\b/i,  v: "Staff Selection Commission (SSC)" },
  { r: /\bUPSC\b/i, v: "Union Public Service Commission (UPSC)" },
  { r: /\bIBPS\b/i, v: "Institute of Banking Personnel Selection (IBPS)" },
  { r: /\bSBI\b/i,  v: "State Bank of India (SBI)" },
  { r: /\bRRB\b/i,  v: "Railway Recruitment Board (RRB)" },
  { r: /\bRRC\b/i,  v: "Railway Recruitment Cell (RRC)" },
  { r: /\bAIIMS\b/i, v: "All India Institute of Medical Sciences (AIIMS)" },
  { r: /\bNTA\b/i,  v: "National Testing Agency (NTA)" },
  { r: /\bDRDO\b/i, v: "Defence Research and Development Organisation (DRDO)" },
  { r: /\bCSIR\b/i, v: "Council of Scientific & Industrial Research (CSIR)" },
  { r: /\bNHM\b/i,  v: "National Health Mission (NHM)" },
  { r: /\bBPSC\b/i, v: "Bihar Public Service Commission (BPSC)" },
  { r: /\bBSSC\b/i, v: "Bihar Staff Selection Commission (BSSC)" },
  { r: /\bMPPSC\b/i, v: "Madhya Pradesh Public Service Commission (MPPSC)" },
  { r: /\bRPSC\b/i, v: "Rajasthan Public Service Commission (RPSC)" },
  { r: /\bRSSB\b|\bRSMSSB\b/i, v: "Rajasthan Staff Selection Board (RSSB)" },
  { r: /\bHSSC\b/i, v: "Haryana Staff Selection Commission (HSSC)" },
  { r: /\bHPKV\b|\bHPPSC\b/i, v: "Himachal Pradesh Public Service Commission (HPPSC)" },
  { r: /Indian\s*Army/i,       v: "Indian Army" },
  { r: /Indian\s*Navy/i,       v: "Indian Navy" },
  { r: /Indian\s*Air\s*Force/i,  v: "Indian Air Force" },
  { r: /Indian\s*Coast\s*Guard/i, v: "Indian Coast Guard" },
  { r: /Bihar\s*Vidhan\s*Parishad|\bBLCS\b/i, v: "Bihar Legislature Clerical Service (Bihar Vidhan Parishad)" },
  { r: /High\s*Court/i, v: "High Court" },
  { r: /\bHAL\b/i,  v: "Hindustan Aeronautics Limited (HAL)" },
  { r: /\bNTPC\b/i, v: "National Thermal Power Corporation (NTPC)" },
  { r: /\bBHEL\b/i, v: "Bharat Heavy Electricals Limited (BHEL)" },
];

function _ruleExtract(doc) {
  const html   = doc?.scrapedContent?.contentHtml || "";
  const cj     = doc?.scrapedContent?.contentJson  || {};
  const plain  = stripHtml(html).toLowerCase();
  const title  = String(doc.title || "");
  const result = {};

  // ── totalVacancies ──
  // Sum vacancy counts, filtering out physical/PET rows (height/weight/race data)
  if (Array.isArray(cj.vacancyDetails) && cj.vacancyDetails.length) {
    const filtered = cj.vacancyDetails.filter(({ post = "", count = 0 }) => {
      if (!post || typeof count !== "number" || count <= 0) return false;
      return !/^(UR|OBC|SC|ST|Male|Female|Category|General|EWS)$/i.test(post.trim());
    });
    const total = filtered.reduce((s, { count }) => s + count, 0);
    if (total > 0) result.totalVacancies = String(total);
  }
  if (!result.totalVacancies) {
    const m = plain.match(/total\s*(?:post|vacanc)[a-z]*\s*[:\-]?\s*([\d,]+)/i);
    if (m) result.totalVacancies = m[1].replace(/,/g, "");
  }

  // ── ageLimit from contentJson.ageLimit object ──
  if (cj.ageLimit && typeof cj.ageLimit === "object") {
    const min = cj.ageLimit.minimumAge || cj.ageLimit.minAge || "";
    const max = cj.ageLimit.maximumAge || cj.ageLimit.maxAge || "";
    if (min || max) result.ageLimit = [min, max].filter(Boolean).join(" – ");
  }
  if (!result.ageLimit) {
    const minM = plain.match(/minimum\s*age\s*[:\-]?\s*([\d]+\s*years?)/i);
    const maxM = plain.match(/maximum\s*age\s*[:\-]?\s*([\d]+\s*years?)/i);
    if (minM || maxM) result.ageLimit = [minM?.[1], maxM?.[1]].filter(Boolean).join(" – ");
  }

  // ── applicationFee from contentJson.applicationFee ──
  if (cj.applicationFee && typeof cj.applicationFee === "object") {
    const parts = Object.entries(cj.applicationFee)
      .filter(([k, v]) => v && !/payment\s*mode|mode/i.test(k))
      .map(([k, v]) => `${k}: ${v}`);
    if (parts.length) result.applicationFee = parts.join(" | ").slice(0, 200);
  }
  if (!result.applicationFee) {
    // Regex to find fee lines like "For General/ EWS/ OBC : ₹ 500/-"
    const feeLines = [];
    const feeRe = /for\s+([^:]{3,40})\s*:\s*(₹\s*[\d,]+\s*\/?\-?)/gi;
    let fm;
    while ((fm = feeRe.exec(plain)) !== null) feeLines.push(`${fm[1].trim()}: ${fm[2].trim()}`);
    if (feeLines.length) result.applicationFee = feeLines.slice(0, 3).join(" | ");
  }

  // ── selectionProcess from contentJson.selectionProcess ──
  if (Array.isArray(cj.selectionProcess) && cj.selectionProcess.length) {
    result.selectionProcess = cj.selectionProcess.join(", ");
  }
  if (!result.selectionProcess) {
    const selM = plain.match(/(?:mode\s*of\s*selection|selection\s*process)[^.]*[:\-]?\s*([^.]{10,250})/i);
    if (selM) result.selectionProcess = selM[1].replace(/\s+/g, " ").trim().slice(0, 250);
  }

  // ── salary from contentJson.salaryDetails ──
  if (cj.salaryDetails && typeof cj.salaryDetails === "object") {
    const parts = Object.entries(cj.salaryDetails)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (parts.length) result.salary = parts.join(" | ").slice(0, 200);
  }
  if (!result.salary) {
    const salM = plain.match(/(?:pay\s*scale|pay\s*band|grade\s*pay|salary)\s*[:\-]?\s*([₹\d,\-\s]+(?:per\s+month)?)/i);
    if (salM) result.salary = salM[1].trim().slice(0, 100);
  }

  // ── physicalTestDetails from contentJson.physicalTest ──
  if (cj.physicalTest && typeof cj.physicalTest === "object") {
    const parts = [];
    const m = cj.physicalTest.male   || cj.physicalTest.Male   || {};
    const f = cj.physicalTest.female || cj.physicalTest.Female || {};
    if (m.height || m.chest)  parts.push(`Male: Height ${m.height || "—"}, Chest ${m.chest || "—"}${m.race ? ", Race " + m.race : ""}`);
    if (f.height || f.weight) parts.push(`Female: Height ${f.height || "—"}, Weight ${f.weight || "—"}${f.race ? ", Race " + f.race : ""}`);
    if (parts.length) result.physicalTestDetails = parts.join("; ");
  }

  // ── syllabusBreakdown from contentJson.syllabus / examPattern ──
  if (Array.isArray(cj.syllabus) && cj.syllabus.length) {
    result.syllabusBreakdown = cj.syllabus.join(", ").slice(0, 300);
  } else if (Array.isArray(cj.examPattern) && cj.examPattern.length) {
    result.syllabusBreakdown = cj.examPattern.join(", ").slice(0, 300);
  }

  // ── advertisementNumber from plain text ──
  const advtM = plain.match(/advt(?:isement)?\s*(?:no|number|#)\s*[.:\-]?\s*([A-Z0-9\/\-]{3,30})/i);
  if (advtM) {
    result.advertisementNumber = advtM[1].trim();
    result.advertisement_number = result.advertisementNumber;
  }

  // ── conductingAuthority from title + plain ──
  const haystack = `${title} ${plain.slice(0, 800)}`;
  for (const { r, v } of AUTHORITY_PATTERNS) {
    if (r.test(haystack)) {
      result.conductingAuthority = v;
      result.conducting_authority = v;
      break;
    }
  }

  // ── location from title + sectionName ──
  const locHaystack = `${title} ${doc.sectionName || ""} ${plain.slice(0, 400)}`;
  for (const { r, v } of STATE_PATTERNS) {
    if (r.test(locHaystack)) { result.location = v; break; }
  }
  if (!result.location) result.location = "India";

  // ── jobtitle — title minus year / notification type words ──
  const jt = title
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\b(?:answer\s*key|admit\s*card|result|notification|recruitment|online\s*form|application\s*form|vacancy)\b/gi, "")
    .replace(/\s+/g, " ").trim();
  if (jt && jt.length > 3) result.jobtitle = jt;

  // ── tags (search phrases, not single words) ──
  const yr = (title.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear();
  const baseTitle = title.replace(/\s+\d{4}\s*/g, " ").replace(/\s+/g, " ").trim();
  const section = doc.sectionName || "";
  const tagPhrases = [
    `${baseTitle} ${yr}`,
    result.conductingAuthority ? `${result.conductingAuthority.split("(")[0].trim()} Recruitment ${yr}` : null,
    result.location && result.location !== "India" ? `${result.location} Government Jobs ${yr}` : "Sarkari Naukri",
    section ? `${baseTitle} ${section}` : null,
  ].filter(Boolean);
  result.tags = [...new Set(tagPhrases)].slice(0, 6);

  // ── disclaimer ──
  result.disclaimer = "This is an informational summary. Always verify details from the official website before applying.";

  return result;
}

// ─────────────────────────────────────────────────────────────
// PHASE 2 — Gemini batch: FAQ + SEO keywords + examPreparationStrategy
// ─────────────────────────────────────────────────────────────

async function _geminiEnrichBatch(title, plain, contentJson) {
  const keys = _getApiKeys();
  if (!keys.length) return null;

  const vacTable = Array.isArray(contentJson?.vacancyDetails)
    ? contentJson.vacancyDetails.slice(0, 6).map((r) => JSON.stringify(r)).join("\n")
    : "";
  const dates = contentJson?.importantDates
    ? JSON.stringify(contentJson.importantDates)
    : "";
  const links = Array.isArray(contentJson?.importantLinks)
    ? contentJson.importantLinks.map((l) => l.url || "").filter(Boolean).join(", ")
    : "";
  const selProcess = Array.isArray(contentJson?.selectionProcess)
    ? contentJson.selectionProcess.join(", ")
    : "";

  const prompt = `You are a JSON-only API for an Indian government job portal. Return ONLY valid JSON — no markdown, no code blocks, no explanation.

Post Title: ${title}
Selection Process: ${selProcess || "written exam"}
Key Dates: ${dates}
Important Links: ${links}
Vacancy Details:\n${vacTable}
Context (first 800 chars): ${plain.slice(0, 800)}

Return this exact JSON:
{
  "faq": [
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."},
    {"q": "...", "a": "..."}
  ],
  "seoKeywords": ["...", "...", "...", "...", "..."],
  "examStrategy": "..."
}

Rules:
- faq: 5 useful questions a candidate would actually search — cover admit card download steps, exam date, vacancy count per post, salary/pay scale, official website URL
- seoKeywords: 5 real long-tail search queries (Hindi/English mix) like "Bihar Vidhan Parishad admit card 2026 kaise download karein"
- examStrategy: 2-3 sentences specific to this exam's syllabus and selection process`;

  const startIdx = _keyIndex % keys.length;
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    for (const modelName of MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(keys[idx]);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
        });
        const res = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 25000)),
        ]);
        let text = res.response.text().trim();
        // Strip markdown code fences if present
        text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsed = JSON.parse(text);
        if (parsed && (Array.isArray(parsed.faq) || Array.isArray(parsed.seoKeywords))) {
          _keyIndex = (idx + 1) % keys.length;
          return parsed;
        }
      } catch (err) {
        const msg = err.message || "";
        if (!/429|quota|rate.limit|400|404|invalid|not.found/i.test(msg)) {
          console.error(`[enrichPostAI] Batch key[${idx}] ${modelName}: ${msg.slice(0, 80)}`);
        }
        // continue to next key/model
      }
    }
  }
  return null;
}

async function _geminiExamStrategy(title, selectionProcess, plain) {
  const keys = _getApiKeys();
  if (!keys.length) return null;

  const prompt = `Generate a 2-3 sentence exam preparation strategy for this Indian government exam.
Be specific to the exam type and selection process.

Title: ${title}
Selection Process: ${selectionProcess || "written exam, physical test"}
Context (first 600 chars): ${plain.slice(0, 600)}

Return ONLY the strategy text — no headings, no bullets, no markdown.`;

  const startIdx = _keyIndex % keys.length;
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    for (const modelName of MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(keys[idx]);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
        });
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
        ]);
        const text = result.response.text().trim();
        if (text && text.length > 20) {
          _keyIndex = (idx + 1) % keys.length;
          return text;
        }
      } catch (err) {
        const msg = err.message || "";
        if (!/429|quota|rate.limit|400|404|invalid|not.found/i.test(msg)) {
          // Only log unexpected errors
          console.error(`[enrichPostAI] Gemini key[${idx}] ${modelName}: ${msg.slice(0, 80)}`);
        }
        continue;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Enriches a post document by filling empty fields.
 * Phase 1 (rule-based) always runs. Phase 2 (Gemini) only for examPreparationStrategy.
 *
 * @param {object} doc  - Plain post object from DB (.lean())
 * @returns {Promise<object>} - $set payload with only non-empty new values
 */
async function enrichPost(doc) {
  const html  = doc?.scrapedContent?.contentHtml || "";
  const plain = stripHtml(html);
  if (!plain || plain.length < 30) return {};

  // ── Phase 1: rule-based ──
  const extracted = _ruleExtract(doc);

  const updates = {};

  const textFields = [
    "jobtitle", "conductingAuthority", "conducting_authority",
    "advertisementNumber", "advertisement_number",
    "location", "totalVacancies", "ageLimit", "applicationFee",
    "selectionProcess", "salary", "physicalTestDetails",
    "syllabusBreakdown", "disclaimer",
  ];

  for (const field of textFields) {
    const existing = String(doc[field] || "").trim();
    const newVal   = String(extracted[field] || "").trim();
    if (!existing && newVal) updates[field] = newVal;
  }

  // tags — only as fallback if buildFullPayload didn't set them
  if ((!doc.tags || doc.tags.length === 0) && extracted.tags?.length) {
    updates.tags = extracted.tags.filter(t => typeof t === "string" && t.trim());
  }

  // ── Phase 2: Gemini batch — AI is PRIMARY for FAQ, tags, keywords ──
  // Always try AI to override/improve. Rule-based is fallback.
  const contentJson = doc.scrapedContent?.contentJson || {};
  const needsFaq      = !doc.structured?.faq || doc.structured.faq.length < 5;
  const needsKeywords = !doc.seo?.keywords || doc.seo.keywords.length < 3;
  const needsStrategy = !String(doc.examPreparationStrategy || "").trim();

  if (needsFaq || needsKeywords || needsStrategy) {
    const batch = await _geminiEnrichBatch(String(doc.title || ""), plain, contentJson);
    if (batch) {
      // AI overrides even if rule-based filled these
      if (Array.isArray(batch.faq) && batch.faq.length >= 3) {
        updates["structured.faq"] = batch.faq.filter((f) => f && f.q && f.a);
      }
      if (Array.isArray(batch.seoKeywords) && batch.seoKeywords.length >= 2) {
        updates["seo.keywords"] = batch.seoKeywords.filter(Boolean);
        updates.tags = batch.seoKeywords.filter(Boolean).slice(0, 6);
      }
      if (needsStrategy && batch.examStrategy && batch.examStrategy.length > 20) {
        updates.examPreparationStrategy = batch.examStrategy;
      }
    } else if (needsFaq) {
      // AI failed — generate 5 rule-based FAQ as fallback
      const title = String(doc.title || "");
      const yr = (title.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear();
      const authority = extracted.conductingAuthority || "the conducting authority";
      const totalVac = extracted.totalVacancies || doc.totalVacancies || "multiple";
      const sal = extracted.salary || doc.salary || "as per government rules";
      const dates = contentJson?.importantDates || {};
      const lastDate = dates["Last Date for Apply Online"] || dates["Last Date"] || "check official website";
      updates["structured.faq"] = [
        { q: `What is the last date to apply for ${title}?`, a: `The last date to apply online is ${lastDate}. Candidates should apply before the deadline to avoid last-minute issues.` },
        { q: `How many vacancies are available in ${title}?`, a: `A total of ${totalVac} vacancies have been announced by ${authority} for this recruitment.` },
        { q: `What is the salary for ${title}?`, a: `The salary/pay scale is ${sal}. Additional allowances are provided as per government norms.` },
        { q: `How to apply online for ${title}?`, a: `Visit the official website, register with valid email/phone, fill the application form, upload documents, pay the fee, and submit. Save the confirmation page.` },
        { q: `What is the selection process for ${title}?`, a: `${extracted.selectionProcess || "The selection process includes written exam, document verification, and merit-based final selection."}` },
      ];
    }
  }

  return updates;
}

module.exports = { enrichPost };
