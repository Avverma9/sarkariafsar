import PostListBySectionPage from "../component/post/PostListBySectionPage";

export default async function ResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawMegaTitle = resolvedSearchParams?.megaTitle;
  const requestedMegaTitle = String(Array.isArray(rawMegaTitle) ? rawMegaTitle[0] : rawMegaTitle || "").trim();
  const megaTitle = requestedMegaTitle || "Recent Results";

  return (
    <PostListBySectionPage
      heading={requestedMegaTitle ? megaTitle : "Recent Results"}
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
    />
  );
}
