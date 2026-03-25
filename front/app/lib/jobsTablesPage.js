import { getSectionsWithJobs } from "./siteApi";
import { mapSectionsWithJobs } from "./sections";

const INITIAL_TABLE_LIMIT = 20;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function createSectionCard(section, limit) {
  const items = asArray(section?.jobs).slice(0, limit);
  const totalPosts =
    Number.isFinite(Number(section?.jobsTotal))
      ? Number(section.jobsTotal)
      : asArray(section?.jobs).length;

  return {
    id: section?.id || section?.slug || "section",
    name: section?.name || "Section",
    href: section?.href || "/post",
    categoryKey: section?.categoryKey || "latest-jobs",
    totalPosts,
    shownCount: items.length,
    items,
  };
}

export async function loadJobsTablesPage({ limit = INITIAL_TABLE_LIMIT } = {}) {
  try {
    const payload = await getSectionsWithJobs({
      sectionLimit: 20,
      jobLimit: limit,
    });

    const sections = mapSectionsWithJobs(payload?.sections || payload?.data);
    const cards = sections.map((section) => createSectionCard(section, limit));

    return {
      limit,
      cards,
      error: "",
    };
  } catch (error) {
    return {
      limit,
      cards: [],
      error: error?.message || "Failed to load jobs tables.",
    };
  }
}
