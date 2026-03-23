import axios from "axios";
import https from "node:https";
import { constants as cryptoConstants } from "node:crypto";
import * as cheerio from "cheerio";
import { sendNewPostsNotification } from "../job-notification/notification.mjs";
import { officialLinks } from "./officialLinks.mjs";
import { inferPostType } from "./job-family.mjs";
import { extractAdvertisementNumber, parseLooseDate } from "./job-normalize.mjs";
import { buildHumanStatus } from "./job-status.mjs";
import { syncJobPosts, syncSingleJobPost } from "./job-sync.mjs";
import {
  buildSchemaFallbackPost,
  generateSchemaDrivenSourcePost,
  isSchemaRichJob,
  isSourcePostAiConfigured,
} from "./source-post-ai.mjs";

const MAX_CANDIDATES_PER_SOURCE = 40;

const POST_TEXT_IGNORE_PATTERNS = [
  /home/i,
  /contact/i,
  /privacy/i,
  /terms/i,
  /help/i,
  /sitemap/i,
  /login/i,
];

const NON_POST_TITLE_PATTERNS = [
  /download\s+hindi\s+fonts?/i,
  /\bhindi\s+fonts?\b/i,
  /\bfont\s+download\b/i,
  /\bdemo\s+files?\b/i,
  /^\s*explore\s+now\s*$/i,
  /^\s*through\s+open\s+advertisement\s*$/i,
  /^\s*https?:\/\//i,
  /^\s*(eoi|expression of interest)\b/i,
  /\bnotice inviting tender\b/i,
  /\btender\b/i,
  /\bquotation\b/i,
  /\brfp\b/i,
  /\bauction\b/i,
  /\bprocurement\b/i,
  /\bvendor\b/i,
  /\bgstn manual invoice form\b/i,
  /\be-?pariksha\b/i,
  /\bexamination management services\b/i,
  /\bdoctrine\b/i,
  /\bcompendium\b/i,
  /\bappendix\b/i,
  /\bpension(?:ary)?\b/i,
  /\bbenefits?\b/i,
  /\bhandbook\b/i,
  /\bguidelines?\b/i,
  /\brest\s+houses?\b/i,
  /\bdisclosure\b/i,
  /\bhr initiatives?\b/i,
  /\boutreach event\b/i,
  /\bmessages?\b/i,
  /\bhonorary commi?s+ion\b/i,
  /\bmultinational exercise\b/i,
  /\bdesert flag\b/i,
  /^notifications$/i,
  /^circulars withdrawn$/i,
  /\bbasel\b/i,
  /\bliquidity standards?\b/i,
  /\bresolution framework\b/i,
  /\bbanking regulation act\b/i,
  /\boffline retail payments\b/i,
  /\bonline dispute resolution\b/i,
  /\bpayment frauds?\b/i,
  /\bexport credit\b/i,
  /\bcurrent accounts?\b/i,
  /\bloans against gold\b/i,
  /\bmsme\b.*\brestructuring/i,
  /\bfinancial parameters\b/i,
  /\bpayroll\b.*\blocker concession\b/i,
  /\bcivil non scheduled\b/i,
  /\bissue of noc for constructions?\b/i,
  /^view more notices$/i,
  /^notice board$/i,
  /^notice and announcement$/i,
  /^recruitment notice$/i,
  /^cts notice$/i,
  /^history\/records$/i,
  /^latest notifications$/i,
  /^syllabus$/i,
  /^admit card$/i,
  /^rejected omr sheets$/i,
  /^notification\/order$/i,
  /^examination fee notice$/i,
  /^examination general notice$/i,
  /\bconvocation\b/i,
  /\bdress code\b/i,
  /\bparking arrangements?\b/i,
  /\bsemester fees?\b/i,
  /\bweeding out\b/i,
  /\bindian knowledge systems\b/i,
  /\bplacement coordinators?\b/i,
  /\bnodal officer\b/i,
  /\binterest subvention\b/i,
  /\bcovid-?19\b.*\bregulatory package\b/i,
  /\blarge exposures framework\b/i,
  /\bimport of goods and services\b/i,
  /\bvoluntary retention route\b/i,
  /\brisk management and inter-bank dealings\b/i,
  /\bdeclaration of dividends by banks\b/i,
  /\brupee drawing arrangement\b/i,
  /\bannual closing of government accounts\b/i,
  /\blegal entity identifier\b/i,
  /\bsubmission of regulatory returns\b/i,
  /\bprime minister.?s national relief fund\b/i,
  /\bmutual fund holders?\b/i,
  /\bdemat account\b/i,
  /\blocked?er holders?\b/i,
  /\blocked?er hirers?\b/i,
  /\bre-?kyc\b/i,
  /\bkyc updation\b/i,
  /\bcollection agenc(?:y|ies)\b/i,
  /\bbrokers?[’']?\s+empanelment\b/i,
  /\bconcurrent auditors?\b/i,
  /\btds on interest\b/i,
  /\bomni bonds?\b/i,
];

const NON_POST_FILE_PATTERN =
  /\.(?:rar|zip|7z|tar|gz|bz2|xz|exe|msi|apk|ttf|otf|woff2?|eot)(?:$|\?)/i;

const NON_POST_PATH_PATTERNS = [/\/resources\/pdf\/utilities\//i];

const RECRUITMENT_LIKE_TITLE_PATTERN =
  /\b(recruit(?:ment)?|vacanc(?:y|ies)|admit|result|answer key|exam(?:ination)?|interview|selection|document verification|\bdv\b|skill test|typing test|merit|cut[- ]?off|application|apply|registration|admission|seat allotment|seat allocation|candidate(?:s)?|shortlisted|junior resident|faculty|nursing|paramedical|constable|assistant|officer|engineer|medical|centre change|center change|exam city|exam district|exam venue|stage[- ]?ii|stage[- ]?iii)\b/i;

const EXACT_GENERIC_LINK_TEXTS = new Set([
  "Notifications/Advertisements",
  "Recruitment Notices",
  "Apply Online",
]);

const UPSC_NAV_TEXTS = new Set([
  "Advertisements",
  "Status of Lateral Recruitment Cases (Advertisement-wise)",
  "Status of Recruitment Cases (Advertisement-wise)",
  "Answer Keys",
  "Recruitment",
  "Forms for Certificates",
  "Recruitment Tests",
  "Recruitment Requisition",
  "Recruitment cases kept on hold on account of Pending Litigations",
  "Active Examinations",
  "Calendar",
  "Forthcoming Examinations",
  "Previous Question Papers",
  "Cut-off Marks",
  "Marks of Recommended Candidates",
  "Marks of Recommended Candidates (Reserve List)",
  "Specimen Question Cum Answer Booklet (QCAB)",
  "Common mistakes committed by the candidates in Conventional Papers",
  "Revised Syllabus and Scheme",
  "Representation on Question Papers",
  "Demo Files",
  "admit-cards",
  "written-results",
]);

const DEFAULT_REQUEST_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

const LEGACY_TLS_AGENT = new https.Agent({
  secureOptions: cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT,
});
const INSECURE_TLS_AGENT = new https.Agent({
  rejectUnauthorized: false,
});
const INSECURE_LEGACY_TLS_AGENT = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT,
});

