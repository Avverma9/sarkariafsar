import { TRENDING_SEARCH_KEYWORDS } from "./trendingKeywords";

const DEFAULT_SITE_URL = "https://sarkariafsar.com";
export const BRAND_NAME = "Sarkari Afsar";
export const DEFAULT_DESCRIPTION =
  "Latest information about government jobs, results, admit cards, and government schemes in one place.";
export const SITE_ICON_PATH = "/sa-favicon.svg";
export const CONTACT_EMAIL = "support@sarkariafsar.com";
export const CONTACT_PHONE = "+91-9153630507";
export const CONTACT_ADDRESS = {
  streetAddress: "Sarkari Afsar Office",
  addressLocality: "Patna",
  addressRegion: "Bihar",
  postalCode: "803212",
  addressCountry: "IN",
};
const BASE_KEYWORDS = [
  "government jobs",
  "government results",
  "latest jobs",
  "admit card",
  "exam results",
  "government schemes",
  "schemes",
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

export function normalizePath(path = "/") {
  const text = String(path || "/").trim();

  if (!text) {
    return "/";
  }

  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    } catch {
      return "/";
    }
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

function resolveUrl(value = "/") {
  const text = String(value || "").trim();

  if (!text) {
    return getSiteUrl();
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return absoluteUrl(text);
}

export function absoluteUrl(path = "/") {
  return `${getSiteUrl()}${normalizePath(path)}`;
}

export function stripHtml(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimText(value = "", maxLength = 160) {
  const plainText = stripHtml(value);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

export function toIsoDate(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null || entry === "") {
        return false;
      }

      if (Array.isArray(entry) && entry.length === 0) {
        return false;
      }

      return true;
    }),
  );
}

function buildPersonOrOrganization(name = BRAND_NAME, url = getSiteUrl()) {
  if (String(name || "").trim() === BRAND_NAME) {
    return {
      "@type": "Organization",
      name: BRAND_NAME,
      url,
    };
  }

  return {
    "@type": "Person",
    name,
    url,
  };
}

function buildListItem({ name = "", url = "", position = 1 } = {}) {
  const resolvedName = String(name || "").trim();
  const resolvedUrl = String(url || "").trim();

  if (!resolvedName || !resolvedUrl) {
    return null;
  }

  return {
    "@type": "ListItem",
    position,
    name: resolvedName,
    item: resolveUrl(resolvedUrl),
  };
}

export function buildBreadcrumbSchema(items = [], { path } = {}) {
  const listItems = items
    .map((item, index) =>
      buildListItem({
        name: item?.name || item?.label,
        url: item?.url || item?.path || item?.href,
        position: index + 1,
      }),
    )
    .filter(Boolean);

  if (listItems.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": path ? absoluteUrl(`${normalizePath(path)}#breadcrumb`) : undefined,
    itemListElement: listItems,
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: BRAND_NAME,
    url: getSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_ICON_PATH),
    },
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    address: {
      "@type": "PostalAddress",
      ...CONTACT_ADDRESS,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    ],
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: getSiteUrl(),
    name: BRAND_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: absoluteUrl("/post?q={search_term_string}"),
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageSchema({
  title = BRAND_NAME,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "WebPage",
  breadcrumbItems = [],
  mainEntityId,
  datePublished,
  dateModified,
} = {}) {
  const resolvedPath = normalizePath(path);
  const webpageId = absoluteUrl(`${resolvedPath}#webpage`);
  const breadcrumbId =
    Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0
      ? absoluteUrl(`${resolvedPath}#breadcrumb`)
      : undefined;

  return compactObject({
    "@context": "https://schema.org",
    "@type": type,
    "@id": webpageId,
    url: absoluteUrl(resolvedPath),
    name: title,
    description: trimText(description, 220),
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    inLanguage: "en-IN",
    breadcrumb: breadcrumbId
      ? {
          "@id": breadcrumbId,
        }
      : undefined,
    mainEntity: mainEntityId
      ? {
          "@id": mainEntityId,
        }
      : undefined,
    datePublished: toIsoDate(datePublished),
    dateModified: toIsoDate(dateModified || datePublished),
  });
}

export function buildCollectionPageSchema({
  title = BRAND_NAME,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  breadcrumbItems = [],
  mainEntityId,
} = {}) {
  return buildWebPageSchema({
    title,
    description,
    path,
    type: "CollectionPage",
    breadcrumbItems,
    mainEntityId,
  });
}

export function buildItemListSchema({
  path = "/",
  name = "Items",
  items = [],
} = {}) {
  const resolvedPath = normalizePath(path);
  const listItems = items
    .map((item, index) =>
      buildListItem({
        position: index + 1,
        name: item?.name || item?.title || item?.label,
        url: item?.url || item?.path || item?.href,
      }),
    )
    .filter(Boolean);

  if (listItems.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": absoluteUrl(`${resolvedPath}#itemlist`),
    url: absoluteUrl(resolvedPath),
    name,
    numberOfItems: listItems.length,
    itemListElement: listItems,
  };
}

