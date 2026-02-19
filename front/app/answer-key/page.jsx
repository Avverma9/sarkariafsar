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
    title: "Answer Key Updates",
    description:
      "Track latest government exam answer keys with direct links and post-wise detail pages for faster verification.",
    path: "/answer-key",
    type: "CollectionPage",
    noIndex: Boolean(hadOmittedKey || hasExtraQuery),
    keywords: ["answer key", "govt exam answer key", "official answer key update"],
  });
}

export default async function AnswerKeyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/answer-key${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Answer Keys";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Answer Key Updates",
    url: toAbsoluteUrl("/answer-key"),
    description: "Latest official answer key updates across government exams.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <PostListBySectionPage
        heading="Answer Key"
        description={`Showing post list for section: ${megaTitle}`}
        megaTitle={megaTitle}
        initialState={initialState}
      />
    </>
  );
}
