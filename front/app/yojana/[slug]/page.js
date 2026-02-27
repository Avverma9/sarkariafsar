import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import PostPageShell from "../../component/layout/PostPageShell";
import SchemeDetailPage from "../../component/scheme/SchemeDetailPage";
import { loadSchemeDetailPageData } from "../../lib/schemeDetailPage";
import { buildPageMetadata } from "../../lib/seo";

const loadSchemeData = cache((slug) => loadSchemeDetailPageData(slug));

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const pageData = await loadSchemeData(slug);
  const title = pageData?.scheme?.title || "Government Scheme";

  if (!pageData?.scheme) {
    return buildPageMetadata({
      title: "Scheme Not Found",
      description: "Requested government scheme could not be found.",
      path: `/yojana/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title,
    description: pageData.scheme.about || "Detailed information about this government scheme.",
    path: `/yojana/${pageData.canonicalSlug || slug}`,
    keywords: ["yojana details", pageData.scheme.category, pageData.scheme.state],
    type: "article",
  });
}

export default async function YojanaDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const pageData = await loadSchemeData(slug);

  if (!pageData?.scheme) {
    notFound();
  }

  if (pageData.canonicalSlug && slug !== pageData.canonicalSlug) {
    redirect(`/yojana/${pageData.canonicalSlug}`);
  }

  return (
    <PostPageShell>
      <SchemeDetailPage scheme={pageData.scheme} />
    </PostPageShell>
  );
}
