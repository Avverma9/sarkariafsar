export const HIGH_CACHE_TTL_SECONDS = 60 * 60;

export const CACHE_TAGS = {
  APP: "app-data",
  SITE_API: "site-api",
  JOB_LISTS: "job-lists",
  JOB_SECTIONS: "job-sections",
  SECTION_JOBS: "section-jobs",
  GOV_SCHEMES: "gov-schemes",
  GOV_SCHEME_STATES: "gov-scheme-states",
  POST_DETAILS: "post-details",
};

export const ALL_CACHE_TAGS = Object.values(CACHE_TAGS);

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const text = String(value || "").trim();

    if (!text || seen.has(text)) {
      return;
    }

    seen.add(text);
    result.push(text);
  });

  return result;
}

export function buildNextCacheConfig({
  tags = [],
  revalidate = HIGH_CACHE_TTL_SECONDS,
  next = {},
} = {}) {
  const inputTags = Array.isArray(next?.tags) ? next.tags : [];
  const mergedTags = uniqueStrings([...inputTags, CACHE_TAGS.APP, ...tags]);
  const safeRevalidate = Number.isFinite(Number(revalidate))
    ? Number(revalidate)
    : HIGH_CACHE_TTL_SECONDS;

  return {
    ...next,
    revalidate: safeRevalidate,
    tags: mergedTags,
  };
}
