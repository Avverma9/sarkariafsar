import { cache } from "react";
import { getAllGovSchemes, getGovSchemeBySlug } from "./govSchemesApi";
import { assessSchemeContentQuality } from "./contentQuality";
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
  ]);
  const process = toProcessSteps(scheme?.process);
  const documents = toStringArray(scheme?.requiredDocs || scheme?.documents);
  const applyLink = firstNonEmpty([scheme?.applyLink, scheme?.officialLink]);

  const normalized = {
    id: scheme?.id || scheme?._id || "",
    title,
    category,
    state,
    city,
    about,
    process,
    documents,
    applyLink,
    schemeStartDate: formatDate(scheme?.schemeStartDate),
    schemeLastDate: formatDate(scheme?.schemeLastDate) || "",
  };
  const quality = assessSchemeContentQuality(normalized);

  return {
    ...normalized,
    about: quality.about,
    process: quality.process,
    documents: quality.documents,
    schemeLastDate: normalized.schemeLastDate || "N/A",
    quality,
  };
}

export async function loadSchemeDetailPageData(slug) {
  try {
    // Prefer fetching by slug via the dedicated endpoint if available.
    try {
      const payload = await getGovSchemeBySlug(slug);
      const schemes = extractSchemes(payload);
      const matched = schemes.length > 0 ? schemes[0] : payload?.scheme || payload || null;

      if (matched) {
        return {
          scheme: normalizeSchemeDetail(matched),
          canonicalSlug: matched?.slug || buildSchemeSlug(matched),
          error: "",
        };
      }
      // If slug endpoint didn't return a match, fall through to full list fallback.
    } catch (err) {
      // swallow and fallback to getAllGovSchemes
    }

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
      canonicalSlug: matched?.slug || buildSchemeSlug(matched),
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

export const loadCachedSchemeDetailPageData = cache(async (slug) =>
  loadSchemeDetailPageData(slug),
);

// No id-based loader: frontend expects slug-based routing per API spec.
