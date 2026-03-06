import StructuredData from "../component/seo/StructuredData";
import PostPageShell from "../component/layout/PostPageShell";
import SectionJobsPage from "../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
} from "../lib/sectionJobsPage";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildPageMetadata,
} from "../lib/seo";
import { buildPostDetailsHref } from "../lib/postLink";

export const metadata = buildPageMetadata({
  title: "Latest Results",
  description:
    "Sarkari exam results aur answer key updates ek jagah. Search aur pagination ke saath updated result listing.",
  path: "/results",
  keywords: ["exam results", "sarkari result", "answer key"],
});

export default async function ResultsPage({ searchParams }) {
  const query = parseSectionJobsQuery(await searchParams);
  const pageData = await loadSectionJobsPage({
    ...query,
    sectionKeys: ["results", "result", "exam_result", "latest_result"],
    title: "Latest Results",
    description: "All result and answer-key related updates from configured source section URLs.",
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
        url: job?.jobUrl
          ? buildPostDetailsHref({
              title: job?.title,
              jobUrl: job?.jobUrl,
            })
          : "/results",
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
