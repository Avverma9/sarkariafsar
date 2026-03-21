function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function slugify(value, fallback = "section") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export function toSectionCategory(value) {
  const normalized = normalizeToken(value);

  if (
    [
      "latestjob",
      "latestjobs",
      "latestgovjob",
      "latestgovjobs",
      "newjob",
      "newjobs",
      "new_jobs",
      "govjob",
      "govjobs",
      "job",
      "jobs",
      "latest_form",
      "toponlineform",
      "hotjob",
    ].includes(normalized)
  ) {
    return "latest-jobs";
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

  if (
    [
      "admitcard",
      "admitcards",
      "recentadmitcard",
      "recentadmitcards",
    ].includes(normalized)
  ) {
    return "admit-cards";
  }

  if (["admission", "admissions"].includes(normalized)) {
    return "admissions";
  }

  return slugify(value, "section");
}

export function getThemeByCategory(category) {
  if (category === "latest-jobs") {
    return {
      icon: "Briefcase",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }

  if (category === "results") {
    return {
      icon: "CheckCircle",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    };
  }

  if (category === "admit-cards") {
    return {
      icon: "FileText",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    };
  }

  if (category === "admissions") {
    return {
      icon: "GraduationCap",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    };
  }

  return {
    icon: "FileText",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  };
}

export function normalizeSection(section, index = 0) {
  const source = section || {};
  const slug = slugify(
    source.sectionCanonicalUrl ||
      source.canonicalUrl ||
      source.slug ||
      source.key ||
      source.sectionName ||
      source.name,
    `section-${index + 1}`,
  );
  const title = String(
    source.sectionName || source.name || source.title || source.key || `Section ${index + 1}`,
  ).trim();
  const categoryKey = toSectionCategory(
    source.sectionCanonicalUrl ||
      source.canonicalUrl ||
      source.key ||
      source.sectionName ||
      source.name ||
      slug,
  );
  const theme = getThemeByCategory(categoryKey);

  return {
    ...source,
    id: source.id || source._id || source.key || slug,
    key: source.key || source.sectionCanonicalUrl || source.canonicalUrl || slug,
    name: title,
    title,
    canonicalUrl: slug,
    slug,
    categoryKey,
    href: `/post/${slug}`,
    ...theme,
  };
}

export function mapSectionsToBlocks(sections) {
  return asArray(sections).map((section, index) => normalizeSection(section, index));
}

export function normalizeSectionJob(job, index = 0) {
  const source = job || {};
  const title = String(source.title || source.jobtitle || `Job ${index + 1}`).trim();
  const slug = slugify(source.slug || title, `job-${index + 1}`);

  return {
    ...source,
    id: source.id || source._id || source.slug || slug,
    title,
    slug,
    status: String(source.status || "").trim(),
    applyLastDate: source.applyLastDate || null,
    jobUrl: String(source.jobUrl || "").trim(),
    _fromApi: true,
  };
}

export function normalizeSectionWithJobs(section, index = 0) {
  const normalized = normalizeSection(section, index);
  const jobs = asArray(section?.jobs).map((job, jobIndex) =>
    normalizeSectionJob(job, jobIndex),
  );

  return {
    ...normalized,
    jobs,
    totalJobs: jobs.length,
  };
}

export function mapSectionsWithJobs(sections) {
  return asArray(sections).map((section, index) => normalizeSectionWithJobs(section, index));
}

export function buildSectionAliases(section) {
  const normalized = normalizeSection(section);
  const aliases = new Set();

  [
    normalized.id,
    normalized.key,
    normalized.name,
    normalized.title,
    normalized.slug,
    normalized.canonicalUrl,
    normalized.categoryKey,
    ...(asArray(normalized.aliases)),
  ].forEach((value) => {
    const token = normalizeToken(value);
    if (token) {
      aliases.add(token);
    }
  });

  return Array.from(aliases);
}

export function findSectionByIdentifier(
  sections,
  { slug = "", sectionKeys = [], categoryKey = "" } = {},
) {
  const desired = new Set(
    [slug, categoryKey, ...asArray(sectionKeys)].map(normalizeToken).filter(Boolean),
  );

  if (desired.size === 0) {
    return null;
  }

  for (const [index, section] of asArray(sections).entries()) {
    const normalized = Array.isArray(section?.jobs)
      ? normalizeSectionWithJobs(section, index)
      : normalizeSection(section, index);
    const aliases = buildSectionAliases(normalized);

    if (aliases.some((alias) => desired.has(alias))) {
      return normalized;
    }
  }

  return null;
}

export function dedupeSections(sections) {
  const seen = new Set();
  const result = [];

  asArray(sections).forEach((section, index) => {
    const normalized = normalizeSection(section, index);
    const key = normalizeToken(normalized.slug || normalized.id);

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalized);
  });

  return result;
}

export function buildStoredJobListLookup(jobLists) {
  return asArray(jobLists).reduce((lookup, list) => {
    const postList = asArray(list?.postList);

    if (postList.length === 0) {
      return lookup;
    }

    [
      list?.section,
      list?.sectionName,
      list?.canonicalUrl,
      toSectionCategory(list?.section),
      toSectionCategory(list?.sectionName),
    ]
      .map(normalizeToken)
      .filter(Boolean)
      .forEach((key) => {
        if (!lookup[key]) {
          lookup[key] = postList;
        }
      });

    return lookup;
  }, {});
}

export function getStoredJobsForSection(section, lookup) {
  const aliases = buildSectionAliases(section);

  for (const alias of aliases) {
    if (lookup[alias]) {
      return asArray(lookup[alias]);
    }
  }

  return [];
}

export function getSectionHref(section) {
  return normalizeSection(section).href;
}
