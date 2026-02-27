import { getAllGovSchemes } from "./govSchemesApi";
import { buildSchemeSlug, isSchemeSlugMatch } from "./schemeSlug";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const text = String(value || "").trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function normalizeStateName(value) {
  const state = String(value || "").trim();
  return state || "All India";
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  return text
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toProcessSteps(value) {
  if (Array.isArray(value)) {
    return value
      .map((step) => String(step || "").trim())
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  const numberedSplit = text
    .split(/\s+\d+\.\s+/)
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  return numberedSplit.length > 0 ? numberedSplit : [text];
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractSchemes(payload) {
  if (Array.isArray(payload?.schemes)) {
    return payload.schemes;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return asArray(payload);
}

function normalizeSchemeDetail(scheme) {
  const title = firstNonEmpty([
    scheme?.schemeTitle,
    scheme?.title,
    scheme?.schemeName,
    "Government Scheme",
  ]);
  const category = firstNonEmpty([
    scheme?.schemetype,
    scheme?.schemeType,
    scheme?.category,
    "Government Scheme",
  ]);
  const state = normalizeStateName(firstNonEmpty([scheme?.state, scheme?.stateName]));
  const city = firstNonEmpty([scheme?.city, "All"]);
  const about = firstNonEmpty([
    scheme?.aboutScheme,
    scheme?.description,
    scheme?.shortDesc,
    scheme?.benefits,
    "Scheme details available in official source.",
  ]);
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const applyLink = firstNonEmpty([scheme?.applyLink, scheme?.officialLink]);

  return {
    id: scheme?.id || scheme?._id || "",
    title,
    category,
    state,
    city,
    about,
    process:
      process.length > 0
        ? process
        : ["Official source par jakar scheme ki poori process check karein."],
    documents:
      documents.length > 0 ? documents : ["Aadhar Card", "Bank Account Details"],
    applyLink,
    schemeStartDate: formatDate(scheme?.schemeStartDate),
    schemeLastDate: formatDate(scheme?.schemeLastDate) || "N/A",
  };
}

export async function loadSchemeDetailPageData(slug) {
  try {
    const payload = await getAllGovSchemes();
    const schemes = extractSchemes(payload);
    const matched = schemes.find((scheme) => isSchemeSlugMatch(slug, scheme));

    if (!matched) {
      return {
        scheme: null,
        canonicalSlug: "",
        error: "Scheme not found",
      };
    }

    return {
      scheme: normalizeSchemeDetail(matched),
      canonicalSlug: buildSchemeSlug(matched),
      error: "",
    };
  } catch (error) {
    return {
      scheme: null,
      canonicalSlug: "",
      error: error?.message || "Unable to load scheme details",
    };
  }
}
