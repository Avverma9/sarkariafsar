import { extractAdvertisementNumber, normalizeStageKey, toComparableText, toSlug } from "./job-normalize.mjs";

const POST_TYPE_PATTERNS = [
  { postType: "admit_card", patterns: [/admit[\s_-]?card/i, /hall[\s_-]?ticket/i, /e[\s_-]?call[\s_-]?letter/i, /call[\s_-]?letter/i, /interview[\s_-]?letter/i, /exam city/i, /city intimation/i, /intimation slip/i, /exam district/i] },
  { postType: "result", patterns: [/result/i, /score ?card/i, /merit list/i, /cut ?off/i, /selected candidates/i] },
  { postType: "answer_key", patterns: [/answer key/i, /response sheet/i, /objection/i, /provisional key/i] },
  { postType: "admission", patterns: [/admission/i, /counselling/i, /seat allotment/i, /seat allocation/i, /allotment/i, /counseling/i] },
  { postType: "corrigendum", patterns: [/corrigendum/i, /revised notice/i, /revision/i, /extension notice/i, /extended/i] },
  { postType: "notice", patterns: [/notification/i, /notice/i] },
];

const STAGE_TERMS_PATTERN =
  /\b(result|score ?card|merit list|cut ?off|admit card|hall ticket|call letter|exam city|answer key|response sheet|admission|counselling|seat allotment|corrigendum|revised notice|apply online|recruitment|notification|download now|out|released)\b/gi;

const DIRECT_LINK_KEYS = [
  "apply_link",
  "notification_pdf",
  "admit_card_link",
  "result_link",
  "answer_key_link",
  "admission_link",
  "corrigendum_link",
];

const toText = (value = "") => String(value || "").trim();

