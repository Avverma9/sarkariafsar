import PostPageShell from "../../../component/layout/PostPageShell";
import FullContentPageSkeleton from "../../../component/skeletons/FullContentPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <FullContentPageSkeleton />
    </PostPageShell>
  );
}
