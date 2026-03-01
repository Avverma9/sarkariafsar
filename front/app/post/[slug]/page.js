import PostDetails from "../../component/post/PostDetails";
import PostPageShell from "../../component/layout/PostPageShell";
import { getFirstValue, loadPostDetailPageData } from "../../lib/postDetailPage";
import { redirect } from "next/navigation";
import { cache } from "react";
import { buildPageMetadata } from "../../lib/seo";
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
  const { slug, fetchError, post, canonicalKey } = await loadPostData(params, searchParams);
  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const title = post?.header?.title || "Job Details";
  const description =
    post?.shortInfo?.[0] ||
    post?.importantDates?.[0] ||
    "Detailed government job update with important dates, eligibility and links.";

  if (!post || fetchError) {
    return buildPageMetadata({
      title: "Post Not Available",
      description: "Requested post details are currently unavailable.",
      path: `/post/${resolvedCanonicalKey}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title,
    description,
    path: `/post/${resolvedCanonicalKey}`,
    keywords: ["job details", "sarkari post", "apply online", title],
    type: "article",
  });
}

export default async function PostDetailPage({ params, searchParams }) {
  const { slug, jobUrl, fetchError, jobDetail, post, canonicalKey, hasJobUrlParam } =
    await loadPostData(params, searchParams);

  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const fallbackQuery = String(slug || "")
    .replace(/-[a-z0-9]{4,8}$/i, "")
    .replace(/-/g, " ")
    .trim();
  const fallbackHref = fallbackQuery ? `/jobs?q=${encodeURIComponent(fallbackQuery)}` : "/jobs";

  if (slug !== resolvedCanonicalKey || hasJobUrlParam) {
    redirect(`/post/${resolvedCanonicalKey}`);
  }

  return (
    <PostPageShell>
   

      {!jobUrl ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">
              Yeh post ab direct resolve nahi ho pa raha. Aap relevant jobs list se dubara open kar sakte hain.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={fallbackHref}
                className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-700"
              >
                Related Jobs Dekhein
              </Link>
              <Link
                href="/jobs"
                className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-700"
              >
                Jobs Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : fetchError || !jobDetail?.jsonData || !post ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">{fetchError || "Post detail data not available."}</p>
          </div>
        </div>
      ) : null}

      {jobUrl && !fetchError && jobDetail?.jsonData && post ? (
        <PostDetails post={post} jobUrl={jobUrl} canonicalKey={resolvedCanonicalKey} />
      ) : null}
    </PostPageShell>
  );
}

export const revalidate = 3600;