const SOURCE_HTML_CACHE = new Map();

const UPSC_AUTHORITY = "Union Public Service Commission (UPSC)";
const SSC_AUTHORITY = "Staff Selection Commission (SSC)";
const RRB_CHANDIGARH_AUTHORITY = "Railway Recruitment Board, Chandigarh";

const toText = (value = "") => String(value || "").replace(/\s+/g, " ").trim();
const toUniqueArray = (value = []) => [...new Set(value.filter(Boolean))];

const sanitizeCandidateTitle = (value = "") =>
  toText(value)
    .replace(/^[\u2022.\-\s]+/, "")
    .replace(/^\d+\.\s*/, "")
    .trim();

const isNonPostUtilityCandidate = ({ text = "", href = "" } = {}) => {
  const title = sanitizeCandidateTitle(text);
  const normalizedHref = toText(href);
  const label = `${title} ${normalizedHref}`;

  if (
    /^\s*click\s+here\b/i.test(title) &&
    !/\b(admit\s*card|result|answer\s*key|notification|recruitment|exam(?:ination)?|advt|advertisement|apply(?:\s+online)?)\b/i.test(
      title
    )
  ) {
    return true;
  }

  if (NON_POST_FILE_PATTERN.test(normalizedHref)) {
    return true;
  }

  if (NON_POST_PATH_PATTERNS.some((pattern) => pattern.test(normalizedHref))) {
    return true;
  }

  if (/^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:\s+\d{1,2}:\d{2}\s?(?:AM|PM)?)?$/i.test(title)) {
    return true;
  }

  return (
    NON_POST_TITLE_PATTERNS.some((pattern) => pattern.test(title) || pattern.test(label)) ||
    isDomainSpecificNonPost(title, normalizedHref)
  );
};

const getNonPostCandidateReason = (candidate = {}) => {
  const title = toText(candidate?.title || candidate?.jobtitle || "");
  const urls = [
    candidate?.sourceUrl,
    candidate?.direct_links?.apply_link,
    candidate?.direct_links?.notification_pdf,
    candidate?.direct_links?.admit_card_link,
    candidate?.direct_links?.result_link,
    candidate?.official_links?.official_website,
  ]
    .map((value) => toText(value))
    .filter(Boolean);

  for (const href of urls.length > 0 ? urls : [""]) {
    if (isNonPostUtilityCandidate({ text: title, href })) {
      return "non_post_utility_or_tender";
    }
  }

  return "";
};

const normalizeUrl = (value = "", baseUrl = "") => {
  const candidate = toText(value);
  if (!candidate) return "";

  try {
    return baseUrl ? new URL(candidate, baseUrl).toString() : new URL(candidate).toString();
  } catch {
    return "";
  }
};

const normalizeHostname = (value = "") => {
  const url = normalizeUrl(value);
  if (!url) return "";

  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
};

const isDomainSpecificNonPost = (title = "", href = "") => {
  const hostname = normalizeHostname(href);
  const normalizedTitle = sanitizeCandidateTitle(title);

  if (!hostname || !normalizedTitle) return false;

  if (/^www\./i.test(hostname) ? hostname.replace(/^www\./i, "") === "rbi.org.in" : hostname === "rbi.org.in") {
    return !RECRUITMENT_LIKE_TITLE_PATTERN.test(normalizedTitle);
  }

  if (/^www\./i.test(hostname) ? hostname.replace(/^www\./i, "") === "idbibank.in" : hostname === "idbibank.in") {
    return !RECRUITMENT_LIKE_TITLE_PATTERN.test(normalizedTitle);
  }

  return false;
};

const resolveSourceProfile = (sourceUrl = "") => {
  const hostname = normalizeHostname(sourceUrl);

  if (hostname === "upsssc.gov.in") return "upsssc";
  if (hostname === "aiimsexams.ac.in" || hostname === "oldwebsite.aiimsexams.ac.in") {
    return "aiims";
  }
  if (/^rrb/i.test(hostname) || hostname.includes("rrb")) return "rrb";
  if (hostname === "ssc.gov.in" || hostname === "ssc.nic.in") return "ssc";
  if (hostname === "upsc.gov.in" || hostname === "upsconline.nic.in") return "upsc";
  return "";
};

const toggleWwwHostname = (sourceUrl = "") => {
  try {
    const parsed = new URL(sourceUrl);
    const fallback = new URL(parsed.toString());
    fallback.hostname = /^www\./i.test(parsed.hostname)
      ? parsed.hostname.replace(/^www\./i, "")
      : `www.${parsed.hostname}`;
    return fallback.toString();
  } catch {
    return "";
  }
};

const shouldRetryWithAlternateHostname = (error) => {
  const message = String(error?.message || "");
  return (
    /certificate's altnames/i.test(message) ||
    /hostname\/ip does not match certificate/i.test(message)
  );
};

const shouldRetryWithLegacyTls = (error) =>
  /unsafe legacy renegotiation disabled/i.test(String(error?.message || ""));

const shouldRetryWithInsecureTls = (error) =>
  /unable to verify the first certificate/i.test(String(error?.message || ""));

const requestSourceHtml = async (
  sourceUrl,
  { useLegacyTls = false, allowInsecureTls = false } = {}
) => {
  const response = await axios.get(sourceUrl, {
    timeout: 25000,
    maxRedirects: 5,
    headers: DEFAULT_REQUEST_HEADERS,
    httpsAgent: allowInsecureTls
      ? useLegacyTls
        ? INSECURE_LEGACY_TLS_AGENT
        : INSECURE_TLS_AGENT
      : useLegacyTls
        ? LEGACY_TLS_AGENT
        : undefined,
  });

  return String(response?.data || "");
};

