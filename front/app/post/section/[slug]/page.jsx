"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchSectionPosts } from "../../../../store/slices/postsSlice";
import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Breadcrumb from "../../../components/Breadcrumb";

const SECTION_CONFIG = {
  "recent-admit-cards": { icon: "🪪", label: "Admit Cards",  accent: "#e65100" },
  "latest-gov-jobs":    { icon: "💼", label: "Latest Jobs",  accent: "#1a1a1a" },
  "results":            { icon: "📊", label: "Results",       accent: "#e65100" },
  "admission":          { icon: "🎓", label: "Admissions",    accent: "#1a1a1a" },
};

export default function SectionPostsPage() {
  const { slug } = useParams();
  const dispatch  = useDispatch();
  const { sectionPosts, sectionPostsLoading, sectionPostsError, activeSectionSlug } =
    useSelector((s) => s.posts);

  // 404 for any slug not in SECTION_CONFIG
  if (!SECTION_CONFIG[slug]) notFound();

  const config = SECTION_CONFIG[slug];

  useEffect(() => {
    dispatch(fetchSectionPosts(slug));
  }, [slug, dispatch]);

  // While navigating between sections keep stale data hidden
  const posts = activeSectionSlug === slug ? sectionPosts : [];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />
      <style>{css}</style>

      {/* Hero */}
      <section className="sp-hero" style={{ "--accent": config.accent }}>
        <div className="sp-hero-inner">
          <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "All Sections", href: "/post" }, { label: config.label }]} />

          <div className="sp-hero-icon">{config.icon}</div>
          <h1 className="sp-hero-title">{config.label}</h1>
          <p className="sp-hero-sub">
            All posts in this section — latest first
          </p>
        </div>
      </section>

      <main className="sp-main">
        {/* Heading row */}
        <div className="sp-heading-row">
          <div className="sp-heading-left">
            <span className="sp-eyebrow">
              <span className="sp-live-dot" />
              Live Updates
            </span>
            <h2 className="sp-title">{config.label}</h2>
          </div>
          {sectionPostsError && (
            <button
              onClick={() => dispatch(fetchSectionPosts(slug))}
              className="sp-error-badge"
            >
              ⚠ Retry
            </button>
          )}
        </div>

        {sectionPostsLoading ? (
          <Shimmer />
        ) : sectionPostsError ? (
          <div className="sp-empty">
            <span>⚠️</span>
            <p>Failed to load posts</p>
            <button className="sp-retry-btn" onClick={() => dispatch(fetchSectionPosts(slug))}>
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="sp-empty">
            <span>📭</span>
            <p>No posts found in this section</p>
          </div>
        ) : (
          <>
            <p className="sp-count">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
            <ul className="sp-list">
              {posts.map((post, i) => (
                <li key={post._id || i} className="sp-item">
                  <Link href={`/post/${post.slug}`} className="sp-link">
                    <span className="sp-bullet" />
                    <span className="sp-post-title">{post.title}</span>
                    {i < 3 && <span className="sp-new-badge">New</span>}
                    <span className="sp-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

const Shimmer = () => (
  <ul className="sp-list">
    {Array.from({ length: 12 }).map((_, i) => (
      <li key={i} className="sp-item">
        <div className="sp-shimmer-row">
          <div className="sp-shimmer-dot" />
          <div className={`sp-shimmer-bar ${i % 3 === 0 ? "w70" : i % 3 === 1 ? "w85" : "w60"}`} />
        </div>
      </li>
    ))}
  </ul>
);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  /* Hero */
  .sp-hero {
    background: var(--accent, #1a1a1a);
    padding: 80px 24px 36px;
    position: relative;
  }
  .sp-hero-inner { max-width: 900px; margin: 0 auto; }

  .sp-hero-icon { font-size: 2.4rem; margin-bottom: 8px; }
  .sp-hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.6rem, 4vw, 2.4rem);
    font-weight: 800;
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: -0.03em;
    text-transform: capitalize;
  }
  .sp-hero-sub { color: rgba(255,255,255,0.65); font-size: 0.9rem; margin: 0; }

  /* Main */
  .sp-main {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    padding: 32px 24px 48px;
  }

  /* Heading row */
  .sp-heading-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;
  }
  .sp-heading-left { display: flex; flex-direction: column; gap: 6px; }
  .sp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e65100;
  }
  .sp-live-dot {
    width: 7px; height: 7px;
    background: #e65100;
    border-radius: 50%;
    animation: sp-blink 1.6s ease-in-out infinite;
  }
  @keyframes sp-blink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.7); }
  }
  .sp-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin: 0;
    text-transform: capitalize;
  }
  .sp-error-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    padding: 5px 12px;
    border-radius: 999px;
    cursor: pointer;
  }
  .sp-count {
    font-size: 0.75rem;
    color: #999;
    margin: 0 0 14px;
    font-weight: 500;
  }

  /* List */
  .sp-list {
    list-style: none;
    margin: 0;
    padding: 0;
    background: #fff;
    border: 1.5px solid rgba(0,0,0,0.07);
    border-radius: 14px;
    overflow: hidden;
  }
  .sp-item { border-bottom: 1px solid #f5f3f0; }
  .sp-item:last-child { border-bottom: none; }
  .sp-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 18px;
    text-decoration: none;
    transition: background 0.16s;
  }
  .sp-link:hover { background: #fdf8f5; }
  .sp-bullet {
    width: 5px; height: 5px;
    background: #e65100;
    border-radius: 50%;
    flex-shrink: 0;
    opacity: 0.5;
    transition: opacity 0.16s, transform 0.16s;
  }
  .sp-link:hover .sp-bullet { opacity: 1; transform: scale(1.4); }
  .sp-post-title {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: #444;
    line-height: 1.5;
    transition: color 0.16s;
  }
  .sp-link:hover .sp-post-title { color: #1a1a1a; }
  .sp-new-badge {
    flex-shrink: 0;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: #e65100;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    animation: sp-blink 2s ease-in-out infinite;
  }
  .sp-arrow {
    flex-shrink: 0;
    font-size: 0.72rem;
    color: #bbb;
    transition: color 0.16s, transform 0.16s;
  }
  .sp-link:hover .sp-arrow { color: #e65100; transform: translateX(3px); }

  /* Empty / Error */
  .sp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 64px 16px;
    color: #bbb;
    font-size: 0.85rem;
    text-align: center;
  }
  .sp-empty span { font-size: 2rem; }
  .sp-empty p { margin: 0; }
  .sp-retry-btn {
    margin-top: 8px;
    padding: 8px 20px;
    background: #e65100;
    color: #fff;
    border: none;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
  }

  /* Shimmer */
  .sp-shimmer-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 18px;
  }
  .sp-shimmer-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #e8e4df;
    flex-shrink: 0;
    animation: sp-wave 1.4s ease-in-out infinite;
  }
  .sp-shimmer-bar {
    height: 11px;
    border-radius: 5px;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: sp-wave 1.4s ease-in-out infinite;
    flex: 1;
  }
  .w60 { max-width: 60%; }
  .w70 { max-width: 70%; }
  .w85 { max-width: 85%; }
  @keyframes sp-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
