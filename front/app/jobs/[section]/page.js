import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "../../lib/seo";

function normalizeSectionSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function getSectionConfig(sectionSlug) {
  const normalized = normalizeSectionSlug(sectionSlug);

  if (["newjobs", "latestjobs", "jobs"].includes(normalized)) {
    return {
      canonicalSlug: "latest-gov-jobs",
      sectionKeys: ["new_jobs", "newjob", "latest_job", "latestjobs"],
      title: "Latest Jobs",
      description: "All available job updates from configured section data.",
    };
  }

  if (["results", "result"].includes(normalized)) {
    return {
      canonicalSlug: "results",
      sectionKeys: ["results", "result", "exam_result", "latest_result"],
      title: "Latest Results",
      description: "All result and answer-key related updates from configured section data.",
    };
  }

  if (["admitcards", "admitcard"].includes(normalized)) {
    return {
      canonicalSlug: "recent-admit-cards",
      sectionKeys: ["admit_card", "admitcard", "admit_cards"],
      title: "Admit Cards",
      description: "All admit card updates from configured section data.",
    };
  }

  if (["admission", "admissions"].includes(normalized)) {
    return {
      canonicalSlug: "admission",
      sectionKeys: ["admission", "admissions"],
      title: "Latest Admissions",
      description: "All admission-related updates from configured section data.",
    };
  }

  return null;
}

function getCanonicalPath(config) {
  if (!config) {
    return "/post";
  }

  return `/post/${config.canonicalSlug}`;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const config = getSectionConfig(resolvedParams?.section);

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
    path: getCanonicalPath(config),
    keywords: ["jobs section", config.title, config.canonicalSlug],
  });
}

export default async function JobsSectionPage({ params, searchParams }) {
  const resolvedParams = await params;
  const config = getSectionConfig(resolvedParams?.section);

  if (!config) {
    notFound();
  }
  const resolvedSearchParams = await searchParams;
  const paramsString = new URLSearchParams(resolvedSearchParams || {}).toString();
  const target = getCanonicalPath(config);

  redirect(paramsString ? `${target}?${paramsString}` : target);
}
