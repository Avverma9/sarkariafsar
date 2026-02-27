import { notFound } from "next/navigation";
import PostPageShell from "../../component/layout/PostPageShell";
import SectionJobsPage from "../../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
} from "../../lib/sectionJobsPage";
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
      canonicalSlug: "new-jobs",
      sectionKeys: ["new_jobs", "newjob", "latest_job", "latestjobs"],
      title: "Latest Jobs",
      description: "All available job updates from configured source section URLs.",
    };
  }

  if (["results", "result"].includes(normalized)) {
    return {
      canonicalSlug: "results",
      sectionKeys: ["results", "result", "exam_result", "latest_result"],
      title: "Latest Results",
      description:
        "All result and answer-key related updates from configured source section URLs.",
    };
  }

  if (["admitcards", "admitcard"].includes(normalized)) {
    return {
      canonicalSlug: "admit-cards",
      sectionKeys: ["admit_card", "admitcard", "admit_cards"],
      title: "Admit Cards",
      description: "All admit card updates from configured source section URLs.",
    };
  }

  if (["admission", "admissions"].includes(normalized)) {
    return {
      canonicalSlug: "admissions",
      sectionKeys: ["admission", "admissions"],
      title: "Latest Admissions",
      description: "All admission-related updates from configured source section URLs.",
    };
  }

  return null;
}

function getCanonicalPath(config) {
  if (!config) {
    return "/jobs";
  }

  if (config.canonicalSlug === "results") {
    return "/results";
  }

  if (config.canonicalSlug === "admit-cards") {
    return "/admit-cards";
  }

  return `/jobs/${config.canonicalSlug}`;
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

  const query = parseSectionJobsQuery(await searchParams);
  const pageData = await loadSectionJobsPage({
    ...query,
    sectionKeys: config.sectionKeys,
    title: config.title,
    description: config.description,
  });

  return (
    <PostPageShell>
      <SectionJobsPage basePath={`/jobs/${config.canonicalSlug}`} {...pageData} />
    </PostPageShell>
  );
}
