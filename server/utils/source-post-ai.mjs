import "./loadEnv.mjs";
import { GoogleGenAI } from "@google/genai";
import { buildHumanStatus } from "./job-status.mjs";

const DEFAULT_SOURCE_POST_AI_MODEL =
  process.env.JOB_SOURCE_AI_MODEL || process.env.JOB_AI_MODEL || "gemini-2.5-flash";

const JSON_FENCE_PATTERN = /^```(?:json)?\s*|\s*```$/gi;
const MAX_TAGS = 8;
const GENERIC_NOTICE_FILLER_PATTERNS = [
  /\bofficial official notice\b/i,
  /official source links/i,
  /review the latest notice carefully/i,
  /before acting on this update/i,
  /official update details and source links/i,
  /linked official notice carefully/i,
  /latest instructions, dates, and document requirements/i,
  /prepared from official source links available/i,
  /verify all dates, eligibility conditions, documents, and instructions directly on the official website/i,
  /use the official notice and links below as the primary source/i,
  /the official source has published an official/i,
  /is currently listed as an official .* record/i,
  /remains the main official reference for verification/i,
  /read the linked official document carefully because notices? and corrigenda/i,
  /treat the official notice and linked source document as the primary reference/i,
  /latest verified update and next-step reference/i,
  /official notice details and source links/i,
];

const GENERIC_PORTAL_FILLER_PATTERNS = [
  ...GENERIC_NOTICE_FILLER_PATTERNS,
  /official recruitment update/i,
  /official job update/i,
  /important dates, official links, and application guidance/i,
  /download guidance, official links, and latest update details/i,
  /result-check guidance, source links, and next-step guidance/i,
  /includes .*source links, and next-step guidance/i,
];

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
const capitalizeFirst = (value = "") => {
  const normalized = toText(value);
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
};

const hasMeaningfulString = (value = "", minLength = 20) => toText(value).length >= minLength;

const hasEntries = (value) => Array.isArray(value) && value.length > 0;

const stripTitleFromNarrative = (text = "", title = "") => {
  const normalizedText = toText(text).toLowerCase();
  const normalizedTitle = toText(title).toLowerCase();
  if (!normalizedTitle) return normalizedText;
  return normalizedText.replaceAll(normalizedTitle, " ").replace(/\s+/g, " ").trim();
};

const isGenericNoticeNarrative = (value = "", title = "") => {
  const stripped = stripTitleFromNarrative(value, title);
  if (!stripped) return true;

  return GENERIC_NOTICE_FILLER_PATTERNS.some((pattern) => pattern.test(stripped));
};

