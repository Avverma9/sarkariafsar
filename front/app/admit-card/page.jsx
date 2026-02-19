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
    title: "Admit Card Updates",
    description:
      "Download latest admit card updates for government exams with post-wise information and official link verification.",
    path: "/admit-card",
    type: "CollectionPage",
    noIndex: Boolean(hadOmittedKey || hasExtraQuery),
    keywords: ["admit card", "exam admit card download", "govt exam hall ticket"],
  });
}

export default async function AdmitCardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/admit-card${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Admit Cards";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Admit Card Updates",
    url: toAbsoluteUrl("/admit-card"),
    description: "Government exam admit card and exam city updates.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <PostListBySectionPage
        heading="Admit Card"
        description={`Showing post list for section: ${megaTitle}`}
        megaTitle={megaTitle}
        initialState={initialState}
      />
    </>
  );
}
