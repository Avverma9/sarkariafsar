import { getSectionsWithJobs } from "./siteApi";
import {
  findSectionByIdentifier,
  mapSectionsWithJobs,
} from "./sections";

const DEFAULT_LIMIT = 24;
const ALLOWED_LIMITS = [12, 24, 36, 48, 60];
const MAX_SECTION_JOB_LIMIT = 100;

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

function filterJobsByQuery(jobs, query) {
  const normalizedQuery = normalizeQueryText(query).toLowerCase();

  if (!normalizedQuery) {
    return Array.isArray(jobs) ? jobs : [];
  }

  return (Array.isArray(jobs) ? jobs : []).filter((job) =>
    String(job?.title || "")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function getRequestedJobLimit({ limit, page, query }) {
  if (normalizeQueryText(query)) {
    return MAX_SECTION_JOB_LIMIT;
  }

  return Math.min(MAX_SECTION_JOB_LIMIT, Math.max(limit, page * limit));
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
    const payload = await getSectionsWithJobs({
      sectionLimit: 20,
      jobLimit: getRequestedJobLimit({ limit, page, query }),
    });
    const sections = mapSectionsWithJobs(payload?.sections);
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
    const filteredJobs = filterJobsByQuery(section.jobs, query);
    const totalPosts = filteredJobs.length;
    const totalPages = Math.max(1, Math.ceil(totalPosts / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;
    const jobs = filteredJobs.slice(start, start + limit);

    return {
      title: resolvedTitle,
      description,
      section,
      jobs,
      totalPosts,
      totalPages,
      page: safePage,
      limit,
      view,
      query: normalizeQueryText(query),
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
