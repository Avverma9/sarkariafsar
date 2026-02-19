import PostListBySectionPage from "../component/post/PostListBySectionPage";
import { omitSearchParams, toQueryString } from "../lib/searchParams";
import { fetchPostListInitialState } from "../lib/server-post-data";
import { redirect } from "next/navigation";

export default async function ResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/results${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Recent Results";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);

  return (
    <PostListBySectionPage
      heading="Recent Results"
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
      initialState={initialState}
    />
  );
}
