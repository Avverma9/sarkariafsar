import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import PostPageShell from "../../component/layout/PostPageShell";
import SchemeDetailPage from "../../component/scheme/SchemeDetailPage";
import { loadSchemeDetailPageData } from "../../lib/schemeDetailPage";
import { buildPageMetadata } from "../../lib/seo";
import { getAllGovSchemes } from "../../lib/govSchemesApi";
import { buildSchemeSlug } from "../../lib/schemeSlug";

const loadSchemeData = cache((slug) => loadSchemeDetailPageData(slug));

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const payload = await getAllGovSchemes();
    const schemes = Array.isArray(payload?.schemes)
      ? payload.schemes
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    const slugs = schemes
      .map((s) => buildSchemeSlug(s))
      .filter(Boolean)
      .map((slug) => ({ slug }));

    return slugs;
  } catch (e) {
    return [];
  }
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

  return (
    <PostPageShell>
      <SchemeDetailPage scheme={pageData.scheme} />
    </PostPageShell>
  );
}
