import "./loadEnv.mjs";
import { GoogleGenAI } from "@google/genai";
import { buildHumanStatus } from "./job-status.mjs";

const DEFAULT_SOURCE_POST_AI_MODEL =
  process.env.JOB_SOURCE_AI_MODEL || process.env.JOB_AI_MODEL || "gemini-2.5-flash";

const JSON_FENCE_PATTERN = /^```(?:json)?\s*|\s*```$/gi;
const MAX_TAGS = 8;

const DEFAULT_CATEGORY_BY_TYPE = {
  job: "Government Job",
  admit_card: "Admit Card",
  result: "Result",
  answer_key: "Answer Key",
  admission: "Admission",
  corrigendum: "Notice",
  notice: "Notice",
};

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "title",
  "jobtitle",
  "category",
  "language",
  "tags",
  "status",
  "advertisement_number",
  "advertisementNumber",
  "conducting_authority",
  "conductingAuthority",
  "applyLastDate",
  "meta",
  "introduction",
  "about_exam",
  "about_recruitment",
  "important_dates",
  "application_fee",
  "age_limit",
  "eligibility_criteria",
  "vacancy_details",
  "selection_process",
  "how_to_apply",
  "how_to_check_result",
  "official_links",
  "salary",
  "pay_scale",
  "exam_pattern",
  "admit_card",
  "result_dates",
  "notification_details",
  "faq",
  "preparation_tips",
  "conclusion",
  "disclaimer",
]);

const SOURCE_POST_SCHEMA_GUIDE = {
  title: "String",
  jobtitle: "String",
  category: "String",
  language: "String",
  tags: ["String"],
  status: "String",
  advertisement_number: "String",
  advertisementNumber: "String",
  conducting_authority: "String",
  conductingAuthority: "String",
  applyLastDate: "ISO date string",
  meta: {
    description: "String",
    keywords: ["String"],
  },
  introduction: {
    heading: "String",
    content: "String",
  },
  about_exam: {
    heading: "String",
    content: "String",
  },
  about_recruitment: {
    heading: "String",
    content: "String",
  },
  important_dates: {
    heading: "String",
    intro: "String",
    dates: [{ event: "String", date: "String" }],
    pro_tip: "String",
  },
  application_fee: {
    heading: "String",
    intro: "String",
    fees: [{ category: "String", amount: "Number", currency: "String", note: "String" }],
    payment_modes: ["String"],
    note: "String",
    future_note: "String",
    human_note: "String",
  },
  age_limit: {
    heading: "String",
    minimum_age: "Number|null",
    maximum_age: "Number|null",
    calculated_as_on: "String",
    content: "String",
    category_wise: [{ category: "String", min_age: "Number", max_age: "Number" }],
    relaxation_note: "String",
    human_note: "String",
  },
  eligibility_criteria: {
    heading: "String",
    intro: "String",
    papers: [{ paper: "String", level: "String", classes: "String", qualifications: ["String"] }],
    posts: [
      {
        post_name: "String",
        academic_qualification: "String",
        technical_qualification: ["String"],
        skill_requirements: ["String"],
        human_note: "String",
      },
    ],
    branches: [{ branch: "String", academic: "String", physical: "Object|String" }],
    important_note: "String",
  },
  vacancy_details: {
    heading: "String",
    total_posts: "Number",
    intro: "String",
    vacancies: [{ post_name: "String", category: "String", posts: "Number", note: "String" }],
    category_wise: [{ category: "String", posts: "Number", note: "String" }],
    human_note: "String",
  },
  selection_process: {
    heading: "String",
    intro: "String",
    stages: [{ step: "Number", name: "String", description: "String" }],
    note: "String",
  },
  how_to_apply: {
    heading: "String",
    intro: "String",
    steps: [{ step: "Number", action: "String" }],
    documents_required: ["String"],
    advice_hindi: "String",
    important_reminder: "String",
  },
  how_to_check_result: {
    heading: "String",
    intro: "String",
    steps: [{ step: "Number", action: "String" }],
    important_reminder: "String",
  },
  official_links: {
    heading: "String",
    official_website: "String",
    apply_online: "String",
    apply_online_portal: "String",
    advertisement_number: "String",
    links: [{ label: "String", url: "String", status: "String" }],
  },
  salary: "Object|String|null",
  pay_scale: "Object|String|null",
  exam_pattern: "Object|String|null",
  admit_card: "Object|String|null",
  result_dates: "Object|String|null",
  notification_details: "Object|String|null",
  faq: {
    heading: "String",
    intro: "String",
    questions: [{ question: "String", answer: "String" }],
  },
  preparation_tips: {
    heading: "String",
    intro: "String",
    tips: [{ tip: "String", detail: "String" }],
  },
  conclusion: {
    heading: "String",
    content: "String",
    cta: "String",
  },
  disclaimer: "String",
};