const settleCandidateBatches = async (tasks = [], { maxCandidates = MAX_CANDIDATES_PER_SOURCE } = {}) => {
  const settled = await Promise.allSettled(tasks);
  const fulfilled = settled
    .filter((result) => result.status === "fulfilled" && Array.isArray(result.value))
    .flatMap((result) => result.value);

  if (fulfilled.length > 0) {
    return dedupeCandidates(fulfilled, { maxCandidates });
  }

  const rejected = settled.filter((result) => result.status === "rejected");
  if (rejected.length > 0) {
    throw rejected[0].reason;
  }

  return [];
};

const buildCandidateKey = ({ title = "", href = "", postType = "job" } = {}) => {
  const titleKey = toText(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  if (titleKey) {
    return `${postType}::${titleKey}`;
  }

  return `${postType}::${normalizeUrl(href) || href}`;
};

const extractDateFromText = (value = "") => {
  const text = toText(value);
  if (!text) return null;

  const match =
    text.match(/\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/) ||
    text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);

  if (!match?.[1]) return null;

  return parseLooseDate(match[1]);
};

const normalizeDateLabel = (value = "") =>
  toText(value)
    .replace(/\s*:\s*/g, ": ")
    .replace(/\bCEN\b/gi, "CEN")
    .trim();

const formatDateForDisplay = (value = "") => normalizeDateLabel(value);

const buildImportantDates = (pairs = [], { heading = "Important Dates" } = {}) => {
  const dates = pairs
    .map(({ event = "", date = "" }) => ({
      event: normalizeDateLabel(event),
      date: formatDateForDisplay(date),
    }))
    .filter((entry) => entry.event && entry.date);

  if (dates.length === 0) return undefined;

  return {
    heading,
    dates,
  };
};

