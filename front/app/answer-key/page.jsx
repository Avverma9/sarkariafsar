import PostListBySectionPage from "../component/post/PostListBySectionPage";
import { omitSearchParams, toQueryString } from "../lib/searchParams";
import { fetchPostListInitialState } from "../lib/server-post-data";
import { redirect } from "next/navigation";

export default async function AnswerKeyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { cleaned, hadOmittedKey } = omitSearchParams(resolvedSearchParams, ["megaTitle"]);
  if (hadOmittedKey) {
    const queryString = toQueryString(cleaned);
    redirect(`/answer-key${queryString ? `?${queryString}` : ""}`);
  }

  const megaTitle = "Answer Keys";
  const initialState = await fetchPostListInitialState(cleaned, megaTitle);

  return (
    <PostListBySectionPage
      heading="Answer Key"
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
      initialState={initialState}
    />
  );
}
