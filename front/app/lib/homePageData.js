import { getJobReminders, getSectionsWithJobs } from "./siteApi";
import { getGovSchemesList } from "./govSchemesApi";
import { assessSchemeContentQuality, createExcerpt } from "./contentQuality";
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
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const visual = getSchemeVisual(category);
  const quality = assessSchemeContentQuality({
    title,
    category,
    state,
    about: aboutScheme,
    process,
    documents,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
    schemeStartDate: scheme?.schemeStartDate,
    schemeLastDate: scheme?.schemeLastDate,
  });
  return {
    id: scheme?.id || scheme?._id || `scheme-${index + 1}`,
    type: "scheme",
    title: quality.title || title,
    category,
    state,
    shortDesc: quality.summary || createExcerpt(aboutScheme, 180),
    benefits: quality.about,
    process: quality.process,
    documents: quality.documents,
    icon: visual.icon,
    iconColor: visual.iconColor,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
    indexable: quality.cardIndexable,
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
  const [sectionsResult, schemesResult, remindersResult] =
    await Promise.allSettled([
      getSectionsWithJobs({ sectionLimit: 20, jobLimit: 10 }),
      getGovSchemesList({ limit: 6 }),
      getJobReminders({ days: 7 }),
    ]);

  const rawSectionsPayload =
    sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
  const sections = mapSectionsWithJobs(rawSectionsPayload?.sections || rawSectionsPayload?.data);

  const rawSchemesPayload =
    schemesResult.status === "fulfilled" ? schemesResult.value : null;
  const schemes = rawSchemesPayload
    ? extractSchemes(rawSchemesPayload)
        .map((s, i) => normalizeScheme(s, i))
        .filter((scheme) => scheme.indexable)
    : [];
  const rawRemindersPayload =
    remindersResult.status === "fulfilled" ? remindersResult.value : null;
  const reminderJobs = rawRemindersPayload ? asArray(rawRemindersPayload?.jobs) : [];

  return {
    sectionBlocks: sections,
    jobsBySection: buildJobsBySection(sections),
    schemes,
    reminderDays: 7,
    reminderJobs,
    reminderTotal: rawRemindersPayload ? Number(rawRemindersPayload?.total) || reminderJobs.length : 0,
    reminderLoaded: remindersResult.status === "fulfilled",
  };
}
