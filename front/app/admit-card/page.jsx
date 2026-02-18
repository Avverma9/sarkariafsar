import PostListBySectionPage from "../component/post/PostListBySectionPage";

export default async function AdmitCardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const rawMegaTitle = resolvedSearchParams?.megaTitle;
  const requestedMegaTitle = String(Array.isArray(rawMegaTitle) ? rawMegaTitle[0] : rawMegaTitle || "").trim();
  const megaTitle = requestedMegaTitle || "Admit Card";

  return (
    <PostListBySectionPage
      heading={requestedMegaTitle ? megaTitle : "Admit Card"}
      description={`Showing post list for section: ${megaTitle}`}
      megaTitle={megaTitle}
    />
  );
}
