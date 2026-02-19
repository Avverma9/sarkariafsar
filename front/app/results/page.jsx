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
    title: "Recent Results",
    description:
      "Check latest government exam results with post-wise details, key dates, and official result source links.",
    path: "/results",
    type: "CollectionPage",
    noIndex: Boolean(hadOmittedKey || hasExtraQuery),
    keywords: ["sarkari result", "recent exam results", "govt exam result list"],
  });
}

export default async function ResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/results${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Recent Results";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Recent Results",
    url: toAbsoluteUrl("/results"),
    description: "Recent government exam results and related updates.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <PostListBySectionPage
        heading="Recent Results"
        description={`Showing post list for section: ${megaTitle}`}
        megaTitle={megaTitle}
        initialState={initialState}
      />
    </>
  );
}
