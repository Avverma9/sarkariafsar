'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { baseUrl } from '../../lib/baseUrl';

const navLinks = [
  { href: '/', label: 'Home', icon: '⌂' },
  { href: '/jobpost', label: 'Jobs', icon: '💼', badge: 'New' },
  { href: '/schemes', label: 'Schemes', icon: '📋' },
  { href: '/blog', label: 'Blog', icon: '✦' },
];

// Map API 'type' to a route prefix
function getResultPath(item) {
  const t = (item.type || '').toLowerCase();
  if (t === 'post') return `/post/${item.slug}`;
  if (t === 'scheme') return `/schemes/${item.slug}`;
  if (t === 'blog') return `/blog/${item.slug}`;
  return `/${item.slug}`;
}

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Search state
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/search/search-with-title?title=${encodeURIComponent(query.trim())}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      const results = Array.isArray(json) ? json : (json.data ?? []);
      setSearchResults(results.slice(0, 8));
      setSearchOpen(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    clearTimeout(debounceTimer.current);
    if (!val.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    debounceTimer.current = setTimeout(() => doSearch(val), 400);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleResultClick = (item) => {
    setSearchOpen(false);
    setSearchVal('');
    setSearchResults([]);
    router.push(getResultPath(item));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .hdr {
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease;
        }

        .hdr-scrolled {
          background: rgba(247, 245, 240, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }

        .hdr-top {
          background: #1a1a1a;
          padding: 6px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 28px;
          font-size: 0.72rem;
          color: #aaa;
          font-weight: 500;
          letter-spacing: 0.04em;
          transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
          overflow: hidden;
        }

        .hdr-scrolled .hdr-top {
          max-height: 0;
          padding-top: 0;
          padding-bottom: 0;
          opacity: 0;
        }

        .hdr-top-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-dot {
          width: 6px; height: 6px;
          background: #ff6d00;
          border-radius: 50%;
          animation: blink 1.6s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hdr-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 66px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-mark {
          width: 38px; height: 38px;
          background: #1a1a1a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }

        .logo:hover .logo-mark { transform: rotate(-4deg) scale(1.05); }

        .logo-mark::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: #ff6d00;
        }

        .logo-text-sp {
          font-family: 'Syne', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.04em;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .logo-name span { color: #e65100; }

        .logo-sub {
          font-size: 0.65rem;
          color: #999;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 1px;
        }

        /* Nav */
        .nav {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          color: #555;
          text-decoration: none;
          position: relative;
          transition: color 0.18s, background 0.18s;
        }

        .nav-link:hover {
          color: #1a1a1a;
          background: rgba(0,0,0,0.05);
        }

        .nav-link.active { color: #e65100; }

        .nav-badge {
          font-size: 0.6rem;
          font-weight: 700;
          background: #e65100;
          color: #fff;
          padding: 1px 6px;
          border-radius: 999px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Search */
        .search-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .search-input {
          width: 220px;
          padding: 9px 16px 9px 38px;
          background: #f0ede8;
          border: 1.5px solid transparent;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #1a1a1a;
          outline: none;
          transition: all 0.25s ease;
        }

        .search-input::placeholder { color: #aaa; }

        .search-input:focus {
          width: 260px;
          background: #fff;
          border-color: #e65100;
          box-shadow: 0 0 0 3px rgba(230, 81, 0, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #aaa;
          pointer-events: none;
          transition: color 0.2s;
        }

        .search-wrap:focus-within .search-icon { color: #e65100; }

        /* Search Dropdown */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: #fff;
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          z-index: 200;
          overflow: hidden;
          width: 420px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid rgba(0,0,0,0.04);
          text-decoration: none;
        }

        .search-result-item:last-child { border-bottom: none; }
        .search-result-item:hover { background: #fdf3ec; }

        .search-result-badge {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .badge-post { background: #e3edff; color: #2563eb; }
        .badge-scheme { background: #ecfdf5; color: #059669; }
        .badge-blog { background: #fef3c7; color: #d97706; }
        .badge-default { background: #f3f4f6; color: #6b7280; }

        .search-result-title {
          font-size: 0.82rem;
          font-weight: 500;
          color: #1a1a1a;
          white-space: normal;
          line-height: 1.4;
        }

        .search-loading-msg {
          padding: 12px 14px;
          font-size: 0.82rem;
          color: #aaa;
          text-align: center;
        }

        /* CTA Button */
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 20px;
          background: #1a1a1a;
          color: #fff;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .cta-btn:hover { background: #e65100; transform: translateY(-1px); }

        /* Mobile hamburger */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 6px;
          border: none;
          background: none;
        }

        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #1a1a1a;
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* Mobile drawer */
        .mobile-drawer {
          position: fixed;
          inset: 0;
          z-index: 99;
          pointer-events: none;
        }

        .mobile-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .mobile-drawer.open .mobile-overlay {
          opacity: 1;
          pointer-events: all;
        }

        .mobile-panel {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 280px;
          background: #f7f5f0;
          padding: 28px 24px;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
          pointer-events: all;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mobile-drawer.open .mobile-panel { transform: translateX(0); }

        .mobile-close {
          position: absolute;
          top: 16px; right: 16px;
          width: 32px; height: 32px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #333;
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
        }

        .mobile-nav-link:hover { background: #fff; color: #e65100; }

        .mobile-nav-icon {
          width: 34px; height: 34px;
          background: #fff;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .mobile-divider {
          height: 1px;
          background: rgba(0,0,0,0.08);
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .nav, .search-wrap, .cta-btn { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <header className={`hdr${scrolled ? ' hdr-scrolled' : ''}`}>
        {/* Top announcement bar */}
        <div className="hdr-top">
          <div className="hdr-top-item">
            <span className="live-dot" />
            Latest Updates
          </div>
          <div className="hdr-top-item">✦ Recent admin cards</div>
          <div className="hdr-top-item">✦ Latest Schemes</div>
        </div>

        {/* Main header */}
        <div className="hdr-main">
          {/* Logo */}
          <Link href="/" className="logo">
            <div className="logo-mark">
              <span className="logo-text-sp">SA</span>
            </div>
            <div>
              <div className="logo-name">Sarkari<span>Afsar</span></div>
              <div className="logo-sub">Sarkari Naukri & Yojana</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav">
            {navLinks.map(({ href, label, badge }) => (
              <Link key={href} href={href} className="nav-link">
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="search-wrap" ref={searchRef}>
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="SSC, UPSC, Railway…"
              aria-label="Search"
              value={searchVal}
              onChange={handleSearchChange}
              onFocus={() => searchVal.trim() && setSearchOpen(true)}
              autoComplete="off"
            />
            {searchOpen && (
              <div className="search-dropdown">
                {searchLoading ? (
                  <div className="search-loading-msg">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="search-loading-msg">No results found</div>
                ) : (
                  searchResults.map((item, i) => {
                    const t = (item.type || '').toLowerCase();
                    const badgeClass = t === 'post' ? 'badge-post' : t === 'scheme' ? 'badge-scheme' : t === 'blog' ? 'badge-blog' : 'badge-default';
                    return (
                      <button
                        key={item.slug || i}
                        className="search-result-item"
                        onClick={() => handleResultClick(item)}
                        type="button"
                      >
                        <span className={`search-result-badge ${badgeClass}`}>{item.type || 'Result'}</span>
                        <span className="search-result-title">{item.title}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <Link href="/jobpost" className="cta-btn">
            Latest Jobs
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Hamburger */}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile Drawer */}
        <div className={`mobile-drawer${menuOpen ? ' open' : ''}`}>
          <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
          <div className="mobile-panel">
            <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>

            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1a1a1a', marginBottom: '16px', marginTop: '8px' }}>
              Sarkari<span style={{ color: '#e65100' }}>Portal</span>
            </div>

            {navLinks.map(({ href, label, icon, badge }) => (
              <Link key={href} href={href} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                <span className="mobile-nav-icon">{icon}</span>
                {label}
                {badge && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: '#e65100', color: '#fff', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>{badge}</span>}
              </Link>
            ))}

            <div className="mobile-divider" />

            <div style={{ padding: '0 4px' }}>
              <input
                style={{ width: '100%', padding: '10px 14px', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontFamily: "'DM Sans',sans-serif", fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Search SSC, UPSC…"
                value={searchVal}
                onChange={handleSearchChange}
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}