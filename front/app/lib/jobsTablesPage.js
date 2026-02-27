import { getJobSections, getStoredJobLists } from "./siteApi";

const INITIAL_TABLE_LIMIT = 20;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function toSectionType(value) {
  const normalized = normalizeToken(value);

  if (
    [
      "latestjob",
      "latestjobs",
      "newjob",
      "newjobs",
      "new_jobs",
      "latest_form",
      "toponlineform",
      "hotjob",
    ].includes(normalized)
  ) {
    return "newjobs";
  }

  if (
    [
      "result",
      "results",
      "examresult",
      "latestresult",
      "answerkey",
      "answerkeys",
    ].includes(normalized)
  ) {
    return "results";
  }

  if (["admitcard", "admitcards", "admit_cards"].includes(normalized)) {
    return "admitcards";
  }

  if (["admission", "admissions"].includes(normalized)) {
    return "admission";
  }

  return normalized;
}

function buildStoredJobListLookup(jobLists) {
  return asArray(jobLists).reduce((lookup, list) => {
    const postList = asArray(list?.postList);

    if (postList.length === 0) {
      return lookup;
    }

    const keys = [
      list?.section,
      list?.sectionName,
      toSectionType(list?.section),
      toSectionType(list?.sectionName),
    ]
      .map(normalizeToken)
      .filter(Boolean);

    keys.forEach((key) => {
      if (!lookup[key]) {
        lookup[key] = postList;
      }
    });

    return lookup;
  }, {});
}

function getPostsForSection(section, lookup) {
  const keys = [
    section?.key,
    section?.name,
    toSectionType(section?.key),
    toSectionType(section?.name),
  ]
    .map(normalizeToken)
    .filter(Boolean);

  for (const key of keys) {
    if (lookup[key]) {
      return asArray(lookup[key]);
    }
  }

  return [];
}

function dedupeSections(sections) {
  const seen = new Set();
  const result = [];

  asArray(sections).forEach((section, index) => {
    const primary = normalizeToken(section?.key || section?.name || `section-${index + 1}`);

    if (!primary || seen.has(primary)) {
      return;
    }

    seen.add(primary);
    result.push(section);
  });

  return result;
}

function createSectionCard(section, posts, limit) {
  const type = toSectionType(section?.key || section?.name);
  const slicedPosts = asArray(posts).slice(0, limit);
  const totalPosts = asArray(posts).length;

  return {
    id: section?.id || section?.key || section?.name || type || "section",
    name: section?.name || section?.key || "Section",
    type,
    totalPosts,
    shownCount: slicedPosts.length,
    items: slicedPosts.map((post, index) => ({
      id: post?.jobUrlHash || `${section?.key || "post"}-${index + 1}`,
      title: post?.title || "Untitled Job",
      jobUrl: post?.jobUrl || "",
      sourceSectionUrl: post?.sourceSectionUrl || "",
    })),
  };
}

export async function loadJobsTablesPage({ limit = INITIAL_TABLE_LIMIT } = {}) {
  try {
    const [sectionsPayload, storedListsPayload] = await Promise.all([
      getJobSections(),
      getStoredJobLists(),
    ]);

    const sections = dedupeSections(sectionsPayload?.sections);
    const lookup = buildStoredJobListLookup(storedListsPayload?.jobLists);
    const cards = sections
      .map((section) => createSectionCard(section, getPostsForSection(section, lookup), limit))
      .filter((card) => card.name);

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
