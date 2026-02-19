import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_KEYWORDS,
  SITE_BASE_URL,
  SITE_NAME,
} from "./site-config";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimText(value, maxLength) {
  const text = cleanText(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function toCanonicalPath(pathname = "/") {
  const raw = cleanText(pathname) || "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/, "");
}

export function toAbsoluteUrl(pathname = "/") {
  return new URL(toCanonicalPath(pathname), SITE_BASE_URL).toString();
}

function mergeKeywords(extraKeywords = []) {
  const defaults = Array.isArray(DEFAULT_KEYWORDS) ? DEFAULT_KEYWORDS : [];
  const extras = Array.isArray(extraKeywords) ? extraKeywords : [];
  return Array.from(
    new Set(
      [...defaults, ...extras]
        .map((item) => cleanText(item).toLowerCase())
        .filter(Boolean),
    ),
  );
}

function resolveOpenGraphType(type = "website") {
  const normalized = cleanText(type).toLowerCase();

  const supported = new Set([
    "website",
    "article",
    "book",
    "profile",
    "music.song",
    "music.album",
    "music.playlist",
    "music.radio_station",
    "video.movie",
    "video.episode",
    "video.tv_show",
    "video.other",
  ]);

  if (supported.has(normalized)) return normalized;

  const alias = {
    webpage: "website",
    collectionpage: "website",
    searchresultspage: "website",
    aboutpage: "website",
    contactpage: "website",
    blog: "website",
  };

  return alias[normalized] || "website";
}

function resolveRobots(noIndex = false) {
  if (!noIndex) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    };
  }

  return {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export function buildMetadata({
  title = "",
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
  noIndex = false,
  keywords = [],
} = {}) {
  const normalizedTitle = trimText(title, 90) || SITE_NAME;
  const normalizedDescription = trimText(description, 170) || DEFAULT_DESCRIPTION;
  const canonicalPath = toCanonicalPath(path);
  const canonicalUrl = toAbsoluteUrl(canonicalPath);

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    keywords: mergeKeywords(keywords),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: normalizedTitle,
      description: normalizedDescription,
      url: canonicalUrl,
      type: resolveOpenGraphType(type),
      siteName: SITE_NAME,
      images: [DEFAULT_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [DEFAULT_IMAGE],
    },
    robots: resolveRobots(noIndex),
  };
}

export function buildBreadcrumbSchema(items = []) {
  const list = Array.isArray(items) ? items : [];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list
      .filter((item) => cleanText(item?.name) && cleanText(item?.path))
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: cleanText(item.name),
        item: toAbsoluteUrl(item.path),
      })),
  };
}
