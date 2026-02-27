import { TRENDING_SEARCH_KEYWORDS } from "./trendingKeywords";

const DEFAULT_SITE_URL = "https://sarkariafsar.com";
export const BRAND_NAME = "Sarkari Afsar";
export const DEFAULT_DESCRIPTION =
  "Sarkari jobs, results, admit cards aur government schemes ki latest jankari ek jagah.";
export const SITE_ICON_PATH = "/sa-favicon.svg";
const BASE_KEYWORDS = [
  "sarkari result",
  "sarkari naukri",
  "latest jobs",
  "admit card",
  "exam result",
  "government schemes",
  "yojana",
  "india jobs",
  ...TRENDING_SEARCH_KEYWORDS,
];

function isLocalHostname(hostname = "") {
  const normalized = String(hostname || "").trim().toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".localhost")
  );
}

function normalizeSiteUrl(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (!/^https?:\/\//i.test(text)) {
    return "";
  }

  try {
    const parsed = new URL(text);

    if (isLocalHostname(parsed.hostname)) {
      return "";
    }

    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/g, "");
  } catch {
    return "";
  }
}

function normalizePath(path = "/") {
  const text = String(path || "/").trim();

  if (!text) {
    return "/";
  }

  return text.startsWith("/") ? text : `/${text}`;
}

function uniqueKeywords(values = []) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const text = String(value || "").trim();
    const key = text.toLowerCase();

    if (!text || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(text);
  });

  return result;
}

export function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeSiteUrl(process.env.SITE_URL) ||
    DEFAULT_SITE_URL
  );
}

export function absoluteUrl(path = "/") {
  return `${getSiteUrl()}${normalizePath(path)}`;
}

export function buildPageMetadata({
  title = "Sarkari Updates",
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [],
  type = "website",
  noIndex = false,
} = {}) {
  const canonicalPath = normalizePath(path);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const mergedKeywords = uniqueKeywords([...BASE_KEYWORDS, ...keywords]);

  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      title: `${title} | ${BRAND_NAME}`,
      description,
      siteName: BRAND_NAME,
      locale: "en_IN",
      images: [
        {
          url: absoluteUrl(SITE_ICON_PATH),
          width: 256,
          height: 256,
          alt: BRAND_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} | ${BRAND_NAME}`,
      description,
      images: [absoluteUrl(SITE_ICON_PATH)],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
