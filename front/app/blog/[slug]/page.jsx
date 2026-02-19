import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/app/lib/site-config";
import { buildBreadcrumbSchema, buildMetadata, toAbsoluteUrl } from "@/app/lib/seo";
import { blogPosts,getBlogPostBySlug } from "@/app/lib/blog-posts";

const splitDescription = (text) =>
  String(text || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

const getDescriptionPreview = (text) => {
  const parts = splitDescription(text);
  return parts[0] || text || "Blog article";
};

const Tag = ({ label }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
    {label}
  </span>
);

const SectionCard = ({ title, paragraphs = [], list = [] }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
    <h2 className="text-lg font-extrabold text-slate-900 mb-3">{title}</h2>
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {paragraphs.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </div>
    {list.length ? (
      <ul className="list-disc pl-5 mt-4 space-y-2 text-sm text-slate-700">
        {list.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ) : null}
  </section>
);

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) {
    return buildMetadata({
      title: "Blog Article",
      description: "Blog article page.",
      path: "/blog",
      noIndex: true,
    });
  }

  const path = `/blog/${post.slug}`;
  const title = post.title;
  const description = getDescriptionPreview(post.desc);

  return buildMetadata({
    title,
    description,
    path,
    type: "article",
    keywords: [...(Array.isArray(post.tags) ? post.tags : []), post.category, "exam blog"],
  });
}

export default async function BlogDetailPage({ params }) {
  const resolvedParams = await params;
  const post = getBlogPostBySlug(resolvedParams.slug);
  if (!post) notFound();

  const descriptionParts = splitDescription(post.desc);
  const descriptionPreview = getDescriptionPreview(post.desc);

  const relatedByCategory = blogPosts.filter(
    (item) => item.slug !== post.slug && item.category === post.category,
  );
  const fallbackRelated = blogPosts.filter((item) => item.slug !== post.slug);
  const related = Array.from(
    new Map(
      [...relatedByCategory, ...fallbackRelated].map((item) => [item.slug, item]),
    ).values(),
  ).slice(0, 3);

  const articlePath = `/blog/${post.slug}`;
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: articlePath },
  ]);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: descriptionPreview,
    articleSection: post.category,
    keywords: Array.isArray(post.tags) ? post.tags.join(", ") : "",
    url: toAbsoluteUrl(articlePath),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: toAbsoluteUrl("/"),
    },
  };

  return (
    <article className="min-h-screen bg-slate-50 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <nav className="text-sm text-slate-500">
          <Link href="/blog" className="text-indigo-600 hover:text-indigo-700">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600">{post.title}</span>
        </nav>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide font-bold text-slate-500">
              {post.category}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">
              {post.readingTime}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <p className="text-base text-slate-600 max-w-2xl line-clamp-3">
            {descriptionPreview}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Tag key={tag} label={tag.replace(/-/g, " ")} />
            ))}
          </div>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-extrabold text-slate-900">Description</h2>
          {descriptionParts.length ? (
            descriptionParts.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>{post.desc}</p>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-2 uppercase tracking-wide">
              At a Glance
            </h2>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>Category: {post.category}</li>
              <li>Estimated time: {post.readingTime}</li>
              <li>Focus tags: {post.tags.join(", ")}</li>
            </ul>
          </div>
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-extrabold mb-2 uppercase tracking-wide text-slate-200">
              Quick Action
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed mb-3">
              Save this page, apply the checklist, and review once per week.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-bold hover:bg-slate-200 transition"
            >
              Browse more blogs
            </Link>
          </div>
        </section>

        <div className="space-y-6">
          {post.content.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              paragraphs={section.paragraphs}
              list={section.list}
            />
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">FAQs</h2>
          <div className="space-y-3">
            {post.faqs.map((faq, index) => (
              <details
                key={index}
                className="group bg-white border border-slate-200 rounded-xl p-4"
              >
                <summary className="cursor-pointer font-bold text-slate-800">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Related Posts
            </h2>
            <Link href="/blog" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="text-xs text-slate-500 mb-2">{item.category}</div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