let sourcePostAiClient = null;

const toText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const normalizeUrl = (value = "", baseUrl = "") => {
  const candidate = toText(value);
  if (!candidate) return "";

  try {
    return baseUrl ? new URL(candidate, baseUrl).toString() : new URL(candidate).toString();
  } catch {
    return "";
  }
};

const toUniqueArray = (value = []) => [...new Set(value.filter(Boolean))];

const hasMeaningfulString = (value = "", minLength = 20) => toText(value).length >= minLength;

const hasEntries = (value) => Array.isArray(value) && value.length > 0;

const formatDateForDisplay = (value) => {
  if (!value) return "";

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return toText(value);
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const normalizeDateEntries = (value = []) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => ({
      event: toText(entry?.event || entry?.label || entry?.name || ""),
      date: toText(entry?.date || entry?.value || ""),
    }))
    .filter((entry) => entry.event && entry.date);

const collectImportantDates = (candidate = {}, previewJob = {}, postType = "job") => {
  const previewDates = normalizeDateEntries(previewJob?.important_dates?.dates);
  if (previewDates.length > 0) {
    return {
      heading: toText(previewJob?.important_dates?.heading || "Important Dates"),
      intro: toText(previewJob?.important_dates?.intro || ""),
      dates: previewDates,
      pro_tip: toText(previewJob?.important_dates?.pro_tip || ""),
    };
  }

  const candidateDates = normalizeDateEntries(candidate?.important_dates?.dates);
  if (candidateDates.length > 0) {
    return {
      heading: toText(candidate?.important_dates?.heading || "Important Dates"),
      intro: toText(candidate?.important_dates?.intro || ""),
      dates: candidateDates,
      pro_tip: toText(candidate?.important_dates?.pro_tip || ""),
    };
  }

  const applyLastDate = previewJob?.applyLastDate || candidate?.applyLastDate;
  if (!applyLastDate) return undefined;

  const eventByType = {
    job: "Last Date to Apply Online",
    admit_card: "Latest Admit Card Update",
    result: "Latest Result Update",
    admission: "Latest Admission Update",
    answer_key: "Latest Answer Key Update",
    corrigendum: "Latest Corrigendum Update",
    notice: "Latest Official Notice",
  };

  return {
    heading: "Important Dates",
    dates: [
      {
        event: eventByType[postType] || "Latest Update",
        date: formatDateForDisplay(applyLastDate),
      },
    ],
  };
};

const buildOfficialLinkEntries = (candidate = {}, previewJob = {}) => {
  const linkMap = new Map();
  const addLink = (label = "", url = "", status = "Active") => {
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return;

    const key = `${normalizedUrl}::${toText(label)}`;
    if (linkMap.has(key)) return;
    linkMap.set(key, {
      label: toText(label) || "Official Link",
      url: normalizedUrl,
      status: toText(status) || "Active",
    });
  };

  for (const source of [previewJob, candidate]) {
    for (const entry of Array.isArray(source?.official_links?.links) ? source.official_links.links : []) {
      addLink(entry?.label, entry?.url, entry?.status);
    }
  }

  const knownDirectLinks = [
    ["Apply Online", candidate?.direct_links?.apply_link || previewJob?.direct_links?.apply_link],
    [
      "Notification PDF",
      candidate?.direct_links?.notification_pdf || previewJob?.direct_links?.notification_pdf,
    ],
    [
      "Download Admit Card",
      candidate?.direct_links?.admit_card_link || previewJob?.direct_links?.admit_card_link,
    ],
    ["Check Result", candidate?.direct_links?.result_link || previewJob?.direct_links?.result_link],
    [
      "Answer Key",
      candidate?.direct_links?.answer_key_link || previewJob?.direct_links?.answer_key_link,
    ],
    ["Admission Portal", candidate?.direct_links?.admission_link || previewJob?.direct_links?.admission_link],
    [
      "Corrigendum",
      candidate?.direct_links?.corrigendum_link || previewJob?.direct_links?.corrigendum_link,
    ],
  ];

  for (const [label, url] of knownDirectLinks) {
    addLink(label, url);
  }

  return [...linkMap.values()];
};

