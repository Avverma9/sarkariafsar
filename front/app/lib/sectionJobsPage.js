import { getJobSections, getSectionJobsByUrls } from "./siteApi";

const DEFAULT_LIMIT = 24;
const ALLOWED_LIMITS = [12, 24, 36, 48, 60];
const MAX_API_PAGES = 30;

function getFirstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeQueryText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

function findSectionByKeys(sections, sectionKeys) {
  const desired = new Set((sectionKeys || []).map(normalizeToken).filter(Boolean));

  if (desired.size === 0) {
    return null;
  }

  return (Array.isArray(sections) ? sections : []).find((section) => {
    const candidates = [
      section?.key,
      section?.name,
      ...(Array.isArray(section?.aliases) ? section.aliases : []),
    ]
      .map(normalizeToken)
      .filter(Boolean);

    return candidates.some((candidate) => desired.has(candidate));
  });
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

function dedupeJobs(jobs) {
  const seen = new Set();
  const result = [];

  (Array.isArray(jobs) ? jobs : []).forEach((job, index) => {
    const key = String(job?.jobUrl || job?.title || index);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(job);
  });

  return result;
}

function getTotalFromPayload(payload, fallback) {
  const parsed = Number.parseInt(String(payload?.db?.totalPosts || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchSectionJobsPage(sectionUrls, { limit, page }) {
  const payload = await getSectionJobsByUrls({
    sectionUrls: Array.isArray(sectionUrls) ? sectionUrls : [],
    limit,
    page,
  });
  const jobs = dedupeJobs(payload?.jobs);
  const total = getTotalFromPayload(payload, jobs.length);

  return {
    jobs,
    total,
  };
}

async function fetchAllSectionJobs(sectionUrls, { limit }) {
  const allJobs = [];
  let total = 0;

  for (let page = 1; page <= MAX_API_PAGES; page += 1) {
    const payload = await fetchSectionJobsPage(sectionUrls, { limit, page });
    allJobs.push(...payload.jobs);
    total = Math.max(total, payload.total);

    if (payload.jobs.length < limit) {
      break;
    }

    if (total > 0 && allJobs.length >= total) {
      break;
    }
  }

  return dedupeJobs(allJobs);
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
  sectionKeys = [],
  title = "Jobs",
  description = "",
  view = "list",
  limit = DEFAULT_LIMIT,
  page = 1,
  query = "",
} = {}) {
  try {
    const sectionsPayload = await getJobSections();
    const sections = Array.isArray(sectionsPayload?.sections)
      ? sectionsPayload.sections
      : [];
    const section = findSectionByKeys(sections, sectionKeys);

    if (!section) {
      return {
        title,
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

    const sectionUrls = Array.isArray(section?.urls) ? section.urls : [];

    if (normalizeQueryText(query)) {
      const allJobs = await fetchAllSectionJobs(sectionUrls, { limit });
      const filteredJobs = filterJobsByQuery(allJobs, query);
      const totalPosts = filteredJobs.length;
      const totalPages = Math.max(1, Math.ceil(totalPosts / limit));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const start = (safePage - 1) * limit;
      const jobs = filteredJobs.slice(start, start + limit);

      return {
        title,
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
    }

    let safePage = Math.max(page, 1);
    let payload = await fetchSectionJobsPage(sectionUrls, { limit, page: safePage });
    let totalPosts = payload.total;
    let totalPages = Math.max(1, Math.ceil(totalPosts / limit));

    if (safePage > totalPages) {
      safePage = totalPages;
      payload = await fetchSectionJobsPage(sectionUrls, { limit, page: safePage });
      totalPosts = payload.total;
      totalPages = Math.max(1, Math.ceil(totalPosts / limit));
    }

    return {
      title,
      description,
      section,
      jobs: payload.jobs,
      totalPosts,
      totalPages,
      page: safePage,
      limit,
      view,
      query: "",
      error: "",
    };
  } catch (error) {
    return {
      title,
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
