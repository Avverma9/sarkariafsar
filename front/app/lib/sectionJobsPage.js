import { getSectionsWithJobs } from "./siteApi";
import {
  findSectionByIdentifier,
  mapSectionsWithJobs,
} from "./sections";

const DEFAULT_LIMIT = 24;
const ALLOWED_LIMITS = [12, 24, 36, 48, 60];
export const SECTION_JOBS_DEFAULT_LIMIT = DEFAULT_LIMIT;

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

function getSectionIdentifier({ slug = "", sectionKeys = [], categoryKey = "" } = {}) {
  return String(slug || getFirstValue(sectionKeys) || categoryKey || "").trim();
}

export function parseSectionJobsQuery(searchParams = {}) {
  const rawView = String(getFirstValue(searchParams?.view) || "").toLowerCase();
  const rawLimit = getFirstValue(searchParams?.limit);
  const rawPage = getFirstValue(searchParams?.page);
  const rawQuery = getFirstValue(searchParams?.q);

  const view = rawView === "grid" ? "grid" : "list";
  const requestedLimit = toPositiveInt(rawLimit, DEFAULT_LIMIT);
  const limit = ALLOWED_LIMITS.includes(requestedLimit) ? requestedLimit : DEFAULT_LIMIT;
  const page = toPositiveInt(rawPage, 1);
  const query = normalizeQueryText(rawQuery);

  return { view, limit, page, query };
}

export async function loadSectionJobsPage({
  slug = "",
  sectionKeys = [],
  categoryKey = "",
  title = "",
  description = "",
  view = "list",
  limit = DEFAULT_LIMIT,
  page = 1,
  query = "",
} = {}) {
  try {
    const normalizedQuery = normalizeQueryText(query);
    const sectionIdentifier = getSectionIdentifier({ slug, sectionKeys, categoryKey });
    const payload = await getSectionsWithJobs({
      section: sectionIdentifier,
      sectionLimit: 1,
      jobPage: page,
      jobLimit: limit,
      jobSearch: normalizedQuery,
    });
    const sections = mapSectionsWithJobs(payload?.sections || payload?.data);
    const section = findSectionByIdentifier(sections, {
      slug,
      sectionKeys,
      categoryKey,
    });

    if (!section) {
      return {
        title: title || "Jobs",
        description,
        section: null,
        jobs: [],
        totalPosts: 0,
        totalPages: 1,
        page: 1,
        limit,
        view,
        query,
        error: "Section configuration not found.",
      };
    }

    const resolvedTitle = title || section.name || "Jobs";
    const jobs = Array.isArray(section?.jobs) ? section.jobs : [];
    const totalPosts =
      Number.isFinite(Number(section?.jobsTotal)) ? Number(section.jobsTotal) : jobs.length;
    const totalPages = Math.max(
      1,
      Number.isFinite(Number(section?.jobsTotalPages))
        ? Number(section.jobsTotalPages)
        : Math.ceil(Math.max(totalPosts, 1) / limit),
    );
    const safePage = Math.min(
      Math.max(Number(section?.jobsPage) || page || 1, 1),
      totalPages,
    );
    const safeLimit = Number(section?.jobsLimit) > 0 ? Number(section.jobsLimit) : limit;

    return {
      title: resolvedTitle,
      description,
      section,
      jobs,
      totalPosts,
      totalPages,
      page: safePage,
      limit: safeLimit,
      view,
      query: normalizedQuery,
      error: "",
    };
  } catch (error) {
    return {
      title: title || "Jobs",
      description,
      section: null,
      jobs: [],
      totalPosts: 0,
      totalPages: 1,
      page: 1,
      limit,
      view,
      query: normalizeQueryText(query),
      error: error?.message || "Unable to load jobs.",
    };
  }
}
