function normalizePostSectionSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const POST_SECTION_CONFIGS = [
  {
    canonicalSlug: "latest-gov-jobs",
    matchSlugs: ["latest-gov-jobs", "latest-jobs", "new-jobs", "jobs"],
    sectionKeys: ["new_jobs", "newjob", "latest_job", "latestjobs"],
    title: "Latest Jobs",
    description: "All available job updates from configured section data.",
  },
  {
    canonicalSlug: "results",
    matchSlugs: ["results", "result"],
    sectionKeys: ["results", "result", "exam_result", "latest_result"],
    title: "Latest Results",
    description: "All result and answer-key related updates from configured section data.",
  },
  {
    canonicalSlug: "recent-admit-cards",
    matchSlugs: ["recent-admit-cards", "admit-cards", "admit-card"],
    sectionKeys: ["admit_card", "admitcard", "admit_cards"],
    title: "Admit Cards",
    description: "All admit card updates from configured section data.",
  },
  {
    canonicalSlug: "admission",
    matchSlugs: ["admission", "admissions"],
    sectionKeys: ["admission", "admissions"],
    title: "Latest Admissions",
    description: "All admission-related updates from configured section data.",
  },
];

export function getPostSectionConfig(sectionSlug) {
  const normalizedSlug = normalizePostSectionSlug(sectionSlug);

  return (
    POST_SECTION_CONFIGS.find((config) =>
      config.matchSlugs.some(
        (candidateSlug) =>
          normalizePostSectionSlug(candidateSlug) === normalizedSlug,
      ),
    ) || null
  );
}

export function getPostSectionCanonicalPath(config) {
  if (!config) {
    return "/post";
  }

  return `/post/${config.canonicalSlug}`;
}
