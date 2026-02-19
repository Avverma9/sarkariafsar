import PostListBySectionPage from "../component/post/PostListBySectionPage";
import { omitSearchParams, toQueryString } from "../lib/searchParams";
import { buildMetadata, toAbsoluteUrl } from "../lib/seo";
import { fetchPostListInitialState } from "../lib/server-post-data";
import { redirect } from "next/navigation";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  const hasExtraQuery = Object.entries(resolvedSearchParams || {}).some(([key, value]) => {
    if (String(key || "").trim() === "megaTitle") return false;
    return String(Array.isArray(value) ? value[0] : value || "").trim().length > 0;
  });

  return buildMetadata({
    title: "Latest Government Jobs",
    description:
      "Browse latest government job notifications with official links, important dates, and direct post detail pages.",
    path: "/latest-jobs",
    type: "CollectionPage",
    noIndex: Boolean(hadOmittedKey || hasExtraQuery),
    keywords: ["latest government jobs", "new sarkari vacancy", "govt jobs updates"],
  });
}

export default async function LatestJobsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/latest-jobs${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Latest Gov Jobs";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Latest Government Jobs",
    url: toAbsoluteUrl("/latest-jobs"),
    description: "Latest government job notifications and deadlines.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <PostListBySectionPage
        heading="Latest Government Jobs"
        description={`Showing post list for section: ${megaTitle}`}
        megaTitle={megaTitle}
        initialState={initialState}
      />
    </>
  );
}
