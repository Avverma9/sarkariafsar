import JobSection, { toCanonicalUrl } from "../models/section.model.mjs";

const DEFAULT_SECTION_BY_TYPE = {
  job: { name: "Latest Gov Jobs", canonicalUrl: "latest-gov-jobs" },
  admit_card: { name: "Recent Admit Cards", canonicalUrl: "recent-admit-cards" },
  result: { name: "Results", canonicalUrl: "results" },
  answer_key: { name: "Results", canonicalUrl: "results" },
  admission: { name: "Admission", canonicalUrl: "admission" },
  corrigendum: { name: "Latest Gov Jobs", canonicalUrl: "latest-gov-jobs" },
  notice: { name: "Latest Gov Jobs", canonicalUrl: "latest-gov-jobs" },
};

const scoreSection = ({ section, postType = "job", title = "", status = "" }) => {
  const sectionName = String(section?.name || "").trim().toLowerCase();
  const canonicalUrl = String(section?.canonicalUrl || "").trim().toLowerCase();
  const titleText = `${title} ${status}`.toLowerCase();
  let score = 0;

  const preferred = DEFAULT_SECTION_BY_TYPE[postType] || DEFAULT_SECTION_BY_TYPE.job;
  if (canonicalUrl === preferred.canonicalUrl) score += 100;
  if (sectionName === preferred.name.toLowerCase()) score += 100;

  if (postType === "admit_card" && /admit|card/i.test(sectionName)) score += 40;
  if (postType === "result" && /result/i.test(sectionName)) score += 40;
  if (postType === "answer_key" && /(result|answer)/i.test(sectionName)) score += 40;
  if (postType === "admission" && /admission/i.test(sectionName)) score += 40;
  if (postType === "job" && /(job|recruit)/i.test(sectionName)) score += 40;

  if (/admit|hall ticket|call letter/i.test(titleText) && /admit/i.test(sectionName)) score += 20;
  if (/result|scorecard|merit list/i.test(titleText) && /result/i.test(sectionName)) score += 20;
  if (/admission|counselling|allotment/i.test(titleText) && /admission/i.test(sectionName)) score += 20;

  return score;
};

const getDefaultSection = (postType = "job") =>
  DEFAULT_SECTION_BY_TYPE[postType] || DEFAULT_SECTION_BY_TYPE.job;

const resolveJobSection = async ({ postType = "job", title = "", status = "" } = {}) => {
  const sections = await JobSection.find({ status: "active" }).sort({ name: 1 }).lean();

  if (!Array.isArray(sections) || sections.length === 0) {
    return getDefaultSection(postType);
  }

  const ranked = sections
    .map((section) => ({
      section,
      score: scoreSection({ section, postType, title, status }),
    }))
    .sort((left, right) => right.score - left.score);

  if (ranked[0]?.score > 0) {
    return {
      name: String(ranked[0].section?.name || "").trim(),
      canonicalUrl:
        String(ranked[0].section?.canonicalUrl || "").trim() ||
        toCanonicalUrl(ranked[0].section?.name || ""),
    };
  }

  return getDefaultSection(postType);
};

export { DEFAULT_SECTION_BY_TYPE, getDefaultSection, resolveJobSection, scoreSection };

export default resolveJobSection;
