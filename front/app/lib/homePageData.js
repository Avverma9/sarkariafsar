import { getJobReminders, getSectionsWithJobs } from "./siteApi";
import {
  getAllGovSchemes,
  getGovSchemeStateNameOnly,
} from "./govSchemesApi";
import { mapSectionsWithJobs } from "./sections";

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

function buildJobsBySection(sections = []) {
  return asArray(sections).reduce((result, section) => {
    result[section.id] = asArray(section.jobs);
    return result;
  }, {});
}

/**
 * Fetch all data needed for the home page on the server.
 * Returns a plain-serializable object safe to pass as props.
 */
export async function loadHomePageData() {
  const [sectionsResult, statesResult, schemesResult, remindersResult] =
    await Promise.allSettled([
      getSectionsWithJobs({ sectionLimit: 20, jobLimit: 10 }),
      getGovSchemeStateNameOnly(),
      getAllGovSchemes(),
      getJobReminders({ days: 7 }),
    ]);

  const rawSectionsPayload =
    sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
  const sections = mapSectionsWithJobs(rawSectionsPayload?.sections);

  const rawStatesPayload =
    statesResult.status === "fulfilled" ? statesResult.value : null;
  const apiStates = rawStatesPayload ? extractStateNames(rawStatesPayload) : [];
  const statesList = uniqueStrings(["All India", ...apiStates]);

  const rawSchemesPayload =
    schemesResult.status === "fulfilled" ? schemesResult.value : null;
  const schemes = rawSchemesPayload
    ? extractSchemes(rawSchemesPayload).map((s, i) => normalizeScheme(s, i))
    : [];
  const rawRemindersPayload =
    remindersResult.status === "fulfilled" ? remindersResult.value : null;
  const reminderJobs = rawRemindersPayload ? asArray(rawRemindersPayload?.jobs) : [];

  return {
    sectionBlocks: sections,
    jobsBySection: buildJobsBySection(sections),
    statesList: statesList.length > 1 ? statesList : [],
    schemes,
    reminderDays: 7,
    reminderJobs,
    reminderTotal: rawRemindersPayload ? Number(rawRemindersPayload?.total) || reminderJobs.length : 0,
    reminderLoaded: remindersResult.status === "fulfilled",
  };
}
