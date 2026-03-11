const MONTH_LOOKUP = new Map([
  ["jan", 0],
  ["january", 0],
  ["feb", 1],
  ["february", 1],
  ["mar", 2],
  ["march", 2],
  ["apr", 3],
  ["april", 3],
  ["may", 4],
  ["jun", 5],
  ["june", 5],
  ["jul", 6],
  ["july", 6],
  ["aug", 7],
  ["august", 7],
  ["sep", 8],
  ["sept", 8],
  ["september", 8],
  ["oct", 9],
  ["october", 9],
  ["nov", 10],
  ["november", 10],
  ["dec", 11],
  ["december", 11],
]);

const APPLY_LAST_DATE_PATTERNS = [
  /\bonline\s*apply\s*last\s*date\b/i,
  /\bapplication\s*last\s*date\b/i,
  /\blast\s*date\s*for\s*apply\b/i,
  /\bapply\s*last\s*date\b/i,
  /\bregistration\s*last\s*date\b/i,
  /\bform\s*complete\s*last\s*date\b/i,
  /\bclosing\s*date\b/i,
  /\blast\s*date\b/i,
];

const NON_APPLY_LAST_DATE_PATTERNS = [
  /\bfee\b/i,
  /\bpayment\b/i,
  /\bcorrection\b/i,
  /\bedit\b/i,
  /\bexam\b/i,
  /\badmit\s*card\b/i,
  /\bresult\b/i,
  /\binterview\b/i,
  /\bmerit\b/i,
  /\banswer\s*key\b/i,
];

const toCleanText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const extractDateValueText = (value = "") => {
  const cleanValue = String(value || "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanValue) return "";

  const separatorIndex = cleanValue.indexOf(":");
  return separatorIndex >= 0
    ? cleanValue.slice(separatorIndex + 1).trim()
    : cleanValue;
};

const normalizeDateDisplayText = (value = "") =>
  toCleanText(
    String(value || "")
      .replace(/\((?:extended?|tentative|expected|approx(?:\.|imate)?|approximately|likely|today)\)/gi, " ")
      .replace(/\b(extended?|tentative|expected|approx(?:\.|imate)?|approximately|likely|today)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).replace(/[|,:-]+$/g, "").trim();

const parseDateParts = ({ year, month, day = 1, endOfMonth = false } = {}) => {
  const parsedYear = Number.parseInt(String(year || ""), 10);
  const parsedMonth = Number.parseInt(String(month || ""), 10);
  const parsedDay = Number.parseInt(String(day || ""), 10);

  if (
    Number.isNaN(parsedYear) ||
    Number.isNaN(parsedMonth) ||
    parsedMonth < 0 ||
    parsedMonth > 11
  ) {
    return null;
  }

  const resolvedDay = endOfMonth
    ? new Date(Date.UTC(parsedYear, parsedMonth + 1, 0)).getUTCDate()
    : parsedDay;
  const date = new Date(Date.UTC(parsedYear, parsedMonth, resolvedDay, 23, 59, 59, 999));
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateText = (value = "") => {
  const normalized = toCleanText(value);
  if (!normalized) return null;

  if (
    /\b(district wise|notify later|notified soon|before exam|will be updated|updated soon|coming soon|soon|tba|n\/a|na)\b/i.test(
      normalized
    )
  ) {
    return null;
  }

  let match = normalized.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (match) {
    const [, day, month, year] = match;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return parseDateParts({
      year: normalizedYear,
      month: Number.parseInt(month, 10) - 1,
      day,
    });
  }

  match = normalized.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b/i
  );
  if (match) {
    const [, day, monthName, year] = match;
    const month = MONTH_LOOKUP.get(monthName.toLowerCase());
    if (month !== undefined) {
      return parseDateParts({ year, month, day });
    }
  }

  match = normalized.match(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/i
  );
  if (match) {
    const [, monthName, day, year] = match;
    const month = MONTH_LOOKUP.get(monthName.toLowerCase());
    if (month !== undefined) {
      return parseDateParts({ year, month, day });
    }
  }

  match = normalized.match(/\b([A-Za-z]{3,9})\.?\s+(\d{4})\b/i);
  if (match) {
    const [, monthName, year] = match;
    const month = MONTH_LOOKUP.get(monthName.toLowerCase());
    if (month !== undefined) {
      return parseDateParts({ year, month, endOfMonth: true });
    }
  }

  return null;
};

export const extractApplyLastDateMeta = (detail = {}) => {
  const importantDates = Array.isArray(detail?.jsonData?.importantDates)
    ? detail.jsonData.importantDates
    : Array.isArray(detail?.importantDates)
      ? detail.importantDates
      : [];

  const candidates = [];

  for (const [index, item] of importantDates.entries()) {
    const line = toCleanText(item);
    if (!line) continue;

    const matchedPatternIndex = APPLY_LAST_DATE_PATTERNS.findIndex((pattern) =>
      pattern.test(line)
    );
    if (matchedPatternIndex < 0) continue;

    if (
      matchedPatternIndex > 0 &&
      NON_APPLY_LAST_DATE_PATTERNS.some((pattern) => pattern.test(line))
    ) {
      continue;
    }

    const displayValue = normalizeDateDisplayText(extractDateValueText(line));
    const parsedDate = parseDateText(displayValue);
    if (!parsedDate) continue;

    candidates.push({
      index,
      priority: matchedPatternIndex,
      applyLastDate: displayValue,
      applyLastDateIso: parsedDate.toISOString(),
      applyLastDateTimestamp: parsedDate.getTime(),
      sourceText: line,
    });
  }

  if (candidates.length === 0) {
    return {
      applyLastDate: "",
      applyLastDateIso: "",
      applyLastDateTimestamp: 0,
      sourceText: "",
    };
  }

  candidates.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return left.index - right.index;
  });

  return candidates[0];
};

export default {
  extractApplyLastDateMeta,
};
