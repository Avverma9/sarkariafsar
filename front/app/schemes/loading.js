import PostPageShell from "../component/layout/PostPageShell";
import SchemesListingPageSkeleton from "../component/skeletons/SchemesListingPageSkeleton";

export default function Loading() {
  return (
    <PostPageShell>
      <SchemesListingPageSkeleton />
    </PostPageShell>
  );
}