const buildOfficialLinksBlock = (candidate = {}, previewJob = {}, advertisementNumber = "") => {
  const officialWebsite = normalizeUrl(
    previewJob?.official_links?.official_website ||
      candidate?.official_links?.official_website ||
      candidate?.sourceUrl ||
      previewJob?.sourceUrl
  );
  const applyLink = normalizeUrl(candidate?.direct_links?.apply_link || previewJob?.direct_links?.apply_link);
  const notificationPdf = normalizeUrl(
    candidate?.direct_links?.notification_pdf || previewJob?.direct_links?.notification_pdf
  );
  const links = buildOfficialLinkEntries(candidate, previewJob);
  if (notificationPdf && !links.some((entry) => entry.url === notificationPdf)) {
    links.push({
      label: "Notification PDF",
      url: notificationPdf,
      status: "Active",
    });
  }

  return stripEmptyDeep({
    heading: "Official Website & Links",
    official_website: officialWebsite,
    apply_online: applyLink || undefined,
    apply_online_portal: applyLink || undefined,
    advertisement_number: advertisementNumber || undefined,
    links,
  });
};

const buildTagList = ({ title = "", authority = "", advertisementNumber = "", postType = "" } = {}) =>
  toUniqueArray(
    [
      toText(title),
      toText(advertisementNumber),
      toText(authority),
      toText(postType).replace(/_/g, " "),
    ].filter(Boolean)
  ).slice(0, MAX_TAGS);

const buildMetaDescription = ({
  title = "",
  postType = "job",
  authority = "",
  advertisementNumber = "",
  applyLastDate,
} = {}) => {
  const typeLabels = {
    job: "important dates, official links, and application guidance",
    admit_card: "download guidance, official links, and latest update details",
    result: "result-check steps, official links, and latest update details",
    answer_key: "official links and latest answer key update details",
    admission: "important dates, official links, and admission guidance",
    corrigendum: "official update details and source links",
    notice: "official notice details and source links",
  };

  const segments = [
    toText(title),
    authority ? `by ${authority}` : "",
    advertisementNumber ? `(${advertisementNumber})` : "",
    `with ${typeLabels[postType] || typeLabels.job}.`,
  ].filter(Boolean);

  if (applyLastDate && postType === "job") {
    segments.splice(segments.length - 1, 0, `Last date: ${formatDateForDisplay(applyLastDate)}.`);
  }

  return toText(segments.join(" "));
};

