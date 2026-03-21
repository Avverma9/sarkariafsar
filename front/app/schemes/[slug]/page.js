import StructuredData from "../../component/seo/StructuredData";
import { notFound, redirect } from "next/navigation";
import PostPageShell from "../../component/layout/PostPageShell";
import SchemeDetailPage from "../../component/scheme/SchemeDetailPage";
import { loadCachedSchemeDetailPageData } from "../../lib/schemeDetailPage";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildGovernmentServiceSchema,
  buildHowToSchema,
  buildPageMetadata,
  buildWebPageSchema,
} from "../../lib/seo";

async function loadSchemeData(slug) {
  return loadCachedSchemeDetailPageData(slug);
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const pageData = await loadSchemeData(slug);
  const title = pageData?.scheme?.title || "Government Scheme";

  if (!pageData?.scheme) {
    return buildPageMetadata({
      title: "Scheme Not Found",
      description: "Requested government scheme could not be found.",
      path: `/schemes/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title,
    description: pageData.scheme.about || "Detailed information about this government scheme.",
    path: `/schemes/${pageData.canonicalSlug || slug}`,
    keywords: ["scheme details", pageData.scheme.category, pageData.scheme.state],
    type: "article",
    category: pageData.scheme.category,
  });
}

export default async function SchemeDetailRoute({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const pageData = await loadSchemeData(slug);

  if (!pageData?.scheme) {
    notFound();
  }

  if (pageData.canonicalSlug && slug !== pageData.canonicalSlug) {
    redirect(`/schemes/${pageData.canonicalSlug}`);
  }

  const path = `/schemes/${pageData.canonicalSlug || slug}`;
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Schemes", url: "/schemes" },
    { name: pageData.scheme.title, url: path },
  ];
  const structuredData = [
    buildBreadcrumbSchema(breadcrumbItems, { path }),
    buildWebPageSchema({
      title: pageData.scheme.title,
      description: pageData.scheme.about,
      path,
      breadcrumbItems,
      mainEntityId: absoluteUrl(`${path}#service`),
    }),
    buildGovernmentServiceSchema({
      title: pageData.scheme.title,
      description: pageData.scheme.about,
      path,
      category: pageData.scheme.category,
      state: pageData.scheme.state,
      applyLink: pageData.scheme.applyLink,
    }),
    buildHowToSchema({
      title: `${pageData.scheme.title} application process`,
      description: pageData.scheme.about,
      path,
      steps: pageData.scheme.process,
    }),
  ];

  return (
    <PostPageShell>
      <StructuredData data={structuredData} />
      <SchemeDetailPage scheme={pageData.scheme} />
    </PostPageShell>
  );
}
