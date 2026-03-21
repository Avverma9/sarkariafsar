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
  title: "Admit Cards",
  description:
    "Latest admit card aur exam date updates. Sarkari exams ke hall ticket links aur related details yahan milenge.",
  path: "/admit-cards",
  keywords: ["admit card", "hall ticket", "exam date"],
});

export default async function AdmitCardsPage({ searchParams }) {
  const query = parseSectionJobsQuery(await searchParams);
  const pageData = await loadSectionJobsPage({
    ...query,
    slug: "recent-admit-cards",
    categoryKey: "admit-cards",
    title: "Recent Admit Cards",
    description: "All admit card updates from the latest section feed.",
  });
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Admit Cards", url: "/admit-cards" },
  ];
  const structuredData = [
    buildBreadcrumbSchema(breadcrumbItems, { path: "/admit-cards" }),
    buildCollectionPageSchema({
      title: pageData.title,
      description: pageData.description,
      path: "/admit-cards",
      breadcrumbItems,
      mainEntityId: absoluteUrl("/admit-cards#itemlist"),
    }),
    buildItemListSchema({
      path: "/admit-cards",
      name: "Latest admit card updates",
      items: pageData.jobs.map((job) => ({
        name: job?.title || "Admit card update",
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
      <SectionJobsPage basePath="/admit-cards" {...pageData} />
    </PostPageShell>
  );
}
