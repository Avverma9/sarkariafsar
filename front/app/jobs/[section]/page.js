import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "../../lib/seo";
import {
  getPostSectionCanonicalPath,
  getPostSectionConfig,
} from "../../lib/postSections";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const config = getPostSectionConfig(resolvedParams?.section);

  if (!config) {
    return buildPageMetadata({
      title: "Section Not Found",
      description: "Requested jobs section not found.",
      path: "/jobs",
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: config.title,
    description: config.description,
    path: getPostSectionCanonicalPath(config),
    keywords: ["jobs section", config.title, config.canonicalSlug],
  });
}

export default async function JobsSectionPage({ params, searchParams }) {
  const resolvedParams = await params;
  const config = getPostSectionConfig(resolvedParams?.section);

  if (!config) {
    notFound();
  }
  const resolvedSearchParams = await searchParams;
  const paramsString = new URLSearchParams(resolvedSearchParams || {}).toString();
  const target = getPostSectionCanonicalPath(config);

  redirect(paramsString ? `${target}?${paramsString}` : target);
}
