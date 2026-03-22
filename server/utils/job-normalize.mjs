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

const extractAdvertisementNumber = (source = {}) => {
  const direct = String(source?.advertisement_number || "").trim();
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

const parseLooseDate = (value) => {
  const normalized = normalizeDateString(value);
  if (!normalized) return null;

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

const extractApplyLastDate = (source = {}) => {
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

const normalizeJobInput = (value = {}) => {
  const root = toObject(value);
  const source = { ...(root.post ? toObject(root.post) : root) };
  const slug = String(source.slug || toSlug(source.jobtitle || source.title || "")).trim();
  const sectionCanonicalUrl = String(source.sectionCanonicalUrl || "").trim();
  const sectionName = String(source.sectionName || "").trim();
  const jobtitle = String(source.jobtitle || source.title || "").trim();
  const advertisementNumber = extractAdvertisementNumber(source);
  const postDate = toDate(source.postDate, "postDate");
  const applyLastDate = toDate(extractApplyLastDate(source), "applyLastDate", {
    required: true,
  });
  const dedupeBase =
    advertisementNumber ||
    `${sectionCanonicalUrl}:${toComparableText(jobtitle)}`;
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
  source.applyLastDate = applyLastDate;
  if (advertisementNumber) {
    source.advertisement_number = advertisementNumber;
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
  parseLooseDate,
  toComparableText,
  toDate,
  toObject,
  toSlug,
};

export default normalizeJobInput;
