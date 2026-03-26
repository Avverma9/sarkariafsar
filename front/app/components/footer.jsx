'use client';
import Link from 'next/link';

const quickLinks = [
  { href: '/jobpost', label: 'Latest Jobs', badge: 'Hot' },
  { href: '/schemes', label: 'Government Schemes' },
  { href: '/blog', label: 'News & Blogs' },
  { href: '/contact', label: 'Contact Us' },
];

const legalLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/disclaimer', label: 'Disclaimer' },
];

const categories = [
  { label: 'SSC', count: '240+' },
  { label: 'UPSC', count: '18+' },
  { label: 'Railway', count: '95+' },
  { label: 'Banking', count: '130+' },
  { label: 'Defence', count: '60+' },
  { label: 'State PSC', count: '310+' },
];

export default function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .ftr {
          font-family: 'DM Sans', sans-serif;
          background: #111;
          color: #fff;
          margin-top: 0;
        }

        /* ── Newsletter strip ── */
        .ftr-nl {
          background: #1a1a1a;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 36px 24px;
        }

        .ftr-nl-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .ftr-nl-text h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .ftr-nl-text p {
          font-size: 0.83rem;
          color: #888;
          margin: 0;
        }

        .ftr-nl-form {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ftr-nl-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          background: #e65100;
          border: 1px solid #e65100;
          border-radius: 9px;
          color: #fff;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          transition: background 0.2s, transform 0.15s, border-color 0.2s;
          white-space: nowrap;
        }

        .ftr-nl-btn-secondary {
          background: transparent;
          border-color: rgba(255,255,255,0.16);
          color: #ddd;
        }

        .ftr-nl-btn:hover { background: #ff6d00; transform: translateY(-1px); }
        .ftr-nl-btn-secondary:hover { background: rgba(255,255,255,0.08); }

        /* ── Main grid ── */
        .ftr-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px 40px;
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
          gap: 48px;
        }

        @media (max-width: 900px) {
          .ftr-body { grid-template-columns: 1fr 1fr; gap: 36px; }
        }

        @media (max-width: 540px) {
          .ftr-body { grid-template-columns: 1fr; }
          .ftr-nl-inner { flex-direction: column; align-items: flex-start; }
        }

        /* Brand col */
        .ftr-brand-mark {
          width: 42px; height: 42px;
          background: #fff;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .ftr-brand-mark::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: #e65100;
        }

        .ftr-brand-sp {
          font-family: 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
          color: #1a1a1a;
        }

        .ftr-brand-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .ftr-brand-name span { color: #e65100; }

        .ftr-brand-desc {
          font-size: 0.82rem;
          color: #777;
          line-height: 1.65;
          margin-bottom: 20px;
          max-width: 240px;
        }

        .ftr-socials {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ftr-social-btn {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          color: #bbb;
          text-decoration: none;
          font-size: 0.8rem;
          transition: background 0.18s, color 0.18s, border-color 0.18s;
        }

        .ftr-social-btn:hover {
          background: rgba(230,81,0,0.12);
          border-color: rgba(230,81,0,0.3);
          color: #fff;
        }

        /* Column headings */
        .ftr-col-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ftr-col-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* Links */
        .ftr-links {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ftr-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          color: #888;
          text-decoration: none;
          transition: color 0.18s, gap 0.18s;
        }

        .ftr-link::before {
          content: '→';
          font-size: 0.72rem;
          color: #444;
          transition: color 0.18s, transform 0.18s;
        }

        .ftr-link:hover { color: #fff; gap: 10px; }
        .ftr-link:hover::before { color: #e65100; transform: translateX(2px); }

        .ftr-link-badge {
          font-size: 0.6rem;
          font-weight: 700;
          background: #e65100;
          color: #fff;
          padding: 1px 6px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Categories */
        .ftr-cat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ftr-cat-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.18s, border-color 0.18s;
          cursor: pointer;
        }

        .ftr-cat-chip:hover {
          background: rgba(230,81,0,0.12);
          border-color: rgba(230,81,0,0.3);
        }

        .ftr-cat-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #ccc;
        }

        .ftr-cat-count {
          font-size: 0.68rem;
          color: #e65100;
          font-weight: 600;
        }

        /* Contact */
        .ftr-contact-item {
          display: flex;
          gap: 10px;
          font-size: 0.84rem;
          color: #888;
          line-height: 1.55;
          margin-bottom: 12px;
        }

        .ftr-contact-icon {
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.05);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .ftr-contact-text { color: #999; }
        .ftr-contact-text a { color: #999; text-decoration: none; transition: color 0.18s; }
        .ftr-contact-text a:hover { color: #e65100; }

        /* Bottom bar */
        .ftr-bottom {
          border-top: 1px solid rgba(255,255,255,0.07);
          background: #0d0d0d;
        }

        .ftr-bottom-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ftr-copy {
          font-size: 0.78rem;
          color: #555;
        }

        .ftr-copy span { color: #e65100; }

        .ftr-bottom-links {
          display: flex;
          gap: 20px;
        }

        .ftr-bottom-link {
          font-size: 0.78rem;
          color: #555;
          text-decoration: none;
          transition: color 0.18s;
        }

        .ftr-bottom-link:hover { color: #fff; }

        .ftr-bottom-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: #555;
        }

        .ftr-bottom-badge span {
          width: 6px; height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: blink-green 2s ease-in-out infinite;
        }

        @keyframes blink-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <footer className="ftr">

        {/* Newsletter Strip */}
        <div className="ftr-nl">
          <div className="ftr-nl-inner">
            <div className="ftr-nl-text">
              <h3>Stay Updated With Verified Job Alerts</h3>
              <p>Use the main category pages or contact the editorial desk for corrections and support.</p>
            </div>
            <div className="ftr-nl-form">
              <Link href="/jobpost" className="ftr-nl-btn">Browse Latest Jobs</Link>
              <Link href="/contact" className="ftr-nl-btn ftr-nl-btn-secondary">Contact Support</Link>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="ftr-body">

          {/* Brand */}
          <div>
            <div className="ftr-brand-mark">
              <span className="ftr-brand-sp">SA</span>
            </div>
            <div className="ftr-brand-name">Sarkari<span>Afsar</span></div>
            <p className="ftr-brand-desc">
              Trusted source for government job alerts, admit cards, results, and welfare schemes across India.
            </p>
            <div className="ftr-socials">
              <Link href="/about" className="ftr-social-btn">About Us</Link>
              <Link href="/contact" className="ftr-social-btn">Support</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="ftr-col-title">Quick Links</div>
            <ul className="ftr-links">
              {quickLinks.map(({ href, label, badge }) => (
                <li key={href}>
                  <Link href={href} className="ftr-link">
                    {label}
                    {badge && <span className="ftr-link-badge">{badge}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="ftr-col-title">Legal & Support</div>
            <ul className="ftr-links">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="ftr-link">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories + Contact */}
          <div>
            <div className="ftr-col-title">Job Categories</div>
            <div className="ftr-cat-grid" style={{ marginBottom: '28px' }}>
              {categories.map(({ label, count }) => (
                <div key={label} className="ftr-cat-chip">
                  <span className="ftr-cat-label">{label}</span>
                  <span className="ftr-cat-count">{count}</span>
                </div>
              ))}
            </div>

            <div className="ftr-col-title">Contact</div>

            <div className="ftr-contact-item">
              <div className="ftr-contact-icon">📍</div>
              <div className="ftr-contact-text">Bakhtiyarpur, Patna, Bihar – 803212</div>
            </div>
            <div className="ftr-contact-item">
              <div className="ftr-contact-icon">📞</div>
              <div className="ftr-contact-text">+91 9153630507</div>
            </div>
            <div className="ftr-contact-item">
              <div className="ftr-contact-icon">✉️</div>
              <div className="ftr-contact-text">
                <a href="mailto:support@sarkariafsar.com">support@sarkariafsar.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="ftr-bottom">
          <div className="ftr-bottom-inner">
            <p className="ftr-copy">
              © {new Date().getFullYear()} <span>SarkariAfsar</span>. All rights reserved. Made with ♥ in India.
            </p>
            <div className="ftr-bottom-links">
              <Link href="/privacy-policy" className="ftr-bottom-link">Privacy</Link>
              <Link href="/terms" className="ftr-bottom-link">Terms</Link>
              <Link href="/disclaimer" className="ftr-bottom-link">Disclaimer</Link>
            </div>
            <div className="ftr-bottom-badge">
              <span />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}