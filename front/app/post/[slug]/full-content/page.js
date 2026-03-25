import {
  getFirstValue,
  loadCachedPostDetailPageData,
} from "../../../lib/postDetailPage";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "../../../lib/seo";

async function loadPostData(params, searchParams, options = {}) {
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  await searchParams;

  return loadCachedPostDetailPageData(slug, options.includeFormattedHtml !== false);
}

export async function generateMetadata({ params, searchParams }) {
  const { slug, canonicalKey, post } = await loadPostData(params, searchParams, {
    includeFormattedHtml: false,
  });
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
  const { slug, canonicalKey } = await loadPostData(params, searchParams, {
    includeFormattedHtml: false,
  });
  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";

  redirect(slug !== resolvedCanonicalKey ? `/post/${resolvedCanonicalKey}` : `/post/${slug}`);
}