const normalizeUrl = (value = "") => {
  const candidate = toText(value);
  if (!candidate) return "";

  try {
    const parsed = new URL(candidate);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const collectTexts = (...values) =>
  values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => toText(value))
    .filter(Boolean);

const detectPostTypeFromText = (value = "") => {
  for (const rule of POST_TYPE_PATTERNS) {
    if (rule.patterns.some((pattern) => pattern.test(value))) {
      return rule.postType;
    }
  }

  return "job";
};

const inferPostType = (source = {}) => {
  const explicit = normalizeStageKey(source.postType || source.type || source.contentType || "");
  if (explicit) return explicit;

  const texts = collectTexts(
    source.title,
    source.jobtitle,
    source.status,
    source.meta?.description,
    source.linkLabel,
    source.sectionName,
    source.sourceUrl,
    source.direct_links?.apply_link,
    source.direct_links?.admit_card_link,
    source.direct_links?.result_link
  );

  for (const text of texts) {
    const detected = detectPostTypeFromText(text);
    if (detected !== "job") return detected;
  }

  return "job";
};

const stripLifecycleTerms = (value = "") =>
  toText(value)
    .replace(STAGE_TERMS_PATTERN, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeAuthority = (source = {}) =>
  toComparableText(
    source.conducting_authority ||
      source.conductingAuthority ||
      source.official_links?.heading ||
      source.official_links?.official_website ||
      ""
  );

const extractSourceDomain = (source = {}) => {
  const candidates = collectTexts(
    source.sourceUrl,
    source.official_links?.official_website,
    source.direct_links?.apply_link,
    source.direct_links?.notification_pdf,
    source.official_links?.links?.map((item) => item?.url)
  );

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (!normalized) continue;

    try {
      return new URL(normalized).hostname.replace(/^www\./i, "");
    } catch {
      // ignore malformed
    }
  }

  return "";
};

const buildRecruitmentKey = (source = {}) => {
  const advertisementNumber = extractAdvertisementNumber(source);
  const authority = normalizeAuthority(source);
  const baseTitle = stripLifecycleTerms(source.jobtitle || source.title || "");
  const titleKey = toSlug(baseTitle || source.jobtitle || source.title || "");
  const domain = toSlug(extractSourceDomain(source));
  const parts = advertisementNumber
    ? [authority, toSlug(advertisementNumber), domain].filter(Boolean)
    : [authority, titleKey, domain].filter(Boolean);

  return parts.join("|");
};

const normalizeDirectLinks = (source = {}) => {
  const raw = source.direct_links && typeof source.direct_links === "object" ? source.direct_links : {};
  const next = {};

  for (const key of DIRECT_LINK_KEYS) {
    const normalized = normalizeUrl(raw[key]);
    if (normalized) next[key] = normalized;
  }

  const officialWebsite = normalizeUrl(source?.official_links?.official_website || source?.sourceUrl || "");
  if (officialWebsite && !next.official_website) {
    next.official_website = officialWebsite;
  }

  return next;
};

const inferLifecycleStage = (source = {}) => {
  const explicit = normalizeStageKey(source.lifecycleStage || "");
  if (explicit) return explicit;

  const postType = inferPostType(source);
  const applyLastDate = source.applyLastDate ? new Date(source.applyLastDate) : null;
  const now = new Date();

  if (postType === "admit_card") return "admit_card_phase";
  if (postType === "result") return "result_phase";
  if (postType === "answer_key") return "answer_key_phase";
  if (postType === "admission") return "admission_phase";
  if (postType === "corrigendum") return "corrigendum";
  if (postType === "notice") return "notice";

  if (applyLastDate && !Number.isNaN(applyLastDate.getTime()) && applyLastDate.getTime() < now.getTime()) {
    return "application_closed";
  }

  return "application_open";
};

const inferIsActive = (source = {}) => {
  const lifecycleStage = inferLifecycleStage(source);
  return lifecycleStage !== "application_closed";
};

const inferStatusReason = (source = {}) => {
  if (source.statusReason) return toText(source.statusReason);

  const lifecycleStage = inferLifecycleStage(source);
  if (lifecycleStage === "application_closed") {
    return "Application window appears to be closed based on the current last date.";
  }
  if (lifecycleStage === "admit_card_phase") {
    return "Recruitment lifecycle has moved to admit card stage.";
  }
  if (lifecycleStage === "result_phase") {
    return "Recruitment lifecycle has moved to result stage.";
  }
  if (lifecycleStage === "admission_phase") {
    return "Recruitment lifecycle has moved to admission stage.";
  }

  return "";
};

const shouldIgnoreExpiredCandidate = (source = {}, { expiryGraceDays = 15 } = {}) => {
  if (inferPostType(source) !== "job") return false;
  if (!source.applyLastDate) return false;

  const applyLastDate = new Date(source.applyLastDate);
  if (Number.isNaN(applyLastDate.getTime())) return false;

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - expiryGraceDays);
  return applyLastDate.getTime() < threshold.getTime();
};

const buildLifecycleMetadata = (source = {}) => {
  const postType = inferPostType(source);
  const recruitmentKey = buildRecruitmentKey({ ...source, postType });
  const sourceDomain = extractSourceDomain(source);
  const direct_links = normalizeDirectLinks(source);
  const lifecycleStage = inferLifecycleStage({ ...source, postType });
  const isActive = inferIsActive({ ...source, postType, lifecycleStage });
  const statusReason = inferStatusReason({ ...source, postType, lifecycleStage });

  return {
    postType,
    recruitmentKey,
    sourceDomain,
    sourceUrl: normalizeUrl(source.sourceUrl || direct_links.official_website || ""),
    direct_links,
    lifecycleStage,
    isActive,
    statusReason,
  };
};

export {
  DIRECT_LINK_KEYS,
  buildLifecycleMetadata,
  buildRecruitmentKey,
  detectPostTypeFromText,
  extractSourceDomain,
  inferIsActive,
  inferLifecycleStage,
  inferPostType,
  normalizeDirectLinks,
  shouldIgnoreExpiredCandidate,
  stripLifecycleTerms,
};

export default {
  buildLifecycleMetadata,
  buildRecruitmentKey,
  detectPostTypeFromText,
  extractSourceDomain,
  inferIsActive,
  inferLifecycleStage,
  inferPostType,
  normalizeDirectLinks,
  shouldIgnoreExpiredCandidate,
  stripLifecycleTerms,
};
