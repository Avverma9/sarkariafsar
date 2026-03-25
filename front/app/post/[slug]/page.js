import StructuredData from "../../component/seo/StructuredData";
import FullContent from "../../component/post/FullContent";
import PostPageShell from "../../component/layout/PostPageShell";
import {
  getFirstValue,
  loadCachedPostDetailPageData,
} from "../../lib/postDetailPage";
import { redirect } from "next/navigation";
import {
  absoluteUrl,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQPageSchema,
  buildHowToSchema,
  buildItemListSchema,
  buildPageMetadata,
  stripHtml,
  trimText,
  buildWebPageSchema,
} from "../../lib/seo";
import Link from "next/link";
import SectionJobsPage from "../../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
  SECTION_JOBS_DEFAULT_LIMIT,
} from "../../lib/sectionJobsPage";
import { buildPostDetailsHref } from "../../lib/postLink";
import { shouldNoIndexCollectionView } from "../../lib/contentQuality";

async function loadPostData(params, searchParams, options = {}) {
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  await searchParams;

  return loadCachedPostDetailPageData(slug, options.includeFormattedHtml !== false);
}

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const query = parseSectionJobsQuery(await searchParams);
  const sectionData = slug
    ? await loadSectionJobsPage({
        slug,
        limit: 12,
        page: 1,
      })
    : null;

  if (sectionData?.section) {
    return buildPageMetadata({
      title: sectionData.title,
      description:
        sectionData.description || `Latest updates from ${sectionData.section.name}.`,
      path: `/post/${sectionData.section.slug}`,
      keywords: ["jobs section", sectionData.title, sectionData.section.slug],
      noIndex: shouldNoIndexCollectionView(query, {
        defaultLimit: SECTION_JOBS_DEFAULT_LIMIT,
      }),
    });
  }

  // Post detail metadata
  const { fetchError, post, canonicalKey, quality, jobDetail } = await loadPostData(params, searchParams, {
    includeFormattedHtml: false,
  });
  const resolvedCanonicalKey = canonicalKey || slug || "post-detail";
  const title = post?.header?.title || jobDetail?.title || "Job Details";
  const description =
    quality?.description ||
    trimText(jobDetail?.scrapedContent?.contentHtml || "", 180) ||
    post?.header?.shortInfo ||
    "Detailed government job update with important dates, eligibility and links.";

  if (!jobDetail || fetchError) {
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
    keywords: [
      "job details",
      "sarkari post",
      "apply online",
      title,
      jobDetail?.sectionName,
      jobDetail?.sectionCanonicalUrl,
      jobDetail?.category,
    ],
    type: "article",
    noIndex: Boolean(quality?.noIndex),
    category: jobDetail?.category || jobDetail?.sectionName || "Government Jobs",
    publishedTime: jobDetail?.createdAt,
    modifiedTime: jobDetail?.updatedAt || jobDetail?.scrapedContent?.extractedAt,
    section: jobDetail?.sectionName || "Government Jobs",
  });
}

export default async function PostSlugPage({ params, searchParams }) {
  const resolvedParams = await params;
  const slug = String(getFirstValue(resolvedParams?.slug) || "");
  const resolvedSearchParams = await searchParams;
  const query = parseSectionJobsQuery(resolvedSearchParams);
  const initialSectionData = slug
    ? await loadSectionJobsPage({
        ...query,
        slug,
      })
    : null;

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
  const { fetchError, jobDetail, post, canonicalKey, formattedHtml, quality } =
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
  const title = post?.header?.title || jobDetail?.title || "Job Details";
  const bodyText = stripHtml(formattedHtml || "");
  const description =
    quality?.description ||
    trimText(bodyText, 180) ||
    jobDetail?.scrapedContent?.contentJson?.sectionName ||
    post?.header?.shortInfo ||
    "Detailed government job update with important dates, eligibility and links.";
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Jobs", url: "/post" },
    ...(jobDetail?.sectionCanonicalUrl
      ? [
          {
            name: jobDetail?.sectionName || "Section",
            url: `/post/${jobDetail.sectionCanonicalUrl}`,
          },
        ]
      : []),
    { name: title, url: path },
  ];
  const howToSteps =
    Array.isArray(jobDetail?.how_to_apply?.steps)
      ? jobDetail.how_to_apply.steps
          .map((item) => item?.action || item?.text || "")
          .filter(Boolean)
      : [];
  const faqQuestions = Array.isArray(jobDetail?.faq?.questions) ? jobDetail.faq.questions : [];
  const structuredData =
    !fetchError && jobDetail && !quality?.noIndex
      ? [
          buildBreadcrumbSchema(breadcrumbItems, { path }),
          buildWebPageSchema({
            title,
            description,
            path,
            breadcrumbItems,
            mainEntityId: absoluteUrl(`${path}#article`),
            datePublished: jobDetail?.createdAt,
            dateModified: jobDetail?.updatedAt || jobDetail?.scrapedContent?.extractedAt,
          }),
          buildArticleSchema({
            title,
            description,
            path,
            type: "Article",
            section:
              jobDetail?.sectionName ||
              post?.header?.badge ||
              "Government Jobs",
            keywords: [
              "job details",
              "sarkari post",
              "apply online",
              title,
              jobDetail?.sectionName,
              jobDetail?.category,
            ],
            publishedTime: jobDetail?.createdAt,
            modifiedTime: jobDetail?.updatedAt || jobDetail?.scrapedContent?.extractedAt,
          }),
          buildHowToSchema({
            title: `How to apply for ${title}`,
            description,
            path,
            steps: howToSteps,
          }),
          buildFAQPageSchema({
            path,
            questions: faqQuestions,
          }),
        ]
          .filter(Boolean)
      : [];

  return (
    <PostPageShell showTopBanner={false}>
      <StructuredData data={structuredData} />

      {fetchError || !jobDetail || !formattedHtml ? (
        <div className="px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
            <p className="text-sm font-semibold">{fetchError || "Post detail data not available."}</p>
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
      ) : null}

      {!fetchError && jobDetail && formattedHtml ? (
        <FullContent
          formattedHtml={formattedHtml}
          title={title || jobDetail?.title || "Job Details"}
          backHref="/post"
          backLabel="Back to Jobs"
        />
      ) : null}
    </PostPageShell>
  );
}
