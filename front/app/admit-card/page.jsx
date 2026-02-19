import PostListBySectionPage from "../component/post/PostListBySectionPage";
import { omitSearchParams, toQueryString } from "../lib/searchParams";
import { fetchPostListInitialState } from "../lib/server-post-data";
import { redirect } from "next/navigation";

export default async function AdmitCardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/admit-card${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Admit Cards";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);

  return (
    <PostListBySectionPage
      heading="Admit Card"
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
      initialState={initialState}
    />
  );
}
