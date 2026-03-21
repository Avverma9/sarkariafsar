import StructuredData from "../component/seo/StructuredData";
import PostPageShell from "../component/layout/PostPageShell";
import SectionJobsPage from "../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
  SECTION_JOBS_DEFAULT_LIMIT,
} from "../lib/sectionJobsPage";
import { shouldNoIndexCollectionView } from "../lib/contentQuality";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildPageMetadata,
} from "../lib/seo";
import { buildPostDetailsHref } from "../lib/postLink";

export async function generateMetadata({ searchParams }) {
  const query = parseSectionJobsQuery(await searchParams);

  return buildPageMetadata({
    title: "Latest Results",
    description:
      "Sarkari exam results aur answer key updates ek jagah. Search aur pagination ke saath updated result listing.",
    path: "/results",
    keywords: ["exam results", "sarkari result", "answer key"],
    noIndex: shouldNoIndexCollectionView(query, {
      defaultLimit: SECTION_JOBS_DEFAULT_LIMIT,
    }),
  });
}

export default async function ResultsPage({ searchParams }) {
  const query = parseSectionJobsQuery(await searchParams);
  const pageData = await loadSectionJobsPage({
    ...query,
    slug: "results",
    categoryKey: "results",
    title: "Latest Results",
    description: "All result and answer-key related updates from the latest section feed.",
  });
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Results", url: "/results" },
  ];
  const structuredData = [
    buildBreadcrumbSchema(breadcrumbItems, { path: "/results" }),
    buildCollectionPageSchema({
      title: pageData.title,
      description: pageData.description,
      path: "/results",
      breadcrumbItems,
      mainEntityId: absoluteUrl("/results#itemlist"),
    }),
    buildItemListSchema({
      path: "/results",
      name: "Latest result updates",
      items: pageData.jobs.map((job) => ({
        name: job?.title || "Result update",
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
      <SectionJobsPage basePath="/results" {...pageData} />
    </PostPageShell>
  );
}
