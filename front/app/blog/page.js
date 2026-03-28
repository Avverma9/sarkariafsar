"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchBlogs } from "../../store/slices/blogSlice";
import Header from "../components/header";
import Footer from "../components/footer";
import Breadcrumb from "../components/Breadcrumb";

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  SSC:       { bg: "#fff3e0", color: "#e65100" },
  UPSC:      { bg: "#fce4ec", color: "#c62828" },
  Banking:   { bg: "#e8f5e9", color: "#2e7d32" },
  Railway:   { bg: "#e3f2fd", color: "#1565c0" },
  Defence:   { bg: "#ede7f6", color: "#4527a0" },
  Admission: { bg: "#f3e5f5", color: "#6a1b9a" },
};
const catStyle = (cat = "") => CAT_COLORS[cat] ?? { bg: "#f5f3f0", color: "#666" };

const GRADIENTS = [
  "linear-gradient(135deg,#1a1a1a,#2d2d2d)",
  "linear-gradient(135deg,#e65100,#ff8f00)",
  "linear-gradient(135deg,#1a237e,#283593)",
  "linear-gradient(135deg,#1b5e20,#388e3c)",
  "linear-gradient(135deg,#4a148c,#6a1b9a)",
  "linear-gradient(135deg,#880e4f,#c2185b)",
];

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = () => (
  <div className="bp-list">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bp-shimmer-row" style={{ animationDelay: `${i * 0.05}s` }}>
        <div className="bp-shimmer-content">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="bp-shimmer-bar" style={{ width: 64, height: 20, borderRadius: 999 }} />
            <div className="bp-shimmer-bar" style={{ width: 52, height: 20, borderRadius: 999 }} />
          </div>
          <div className="bp-shimmer-bar" style={{ width: "70%", height: 15, marginBottom: 8 }} />
          <div className="bp-shimmer-bar" style={{ width: "92%", height: 11, marginBottom: 5 }} />
          <div className="bp-shimmer-bar" style={{ width: "65%", height: 11, marginBottom: 14 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="bp-shimmer-bar" style={{ width: 80, height: 10 }} />
            <div className="bp-shimmer-bar" style={{ width: 60, height: 10 }} />
          </div>
        </div>
        <div className="bp-shimmer-thumb" />
      </div>
    ))}
  </div>
);

