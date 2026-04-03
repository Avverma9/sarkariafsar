/**
 * buildFullPayload.js — Maps convertToMeaningfulJSON output → full DB schema fields.
 *
 * Called AFTER saveOrPatchJobPost (post-save enrich).
 * saveOrPatchJobPost remains UNTOUCHED — zero dedup risk.
 *
 * Usage:
 *   const fields = buildFullPayload(meaningfulData, meta);
 *   await JobPost.findByIdAndUpdate(savedPost._id, { $set: fields });
 */

const sanitizeHtml = require("sanitize-html");

// ─── Date Parser ─────────────────────────────────────────────
const MONTH_MAP = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseIndianDate(str) {
  if (!str || typeof str !== "string") return null;
  // Loose match — extract date from longer strings like "30 March 2026 Available Now"
  const m = str.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = MONTH_MAP[m[2].toLowerCase()];
    const year = parseInt(m[3], 10);
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  // "DD/MM/YYYY" or "DD-MM-YYYY"
  const n = str.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (n) {
    const day = parseInt(n[1], 10);
    const month = parseInt(n[2], 10) - 1;
    const year = parseInt(n[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

// ─── Number Parsers ──────────────────────────────────────────
function parseVacancyCount(str) {
  if (!str) return null;
  const m = String(str).match(/([\d,]+)/);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function parseFeeAmount(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/[\d,]+/);
  if (m) {
    const n = parseInt(m[0].replace(/,/g, ""), 10);
    return isNaN(n) ? null : n;
  }
  return null;
}

function parseAgeNumber(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ─── State & Authority Detection (reuses enrichPostAI patterns) ───
const STATE_PATTERNS = [
  { r: /\bUP\b|uttar\s*pradesh/i, v: "Uttar Pradesh" },
  { r: /\bMP\b|madhya\s*pradesh/i, v: "Madhya Pradesh" },
  { r: /\bRajasthan\b/i, v: "Rajasthan" },
  { r: /\bBihar\b/i, v: "Bihar" },
  { r: /\bHaryana\b/i, v: "Haryana" },
  { r: /\bPunjab\b/i, v: "Punjab" },
  { r: /\bJharkhand\b/i, v: "Jharkhand" },
  { r: /\bGujarat\b/i, v: "Gujarat" },
  { r: /\bDelhi\b|\bDMRC\b|\bDSSB\b/i, v: "Delhi" },
  { r: /\bMaharashtra\b|\bMPSC\b/i, v: "Maharashtra" },
  { r: /\bKarnataka\b|\bKPSC\b/i, v: "Karnataka" },
  { r: /\bTamil\s*Nadu\b|\bTNPSC\b/i, v: "Tamil Nadu" },
  { r: /\bAndhra\b|\bAPPSC\b/i, v: "Andhra Pradesh" },
  { r: /\bTelangana\b|\bTSPSC\b/i, v: "Telangana" },
  { r: /\bKerala\b|\bKPSC\b/i, v: "Kerala" },
  { r: /\bOdisha\b|\bOPSC\b/i, v: "Odisha" },
  { r: /\bAssam\b|\bAPSC\b/i, v: "Assam" },
  { r: /\bWest\s*Bengal\b|\bWBCS\b/i, v: "West Bengal" },
  { r: /\bUttarakhand\b/i, v: "Uttarakhand" },
  { r: /\bHimachal\b|\bHPAS\b/i, v: "Himachal Pradesh" },
  { r: /\bGoa\b/i, v: "Goa" },
  { r: /\bChattisgarh\b|\bChhattisgarh\b/i, v: "Chhattisgarh" },
];

const AUTHORITY_PATTERNS = [
  { r: /UPPRPB|UP\s*Police\s*(?:Recr|SI|Const)/i, v: "UPPRPB", f: "Uttar Pradesh Police Recruitment & Promotion Board" },
  { r: /UPSESSB/i, v: "UPSESSB", f: "Uttar Pradesh Secondary Education Service Selection Board" },
  { r: /UPSSSC/i, v: "UPSSSC", f: "Uttar Pradesh Subordinate Services Selection Commission" },
  { r: /UPPSC/i, v: "UPPSC", f: "Uttar Pradesh Public Service Commission" },
  { r: /\bCSBC\b/i, v: "CSBC", f: "Central Selection Board of Constable, Bihar" },
  { r: /\bSSC\s*CGL\b/i, v: "SSC", f: "Staff Selection Commission" },
  { r: /\bSSC\s*CHSL\b/i, v: "SSC", f: "Staff Selection Commission" },
  { r: /\bSSC\s*MTS\b/i, v: "SSC", f: "Staff Selection Commission" },
  { r: /\bSSC\b/i, v: "SSC", f: "Staff Selection Commission" },
  { r: /\bUPSC\b/i, v: "UPSC", f: "Union Public Service Commission" },
  { r: /\bIBPS\b/i, v: "IBPS", f: "Institute of Banking Personnel Selection" },
  { r: /\bSBI\b/i, v: "SBI", f: "State Bank of India" },
  { r: /\bRRB\b/i, v: "RRB", f: "Railway Recruitment Board" },
  { r: /\bRRC\b/i, v: "RRC", f: "Railway Recruitment Cell" },
  { r: /\bAIIMS\b/i, v: "AIIMS", f: "All India Institute of Medical Sciences" },
  { r: /\bNTA\b/i, v: "NTA", f: "National Testing Agency" },
  { r: /\bDRDO\b/i, v: "DRDO", f: "Defence Research and Development Organisation" },
  { r: /\bNHM\b/i, v: "NHM", f: "National Health Mission" },
  { r: /\bBPSC\b/i, v: "BPSC", f: "Bihar Public Service Commission" },
  { r: /\bBSSC\b/i, v: "BSSC", f: "Bihar Staff Selection Commission" },
  { r: /\bMPPSC\b/i, v: "MPPSC", f: "Madhya Pradesh Public Service Commission" },
  { r: /\bRPSC\b/i, v: "RPSC", f: "Rajasthan Public Service Commission" },
  { r: /\bRSSB\b|\bRSMSSB\b/i, v: "RSSB", f: "Rajasthan Staff Selection Board" },
  { r: /\bHSSC\b/i, v: "HSSC", f: "Haryana Staff Selection Commission" },
  { r: /Indian\s*Army/i, v: "Indian Army", f: "Indian Army" },
  { r: /Indian\s*Navy/i, v: "Indian Navy", f: "Indian Navy" },
  { r: /Indian\s*Air\s*Force/i, v: "Indian Air Force", f: "Indian Air Force" },
  { r: /Bihar\s*Police/i, v: "Bihar Police", f: "Bihar Police" },
  { r: /Bihar\s*Vidhan\s*Parishad|\bBLCS\b/i, v: "BLCS", f: "Bihar Legislature Clerical Service (Bihar Vidhan Parishad)" },
  { r: /Bihar\s*Vidhan\s*Sabha/i, v: "BVS", f: "Bihar Vidhan Sabha" },
  { r: /High\s*Court/i, v: "High Court", f: "High Court" },
  { r: /\bHAL\b/i, v: "HAL", f: "Hindustan Aeronautics Limited" },
  { r: /\bNTPC\b/i, v: "NTPC", f: "National Thermal Power Corporation" },
  { r: /\bBHEL\b/i, v: "BHEL", f: "Bharat Heavy Electricals Limited" },
  { r: /\bONGC\b/i, v: "ONGC", f: "Oil and Natural Gas Corporation" },
];

// ─── Section → pageType / schemaType mapping ─────────────────
const SECTION_TYPE_MAP = {
  "latest-gov-job":     { pageType: "job-posting",  schemaType: "JobPosting" },
  "latest-gov-jobs":    { pageType: "job-posting",  schemaType: "JobPosting" },
  "latest-jobs":        { pageType: "job-posting",  schemaType: "JobPosting" },
  "result":             { pageType: "result",        schemaType: "Article" },
  "results":            { pageType: "result",        schemaType: "Article" },
  "admit-card":         { pageType: "admit-card",   schemaType: "Article" },
  "recent-admit-cards": { pageType: "admit-card",   schemaType: "Article" },
  "answer-key":         { pageType: "answer-key",   schemaType: "Article" },
  "admission":          { pageType: "admission",    schemaType: "Article" },
  "exam-date":          { pageType: "exam-date",    schemaType: "Article" },
  "syllabus":           { pageType: "syllabus",     schemaType: "Article" },
};

// ─── Word Count ──────────────────────────────────────────────
function countWords(html) {
  const plain = sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ").trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
}

// ─── Fuzzy Key Resolver ──────────────────────────────────────
// Different posts use different labels for the same field.
// This resolves any variation to a single value.
const DATE_KEY_ALIASES = {
  applyStart: [
    "online apply start date", "application begin", "apply start",
    "registration start", "starting date", "apply online start",
    "apply begin", "start date", "application start date",
    "online apply start", "registration begin",
  ],
  applyEnd: [
    "online apply last date", "last date to apply", "apply last date",
    "last date apply online", "application last date", "closing date",
    "last date", "apply end", "application end date",
    "last date for apply", "online apply last",
    "last date of application", "last date for registration",
  ],
  feeLastDate: [
    "last date for fee payment", "fee last date", "last date fee payment",
    "fee payment last date", "last date pay exam fee",
    "pay exam fee last date", "fee payment end date",
  ],
  examDate: [
    "exam date", "written exam date", "online exam date",
    "cbt date", "computer based test date", "examination date",
    "exam schedule", "paper date", "test date",
  ],
  admitCard: [
    "admit card", "admit card available", "admit card download",
    "admit card release", "hall ticket", "e-admit card",
  ],
  resultDate: [
    "result declared date", "result date", "result available",
    "result", "result announcement", "result out",
  ],
  regLastDate: [
    "registration last date", "reg last date",
    "last date for registration",
  ],
  correctionDate: [
    "correction date", "form correction", "correction window",
    "modification date",
  ],
};

const FEE_KEY_ALIASES = {
  general: [
    "general", "all category", "ur", "gen", "unreserved",
    "gen/obc/ews", "general/obc/ews", "for all",
    "all candidates", "for all category candidates",
    "general / obc / ews",
  ],
  obc: ["obc", "other backward class", "bc"],
  sc: ["sc", "scheduled caste"],
  st: ["st", "scheduled tribe"],
  ews: ["ews", "economically weaker"],
  ph: ["ph", "pwd", "handicap", "divyang", "peh", "physically handicapped"],
};

/**
 * Find the VALUE from an object where the key fuzzy-matches one of the aliases.
 * @param {object} obj - The scraped object (e.g. importantDates)
 * @param {string[]} aliases - Array of lowercase substrings to match against
 * @returns {string|null} - The matched value, or null
 */
function resolveByAliases(obj, aliases) {
  if (!obj) return null;
  for (const alias of aliases) {
    // Exact match first (fast path)
    for (const [key, val] of Object.entries(obj)) {
      if (key.toLowerCase() === alias) return val;
    }
  }
  // Fuzzy: check if any alias is a substring of any key (or vice versa)
  for (const alias of aliases) {
    for (const [key, val] of Object.entries(obj)) {
      const lk = key.toLowerCase();
      if (lk.includes(alias) || alias.includes(lk)) return val;
    }
  }
  return null;
}

// ─── Main Transformer ────────────────────────────────────────
/**
 * @param {object} md - convertToMeaningfulJSON output
 * @param {object} meta - { title, slug, sourceUrl, sectionName, sectionCanonicalUrl, formattedHtml, sourceSectionName, sourceSectionUrl }
 * @returns {object} - $set payload for MongoDB (only non-empty fields)
 */
function buildFullPayload(md, meta) {
  const title = meta.title || md.postTitle || "";
  const slug = meta.slug || "";
  const sectionCanonicalUrl = meta.sectionCanonicalUrl || "";
  const formattedHtml = meta.formattedHtml || "";

  const result = {};

  // ─── CONTENT ───
  // shortTitle: first 6 words of title
  const words = title.split(/\s+/);
  result.shortTitle = words.slice(0, 6).join(" ");

  // summary: auto-generate from available data
  const totalVac = parseVacancyCount(md.totalPost);
  const summaryParts = [title];
  if (totalVac) summaryParts.push(`Total ${totalVac} vacancies.`);
  const examDateRaw = md.importantDates ? resolveByAliases(md.importantDates, DATE_KEY_ALIASES.examDate) : null;
  if (examDateRaw && !/notify later|will be updated|coming soon/i.test(examDateRaw)) {
    summaryParts.push(`Exam date: ${examDateRaw}.`);
  }
  const lastDateRaw = md.importantDates ? resolveByAliases(md.importantDates, DATE_KEY_ALIASES.applyEnd) : null;
  if (lastDateRaw) {
    summaryParts.push(`Last date to apply: ${lastDateRaw}.`);
  }
  result.summary = summaryParts.join(" ").slice(0, 300);

  // ─── CLASSIFICATION ───
  const typeInfo = SECTION_TYPE_MAP[sectionCanonicalUrl] || { pageType: "general", schemaType: "Article" };
  result.pageType = typeInfo.pageType;
  result.schemaType = typeInfo.schemaType;
  result.language = "hi";

  // ─── AUTHORITY & LOCATION ───
  const haystack = title;
  for (const { r, v, f } of AUTHORITY_PATTERNS) {
    if (r.test(haystack)) {
      result.conductingAuthority = v;
      result.conductingAuthorityFull = f;
      break;
    }
  }
  for (const { r, v } of STATE_PATTERNS) {
    if (r.test(haystack)) {
      result.state = v;
      result.location = `${v}, India`;
      break;
    }
  }
  if (!result.state) result.location = "India";

  // officialWebsite: from importantLinks — prefer actual website over PDF/notification
  if (md.importantLinks && md.importantLinks.length) {
    const officials = md.importantLinks.filter((l) => l.type === "official");
    // Pick best: non-PDF with short path (root page) first
    const best = officials.find((l) => !/\.pdf$/i.test(l.url) && !/\/(Advt|Notification|Notice|Download)/i.test(l.url))
      || officials.find((l) => !/\.pdf$/i.test(l.url));
    if (best) {
      result.officialWebsite = best.url;
    } else {
      // Fallback: any link with .gov.in or .nic.in domain (actual govt website)
      const govLink = md.importantLinks.find((l) => /\.(gov|nic)\.in/i.test(l.url) && !/\.pdf$/i.test(l.url));
      if (govLink) result.officialWebsite = govLink.url;
    }
  }

  // ─── DATES (fuzzy key resolution) ───
  const dates = { lastUpdated: new Date() };
  if (md.importantDates) {
    const d = md.importantDates;

    const applyStartVal = resolveByAliases(d, DATE_KEY_ALIASES.applyStart);
    if (applyStartVal) dates.applyStart = parseIndianDate(applyStartVal);

    const applyEndVal = resolveByAliases(d, DATE_KEY_ALIASES.applyEnd);
    if (applyEndVal) dates.applyEnd = parseIndianDate(applyEndVal);

    const feeLastVal = resolveByAliases(d, DATE_KEY_ALIASES.feeLastDate);
    if (feeLastVal) dates.feeLastDate = parseIndianDate(feeLastVal);

    const regLastVal = resolveByAliases(d, DATE_KEY_ALIASES.regLastDate);
    if (regLastVal) dates.regLastDate = parseIndianDate(regLastVal);

    const examDateVal = resolveByAliases(d, DATE_KEY_ALIASES.examDate);
    const SKIP_VALUES = ["notify later", "will be updated", "as per schedule", "not declared", "coming soon"];
    if (examDateVal && !SKIP_VALUES.some((s) => examDateVal.toLowerCase().includes(s))) {
      dates.examDate = parseIndianDate(examDateVal);
    }

    const admitVal = resolveByAliases(d, DATE_KEY_ALIASES.admitCard);
    if (admitVal && !SKIP_VALUES.some((s) => admitVal.toLowerCase().includes(s)) && !/before exam/i.test(admitVal)) {
      dates.admitCard = parseIndianDate(admitVal);
    } else {
      dates.admitCard = null;
    }

    const resultVal = resolveByAliases(d, DATE_KEY_ALIASES.resultDate);
    if (resultVal && !SKIP_VALUES.some((s) => resultVal.toLowerCase().includes(s))) {
      dates.result = parseIndianDate(resultVal);
    } else {
      dates.result = null;
    }

    const correctionVal = resolveByAliases(d, DATE_KEY_ALIASES.correctionDate);
    if (correctionVal) dates.correctionDate = parseIndianDate(correctionVal);
  }
  // Remove null/undefined entries
  const cleanDates = {};
  for (const [k, v] of Object.entries(dates)) {
    if (v !== undefined) cleanDates[k] = v;
  }
  result.dates = cleanDates;

  // Top-level fast filter dates
  if (dates.applyEnd) result.applyLastDate = dates.applyEnd;
  if (dates.examDate) result.examDate = dates.examDate;

  // ─── JOB DETAILS ───
  if (totalVac) result.totalVacancies = totalVac;

  // ageLimit → numbers
  if (md.ageLimit) {
    result.ageLimit = {
      min: parseAgeNumber(md.ageLimit.min) || null,
      max: parseAgeNumber(md.ageLimit.max) || null,
      relaxation: md.ageLimit.byCategory && md.ageLimit.byCategory.length > 2,
      note: md.ageLimit.byCategory ? md.ageLimit.byCategory.slice(-1)[0] || "" : "",
    };
  }

  // applicationFee → numbers per category (fuzzy key matching)
  if (md.applicationFee && Object.keys(md.applicationFee).length) {
    const fee = {};
    const paymentModes = [];
    const PAYMENT_MODE_KEYS = ["debit card", "credit card", "internet banking", "imps", "cash card / mobile wallet", "mobile wallet", "net banking", "upi", "neft", "rtgs", "sbi collect", "e-challan"];

    for (const [key, val] of Object.entries(md.applicationFee)) {
      const lk = key.toLowerCase();
      if (lk.includes("payment mode")) continue;
      // Standalone payment mode keys
      if (PAYMENT_MODE_KEYS.some((pm) => lk.includes(pm) || pm.includes(lk))) {
        paymentModes.push(key);
        continue;
      }
      const amount = parseFeeAmount(val);
      if (amount !== null) {
        // Match against fee category aliases
        let matched = false;
        for (const [schemaKey, aliases] of Object.entries(FEE_KEY_ALIASES)) {
          if (aliases.some((a) => lk.includes(a) || a.includes(lk))) {
            if (!fee[schemaKey]) fee[schemaKey] = amount;
            matched = true;
            break;
          }
        }
        if (!matched && !fee.general) fee.general = amount; // fallback — first amount = general
      }
    }
    fee.currency = "INR";
    if (paymentModes.length) fee.paymentModes = paymentModes;
    result.applicationFee = fee;
  }

  // selectionProcess
  if (md.selectionProcess && md.selectionProcess.length) {
    result.selectionProcess = md.selectionProcess;
  }

  // salary — from vacancyDetails payScale/level fields OR embedded in eligibility text
  if (!result.salary && md.vacancyDetails && md.vacancyDetails.length) {
    const scales = [];
    for (const row of md.vacancyDetails) {
      for (const [k, v] of Object.entries(row)) {
        const lk = k.toLowerCase();
        const val = String(v || "");
        if (/pay.?scale|pay.?band|grade.?pay|^level|^salary/i.test(k) && val) {
          scales.push(val.trim());
        } else if ((lk.includes("eligib") || lk.includes("qualif")) && val) {
          // Extract "pay scale is Level-XX (₹...)" from eligibility text
          const m = val.match(/pay\s*scale\s+(?:is\s+)?([^.]{5,60})/i);
          if (m) scales.push(m[1].trim());
        }
      }
    }
    if (scales.length) result.salary = [...new Set(scales)].join(" | ").slice(0, 300);
  }

  // ─── SEO ───
  const metaDesc = result.summary || title;
  result.seo = {
    metaTitle: `${title} — Latest Update`.slice(0, 70),
    metaDescription: metaDesc.slice(0, 160),
    canonicalUrl: `https://sarkariafsar.com/jobs/${slug}`,
    ogTitle: title.slice(0, 70),
    ogDescription: metaDesc.slice(0, 160),
    ogImage: `https://sarkariafsar.com/og/${slug}.jpg`,
    keywords: (() => {
      const yr = (title.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear();
      const base = title.replace(/\s+\d{4}\s*/g, " ").replace(/\s+/g, " ").trim();
      const authority = result.conductingAuthority || "";
      const section = sectionCanonicalUrl.replace(/-/g, " ");
      const kws = [
        `${base} ${yr}`,
        authority ? `${authority} ${section} ${yr}` : `${base} ${section} ${yr}`,
        `${base} exam date ${yr}`,
        authority ? `${authority} vacancy ${yr} apply online` : `${base} vacancy ${yr}`,
        `${base} official notification pdf`,
      ];
      return [...new Set(kws)].slice(0, 5);
    })(),
    focusKeyword: result.shortTitle || title.slice(0, 40),
  };

  // ─── AUTHOR (hardcoded — E-E-A-T) ───
  result.author = {
    name: "Sarkari Afsar Editorial Team",
    bio: "Government recruitment updates aur sarkari naukri ki jankari provide karne wale experts.",
    profileUrl: "https://sarkariafsar.com/about",
  };

  // ─── TAGS (search phrases, not single words) ───
  const yr = (title.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear();
  const baseTitle = title.replace(/\s+\d{4}\s*/g, " ").replace(/\s+/g, " ").trim();
  const tagPhrases = [
    `${baseTitle} ${yr}`,
    result.conductingAuthority ? `${result.conductingAuthority} Recruitment ${yr}` : null,
    result.state ? `${result.state} Government Jobs` : "Sarkari Naukri",
    typeInfo.pageType === "admit-card" ? `${baseTitle} Download` : null,
    typeInfo.pageType === "result" ? `${baseTitle} Check` : null,
    typeInfo.pageType === "job-posting" && totalVac ? `${baseTitle} Vacancy ${totalVac} Posts` : null,
    result.state ? `${result.state} Sarkari Naukri ${yr}` : null,
  ].filter(Boolean);
  result.tags = [...new Set(tagPhrases)].slice(0, 6);

  // ─── STRUCTURED ───
  result.structured = {};

  // vacancyTable — ONLY rows with count (skip eligibility-only duplicate rows)
  if (md.vacancyDetails && md.vacancyDetails.length) {
    result.structured.vacancyTable = md.vacancyDetails.map((row) => {
      const entry = {};
      for (const [k, v] of Object.entries(row)) {
        const lk = k.toLowerCase().trim();
        if (lk.startsWith("no.") || lk.startsWith("no ") || /^(total|vacancies?|count)/.test(lk)) {
          entry.count = parseVacancyCount(v);
        } else if (lk === "ur") entry.ur = parseVacancyCount(v) || 0;
        else if (lk === "obc") entry.obc = parseVacancyCount(v) || 0;
        else if (lk === "sc") entry.sc = parseVacancyCount(v) || 0;
        else if (lk === "st") entry.st = parseVacancyCount(v) || 0;
        else if (lk === "ews") entry.ews = parseVacancyCount(v) || 0;
        else if (lk.includes("post") || lk.includes("name") || lk.includes("position")) entry.post = v;
        else if (lk.includes("total")) entry.count = parseVacancyCount(v);
        else if (lk.includes("eligib") || lk.includes("qualif")) { /* skip — goes to eligibility[] */ }
        else if (/pay.?scale|pay.?band|salary|level/i.test(lk)) { /* skip — goes to eligibility[] */ }
        else entry[k] = v;
      }
      return entry;
    }).filter((e) => e.post && e.count > 0);
  }

  // eligibility — from vacancyDetails with post + qualification/payScale
  //   payScale extracted from embedded text like "The pay scale is Level-07 (₹44,900–1,42,400)."
  if (md.vacancyDetails && md.vacancyDetails.length) {
    const eli = md.vacancyDetails.map((row) => {
      const e = { post: "", qualification: "", payScale: "" };
      for (const [k, v] of Object.entries(row)) {
        const lk = k.toLowerCase().trim();
        if (lk === "post name" || lk === "post" || lk.includes("position")) e.post = v;
        else if (/^no\.?\s*of/.test(lk)) { /* skip count rows */ }
        else if (lk.includes("eligib") || lk.includes("qualif")) {
          let qual = String(v || "");
          // Extract payScale if embedded in qualification text
          const psMatch = qual.match(/(?:The\s+)?pay\s*scale\s+(?:is\s+)?(Level[^)]*\))/i)
            || qual.match(/(?:The\s+)?pay\s*scale\s+(?:is\s+)?([^\n]{5,80}?)(?:\.|$)/i);
          if (psMatch) {
            e.payScale = psMatch[1].trim().replace(/\.$/, "");
            // Remove entire payScale sentence from qualification
            qual = qual.replace(/\.?\s*(?:The\s+)?pay\s*scale\s+(?:is\s+)?Level[^)]*\)\s*\.?\s*/i, "").trim();
            if (!qual) qual = qual; // keep whatever is left
          }
          e.qualification = qual;
        } else if (/pay.?scale|pay.?band|salary|level/i.test(lk)) e.payScale = v;
      }
      return e;
    }).filter((e) => e.post && (e.qualification || e.payScale));
    if (eli.length) result.eligibility = eli;
  }

  // faq
  if (md.faq && md.faq.length) {
    result.structured.faq = md.faq;
  }

  // importantLinks — deduplicate by URL before storing
  if (md.importantLinks && md.importantLinks.length) {
    const seenUrls = new Set();
    result.structured.importantLinks = md.importantLinks.filter(l => {
      if (!l.url || seenUrls.has(l.url)) return false;
      seenUrls.add(l.url);
      return true;
    });
  }

  // ─── COMPUTED ───
  const wc = countWords(formattedHtml);
  result.wordCount = wc;
  result.readingTimeMin = Math.ceil(wc / 200);
  result.completenessScore = md.completenessScore || 0;

  // ─── MISC ───
  result.disclaimer = "Yeh page sirf informational purpose ke liye hai. Official website se confirm karein.";

  // scrapedContent.contentJson — store cleaned parser output (strip payment-mode keys from applicationFee)
  const cleanedMd = { ...md };
  if (cleanedMd.applicationFee && typeof cleanedMd.applicationFee === "object") {
    const PM_KEYS = ["payment mode", "debit card", "credit card", "internet banking", "imps", "cash card", "mobile wallet", "net banking", "upi", "neft", "rtgs"];
    const cleanFee = {};
    for (const [k, v] of Object.entries(cleanedMd.applicationFee)) {
      const lk = k.toLowerCase();
      if (!PM_KEYS.some((pm) => lk.includes(pm)) && v && String(v).trim()) cleanFee[k] = v;
    }
    cleanedMd.applicationFee = cleanFee;
  }
  result["scrapedContent.contentJson"] = cleanedMd;

  return result;
}

module.exports = { buildFullPayload };
