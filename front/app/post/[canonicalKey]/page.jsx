import PostDetailsView from "@/app/component/post/PostDetailsView";

export default async function PostByCanonicalKeyPage({ params }) {
  const resolvedParams = await params;
  const canonicalKey = decodeURIComponent(String(resolvedParams?.canonicalKey || "")).trim();

  return <PostDetailsView canonicalKey={canonicalKey} />;
}
