import Link from "next/link";
import { notFound } from "next/navigation";
import PostPageShell from "../../component/layout/PostPageShell";
import { getAllBlogPosts, getBlogPostBySlug, getBlogSlugs } from "../../lib/blogs";
import { buildPageMetadata } from "../../lib/seo";

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return buildPageMetadata({
      title: "Blog Not Found",
      description: "Requested blog is currently unavailable.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: ["blog", "sarkari updates", ...post.tags],
    type: "article",
  });
}

export default async function BlogDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug || "");
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getAllBlogPosts().filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <PostPageShell>
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-6 py-8 sm:px-10">
            <p className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">
              {post.category}
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
              <span>{formatDate(post.publishedAt)}</span>
              <span>•</span>
              <span>{post.readingTime}</span>
              <span>•</span>
              <span>{post.author}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">{post.intro}</p>
          </header>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            {post.sections.map((section, index) => (
              <section
                key={`${post.slug}-section-${index + 1}`}
                className={index > 0 ? "border-t border-slate-100 pt-8" : ""}
              >
                <h2 className="text-xl font-black tracking-tight text-slate-900">{section.heading}</h2>

                {section.paragraphs?.map((paragraph, paragraphIndex) => (
                  <p
                    key={`${post.slug}-paragraph-${paragraphIndex + 1}`}
                    className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={`${post.slug}-bullet-${bulletIndex + 1}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <footer className="border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-10">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={`${post.slug}-tag-${tag}`}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Link
              href="/blog"
              className="mt-5 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              Back To All Blogs
            </Link>
          </footer>
        </article>

        {relatedPosts.length > 0 ? (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              Related Blogs
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="rounded-2xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <p className="text-xs font-bold tracking-wide text-indigo-600 uppercase">
                    {relatedPost.category}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-snug text-slate-900">
                    {relatedPost.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PostPageShell>
  );
}
