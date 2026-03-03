import PostPageShell from "../../component/layout/PostPageShell";
import SectionJobsPageSkeleton from "../../component/skeletons/SectionJobsPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <SectionJobsPageSkeleton />
    </PostPageShell>
  );
}
