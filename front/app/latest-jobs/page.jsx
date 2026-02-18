import PostListBySectionPage from "../component/post/PostListBySectionPage";

export default async function LatestJobsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawMegaTitle = resolvedSearchParams?.megaTitle;
  const requestedMegaTitle = String(Array.isArray(rawMegaTitle) ? rawMegaTitle[0] : rawMegaTitle || "").trim();
  const megaTitle = requestedMegaTitle || "Latest Gov Jobs";

  return (
    <PostListBySectionPage
      heading={requestedMegaTitle ? megaTitle : "Latest Government Jobs"}
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
    />
  );
}
