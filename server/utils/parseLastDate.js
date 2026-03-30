/**
 * Parses the "last date to apply" from a job post's contentHtml.
 * Handles DD/MM/YYYY, DD-MM-YYYY, DD Month YYYY formats.
 * Searches for context keywords: "last date", "apply last date", "closing date", etc.
 */

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

// Patterns that indicate a "last date" label (English + Hindi)
const LABEL_PATTERNS = [
  /(?:last\s+date(?:\s+(?:to|for|of)\s+\w+)*|apply\s+last\s+date|application\s+(?:last\s+)?date|online\s+apply\s+last\s+date|closing\s+date|apply\s+(?:online\s+)?before|submission\s+(?:last\s+)?date|application\s+deadline|due\s+date)\s*[:\-–—]?\s*/gi,
  // Hindi transliteration
  /(?:अंतिम\s+तिथि|आवेदन\s+की\s+अंतिम\s+तिथि|अंतिम\s+दिनांक|अंतिम\s+तारीख)\s*[:\-–—]?\s*/gi,
];

// Raw date patterns (what follows a label)
const DATE_REGEX_NUMERIC = /(\d{1,2})[\/\-.—–](\d{1,2})[\/\-.—–](\d{2,4})/; // DD/MM/YYYY
const DATE_REGEX_ALPHA = /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/i;
const DATE_REGEX_ALPHA_REV = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})[,\s]+(\d{4})/i;

function tryParseDate(str) {
  if (!str) return null;
  str = str.trim().replace(/\s+/g, " ");

  // DD/MM/YYYY or DD-MM-YYYY
  let m = str.match(DATE_REGEX_NUMERIC);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    // Swap if month > 12 (DD/MM vs MM/DD ambiguity — Indian format is DD/MM)
    const day = parseInt(d, 10), month = parseInt(mo, 10), year = parseInt(y, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // DD Month YYYY
  m = str.match(DATE_REGEX_ALPHA);
  if (m) {
    const [, d, mon, y] = m;
    const moIdx = MONTH_MAP[mon.toLowerCase()];
    if (moIdx !== undefined) {
      const date = new Date(parseInt(y, 10), moIdx, parseInt(d, 10));
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Month DD YYYY
  m = str.match(DATE_REGEX_ALPHA_REV);
  if (m) {
    const [, mon, d, y] = m;
    const moIdx = MONTH_MAP[mon.toLowerCase()];
    if (moIdx !== undefined) {
      const date = new Date(parseInt(y, 10), moIdx, parseInt(d, 10));
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

function stripHtml(html = "") {
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<td[^>]*>/gi, " | ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ");
}

/**
 * @param {string} contentHtml
 * @returns {Date|null}
 */
function parseLastDateFromHtml(contentHtml = "") {
  if (!contentHtml) return null;

  const text = stripHtml(contentHtml);
  const candidates = [];

  for (const labelPattern of LABEL_PATTERNS) {
    labelPattern.lastIndex = 0;
    let labelMatch;
    while ((labelMatch = labelPattern.exec(text)) !== null) {
      // Take up to 80 chars after the label to find the date
      const afterLabel = text.slice(labelMatch.index + labelMatch[0].length, labelMatch.index + labelMatch[0].length + 80);
      const date = tryParseDate(afterLabel);
      if (date) candidates.push(date);
    }
  }

  if (!candidates.length) return null;

  // If multiple found (e.g. extended dates), return the latest one
  candidates.sort((a, b) => b - a);
  return candidates[0];
}

module.exports = { parseLastDateFromHtml };
