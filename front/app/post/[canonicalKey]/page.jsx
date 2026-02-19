import PostDetailsView from "@/app/component/post/PostDetailsView";
import { buildBreadcrumbSchema, buildMetadata, toAbsoluteUrl } from "@/app/lib/seo";
import { resolveSectionRoute } from "@/app/lib/sectionRouting";
import { fetchPostDetailsInitialState } from "@/app/lib/server-post-data";
import { cache } from "react";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toSafeUrl(value, fallbackPath = "/") {
  const raw = cleanText(value);
  if (!raw) return toAbsoluteUrl(fallbackPath);
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}
  return toAbsoluteUrl(fallbackPath);
}

function toIsoDate(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) {
    const parsed = new Date(`${iso}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const ddMmYyyy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddMmYyyy) {
    const parsed = new Date(
      Date.UTC(
        Number(ddMmYyyy[3]),
        Number(ddMmYyyy[2]) - 1,
        Number(ddMmYyyy[1]),
        0,
        0,
        0,
      ),
    );
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return "";
}

function getDisplayTitle(details, canonicalKey = "") {
  return (
    cleanText(details?.recruitment?.title) ||
    cleanText(details?.raw?.postTitle) ||
    cleanText(details?.raw?.title) ||
    cleanText(canonicalKey) ||
    "Recruitment Details"
  );
}

function getMetaDescription(details) {
  return (
    cleanText(details?.recruitment?.content?.originalSummary) ||
    cleanText(details?.recruitment?.additionalInfo) ||
    "Verified recruitment details, important dates, eligibility, fee, and official links."
  );
}

const getPostInitialState = cache(async (canonicalKey) =>
  fetchPostDetailsInitialState(canonicalKey),
);

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const canonicalKey = decodeURIComponent(String(resolvedParams?.canonicalKey || "")).trim();
  if (!canonicalKey) {
    return buildMetadata({
      title: "Post Details",
      description: "Post details page.",
      path: "/post",
      noIndex: true,
    });
  }

  const { details, errorMessage } = await getPostInitialState(canonicalKey);
  const title = getDisplayTitle(details, canonicalKey);
  const description = getMetaDescription(details);

  return buildMetadata({
    title,
    description,
    path: `/post/${encodeURIComponent(canonicalKey)}`,
    type: "article",
    noIndex: Boolean(errorMessage || !details),
    keywords: [
      cleanText(details?.raw?.megaTitle),
      cleanText(details?.raw?.megaSlug),
      "government recruitment details",
      "official notification",
    ],
  });
}

export default async function PostByCanonicalKeyPage({ params }) {
  const resolvedParams = await params;
  const canonicalKey = decodeURIComponent(String(resolvedParams?.canonicalKey || "")).trim();
  const { details, errorMessage } = await getPostInitialState(canonicalKey);

  const sectionTitle =
    cleanText(details?.raw?.megaTitle) ||
    cleanText(details?.raw?.megaSlug) ||
    cleanText(details?.recruitment?.megaTitle) ||
    "Latest Gov Jobs";
  const sectionRoute = resolveSectionRoute(sectionTitle);
  const postPath = `/post/${encodeURIComponent(canonicalKey)}`;
  const postTitle = getDisplayTitle(details, canonicalKey);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: sectionRoute.label || "Latest Gov Jobs", path: sectionRoute.basePath || "/latest-jobs" },
    { name: postTitle, path: postPath },
  ]);

  const postDate = toIsoDate(details?.recruitment?.importantDates?.postDate || details?.raw?.postDate);
  const validThrough = toIsoDate(details?.recruitment?.importantDates?.applicationLastDate);
  const organizationName =
    cleanText(details?.recruitment?.organization?.name) ||
    cleanText(details?.raw?.organizationName) ||
    "Government Organization";
  const organizationUrl = toSafeUrl(details?.recruitment?.organization?.website, "/");

  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: postTitle,
    description: getMetaDescription(details),
    url: toAbsoluteUrl(postPath),
    hiringOrganization: {
      "@type": "Organization",
      name: organizationName,
      sameAs: organizationUrl,
    },
    employmentType: cleanText(details?.raw?.jobType) || "FULL_TIME",
    ...(postDate ? { datePosted: postDate } : {}),
    ...(validThrough ? { validThrough } : {}),
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {details ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      ) : null}
      <PostDetailsView
        canonicalKey={canonicalKey}
        initialDetails={details}
        initialErrorMessage={errorMessage}
      />
    </>
  );
}
