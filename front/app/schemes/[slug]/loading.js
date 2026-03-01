import PostPageShell from "../../component/layout/PostPageShell";
import SchemeDetailPageSkeleton from "../../component/skeletons/SchemeDetailPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <SchemeDetailPageSkeleton />
    </PostPageShell>
  );
}
