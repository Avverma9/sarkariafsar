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

export const isGenericStatus = (value = "", postType = "job") => {
  const normalized = normalizeStatusKey(value);
  if (!normalized) return true;
  const patterns = GENERIC_STATUS_BY_TYPE[String(postType || "job").trim()] || GENERIC_STATUS_BY_TYPE.job;
  return patterns.has(normalized);
};

export const buildHumanStatus = ({
  postType = "job",
  applyLastDate = null,
  currentStatus = "",
} = {}) => {
  const normalizedPostType = String(postType || "job").trim() || "job";
  const current = toText(currentStatus);

  if (current && !isGenericStatus(current, normalizedPostType)) {
    return current;
  }

  if (normalizedPostType === "job") {
    return applyLastDate
      ? "Online application window is currently open on the official portal."
      : "Official recruitment update is available on the portal.";
  }
  if (normalizedPostType === "admit_card") {
    return "Admit card is available to download from the official portal.";
  }
  if (normalizedPostType === "result") {
    return "Result has been declared on the official portal.";
  }
  if (normalizedPostType === "answer_key") {
    return "Official answer key is available on the official portal.";
  }
  if (normalizedPostType === "admission") {
    return "Admission process is active on the official portal.";
  }
  if (normalizedPostType === "corrigendum") {
    return "An official corrigendum has been published for this post.";
  }
  if (normalizedPostType === "notice") {
    return "An official notice has been published for this post.";
  }

  return current || "An official update is available on the portal.";
};

export default {
  buildHumanStatus,
  isGenericStatus,
};
