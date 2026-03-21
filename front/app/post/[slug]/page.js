import StructuredData from "../../component/seo/StructuredData";
import FullContent from "../../component/post/FullContent";
import PostPageShell from "../../component/layout/PostPageShell";
import { getFirstValue, loadPostDetailPageData } from "../../lib/postDetailPage";
import { redirect } from "next/navigation";
import {
  absoluteUrl,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildPageMetadata,
  buildWebPageSchema,
} from "../../lib/seo";
import Link from "next/link";
import SectionJobsPage from "../../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
} from "../../lib/sectionJobsPage";
import { buildPostDetailsHref } from "../../lib/postLink";

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
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const sectionData = await loadSectionJobsPage({
    slug,
    limit: 12,
    page: 1,
  });

  if (sectionData?.section) {
    return buildPageMetadata({
      title: sectionData.title,
      description:
        sectionData.description || `Latest updates from ${sectionData.section.name}.`,
      path: `/post/${sectionData.section.slug}`,
      keywords: ["jobs section", sectionData.title, sectionData.section.slug],
    });
  }

  // Post detail metadata
  const { fetchError, post, canonicalKey } = await loadPostData(params, searchParams);
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

export default async function PostSlugPage({ params, searchParams }) {
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const resolvedSearchParams = await searchParams;
  const query = parseSectionJobsQuery(resolvedSearchParams);
  const initialSectionData = await loadSectionJobsPage({
    ...query,
    slug,
  });

  if (initialSectionData?.section) {
    const path = `/post/${initialSectionData.section.slug}`;
    const paramsString = new URLSearchParams(resolvedSearchParams || {}).toString();

    if (slug !== initialSectionData.section.slug) {
      redirect(paramsString ? `${path}?${paramsString}` : path);
    }

    const resolvedDescription =
      initialSectionData.description ||
      `Latest updates from ${initialSectionData.section.name}.`;
    const pageData = {
      ...initialSectionData,
      description: resolvedDescription,
    };
    const breadcrumbItems = [
      { name: "Home", url: "/" },
      { name: "Jobs", url: "/post" },
      { name: pageData.title, url: path },
    ];
    const structuredData = [
      buildBreadcrumbSchema(breadcrumbItems, { path }),
      buildCollectionPageSchema({
        title: pageData.title,
        description: pageData.description,
        path,
        breadcrumbItems,
        mainEntityId: absoluteUrl(`${path}#itemlist`),
      }),
      buildItemListSchema({
        path,
        name: `${pageData.title} updates`,
        items: pageData.jobs.map((job) => ({
          name: job?.title || "Job update",
          url: buildPostDetailsHref({
            title: job?.title,
            slug: job?.slug,
            jobUrl: job?.jobUrl,
          }),
        })),
      }),
    ];

    return (
      <PostPageShell>
        <StructuredData data={structuredData} />
        <SectionJobsPage basePath={path} {...pageData} />
      </PostPageShell>
    );
  }

  // Otherwise render post detail
  const { jobUrl, fetchError, jobDetail, post, canonicalKey, formattedHtml } =
    await loadPostData(params, searchParams);

  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const fallbackQuery = String(slug || "")
    .replace(/-[a-z0-9]{4,8}$/i, "")
    .replace(/-/g, " ")
    .trim();
  const fallbackHref = fallbackQuery ? `/post?q=${encodeURIComponent(fallbackQuery)}` : "/post";

  // Redirect only if the slug in URL doesn't match the canonical slug
  if (slug !== resolvedCanonicalKey) {
    redirect(`/post/${resolvedCanonicalKey}`);
  }

  const path = `/post/${resolvedCanonicalKey}`;
  const title = post?.header?.title || "Job Details";
  const description =
    post?.shortInfo?.[0] ||
    post?.importantDates?.[0] ||
    "Detailed government job update with important dates, eligibility and links.";
  const structuredData =
    jobUrl && !fetchError && jobDetail && post
      ? [
          buildBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "Jobs", url: "/post" },
              { name: title, url: path },
            ],
            { path },
          ),
          buildWebPageSchema({
            title,
            description,
            path,
            breadcrumbItems: [
              { name: "Home", url: "/" },
              { name: "Jobs", url: "/post" },
              { name: title, url: path },
            ],
            mainEntityId: absoluteUrl(`${path}#article`),
            dateModified: jobDetail?.fetchedAt || jobDetail?.updatedAt,
          }),
          buildArticleSchema({
            title,
            description,
            path,
            type: "Article",
            section: post?.header?.badge || "Government Jobs",
            keywords: ["job details", "sarkari post", "apply online", title],
            modifiedTime: jobDetail?.fetchedAt || jobDetail?.updatedAt,
          }),
        ]
      : [];

  return (
    <PostPageShell>
      <StructuredData data={structuredData} />

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
                href="/post"
                className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-700"
              >
                Jobs Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : fetchError || !jobDetail || !post ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">{fetchError || "Post detail data not available."}</p>
          </div>
        </div>
      ) : null}

      {jobUrl && !fetchError && formattedHtml ? (
        <FullContent
          formattedHtml={formattedHtml}
          title={title}
          backHref="/post"
          backLabel="Back to Jobs"
          badgeText="Job Details"
        />
      ) : null}
    </PostPageShell>
  );
}
