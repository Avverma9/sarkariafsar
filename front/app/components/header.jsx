'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { baseUrl } from '../../lib/baseUrl';

const navLinks = [
  { href: '/',        label: 'Home',    icon: '⌂' },
  { href: '/jobpost', label: 'Jobs',    icon: '💼', badge: 'New' },
  { href: '/schemes', label: 'Schemes', icon: '📋' },
  { href: '/blog',    label: 'Blog',    icon: '✦' },
];

function getResultPath(item) {
  const t = (item.type || '').toLowerCase();
  if (t === 'post')   return `/post/${item.slug}`;
  if (t === 'scheme') return `/schemes/${item.slug}`;
  if (t === 'blog')   return `/blog/${item.slug}`;
  return `/${item.slug}`;
}

function TypeBadge({ type = '' }) {
  const t = type.toLowerCase();
  const map = {
    post:   { label: 'Job',    cls: 'badge-post' },
    scheme: { label: 'Scheme', cls: 'badge-scheme' },
    blog:   { label: 'Blog',   cls: 'badge-blog' },
  };
  const cfg = map[t] ?? { label: type || 'Result', cls: 'badge-default' };
  return <span className={`srb ${cfg.cls}`}>{cfg.label}</span>;
}

function SearchResults({ loading, results, onSelect }) {
  if (loading) return <div className="sr-msg">Searching…</div>;
  if (!results.length) return <div className="sr-msg">Koi result nahi mila</div>;
  return results.map((item, i) => (
    <button key={item.slug || i} className="sr-item" onClick={() => onSelect(item)} type="button">
      <TypeBadge type={item.type} />
      <span className="sr-title">{item.title}</span>
    </button>
  ));
}

