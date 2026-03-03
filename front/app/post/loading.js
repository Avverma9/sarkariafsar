import PostPageShell from "../component/layout/PostPageShell";
import JobsTablesPageSkeleton from "../component/skeletons/JobsTablesPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <JobsTablesPageSkeleton />
    </PostPageShell>
  );
}
