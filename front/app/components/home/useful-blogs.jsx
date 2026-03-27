"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogs } from "../../../store/slices/blogSlice";

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = () => (
  <div className="ub-list">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="ub-shimmer-row" style={{ animationDelay: `${i * 0.06}s` }}>
        <div className="ub-shimmer-num" />
        <div className="ub-shimmer-body">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="ub-shimmer-bar" style={{ width: 60, height: 19, borderRadius: 999 }} />
            <div className="ub-shimmer-bar" style={{ width: 48, height: 19, borderRadius: 999 }} />
          </div>
          <div className="ub-shimmer-bar" style={{ width: "72%", height: 14, marginBottom: 8 }} />
          <div className="ub-shimmer-bar" style={{ width: "90%", height: 11, marginBottom: 5 }} />
          <div className="ub-shimmer-bar" style={{ width: "60%", height: 11 }} />
        </div>
        <div className="ub-shimmer-thumb-sq" />
      </div>
    ))}
  </div>
);

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  "SSC":       { bg: "#fff3e0", color: "#e65100" },
  "UPSC":      { bg: "#fce4ec", color: "#c62828" },
  "Banking":   { bg: "#e8f5e9", color: "#2e7d32" },
  "Railway":   { bg: "#e3f2fd", color: "#1565c0" },
  "Defence":   { bg: "#ede7f6", color: "#4527a0" },
  "Admission": { bg: "#f3e5f5", color: "#6a1b9a" },
};
const catStyle = (cat = "") => CAT_COLORS[cat] ?? { bg: "#f5f3f0", color: "#666" };

