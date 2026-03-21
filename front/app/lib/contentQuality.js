function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeContentText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(values = []) {
  for (const value of values) {
    const text = normalizeContentText(value);

    if (text) {
      return text;
    }
  }

  return "";
}

const PLACEHOLDER_PHRASES = [
  "yojana details available in official source",
  "scheme details available in official source",
  "official source par jakar scheme ki poori process check karein",
  "not specified",
  "will be notified",
  "before exam",
  "check notice",
  "loading post data...",
  "loading information...",
];

function isPlaceholderText(value) {
  const text = normalizeContentText(value).toLowerCase();

  if (!text) {
    return true;
  }

  return PLACEHOLDER_PHRASES.some((phrase) => text === phrase || text.includes(phrase));
}

function getMeaningfulText(value) {
  const text = normalizeContentText(value);
  return isPlaceholderText(text) ? "" : text;
}

function hasMeaningfulText(value, minChars = 40) {
  return getMeaningfulText(value).length >= minChars;
}

export function createExcerpt(value, maxLength = 180) {
  const text = getMeaningfulText(value);

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}...`;
}

function isGenericPostTitle(value) {
  const text = normalizeContentText(value);

  return !text || /^(job|post|official) details$/i.test(text) || /^sarkari update$/i.test(text);
}

function isGenericSchemeTitle(value) {
  const text = normalizeContentText(value);

  return (
    !text ||
    /^government scheme$/i.test(text) ||
    /^scheme$/i.test(text) ||
    /^scheme \d+$/i.test(text)
  );
}

function hasAgeSignal(age = {}) {
  return Boolean(
    age?.minimum_age ||
      age?.maximum_age ||
      age?.min_age ||
      age?.max_age ||
      age?.calculated_as_on ||
      age?.calculated_as ||
      asArray(age?.age_table).length > 0 ||
      asArray(age?.limits).length > 0,
  );
}

function hasDefaultSchemeDocuments(documents = []) {
  const normalized = asArray(documents)
    .map((item) => normalizeContentText(item).toLowerCase())
    .filter(Boolean)
    .sort();

  return (
    normalized.length === 2 &&
    normalized[0] === "aadhar card" &&
    normalized[1] === "bank account details"
  );
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  const text = normalizeContentText(value);

  if (!text) {
    return [];
  }

  return text.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
}

function countRows(tables = []) {
  return asArray(tables).reduce((total, table) => total + asArray(table?.rows).length, 0);
}

function countQuestions(faq = {}) {
  return Math.max(asArray(faq?.questions).length, asArray(faq?.qa).length);
}

export function shouldNoIndexCollectionView(
  {
    page = 1,
    query = "",
    view = "list",
    limit,
    state,
  } = {},
  {
    defaultPage = 1,
    defaultView = "list",
    defaultLimit,
    defaultState,
  } = {},
) {
  if (normalizeContentText(query)) {
    return true;
  }

  if (Number(page) > defaultPage) {
    return true;
  }

  if (view && view !== defaultView) {
    return true;
  }

  if (Number.isFinite(Number(defaultLimit)) && Number(limit) !== Number(defaultLimit)) {
    return true;
  }

  if (
    defaultState &&
    normalizeContentText(state) &&
    normalizeContentText(state) !== normalizeContentText(defaultState)
  ) {
    return true;
  }

  return false;
}

export function assessPostContentQuality({ jobDetail = null, post = null } = {}) {
  const title = firstNonEmpty([post?.header?.title, jobDetail?.title, jobDetail?.jobtitle]);
  const intro = firstNonEmpty([
    post?.header?.shortInfo,
    jobDetail?.introduction?.content,
    jobDetail?.meta?.description,
    jobDetail?.shortInfo,
  ]);
  const datesCount = Math.max(
    asArray(jobDetail?.important_dates?.dates).length,
    asArray(post?.details?.dates?.rawDates).length,
  );
  const vacancyCount = Math.max(
    asArray(jobDetail?.vacancy_details?.vacancies).length,
    countRows(post?.tables?.vacancyTables),
  );
  const feeCount = Math.max(
    asArray(jobDetail?.application_fee?.fees).length,
    asArray(post?.details?.fees?.categories).length,
  );
  const selectionCount = Math.max(
    asArray(jobDetail?.selection_process?.stages).length,
    asArray(post?.details?.selectionSteps).length,
  );
  const faqCount = Math.max(countQuestions(jobDetail?.faq), countQuestions(post?.faq));
  const linksCount = Math.max(
    asArray(jobDetail?.official_links?.links).length,
    asArray(post?.links?.allRawLinks).length,
  );
  const ageSignal = hasAgeSignal(jobDetail?.age_limit) || hasAgeSignal(post?.details?.ageLimit);
  const otherInfoSignal = asArray(post?.otherInfo).some(
    (section) => asArray(section?.items).filter((item) => hasMeaningfulText(item, 20)).length > 0,
  );

  const detailSignalCount = [
    hasMeaningfulText(intro, 90),
    datesCount >= 2,
    vacancyCount > 0,
    feeCount > 0,
    selectionCount > 0,
    faqCount > 0,
    linksCount > 1,
    ageSignal,
    otherInfoSignal,
  ].filter(Boolean).length;

  const description = createExcerpt(intro, 200);
  const indexable =
    !isGenericPostTitle(title) &&
    detailSignalCount >= 3 &&
    (description.length >= 80 || vacancyCount > 0 || (datesCount >= 2 && linksCount > 1));

  return {
    title,
    description,
    detailSignalCount,
    indexable,
    noIndex: !indexable,
  };
}

export function assessSchemeContentQuality(scheme = {}) {
  const title = firstNonEmpty([scheme?.title, scheme?.schemeTitle, scheme?.schemeName]);
  const category = firstNonEmpty([scheme?.category, scheme?.schemetype, scheme?.schemeType]);
  const state = firstNonEmpty([scheme?.state, scheme?.stateName]);
  const about = firstNonEmpty([
    scheme?.about,
    scheme?.aboutScheme,
    scheme?.description,
    scheme?.shortDesc,
    scheme?.benefits,
  ]);
  const process = toStringArray(scheme?.process)
    .map((item) => getMeaningfulText(item))
    .filter((item) => item.length >= 10);
  const documents = toStringArray(scheme?.documents || scheme?.requiredDocs)
    .map((item) => getMeaningfulText(item))
    .filter(Boolean);
  const applyLink = firstNonEmpty([scheme?.applyLink, scheme?.officialLink]);
  const hasMeaningfulDocs = documents.length >= 2 && !hasDefaultSchemeDocuments(documents);
  const signalCount = [
    hasMeaningfulText(about, 90),
    process.length >= 2,
    hasMeaningfulDocs,
    Boolean(applyLink),
    Boolean(firstNonEmpty([scheme?.schemeStartDate, scheme?.schemeLastDate])),
    Boolean(category) && !/^government scheme$/i.test(category),
    Boolean(state) && !/^all india$/i.test(state),
  ].filter(Boolean).length;

  const summary = createExcerpt(about, 180);
  const cardIndexable =
    !isGenericSchemeTitle(title) &&
    (summary.length >= 70 || process.length >= 2) &&
    signalCount >= 2;
  const indexable =
    !isGenericSchemeTitle(title) &&
    signalCount >= 3 &&
    (summary.length >= 90 || (process.length >= 2 && hasMeaningfulDocs));

  return {
    title,
    about: getMeaningfulText(about),
    process,
    documents: hasMeaningfulDocs ? documents : [],
    summary,
    signalCount,
    cardIndexable,
    indexable,
    noIndex: !indexable,
  };
}
