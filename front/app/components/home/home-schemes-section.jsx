"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchemes } from "../../../store/slices/schemesSlice";

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = () => (
  <div className="hss-list">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="hss-shimmer-row" style={{ animationDelay: `${i * 0.06}s` }}>
        <div className="hss-shimmer-left">
          <div className="hss-shimmer-icon" />
          <div className="hss-shimmer-content">
            <div className="hss-shimmer-bar w75" />
            <div className="hss-shimmer-bar w90" style={{ height: 10, marginTop: 8 }} />
            <div className="hss-shimmer-bar w60" style={{ height: 10, marginTop: 6 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div className="hss-shimmer-pill" />
              <div className="hss-shimmer-pill" style={{ width: 64 }} />
            </div>
          </div>
        </div>
        <div className="hss-shimmer-btn" />
      </div>
    ))}
  </div>
);

// ─── Scheme type → emoji ──────────────────────────────────────────────────────
function schemeIcon(type = "") {
  const t = type.toLowerCase();
  if (t.includes("health"))    return "🏥";
  if (t.includes("education")) return "🎓";
  if (t.includes("agriculture") || t.includes("kisan")) return "🌾";
  if (t.includes("housing") || t.includes("awas"))      return "🏠";
  if (t.includes("employment") || t.includes("rozgar")) return "💼";
  if (t.includes("women") || t.includes("mahila"))      return "👩";
  if (t.includes("finance") || t.includes("loan"))      return "💰";
  return "📋";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomeSchemesSection() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.schemes);

  useEffect(() => {
    dispatch(fetchSchemes({ page: 1, limit: 15 }));
  }, [dispatch]);

  return (
    <>
      <style>{css}</style>

      <section className="hss-shell">

        {/* Heading */}
        <div className="hss-heading-row">
          <div>
            <span className="hss-eyebrow">🏛️ Welfare Schemes</span>
            <h2 className="hss-title">Sarkari Schemes</h2>
          </div>
          <Link href="/schemes" className="hss-view-all">
            Sabhi Dekhein
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Body */}
        {loading ? (
          <Shimmer />
        ) : items.length > 0 ? (
          <div className="hss-list">
            {items.map((scheme, i) => (
              <article
                key={scheme._id || i}
                className="hss-row"
                style={{ animationDelay: `${i * 0.055}s` }}
              >
                {/* Icon */}
                <div className="hss-scheme-icon">
                  {schemeIcon(scheme.schemetype)}
                </div>

                {/* Content */}
                <div className="hss-content">
                  <h3 className="hss-scheme-title">
                    <Link href={`/schemes/${scheme.slug}`} className="hss-scheme-link">
                      {scheme.schemeTitle}
                    </Link>
                  </h3>

                  {scheme.aboutScheme && (
                    <p className="hss-scheme-desc">{scheme.aboutScheme}</p>
                  )}

                  <div className="hss-tags">
                    {scheme.schemetype && (
                      <span className="hss-tag hss-tag-type">{scheme.schemetype}</span>
                    )}
                    <span className="hss-tag hss-tag-state">
                      🗺️ {scheme.state || "Central"}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="hss-cta-col">
                  {scheme.applyLink ? (
                    <a
                      href={scheme.applyLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hss-apply-btn"
                    >
                      Apply Now
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ) : (
                    <Link href={`/schemes/${scheme.slug}`} className="hss-detail-btn">
                      Dekhein
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="hss-empty">
            <span>🏛️</span>
            <p>Abhi koi scheme available nahi hai.</p>
          </div>
        )}

      </section>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap');

  .hss-shell {
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    max-width: 1120px;
    margin: 0 auto 56px;
  }

  /* Heading */
  .hss-heading-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid rgba(0,0,0,0.08);
  }

  .hss-eyebrow {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e65100;
    margin-bottom: 5px;
  }

  .hss-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.25rem, 2.5vw, 1.6rem);
    font-weight: 700;
    letter-spacing: 0;
    color: #1a1a1a;
    margin: 0;
  }

  .hss-view-all {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #e65100;
    text-decoration: none;
    white-space: nowrap;
    padding: 7px 14px;
    border: 1.5px solid rgba(230,81,0,0.25);
    border-radius: 8px;
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
  }

  .hss-view-all:hover {
    background: #fff5eb;
    border-color: #e65100;
    transform: translateY(-1px);
  }

  /* List */
  .hss-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Row */
  .hss-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid #f0ede8;
    animation: hss-rise 0.42s ease both;
    transition: background 0.16s;
    border-radius: 8px;
    margin: 0 -10px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .hss-row:last-child { border-bottom: none; }

  .hss-row:hover { background: #fdf8f5; }

  @keyframes hss-rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Icon box */
  .hss-scheme-icon {
    width: 40px;
    height: 40px;
    background: #fff;
    border: 1.5px solid #f0ede8;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    flex-shrink: 0;
    margin-top: 2px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    transition: transform 0.18s, box-shadow 0.18s;
  }

  .hss-row:hover .hss-scheme-icon {
    transform: scale(1.08) rotate(-4deg);
    box-shadow: 0 4px 14px rgba(0,0,0,0.09);
  }

  /* Content */
  .hss-content { flex: 1; min-width: 0; }

  .hss-scheme-title {
    font-family: 'Roboto', sans-serif;
    font-size: 0.96rem;
    font-weight: 700;
    letter-spacing: 0;
    color: #1a1a1a;
    margin: 0 0 5px;
    line-height: 1.3;
  }

  .hss-scheme-link {
    color: inherit;
    text-decoration: none;
    transition: color 0.16s;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hss-scheme-link:hover { color: #e65100; }

  .hss-scheme-desc {
    font-size: 0.82rem;
    color: #888;
    line-height: 1.6;
    margin: 0 0 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tags */
  .hss-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hss-tag {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 999px;
    letter-spacing: 0.03em;
  }

  .hss-tag-type {
    background: #fff3e0;
    color: #e65100;
    border: 1px solid rgba(230,81,0,0.18);
  }

  .hss-tag-state {
    background: #f5f3f0;
    color: #666;
    border: 1px solid rgba(0,0,0,0.07);
  }

  /* CTA column */
  .hss-cta-col {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .hss-apply-btn,
  .hss-detail-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 7px 13px;
    border-radius: 8px;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
    letter-spacing: 0.02em;
  }

  .hss-apply-btn {
    background: #1a1a1a;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.14);
  }

  .hss-apply-btn:hover {
    background: #e65100;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(230,81,0,0.28);
  }

  .hss-detail-btn {
    background: transparent;
    color: #888;
    border: 1.5px solid #e8e4df;
  }

  .hss-detail-btn:hover {
    border-color: #e65100;
    color: #e65100;
    background: #fff5eb;
    transform: translateY(-1px);
  }

  /* Empty state */
  .hss-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 56px 24px;
    color: #bbb;
    font-size: 0.88rem;
    text-align: center;
  }

  .hss-empty span { font-size: 2.2rem; }
  .hss-empty p    { margin: 0; }

  /* Shimmer */
  .hss-shimmer-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 0;
    border-bottom: 1px solid #f0ede8;
    animation: hss-rise 0.42s ease both;
  }

  .hss-shimmer-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: hss-wave 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  .hss-shimmer-left {
    display: flex; gap: 14px; flex: 1; min-width: 0;
  }

  .hss-shimmer-content { flex: 1; }

  .hss-shimmer-bar {
    height: 13px;
    border-radius: 6px;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: hss-wave 1.4s ease-in-out infinite;
  }

  .w60 { width: 60%; }
  .w75 { width: 75%; }
  .w90 { width: 90%; }

  .hss-shimmer-pill {
    height: 20px; width: 76px;
    border-radius: 999px;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: hss-wave 1.4s ease-in-out infinite;
  }

  .hss-shimmer-btn {
    width: 78px; height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
    background: linear-gradient(90deg, #f0ede8 25%, #e8e4df 50%, #f0ede8 75%);
    background-size: 200% 100%;
    animation: hss-wave 1.4s ease-in-out infinite;
    margin-top: 2px;
  }

  @keyframes hss-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 540px) {
    .hss-scheme-desc { display: none; }
    .hss-cta-col { display: none; }
  }
`;