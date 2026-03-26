"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogs } from "../../../store/slices/blogSlice";

export default function UsefulBlogs() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.blog);

  useEffect(() => {
    dispatch(fetchBlogs({ page: 1, limit: 4 }));
  }, [dispatch]);

  const blogs = Array.isArray(items) ? items.slice(0, 4) : [];

  return (
    <section className="mb-12 w-full max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b-2 border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Useful Blogs
        </h2>
        <Link
          href="/blog"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline underline-offset-4"
        >
          See All Blogs &rarr;
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-lg p-5">
              <div className="h-3 bg-slate-200 rounded w-1/4 mb-3"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-1"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? null : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
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

              <h3 className="text-base font-semibold text-slate-900 leading-snug">
                <Link
                  href={`/blog/${blog.slug}`}
                  className="hover:text-blue-700 hover:underline underline-offset-4 decoration-blue-300"
                >
                  {blog.title}
                </Link>
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
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

      <div className="mt-6 text-center">
        <Link
          href="/blog"
          className="inline-block px-6 py-2 border border-slate-800 text-slate-800 text-sm font-semibold rounded hover:bg-slate-800 hover:text-white transition-colors"
        >
          See All Blogs
        </Link>
      </div>
    </section>
  );
}
