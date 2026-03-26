"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogBySlug } from "../../../store/slices/blogSlice";
import Header from "../../components/header";
import Footer from "../../components/footer";
import Breadcrumb from "../../components/Breadcrumb";
import EditorialSummary from "../../components/EditorialSummary";
import OfficialSourceBox from "../../components/OfficialSourceBox";

function extractFirstUrl(text = "") {
  const match = String(text).match(/https?:\/\/[^\s)\]">]+/i);
  return match ? match[0] : null;
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, blogLoading, blogError } = useSelector((s) => s.blog);

  useEffect(() => {
    if (slug) dispatch(fetchBlogBySlug(slug));
  }, [dispatch, slug]);

  if (blogLoading) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-40 bg-slate-100 rounded" />
        </main>
        <Footer />
      </>
    );
  }

  if (blogError) {
    return (
      <>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-red-500 mb-4">Failed to load: {blogError}</p>
          <Link href="/blog" className="text-indigo-600 hover:underline">← Back to Blog</Link>
        </main>
        <Footer />
      </>
    );
  }

  if (!currentBlog) return null;

  const _raw = currentBlog.data ?? currentBlog;
  const blog = Array.isArray(_raw) ? _raw[0] : _raw;
  if (!blog) return null;

  const blogText = [
    blog.title,
    blog.excerpt,
    blog.intro,
    ...(Array.isArray(blog.sections)
      ? blog.sections.flatMap((section) => [
          section.heading,
          ...(Array.isArray(section.paragraphs) ? section.paragraphs : []),
          ...(Array.isArray(section.bullets) ? section.bullets : []),
        ])
      : []),
  ]
    .filter(Boolean)
    .join("\n");

  const blogSourceUrl =
    blog.sourceUrl ||
    blog.referenceUrl ||
    blog.officialUrl ||
    blog.externalUrl ||
    extractFirstUrl(blogText);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Breadcrumb
          theme="light"
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: blog.title || slug },
          ]}
        />

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {blog.category && (
            <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded">
              {blog.category}
            </span>
          )}
          {blog.readingTime && (
            <span className="text-xs text-slate-500">{blog.readingTime}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug mb-3">
          {blog.title}
        </h1>

        {/* Author & date */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-200">
          {blog.author && <span>{blog.author}</span>}
          {blog.publishedAt && (
            <span>
              {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Intro */}
        {blog.intro && (
          <p className="text-slate-700 text-base leading-relaxed mb-8 font-medium">
            {blog.intro}
          </p>
        )}

        <EditorialSummary
          title={blog.title || slug}
          sectionLabel={blog.category || "Blog article"}
          authorName={blog.author || "SarkariAfsar Editorial"}
          published={blog.publishedAt}
          lastUpdated={blog.updatedAt || blog.lastModified}
          rawText={blogText}
          facts={[
            ...(blog.readingTime ? [{ label: "Reading Time", value: blog.readingTime }] : []),
            ...(Array.isArray(blog.tags) && blog.tags.length ? [{ label: "Tags", value: blog.tags.slice(0, 3).join(', ') }] : []),
          ]}
          mode="blog"
        />

        <OfficialSourceBox
          title="Editorial Source Check"
          description={
            blogSourceUrl
              ? "This article is written by the SarkariAfsar editorial desk. Use the linked reference alongside the article if you need to confirm a department, policy, or exam-related claim."
              : "This article is an original editorial explainer. No external official notification URL is stored in this record, so verify policy-sensitive claims on the relevant department site if needed."
          }
          links={blogSourceUrl ? [{ label: "Open referenced source", href: blogSourceUrl }] : []}
          facts={[
            { label: "Content Type", value: blog.category || "Editorial article" },
            { label: "Author", value: blog.author || "SarkariAfsar Editorial" },
            { label: "Published", value: blog.publishedAt, formatAsDate: true },
            { label: "Updated", value: blog.updatedAt || blog.lastModified, formatAsDate: true },
          ]}
          mode="blog"
        />

        {/* Sections */}
        {Array.isArray(blog.sections) && blog.sections.length > 0 && (
          <div className="space-y-8">
            {blog.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                    {section.heading}
                  </h2>
                )}

                {Array.isArray(section.paragraphs) &&
                  section.paragraphs.map((para, j) => (
                    <p key={j} className="text-slate-600 text-sm leading-relaxed mb-3">
                      {para}
                    </p>
                  ))}

                {Array.isArray(section.bullets) && section.bullets.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {section.bullets.map((bullet, k) => (
                      <li
                        key={k}
                        className="flex gap-2 text-sm text-slate-600 leading-relaxed"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
