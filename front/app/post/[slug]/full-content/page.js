import { getFirstValue, loadPostDetailPageData } from "../../../lib/postDetailPage";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "../../../lib/seo";

async function loadPostData(params, searchParams) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const rawJobUrl = String(getFirstValue(resolvedSearchParams?.jobUrl) || "");

  return loadPostDetailPageData({
    params: { slug },
    searchParams: rawJobUrl ? { jobUrl: rawJobUrl } : {},
  });
}

export async function generateMetadata({ params, searchParams }) {
  const { slug, canonicalKey, post } = await loadPostData(params, searchParams);
  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const title = post?.header?.title || "Full Content";

  return buildPageMetadata({
    title: `${title} - Full Content`,
    description: "Full formatted content view for the selected post.",
    path: `/post/${resolvedCanonicalKey}`,
    noIndex: true,
    type: "article",
  });
}

export default async function FullContentPage({ params, searchParams }) {
  const { slug, canonicalKey, hasJobUrlParam } = await loadPostData(params, searchParams);
  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";

  redirect(
    hasJobUrlParam || slug !== resolvedCanonicalKey
      ? `/post/${resolvedCanonicalKey}`
      : `/post/${slug}`,
  );
}
