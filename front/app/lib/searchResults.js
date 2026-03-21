import { buildPostDetailsHref } from "./postLink";
import { buildSchemeSlug } from "./schemeSlug";

export function normalizeGlobalSearchType(value) {
  const type = String(value || "").trim().toLowerCase();

  if (type === "job" || type === "blog" || type === "scheme") {
    return type;
  }

  return "unknown";
}

export function getGlobalSearchResultLabel(type) {
  switch (normalizeGlobalSearchType(type)) {
    case "job":
      return "Job";
    case "blog":
      return "Blog";
    case "scheme":
      return "Scheme";
    default:
      return "Result";
  }
}

export function getGlobalSearchResultHref(result = {}) {
  const type = normalizeGlobalSearchType(result?.type);
  const slug = String(result?.slug || "").trim();

  if (type === "job") {
    return buildPostDetailsHref({
      title: result?.title,
      slug,
      jobUrl: result?.jobUrl,
    });
  }

  if (type === "blog") {
    return slug ? `/blog/${slug}` : "";
  }

  if (type === "scheme") {
    const schemeSlug = slug || buildSchemeSlug(result);
    return schemeSlug ? `/schemes/${schemeSlug}` : "";
  }

  return "";
}

export function formatSearchResultDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
