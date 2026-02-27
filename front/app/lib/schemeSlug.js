function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function getIdSuffix(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!normalized) {
    return "";
  }

  return normalized.slice(-8);
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSchemeSlug(scheme = {}) {
  const titleSlug = slugify(scheme?.title || scheme?.schemeTitle || scheme?.schemeName || "scheme");
  const idSuffix = getIdSuffix(scheme?.id || scheme?._id);

  if (!idSuffix) {
    return titleSlug || "scheme";
  }

  return `${titleSlug}-${idSuffix}`;
}

export function isSchemeSlugMatch(slug, scheme = {}) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return false;
  }

  const canonical = normalizeSlug(buildSchemeSlug(scheme));
  const titleOnly = normalizeSlug(
    slugify(scheme?.title || scheme?.schemeTitle || scheme?.schemeName),
  );

  return normalizedSlug === canonical || (titleOnly && normalizedSlug === titleOnly);
}
