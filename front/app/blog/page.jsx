import Link from "next/link";
import { blogPosts } from "../lib/blog-posts";
import { buildMetadata } from "../lib/seo";

export const metadata = buildMetadata({
  title: "Exam and Application Blog",
  description:
    "Read practical guides on preparation strategy, form accuracy, and interview readiness for government job aspirants.",
  path: "/blog",
  type: "Blog",
  keywords: ["government exam blog", "application strategy", "sarkari preparation guide"],
});

const estimateReadTime = (text) => {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const mins = Math.max(3, Math.round(words / 180));
  return `${mins} min read`;
};

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Blog</h1>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm leading-relaxed">
            Long-form, practical posts focused on execution: forms, planning,
            revision systems, and interview readiness. These posts are designed
            to help you avoid common mistakes in real recruitment cycles.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500">{estimateReadTime(post.desc)}</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:underline">
                {post.title}
              </h2>

              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{post.desc}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-700">Read article</span>
                <span className="text-xs text-slate-500">
                  {post?.tags?.length ? `${post.tags.length} tags` : "No tags"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