const mergeLinkList = (...linkGroups) => {
  const seen = new Set();
  const output = [];

  for (const group of linkGroups) {
    for (const link of Array.isArray(group) ? group : []) {
      const url = normalizeUrl(link?.url || link?.href || "");
      const label = toText(link?.label || link?.text || "");
      if (!url) continue;
      const key = `${url}::${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({
        label: label || "Official Link",
        url,
        status: String(link?.status || "Active").trim() || "Active",
      });
    }
  }

  return output;
};

const mergeCandidateData = (baseCandidate = {}, patch = {}) => {
  const next = {
    ...baseCandidate,
    ...patch,
  };

  if (baseCandidate.official_links || patch.official_links) {
    next.official_links = {
      ...(baseCandidate.official_links || {}),
      ...(patch.official_links || {}),
      links: mergeLinkList(
        baseCandidate.official_links?.links,
        patch.official_links?.links
      ),
    };
  }

  if (baseCandidate.direct_links || patch.direct_links) {
    next.direct_links = {
      ...(baseCandidate.direct_links || {}),
      ...(patch.direct_links || {}),
    };
  }

  return next;
};

const mergeSchemaDrivenCandidate = (candidate = {}, generatedPost = {}) => {
  const merged = mergeCandidateData(generatedPost, candidate);

  return {
    ...merged,
    title: toText(generatedPost.title || generatedPost.jobtitle || candidate.title || candidate.jobtitle),
    jobtitle: toText(
      generatedPost.jobtitle || generatedPost.title || candidate.jobtitle || candidate.title
    ),
    category: toText(generatedPost.category || candidate.category || ""),
    language: toText(generatedPost.language || candidate.language || "en"),
    status: buildHumanStatus({
      postType: toText(candidate.postType || generatedPost.postType || "job"),
      applyLastDate: candidate.applyLastDate || generatedPost.applyLastDate,
      currentStatus: candidate.status || generatedPost.status,
      title:
        generatedPost.title ||
        generatedPost.jobtitle ||
        candidate.title ||
        candidate.jobtitle ||
        "",
    }),
    postType: toText(candidate.postType || generatedPost.postType || "job"),
    sourceUrl: normalizeUrl(candidate.sourceUrl || generatedPost.sourceUrl || ""),
    applyLastDate: candidate.applyLastDate || generatedPost.applyLastDate,
    advertisement_number: toText(
      generatedPost.advertisement_number ||
        candidate.advertisement_number ||
        candidate.official_links?.advertisement_number ||
        ""
    ),
    advertisementNumber: toText(
      generatedPost.advertisementNumber ||
        generatedPost.advertisement_number ||
        candidate.advertisementNumber ||
        candidate.advertisement_number ||
        ""
    ),
    conducting_authority: toText(
      generatedPost.conducting_authority || candidate.conducting_authority || ""
    ),
    conductingAuthority: toText(
      generatedPost.conductingAuthority ||
        generatedPost.conducting_authority ||
        candidate.conductingAuthority ||
        candidate.conducting_authority ||
        ""
    ),
    direct_links: {
      ...(generatedPost.direct_links || {}),
      ...(candidate.direct_links || {}),
    },
  };
};

const buildIgnoredIncompleteResult = ({
  candidate = {},
  preview = {},
  reason = "",
  dryRun = false,
} = {}) => ({
  action: "ignored_incomplete",
  job: preview?.job || candidate,
  familyCount: Number(preview?.familyCount || 0),
  dryRun,
  persisted: false,
  reason: toText(reason || "schema_incomplete"),
});

const buildIgnoredPreflightResult = ({
  candidate = {},
  action = "ignored_non_post",
  reason = "",
  dryRun = false,
} = {}) => ({
  action,
  job: candidate,
  familyCount: 0,
  dryRun,
  persisted: false,
  reason: toText(reason || action),
});

const prepareCandidatesForSync = async (candidates = [], { dryRun = false } = {}) => {
  const readyCandidates = [];
  const preflightResults = [];
  const aiEnabled = isSourcePostAiConfigured();

  for (const candidate of candidates) {
    const nonPostReason = getNonPostCandidateReason(candidate);
    if (nonPostReason) {
      preflightResults.push(
        buildIgnoredPreflightResult({
          candidate,
          action: "ignored_non_post",
          reason: nonPostReason,
          dryRun,
        })
      );
      continue;
    }

    const preview = await syncSingleJobPost(candidate, { dryRun: true });

    if (preview.action === "ignored_expired" || preview.action === "ignored_closed") {
      preflightResults.push({
        ...preview,
        dryRun,
        persisted: false,
      });
      continue;
    }

    if (preview.action === "new_detected") {
      readyCandidates.push(preview?.job || candidate);
      continue;
    }

    const previewJob = preview?.job || candidate;
    if (isSchemaRichJob(previewJob, { postType: previewJob?.postType || candidate?.postType })) {
      readyCandidates.push(candidate);
      continue;
    }

    const fallbackCandidate = mergeSchemaDrivenCandidate(
      candidate,
      buildSchemaFallbackPost({
        candidate,
        previewJob,
      })
    );

    if (isSchemaRichJob(fallbackCandidate, { postType: fallbackCandidate?.postType })) {
      readyCandidates.push(fallbackCandidate);
      continue;
    }

    if (!aiEnabled) {
      preflightResults.push(
        buildIgnoredIncompleteResult({
          candidate: fallbackCandidate,
          preview,
          reason: "schema_ai_unavailable",
          dryRun,
        })
      );
      continue;
    }

    try {
      const sourceEvidence = await buildLocalSourceEvidence(fallbackCandidate);
      const enriched = await generateSchemaDrivenSourcePost({
        candidate: fallbackCandidate,
        previewJob: fallbackCandidate,
        sourceEvidence,
      });

      if (enriched.status !== "ready" || !enriched.post || Object.keys(enriched.post).length === 0) {
        preflightResults.push(
          buildIgnoredIncompleteResult({
            candidate: fallbackCandidate,
            preview,
            reason: enriched.reason || "schema_ai_insufficient_data",
            dryRun,
          })
        );
        continue;
      }

      const mergedCandidate = mergeSchemaDrivenCandidate(fallbackCandidate, enriched.post);
      if (!isSchemaRichJob(mergedCandidate, { postType: mergedCandidate.postType })) {
        preflightResults.push(
          buildIgnoredIncompleteResult({
            candidate: mergedCandidate,
            preview,
            reason: "schema_ai_validation_failed",
            dryRun,
          })
        );
        continue;
      }

      readyCandidates.push(mergedCandidate);
    } catch (error) {
      preflightResults.push(
        buildIgnoredIncompleteResult({
          candidate: fallbackCandidate,
          preview,
          reason: error?.message || String(error),
          dryRun,
        })
      );
    }
  }

  return {
    readyCandidates,
    preflightResults,
  };
};

const parseKeyValueTableRows = (html = "") => {
  const $ = cheerio.load(html);
  const rows = [];

  $("table tr").each((_, tr) => {
    const cells = $(tr)
      .find("th,td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

    if (cells.length >= 2) {
      rows.push({
        key: cells[0],
        value: cells.slice(1).join(" | "),
      });
    }
  });

  return rows;
};

const buildImportantDatePairsFromRows = (rows = []) =>
  rows
    .filter(({ key = "", value = "" }) => {
      if (!key || !value) return false;
      return Boolean(
        parseLooseDate(value) ||
          value.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/) ||
          value.match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/)
      );
    })
    .map(({ key, value }) => ({
      event: key,
      date: value,
    }));

const extractDateRange = (value = "") => {
  const matches = String(value || "").match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g);
  if (!matches || matches.length === 0) return [];
  return matches;
};

const setAuthorityFields = (candidate = {}, authority = "") => ({
  ...candidate,
  conducting_authority: authority,
  conductingAuthority: authority,
});

const scoreAnchor = ({ text = "", href = "" } = {}) => {
  const label = `${text} ${href}`.toLowerCase();
  if (!text || text.length < 8) return 0;
  if (POST_TEXT_IGNORE_PATTERNS.some((pattern) => pattern.test(text))) return 0;
  if (isNonPostUtilityCandidate({ text, href })) return 0;

  let score = 0;
  if (
    /recruit|apply|vacan|notification|admit|result|answer key|admission|allotment|merit|score|calendar|exam/i.test(
      label
    )
  ) {
    score += 50;
  }
  if (/\.pdf($|\?)/i.test(href)) score += 25;
  if (/advt|advertisement|notice|visible upto|call letter|e-admit|corrigendum/i.test(label)) {
    score += 20;
  }
  if (/download|apply online|click here|open round/i.test(label)) score += 10;
  return score;
};

const buildDirectLinks = ({ postType = "job", url = "", text = "", baseUrl = "" } = {}) => {
  const normalizedUrl = normalizeUrl(url, baseUrl);
  const next = {
    official_website: normalizeUrl(baseUrl) || baseUrl,
  };

  if (!normalizedUrl) return next;

  if (postType === "admit_card") {
    next.admit_card_link = normalizedUrl;
    return next;
  }
  if (postType === "result") {
    next.result_link = normalizedUrl;
    return next;
  }
  if (postType === "answer_key") {
    next.answer_key_link = normalizedUrl;
    return next;
  }
  if (postType === "admission") {
    next.admission_link = normalizedUrl;
    return next;
  }
  if (postType === "corrigendum") {
    next.corrigendum_link = normalizedUrl;
    return next;
  }

  if (/\.pdf($|\?)/i.test(normalizedUrl) || /notification|advertisement|advt/i.test(text)) {
    next.notification_pdf = normalizedUrl;
  } else {
    next.apply_link = normalizedUrl;
  }

  return next;
};

const buildOfficialLinks = ({ baseUrl = "", url = "", text = "" } = {}) => ({
  heading: "Official Website & Links",
  official_website: normalizeUrl(baseUrl) || baseUrl,
  links: [
    {
      label: toText(text) || "Official Link",
      url: normalizeUrl(url, baseUrl),
      status: "Active",
    },
  ].filter((item) => item.url),
});

const buildCandidateFromAnchor = ({
  sourceUrl = "",
  href = "",
  text = "",
  baseUrl = "",
  officialWebsite = "",
} = {}) => {
  const title = sanitizeCandidateTitle(text);
  const normalizedHref = normalizeUrl(href, baseUrl || sourceUrl);
  const officialBase = normalizeUrl(officialWebsite || sourceUrl) || sourceUrl;
  if (!title || !normalizedHref) return null;
  if (isNonPostUtilityCandidate({ text: title, href: normalizedHref })) return null;

  const postType = inferPostType({ title, sourceUrl: normalizedHref });
  const extractedDate = extractDateFromText(title);

  return {
    title,
    jobtitle: title,
    sourceUrl: normalizedHref,
    postType,
    status: buildHumanStatus({
      postType,
      applyLastDate: postType === "job" ? extractedDate || undefined : undefined,
      title,
    }),
    official_links: buildOfficialLinks({
      baseUrl: officialBase,
      url: normalizedHref,
      text: title,
    }),
    direct_links: buildDirectLinks({
      postType,
      url: normalizedHref,
      text: title,
      baseUrl: officialBase,
    }),
    applyLastDate: postType === "job" ? extractedDate || undefined : undefined,
  };
};

const dedupeCandidates = (candidates = [], { maxCandidates = MAX_CANDIDATES_PER_SOURCE } = {}) => {
  const seen = new Set();
  const deduped = [];

  const sorted = [...candidates].sort(
    (left, right) => Number(right?._score || 0) - Number(left?._score || 0)
  );

  for (const candidate of sorted) {
    if (!candidate?.title || !candidate?.sourceUrl) continue;
    const key = buildCandidateKey({
      title: candidate.title,
      href: candidate.sourceUrl,
      postType: candidate.postType,
    });
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
    if (deduped.length >= maxCandidates) break;
  }

  return deduped.map(({ _score, ...candidate }) => candidate);
};

const discoverSourceCandidates = ({
  sourceUrl = "",
  html = "",
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const $ = cheerio.load(html);
  const candidates = [];

  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href") || "";
    const text = sanitizeCandidateTitle($(anchor).text());
    const score = scoreAnchor({ text, href });
    if (score <= 0) return;

    const candidate = buildCandidateFromAnchor({
      sourceUrl,
      baseUrl: sourceUrl,
      officialWebsite: sourceUrl,
      href,
      text,
    });
    if (!candidate) return;

    candidates.push({
      ...candidate,
      _score: score,
    });
  });

  return dedupeCandidates(candidates, { maxCandidates });
};

const fetchSourceHtml = async (sourceUrl) => {
  const cacheKey = normalizeUrl(sourceUrl) || sourceUrl;
  if (cacheKey && SOURCE_HTML_CACHE.has(cacheKey)) {
    return SOURCE_HTML_CACHE.get(cacheKey);
  }

  try {
    const html = await requestSourceHtml(sourceUrl);
    if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
    return html;
  } catch (error) {
    if (shouldRetryWithLegacyTls(error)) {
      try {
        const html = await requestSourceHtml(sourceUrl, { useLegacyTls: true });
        if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
        return html;
      } catch (legacyError) {
        if (shouldRetryWithInsecureTls(legacyError)) {
          const html = await requestSourceHtml(sourceUrl, {
            useLegacyTls: true,
            allowInsecureTls: true,
          });
          if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
          return html;
        }
        throw legacyError;
      }
    }
    if (shouldRetryWithInsecureTls(error)) {
      try {
        const html = await requestSourceHtml(sourceUrl, { allowInsecureTls: true });
        if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
        return html;
      } catch (insecureError) {
        if (shouldRetryWithLegacyTls(insecureError)) {
          const html = await requestSourceHtml(sourceUrl, {
            useLegacyTls: true,
            allowInsecureTls: true,
          });
          if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
          return html;
        }
        throw insecureError;
      }
    }

    if (shouldRetryWithAlternateHostname(error)) {
      const alternateUrl = toggleWwwHostname(sourceUrl);
      if (alternateUrl) {
        try {
          const html = await requestSourceHtml(alternateUrl);
          if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
          return html;
        } catch (alternateError) {
          if (shouldRetryWithLegacyTls(alternateError)) {
            try {
              const html = await requestSourceHtml(alternateUrl, { useLegacyTls: true });
              if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
              return html;
            } catch (alternateLegacyError) {
              if (shouldRetryWithInsecureTls(alternateLegacyError)) {
                const html = await requestSourceHtml(alternateUrl, {
                  useLegacyTls: true,
                  allowInsecureTls: true,
                });
                if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
                return html;
              }
              throw alternateLegacyError;
            }
          }
          if (shouldRetryWithInsecureTls(alternateError)) {
            try {
              const html = await requestSourceHtml(alternateUrl, { allowInsecureTls: true });
              if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
              return html;
            } catch (alternateInsecureError) {
              if (shouldRetryWithLegacyTls(alternateInsecureError)) {
                const html = await requestSourceHtml(alternateUrl, {
                  useLegacyTls: true,
                  allowInsecureTls: true,
                });
                if (cacheKey) SOURCE_HTML_CACHE.set(cacheKey, html);
                return html;
              }
              throw alternateInsecureError;
            }
          }
          throw alternateError;
        }
      }
    }

    throw error;
  }
};

const collectCandidatesFromPage = async ({
  pageUrl,
  sourceUrl,
  officialWebsite = sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
  scoreBonus = 60,
  filterAnchor = () => true,
  transformCandidate = (candidate) => candidate,
} = {}) => {
  const html = await fetchSourceHtml(pageUrl);
  const $ = cheerio.load(html);
  const candidates = [];

  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href") || "";
    const text = sanitizeCandidateTitle($(anchor).text());
    if (!href || !text) return;
    if (!filterAnchor({ href, text, pageUrl, sourceUrl, officialWebsite })) return;

    const candidate = buildCandidateFromAnchor({
      sourceUrl,
      baseUrl: pageUrl,
      officialWebsite,
      href,
      text,
    });
    if (!candidate) return;

    const nextCandidate = transformCandidate(candidate, {
      href,
      text,
      pageUrl,
      sourceUrl,
      officialWebsite,
      normalizedHref: normalizeUrl(href, pageUrl),
    });

    if (!nextCandidate?.title || !nextCandidate?.sourceUrl) return;
    candidates.push({
      ...nextCandidate,
      _score: scoreAnchor({ text, href }) + scoreBonus,
    });
  });

  return dedupeCandidates(candidates, { maxCandidates });
};

const buildLocalSourceEvidence = async (candidate = {}) => {
  const urls = toUniqueArray(
    [
      candidate?.sourceUrl,
      candidate?.official_links?.official_website,
      candidate?.direct_links?.notification_pdf,
      candidate?.direct_links?.apply_link,
    ]
      .map((url) => normalizeUrl(url))
      .filter(Boolean)
  ).slice(0, 3);

  const evidenceBlocks = [];

  for (const url of urls) {
    if (/\.pdf($|\?)/i.test(url)) {
      evidenceBlocks.push(
        JSON.stringify(
          {
            url,
            note: "Official PDF URL referenced by source sync.",
          },
          null,
          2
        )
      );
      continue;
    }

    try {
      const html = await fetchSourceHtml(url);
      const $ = cheerio.load(html);
      const title = toText($("title").first().text());
      const headings = $("h1,h2,h3")
        .map((_, node) => toText($(node).text()))
        .get()
        .filter(Boolean)
        .slice(0, 8);
      const tableRows = parseKeyValueTableRows(html)
        .slice(0, 12)
        .map((row) => ({ key: row.key, value: row.value }));
      const relevantLinks = $("a[href]")
        .map((_, anchor) => ({
          text: toText($(anchor).text()),
          href: normalizeUrl($(anchor).attr("href") || "", url),
        }))
        .get()
        .filter(
          (link) =>
            link.href &&
            /apply|notification|notice|admit|result|answer key|corrigendum|pdf|login|important|date|schedule|eligib|vacan|fee/i.test(
              `${link.text} ${link.href}`
            )
        )
        .slice(0, 12);

      evidenceBlocks.push(
        JSON.stringify(
          {
            url,
            title,
            headings,
            tableRows,
            relevantLinks,
          },
          null,
          2
        )
      );
    } catch (error) {
      evidenceBlocks.push(
        JSON.stringify(
          {
            url,
            fetchError: error?.message || String(error),
          },
          null,
          2
        )
      );
    }
  }

  return evidenceBlocks.join("\n\n");
};

const fetchSscExamCatalog = async () => {
  const response = await axios.get("https://ssc.gov.in/api/admin/5.1/allExams", {
    timeout: 20000,
    headers: {
      ...DEFAULT_REQUEST_HEADERS,
      accept: "application/json,text/plain,*/*",
    },
  });

  return Array.isArray(response?.data?.data) ? response.data.data : [];
};

const enrichUpscCandidate = async (candidate = {}) => {
  const nextCandidate = setAuthorityFields(candidate, UPSC_AUTHORITY);
  if (!nextCandidate?.sourceUrl || /\.pdf($|\?)/i.test(nextCandidate.sourceUrl)) {
    return nextCandidate;
  }

  try {
    const html = await fetchSourceHtml(nextCandidate.sourceUrl);
    const rows = parseKeyValueTableRows(html);
    const importantDates = buildImportantDates(
      rows
        .filter((row) =>
          /date|last date|commencement|upload|notification/i.test(String(row.key || ""))
        )
        .flatMap((row) =>
          buildImportantDatePairsFromRows([row])
        )
    );
    const lastDateRow = rows.find((row) => /last date/i.test(String(row.key || "")));
    const applyLastDate =
      parseLooseDate(lastDateRow?.value || "") ||
      parseLooseDate(extractDateRange(lastDateRow?.value || "").slice(-1)[0]);

    const $ = cheerio.load(html);
    const notificationLink = $("a[href]")
      .map((_, anchor) => ({
        href: normalizeUrl($(anchor).attr("href") || "", nextCandidate.sourceUrl),
        text: toText($(anchor).text()),
      }))
      .get()
      .find((link) => /\.pdf($|\?)/i.test(link.href) && /notice|notification|\(\d/i.test(link.text || link.href));

    return mergeCandidateData(nextCandidate, {
      applyLastDate: applyLastDate || nextCandidate.applyLastDate,
      important_dates: importantDates || nextCandidate.important_dates,
      official_links: {
        official_website: "https://upsc.gov.in",
        apply_online_portal: "https://upsconline.nic.in/",
        links: notificationLink
          ? [{ label: "Notification PDF", url: notificationLink.href, status: "Active" }]
          : [],
      },
      direct_links: notificationLink
        ? {
            notification_pdf: notificationLink.href,
            apply_link: nextCandidate.direct_links?.apply_link || "https://upsconline.nic.in/",
            official_website: "https://upsc.gov.in/",
          }
        : {
            apply_link: nextCandidate.direct_links?.apply_link || "https://upsconline.nic.in/",
            official_website: "https://upsc.gov.in/",
          },
    });
  } catch {
    return nextCandidate;
  }
};

const buildRrbDirectoryEntries = async (sourceUrl = "") => {
  const normalizedSource = normalizeUrl(sourceUrl);
  const baseUrl = normalizedSource.replace(/\/+$/, "");
  const directoryUrl = `${baseUrl}/employment-notices.php`;
  const html = await fetchSourceHtml(directoryUrl);
  const $ = cheerio.load(html);
  const entries = [];

  $("table tr").each((_, tr) => {
    const links = $(tr)
      .find("a[href]")
      .map((__, anchor) => ({
        text: sanitizeCandidateTitle($(anchor).text()),
        href: $(anchor).attr("href") || "",
      }))
      .get()
      .filter((link) => link.text && link.href);

    const detailLink = links.find((link) => /\d{4}-\d{2}.*\.php$/i.test(link.href));
    if (!detailLink) return;

    const title = sanitizeCandidateTitle(detailLink.text || $(tr).text());
    if (!title || !/CEN/i.test(title)) return;

    entries.push({
      title,
      sourceUrl: normalizeUrl(detailLink.href, directoryUrl),
      advertisement_number: extractAdvertisementNumber({ title }),
      directoryUrl,
    });
  });

  return dedupeCandidates(
    entries.map((entry) => ({
      ...entry,
      jobtitle: entry.title,
      postType: inferPostType({ title: entry.title, sourceUrl: entry.sourceUrl }),
      status: buildHumanStatus({
        postType: inferPostType({ title: entry.title, sourceUrl: entry.sourceUrl }),
        title: entry.title,
      }),
      official_links: {
        heading: "Official Website & Links",
        official_website: normalizedSource,
        advertisement_number: entry.advertisement_number,
        links: [
          {
            label: entry.title,
            url: entry.sourceUrl,
            status: "Active",
          },
        ],
      },
      direct_links: {
        official_website: normalizedSource,
      },
      _score: 190,
    })),
    { maxCandidates: MAX_CANDIDATES_PER_SOURCE }
  );
};

const enrichRrbCandidate = async (candidate = {}) => {
  const nextCandidate = setAuthorityFields(candidate, RRB_CHANDIGARH_AUTHORITY);
  if (!nextCandidate?.sourceUrl) return nextCandidate;

  try {
    const html = await fetchSourceHtml(nextCandidate.sourceUrl);
    const rows = parseKeyValueTableRows(html);
    const importantDates = buildImportantDates(
      rows
        .filter((row) => parseLooseDate(row.key))
        .map((row) => ({
          event: row.value.split(" लिंक / Link : ")[0].split(" Link / ")[0],
          date: row.key,
        })),
      { heading: "Important Dates & Notices" }
    );

    const $ = cheerio.load(html);
    const normalizedAdNo = String(
      nextCandidate.advertisement_number || extractAdvertisementNumber(nextCandidate)
    )
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const links = $("a[href]")
      .map((_, anchor) => ({
        href: normalizeUrl($(anchor).attr("href") || "", nextCandidate.sourceUrl),
        text: toText($(anchor).text()),
      }))
      .get()
      .filter((link) => link.href);

    const noticePdf =
      links.find((link) => /\.pdf($|\?)/i.test(link.href) && /detailed|centralised employment notice|cen/i.test(link.text)) ||
      links.find((link) => /\.pdf($|\?)/i.test(link.href) && /cen/i.test(link.href));

    const applyLink =
      links.find(
        (link) =>
          /rrbapply\.gov\.in/i.test(link.href) ||
          (/configuredhtml\/.*login\.html/i.test(link.href) &&
            (!normalizedAdNo || String(link.text || "").toLowerCase().includes(normalizedAdNo)))
      ) || null;

    const applicationRow = rows.find((row) => /application/i.test(row.value));
    const applicationRange = extractDateRange(applicationRow?.value || "");
    const applyLastDate =
      parseLooseDate(applicationRange.slice(-1)[0]) ||
      parseLooseDate(applicationRow?.value || "") ||
      nextCandidate.applyLastDate;

    return mergeCandidateData(nextCandidate, {
      applyLastDate,
      important_dates: importantDates || nextCandidate.important_dates,
      official_links: {
        official_website: nextCandidate.official_links?.official_website || "https://rrbcdg.gov.in/",
        links: noticePdf
          ? [{ label: "Detailed Notification PDF", url: noticePdf.href, status: "Active" }]
          : [],
      },
      direct_links: {
        official_website: nextCandidate.direct_links?.official_website || "https://rrbcdg.gov.in/",
        ...(applyLink ? { apply_link: applyLink.href } : {}),
        ...(noticePdf ? { notification_pdf: noticePdf.href } : {}),
      },
    });
  } catch {
    return nextCandidate;
  }
};

const extractUpSsscCandidates = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) =>
  collectCandidatesFromPage({
    pageUrl: "https://upsssc.gov.in/AllNotifications.aspx",
    sourceUrl,
    officialWebsite: "https://upsssc.gov.in",
    maxCandidates,
    scoreBonus: 120,
    filterAnchor: ({ href, text }) =>
      !/^javascript:/i.test(href) &&
      !EXACT_GENERIC_LINK_TEXTS.has(text) &&
      !/Default\.aspx|AboutUs|RTI|FeedBack|Syllabus_PostWise|fonts\.zip/i.test(href) &&
      /visible upto|विज्ञापन|notification|advert|admit|result|answer key|revised|click here|download/i.test(
        `${text} ${href}`
      ) &&
      text.length > 18,
  });

const extractAiimsCandidates = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const pages = [
    "https://oldwebsite.aiimsexams.ac.in",
    "https://oldwebsite.aiimsexams.ac.in/info/Recruitments_new.html",
  ];
  const batches = await settleCandidateBatches(
    pages.map((pageUrl) =>
      collectCandidatesFromPage({
        pageUrl,
        sourceUrl,
        officialWebsite: "https://aiimsexams.ac.in",
        maxCandidates,
        scoreBonus: 100,
        filterAnchor: ({ href, text }) =>
          !/^#/.test(href) &&
          !/index\.html|AboutUs|Privacy_Policy|Disclaimer|Archive|ContactUs|Course\.html/i.test(href) &&
          (text.length > 18 || /\.pdf($|\?)/i.test(href)) &&
          /result|recruit|admit|notice|open round|seat allocation|faculty|group|common recruitment|online application|vacant seat|corrigendum|datesheet/i.test(
            `${text} ${href}`
          ),
      })
    )
    ,
    { maxCandidates }
  );
  return batches;
};

const extractRrbCandidates = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const directoryEntries = await buildRrbDirectoryEntries(sourceUrl);
  const enriched = await Promise.all(
    directoryEntries.slice(0, maxCandidates).map((candidate) => enrichRrbCandidate(candidate))
  );
  return dedupeCandidates(enriched, { maxCandidates });
};

const extractUpscCandidates = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const pages = [
    "https://upsc.gov.in/examinations/active-exams",
    "https://upsc.gov.in/examinations/answer-key",
  ];
  const batches = await settleCandidateBatches(
    pages.map((pageUrl) =>
      collectCandidatesFromPage({
        pageUrl,
        sourceUrl,
        officialWebsite: "https://upsc.gov.in",
        maxCandidates,
        scoreBonus: 110,
        filterAnchor: ({ href, text }) =>
          !UPSC_NAV_TEXTS.has(text) &&
          !/^#|^javascript:/i.test(href) &&
          (href.includes("/examinations/") || /\.pdf($|\?)/i.test(href)) &&
          (/\b(19|20)\d{2}\b/.test(text) ||
            /Examination|Services|Academy|LDCE|Medical|Engineer|Geo-Scientist|Defence|Forces/i.test(
              text
            )),
        transformCandidate: (candidate, context) => {
          if (candidate.postType !== "job") {
            return candidate;
          }

          return {
            ...candidate,
            direct_links: {
              ...candidate.direct_links,
              apply_link: "https://upsconline.nic.in/",
              official_website: "https://upsc.gov.in",
              ...(context.normalizedHref.endsWith(".pdf")
                ? { notification_pdf: context.normalizedHref }
                : {}),
            },
            official_links: {
              ...candidate.official_links,
              official_website: "https://upsc.gov.in",
              apply_online_portal: "https://upsconline.nic.in/",
            },
          };
        },
      })
    )
    ,
    { maxCandidates }
  );
  const enriched = await Promise.all(batches.map((candidate) => enrichUpscCandidate(candidate)));
  return dedupeCandidates(enriched, { maxCandidates });
};

const extractSscCandidates = async ({
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const exams = await fetchSscExamCatalog();
  const candidateMap = new Map();

  for (const exam of exams) {
    if (!exam?.navigationUrl || !exam?.examName) continue;
    if (/^null$/i.test(String(exam.navigationUrl).trim())) continue;

    const sourceUrl = normalizeUrl(exam.navigationUrl, "https://ssc.gov.in");
    if (!sourceUrl || /\/null$/i.test(sourceUrl)) continue;

    const title = sanitizeCandidateTitle(exam.examName);
    const candidate = {
      title,
      jobtitle: title,
      sourceUrl,
      postType: "job",
      status: buildHumanStatus({
        postType: "job",
        title,
      }),
      conducting_authority: SSC_AUTHORITY,
      conductingAuthority: SSC_AUTHORITY,
      official_links: {
        heading: "Official Website & Links",
        official_website: "https://ssc.gov.in",
        exam_code: String(exam.examCode || "").trim(),
        links: [
          {
            label: `${exam.examCode || "SSC"} Exam Page`,
            url: sourceUrl,
            status: "Active",
          },
        ],
      },
      direct_links: {
        apply_link: sourceUrl,
        official_website: "https://ssc.gov.in",
      },
      _score: 180,
    };

    const key = `${candidate.postType}::${candidate.sourceUrl}`;
    const existing = candidateMap.get(key);
    if (!existing || candidate.title.length > existing.title.length) {
      candidateMap.set(key, candidate);
    }
  }

  const candidates = [...candidateMap.values()]
    .filter(Boolean);

  return dedupeCandidates(candidates, { maxCandidates });
};

const extractPortalSpecificCandidates = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  const profile = resolveSourceProfile(sourceUrl);

  if (profile === "upsssc") {
    return extractUpSsscCandidates({ sourceUrl, maxCandidates });
  }
  if (profile === "aiims") {
    return extractAiimsCandidates({ sourceUrl, maxCandidates });
  }
  if (profile === "rrb") {
    return extractRrbCandidates({ sourceUrl, maxCandidates });
  }
  if (profile === "ssc") {
    return extractSscCandidates({ sourceUrl, maxCandidates });
  }
  if (profile === "upsc") {
    return extractUpscCandidates({ sourceUrl, maxCandidates });
  }

  return [];
};

const discoverCandidatesForSource = async ({
  sourceUrl,
  maxCandidates = MAX_CANDIDATES_PER_SOURCE,
} = {}) => {
  let specificCandidates = [];

  try {
    specificCandidates = await extractPortalSpecificCandidates({ sourceUrl, maxCandidates });
  } catch {
    // Fall back to generic discovery below.
  }

  if (specificCandidates.length > 0) {
    return dedupeCandidates(
      specificCandidates.map((candidate) => ({
        ...candidate,
        _score: 500,
      })),
      { maxCandidates }
    );
  }

  const candidates = [];

  try {
    const html = await fetchSourceHtml(sourceUrl);
    candidates.push(
      ...discoverSourceCandidates({
        sourceUrl,
        html,
        maxCandidates,
      }).map((candidate) => ({
        ...candidate,
        _score: 50,
      }))
    );
  } catch {
    // Keep specific extraction results if homepage crawl fails.
  }

  return dedupeCandidates(candidates, { maxCandidates });
};

const summarizeOfficialSyncResults = (results = []) =>
  results.reduce(
    (accumulator, entry) => {
      accumulator.sources += 1;
      accumulator.candidates += Number(entry?.candidateCount || 0);
      if (entry?.error) accumulator.errors += 1;
      if (entry?.dryRun) accumulator.dryRunSources += 1;
      for (const result of entry?.results || []) {
        accumulator[result.action] = (accumulator[result.action] || 0) + 1;
        if (result?.dryRun) accumulator.dryRunActions += 1;
      }
      return accumulator;
    },
    {
      sources: 0,
      candidates: 0,
      created: 0,
      updated: 0,
      cloned: 0,
      new_detected: 0,
      notified_new: 0,
      ignored_non_post: 0,
      ignored_closed: 0,
      ignored_expired: 0,
      ignored_incomplete: 0,
      errors: 0,
      dryRunSources: 0,
      dryRunActions: 0,
    }
  );

const syncOfficialSource = async (
  sourceUrl,
  { maxCandidates = MAX_CANDIDATES_PER_SOURCE, dryRun = false } = {}
) => {
  const candidates = await discoverCandidatesForSource({ sourceUrl, maxCandidates });
  const { readyCandidates, preflightResults } = await prepareCandidatesForSync(candidates, {
    dryRun,
  });
  const syncResults = await syncJobPosts(readyCandidates, { dryRun });
  const newDetections = syncResults.filter((result) => result?.action === "new_detected");

  let newDetectionNotification = { sent: false, reason: "no_new_posts" };
  if (!dryRun && newDetections.length > 0) {
    newDetectionNotification = await sendNewPostsNotification({
      sectionName: sourceUrl,
      newPosts: newDetections.map((result) => ({
        title: result?.job?.title || result?.job?.jobtitle || "Untitled post",
        jobUrl: result?.job?.sourceUrl || result?.job?.official_links?.official_website || sourceUrl,
        sourceSites: [sourceUrl],
      })),
    });
  }

  const normalizedSyncResults = syncResults.map((result) => {
    if (result?.action !== "new_detected") return result;
    return {
      ...result,
      action:
        !dryRun && newDetectionNotification?.sent
          ? "notified_new"
          : "new_detected",
      notification: newDetectionNotification,
    };
  });
  const results = [...preflightResults, ...normalizedSyncResults];

  return {
    sourceUrl,
    profile: resolveSourceProfile(sourceUrl),
    candidateCount: candidates.length,
    dryRun,
    results,
  };
};

const syncAllOfficialSources = async ({
  limit = 0,
  sources = officialLinks,
  maxCandidatesPerSource = MAX_CANDIDATES_PER_SOURCE,
  dryRun = false,
} = {}) => {
  const selectedSources =
    Number.isFinite(Number(limit)) && Number(limit) > 0
      ? sources.slice(0, Number(limit))
      : sources;

  const output = [];
  for (const sourceUrl of selectedSources) {
    try {
      output.push(
        await syncOfficialSource(sourceUrl, {
          maxCandidates: maxCandidatesPerSource,
          dryRun,
        })
      );
    } catch (error) {
      output.push({
        sourceUrl,
        profile: resolveSourceProfile(sourceUrl),
        candidateCount: 0,
        dryRun,
        error: error?.message || String(error),
      });
    }
  }

  return output;
};

export {
  buildCandidateFromAnchor,
  buildLocalSourceEvidence,
  collectCandidatesFromPage,
  dedupeCandidates,
  discoverCandidatesForSource,
  discoverSourceCandidates,
  extractDateFromText,
  extractPortalSpecificCandidates,
  fetchSourceHtml,
  getNonPostCandidateReason,
  isNonPostUtilityCandidate,
  normalizeHostname,
  normalizeUrl,
  resolveSourceProfile,
  scoreAnchor,
  summarizeOfficialSyncResults,
  syncAllOfficialSources,
  syncOfficialSource,
};

export default {
  buildCandidateFromAnchor,
  buildLocalSourceEvidence,
  collectCandidatesFromPage,
  dedupeCandidates,
  discoverCandidatesForSource,
  discoverSourceCandidates,
  extractDateFromText,
  extractPortalSpecificCandidates,
  fetchSourceHtml,
  getNonPostCandidateReason,
  isNonPostUtilityCandidate,
  normalizeHostname,
  normalizeUrl,
  resolveSourceProfile,
  scoreAnchor,
  summarizeOfficialSyncResults,
  syncAllOfficialSources,
  syncOfficialSource,
};