const GRADIENTS = [
  "linear-gradient(135deg,#1a1a1a,#333)",
  "linear-gradient(135deg,#e65100,#ff8f00)",
  "linear-gradient(135deg,#1a237e,#283593)",
  "linear-gradient(135deg,#1b5e20,#388e3c)",
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function UsefulBlogs() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.blog);

  useEffect(() => { dispatch(fetchBlogs({ page: 1, limit: 8 })); }, [dispatch]);

  const blogs = Array.isArray(items) ? items.slice(0, 8) : [];

  return (
    <>
      <style>{css}</style>

      <section className="ub-shell">

        {/* Heading */}
        <div className="ub-heading-row">
          <div>
            <span className="ub-eyebrow">✦ Editorial</span>
            <h2 className="ub-title">Useful Blogs</h2>
          </div>
          <Link href="/blog" className="ub-view-all">
            Sab Blogs Dekhein
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* List */}
        {loading ? <Shimmer /> : blogs.length === 0 ? null : (
          <div className="ub-list">
            {blogs.map((blog, i) => {
              const cs   = catStyle(blog.category);
              const grad = GRADIENTS[i % GRADIENTS.length];
              const date = blog.publishedAt
                ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })
                : null;

              return (
                <article
                  key={blog._id || blog.slug}
                  className="ub-row"
                  style={{ animationDelay: `${i * 0.065}s` }}
                >
                  {/* Index */}
                  <span className="ub-index">{String(i + 1).padStart(2, "0")}</span>

                  {/* Content */}
                  <div className="ub-content">
                    <div className="ub-meta-row">
                      {blog.category && (
                        <span className="ub-cat-badge" style={{ background: cs.bg, color: cs.color }}>
                          {blog.category}
                        </span>
                      )}
                      {blog.readingTime && (
                        <span className="ub-read-time">⏱ {blog.readingTime}</span>
                      )}
                    </div>

                    <h3 className="ub-blog-title">
                      <Link href={`/blog/${blog.slug}`} className="ub-blog-link">
                        {blog.title}
                      </Link>
                    </h3>

                    {blog.excerpt && (
                      <p className="ub-excerpt">{blog.excerpt}</p>
                    )}

                    <div className="ub-foot">
                      <div className="ub-author-row">
                        <span className="ub-author-dot">
                          {(blog.author || "S")[0].toUpperCase()}
                        </span>
                        <span className="ub-author-name">{blog.author || "SarkariPortal"}</span>
                      </div>
                      {date && <span className="ub-date">{date}</span>}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="ub-thumb"
                    style={{ background: grad }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {blog.thumbnail
                      ? <img src={blog.thumbnail} alt={blog.title} className="ub-thumb-img" />
                      : <span className="ub-thumb-label">{blog.category || "Blog"}</span>
                    }
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && blogs.length > 0 && (
          <div className="ub-bottom-cta">
            <Link href="/blog" className="ub-cta-btn">
              Aur Blogs Padein
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=DM+Sans:wght@400;500;600&family=Lora:wght@400;500&display=swap');

  .ub-shell {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    max-width: 1120px;
    margin: 0 auto 56px;
  }

  /* ── Heading ── */
  .ub-heading-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 6px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid rgba(0,0,0,0.08);
  }
  .ub-eyebrow {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #e65100;
    margin-bottom: 5px;
  }
  .ub-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.25rem, 2.5vw, 1.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin: 0;
  }
  .ub-view-all {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e65100;
    text-decoration: none;
    padding: 7px 14px;
    border: 1.5px solid rgba(230,81,0,0.25);
    border-radius: 8px;
    white-space: nowrap;
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
  }
  .ub-view-all:hover { background:#fff5eb; border-color:#e65100; transform:translateY(-1px); }

  /* ── List ── */
  .ub-list { display: flex; flex-direction: column; }

  /* ── Row ── */
  .ub-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    border-radius: 10px;
    margin: 0 -10px;
    animation: ub-rise 0.42s ease both;
    transition: background 0.16s;
  }
  .ub-row:last-child { border-bottom: none; }
  .ub-row:hover { background: #fdf8f5; }

  @keyframes ub-rise {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Index */
  .ub-index {
    font-family: 'Roboto', sans-serif;
    font-size: 0.7rem;
    font-weight: 800;
    color: #e0dbd5;
    letter-spacing: 0.04em;
    flex-shrink: 0;
    width: 24px;
    padding-top: 4px;
    transition: color 0.18s;
  }
  .ub-row:hover .ub-index { color: #e65100; }

  /* Content */
  .ub-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ub-meta-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  .ub-cat-badge {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
  }
  .ub-read-time { font-size: 0.7rem; color: #bbb; font-weight: 500; }

  .ub-blog-title {
    font-family: 'Roboto', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: -0.015em;
    color: #1a1a1a;
    line-height: 1.3;
    margin: 0;
  }
  .ub-blog-link {
    color: inherit;
    text-decoration: none;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.16s;
  }
  .ub-blog-link:hover { color: #e65100; }

  .ub-excerpt {
    font-family: 'Lora', Georgia, serif;
    font-size: 0.8rem;
    color: #999;
    line-height: 1.65;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ub-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
  }
  .ub-author-row { display:flex; align-items:center; gap:7px; }
  .ub-author-dot {
    width: 20px; height: 20px;
    background: #1a1a1a;
    color: #fff;
    border-radius: 5px;
    display: flex; align-items:center; justify-content:center;
    font-family: 'Roboto', sans-serif;
    font-size: 0.58rem;
    font-weight: 800;
  }
  .ub-author-name { font-size:0.72rem; font-weight:600; color:#888; }
  .ub-date        { font-size:0.7rem; color:#ccc; }

  /* Thumbnail */
  .ub-thumb {
    flex-shrink: 0;
    width: 90px;
    height: 74px;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }
  .ub-thumb-img {
    width:100%; height:100%;
    object-fit:cover;
    transition: transform 0.35s ease;
  }
  .ub-row:hover .ub-thumb-img { transform:scale(1.06); }
  .ub-thumb-label {
    font-family: 'Roboto', sans-serif;
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    text-align: center;
    padding: 4px;
  }

  /* ── Bottom CTA ── */
  .ub-bottom-cta { display:flex; justify-content:center; margin-top:28px; }
  .ub-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 11px 28px;
    background: #1a1a1a;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 3px 14px rgba(0,0,0,0.14);
  }
  .ub-cta-btn:hover {
    background: #e65100;
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(230,81,0,0.28);
  }

  /* ── Shimmer ── */
  .ub-shimmer-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    animation: ub-rise 0.42s ease both;
  }
  .ub-shimmer-num {
    width: 24px; height: 12px;
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 4px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: ub-wave 1.4s ease-in-out infinite;
  }
  .ub-shimmer-body { flex:1; }
  .ub-shimmer-bar {
    border-radius: 6px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: ub-wave 1.4s ease-in-out infinite;
  }
  .ub-shimmer-thumb-sq {
    flex-shrink: 0;
    width: 90px; height: 74px;
    border-radius: 10px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: ub-wave 1.4s ease-in-out infinite;
  }
  @keyframes ub-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 480px) {
    .ub-index   { display: none; }
    .ub-thumb   { width: 72px; height: 60px; }
    .ub-excerpt { display: none; }
  }
`;