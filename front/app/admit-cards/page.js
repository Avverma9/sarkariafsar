import PostPageShell from "../component/layout/PostPageShell";
import SectionJobsPage from "../component/home/SectionJobsPage";
import {
  loadSectionJobsPage,
  parseSectionJobsQuery,
} from "../lib/sectionJobsPage";
import { buildPageMetadata } from "../lib/seo";

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
    sectionKeys: ["admit_card", "admitcard", "admit_cards"],
    title: "Admit Cards",
    description: "All admit card updates from configured source section URLs.",
  });

  return (
    <PostPageShell>
      <SectionJobsPage basePath="/admit-cards" {...pageData} />
    </PostPageShell>
  );
}
