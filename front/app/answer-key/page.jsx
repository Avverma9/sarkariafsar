import PostListBySectionPage from "../component/post/PostListBySectionPage";

export default async function AnswerKeyPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawMegaTitle = resolvedSearchParams?.megaTitle;
  const requestedMegaTitle = String(Array.isArray(rawMegaTitle) ? rawMegaTitle[0] : rawMegaTitle || "").trim();
  const megaTitle = requestedMegaTitle || "Answer Key";

  return (
    <PostListBySectionPage
      heading={requestedMegaTitle ? megaTitle : "Answer Key"}
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
    />
  );
}
