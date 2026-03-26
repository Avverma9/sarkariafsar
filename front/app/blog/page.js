"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogs } from "../../store/slices/blogSlice";
import Header from "../components/header";
import Footer from "../components/footer";
import Breadcrumb from "../components/Breadcrumb";

function ShimmerCard() {
  return (
    <div className="animate-pulse bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/4" />
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-5/6" />
    </div>
  );
}

export default function BlogPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.blog);

  useEffect(() => {
    dispatch(fetchBlogs({ page: 1, limit: 30 }));
  }, [dispatch]);

  const blogs = Array.isArray(items) ? items : [];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Blog & Guides" }]} />
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              Knowledge Hub
            </span>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Sarkari Guide &amp; Blog
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              In-depth guides, insights, and practical tips on government jobs, schemes, and exams.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/jobpost" className="inline-block px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-full transition-colors">
                💼 Jobs & Updates
              </Link>
              <Link href="/schemes" className="inline-block px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-full transition-colors">
                🏛 Govt Schemes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">All Articles</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Guides, insights, and updates on government jobs and schemes
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <ShimmerCard key={i} />)}
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-20">No blogs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <article
                key={blog._id || blog.slug}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded">
                    {blog.category}
                  </span>
                  <span>{blog.readingTime}</span>
                </div>

                <h2 className="text-base font-semibold text-slate-900 leading-snug">
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="hover:text-indigo-600 hover:underline underline-offset-4"
                  >
                    {blog.title}
                  </Link>
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {blog.excerpt}
                </p>

                <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                  <span>{blog.author}</span>
                  {blog.publishedAt && (
                    <span>
                      {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

