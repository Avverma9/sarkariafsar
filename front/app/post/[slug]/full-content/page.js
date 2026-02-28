import FullContent from "../../../component/post/FullContent";
import PostPageShell from "../../../component/layout/PostPageShell";
import { getFirstValue, loadPostDetailPageData } from "../../../lib/postDetailPage";
import { redirect } from "next/navigation";
import { cache } from "react";
import { buildPageMetadata } from "../../../lib/seo";
import Link from "next/link";

const loadPostDataByKey = cache((slug, rawJobUrl) =>
  loadPostDetailPageData({
    params: { slug },
    searchParams: rawJobUrl ? { jobUrl: rawJobUrl } : {},
  }),
);

async function loadPostData(params, searchParams) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const rawJobUrl = String(getFirstValue(resolvedSearchParams?.jobUrl) || "");

  return loadPostDataByKey(slug, rawJobUrl);
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
  });
}

export default async function FullContentPage({ params, searchParams }) {
  const {
    slug,
    jobUrl,
    fetchError,
    formattedHtml,
    canonicalKey,
    post,
    jobDetail,
    hasJobUrlParam,
  } = await loadPostData(params, searchParams);

  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const fallbackQuery = String(slug || "")
    .replace(/-[a-z0-9]{4,8}$/i, "")
    .replace(/-/g, " ")
    .trim();
  const fallbackHref = fallbackQuery ? `/jobs?q=${encodeURIComponent(fallbackQuery)}` : "/jobs";

  if (slug !== resolvedCanonicalKey || hasJobUrlParam) {
    redirect(`/post/${resolvedCanonicalKey}/full-content`);
  }

  const backHref = `/post/${resolvedCanonicalKey}`;
  const title = post?.header?.title || jobDetail?.title || "Job Details";

  return (
    <PostPageShell>
     

      {!jobUrl ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">
              Yeh post full-content mode me available nahi hai. Related jobs list se dubara open karein.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={fallbackHref}
                className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-700"
              >
                Related Jobs Dekhein
              </Link>
              <Link
                href={backHref}
                className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-700"
              >
                Back To Summary
              </Link>
            </div>
          </div>
        </div>
      ) : fetchError || !formattedHtml ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">
              {fetchError || "Formatted HTML not available for this post."}
            </p>
          </div>
        </div>
      ) : null}

      {jobUrl && !fetchError && formattedHtml ? (
        <FullContent formattedHtml={formattedHtml} title={title} backHref={backHref} />
      ) : null}
    </PostPageShell>
  );
}
