'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

const stats = [
  { value: '1K+', label: 'Active Jobs' },
  { value: '800+', label: 'Govt Schemes' },
];

const tags = ['SSC', 'UPSC', 'Railway', 'Banking', 'Defence', 'State PSC'];

export default function Hero() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const items = el.querySelectorAll('[data-reveal]');
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(28px)';
      item.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        });
      });
    });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .hero-root {
          font-family: 'DM Sans', sans-serif;
          background: #f7f5f0;
          min-height: 88vh;
          display: flex;
          align-items: center;
          padding: 4rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .hero-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255,140,0,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 10% 80%, rgba(220,38,38,0.07) 0%, transparent 60%);
          pointer-events: none;
        }

        .hero-grid-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 5rem;
          align-items: center;
          position: relative;
        }

        @media (max-width: 1024px) {
          .hero-inner { grid-template-columns: 1fr; gap: 3rem; }
          .hero-right { display: none; }
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff3e0;
          border: 1px solid #ffcc80;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #e65100;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .eyebrow-dot {
          width: 7px; height: 7px;
          background: #ff6d00;
          border-radius: 50%;
          animation: pulse-dot 1.8s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .hero-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.6rem, 5vw, 4rem);
          font-weight: 800;
          line-height: 1.08;
          color: #1a1a1a;
          margin: 0 0 1.4rem;
          letter-spacing: -0.03em;
        }

        .accent-word {
          position: relative;
          display: inline-block;
          color: #e65100;
        }

        .accent-word::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ff6d00, #ffb300);
          border-radius: 2px;
          transform: scaleX(0);
          transform-origin: left;
          animation: underline-in 0.7s ease 0.8s forwards;
        }

        @keyframes underline-in {
          to { transform: scaleX(1); }
        }

        .hero-sub {
          font-size: 1.05rem;
          color: #555;
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 2.2rem;
        }

        .cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 2.8rem;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: #1a1a1a;
          color: #fff;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 4px 18px rgba(0,0,0,0.18);
        }
        .btn-primary:hover { background: #333; transform: translateY(-2px); }
        .btn-primary svg { transition: transform 0.2s; }
        .btn-primary:hover svg { transform: translateX(3px); }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: transparent;
          color: #1a1a1a;
          border: 1.5px solid #d1d1d1;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-secondary:hover {
          border-color: #e65100;
          color: #e65100;
          background: #fff8f5;
          transform: translateY(-2px);
        }

        .tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-chip {
          padding: 5px 13px;
          border: 1.5px solid #e0e0e0;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #555;
          background: #fff;
          transition: border-color 0.18s, color 0.18s;
          cursor: default;
        }
        .tag-chip:hover { border-color: #e65100; color: #e65100; }

        /* ── Right panel ── */
        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 22px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.09); }

        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.04em;
        }

        .stat-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: #888;
          margin-top: 2px;
        }

        .stat-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          background: #fff5eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
        }

        .alert-card {
          background: linear-gradient(135deg, #1a1a1a 60%, #2d2d2d);
          border-radius: 14px;
          padding: 20px 24px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          color: #fff;
        }

        .alert-icon {
          width: 38px; height: 38px;
          background: #ff6d00;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.1rem;
        }

        .alert-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }

        .alert-text {
          font-size: 0.8rem;
          color: #aaa;
          line-height: 1.5;
        }

        .alert-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 4px 10px;
          background: rgba(255,109,0,0.2);
          color: #ffb300;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
        }
      `}</style>

      <section className="hero-root">
        <div className="hero-grid-bg" />

        <div className="hero-inner" ref={containerRef}>
          {/* Left content */}
          <div>
            <div className="eyebrow" data-reveal>
              <span className="eyebrow-dot" />
              India's #1 Sarkari Info Portal
            </div>

            <h1 className="hero-heading" data-reveal>
              Discover Your<br />
              Next <span className="accent-word">Opportunity</span>
            </h1>

            <p className="hero-sub" data-reveal>
              Real-time updates on admit cards, results, and government job postings across India — all in one place.
            </p>

            <div className="cta-row" data-reveal>
              <Link href="/jobpost" className="btn-primary">
                Jobs & Updates
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/schemes" className="btn-secondary">
                🏛️ Govt Schemes
              </Link>
            </div>

            <div className="tags-row" data-reveal>
              {tags.map(t => (
                <span key={t} className="tag-chip">{t}</span>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="hero-right">
            {stats.map(({ value, label, icon }, i) => (
              <div
                key={label}
                className="stat-card"
                data-reveal
                style={{ transitionDelay: `${0.4 + i * 0.1}s` }}
              >
                <div>
                  <div className="stat-val">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
                <div className="stat-icon">
                  {i === 0 ? '💼' : i === 1 ? '📋' : '👥'}
                </div>
              </div>
            ))}

            <div className="alert-card" data-reveal style={{ transitionDelay: '0.7s' }}>
              <div className="alert-icon">🔔</div>
              <div>
                <div className="alert-title">Live Notification Active</div>
                <div className="alert-text">SSC CGL 2025 Admit Card released. UPSC Prelims result expected this week.</div>
                <span className="alert-badge">● LIVE UPDATES</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}