export default function Header() {
  const router = useRouter();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [results,   setResults]   = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const desktopRef = useRef(null);
  const debounce   = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const fn = (e) => {
      if (desktopRef.current && !desktopRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setDropOpen(false); return; }
    setSrLoading(true);
    try {
      const res  = await fetch(
        `${baseUrl}/search/search-with-title?title=${encodeURIComponent(q.trim())}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const arr  = Array.isArray(json) ? json : (json.data ?? []);
      setResults(arr.slice(0, 8));
      setDropOpen(true);
    } catch { setResults([]); }
    finally   { setSrLoading(false); }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setSearchVal(v);
    clearTimeout(debounce.current);
    if (!v.trim()) { setResults([]); setDropOpen(false); return; }
    debounce.current = setTimeout(() => doSearch(v), 380);
  };

  const handleSelect = (item) => {
    setDropOpen(false); setMenuOpen(false);
    setSearchVal(''); setResults([]);
    router.push(getResultPath(item));
  };

  const showDrop = dropOpen && (srLoading || results.length > 0 || searchVal.trim().length > 1);

  return (
    <>
      <style>{CSS}</style>

      <header className={`hdr${scrolled ? ' hdr-scrolled' : ''}`}>

        {/* Ticker */}
        <div className="hdr-top">
          <div className="hdr-top-inner">
            <span className="hdr-top-item"><span className="live-dot"/>Latest Updates</span>
            <span className="hdr-top-sep">✦</span>
            <span className="hdr-top-item hdr-top-hide">Recent Admit Cards</span>
            <span className="hdr-top-sep hdr-top-hide">✦</span>
            <span className="hdr-top-item hdr-top-hide">Latest Schemes</span>
          </div>
        </div>

        {/* Main bar */}
        <div className="hdr-main">

          <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
            <div className="logo-mark"><span className="logo-sp">SA</span></div>
            <div className="logo-text">
              <div className="logo-name">Sarkari<span>Afsar</span></div>
              <div className="logo-sub">Sarkari Naukri &amp; Yojana</div>
            </div>
          </Link>

          <nav className="nav" aria-label="Main navigation">
            {navLinks.map(({ href, label, badge }) => (
              <Link key={href} href={href} className="nav-link">
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </Link>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="search-wrap" ref={desktopRef}>
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="SSC, UPSC, Railway…"
              aria-label="Search"
              value={searchVal}
              onChange={handleChange}
              onFocus={() => searchVal.trim() && setDropOpen(true)}
              autoComplete="off" spellCheck="false"
            />
            {showDrop && (
              <div className="search-drop" role="listbox">
                <SearchResults loading={srLoading} results={results} onSelect={handleSelect} />
              </div>
            )}
          </div>

          <Link href="/jobpost" className="cta-btn">
            Latest Jobs
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span/><span/><span/>
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`drawer${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          <div className="drawer-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true"/>

          <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Navigation">

            {/* Head */}
            <div className="drawer-head">
              <div className="drawer-logo">Sarkari<span>Afsar</span></div>
              <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <div className="drawer-search-wrap">
              <svg className="drawer-search-icon" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="drawer-search-input"
                placeholder="Search SSC, UPSC, Railway…"
                value={searchVal}
                onChange={handleChange}
                autoComplete="off" spellCheck="false"
                aria-label="Mobile search"
              />
              {srLoading && <span className="drawer-search-spinner"/>}
            </div>

            {showDrop && (
              <div className="drawer-search-results">
                <SearchResults loading={srLoading} results={results} onSelect={handleSelect} />
              </div>
            )}

            {/* Nav */}
            <nav className="drawer-nav" aria-label="Mobile navigation">
              {navLinks.map(({ href, label, icon, badge }) => (
                <Link key={href} href={href} className="drawer-link" onClick={() => setMenuOpen(false)}>
                  <span className="drawer-link-icon">{icon}</span>
                  <span className="drawer-link-label">{label}</span>
                  {badge && <span className="drawer-link-badge">{badge}</span>}
                  <svg className="drawer-link-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </nav>

            <div className="drawer-divider"/>

            <Link href="/jobpost" className="drawer-cta" onClick={() => setMenuOpen(false)}>
              💼 Latest Government Jobs
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            <Link href="/schemes" className="drawer-cta drawer-cta-ghost" onClick={() => setMenuOpen(false)}>
              🏛️ Browse Schemes
            </Link>

            <p className="drawer-footer-note">
              © {new Date().getFullYear()} SarkariAfsar — Sarkari Naukri &amp; Yojana
            </p>
          </div>
        </div>

      </header>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap');

  .hdr {
    position: sticky; top: 0; z-index: 100;
    font-family: 'DM Sans', sans-serif;
    background: #f7f5f0;
    transition: background 0.3s, box-shadow 0.3s;
  }
  .hdr-scrolled {
    background: rgba(247,245,240,0.94);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 2px 20px rgba(0,0,0,0.07);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }

  /* Ticker */
  .hdr-top {
    background: #1a1a1a; overflow: hidden;
    max-height: 30px;
    transition: max-height 0.3s, opacity 0.3s;
  }
  .hdr-scrolled .hdr-top { max-height: 0; opacity: 0; }
  .hdr-top-inner {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; padding: 5px 16px;
    font-size: 0.69rem; color: #888; font-weight: 500; letter-spacing: 0.04em;
    white-space: nowrap; overflow: hidden;
  }
  .hdr-top-sep { color: #444; font-size: 0.55rem; }
  .hdr-top-item { display: flex; align-items: center; gap: 6px; }
  .live-dot {
    display: inline-block; width: 6px; height: 6px;
    background: #ff6d00; border-radius: 50%;
    animation: hdr-blink 1.6s ease-in-out infinite;
  }
  @keyframes hdr-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* Main bar */
  .hdr-main {
    max-width: 1200px; margin: 0 auto;
    padding: 0 20px; height: 62px;
    display: flex; align-items: center;
    justify-content: space-between; gap: 14px;
  }

  /* Logo */
  .logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
  .logo-mark {
    width: 36px; height: 36px; background: #1a1a1a; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; transition: transform 0.2s; flex-shrink: 0;
  }
  .logo:hover .logo-mark { transform: rotate(-4deg) scale(1.05); }
  .logo-mark::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: #e65100;
  }
  .logo-sp { font-family: 'Roboto',sans-serif; font-size: 0.75rem; font-weight: 700; color: #fff; }
  .logo-text { display: flex; flex-direction: column; }
  .logo-name { font-family:'Roboto',sans-serif; font-size:1.18rem; font-weight:700; color:#1a1a1a; letter-spacing:0; line-height:1; }
  .logo-name span { color: #e65100; }
  .logo-sub { font-size:0.58rem; color:#aaa; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; margin-top:1px; }

  /* Desktop nav */
  .nav { display: flex; align-items: center; gap: 2px; }
  .nav-link {
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px; border-radius: 8px;
    font-size: 0.86rem; font-weight: 500; color: #555; text-decoration: none;
    transition: color 0.18s, background 0.18s;
  }
  .nav-link:hover { color: #1a1a1a; background: rgba(0,0,0,0.05); }
  .nav-badge {
    font-size: 0.58rem; font-weight: 700;
    background: #e65100; color: #fff;
    padding: 1px 5px; border-radius: 999px;
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  /* Desktop search */
  .search-wrap { position: relative; flex-shrink: 0; }
  .search-input {
    width: 200px; padding: 9px 14px 9px 34px;
    background: rgba(0,0,0,0.05);
    border: 1.5px solid transparent; border-radius: 10px;
    font-family: 'DM Sans',sans-serif; font-size: 0.83rem; color: #1a1a1a; outline: none;
    transition: width 0.25s, border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .search-input::placeholder { color: #aaa; }
  .search-input:focus {
    width: 248px; background: #fff; border-color: #e65100;
    box-shadow: 0 0 0 3px rgba(230,81,0,0.1);
  }
  .search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; transition:color 0.2s; }
  .search-wrap:focus-within .search-icon { color: #e65100; }
  .search-drop {
    position: absolute; top: calc(100% + 8px); left: 0; width: 400px;
    background: #fff; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; z-index: 200;
  }

  /* CTA */
  .cta-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; background: #1a1a1a; color: #fff;
    border-radius: 9px; font-family: 'DM Sans',sans-serif;
    font-size: 0.83rem; font-weight: 600; text-decoration: none;
    white-space: nowrap; flex-shrink: 0;
    transition: background 0.2s, transform 0.15s;
  }
  .cta-btn:hover { background: #e65100; transform: translateY(-1px); }

  /* Shared search result items */
  .sr-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 10px 14px; text-align: left;
    background: none; border: none; cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,0.05); transition: background 0.15s;
  }
  .sr-item:last-child { border-bottom: none; }
  .sr-item:hover { background: #fdf3ec; }
  .sr-title {
    font-size: 0.82rem; font-weight: 500; color: #1a1a1a; line-height: 1.4;
    flex: 1; text-align: left;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .sr-msg { padding: 14px; font-size: 0.82rem; color: #aaa; text-align: center; }
  .srb { font-size: 0.58rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
  .badge-post    { background: #e3edff; color: #2563eb; }
  .badge-scheme  { background: #ecfdf5; color: #059669; }
  .badge-blog    { background: #fef3c7; color: #d97706; }
  .badge-default { background: #f3f4f6; color: #6b7280; }

  /* Hamburger */
  .hamburger {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 8px; border: none; background: none;
    border-radius: 8px; transition: background 0.18s;
  }
  .hamburger:hover { background: rgba(0,0,0,0.06); }
  .hamburger span {
    display: block; width: 22px; height: 2px;
    background: #1a1a1a; border-radius: 2px;
    transition: all 0.28s ease; transform-origin: center;
  }
  .hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* Drawer */
  .drawer { position: fixed; inset: 0; z-index: 200; pointer-events: none; }
  .drawer-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.45);
    opacity: 0; transition: opacity 0.3s; backdrop-filter: blur(2px);
  }
  .drawer.open { pointer-events: all; }
  .drawer.open .drawer-overlay { opacity: 1; }

  .drawer-panel {
    position: absolute; top: 0; right: 0; bottom: 0;
    width: min(320px, 88vw);
    background: #f7f5f0;
    display: flex; flex-direction: column;
    overflow-y: auto; overflow-x: hidden;
    transform: translateX(100%);
    transition: transform 0.34s cubic-bezier(0.4,0,0.2,1);
    box-shadow: -6px 0 36px rgba(0,0,0,0.14);
  }
  .drawer.open .drawer-panel { transform: translateX(0); }

  .drawer-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 18px 14px;
    border-bottom: 1px solid rgba(0,0,0,0.08);
    position: sticky; top: 0; background: #f7f5f0; z-index: 2; flex-shrink: 0;
  }
  .drawer-logo { font-family:'Roboto',sans-serif; font-size:1.1rem; font-weight:700; color:#1a1a1a; }
  .drawer-logo span { color: #e65100; }
  .drawer-close {
    width: 32px; height: 32px; background: #1a1a1a; color: #fff;
    border: none; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.18s; flex-shrink: 0;
  }
  .drawer-close:hover { background: #e65100; }

  .drawer-search-wrap { position: relative; margin: 14px 14px 0; flex-shrink: 0; }
  .drawer-search-input {
    width: 100%; padding: 11px 40px 11px 36px;
    background: #fff; border: 1.5px solid #e8e4df; border-radius: 10px;
    font-family: 'DM Sans',sans-serif; font-size: 0.88rem; color: #1a1a1a; outline: none;
    box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .drawer-search-input::placeholder { color: #bbb; }
  .drawer-search-input:focus { border-color: #e65100; box-shadow: 0 0 0 3px rgba(230,81,0,0.1); }
  .drawer-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
  .drawer-search-wrap:focus-within .drawer-search-icon { color: #e65100; }
  .drawer-search-spinner {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    width: 14px; height: 14px; border: 2px solid #f0ede8;
    border-top-color: #e65100; border-radius: 50%;
    animation: hdr-spin 0.7s linear infinite;
  }
  @keyframes hdr-spin { to { transform: translateY(-50%) rotate(360deg); } }

  .drawer-search-results {
    margin: 8px 14px 0; background: #fff;
    border: 1.5px solid rgba(0,0,0,0.08);
    border-radius: 10px; overflow: hidden; flex-shrink: 0;
    max-height: 240px; overflow-y: auto;
  }

  .drawer-nav { display:flex; flex-direction:column; gap:3px; padding:14px 10px 0; flex-shrink:0; }
  .drawer-link {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 12px; border-radius: 10px;
    text-decoration: none; color: #333;
    transition: background 0.16s, color 0.16s;
  }
  .drawer-link:hover { background: #fff; color: #e65100; }
  .drawer-link-icon {
    width: 34px; height: 34px; background: #fff;
    border: 1px solid #f0ede8; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.95rem; flex-shrink: 0; transition: border-color 0.16s;
  }
  .drawer-link:hover .drawer-link-icon { border-color: rgba(230,81,0,0.3); }
  .drawer-link-label { font-size: 0.9rem; font-weight: 600; flex: 1; }
  .drawer-link-badge {
    font-size: 0.6rem; font-weight: 700; background: #e65100; color: #fff;
    padding: 2px 6px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .drawer-link-arrow { color: #ccc; flex-shrink: 0; transition: color 0.16s, transform 0.16s; }
  .drawer-link:hover .drawer-link-arrow { color: #e65100; transform: translateX(2px); }

  .drawer-divider { height: 1px; background: rgba(0,0,0,0.08); margin: 14px; flex-shrink: 0; }

  .drawer-cta {
    display: flex; align-items: center; justify-content: center; gap: 7px;
    margin: 0 14px 10px;
    padding: 13px 20px; background: #1a1a1a; color: #fff;
    border-radius: 10px; text-decoration: none;
    font-family: 'DM Sans',sans-serif; font-size: 0.88rem; font-weight: 600;
    transition: background 0.2s, transform 0.15s; flex-shrink: 0;
  }
  .drawer-cta:hover { background: #e65100; transform: translateY(-1px); }
  .drawer-cta-ghost { background: transparent; color: #888; border: 1.5px solid #e8e4df; }
  .drawer-cta-ghost:hover { background: #fff5eb; color: #e65100; border-color: #e65100; }

  .drawer-footer-note {
    margin: auto 0 0; padding: 14px 18px;
    font-size: 0.68rem; color: #bbb; text-align: center;
    border-top: 1px solid rgba(0,0,0,0.06); flex-shrink: 0;
  }

  /* ── Responsive breakpoints ── */
  @media (max-width: 1024px) {
    .nav { display: none; }
  }
  @media (max-width: 768px) {
    .search-wrap, .cta-btn { display: none; }
    .hamburger { display: flex; }
  }
  @media (max-width: 480px) {
    .hdr-top-sep, .hdr-top-hide { display: none; }
    .hdr-main { padding: 0 14px; gap: 10px; height: 56px; }
    .logo-sub { display: none; }
    .logo-name { font-size: 1.05rem; }
    .logo-mark { width: 32px; height: 32px; border-radius: 8px; }
  }
  @media (max-width: 360px) {
    .logo-text { display: none; }
  }
`;