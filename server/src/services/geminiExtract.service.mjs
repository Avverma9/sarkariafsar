import { buildReadyPostHtml } from "../utils/postHtmlTransform.mjs";
import { buildDraftRecruitmentFromHtml } from "../utils/recruitmentDraft.util.mjs";

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getRecruitmentDefaults(sourceUrl = "") {
  return {
    title: "",
    advertisementNumber: "",
    organization: {
      name: "",
      shortName: "",
      website: "",
      type: "Other",
    },
    importantDates: {
      notificationDate: "",
      postDate: "",
      applicationStartDate: "",
      applicationLastDate: "",
      feePaymentLastDate: "",
      correctionDate: "",
      preExamDate: "",
      mainsExamDate: "",
      examDate: "",
      admitCardDate: "",
      resultDate: "",
      answerKeyReleaseDate: "",
      finalAnswerKeyDate: "",
      documentVerificationDate: "",
      counsellingDate: "",
      meritListDate: "",
    },
    vacancyDetails: {
      totalPosts: 0,
      positions: [],
      categoryWise: {
        general: 0,
        obc: 0,
        sc: 0,
        st: 0,
        ewsExemption: 0,
        ph: 0,
        other: {},
      },
      districtWise: [],
    },
    applicationFee: {
      general: 0,
      ewsObc: 0,
      scSt: 0,
      female: 0,
      ph: 0,
      correctionCharge: 0,
      currency: "INR",
      paymentMode: [],
      exemptions: "",
    },
    ageLimit: {
      minimumAge: 0,
      maximumAge: 0,
      asOn: "",
      ageRelaxation: {
        scSt: 0,
        obc: 0,
        ph: 0,
        exServicemen: 0,
        other: {},
      },
      categoryWise: {
        ur: { male: 0, female: 0 },
        obc: { male: 0, female: 0 },
        sc: { male: 0, female: 0 },
        st: { male: 0, female: 0 },
      },
    },
    eligibility: {
      educationQualification: "",
      streamRequired: "",
      minimumPercentage: 0,
      experienceRequired: "",
      specialRequirements: [],
    },
    physicalStandards: {
      male: { height: "", chest: "", weight: "", eyesight: "" },
      female: { height: "", weight: "", eyesight: "" },
    },
    physicalEfficiencyTest: {
      male: { distance: "", duration: "" },
      female: { distance: "", duration: "" },
    },
    selectionProcess: [],
    importantLinks: {
      applyOnline: "",
      officialNotification: "",
      officialWebsite: "",
      syllabus: "",
      examPattern: "",
      admitCard: "",
      resultLink: "",
      answerKey: "",
      documentVerificationNotice: "",
      faq: "",
      other: {},
    },
    documentation: [],
    status: "Active",
    sourceUrl: String(sourceUrl || "").trim(),
    additionalInfo: "",
    extraFields: {
      unmappedKeyValues: {},
      links: [],
      keyValues: [],
    },
    content: {
      originalSummary: "",
      whoShouldApply: [],
      keyHighlights: [],
      applicationSteps: [],
      selectionProcessSummary: "",
      documentsChecklist: [],
      feeSummary: "",
      importantNotes: [],
      faq: [],
    },
  };
}

function mergeDefaults(defaultValue, value) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(value) ? value : defaultValue;
  }
  if (isPlainObject(defaultValue)) {
    const src = isPlainObject(value) ? value : {};
    const out = {};
    for (const key of Object.keys(defaultValue)) {
      out[key] = mergeDefaults(defaultValue[key], src[key]);
    }
    for (const key of Object.keys(src)) {
      if (!(key in out)) out[key] = src[key];
    }
    return out;
  }
  if (value === null || value === undefined) return defaultValue;
  return value;
}

function ensureRecruitmentRoot(parsed, sourceUrl = "") {
  if (!isPlainObject(parsed)) {
    throw new Error("Parsed response is not an object");
  }

  const hasRecruitmentField = Object.prototype.hasOwnProperty.call(parsed, "recruitment");
  const root = hasRecruitmentField ? { ...parsed } : {};
  const recruitment = isPlainObject(parsed.recruitment)
    ? { ...parsed.recruitment }
    : hasRecruitmentField
      ? {}
      : { ...parsed };

  const merged = mergeDefaults(getRecruitmentDefaults(sourceUrl), recruitment);
  merged.title = String(merged.title || parsed.title || "").trim();
  merged.sourceUrl = String(merged.sourceUrl || sourceUrl || "").trim();
  root.recruitment = merged;
  return root;
}

function buildDraft({ contentHtml = "", newHtml = "", title = "", sourceUrl = "" }) {
  const incomingNewHtml = String(newHtml || "").trim();
  const incomingContentHtml = String(contentHtml || "").trim();

  if (!incomingNewHtml && !incomingContentHtml) {
    throw new Error("contentHtml/newHtml is empty");
  }

  const htmlForParse = incomingContentHtml
    ? buildReadyPostHtml({
        title,
        sourceUrl,
        contentHtml: incomingContentHtml,
      }).newHtml
    : incomingNewHtml;

  return buildDraftRecruitmentFromHtml({
    html: String(htmlForParse || "").trim(),
    title,
    sourceUrl,
  });
}

export async function extractRecruitmentJsonFromContentHtml({
  contentHtml,
  sourceUrl = "",
  title = "",
  newHtml = "",
}) {
  const draft = buildDraft({ contentHtml, newHtml, title, sourceUrl });

  return {
    data: ensureRecruitmentRoot(draft, sourceUrl),
    modelName: "rule-draft-v1",
    meta: { usedGemini: false, reason: "ai-disabled" },
  };
}
