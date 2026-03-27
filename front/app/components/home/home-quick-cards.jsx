"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchPostsBySection } from "../../../store/slices/postsSlice";

// ─── Section config ────────────────────────────────────────────────────────────
const SECTION_CONFIG = {
  "recent-admit-cards": { icon: "🪪", label: "Admit Cards",     accent: "#e65100" },
  "latest-gov-jobs":    { icon: "💼", label: "Latest Jobs",      accent: "#1a1a1a" },
  "results":            { icon: "📊", label: "Results",          accent: "#e65100" },
  "admission":          { icon: "🎓", label: "Admissions",       accent: "#1a1a1a" },
};
const PREFERRED_ORDER = Object.keys(SECTION_CONFIG);

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = () => (
  <>
    <style>{shimmerCss}</style>
    <div className="hqc-grid">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="hqc-card" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="hqc-card-head shimmer-head">
            <div className="shimmer-bar w60" />
          </div>
          <div className="hqc-card-body">
            {Array.from({ length: 8 }).map((_, j) => (
              <div key={j} className="shimmer-row">
                <div className="shimmer-dot" />
                <div className={`shimmer-bar ${j % 3 === 0 ? "w80" : j % 3 === 1 ? "w90" : "w70"}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomeQuickCards() {
  const dispatch = useDispatch();
  const { bySection, bySectionLoading, bySectionError } = useSelector(
    (s) => s.posts
  );

  useEffect(() => { dispatch(fetchPostsBySection()); }, [dispatch]);

  const sections = Array.isArray(bySection) && bySection.length
    ? PREFERRED_ORDER
        .map((canon) => bySection.find((s) => s.sectionCanonicalUrl === canon))
        .filter(Boolean)
    : [];

  if (bySectionLoading) return <Shimmer />;

  return (
    <>
      <style>{css}</style>

      <section className="hqc-shell">

        {/* Section heading */}
        <div className="hqc-heading-row">
          <div className="hqc-heading-left">
            <span className="hqc-eyebrow">
              <span className="hqc-live-dot" />
              Live Updates
            </span>
            <h2 className="hqc-title">Government Job Updates</h2>
          </div>
          {bySectionError && (
            <span className="hqc-error-badge">⚠ Sync Error</span>
          )}
        </div>

        {/* Cards grid */}
        <div className="hqc-grid">
          {sections.map((section, si) => {
            const canon  = section.sectionCanonicalUrl;
            const config = SECTION_CONFIG[canon] ?? { icon: "📋", label: canon.replace(/-/g, " "), accent: "#e65100" };
            const posts  = section.posts ?? [];

            return (
              <div
                key={canon}
                className="hqc-card"
                style={{ animationDelay: `${si * 0.09}s`, "--accent": config.accent }}
              >
                {/* Card header */}
                <div className="hqc-card-head">
                  <div className="hqc-head-left">
                    <span className="hqc-icon">{config.icon}</span>
                    <span className="hqc-section-name">
                      {section.sectionName || config.label}
                    </span>
                  </div>
                  <Link
                    href={`/post/section/${canon}`}
                    className="hqc-view-all"
                  >
                    All
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>

                {/* Card body */}
                <div className="hqc-card-body">
                  {posts.length > 0 ? (
                    <ul className="hqc-list">
                      {posts.slice(0, 12).map((post, pi) => (
                        <li key={post._id || pi} className="hqc-item">
                          <Link href={`/post/${post.slug}`} className="hqc-link">
                            <span className="hqc-bullet" />
                            <span className="hqc-post-title">{post.title}</span>
                            {pi < 2 && <span className="hqc-new-badge">New</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hqc-empty">
                      <span>📭</span>
                      <p>Content update ho raha hai…</p>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="hqc-card-foot">
                  <Link href={`/post/section/${canon}`} className="hqc-foot-link">
                   View All →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap');

  .hqc-shell {
    padding: 0 0 48px;
    font-family: 'DM Sans', sans-serif;
  }

  /* Heading row */
  .hqc-heading-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 12px;
  }

  .hqc-heading-left { display: flex; flex-direction: column; gap: 6px; }

  .hqc-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e65100;
  }

  .hqc-live-dot {
    width: 7px; height: 7px;
    background: #e65100;
    border-radius: 50%;
    animation: hqc-blink 1.6s ease-in-out infinite;
  }

  @keyframes hqc-blink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.35; transform: scale(0.7); }
  }

  .hqc-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.25rem, 2.5vw, 1.6rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin: 0;
  }

  .hqc-error-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #dc2626;
    background: #fef2f2;
    border: 1px solid #fecaca;
    padding: 5px 12px;
    border-radius: 999px;
  }

  /* Grid */
  .hqc-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }

  @media (max-width: 1024px) { .hqc-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px)  { .hqc-grid { grid-template-columns: 1fr; } }

  /* Card */
  .hqc-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1.5px solid rgba(0,0,0,0.07);
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow 0.22s, border-color 0.22s, transform 0.18s;
    animation: hqc-rise 0.45s ease both;
  }

  @keyframes hqc-rise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hqc-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.10);
    border-color: rgba(230,81,0,0.25);
    transform: translateY(-2px);
  }

  /* Card head */
  .hqc-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: var(--accent, #1a1a1a);
    gap: 8px;
  }

  .hqc-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .hqc-icon {
    font-size: 1rem;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
  }

  .hqc-section-name {
    font-family: 'Roboto', sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hqc-view-all {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    flex-shrink: 0;
    transition: color 0.18s;
  }

  .hqc-view-all:hover { color: #fff; }

  /* Card body */
  .hqc-card-body {
    flex: 1;
    padding: 4px 0;
    overflow: hidden;
  }

  .hqc-list { list-style: none; margin: 0; padding: 0; }

  .hqc-item {
    border-bottom: 1px solid #f5f3f0;
  }
  .hqc-item:last-child { border-bottom: none; }

  .hqc-link {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 14px;
    text-decoration: none;
    transition: background 0.16s;
    position: relative;
  }

  .hqc-link:hover { background: #fdf8f5; }

  .hqc-bullet {
    width: 5px; height: 5px;
    background: #e65100;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
    opacity: 0.5;
    transition: opacity 0.16s, transform 0.16s;
  }

  .hqc-link:hover .hqc-bullet {
    opacity: 1;
    transform: scale(1.4);
  }

  .hqc-post-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #444;
    line-height: 1.5;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.16s;
  }

  .hqc-link:hover .hqc-post-title { color: #1a1a1a; }

  .hqc-new-badge {
    flex-shrink: 0;
    font-size: 0.58rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: #e65100;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 3px;
    animation: hqc-blink 2s ease-in-out infinite;
  }

  /* Card footer */
  .hqc-card-foot {
    padding: 9px 14px;
    border-top: 1px solid #f0ede8;
    background: #faf9f7;
  }

  .hqc-foot-link {
    font-size: 0.75rem;
    font-weight: 600;
    color: #e65100;
    text-decoration: none;
    transition: gap 0.18s, letter-spacing 0.18s;
    display: inline-block;
  }

  .hqc-foot-link:hover { letter-spacing: 0.02em; }

  /* Empty state */
  .hqc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    color: #bbb;
    font-size: 0.82rem;
    text-align: center;
  }

  .hqc-empty span { font-size: 1.6rem; }
  .hqc-empty p   { margin: 0; }
`;

const shimmerCss = `
  ${css}

  .shimmer-head {
    background: #2a2a2a !important;
  }

  .shimmer-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    border-bottom: 1px solid #f5f3f0;
  }

  .shimmer-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #e8e4df;
    flex-shrink: 0;
    animation: hqc-shimmer 1.4s ease-in-out infinite;
  }

  .shimmer-bar {
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: hqc-wave 1.4s ease-in-out infinite;
    flex: 1;
  }

  .w60 { max-width: 60%; }
  .w70 { max-width: 70%; }
  .w80 { max-width: 80%; }
  .w90 { max-width: 90%; }

  @keyframes hqc-shimmer {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }

  @keyframes hqc-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;