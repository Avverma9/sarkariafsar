import Link from "next/link";
import PostPageShell from "../component/layout/PostPageShell";
import { getAllBlogPosts } from "../lib/blogs";
import { buildPageMetadata } from "../lib/seo";

export const metadata = buildPageMetadata({
  title: "Blog",
  description:
    "Sarkari jobs, results, admit cards aur schemes se related guides, explainers aur practical tips.",
  path: "/blog",
  keywords: ["sarkari blog", "exam guides", "application tips", "scheme guidance"],
});

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BlogListingPage() {
  const posts = getAllBlogPosts();

  return (
    <PostPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
            Editorial
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Blog & Guides
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Exam prep, application mistakes, result verification aur scheme guidance par short,
            useful aur practical blogs.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold tracking-wide text-indigo-700 uppercase">
                  {post.category}
                </span>
                <span className="text-xs font-semibold text-slate-500">{formatDate(post.publishedAt)}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">{post.readingTime}</span>
              </div>

              <h2 className="text-xl font-black tracking-tight text-slate-900">{post.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={`${post.slug}-${tag}`}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors group-hover:bg-indigo-100"
              >
                Read Full Blog
              </Link>
            </article>
          ))}
        </section>
      </div>
    </PostPageShell>
  );
}
