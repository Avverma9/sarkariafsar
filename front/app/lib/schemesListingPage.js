import {
  getAllGovSchemes,
  getGovSchemeByState,
  getGovSchemeStateNameOnly,
} from "./govSchemesApi";
import { buildSchemeSlug } from "./schemeSlug";

const DEFAULT_LIMIT = 12;
const ALLOWED_LIMITS = [12, 24, 36, 48, 60];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getFirstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeQueryText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 120);
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

    if (!text || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(text);
  });

  return result;
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
  if (Array.isArray(payload?.schemes)) {
    return payload.schemes;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return asArray(payload);
}

function normalizeSchemeCard(scheme, index, selectedState) {
  const title = firstNonEmpty([
    scheme?.schemeTitle,
    scheme?.title,
    scheme?.schemeName,
    `Scheme ${index + 1}`,
  ]);
  const category = firstNonEmpty([
    scheme?.schemetype,
    scheme?.schemeType,
    scheme?.category,
    "Government Scheme",
  ]);
  const state = firstNonEmpty([
    normalizeStateName(scheme?.state),
    normalizeStateName(scheme?.stateName),
    normalizeStateName(selectedState),
    "All India",
  ]);
  const about = firstNonEmpty([
    scheme?.aboutScheme,
    scheme?.description,
    scheme?.shortDesc,
    scheme?.benefits,
    "Scheme details available in official source.",
  ]);

  return {
    id: scheme?.id || scheme?._id || `scheme-${index + 1}`,
    title,
    category,
    state,
    about,
    applyLink: firstNonEmpty([scheme?.applyLink, scheme?.officialLink]),
    slug: buildSchemeSlug(scheme),
  };
}

function filterSchemesByQuery(items, query) {
  const normalized = normalizeQueryText(query).toLowerCase();

  if (!normalized) {
    return asArray(items);
  }

  return asArray(items).filter((item) => {
    const haystack = `${item?.title || ""} ${item?.category || ""} ${item?.state || ""}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function parseSchemesListingQuery(searchParams = {}) {
  const rawView = String(getFirstValue(searchParams?.view) || "").toLowerCase();
  const rawLimit = getFirstValue(searchParams?.limit);
  const rawPage = getFirstValue(searchParams?.page);
  const rawQuery = getFirstValue(searchParams?.q);
  const rawState = normalizeStateName(getFirstValue(searchParams?.state));

  const requestedLimit = toPositiveInt(rawLimit, DEFAULT_LIMIT);
  const limit = ALLOWED_LIMITS.includes(requestedLimit) ? requestedLimit : DEFAULT_LIMIT;

  return {
    view: rawView === "grid" ? "grid" : "list",
    limit,
    page: toPositiveInt(rawPage, 1),
    query: normalizeQueryText(rawQuery),
    state: rawState || "All India",
  };
}

export async function loadSchemesListingPage({
  view = "list",
  limit = DEFAULT_LIMIT,
  page = 1,
  query = "",
  state = "All India",
} = {}) {
  try {
    const statesPayload = await getGovSchemeStateNameOnly();
    const stateOptions = uniqueStrings(["All India", ...extractStateNames(statesPayload)]);
    const selectedState = stateOptions.includes(state) ? state : "All India";

    const schemesPayload =
      selectedState === "All India"
        ? await getAllGovSchemes()
        : await getGovSchemeByState(selectedState);

    const cards = extractSchemes(schemesPayload).map((scheme, index) =>
      normalizeSchemeCard(scheme, index, selectedState),
    );
    const filtered = filterSchemesByQuery(cards, query);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;

    return {
      title: "Sarkari Yojna Listing",
      description: "Central and State government schemes with latest updates and details.",
      items: filtered.slice(start, start + limit),
      stateOptions,
      selectedState,
      query: normalizeQueryText(query),
      view,
      page: safePage,
      limit,
      totalItems,
      totalPages,
      error: "",
    };
  } catch (error) {
    return {
      title: "Sarkari Yojna Listing",
      description: "Central and State government schemes with latest updates and details.",
      items: [],
      stateOptions: ["All India"],
      selectedState: "All India",
      query: normalizeQueryText(query),
      view,
      page: 1,
      limit,
      totalItems: 0,
      totalPages: 1,
      error: error?.message || "Unable to load schemes.",
    };
  }
}
