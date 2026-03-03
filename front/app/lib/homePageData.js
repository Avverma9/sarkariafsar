import { getJobSections, getStoredJobLists } from "./siteApi";
import {
  getAllGovSchemes,
  getGovSchemeStateNameOnly,
} from "./govSchemesApi";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeStateName(value) {
  const state = String(value || "").trim();
  if (!state || state.toLowerCase() === "sabhi" || state.toLowerCase() === "all") {
    return "All India";
  }
  return state;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const text = String(value || "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    result.push(text);
  });
  return result;
}

function extractStateNames(payload) {
  const candidates = asArray(payload?.states).length
    ? payload.states
    : asArray(payload?.data).length
      ? payload.data
      : asArray(payload);
  const names = candidates
    .map((item) =>
      typeof item === "string"
        ? item
        : firstNonEmpty([item?.state, item?.stateName, item?.name, item?.title]),
    )
    .map(normalizeStateName)
    .filter((name) => name && name !== "All India");
  return uniqueStrings(names);
}

function extractSchemes(payload) {
  if (Array.isArray(payload?.schemes)) return payload.schemes;
  if (Array.isArray(payload?.data)) return payload.data;
  return asArray(payload);
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  const text = String(value || "").trim();
  if (!text) return [];
  return text.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
}

function toProcessSteps(value) {
  if (Array.isArray(value)) {
    return value.map((step) => String(step || "").trim()).filter(Boolean);
  }
  const text = String(value || "").trim();
  if (!text) return [];
  const lines = text.split(/\n+/).map((line) => line.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const numbered = text.split(/\s+\d+\.\s+/).map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  return numbered.length > 0 ? numbered : [text];
}

function getSchemeVisual(schemeType) {
  const normalized = String(schemeType || "").toLowerCase();
  if (normalized.includes("health") || normalized.includes("medical") || normalized.includes("water")) {
    return { icon: "ShieldCheck", iconColor: "text-sky-500" };
  }
  if (normalized.includes("education") || normalized.includes("student")) {
    return { icon: "GraduationCap", iconColor: "text-indigo-500" };
  }
  if (normalized.includes("social") || normalized.includes("women") || normalized.includes("labour") || normalized.includes("welfare")) {
    return { icon: "Users", iconColor: "text-purple-500" };
  }
  if (normalized.includes("agriculture") || normalized.includes("farmer") || normalized.includes("animal")) {
    return { icon: "HeartPulse", iconColor: "text-rose-500" };
  }
  return { icon: "Landmark", iconColor: "text-emerald-600" };
}

function normalizeScheme(scheme, index) {
  const title = firstNonEmpty([scheme?.schemeTitle, scheme?.title, scheme?.schemeName, `Scheme ${index + 1}`]);
  const category = firstNonEmpty([scheme?.schemetype, scheme?.schemeType, scheme?.category, "Government Scheme"]);
  const state = firstNonEmpty([normalizeStateName(scheme?.state), normalizeStateName(scheme?.stateName), "All India"]);
  const aboutScheme = firstNonEmpty([scheme?.aboutScheme, scheme?.description, scheme?.shortDesc, scheme?.benefits]);
  const shortDesc = aboutScheme.slice(0, 180);
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const visual = getSchemeVisual(category);
  return {
    id: scheme?.id || scheme?._id || `scheme-${index + 1}`,
    type: "scheme",
    title,
    category,
    state,
    shortDesc: shortDesc || "Yojana details available in official source.",
    benefits: aboutScheme || "Yojana details available in official source.",
    process: process.length > 0 ? process : ["Official source par jakar scheme ki poori process check karein."],
    documents: documents.length > 0 ? documents : ["Aadhar Card", "Bank Account Details"],
    icon: visual.icon,
    iconColor: visual.iconColor,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
  };
}

function normalizeCategory(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toCanonicalCategory(value) {
  const n = normalizeCategory(value);
  if (["latestjob", "latestjobs", "newjob", "newjobs", "new_jobs", "latest_form", "toponlineform", "hotjob"].includes(n)) return "latest-jobs";
  if (["result", "results", "examresult", "latestresult", "answerkey", "answerkeys"].includes(n)) return "results";
  if (["admitcard", "admitcards"].includes(n)) return "admit-cards";
  if (["admission", "admissions"].includes(n)) return "admissions";
  return n;
}

function getThemeByCategory(category) {
  if (category === "latest-jobs") return { icon: "Briefcase", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (category === "results") return { icon: "CheckCircle", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  if (category === "admit-cards") return { icon: "FileText", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
  if (category === "admissions") return { icon: "GraduationCap", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
  return { icon: "FileText", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
}

function mapSectionsToBlocks(sections) {
  return asArray(sections).map((section, index) => {
    const source = section || {};
    const canonical = toCanonicalCategory(source.key || source.name);
    const theme = getThemeByCategory(canonical);
    return {
      id: source.id || source.key || `section-${index + 1}`,
      key: source.key,
      title: source.name || source.key || `Section ${index + 1}`,
      categoryKey: canonical,
      ...theme,
    };
  });
}

function buildStoredJobListLookup(jobLists) {
  return asArray(jobLists).reduce((lookup, jobList) => {
    const source = jobList || {};
    const keys = [
      source.section,
      source.sectionName,
      toCanonicalCategory(source.section),
      toCanonicalCategory(source.sectionName),
    ].filter(Boolean);
    keys.forEach((key) => {
      lookup[String(key).toLowerCase()] = asArray(source.postList);
    });
    return lookup;
  }, {});
}

function getStoredJobsForBlock(block, jobLookup) {
  const canonical = toCanonicalCategory(block?.categoryKey || block?.key || block?.title);
  const candidates = [
    block?.key,
    block?.title,
    canonical,
    canonical === "latest-jobs" ? "new_jobs" : "",
    canonical === "admit-cards" ? "admit_cards" : "",
  ].filter(Boolean).map((v) => String(v).toLowerCase());
  for (const c of candidates) {
    if (c in jobLookup) return asArray(jobLookup[c]);
  }
  return [];
}

function buildCanonicalKeyForJob(job) {
  const title = String(job?.title || "").trim();
  const url = String(job?.jobUrl || "").trim();
  if (!title && !url) return "";
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (!url) return slug;
  try {
    const parsed = new URL(url);
    const hash = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return slug ? `${slug}-${hash.slice(0, 8)}` : hash;
  } catch {
    return slug;
  }
}

function mapStoredJobsToItems(jobs, block) {
  return asArray(jobs).map((job, index) => {
    const canonicalId = job?.jobUrlHash || buildCanonicalKeyForJob(job) || `job-${index + 1}`;
    return {
      id: `${block.id}-${canonicalId}`,
      title: job?.title || "Untitled Job",
      jobUrl: job?.jobUrl || "",
      fetchedAt: job?.fetchedAt || "",
      lastDate: "LIVE UPDATE",
      _fromApi: true,
    };
  });
}

/**
 * Fetch all data needed for the home page on the server.
 * Returns a plain-serializable object safe to pass as props.
 */
export async function loadHomePageData() {
  const [sectionsResult, jobListsResult, statesResult, schemesResult] =
    await Promise.allSettled([
      getJobSections(),
      getStoredJobLists(),
      getGovSchemeStateNameOnly(),
      getAllGovSchemes(),
    ]);

  // --- Sections + Jobs ---
  const sectionsPayload =
    sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
  const jobListsPayload =
    jobListsResult.status === "fulfilled" ? jobListsResult.value : null;

  const mappedBlocks = mapSectionsToBlocks(sectionsPayload?.sections);
  const blocks = mappedBlocks.length > 0 ? mappedBlocks : [];

  const jobLists = asArray(jobListsPayload?.jobLists);
  const jobLookup = buildStoredJobListLookup(jobLists);
  const jobsBySection = blocks.reduce((result, block) => {
    result[block.id] = mapStoredJobsToItems(
      getStoredJobsForBlock(block, jobLookup),
      block,
    );
    return result;
  }, {});

  // --- States ---
  const rawStatesPayload =
    statesResult.status === "fulfilled" ? statesResult.value : null;
  const apiStates = rawStatesPayload ? extractStateNames(rawStatesPayload) : [];
  const statesList = uniqueStrings(["All India", ...apiStates]);

  // --- Schemes ---
  const rawSchemesPayload =
    schemesResult.status === "fulfilled" ? schemesResult.value : null;
  const schemes = rawSchemesPayload
    ? extractSchemes(rawSchemesPayload).map((s, i) => normalizeScheme(s, i))
    : [];

  return {
    sectionBlocks: blocks,
    jobsBySection,
    statesList: statesList.length > 1 ? statesList : [],
    schemes,
  };
}
