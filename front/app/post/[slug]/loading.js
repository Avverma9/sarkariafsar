import PostPageShell from "../../component/layout/PostPageShell";
import PostDetailPageSkeleton from "../../component/skeletons/PostDetailPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <PostDetailPageSkeleton />
    </PostPageShell>
  );
}