const buildIntroductionBlock = ({
  title = "",
  postType = "job",
  authority = "",
  advertisementNumber = "",
  applyLastDate,
} = {}) => {
  const typePhrases = {
    job: "recruitment update",
    admit_card: "admit card update",
    result: "result update",
    answer_key: "answer key update",
    admission: "admission update",
    corrigendum: "official corrigendum",
    notice: "official notice",
  };

  const details = [
    `${title} is an official ${typePhrases[postType] || typePhrases.job}`,
    authority ? `published by ${authority}` : "",
    advertisementNumber ? `under Advertisement No. ${advertisementNumber}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tail =
    postType === "job"
      ? applyLastDate
        ? `Candidates should review the official notification, confirm eligibility, and complete the application process before ${formatDateForDisplay(
            applyLastDate
          )}.`
        : "Candidates should review the official notice, confirm key dates, and use the official application links before taking the next step."
      : postType === "result"
        ? "Applicants should use the official result link, verify their credentials carefully, and keep the source notice for record."
        : postType === "admit_card"
          ? "Candidates should download the admit card only from the official source and verify exam-day instructions before appearing."
          : postType === "admission"
            ? "Applicants should review the official admission notice, key dates, and portal instructions before completing the next step."
            : "Users should rely on the official source links below and review the latest notice carefully before acting on this update.";

  return {
    heading:
      postType === "job"
        ? `About ${title}`
        : `${title} Latest Update`,
    content: toText(`${details}. ${tail}`),
  };
};

const buildHowToApplyBlock = ({ postType = "job", title = "", officialWebsite = "", actionUrl = "" } = {}) => {
  const portal = actionUrl || officialWebsite;
  const typeLabel =
    postType === "admission" ? "admission" : postType === "admit_card" ? "admit card" : "application";

  return stripEmptyDeep({
    heading:
      postType === "admission"
        ? `How to Complete ${title} Admission Process`
        : postType === "admit_card"
          ? `How to Download ${title} Admit Card`
          : `How to Apply for ${title}`,
    intro:
      postType === "admit_card"
        ? "Use the official links below to open the admit card page and verify the latest instructions before downloading."
        : "Use the official links below and complete each step carefully on the official portal.",
    steps: [
      {
        step: 1,
        action: officialWebsite
          ? `Visit the official website: ${officialWebsite}`
          : "Open the official website linked below.",
      },
      {
        step: 2,
        action: portal
          ? `Open the relevant official ${typeLabel} link: ${portal}`
          : `Open the relevant official ${typeLabel} link from the source notice.`,
      },
      {
        step: 3,
        action:
          postType === "admit_card"
            ? "Enter the required login details carefully and review the instructions shown on the portal."
            : "Read the official notice carefully and keep all required details or documents ready before proceeding.",
      },
      {
        step: 4,
        action:
          postType === "admit_card"
            ? "Download the admit card and keep a printed or saved copy for future use."
            : postType === "admission"
              ? "Complete the online form or admission step on the official portal and keep a copy of the confirmation page."
              : "Complete the form on the official portal, submit it before the deadline, and save the confirmation page.",
      },
    ],
    important_reminder:
      postType === "admit_card"
        ? "Download the document only from the official source and verify all printed details immediately."
        : "Use only the official source links for submission or document download.",
  });
};

const buildHowToCheckResultBlock = ({ title = "", officialWebsite = "", resultUrl = "" } = {}) =>
  stripEmptyDeep({
    heading: `How to Check ${title} Result`,
    intro: "Use the official result link below and verify the latest instructions before checking your status.",
    steps: [
      {
        step: 1,
        action: officialWebsite
          ? `Visit the official website: ${officialWebsite}`
          : "Visit the official website linked below.",
      },
      {
        step: 2,
        action: resultUrl
          ? `Open the official result page: ${resultUrl}`
          : "Open the official result link or notice from the source page.",
      },
      {
        step: 3,
        action: "Enter the required credentials carefully and review the published result or merit information.",
      },
      {
        step: 4,
        action: "Download or save the official result page for future reference.",
      },
    ],
    important_reminder: "Rely only on the official portal or result notice for final confirmation.",
  });

const buildStageSpecificBlocks = ({
  postType = "job",
  title = "",
  officialWebsite = "",
  actionUrl = "",
} = {}) => {
  if (postType === "result") {
    return {
      how_to_check_result: buildHowToCheckResultBlock({
        title,
        officialWebsite,
        resultUrl: actionUrl,
      }),
    };
  }

  if (postType === "admit_card") {
    return {
      admit_card: {
        heading: `${title} Admit Card`,
        content:
          "Candidates should use the official admit card link to download the document and verify exam-day instructions carefully.",
      },
      how_to_apply: buildHowToApplyBlock({
        postType,
        title,
        officialWebsite,
        actionUrl,
      }),
    };
  }

  if (postType === "admission") {
    return {
      how_to_apply: buildHowToApplyBlock({
        postType,
        title,
        officialWebsite,
        actionUrl,
      }),
    };
  }

  if (postType === "job") {
    return {
      how_to_apply: buildHowToApplyBlock({
        postType,
        title,
        officialWebsite,
        actionUrl,
      }),
    };
  }

  return {};
};

const buildConclusionBlock = ({ title = "", postType = "job" } = {}) => {
  const messages = {
    job: "Review the official notification, keep your documents ready, and complete the process through the official portal before the deadline.",
    admit_card: "Download the admit card from the official source and verify all instructions before exam day.",
    result: "Check the result only on the official portal and preserve the published record for future stages.",
    answer_key: "Review the official answer key notice carefully and follow the published objection process, if any.",
    admission: "Complete the next admission step only through the official portal and keep a copy of every submitted document.",
    corrigendum: "Read the revised notice carefully because it may change dates, links, or instructions issued earlier.",
    notice: "Use the official notice and links below as the primary source before taking any action.",
  };

  return {
    heading: "Final Thoughts",
    content: `${title}: ${messages[postType] || messages.job}`,
    cta: "Use the official links below for the latest verified update.",
  };
};

const buildNotificationDetailsBlock = ({
  title = "",
  postType = "job",
  authority = "",
  officialWebsite = "",
} = {}) => ({
  heading: "Notification Details",
  content: toText(
    [
      `${title} is available as an official ${postType.replace(/_/g, " ")} update`,
      authority ? `issued by ${authority}` : "",
      officialWebsite ? `through the official portal ${officialWebsite}` : "",
      "Candidates should review the linked official notice carefully for the latest instructions, dates, and document requirements.",
    ]
      .filter(Boolean)
      .join(" ")
  ),
});

const stripEmptyDeep = (value) => {
  if (Array.isArray(value)) {
    const items = value
      .map((entry) => stripEmptyDeep(entry))
      .filter((entry) => {
        if (entry === null || entry === undefined) return false;
        if (typeof entry === "string") return toText(entry).length > 0;
        if (Array.isArray(entry)) return entry.length > 0;
        if (typeof entry === "object") return Object.keys(entry).length > 0;
        return true;
      });
    return items.length > 0 ? items : undefined;
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, stripEmptyDeep(entry)])
      .filter(([, entry]) => {
        if (entry === null || entry === undefined) return false;
        if (typeof entry === "string") return toText(entry).length > 0;
        if (Array.isArray(entry)) return entry.length > 0;
        if (typeof entry === "object") return Object.keys(entry).length > 0;
        return true;
      });

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  if (typeof value === "string") {
    const normalized = toText(value);
    return normalized ? normalized : undefined;
  }

  return value ?? undefined;
};

const pickAllowedTopLevelKeys = (value = {}) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => ALLOWED_TOP_LEVEL_KEYS.has(key))
  );

const parseModelJson = (value = "") => {
  const text = String(value || "").trim().replace(JSON_FENCE_PATTERN, "").trim();
  if (!text) throw new Error("AI returned empty response");

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("AI response was not valid JSON");
  }
};

const getApiKey = () =>
  String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();

export const isSourcePostAiConfigured = () => Boolean(getApiKey());

const getAiClient = () => {
  if (sourcePostAiClient) return sourcePostAiClient;
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY is required");

  sourcePostAiClient = new GoogleGenAI({ apiKey });
  return sourcePostAiClient;
};

const collectKnownUrls = (candidate = {}, previewJob = {}) =>
  toUniqueArray(
    [
      candidate?.sourceUrl,
      candidate?.official_links?.official_website,
      candidate?.direct_links?.apply_link,
      candidate?.direct_links?.notification_pdf,
      candidate?.direct_links?.admit_card_link,
      candidate?.direct_links?.result_link,
      previewJob?.sourceUrl,
      previewJob?.official_links?.official_website,
    ]
      .map((url) => normalizeUrl(url))
      .filter(Boolean)
  ).slice(0, 4);

const buildSchemaPrompt = ({ candidate = {}, previewJob = {}, sourceEvidence = "" } = {}) => {
  const knownUrls = collectKnownUrls(candidate, previewJob);

  return `
You create professional government-post documents for database insertion.

Primary requirement:
- Follow the structure used by utils/schemaType.txt.
- Return JSON only.
- Do not invent facts.
- Use the provided official URL context and extracted page evidence first. Use Google Search only as optional verification when needed.
- If evidence is insufficient to produce a high-quality structured post, return {"status":"insufficient_data","reason":"...","post":{}}.
- Do not output empty-string filler. Omit blocks you cannot support with evidence.
- Use concise professional English. Hindi can appear only when the source itself clearly provides Hindi text.
- Write original, reader-friendly, high-value informational copy suitable for a serious exam/job portal. Keep it ad-friendly and useful, not spammy or keyword-stuffed.
- Prefer official-domain links in official_links and source-backed dates in important_dates.
- You may write grounded narrative blocks such as meta.description, introduction, how_to_apply, conclusion, and disclaimer from the verified title, stage, dates, authority, and official links even when the source page is terse.
- Never invent numeric facts, vacancies, fees, age limits, or eligibility details. Omit those blocks if not supported by evidence.

Quality rules:
- title and jobtitle must be meaningful.
- meta.description must be non-empty and specific.
- introduction.content must be informative, not generic filler.
- official_links must include at least official_website or a valid links array.
- disclaimer must clearly advise users to verify details on the official source.
- For job posts include important_dates or applyLastDate, and at least one of eligibility_criteria, vacancy_details, selection_process, how_to_apply.
- For admit card posts include important_dates or admit_card, plus official_links and introduction.
- For result posts include important_dates or result_dates, plus official_links and introduction.
- For admission posts include important_dates plus how_to_apply or eligibility_criteria.

Allowed top-level keys:
${[...ALLOWED_TOP_LEVEL_KEYS].join(", ")}

Target schema guide:
${JSON.stringify(SOURCE_POST_SCHEMA_GUIDE, null, 2)}

Candidate discovered by source sync:
${JSON.stringify(candidate, null, 2)}

Current normalized preview before AI enrichment:
${JSON.stringify(previewJob, null, 2)}

Known official/helper URLs:
${knownUrls.length > 0 ? knownUrls.map((url) => `- ${url}`).join("\n") : "- none"}

Locally extracted official-page evidence:
${sourceEvidence || "No local source evidence was extracted."}

Expected response JSON:
{
  "status": "ready" | "insufficient_data",
  "reason": "short reason",
  "post": {
    "...schemaType fields only": "..."
  }
}
`.trim();
};

const countMeaningfulFields = (job = {}) => {
  let score = 0;
  if (hasMeaningfulString(job?.meta?.description, 40)) score += 1;
  if (hasMeaningfulString(job?.introduction?.content, 80)) score += 1;
  if (
    hasMeaningfulString(job?.official_links?.official_website, 12) ||
    hasEntries(job?.official_links?.links)
  ) {
    score += 1;
  }
  if (hasMeaningfulString(job?.disclaimer, 40)) score += 1;
  if (hasEntries(job?.tags)) score += 1;
  if (hasEntries(job?.important_dates?.dates) || job?.applyLastDate) score += 1;
  if (hasMeaningfulString(job?.notification_details?.content, 40)) score += 1;
  if (hasEntries(job?.selection_process?.stages)) score += 1;
  if (hasEntries(job?.how_to_apply?.steps)) score += 1;
  if (
    hasEntries(job?.eligibility_criteria?.posts) ||
    hasEntries(job?.eligibility_criteria?.papers) ||
    hasEntries(job?.eligibility_criteria?.branches)
  ) {
    score += 1;
  }
  if (
    hasEntries(job?.vacancy_details?.vacancies) ||
    hasEntries(job?.vacancy_details?.category_wise) ||
    Number.isFinite(Number(job?.vacancy_details?.total_posts))
  ) {
    score += 1;
  }
  if (hasMeaningfulString(job?.conclusion?.content, 40)) score += 1;
  return score;
};

export const isSchemaRichJob = (job = {}, { postType = "" } = {}) => {
  const type = toText(postType || job?.postType || "job").toLowerCase() || "job";

  const common =
    hasMeaningfulString(job?.title || job?.jobtitle, 8) &&
    hasMeaningfulString(job?.meta?.description, 40) &&
    hasMeaningfulString(job?.introduction?.content, 60) &&
    (
      hasMeaningfulString(job?.official_links?.official_website, 12) ||
      hasEntries(job?.official_links?.links)
    ) &&
    hasMeaningfulString(job?.disclaimer, 30);

  if (!common) return false;

  if (type === "result") {
    return (
      hasEntries(job?.important_dates?.dates) ||
      job?.result_dates ||
      hasEntries(job?.how_to_check_result?.steps)
    );
  }

  if (type === "admit_card") {
    return (
      hasEntries(job?.important_dates?.dates) ||
      job?.admit_card ||
      hasEntries(job?.how_to_apply?.steps)
    );
  }

  if (type === "admission") {
    return (
      (hasEntries(job?.important_dates?.dates) ||
        hasMeaningfulString(job?.notification_details?.content, 40)) &&
      (hasEntries(job?.how_to_apply?.steps) ||
        hasMeaningfulString(job?.eligibility_criteria?.intro, 30))
    );
  }

  if (type === "notice" || type === "corrigendum" || type === "answer_key") {
    return countMeaningfulFields(job) >= 5;
  }

  return (
    (hasEntries(job?.important_dates?.dates) ||
      job?.applyLastDate ||
      hasMeaningfulString(job?.notification_details?.content, 40)) &&
    (
      hasEntries(job?.how_to_apply?.steps) ||
      hasEntries(job?.selection_process?.stages) ||
      hasEntries(job?.eligibility_criteria?.posts) ||
      hasEntries(job?.eligibility_criteria?.papers) ||
      hasEntries(job?.eligibility_criteria?.branches) ||
      hasEntries(job?.vacancy_details?.vacancies) ||
      hasEntries(job?.vacancy_details?.category_wise) ||
      Number.isFinite(Number(job?.vacancy_details?.total_posts))
    ) &&
    countMeaningfulFields(job) >= 6
  );
};

const normalizeGeneratedPost = (value = {}, { candidate = {}, previewJob = {} } = {}) => {
  const cleaned = stripEmptyDeep(pickAllowedTopLevelKeys(value)) || {};

  return {
    ...cleaned,
    title: toText(cleaned.title || cleaned.jobtitle || candidate.title || previewJob.title),
    jobtitle: toText(
      cleaned.jobtitle || cleaned.title || candidate.jobtitle || candidate.title || previewJob.jobtitle
    ),
    status: buildHumanStatus({
      postType: candidate?.postType || previewJob?.postType,
      applyLastDate: cleaned.applyLastDate || previewJob?.applyLastDate || candidate?.applyLastDate,
      currentStatus: cleaned.status || previewJob.status || candidate.status || "",
    }),
    category: toText(cleaned.category || previewJob.category || candidate.category || ""),
    language: toText(cleaned.language || previewJob.language || candidate.language || "en"),
    tags: toUniqueArray(
      (Array.isArray(cleaned.tags) ? cleaned.tags : [])
        .map((entry) => toText(entry))
        .filter(Boolean)
    ),
  };
};

export const buildSchemaFallbackPost = ({
  candidate = {},
  previewJob = {},
  seedPost = {},
} = {}) => {
  const postType = toText(candidate?.postType || previewJob?.postType || seedPost?.postType || "job").toLowerCase() || "job";
  const title = toText(seedPost?.title || seedPost?.jobtitle || previewJob?.title || previewJob?.jobtitle || candidate?.title || candidate?.jobtitle);
  const advertisementNumber = toText(
    seedPost?.advertisement_number ||
      seedPost?.advertisementNumber ||
      previewJob?.advertisement_number ||
      previewJob?.advertisementNumber ||
      candidate?.advertisement_number ||
      candidate?.advertisementNumber ||
      previewJob?.official_links?.advertisement_number ||
      candidate?.official_links?.advertisement_number
  );
  const authority = toText(
    seedPost?.conducting_authority ||
      seedPost?.conductingAuthority ||
      previewJob?.conducting_authority ||
      previewJob?.conductingAuthority ||
      candidate?.conducting_authority ||
      candidate?.conductingAuthority
  );
  const applyLastDate = seedPost?.applyLastDate || previewJob?.applyLastDate || candidate?.applyLastDate;
  const officialLinks = buildOfficialLinksBlock(candidate, previewJob, advertisementNumber);
  const officialWebsite = normalizeUrl(officialLinks?.official_website || candidate?.sourceUrl || previewJob?.sourceUrl);
  const actionUrl =
    normalizeUrl(candidate?.direct_links?.apply_link || previewJob?.direct_links?.apply_link) ||
    normalizeUrl(candidate?.direct_links?.admission_link || previewJob?.direct_links?.admission_link) ||
    normalizeUrl(candidate?.direct_links?.admit_card_link || previewJob?.direct_links?.admit_card_link) ||
    normalizeUrl(candidate?.direct_links?.result_link || previewJob?.direct_links?.result_link) ||
    normalizeUrl(candidate?.sourceUrl || previewJob?.sourceUrl);

  const factualBlocks = stripEmptyDeep(
    pickAllowedTopLevelKeys({
      ...previewJob,
      ...candidate,
      ...seedPost,
    })
  ) || {};
  const seededMeta = stripEmptyDeep(factualBlocks.meta);
  const seededIntroduction = stripEmptyDeep(factualBlocks.introduction);
  const seededConclusion = stripEmptyDeep(factualBlocks.conclusion);
  const seededDisclaimer = toText(factualBlocks.disclaimer || "");
  const stageSpecificBlocks = buildStageSpecificBlocks({
    postType,
    title,
    officialWebsite,
    actionUrl,
  });

  const next = stripEmptyDeep({
    ...factualBlocks,
    title,
    jobtitle: title,
    category:
      toText(seedPost?.category || previewJob?.category || candidate?.category) ||
      DEFAULT_CATEGORY_BY_TYPE[postType] ||
      DEFAULT_CATEGORY_BY_TYPE.job,
    language: toText(seedPost?.language || previewJob?.language || candidate?.language || "en"),
    tags:
      Array.isArray(seedPost?.tags) && seedPost.tags.length > 0
        ? seedPost.tags
        : buildTagList({
            title,
            authority,
            advertisementNumber,
            postType,
          }),
    status:
      buildHumanStatus({
        postType,
        applyLastDate,
        currentStatus: seedPost?.status || previewJob?.status || candidate?.status,
      }),
    advertisement_number: advertisementNumber || undefined,
    advertisementNumber: advertisementNumber || undefined,
    conducting_authority: authority || undefined,
    conductingAuthority: authority || undefined,
    applyLastDate: applyLastDate || undefined,
    meta:
      (hasMeaningfulString(seededMeta?.description, 40) ? seededMeta : undefined) ||
      stripEmptyDeep({
        description: buildMetaDescription({
          title,
          postType,
          authority,
          advertisementNumber,
          applyLastDate,
        }),
        keywords: buildTagList({
          title,
          authority,
          advertisementNumber,
          postType,
        }),
      }),
    introduction:
      (hasMeaningfulString(seededIntroduction?.content, 60) ? seededIntroduction : undefined) ||
      buildIntroductionBlock({
        title,
        postType,
        authority,
        advertisementNumber,
        applyLastDate,
      }),
    important_dates:
      factualBlocks.important_dates || collectImportantDates(candidate, previewJob, postType),
    official_links: officialLinks,
    notification_details:
      factualBlocks.notification_details ||
      buildNotificationDetailsBlock({
        title,
        postType,
        authority,
        officialWebsite,
      }),
    conclusion:
      (hasMeaningfulString(seededConclusion?.content, 40) ? seededConclusion : undefined) ||
      buildConclusionBlock({
        title,
        postType,
      }),
    disclaimer:
      (hasMeaningfulString(seededDisclaimer, 30) ? seededDisclaimer : "") ||
      `This update is prepared from official source links available for ${title}. Candidates should verify all dates, eligibility conditions, documents, and instructions directly on the official website before taking any action.`,
    how_to_apply:
      (hasEntries(factualBlocks?.how_to_apply?.steps) ? factualBlocks.how_to_apply : undefined) ||
      stageSpecificBlocks.how_to_apply,
    how_to_check_result:
      (hasEntries(factualBlocks?.how_to_check_result?.steps)
        ? factualBlocks.how_to_check_result
        : undefined) || stageSpecificBlocks.how_to_check_result,
    admit_card: factualBlocks.admit_card || stageSpecificBlocks.admit_card,
  }) || {};

  return normalizeGeneratedPost(next, {
    candidate,
    previewJob,
  });
};

export const generateSchemaDrivenSourcePost = async ({
  candidate = {},
  previewJob = {},
  sourceEvidence = "",
} = {}) => {
  const client = getAiClient();
  const knownUrls = collectKnownUrls(candidate, previewJob);
  const tools =
    knownUrls.length > 0 ? [{ urlContext: {} }, { googleSearch: {} }] : [{ googleSearch: {} }];

  const response = await client.models.generateContent({
    model: DEFAULT_SOURCE_POST_AI_MODEL,
    contents: buildSchemaPrompt({ candidate, previewJob, sourceEvidence }),
    config: {
      temperature: 0.1,
      tools,
    },
  });

  const parsed = parseModelJson(response?.text || "");
  const status = toText(parsed?.status || "").toLowerCase();
  const normalizedPost = normalizeGeneratedPost(parsed?.post || {}, {
    candidate,
    previewJob,
  });
  const completedPost = buildSchemaFallbackPost({
    candidate,
    previewJob,
    seedPost: normalizedPost,
  });
  const rich = isSchemaRichJob(completedPost, {
    postType: candidate?.postType || previewJob?.postType,
  });

  return {
    status: status === "ready" && rich ? "ready" : "insufficient_data",
    reason: toText(parsed?.reason || (rich ? "" : "AI response did not meet schema quality rules")),
    post: rich ? completedPost : {},
    rawText: toText(response?.text || ""),
  };
};

export default {
  buildSchemaFallbackPost,
  generateSchemaDrivenSourcePost,
  isSchemaRichJob,
  isSourcePostAiConfigured,
};
