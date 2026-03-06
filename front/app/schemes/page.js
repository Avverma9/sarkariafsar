import StructuredData from "../component/seo/StructuredData";
import PostPageShell from "../component/layout/PostPageShell";
import SchemesListingPage from "../component/scheme/SchemesListingPage";
import {
  loadSchemesListingPage,
  parseSchemesListingQuery,
} from "../lib/schemesListingPage";
import { absoluteUrl, buildBreadcrumbSchema, buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "../lib/seo";

export const metadata = buildPageMetadata({
  title: "Government Schemes",
  description:
    "Central aur state level government schemes ka searchable listing page with state-wise filters.",
  path: "/schemes",
  keywords: ["government schemes", "schemes listing", "state schemes"],
});

export default async function SchemesPage({ searchParams }) {
  const query = parseSchemesListingQuery(await searchParams);
  const pageData = await loadSchemesListingPage(query);
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Schemes", url: "/schemes" },
  ];
  const structuredData = [
    buildBreadcrumbSchema(breadcrumbItems, { path: "/schemes" }),
    buildCollectionPageSchema({
      title: pageData.title,
      description: pageData.description,
      path: "/schemes",
      breadcrumbItems,
      mainEntityId: absoluteUrl("/schemes#itemlist"),
    }),
    buildItemListSchema({
      path: "/schemes",
      name: `${pageData.selectedState || "All India"} government schemes`,
      items: pageData.items.map((item) => ({
        name: item.title,
        url: `/schemes/${item.slug}`,
      })),
    }),
  ];

  return (
    <PostPageShell>
      <StructuredData data={structuredData} />
      <SchemesListingPage {...pageData} />
    </PostPageShell>
  );
}
