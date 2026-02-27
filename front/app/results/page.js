import PostPageShell from "../component/layout/PostPageShell";
import SectionJobsPage from "../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
} from "../lib/sectionJobsPage";
import { buildPageMetadata } from "../lib/seo";

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

  return (
    <PostPageShell>
      <SectionJobsPage basePath="/results" {...pageData} />
    </PostPageShell>
  );
}
