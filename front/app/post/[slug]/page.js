import PostDetails from "../../component/post/PostDetails";
import PostPageShell from "../../component/layout/PostPageShell";
import { getFirstValue, loadPostDetailPageData } from "../../lib/postDetailPage";
import { redirect } from "next/navigation";
import { cache } from "react";
import { buildPageMetadata } from "../../lib/seo";

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

  if (slug !== resolvedCanonicalKey || hasJobUrlParam) {
    redirect(`/post/${resolvedCanonicalKey}`);
  }

  return (
    <PostPageShell>
   

      {!jobUrl ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">Missing jobUrl. Please open post from job list.</p>
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
