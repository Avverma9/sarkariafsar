"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSchemes,
  fetchSchemeStateNames,
  fetchSchemesByState,
} from "../../store/slices/schemesSlice";
import Header from "../components/header";
import Footer from "../components/footer";
import Breadcrumb from "../components/Breadcrumb";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function schemeIcon(type = "") {
  const t = type.toLowerCase();
  if (t.includes("health"))                        return "🏥";
  if (t.includes("education"))                     return "🎓";
  if (t.includes("agriculture") || t.includes("kisan")) return "🌾";
  if (t.includes("housing") || t.includes("awas")) return "🏠";
  if (t.includes("employment") || t.includes("rozgar")) return "💼";
  if (t.includes("women") || t.includes("mahila")) return "👩";
  if (t.includes("finance") || t.includes("loan")) return "💰";
  if (t.includes("pension"))                       return "🧓";
  if (t.includes("water") || t.includes("jal"))   return "💧";
  return "📋";
}

const TYPE_COLORS = {
  "Central": { bg: "#fff3e0", color: "#e65100" },
  "State":   { bg: "#e8f5e9", color: "#2e7d32" },
};
function typeStyle(type = "") {
  for (const key of Object.keys(TYPE_COLORS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return TYPE_COLORS[key];
  }
  return { bg: "#f5f3f0", color: "#666" };
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
const Shimmer = () => (
  <div className="sp-list">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="sp-shimmer-row" style={{ animationDelay: `${i * 0.05}s` }}>
        <div className="sp-shimmer-icon" />
        <div className="sp-shimmer-content">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="sp-shimmer-bar" style={{ width: 70, height: 20, borderRadius: 999 }} />
            <div className="sp-shimmer-bar" style={{ width: 50, height: 20, borderRadius: 999 }} />
          </div>
          <div className="sp-shimmer-bar" style={{ width: "68%", height: 14, marginBottom: 8 }} />
          <div className="sp-shimmer-bar" style={{ width: "92%", height: 11, marginBottom: 5 }} />
          <div className="sp-shimmer-bar" style={{ width: "75%", height: 11 }} />
        </div>
        <div className="sp-shimmer-btn" />
      </div>
    ))}
  </div>
);