export function buildArticleSchema({
  title = "Article",
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "Article",
  authorName = BRAND_NAME,
  image = SITE_ICON_PATH,
  publishedTime,
  modifiedTime,
  section = "",
  keywords = [],
} = {}) {
  const resolvedPath = normalizePath(path);

  return compactObject({
    "@context": "https://schema.org",
    "@type": type,
    "@id": absoluteUrl(`${resolvedPath}#article`),
    mainEntityOfPage: {
      "@id": absoluteUrl(`${resolvedPath}#webpage`),
    },
    url: absoluteUrl(resolvedPath),
    headline: trimText(title, 110),
    description: trimText(description, 220),
    image: [resolveUrl(image)],
    author: [buildPersonOrOrganization(authorName)],
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    inLanguage: "en-IN",
    articleSection: section,
    keywords: uniqueKeywords(keywords).join(", "),
    datePublished: toIsoDate(publishedTime),
    dateModified: toIsoDate(modifiedTime || publishedTime),
    isAccessibleForFree: true,
  });
}

export function buildGovernmentServiceSchema({
  title = "Government Scheme",
  description = DEFAULT_DESCRIPTION,
  path = "/",
  category = "",
  state = "India",
  applyLink = "",
} = {}) {
  const resolvedPath = normalizePath(path);

  return compactObject({
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    "@id": absoluteUrl(`${resolvedPath}#service`),
    url: absoluteUrl(resolvedPath),
    name: title,
    description: trimText(description, 220),
    provider: {
      "@id": absoluteUrl("/#organization"),
    },
    serviceType: category,
    areaServed: {
      "@type": state && state !== "All India" ? "State" : "Country",
      name: state && state !== "All India" ? state : "India",
    },
    availableChannel: applyLink
      ? {
          "@type": "ServiceChannel",
          serviceUrl: resolveUrl(applyLink),
        }
      : undefined,
  });
}

export function buildHowToSchema({
  title = "",
  description = "",
  path = "/",
  steps = [],
} = {}) {
  const safeSteps = (Array.isArray(steps) ? steps : [])
    .map((step) => stripHtml(step))
    .filter(Boolean);

  if (safeSteps.length === 0) {
    return null;
  }

  const resolvedPath = normalizePath(path);

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": absoluteUrl(`${resolvedPath}#howto`),
    url: absoluteUrl(resolvedPath),
    name: title,
    description: trimText(description, 220),
    step: safeSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
    })),
  };
}

export function buildContactPageSchema({
  title = "Contact Us",
  description = DEFAULT_DESCRIPTION,
  path = "/contact-us",
} = {}) {
  const resolvedPath = normalizePath(path);

  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": absoluteUrl(`${resolvedPath}#contact-page`),
    url: absoluteUrl(resolvedPath),
    name: title,
    description: trimText(description, 220),
    mainEntity: {
      "@id": absoluteUrl("/#organization"),
    },
    inLanguage: "en-IN",
  };
}

export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildPageMetadata({
  title = "Sarkari Updates",
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [],
  type = "website",
  noIndex = false,
  category,
  authors,
  publishedTime,
  modifiedTime,
  section,
  images,
} = {}) {
  const canonicalPath = normalizePath(path);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const mergedKeywords = uniqueKeywords([...BASE_KEYWORDS, ...keywords]);
  const resolvedImages =
    Array.isArray(images) && images.length > 0
      ? images.map((image) => ({
          url: resolveUrl(image?.url || image),
          width: image?.width || 256,
          height: image?.height || 256,
          alt: image?.alt || title || BRAND_NAME,
        }))
      : [
          {
            url: absoluteUrl(SITE_ICON_PATH),
            width: 256,
            height: 256,
            alt: BRAND_NAME,
          },
        ];
  const resolvedAuthors =
    Array.isArray(authors) && authors.length > 0
      ? authors.map((name) => ({ name }))
      : [{ name: BRAND_NAME, url: getSiteUrl() }];

  return {
    title,
    description,
    keywords: mergedKeywords,
    authors: resolvedAuthors,
    creator: BRAND_NAME,
    publisher: BRAND_NAME,
    category,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      title: `${title} | ${BRAND_NAME}`,
      description,
      siteName: BRAND_NAME,
      locale: "en-IN",
      images: resolvedImages,
      publishedTime: toIsoDate(publishedTime),
      modifiedTime: toIsoDate(modifiedTime || publishedTime),
      authors: resolvedAuthors.map((author) => author.name),
      section,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${BRAND_NAME}`,
      description,
      images: resolvedImages.map((image) => image.url),
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
