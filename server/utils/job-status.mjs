const GENERIC_STATUS_BY_TYPE = {
  job: new Set(["form open", "application open", "job"]),
  admit_card: new Set(["admit card", "admit card out"]),
  result: new Set(["result out", "result"]),
  answer_key: new Set(["answer key"]),
  admission: new Set(["admission"]),
  corrigendum: new Set(["corrigendum"]),
  notice: new Set(["notice"]),
};

const toText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const normalizeStatusKey = (value = "") => toText(value).toLowerCase();

const GENERIC_STATUS_PATTERNS = [
  /^online application window is currently open on the official portal\.?$/i,
  /^official recruitment update is available on the portal\.?$/i,
  /^admit card is available to download from the official portal\.?$/i,
  /^result has been declared on the official portal\.?$/i,
  /^official answer key is available on the official portal\.?$/i,
  /^admission process is active on the official portal\.?$/i,
  /^an official corrigendum has been published for this post\.?$/i,
  /^an official notice has been published for this post\.?$/i,
  /^an official update is available on the portal\.?$/i,
];

const getStageAwareTitle = (title = "", postType = "job") => {
  const normalizedTitle = toText(title);
  if (!normalizedTitle) return "";

  const suffixByType = {
    result: /\s+(result|results|score\s*card|merit\s*list)$/i,
    admit_card: /\s+(admit\s*card|hall\s*ticket|call\s*letter)$/i,
    answer_key: /\s+(answer\s*key|response\s*sheet)$/i,
    admission: /\s+(admission|counselling|counseling)$/i,
  };

  const stripped = suffixByType[postType]
    ? normalizedTitle.replace(suffixByType[postType], "").trim()
    : normalizedTitle;

  return stripped || normalizedTitle;
};

const buildNoticeStatusFromTitle = (title = "", postType = "notice") => {
  const normalizedTitle = toText(title);
  if (!normalizedTitle) {
    return postType === "corrigendum"
      ? "An official corrigendum is now available on the authority portal."
      : "An official notice is now available on the authority portal.";
  }

  if (/refund.*exam[- ]?fees?|bank account/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice is now available with bank-account and refund instructions for affected candidates.`;
  }

  if (/list of candidates|considered as ur/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice has been published for candidates affected by the latest category or shortlist update.`;
  }

  if (/incomplete application form|final registration/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice is active on the official portal for candidates who still need to complete the pending application steps.`;
  }

  if (/change the examination date|revised dates?|revised shift|postponed|re-?scheduled/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice confirms a revised examination schedule on the official portal.`;
  }

  if (/admit card|exam district|exam city|venue|centre|center/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice has been published with the latest venue, admit card, or exam-city instructions.`;
  }

  if (/document verification|\bdv\b/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice has been issued for the document-verification stage and related reporting instructions.`;
  }

  if (/interview|personal assessment|stage[- ]?ii|stage[- ]?iii|skill test|typing test/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice now carries the next-stage schedule and reporting instructions for shortlisted candidates.`;
  }

  if (/result|merit|cut[- ]?off|score/i.test(normalizedTitle)) {
    return `${normalizedTitle} notice is available on the official portal for candidates who need the latest merit or result-stage instructions.`;
  }

  if (postType === "corrigendum") {
    return `${normalizedTitle} corrigendum has been published on the official portal with revised instructions for candidates.`;
  }

  return `${normalizedTitle} notice is now available on the official portal with updated candidate instructions.`;
};

export const isGenericStatus = (value = "", postType = "job") => {
  const normalized = normalizeStatusKey(value);
  if (!normalized) return true;
  const patterns = GENERIC_STATUS_BY_TYPE[String(postType || "job").trim()] || GENERIC_STATUS_BY_TYPE.job;
  return patterns.has(normalized) || GENERIC_STATUS_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const buildHumanStatus = ({
  postType = "job",
  applyLastDate = null,
  currentStatus = "",
  title = "",
} = {}) => {
  const normalizedPostType = String(postType || "job").trim() || "job";
  const current = toText(currentStatus);
  const normalizedTitle = toText(title);
  const stageAwareTitle = getStageAwareTitle(normalizedTitle, normalizedPostType);

  if (current && !isGenericStatus(current, normalizedPostType)) {
    return current;
  }

  if (normalizedPostType === "job") {
    if (normalizedTitle && applyLastDate) {
      return `Applications for ${normalizedTitle} are currently open on the official portal.`;
    }

    if (normalizedTitle) {
      return `${normalizedTitle} is currently available on the official portal for candidate reference.`;
    }

    return applyLastDate
      ? "Applications are currently open on the official portal."
      : "An official recruitment update is available on the portal.";
  }
  if (normalizedPostType === "admit_card") {
    return stageAwareTitle
      ? `${stageAwareTitle} admit card is available to download from the official portal.`
      : "Admit card is available to download from the official portal.";
  }
  if (normalizedPostType === "result") {
    return stageAwareTitle
      ? `${stageAwareTitle} result has been published on the official portal.`
      : "Result has been declared on the official portal.";
  }
  if (normalizedPostType === "answer_key") {
    return stageAwareTitle
      ? `${stageAwareTitle} answer key is available on the official portal for candidate review.`
      : "Official answer key is available on the official portal.";
  }
  if (normalizedPostType === "admission") {
    return stageAwareTitle
      ? `${stageAwareTitle} admission process is currently active on the official portal.`
      : "Admission process is active on the official portal.";
  }
  if (normalizedPostType === "corrigendum") {
    return buildNoticeStatusFromTitle(normalizedTitle, "corrigendum");
  }
  if (normalizedPostType === "notice") {
    return buildNoticeStatusFromTitle(normalizedTitle, "notice");
  }

  return current || "An official update is available on the portal.";
};

export default {
  buildHumanStatus,
  isGenericStatus,
};