// ─── Scheme row ───────────────────────────────────────────────────────────────
function SchemeRow({ scheme, index }) {
  const ts = typeStyle(scheme.schemetype);
  return (
    <article className="sp-row" style={{ animationDelay: `${index * 0.055}s` }}>
      {/* Icon */}
      <div className="sp-icon-box">{schemeIcon(scheme.schemetype)}</div>

      {/* Content */}
      <div className="sp-content">
        <div className="sp-meta-row">
          {scheme.schemetype && (
            <span className="sp-type-badge" style={{ background: ts.bg, color: ts.color }}>
              {scheme.schemetype}
            </span>
          )}
          {scheme.state && (
            <span className="sp-state-chip">🗺️ {scheme.state}</span>
          )}
        </div>

        <h2 className="sp-scheme-title">
          <Link href={`/schemes/${scheme.slug}`} className="sp-scheme-link">
            {scheme.schemeTitle}
          </Link>
        </h2>

        {scheme.aboutScheme && (
          <p className="sp-scheme-desc">{scheme.aboutScheme}</p>
        )}
      </div>

      {/* CTA */}
      <div className="sp-cta-col">
        {scheme.applyLink ? (
          <a href={scheme.applyLink} target="_blank" rel="noopener noreferrer" className="sp-apply-btn">
            Apply
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ) : (
          <Link href={`/schemes/${scheme.slug}`} className="sp-detail-btn">
            Dekhein
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SchemesPage() {
  const dispatch = useDispatch();
  const { items, stateNames, schemesByState, loading } = useSelector((s) => s.schemes);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    dispatch(fetchSchemeStateNames());
    dispatch(fetchSchemes({ page: 1, limit: 24 }));
  }, [dispatch]);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    if (state) dispatch(fetchSchemesByState({ state, page: 1, limit: 24 }));
    else        dispatch(fetchSchemes({ page: 1, limit: 24 }));
  };

  const displaySchemes = selectedState
    ? (Array.isArray(schemesByState) ? schemesByState : [])
    : (Array.isArray(items) ? items : []);

  return (
    <>
      <style>{css}</style>

      <div className="sp-page">
        <Header />

        {/* ── Hero ── */}
        <section className="sp-hero">
          <div className="sp-hero-inner">
            <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Govt Schemes" }]} />
            <span className="sp-hero-eyebrow">🏛️ Central &amp; State Schemes</span>
            <h1 className="sp-hero-title">Sarkari Yojana Explorer</h1>
            <p className="sp-hero-sub">
              India bhar ki welfare schemes, subsidies aur government programmes — state ke hisaab se filter karein.
            </p>
            <div className="sp-hero-links">
              <Link href="/jobpost" className="sp-hero-pill">💼 Jobs &amp; Updates</Link>
              <Link href="/blog"    className="sp-hero-pill">📖 Blog &amp; Guides</Link>
            </div>
          </div>
          {/* decorative grid */}
          <div className="sp-hero-grid" aria-hidden="true" />
        </section>

        {/* ── Main ── */}
        <main className="sp-main">
          <div className="sp-container">

            {/* Page title row */}
            <div className="sp-title-row">
              <div>
                <span className="sp-section-eyebrow">📋 Browse</span>
                <h2 className="sp-section-title">Government Schemes</h2>
              </div>
              {displaySchemes.length > 0 && (
                <span className="sp-count-badge">{displaySchemes.length} schemes</span>
              )}
            </div>

            {/* State filter */}
            {Array.isArray(stateNames) && stateNames.length > 0 && (
              <div className="sp-filter-wrap">
                <button
                  onClick={() => handleStateSelect("")}
                  className={`sp-filter-btn ${selectedState === "" ? "sp-filter-active" : ""}`}
                >
                  All States
                </button>
                {stateNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleStateSelect(name)}
                    className={`sp-filter-btn ${selectedState === name ? "sp-filter-active" : ""}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* List */}
            {loading ? (
              <Shimmer />
            ) : displaySchemes.length === 0 ? (
              <div className="sp-empty">
                <span>🏛️</span>
                <p>Koi scheme nahi mili{selectedState ? ` "${selectedState}" ke liye` : ""}.</p>
                {selectedState && (
                  <button className="sp-empty-reset" onClick={() => handleStateSelect("")}>
                    Sab dekhein
                  </button>
                )}
              </div>
            ) : (
              <div className="sp-list">
                {displaySchemes.map((scheme, i) => (
                  <SchemeRow key={scheme._id || scheme.slug} scheme={scheme} index={i} />
                ))}
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
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700;800&family=DM+Sans:wght@400;500;600&family=Lora:wght@400&display=swap');

  .sp-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f7f5f0;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Hero ── */
  .sp-hero {
    background: #1a1a1a;
    padding: 56px 24px 60px;
    position: relative;
    overflow: hidden;
  }

  .sp-hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
    max-width: 680px;
  }

  .sp-hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .sp-hero::after {
    content: '';
    position: absolute;
    right: -80px; top: -80px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(230,81,0,0.18) 0%, transparent 65%);
    pointer-events: none;
  }

  .sp-hero-eyebrow {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e65100;
    margin-bottom: 14px;
  }

  .sp-hero-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #fff;
    line-height: 1.1;
    margin: 0 0 14px;
  }

  .sp-hero-sub {
    font-size: 0.92rem;
    color: #888;
    line-height: 1.7;
    margin: 0 0 24px;
    max-width: 520px;
  }

  .sp-hero-links { display: flex; gap: 10px; flex-wrap: wrap; }

  .sp-hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: #ccc;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
  }
  .sp-hero-pill:hover {
    background: rgba(230,81,0,0.15);
    border-color: rgba(230,81,0,0.4);
    color: #ff8c42;
  }

  /* ── Main container ── */
  .sp-main { flex: 1; padding: 48px 24px 64px; }

  .sp-container { max-width: 900px; margin: 0 auto; }

  /* ── Title row ── */
  .sp-title-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid rgba(0,0,0,0.08);
  }

  .sp-section-eyebrow {
    display: block;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #e65100;
    margin-bottom: 5px;
  }

  .sp-section-title {
    font-family: 'Roboto', sans-serif;
    font-size: clamp(1.2rem, 2.5vw, 1.55rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    margin: 0;
  }

  .sp-count-badge {
    font-size: 0.72rem;
    font-weight: 700;
    background: #fff3e0;
    color: #e65100;
    padding: 5px 12px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── State filter ── */
  .sp-filter-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 28px;
    padding: 16px;
    background: #fff;
    border: 1.5px solid rgba(0,0,0,0.07);
    border-radius: 12px;
  }

  .sp-filter-btn {
    padding: 6px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    border-radius: 8px;
    border: 1.5px solid #e8e4df;
    background: #faf9f7;
    color: #666;
    cursor: pointer;
    transition: all 0.16s;
    white-space: nowrap;
  }
  .sp-filter-btn:hover {
    border-color: #e65100;
    color: #e65100;
    background: #fff5eb;
  }
  .sp-filter-active {
    background: #1a1a1a !important;
    color: #fff !important;
    border-color: #1a1a1a !important;
  }

  /* ── List ── */
  .sp-list { display: flex; flex-direction: column; }

  /* ── Row ── */
  .sp-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    border-radius: 10px;
    margin: 0 -10px;
    animation: sp-rise 0.4s ease both;
    transition: background 0.16s;
  }
  .sp-row:last-child { border-bottom: none; }
  .sp-row:hover { background: #fdf8f5; }

  @keyframes sp-rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Icon */
  .sp-icon-box {
    width: 42px; height: 42px;
    background: #fff;
    border: 1.5px solid #f0ede8;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .sp-row:hover .sp-icon-box {
    transform: scale(1.08) rotate(-4deg);
    box-shadow: 0 4px 14px rgba(0,0,0,0.09);
  }

  /* Content */
  .sp-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }

  .sp-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .sp-type-badge {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .sp-state-chip {
    font-size: 0.7rem;
    font-weight: 500;
    color: #999;
    background: #f5f3f0;
    border: 1px solid rgba(0,0,0,0.07);
    padding: 2px 8px;
    border-radius: 999px;
  }

  .sp-scheme-title {
    font-family: 'Roboto', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: -0.015em;
    color: #1a1a1a;
    line-height: 1.3;
    margin: 0;
  }

  .sp-scheme-link {
    color: inherit;
    text-decoration: none;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.16s;
  }
  .sp-scheme-link:hover { color: #e65100; }

  .sp-scheme-desc {
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

  /* CTA column */
  .sp-cta-col {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .sp-apply-btn,
  .sp-detail-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 7px 13px;
    border-radius: 8px;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
  }

  .sp-apply-btn {
    background: #1a1a1a;
    color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.14);
  }
  .sp-apply-btn:hover {
    background: #e65100;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(230,81,0,0.28);
  }

  .sp-detail-btn {
    background: transparent;
    color: #aaa;
    border: 1.5px solid #e8e4df;
  }
  .sp-detail-btn:hover {
    border-color: #e65100;
    color: #e65100;
    background: #fff5eb;
    transform: translateY(-1px);
  }

  /* ── Empty ── */
  .sp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 24px;
    color: #bbb;
    font-size: 0.88rem;
    text-align: center;
  }
  .sp-empty span { font-size: 2.4rem; }
  .sp-empty p    { margin: 0; }

  .sp-empty-reset {
    margin-top: 8px;
    padding: 8px 20px;
    background: #1a1a1a;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s;
  }
  .sp-empty-reset:hover { background: #e65100; }

  /* ── Shimmer ── */
  .sp-shimmer-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 10px;
    border-bottom: 1px solid #f0ede8;
    animation: sp-rise 0.4s ease both;
  }

  .sp-shimmer-icon {
    width: 42px; height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: sp-wave 1.4s ease-in-out infinite;
  }

  .sp-shimmer-content { flex: 1; }

  .sp-shimmer-bar {
    border-radius: 6px;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: sp-wave 1.4s ease-in-out infinite;
  }

  .sp-shimmer-btn {
    width: 76px; height: 32px;
    border-radius: 8px;
    flex-shrink: 0;
    background: linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);
    background-size: 200% 100%;
    animation: sp-wave 1.4s ease-in-out infinite;
  }

  @keyframes sp-wave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 540px) {
    .sp-scheme-desc { display: none; }
    .sp-cta-col     { display: none; }
    .sp-icon-box    { width: 36px; height: 36px; font-size: 1rem; }
  }
`;