// ─── Blog row ─────────────────────────────────────────────────────────────────
function BlogRow({ blog, index }) {
  const cs   = catStyle(blog.category);
  const grad = GRADIENTS[index % GRADIENTS.length];
  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <article className="bp-row" style={{ animationDelay: `${index * 0.055}s` }}>
      {/* Index */}
      <span className="bp-index">{String(index + 1).padStart(2, "0")}</span>

      {/* Content */}
      <div className="bp-content">
        <div className="bp-meta-row">
          {blog.category && (
            <span className="bp-cat-badge" style={{ background: cs.bg, color: cs.color }}>
              {blog.category}
            </span>
          )}
          {blog.readingTime && (
            <span className="bp-read-time">⏱ {blog.readingTime}</span>
          )}
        </div>

        <h2 className="bp-title">
          <Link href={`/blog/${blog.slug}`} className="bp-title-link">
            {blog.title}
          </Link>
        </h2>

        {blog.excerpt && <p className="bp-excerpt">{blog.excerpt}</p>}

        <div className="bp-foot">
          <div className="bp-author-row">
            <span className="bp-author-dot">{(blog.author || "S")[0].toUpperCase()}</span>
            <span className="bp-author-name">{blog.author || "SarkariAfsar"}</span>
          </div>
          {date && <span className="bp-date">{date}</span>}
        </div>
      </div>

      {/* Thumbnail */}
      <Link href={`/blog/${blog.slug}`} className="bp-thumb" style={{ background: grad }} tabIndex={-1} aria-hidden="true">
        {blog.thumbnail
          ? <img src={blog.thumbnail} alt={blog.title} className="bp-thumb-img" />
          : <span className="bp-thumb-label">{blog.category || "Blog"}</span>
        }
      </Link>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const dispatch = useDispatch();
  const { items, loading, page: currentPage, limit: currentLimit, total } = useSelector((s) => s.blog);
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(currentPage ?? 1);
  const [limit] = useState(10);

  // keep local page in sync if store provides a page value
  useEffect(() => {
    if (typeof currentPage === 'number' && currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    dispatch(fetchBlogs({ page, limit }));
  }, [dispatch, page, limit]);

  // Scroll to top when the active page changes so new results start at viewport top
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (document && document.documentElement) document.documentElement.scrollTop = 0;
      if (document && document.body) document.body.scrollTop = 0;
    } catch (e) {
      // swallow for older browsers
      try { window.scrollTo(0, 0); } catch (__) {}
    }
  }, [page]);

  const blogs = Array.isArray(items) ? items : [];

  // Derive unique categories
  const categories = ["All", ...Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))];

  const filtered = activeCategory === "All"
    ? blogs
    : blogs.filter((b) => b.category === activeCategory);

  const totalPages = total && limit ? Math.max(1, Math.ceil(total / limit)) : 1;

  return (
    <>
      <style>{css}</style>

      <div className="bp-page">
        <Header />

        {/* ── Hero ── */}
        <section className="bp-hero">
          <div className="bp-hero-grid" aria-hidden="true" />
          <div className="bp-hero-glow"  aria-hidden="true" />
          <div className="bp-hero-inner">
            <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Blog & Guides" }]} />
            <span className="bp-hero-eyebrow">✦ Knowledge Hub</span>
            <h1 className="bp-hero-title">Sarkari Guide &amp; Blog</h1>
            <p className="bp-hero-sub">
              In-depth guides, insights aur practical tips — government jobs, schemes, aur exams ke baare mein.
            </p>
            <div className="bp-hero-pills">
              <Link href="/jobpost" className="bp-hero-pill">💼 Jobs &amp; Updates</Link>
              <Link href="/schemes" className="bp-hero-pill">🏛️ Govt Schemes</Link>
            </div>
          </div>
        </section>

        {/* ── Main ── */}
        <main className="bp-main">
          <div className="bp-container">

            {/* Title row */}
            <div className="bp-title-row">
              <div>
                <span className="bp-section-eyebrow">✦ Editorial</span>
                <h2 className="bp-section-title">All Articles</h2>
              </div>
              {filtered.length > 0 && (
                <span className="bp-count-badge">{filtered.length} articles</span>
              )}
            </div>

            {/* Category filter */}
            {!loading && categories.length > 1 && (
              <div className="bp-filter-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`bp-filter-btn${activeCategory === cat ? " bp-filter-active" : ""}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* List */}
            {loading ? (
              <Shimmer />
            ) : filtered.length === 0 ? (
              <div className="bp-empty">
                <span>📭</span>
                <p>Is category mein koi article nahi mila.</p>
                <button className="bp-empty-reset" onClick={() => setActiveCategory("All")}>
                  Sab dekhein
                </button>
              </div>
            ) : (
              <div className="bp-list">
                {filtered.map((blog, i) => (
                  <BlogRow key={blog._id || blog.slug} blog={blog} index={i} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && total > limit && (
              <div className="bp-pager">
                <button
                  className="bp-pager-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>

                <div className="bp-pager-info">Page {page} of {totalPages}</div>

                <button
                  className="bp-pager-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            )}

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700;800&family=DM+Sans:wght@400;500;600&family=Lora:wght@400;500&display=swap');

  .bp-page {
    min-height: 100vh; display: flex; flex-direction: column;
    background: #f7f5f0; font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .bp-hero {
    background: #1a1a1a;
    padding: 52px 24px 58px;
    position: relative; overflow: hidden;
  }
  .bp-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px; pointer-events: none;
  }
  .bp-hero-glow {
    position: absolute; right: -60px; top: -60px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(230,81,0,0.16) 0%, transparent 65%);
    pointer-events: none;
  }
  .bp-hero-inner {
    max-width: 1200px; margin: 0 auto;
    position: relative; z-index: 2; max-width: 640px;
  }
  .bp-hero-eyebrow {
    display: block; font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #e65100; margin-bottom: 12px;
  }
  .bp-hero-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.9rem, 4vw, 2.9rem);
    font-weight: 800; letter-spacing: -0.04em;
    color: #fff; line-height: 1.1; margin: 0 0 14px;
  }
  .bp-hero-sub {
    font-size: 0.9rem; color: #888; line-height: 1.7;
    margin: 0 0 24px; max-width: 500px;
  }
  .bp-hero-pills { display: flex; gap: 10px; flex-wrap: wrap; }
  .bp-hero-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 18px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: #ccc; border-radius: 999px;
    font-size: 0.82rem; font-weight: 500; text-decoration: none;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
  }
  .bp-hero-pill:hover {
    background: rgba(230,81,0,0.15);
    border-color: rgba(230,81,0,0.4); color: #ff8c42;
  }

  /* ── Main ── */
  .bp-main { flex: 1; padding: 48px 24px 64px; }
  .bp-container { max-width: 900px; margin: 0 auto; }

  /* Title row */
  .bp-title-row {
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 16px;
    margin-bottom: 20px; padding-bottom: 20px;
    border-bottom: 1.5px solid rgba(0,0,0,0.08);
  }
  .bp-section-eyebrow {
    display: block; font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: #e65100; margin-bottom: 5px;
  }
  .bp-section-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.2rem, 2.5vw, 1.55rem);
    font-weight: 800; letter-spacing: -0.03em; color: #1a1a1a; margin: 0;
  }
  .bp-count-badge {
    font-size: 0.72rem; font-weight: 700;
    background: #fff3e0; color: #e65100;
    padding: 5px 12px; border-radius: 999px; white-space: nowrap;
  }

  /* Filter */
  .bp-filter-wrap {
    display: flex; flex-wrap: wrap; gap: 7px;
    margin-bottom: 28px; padding: 14px 16px;
    background: #fff; border: 1.5px solid rgba(0,0,0,0.07); border-radius: 12px;
  }
  .bp-filter-btn {
    padding: 6px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 600;
    border-radius: 8px; border: 1.5px solid #e8e4df;
    background: #faf9f7; color: #666;
    cursor: pointer; transition: all 0.16s; white-space: nowrap;
  }
  .bp-filter-btn:hover { border-color: #e65100; color: #e65100; background: #fff5eb; }
  .bp-filter-active { background: #1a1a1a !important; color: #fff !important; border-color: #1a1a1a !important; }

  /* ── List ── */
  .bp-list { display: flex; flex-direction: column; }

  /* ── Row ── */
  .bp-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    border-radius: 10px; margin: 0 -10px;
    animation: bp-rise 0.42s ease both;
    transition: background 0.16s;
  }
  .bp-row:last-child { border-bottom: none; }
  .bp-row:hover { background: #fdf8f5; }
  @keyframes bp-rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Index */
  .bp-index {
    font-family: 'Roboto', sans-serif;
    font-size: 0.7rem; font-weight: 800;
    color: #e0dbd5; letter-spacing: 0.04em;
    flex-shrink: 0; width: 24px; padding-top: 4px;
    transition: color 0.18s;
  }
  .bp-row:hover .bp-index { color: #e65100; }

  /* Content */
  .bp-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .bp-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .bp-cat-badge {
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 999px;
  }
  .bp-read-time { font-size: 0.7rem; color: #bbb; font-weight: 500; }

  .bp-title {
    font-family: 'Roboto', sans-serif;
    font-size: 0.95rem; font-weight: 800;
    letter-spacing: -0.015em; color: #1a1a1a; line-height: 1.3; margin: 0;
  }
  .bp-title-link {
    color: inherit; text-decoration: none;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    transition: color 0.16s;
  }
  .bp-title-link:hover { color: #e65100; }

  .bp-excerpt {
    font-family: 'Lora', Georgia, serif;
    font-size: 0.8rem; color: #999; line-height: 1.65; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .bp-foot {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap;
    gap: 8px; margin-top: 2px;
  }
  .bp-author-row { display: flex; align-items: center; gap: 7px; }
  .bp-author-dot {
    width: 20px; height: 20px; background: #1a1a1a; color: #fff;
    border-radius: 5px; display: flex; align-items: center; justify-content: center;
    font-family: 'Roboto', sans-serif; font-size: 0.58rem; font-weight: 800;
  }
  .bp-author-name { font-size: 0.72rem; font-weight: 600; color: #888; }
  .bp-date { font-size: 0.7rem; color: #ccc; }

  /* Thumbnail */
  .bp-thumb {
    flex-shrink: 0; width: 90px; height: 74px;
    border-radius: 10px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    text-decoration: none;
  }
  .bp-thumb-img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.35s ease;
  }
  .bp-row:hover .bp-thumb-img { transform: scale(1.06); }
  .bp-thumb-label {
    font-family: 'Roboto', sans-serif;
    font-size: 0.55rem; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); text-align: center; padding: 4px;
  }

  /* ── Empty ── */
  .bp-empty {
    display: flex; flex-direction: column;
    align-items: center; gap: 10px;
    padding: 60px 24px; color: #bbb;
    font-size: 0.88rem; text-align: center;
  }
  .bp-empty span { font-size: 2.4rem; }
  .bp-empty p { margin: 0; }
  .bp-empty-reset {
    margin-top: 8px; padding: 8px 20px;
    background: #1a1a1a; color: #fff;
    border: none; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 600;
    cursor: pointer; transition: background 0.18s;
  }
  .bp-empty-reset:hover { background: #e65100; }

  /* ── Shimmer ── */
  .bp-shimmer-row {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    animation: bp-rise 0.42s ease both;
  }
  .bp-shimmer-content { flex: 1; }
  .bp-shimmer-bar {
    border-radius: 6px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: bp-wave 1.4s ease-in-out infinite;
  }
  .bp-shimmer-thumb {
    flex-shrink: 0; width: 90px; height: 74px;
    border-radius: 10px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: bp-wave 1.4s ease-in-out infinite;
  }
  @keyframes bp-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Responsive ── */
  @media (max-width: 540px) {
    .bp-index   { display: none; }
    .bp-excerpt { display: none; }
    .bp-thumb   { width: 72px; height: 60px; }
    .bp-hero    { padding: 40px 16px 44px; }
  }

  /* Pagination */
  .bp-pager {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    margin: 26px 0 6px; padding-top: 8px;
  }
  .bp-pager-btn {
    padding: 8px 14px; border-radius: 8px; border: 1px solid #e8e4df;
    background: #fff; color: #1a1a1a; font-weight: 700; cursor: pointer;
  }
  .bp-pager-btn[disabled] { opacity: 0.45; cursor: default; }
  .bp-pager-info { color: #666; font-weight: 600; }
`;