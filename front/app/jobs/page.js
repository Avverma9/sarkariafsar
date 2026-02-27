import PostPageShell from "../component/layout/PostPageShell";
import JobsTablesPage from "../component/home/JobsTablesPage";
import { loadJobsTablesPage } from "../lib/jobsTablesPage";
import { buildPageMetadata } from "../lib/seo";

export const metadata = buildPageMetadata({
  title: "Jobs Dashboard",
  description:
    "Latest government job sections ek dashboard me. New jobs, results, admit cards aur admissions updates dekhein.",
  path: "/jobs",
  keywords: ["jobs dashboard", "new jobs", "government jobs india"],
});

export default async function JobsPage() {
  const pageData = await loadJobsTablesPage({ limit: 20 });

  return (
    <PostPageShell>
      <JobsTablesPage {...pageData} />
    </PostPageShell>
  );
}
