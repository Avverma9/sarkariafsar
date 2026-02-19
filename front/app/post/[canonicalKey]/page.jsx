import PostDetailsView from "@/app/component/post/PostDetailsView";
import { fetchPostDetailsInitialState } from "@/app/lib/server-post-data";

export default async function PostByCanonicalKeyPage({ params }) {
  const resolvedParams = await params;
  const canonicalKey = decodeURIComponent(String(resolvedParams?.canonicalKey || "")).trim();
  const { details, errorMessage } = await fetchPostDetailsInitialState(canonicalKey);

  return (
    <PostDetailsView
      canonicalKey={canonicalKey}
      initialDetails={details}
      initialErrorMessage={errorMessage}
    />
  );
}
