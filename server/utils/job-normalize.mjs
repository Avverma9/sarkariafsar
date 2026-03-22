const toObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const toSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toComparableText = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeStageKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const hasOwn = (value, key) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);

const extractAdvertisementNumber = (source = {}) => {
  const direct = String(source?.advertisement_number || source?.advertisementNumber || "").trim();
  if (direct) return direct;

  const fromOfficialLinks = String(
    source?.official_links?.advertisement_number ||
      source?.officialLinks?.advertisement_number ||
      ""
  ).trim();
  if (fromOfficialLinks) return fromOfficialLinks;

  const candidates = [
    String(source?.jobtitle || "").trim(),
    String(source?.title || "").trim(),
  ].filter(Boolean);

  for (const text of candidates) {
    const match =
      text.match(/(?:advt\.?|advertisement)\s*no\.?\s*[:\-]?\s*([a-z0-9./-]+)/i) ||
      text.match(/\b(CEN(?:[-\s]+RPF|[-\s]+RRC)?[-\s]*\d{1,3}\/\d{4})\b/i) ||
      text.match(/\b(\d{1,4}\/[a-z0-9-]{2,}\/\d{4})\b/i);

    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }

  return "";
};

const toDate = (value, fieldName, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid`);
  }

  return parsed;
};

const normalizeDateString = (value = "") =>
  String(value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bpassed\b/gi, " ")
    .replace(/\btba\b/gi, " ")
    .replace(/\bnot announced yet\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildLocalDate = ({
  year,
  month,
  day,
  hours = 0,
  minutes = 0,
}) => {
  const parsed = new Date(year, month - 1, day, hours, minutes);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseLooseDate = (value) => {
  const normalized = normalizeDateString(value);
  if (!normalized) return null;

  const dayFirstMatch = normalized.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s*[-,]?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i
  );

  if (dayFirstMatch) {
    let [, day, month, year, hours = "0", minutes = "0", meridiem = ""] = dayFirstMatch;
    let resolvedYear = Number(year);
    if (resolvedYear < 100) resolvedYear += resolvedYear >= 70 ? 1900 : 2000;

    let resolvedHours = Number(hours);
    const resolvedMinutes = Number(minutes);
    const normalizedMeridiem = String(meridiem || "").toLowerCase();
    if (normalizedMeridiem === "pm" && resolvedHours < 12) resolvedHours += 12;
    if (normalizedMeridiem === "am" && resolvedHours === 12) resolvedHours = 0;

    const parsedDayFirst = buildLocalDate({
      year: resolvedYear,
      month: Number(month),
      day: Number(day),
      hours: resolvedHours,
      minutes: resolvedMinutes,
    });
    if (parsedDayFirst) return parsedDayFirst;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const collectApplyDateCandidates = (value, candidates = []) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object") {
        const event = String(item.event || item.label || item.name || "").trim();
        const rawDate = item.date ?? item.last_date ?? item.applyLastDate;

        if (
          rawDate &&
          /last date to apply|last date.*apply|application.*last date|apply online.*last date|last date for fee payment/i.test(
            event
          )
        ) {
          candidates.push(rawDate);
        }
      }

      collectApplyDateCandidates(item, candidates);
    }

    return candidates;
  }

  if (!value || typeof value !== "object") {
    return candidates;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (
      entry !== undefined &&
      entry !== null &&
      /^(last_date|date|applyLastDate)$/i.test(String(key))
    ) {
      candidates.push(entry);
    }

    collectApplyDateCandidates(entry, candidates);
  }

  return candidates;
};

const extractApplyLastDate = (
  source = {},
  { preserveExplicitNullApplyLastDate = false } = {}
) => {
  if (hasOwn(source, "applyLastDate")) {
    if (
      preserveExplicitNullApplyLastDate &&
      (source.applyLastDate === null || source.applyLastDate === "")
    ) {
      return null;
    }

    if (source.applyLastDate) {
      return source.applyLastDate;
    }
  }

  if (source.applyLastDate) {
    return source.applyLastDate;
  }

  const candidates = collectApplyDateCandidates(source?.important_dates, []);
  collectApplyDateCandidates(source?.vacancy_details, candidates);

  const parsedDates = candidates
    .map((item) => parseLooseDate(item))
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());

  return parsedDates[0] || undefined;
};

const normalizeJobInput = (
  value = {},
  { preserveExplicitNullApplyLastDate = false } = {}
) => {
  const root = toObject(value);
  const source = { ...(root.post ? toObject(root.post) : root) };
  const postType = normalizeStageKey(source.postType || "job") || "job";
  const title = String(source.title || source.jobtitle || "").trim();
  const sectionCanonicalUrl = String(source.sectionCanonicalUrl || "").trim();
  const sectionName = String(source.sectionName || "").trim();
  const jobtitle = String(source.jobtitle || source.title || "").trim();
  const slugBase =
    source.slug ||
    toSlug(postType === "job" ? jobtitle || title : `${jobtitle || title}-${postType}`);
  const slug = String(slugBase || "").trim();
  const advertisementNumber = extractAdvertisementNumber(source);
  const conductingAuthority = String(
    source.conducting_authority || source.conductingAuthority || ""
  ).trim();
  const postDate = toDate(source.postDate, "postDate");
  const resolvedApplyLastDate = extractApplyLastDate(source, {
    preserveExplicitNullApplyLastDate,
  });
  const hasExplicitNullApplyLastDate = resolvedApplyLastDate === null;
  const applyLastDate = hasExplicitNullApplyLastDate
    ? null
    : toDate(resolvedApplyLastDate, "applyLastDate");
  const dedupeBase =
    postType === "job"
      ? advertisementNumber || `${sectionCanonicalUrl}:${toComparableText(jobtitle)}`
      : `${advertisementNumber || sectionCanonicalUrl}:${toComparableText(jobtitle)}:${postType}`;
  const dedupeKey = toSlug(dedupeBase);

  if (!slug) {
    throw new Error("slug is required");
  }
  if (!dedupeKey) {
    throw new Error("dedupeKey could not be generated");
  }
  if (!sectionCanonicalUrl) {
    throw new Error("sectionCanonicalUrl is required");
  }
  if (!sectionName) {
    throw new Error("sectionName is required");
  }
  if (!jobtitle) {
    throw new Error("jobtitle or title is required");
  }

  source.dedupeKey = dedupeKey;
  source.slug = slug;
  source.sectionCanonicalUrl = sectionCanonicalUrl;
  source.sectionName = sectionName;
  source.jobtitle = jobtitle;
  source.title = title || jobtitle;
  source.postType = postType;
  if (advertisementNumber) {
    source.advertisement_number = advertisementNumber;
    source.advertisementNumber = String(source.advertisementNumber || advertisementNumber).trim();
  }
  if (conductingAuthority) {
    source.conducting_authority = conductingAuthority;
    source.conductingAuthority = conductingAuthority;
  }
  if (hasExplicitNullApplyLastDate) {
    source.applyLastDate = null;
  } else if (applyLastDate) {
    source.applyLastDate = applyLastDate;
  } else {
    delete source.applyLastDate;
  }

  if (postDate) {
    source.postDate = postDate;
  } else {
    delete source.postDate;
  }

  return source;
};

export {
  collectApplyDateCandidates,
  extractAdvertisementNumber,
  extractApplyLastDate,
  normalizeJobInput,
  normalizeStageKey,
  parseLooseDate,
  toComparableText,
  toDate,
  toObject,
  toSlug,
};

export default normalizeJobInput;