const hasConcreteNoticeSignals = (value = "") => {
  const normalized = toText(value).replace(/https?:\/\/\S+/gi, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  return (
    /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/.test(normalized) ||
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[,]?\s+\d{4}\b/i.test(
      normalized
    ) ||
    /\b(?:advt|advertisement|cen|employment notice|roll(?:\s*no)?|cut[- ]?off|merit|zone allotment|document verification|vacanc(?:y|ies)|interview|personal assessment|stage[- ]?ii|stage[- ]?iii|centre|center|revised dates?|rescheduled|skill test|typing test|preference form|recruitment examination|free travel authority pass|constable|head constable|combined higher secondary|candidate list|considered as ur|category certificate|final registration|incomplete application|refund|bank account|exam city|exam district|admit card)\b/i.test(
      normalized
    )
  );
};

const hasSpecificNarrativeText = (value = "", title = "", minLength = 40) => {
  const normalized = toText(value);
  if (normalized.length < minLength) return false;
  const stripped = stripTitleFromNarrative(normalized, title);
  if (!stripped) return false;
  return !GENERIC_PORTAL_FILLER_PATTERNS.some((pattern) => pattern.test(stripped));
};

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

const removeTrailingStageTerms = (value = "", postType = "job") => {
  const title = toText(value);
  if (!title) return "";

  const suffixByType = {
    result: /\s+(result|results|score\s*card|merit\s*list)$/i,
    admit_card: /\s+(admit\s*card|hall\s*ticket|call\s*letter)$/i,
    answer_key: /\s+(answer\s*key|response\s*sheet)$/i,
    admission: /\s+(admission|counselling|counseling)$/i,
    corrigendum: /\s+(corrigendum|notice)$/i,
    notice: /\s+(notice|update)$/i,
  };

  const pattern = suffixByType[postType];
  return pattern ? title.replace(pattern, "").trim() || title : title;
};

const toPortalHost = (value = "") => {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";

  try {
    return new URL(normalized).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
};

const AUTHORITY_BY_HOST = new Map([
  ["upsc.gov.in", "Union Public Service Commission (UPSC)"],
  ["upsconline.nic.in", "Union Public Service Commission (UPSC)"],
  ["ssc.gov.in", "Staff Selection Commission (SSC)"],
  ["ssc.nic.in", "Staff Selection Commission (SSC)"],
  ["aiimsexams.ac.in", "All India Institute of Medical Sciences (AIIMS)"],
  ["oldwebsite.aiimsexams.ac.in", "All India Institute of Medical Sciences (AIIMS)"],
  ["docs.aiimsexams.ac.in", "All India Institute of Medical Sciences (AIIMS)"],
  ["rrbcdg.gov.in", "Railway Recruitment Board, Chandigarh"],
  ["csbc.bihar.gov.in", "Central Selection Board of Constable (CSBC), Bihar"],
  ["bpssc.bihar.gov.in", "Bihar Police Subordinate Services Commission (BPSSC)"],
  ["hpsc.gov.in", "Haryana Public Service Commission (HPSC)"],
  ["tshc.gov.in", "High Court for the State of Telangana"],
  ["secl-cil.in", "South Eastern Coalfields Limited (SECL)"],
  ["upsssc.gov.in", "Uttar Pradesh Subordinate Services Selection Commission (UPSSSC)"],
  ["esb.mp.gov.in", "Madhya Pradesh Employees Selection Board (MPESB)"],
  ["shs.bihar.gov.in", "State Health Society Bihar"],
  ["uppsc.up.nic.in", "Uttar Pradesh Public Service Commission (UPPSC)"],
  ["kgmu.org", "King George's Medical University (KGMU)"],
  ["allahabadhighcourt.in", "High Court of Judicature at Allahabad"],
  ["cuh.ac.in", "Central University of Haryana (CUH)"],
  ["bsf.gov.in", "Border Security Force (BSF)"],
]);

const inferAuthorityFromUrls = (...values) => {
  for (const value of values) {
    const host = toPortalHost(value);
    if (!host) continue;
    if (AUTHORITY_BY_HOST.has(host)) {
      return AUTHORITY_BY_HOST.get(host);
    }
    if (host === "d3t79nicn48uzj.cloudfront.net" && /\/bsf\//i.test(String(value || ""))) {
      return "Border Security Force (BSF)";
    }
  }
  return "";
};

const buildIdentitySnippet = ({ authority = "", advertisementNumber = "" } = {}) =>
  [authority ? `issued by ${authority}` : "", advertisementNumber ? `under ${advertisementNumber}` : ""]
    .filter(Boolean)
    .join(" ");

const buildFaqBlock = ({
  title = "",
  postType = "job",
  authority = "",
  advertisementNumber = "",
  officialWebsite = "",
  actionUrl = "",
  applyLastDate,
} = {}) => {
  const updateLabel = postType.replace(/_/g, " ");
  const destination = actionUrl || officialWebsite;
  const questions = [
    {
      question: `What is the current update about for ${title}?`,
      answer: toText(
        [
          `${title} is currently available as an official ${updateLabel} update.`,
          authority ? `${authority} is the issuing authority for this record.` : "",
          advertisementNumber ? `The reference attached to this update is ${advertisementNumber}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      ),
    },
    {
      question: "Where should candidates check the official link?",
      answer: destination
        ? `Candidates should use the official source link ${destination} and cross-check details on ${officialWebsite || destination}.`
        : "Candidates should rely only on the official website or source notice linked with this update.",
    },
    {
      question: "What should users verify before taking the next step?",
      answer:
        postType === "job"
          ? "Check eligibility, important dates, portal instructions, and required documents on the official source before submitting the form."
          : postType === "admit_card"
            ? "Verify the exam date, shift timing, reporting instructions, and candidate details before downloading or printing the admit card."
            : postType === "result"
              ? "Verify login details, result status, and any further document or counselling instructions published on the official source."
              : "Read the linked official document carefully and note any revised instructions, links, dates, or candidate-facing directions.",
    },
  ];

  if (applyLastDate && postType === "job") {
    questions.push({
      question: "What is the current application deadline in this record?",
      answer: `The current stored last date is ${formatDateForDisplay(applyLastDate)}. Candidates should still verify the live portal for any extension or corrigendum.`,
    });
  }

  return stripEmptyDeep({
    heading: "Frequently Asked Questions",
    intro: "These quick answers are based on the currently available official source links and structured data.",
    questions,
  });
};

const buildAboutBlock = ({
  title = "",
  postType = "job",
  authority = "",
  officialWebsite = "",
} = {}) => {
  if (postType !== "job") return {};

  const content = toText(
    [
      authority
        ? `${authority} is the official authority currently linked with ${title}.`
        : `${title} is currently represented as an official recruitment or examination entry on the source portal.`,
      officialWebsite
        ? `The primary portal associated with this post is ${officialWebsite}.`
        : "",
      /exam|examination|test|paper|services/i.test(title)
        ? "Candidates should treat this as an examination-focused update and review the official notice for schedule, eligibility, and application instructions."
        : "Applicants should review the linked notification, portal instructions, and any related recruitment guidance before proceeding.",
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (/exam|examination|test|paper|services/i.test(title)) {
    return {
      about_exam: {
        heading: `About ${title}`,
        content,
      },
    };
  }

  return {
    about_recruitment: {
      heading: `About ${title}`,
      content,
    },
  };
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

const buildNoticeSummaryFromTitle = ({
  title = "",
  advertisementNumber = "",
} = {}) => {
  const normalizedTitle = toText(title);
  if (!normalizedTitle) return "";

  if (/enhancement .*vacanc|vacanc.*enhancement/i.test(normalizedTitle)) {
    return `the update revises the notified vacancy position${advertisementNumber ? ` under ${advertisementNumber}` : ""}, so candidates should compare the revised seat breakup with the earlier notice`;
  }

  if (/postponed|re-?scheduled|rescheduled|schedule(?:d)? to be held/i.test(normalizedTitle)) {
    return "the update changes the earlier examination schedule and therefore affects the latest date, shift, timing, or candidate instructions";
  }

  if (/schedule of interview|personal assessment|stage[- ]?ii|stage[- ]?iii/i.test(normalizedTitle)) {
    return "the update carries a stage-wise interview or assessment schedule for shortlisted candidates";
  }

  if (/document verification|\bdv\b/i.test(normalizedTitle)) {
    return "the update concerns document verification, including the latest schedule, venue, or certificate requirements";
  }

  if (/zone allotment|medical examination|medical test/i.test(normalizedTitle)) {
    return "the update concerns zone allotment or medical-examination instructions for the next recruitment stage";
  }

  if (/result|cut[- ]?off|merit|score/i.test(normalizedTitle)) {
    return "the update is tied to a published result, merit position, or cut-off related instruction";
  }

  if (/refund.*exam[- ]?fees?|bank account/i.test(normalizedTitle)) {
    return "the update explains the exam-fee refund process or the bank-account revalidation step for eligible candidates";
  }

  if (/admit card|exam district|exam city|venue|centre|center/i.test(normalizedTitle)) {
    return "the update affects exam logistics such as admit card access, exam city, venue, or reporting instructions";
  }

  if (/option-cum-preference form|preference form/i.test(normalizedTitle)) {
    return "the update is about preference-form submission, option entry, and final locking instructions";
  }

  if (/incomplete application form|final registration/i.test(normalizedTitle)) {
    return "the update is meant for candidates who still need to complete the pending application or final-registration steps within the notified window";
  }

  if (/list of candidates|considered as ur/i.test(normalizedTitle)) {
    return "the update publishes a candidate list or category-status decision that directly affects the next stage for the listed applicants";
  }

  if (/change of examination centre|change in examination centre|correction in address|centre change|center change/i.test(normalizedTitle)) {
    return "the update changes the examination centre or address details for affected candidates";
  }

  if (/change the examination date|revised dates? of written|revised dates?/i.test(normalizedTitle)) {
    return "the update revises one or more examination dates and replaces the earlier timetable";
  }

  if (/skill test|typing test/i.test(normalizedTitle)) {
    return "the update concerns the skill-test or typing-test stage and its reporting instructions";
  }

  if (/recruitment examination/i.test(normalizedTitle)) {
    return "the update provides the latest examination-stage instructions for the linked recruitment";
  }

  return "";
};

const buildMetaDescription = ({
  title = "",
  postType = "job",
  authority = "",
  advertisementNumber = "",
  applyLastDate,
  officialWebsite = "",
  actionUrl = "",
} = {}) => {
  const destination = actionUrl || officialWebsite;
  const noticeSummary =
    postType === "notice" || postType === "corrigendum" || postType === "answer_key"
      ? buildNoticeSummaryFromTitle({ title, advertisementNumber })
      : "";

  const typeSummary = {
    job: applyLastDate
      ? `Candidates can review the current application route and the recorded deadline of ${formatDateForDisplay(
          applyLastDate
        )} before applying.`
      : "Candidates can review the application route, source notice, and current portal instructions before applying.",
    admit_card:
      "Candidates can open the official admit card route, confirm login instructions, and verify reporting details from the authority source.",
    result:
      "Candidates can open the official result route, confirm their credentials carefully, and note any further stage instructions published by the authority.",
    answer_key:
      "Candidates can review the official answer key notice and any published objection window or response instructions on the authority source.",
    admission:
      "Applicants can review the official admission route, linked notice, and current instructions before completing the next step.",
    corrigendum:
      noticeSummary
        ? `${capitalizeFirst(noticeSummary)}.`
        : "Readers should compare this revised notice with the earlier record because corrigenda often change dates, venues, links, or candidate instructions.",
    notice:
      noticeSummary
        ? `${capitalizeFirst(noticeSummary)}.`
        : "Readers should use the official notice and linked source page as the primary reference for the latest candidate-facing instructions.",
  };

  const segments = [
    authority
      ? `${toText(title)} update from ${authority}.`
      : `${toText(title)} official update.`,
    advertisementNumber ? `Reference: ${advertisementNumber}.` : "",
    applyLastDate && postType === "job"
      ? `Current recorded last date: ${formatDateForDisplay(applyLastDate)}.`
      : "",
    destination ? `Official source: ${destination}.` : "",
    typeSummary[postType] || typeSummary.job,
  ].filter(Boolean);

  return toText(segments.join(" "));
};

const buildIntroductionBlock = ({
  title = "",
  postType = "job",
  authority = "",
  advertisementNumber = "",
  applyLastDate,
  officialWebsite = "",
  actionUrl = "",
} = {}) => {
  const destination = actionUrl || officialWebsite;
  const identity = buildIdentitySnippet({ authority, advertisementNumber });
  const noticeSummary =
    postType === "notice" || postType === "corrigendum" || postType === "answer_key"
      ? buildNoticeSummaryFromTitle({ title, advertisementNumber })
      : "";

  const opening =
    postType === "job"
      ? `${authority || "The authority"} currently lists ${title} as an active recruitment or examination record.`
      : postType === "admit_card"
        ? `${authority || "The authority"} has issued the latest admit-card update for ${title}.`
        : postType === "result"
          ? `${authority || "The authority"} has published the latest result update for ${title}.`
          : postType === "admission"
            ? `${authority || "The authority"} has published the latest admission update for ${title}.`
            : noticeSummary
              ? `${title} appears in the latest official record from ${authority || "the authority"}, and ${noticeSummary}.`
              : `${title} appears in the latest official ${postType.replace(/_/g, " ")} record from ${authority || "the authority"}.`;

  const identityLine = identity ? `This source record is currently linked ${identity}.` : "";
  const sourceLine = destination
    ? officialWebsite && destination !== officialWebsite
      ? `The main authority site for this update is ${officialWebsite}, while the direct source currently points to ${destination}.`
      : `The direct official source for this update currently points to ${destination}.`
    : officialWebsite
      ? `Candidates should use ${officialWebsite} as the main official source for this update.`
      : "";

  const actionLine =
    postType === "job"
      ? applyLastDate
        ? `Before submitting any form, candidates should review the linked notification, confirm eligibility and document requirements, and complete the process before ${formatDateForDisplay(
            applyLastDate
          )}.`
        : "Before taking the next step, candidates should review the notification, confirm eligibility and schedule details, and use only the official portal or document linked with this record."
      : postType === "result"
            ? "Applicants should use the official result source, verify their credentials carefully, and preserve the published result or notice for later stages."
            : postType === "admit_card"
              ? "Candidates should open only the official admit card link, verify reporting instructions carefully, and keep a saved or printed copy ready for exam use."
              : postType === "admission"
                ? "Applicants should review the admission instructions, note the important dates, and complete the next step only through the official portal."
                : noticeSummary
                  ? "Affected candidates should open the linked source document, confirm whether the update applies to their stage or category, and follow only the latest instruction published there."
                  : "Affected candidates should open the linked source document, note the updated instruction carefully, and follow only the latest version published by the authority.";

  return {
    heading:
      postType === "job"
        ? `About ${title}`
        : `${title} Latest Update`,
    content: toText([opening, identityLine, sourceLine, actionLine].filter(Boolean).join(" ")),
  };
};

const buildNoticeSpecificDetail = ({
  title = "",
  postType = "notice",
  advertisementNumber = "",
} = {}) => {
  const summary = buildNoticeSummaryFromTitle({
    title,
    advertisementNumber,
  });
  if (!summary) return "";

  return `${
    postType === "corrigendum" ? "The corrigendum" : "The notice"
  } confirms that ${summary}.`;
};

const buildHowToApplyBlock = ({ postType = "job", title = "", officialWebsite = "", actionUrl = "" } = {}) => {
  const portal = actionUrl || officialWebsite;
  const typeLabel =
    postType === "admission" ? "admission" : postType === "admit_card" ? "admit card" : "application";
  const baseTitle = removeTrailingStageTerms(title, postType);

  return stripEmptyDeep({
    heading:
      postType === "admission"
        ? `How to Complete ${baseTitle || title} Admission Process`
        : postType === "admit_card"
          ? `How to Download ${baseTitle || title} Admit Card`
          : `How to Apply for ${baseTitle || title}`,
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
    heading: `How to Check ${removeTrailingStageTerms(title, "result") || title} Result`,
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
    const baseTitle = removeTrailingStageTerms(title, "admit_card");
    return {
      admit_card: {
        heading: `${baseTitle || title} Admit Card`,
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
  const noticeSummary =
    postType === "notice" || postType === "corrigendum" || postType === "answer_key"
      ? buildNoticeSummaryFromTitle({ title })
      : "";
  const messages = {
    job: "Use the official notification and portal as the final authority, complete the process carefully, and keep copies of every submitted document or acknowledgement.",
    admit_card: "Download the admit card only from the official source, verify all printed details, and follow the reporting instructions exactly as issued.",
    result: "Check the result only through the official source, note any further stage instructions, and preserve the published record for future reference.",
    answer_key: "Read the official answer key notice carefully and follow the published objection or response process, if one has been announced.",
    admission: "Use the official admission portal and document links for every next step, and keep records of each submission or payment acknowledgement.",
    corrigendum: noticeSummary
      ? `${capitalizeFirst(noticeSummary)}. Candidates should compare the revised instruction with the earlier notice before acting on it.`
      : "Read the revised notice side by side with the earlier notification because corrigenda may update dates, links, categories, or instructions.",
    notice: noticeSummary
      ? `${capitalizeFirst(noticeSummary)}. Candidates should rely only on the linked official document for the latest instruction.`
      : "Treat the official notice and linked source document as the primary reference before making any decision based on this update.",
  };

  return {
    heading: "Final Thoughts",
    content: `${title}: ${messages[postType] || messages.job}`,
    cta:
      postType === "job"
        ? "Open the official portal, verify the latest details, and proceed only after checking the current instructions."
        : "Use the official source links below for the latest verified update and next-step reference.",
  };
};

const buildNotificationDetailsBlock = ({
  title = "",
  postType = "job",
  authority = "",
  officialWebsite = "",
  advertisementNumber = "",
  actionUrl = "",
  applyLastDate,
} = {}) =>
  ({
    heading: "Notification Details",
    content: toText(
      [
        buildNoticeSpecificDetail({
          title,
          postType,
          advertisementNumber,
        }),
        postType === "notice" || postType === "corrigendum" || postType === "answer_key"
          ? ""
          : `${title} is currently listed as an official ${postType.replace(/_/g, " ")} record.`,
        authority ? `Issuing authority: ${authority}.` : "",
        advertisementNumber ? `Reference: ${advertisementNumber}.` : "",
        officialWebsite ? `Primary official portal: ${officialWebsite}.` : "",
        actionUrl && actionUrl !== officialWebsite ? `Direct source path: ${actionUrl}.` : "",
        applyLastDate && postType === "job"
          ? `Current stored last date: ${formatDateForDisplay(applyLastDate)}.`
          : "",
        postType === "job"
          ? "Candidates should compare this record with the linked official notification before relying on dates, eligibility, or submission instructions."
          : postType === "result"
            ? "Candidates should verify the published result or merit document on the official source and follow only the next-step instructions issued there."
            : postType === "admit_card"
              ? "Candidates should verify reporting instructions, venue details, and printed particulars directly from the official admit card source."
              : "Readers should verify the revised instruction directly from the linked official document before relying on the update.",
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
- For notice, corrigendum, and answer_key posts include authority or advertisement number whenever available, plus at least one specific factual block such as important_dates, faq, how_to_apply, or notification_details summarizing the actual update.
- If the source only provides a bare title and a PDF URL without extractable facts, return insufficient_data instead of writing generic filler.

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
  const title = toText(job?.title || job?.jobtitle || "");
  let score = 0;
  if (hasSpecificNarrativeText(job?.meta?.description, title, 40)) score += 1;
  if (hasSpecificNarrativeText(job?.introduction?.content, title, 80)) score += 1;
  if (
    hasMeaningfulString(job?.official_links?.official_website, 12) ||
    hasEntries(job?.official_links?.links)
  ) {
    score += 1;
  }
  if (hasMeaningfulString(job?.disclaimer, 40)) score += 1;
  if (hasEntries(job?.tags)) score += 1;
  if (hasEntries(job?.important_dates?.dates) || job?.applyLastDate) score += 1;
  if (hasSpecificNarrativeText(job?.notification_details?.content, title, 40)) score += 1;
  if (hasEntries(job?.selection_process?.stages)) score += 1;
  if (hasEntries(job?.how_to_apply?.steps)) score += 1;
  if (hasEntries(job?.how_to_check_result?.steps)) score += 1;
  if (hasEntries(job?.faq?.questions)) score += 1;
  if (
    hasSpecificNarrativeText(job?.about_exam?.content, title, 60) ||
    hasSpecificNarrativeText(job?.about_recruitment?.content, title, 60)
  ) {
    score += 1;
  }
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
  if (hasSpecificNarrativeText(job?.conclusion?.content, title, 40)) score += 1;
  return score;
};

export const isSchemaRichJob = (job = {}, { postType = "" } = {}) => {
  const type = toText(postType || job?.postType || "job").toLowerCase() || "job";
  const title = toText(job?.title || job?.jobtitle || "");
  const score = countMeaningfulFields(job);

  const common =
    hasMeaningfulString(title, 8) &&
    hasSpecificNarrativeText(job?.meta?.description, title, 40) &&
    hasSpecificNarrativeText(job?.introduction?.content, title, 60) &&
    (
      hasMeaningfulString(job?.official_links?.official_website, 12) ||
      hasEntries(job?.official_links?.links)
    ) &&
    hasMeaningfulString(job?.disclaimer, 30);

  if (type === "notice" || type === "corrigendum" || type === "answer_key") {
    const noticeCommon =
      hasMeaningfulString(title, 8) &&
      (
        hasMeaningfulString(job?.official_links?.official_website, 12) ||
        hasEntries(job?.official_links?.links)
      ) &&
      hasMeaningfulString(job?.disclaimer, 30);

    if (!noticeCommon) return false;

    const authorityOrAdNumber =
      hasMeaningfulString(
        job?.conducting_authority || job?.conductingAuthority || "",
        5
      ) ||
      hasMeaningfulString(
        job?.advertisement_number || job?.advertisementNumber || "",
        3
      );

    const hasSpecificNarrative =
      (hasMeaningfulString(job?.introduction?.content, 80) &&
        !isGenericNoticeNarrative(job?.introduction?.content, title)) ||
      (hasMeaningfulString(job?.notification_details?.content, 60) &&
        !isGenericNoticeNarrative(job?.notification_details?.content, title));

    const hasSpecificStructuredContent = hasEntries(job?.important_dates?.dates);
    const hasConcreteSignals =
      authorityOrAdNumber ||
      hasConcreteNoticeSignals(job?.notification_details?.content) ||
      hasConcreteNoticeSignals(job?.introduction?.content) ||
      hasConcreteNoticeSignals(title);
    const hasSourceBackedNarrative = hasSpecificNarrative && hasConcreteSignals;

    return Boolean(
      score >= 5 &&
      (authorityOrAdNumber || hasSpecificStructuredContent) &&
      (
        hasSpecificNarrative ||
        hasSpecificStructuredContent ||
        hasSourceBackedNarrative
      )
    );
  }

  if (!common) return false;

  if (type === "result") {
    return Boolean(
      score >= 6 &&
      (
        hasEntries(job?.important_dates?.dates) ||
        job?.result_dates ||
        hasEntries(job?.how_to_check_result?.steps) ||
        hasSpecificNarrativeText(job?.notification_details?.content, title, 50)
      )
    );
  }

  if (type === "admit_card") {
    return Boolean(
      score >= 6 &&
      (
        hasEntries(job?.important_dates?.dates) ||
        job?.admit_card ||
        hasEntries(job?.how_to_apply?.steps) ||
        hasSpecificNarrativeText(job?.notification_details?.content, title, 50)
      )
    );
  }

  if (type === "admission") {
    return Boolean(
      score >= 6 &&
      (hasEntries(job?.important_dates?.dates) ||
        hasMeaningfulString(job?.notification_details?.content, 40)) &&
      (hasEntries(job?.how_to_apply?.steps) ||
        hasMeaningfulString(job?.eligibility_criteria?.intro, 30) ||
        hasEntries(job?.faq?.questions))
    );
  }

  return Boolean(
    score >= 6 &&
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
    (
      hasEntries(job?.important_dates?.dates) ||
      job?.applyLastDate ||
      hasSpecificNarrativeText(job?.notification_details?.content, title, 50) ||
      hasEntries(job?.faq?.questions)
    )
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
      title:
        cleaned.title ||
        cleaned.jobtitle ||
        candidate.title ||
        candidate.jobtitle ||
        previewJob.title ||
        previewJob.jobtitle ||
        "",
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
      candidate?.conductingAuthority ||
      inferAuthorityFromUrls(
        candidate?.sourceUrl,
        previewJob?.sourceUrl,
        candidate?.official_links?.official_website,
        previewJob?.official_links?.official_website,
        candidate?.direct_links?.notification_pdf,
        candidate?.direct_links?.apply_link,
        candidate?.direct_links?.admit_card_link,
        candidate?.direct_links?.result_link
      )
  );
  const applyLastDate = seedPost?.applyLastDate || previewJob?.applyLastDate || candidate?.applyLastDate;
  const officialLinks = buildOfficialLinksBlock(candidate, previewJob, advertisementNumber);
  const officialWebsite = normalizeUrl(officialLinks?.official_website || candidate?.sourceUrl || previewJob?.sourceUrl);
  const actionUrl =
    normalizeUrl(candidate?.direct_links?.apply_link || previewJob?.direct_links?.apply_link) ||
    normalizeUrl(
      candidate?.direct_links?.notification_pdf || previewJob?.direct_links?.notification_pdf
    ) ||
    normalizeUrl(candidate?.direct_links?.admission_link || previewJob?.direct_links?.admission_link) ||
    normalizeUrl(candidate?.direct_links?.admit_card_link || previewJob?.direct_links?.admit_card_link) ||
    normalizeUrl(candidate?.direct_links?.result_link || previewJob?.direct_links?.result_link) ||
    normalizeUrl(candidate?.direct_links?.answer_key_link || previewJob?.direct_links?.answer_key_link) ||
    normalizeUrl(
      candidate?.direct_links?.corrigendum_link || previewJob?.direct_links?.corrigendum_link
    ) ||
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
  const seededNotificationDetails = stripEmptyDeep(factualBlocks.notification_details);
  const seededDisclaimer = toText(factualBlocks.disclaimer || "");
  const stageSpecificBlocks = buildStageSpecificBlocks({
    postType,
    title,
    officialWebsite,
    actionUrl,
  });
  const aboutBlocks = buildAboutBlock({
    title,
    postType,
    authority,
    officialWebsite,
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
        title,
      }),
    advertisement_number: advertisementNumber || undefined,
    advertisementNumber: advertisementNumber || undefined,
    conducting_authority: authority || undefined,
    conductingAuthority: authority || undefined,
    applyLastDate: applyLastDate || undefined,
    meta:
      (hasSpecificNarrativeText(seededMeta?.description, title, 40) ? seededMeta : undefined) ||
      stripEmptyDeep({
        description: buildMetaDescription({
          title,
          postType,
          authority,
          advertisementNumber,
          applyLastDate,
          officialWebsite,
          actionUrl,
        }),
        keywords: buildTagList({
          title,
          authority,
          advertisementNumber,
          postType,
        }),
      }),
    introduction:
      (hasSpecificNarrativeText(seededIntroduction?.content, title, 60)
        ? seededIntroduction
        : undefined) ||
      buildIntroductionBlock({
        title,
        postType,
        authority,
        advertisementNumber,
        applyLastDate,
        officialWebsite,
        actionUrl,
      }),
    important_dates:
      factualBlocks.important_dates || collectImportantDates(candidate, previewJob, postType),
    official_links: officialLinks,
    notification_details:
      ((hasSpecificNarrativeText(seededNotificationDetails?.content, title, 50) ||
        Object.keys(seededNotificationDetails || {}).some(
          (key) => key !== "heading" && key !== "content"
        ))
        ? seededNotificationDetails
        : undefined) ||
      buildNotificationDetailsBlock({
        title,
        postType,
        authority,
        officialWebsite,
        advertisementNumber,
        actionUrl,
        applyLastDate,
      }),
    conclusion:
      (hasSpecificNarrativeText(seededConclusion?.content, title, 40)
        ? seededConclusion
        : undefined) ||
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
    faq:
      (hasEntries(factualBlocks?.faq?.questions) ? factualBlocks.faq : undefined) ||
      buildFaqBlock({
        title,
        postType,
        authority,
        advertisementNumber,
        officialWebsite,
        actionUrl,
        applyLastDate,
      }),
    ...aboutBlocks,
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
