import StructuredData from "../component/seo/StructuredData";
import PostPageShell from "../component/layout/PostPageShell";
import JobsTablesPage from "../component/home/JobsTablesPage";
import { loadJobsTablesPage } from "../lib/jobsTablesPage";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildPageMetadata,
} from "../lib/seo";

function getSectionHref(type) {
  if (type === "results") {
    return "/results";
  }

  if (type === "admitcards") {
    return "/admit-cards";
  }

  if (type === "admission") {
    return "/post/admissions";
  }

  return "/post/new-jobs";
}

export const metadata = buildPageMetadata({
  title: "Jobs Dashboard",
  description:
    "Latest government job sections ek dashboard me. New jobs, results, admit cards aur admissions updates dekhein.",
  path: "/post",
  keywords: ["jobs dashboard", "new jobs", "government jobs india"],
});

export default async function PostIndexPage() {
  const pageData = await loadJobsTablesPage({ limit: 20 });
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Jobs", url: "/post" },
  ];
  const structuredData = [
    buildBreadcrumbSchema(breadcrumbItems, { path: "/post" }),
    buildCollectionPageSchema({
      title: "Jobs Dashboard",
      description:
        "Latest government job sections ek dashboard me. New jobs, results, admit cards aur admissions updates dekhein.",
      path: "/post",
      breadcrumbItems,
      mainEntityId: absoluteUrl("/post#itemlist"),
    }),
    buildItemListSchema({
      path: "/post",
      name: "Government jobs dashboard sections",
      items: pageData.cards.map((card) => ({
        name: card.name,
        url: getSectionHref(card.type),
      })),
    }),
  ];

  return (
    <PostPageShell>
      <StructuredData data={structuredData} />
      <JobsTablesPage {...pageData} />
    </PostPageShell>
  );
}
